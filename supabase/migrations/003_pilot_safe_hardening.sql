-- ============================================================================
-- BoerenKompas: Pilot-Safe Hardening Migration
-- ============================================================================
-- Version: 1.1.0
-- Description: Security hardening for paid pilots
--   A) Fix RLS privilege escalation on tenant_members INSERT
--   B) Add user_settings table for server-authoritative active tenant
--   H) Add uniqueness constraints to prevent duplicates
--   I) Restrict document delete to admins (align with storage)
--   J) Audit log integrity (enforce actor_user_id = auth.uid())
-- ============================================================================

-- ============================================================================
-- PART A: FIX TENANT_MEMBERS INSERT POLICY
-- ============================================================================
-- Problem: Current policy allows self-claiming arbitrary tenant_id:
--   (user_id = auth.uid() AND role = 'owner') OR tenant_role(tenant_id) = 'owner'
-- 
-- Solution: Use RPC for first tenant creation (owner self-insert allowed ONLY
-- when tenant was JUST created by the same user in the same transaction).
-- For adding members to existing tenants, only owners can do it.
-- ============================================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "tenant_members_insert" ON public.tenant_members;

-- Create a SECURITY DEFINER function for safe tenant+owner creation
-- This is the ONLY safe path for creating a new tenant with owner membership
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Tenant name must be at least 2 characters';
  END IF;

  -- Create tenant
  INSERT INTO public.tenants (name, created_by)
  VALUES (trim(p_name), v_user_id)
  RETURNING id INTO v_tenant_id;

  -- Add user as owner (bypasses RLS since SECURITY DEFINER)
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'owner');

  -- Create tenant profile
  INSERT INTO public.tenant_profile (tenant_id)
  VALUES (v_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN v_tenant_id;
END;
$$;

-- New secure INSERT policy: only existing owners/advisors can add members
-- (first tenant creation MUST use create_tenant_with_owner RPC)
CREATE POLICY "tenant_members_insert_by_admin" ON public.tenant_members
  FOR INSERT WITH CHECK (
    -- Must be an existing owner/advisor of the tenant to add members
    public.is_tenant_admin(tenant_id)
    -- Cannot add yourself (prevents self-elevation)
    AND user_id != auth.uid()
  );

-- ============================================================================
-- PART B: SERVER-AUTHORITATIVE ACTIVE TENANT (user_settings table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own settings
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_delete_own" ON public.user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Function to safely switch active tenant (validates membership)
CREATE OR REPLACE FUNCTION public.set_active_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user is member of the tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this tenant';
  END IF;

  -- Upsert user_settings
  INSERT INTO public.user_settings (user_id, active_tenant_id)
  VALUES (v_user_id, p_tenant_id)
  ON CONFLICT (user_id) DO UPDATE
  SET active_tenant_id = p_tenant_id, updated_at = now();

  RETURN true;
END;
$$;

-- Function to get current user's active tenant (with fallback)
CREATE OR REPLACE FUNCTION public.get_active_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_active_tenant_id uuid;
  v_first_tenant_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get stored active tenant
  SELECT active_tenant_id INTO v_active_tenant_id
  FROM public.user_settings
  WHERE user_id = v_user_id;

  -- Verify it's still valid (user still a member)
  IF v_active_tenant_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = v_active_tenant_id AND user_id = v_user_id
  ) THEN
    RETURN v_active_tenant_id;
  END IF;

  -- Fallback to first tenant user is member of
  SELECT tenant_id INTO v_first_tenant_id
  FROM public.tenant_members
  WHERE user_id = v_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Auto-set if found
  IF v_first_tenant_id IS NOT NULL THEN
    INSERT INTO public.user_settings (user_id, active_tenant_id)
    VALUES (v_user_id, v_first_tenant_id)
    ON CONFLICT (user_id) DO UPDATE
    SET active_tenant_id = v_first_tenant_id, updated_at = now();
  END IF;

  RETURN v_first_tenant_id;
END;
$$;

-- ============================================================================
-- PART H: UNIQUENESS CONSTRAINTS TO PREVENT DUPLICATES
-- ============================================================================

-- document_links: one link per (tenant_id, requirement_id)
-- Using CREATE INDEX IF NOT EXISTS since UNIQUE constraint might fail if duplicates exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'document_links_tenant_requirement_unique'
  ) THEN
    -- First, remove duplicates if any exist (keep the newest)
    DELETE FROM public.document_links a
    USING public.document_links b
    WHERE a.tenant_id = b.tenant_id
      AND a.requirement_id = b.requirement_id
      AND a.created_at < b.created_at;
    
    -- Then add the constraint
    ALTER TABLE public.document_links
    ADD CONSTRAINT document_links_tenant_requirement_unique 
    UNIQUE (tenant_id, requirement_id);
  END IF;
END;
$$;

-- tasks: one missing_item task per (tenant_id, requirement_id)
-- Partial unique index for source='missing_item' only
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_missing_item_unique
  ON public.tasks (tenant_id, requirement_id)
  WHERE source = 'missing_item' AND requirement_id IS NOT NULL;

-- Add updated_at column and trigger to tasks if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END;
$$;

CREATE OR REPLACE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART I: ALIGN DELETE PERMISSIONS (documents admin-only)
-- ============================================================================

-- Drop existing permissive delete policy
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

-- New policy: only admins (owner/advisor) can delete documents
CREATE POLICY "documents_delete_admin" ON public.documents
  FOR DELETE USING (public.is_tenant_admin(tenant_id));

-- ============================================================================
-- PART J: AUDIT LOG INTEGRITY
-- ============================================================================

-- Set default for actor_user_id to auth.uid()
ALTER TABLE public.audit_log 
  ALTER COLUMN actor_user_id SET DEFAULT auth.uid();

-- Add check constraint to ensure actor_user_id matches auth.uid() on insert
-- Note: We use RLS WITH CHECK instead since check constraints can't reference functions
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

CREATE POLICY "audit_log_insert_secure" ON public.audit_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND public.is_tenant_member(tenant_id)
    AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
  );

-- ============================================================================
-- DONE
-- ============================================================================
