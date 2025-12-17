-- ============================================================================
-- BoerenKompas MVP: Complete Database Schema
-- ============================================================================
-- Version: 1.0.0
-- Description: Full schema with multi-tenant RLS, storage policies, and seed data
-- 
-- DISCLAIMER: BoerenKompas is a dossier-workflow tool. This schema supports
-- document management workflows but does not guarantee compliance or inspection 
-- readiness. Users remain responsible for their own regulatory compliance.
-- ============================================================================

-- ============================================================================
-- PART 1: HELPER FUNCTIONS
-- ============================================================================

-- Check if current user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
  );
$$;

-- Get the role of the current user for a tenant
CREATE OR REPLACE FUNCTION public.tenant_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.tenant_members
  WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user has owner/advisor role for a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'advisor')
  );
$$;

-- ============================================================================
-- PART 2: CORE TABLES
-- ============================================================================

-- Tenants (Organizations/Farms)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Tenant Members (Multi-tenant access)
CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'advisor', 'staff')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);

-- Tenant Profile (Business details - Top 20 fields)
CREATE TABLE IF NOT EXISTS public.tenant_profile (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  farm_type text,
  legal_entity_type text,
  province text,
  municipality text,
  primary_contact text,
  advisor_contact text,
  locations_count int,
  hectares_total numeric,
  hectares_owned numeric,
  hectares_leased numeric,
  parcels_reference text,
  livestock_categories_present jsonb DEFAULT '{}',
  livestock_scale_band text,
  manure_storage_present boolean,
  manure_storage_type text,
  manure_processing_or_export boolean,
  glb_cap_participation boolean,
  bank_involved boolean,
  bank_name text,
  last_inspection_date date,
  permit_status_confidence text CHECK (permit_status_confidence IN ('stable', 'uncertain', 'in_process')),
  priority_mode text CHECK (priority_mode IN ('inspection_ready', 'financing_ready', 'subsidy_ready')),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  storage_key text NOT NULL,
  category text NOT NULL DEFAULT 'onbekend',
  status text CHECK (status IN ('ok', 'needs_review', 'expired', 'missing')) DEFAULT 'needs_review',
  doc_date date,
  expires_at date,
  tags text[] DEFAULT '{}',
  summary text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- Dossier Templates (predefined document requirement sets)
CREATE TABLE IF NOT EXISTS public.dossier_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Dossier Requirements (individual requirements within templates)
CREATE TABLE IF NOT EXISTS public.dossier_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.dossier_templates(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  recency_days int,
  required boolean DEFAULT true,
  notes text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (template_id, code)
);

CREATE INDEX IF NOT EXISTS idx_dossier_requirements_template_id ON public.dossier_requirements(template_id);

-- Document Links (link documents to requirements)
CREATE TABLE IF NOT EXISTS public.document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  requirement_id uuid NOT NULL REFERENCES public.dossier_requirements(id) ON DELETE CASCADE,
  status_override text CHECK (status_override IN ('satisfied', 'not_sure', 'rejected')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_document_links_tenant_id ON public.document_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_links_requirement_id ON public.document_links(requirement_id);
CREATE INDEX IF NOT EXISTS idx_document_links_document_id ON public.document_links(document_id);

-- Tasks (from missing items or manual)
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source text CHECK (source IN ('missing_item', 'manual')) DEFAULT 'manual',
  requirement_id uuid REFERENCES public.dossier_requirements(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_at timestamptz,
  status text CHECK (status IN ('open', 'done', 'snoozed')) DEFAULT 'open',
  priority text CHECK (priority IN ('low', 'normal', 'urgent')) DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at);

-- Exports (generated dossier exports)
CREATE TABLE IF NOT EXISTS public.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.dossier_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  index_html text NOT NULL,
  share_token text UNIQUE,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_exports_tenant_id ON public.exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_share_token ON public.exports(share_token);

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================================
-- PART 3: TRIGGERS
-- ============================================================================

-- Auto-update updated_at on documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tenant_profile_updated_at
  BEFORE UPDATE ON public.tenant_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create tenant_profile when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tenant_profile (tenant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_tenant_profile_trigger
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_profile();

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Tenants: Select if member, Insert for authenticated (becomes owner)
CREATE POLICY "tenants_select_member" ON public.tenants
  FOR SELECT USING (public.is_tenant_member(id));

CREATE POLICY "tenants_insert_authenticated" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Tenant Members: Select if same tenant member
CREATE POLICY "tenant_members_select" ON public.tenant_members
  FOR SELECT USING (public.is_tenant_member(tenant_id));

-- Tenant Members: Insert/Update/Delete only by owner
CREATE POLICY "tenant_members_insert" ON public.tenant_members
  FOR INSERT WITH CHECK (
    -- Allow inserting yourself as owner when creating a new tenant
    (user_id = auth.uid() AND role = 'owner')
    OR public.tenant_role(tenant_id) = 'owner'
  );

CREATE POLICY "tenant_members_update" ON public.tenant_members
  FOR UPDATE USING (public.tenant_role(tenant_id) = 'owner');

CREATE POLICY "tenant_members_delete" ON public.tenant_members
  FOR DELETE USING (public.tenant_role(tenant_id) = 'owner');

-- Tenant Profile: Select if member, Update only owner/advisor
CREATE POLICY "tenant_profile_select" ON public.tenant_profile
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "tenant_profile_update" ON public.tenant_profile
  FOR UPDATE USING (public.is_tenant_admin(tenant_id));

-- Documents: Full CRUD for members
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (public.is_tenant_member(tenant_id));

-- Dossier Templates: Public read (templates are shared)
CREATE POLICY "dossier_templates_select" ON public.dossier_templates
  FOR SELECT USING (true);

-- Dossier Requirements: Public read
CREATE POLICY "dossier_requirements_select" ON public.dossier_requirements
  FOR SELECT USING (true);

-- Document Links: Select for members, Insert/Update/Delete for admins
CREATE POLICY "document_links_select" ON public.document_links
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "document_links_insert" ON public.document_links
  FOR INSERT WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "document_links_update" ON public.document_links
  FOR UPDATE USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "document_links_delete" ON public.document_links
  FOR DELETE USING (public.is_tenant_admin(tenant_id));

-- Tasks: Select for members, Insert only admins, Update allowed for all members
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (public.is_tenant_member(tenant_id));

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (public.is_tenant_admin(tenant_id));

-- Exports: Select for members, Insert/Update/Delete for admins
CREATE POLICY "exports_select" ON public.exports
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "exports_insert" ON public.exports
  FOR INSERT WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "exports_update" ON public.exports
  FOR UPDATE USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "exports_delete" ON public.exports
  FOR DELETE USING (public.is_tenant_admin(tenant_id));

-- Audit Log: Select for members, Insert for authenticated (server sets tenant_id)
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND public.is_tenant_member(tenant_id)
  );

-- ============================================================================
-- PART 5: STORAGE BUCKET
-- ============================================================================

-- Create the documents bucket (run in Supabase dashboard or via API)
-- Note: This needs to be executed via Supabase Storage API or dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', false);

-- Storage Policies (tenant-scoped access)
-- Path format: {tenant_id}/documents/{doc_id}/{filename}

-- Note: Storage policies need to be created via Supabase dashboard or API
-- These are the policy definitions to apply:

-- SELECT Policy (download) - members can download their tenant's files
-- CREATE POLICY "documents_download" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'documents' 
--     AND public.is_tenant_member((storage.foldername(name))[1]::uuid)
--   );

-- INSERT Policy (upload) - members can upload to their tenant's folder
-- CREATE POLICY "documents_upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'documents' 
--     AND public.is_tenant_member((storage.foldername(name))[1]::uuid)
--   );

-- UPDATE Policy - members can update their tenant's files
-- CREATE POLICY "documents_update" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'documents' 
--     AND public.is_tenant_member((storage.foldername(name))[1]::uuid)
--   );

-- DELETE Policy - admins can delete their tenant's files
-- CREATE POLICY "documents_delete" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'documents' 
--     AND public.is_tenant_admin((storage.foldername(name))[1]::uuid)
--   );

-- ============================================================================
-- PART 6: SEED DATA - DOSSIER TEMPLATES
-- ============================================================================

-- Inspectie Basis Template
INSERT INTO public.dossier_templates (id, name, version, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Inspectie Basis', '2024.1', true)
ON CONFLICT DO NOTHING;

-- Bank/Financiering Template
INSERT INTO public.dossier_templates (id, name, version, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'Bank & Financiering', '2024.1', true)
ON CONFLICT DO NOTHING;

-- GLB Subsidie Template
INSERT INTO public.dossier_templates (id, name, version, is_active)
VALUES ('00000000-0000-0000-0000-000000000003', 'GLB Subsidie', '2024.1', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 7: SEED DATA - INSPECTIE BASIS REQUIREMENTS
-- ============================================================================

INSERT INTO public.dossier_requirements (template_id, code, title, category, recency_days, required, notes, sort_order)
VALUES 
  -- Bedrijfsgegevens (Business Details)
  ('00000000-0000-0000-0000-000000000001', 'BG-001', 'KvK-uittreksel', 'Bedrijfsgegevens', 365, true, 'Maximaal 1 jaar oud', 1),
  ('00000000-0000-0000-0000-000000000001', 'BG-002', 'Identiteitsbewijs eigenaar/exploitant', 'Bedrijfsgegevens', null, true, null, 2),
  ('00000000-0000-0000-0000-000000000001', 'BG-003', 'UBN-nummer registratie', 'Bedrijfsgegevens', null, true, 'Uniek Bedrijfsnummer', 3),
  ('00000000-0000-0000-0000-000000000001', 'BG-004', 'Relatienummer RVO', 'Bedrijfsgegevens', null, true, null, 4),

  -- Percelen & Grond (Parcels & Land)
  ('00000000-0000-0000-0000-000000000001', 'PG-001', 'Kadastrale overzicht', 'Percelen & Grond', 365, true, null, 10),
  ('00000000-0000-0000-0000-000000000001', 'PG-002', 'Pachtovereenkomsten', 'Percelen & Grond', null, false, 'Indien van toepassing', 11),
  ('00000000-0000-0000-0000-000000000001', 'PG-003', 'Gebruiksovereenkomsten', 'Percelen & Grond', null, false, 'Indien van toepassing', 12),
  ('00000000-0000-0000-0000-000000000001', 'PG-004', 'Perceelregistratie RVO', 'Percelen & Grond', 365, true, 'Actuele opgave', 13),

  -- Mest & Mineralen (Manure & Minerals)
  ('00000000-0000-0000-0000-000000000001', 'MM-001', 'Mestboekhouding lopend jaar', 'Mest & Mineralen', 365, true, null, 20),
  ('00000000-0000-0000-0000-000000000001', 'MM-002', 'Mestafzetovereenkomsten', 'Mest & Mineralen', 365, true, 'VDM/rVDM overeenkomsten', 21),
  ('00000000-0000-0000-0000-000000000001', 'MM-003', 'Mestopslagcapaciteit berekening', 'Mest & Mineralen', null, true, null, 22),
  ('00000000-0000-0000-0000-000000000001', 'MM-004', 'Kunstmest aankoopbonnen', 'Mest & Mineralen', 365, true, null, 23),
  ('00000000-0000-0000-0000-000000000001', 'MM-005', 'Grondmonsters (N, P, K)', 'Mest & Mineralen', 1460, true, 'Max 4 jaar oud', 24),

  -- Vergunningen (Permits)
  ('00000000-0000-0000-0000-000000000001', 'VG-001', 'Omgevingsvergunning(en)', 'Vergunningen', null, true, null, 30),
  ('00000000-0000-0000-0000-000000000001', 'VG-002', 'Natuurbeschermingswet vergunning', 'Vergunningen', null, false, 'Nb-wet / PAS meldingen indien van toepassing', 31),
  ('00000000-0000-0000-0000-000000000001', 'VG-003', 'Watervergunning', 'Vergunningen', null, false, 'Indien van toepassing', 32),
  ('00000000-0000-0000-0000-000000000001', 'VG-004', 'Meldingen Activiteitenbesluit', 'Vergunningen', null, false, null, 33),

  -- Dierenwelzijn (Animal Welfare)
  ('00000000-0000-0000-0000-000000000001', 'DW-001', 'I&R registratie overzicht', 'Dierenwelzijn', 30, true, 'Actueel binnen 30 dagen', 40),
  ('00000000-0000-0000-0000-000000000001', 'DW-002', 'Dierenarts logboek', 'Dierenwelzijn', 365, true, 'Behandelingen en vaccinaties', 41),
  ('00000000-0000-0000-0000-000000000001', 'DW-003', 'Voerregistratie', 'Dierenwelzijn', 365, false, null, 42),
  ('00000000-0000-0000-0000-000000000001', 'DW-004', 'Stalregistraties', 'Dierenwelzijn', 365, false, 'Huisvesting en capaciteit', 43),

  -- Financieel (Financial)
  ('00000000-0000-0000-0000-000000000001', 'FI-001', 'Jaarrekening vorig jaar', 'Financieel', 365, false, null, 50),
  ('00000000-0000-0000-0000-000000000001', 'FI-002', 'BTW-aangiftes', 'Financieel', 365, false, null, 51),
  ('00000000-0000-0000-0000-000000000001', 'FI-003', 'Verzekeringspolis bedrijf', 'Financieel', 365, false, null, 52)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 8: SEED DATA - BANK & FINANCIERING REQUIREMENTS
-- ============================================================================

INSERT INTO public.dossier_requirements (template_id, code, title, category, recency_days, required, notes, sort_order)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'BF-001', 'KvK-uittreksel', 'Bedrijfsgegevens', 90, true, 'Max 3 maanden oud voor bank', 1),
  ('00000000-0000-0000-0000-000000000002', 'BF-002', 'Jaarrekening laatste 3 jaar', 'Financieel', 365, true, null, 2),
  ('00000000-0000-0000-0000-000000000002', 'BF-003', 'Tussentijdse cijfers', 'Financieel', 90, true, 'Recente kwartaalcijfers', 3),
  ('00000000-0000-0000-0000-000000000002', 'BF-004', 'Investeringsbegroting', 'Financieel', null, true, null, 4),
  ('00000000-0000-0000-0000-000000000002', 'BF-005', 'Offertes investeringen', 'Financieel', null, true, null, 5),
  ('00000000-0000-0000-0000-000000000002', 'BF-006', 'Bedrijfsplan/ondernemingsplan', 'Bedrijfsgegevens', null, true, null, 6),
  ('00000000-0000-0000-0000-000000000002', 'BF-007', 'Taxatierapport onroerend goed', 'Zekerheden', 365, true, null, 7),
  ('00000000-0000-0000-0000-000000000002', 'BF-008', 'Eigendomsbewijzen', 'Zekerheden', null, true, null, 8),
  ('00000000-0000-0000-0000-000000000002', 'BF-009', 'Bestaande kredietovereenkomsten', 'Financieel', null, true, null, 9),
  ('00000000-0000-0000-0000-000000000002', 'BF-010', 'Vergunningen overzicht', 'Vergunningen', null, true, 'Alle relevante vergunningen', 10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 9: SEED DATA - GLB SUBSIDIE REQUIREMENTS
-- ============================================================================

INSERT INTO public.dossier_requirements (template_id, code, title, category, recency_days, required, notes, sort_order)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'GLB-001', 'Gecombineerde Opgave bewijs', 'GLB', 365, true, 'Ingediend bij RVO', 1),
  ('00000000-0000-0000-0000-000000000003', 'GLB-002', 'Perceelregistratie RVO', 'Percelen', 365, true, 'Actuele perceelkaart', 2),
  ('00000000-0000-0000-0000-000000000003', 'GLB-003', 'Eco-activiteiten bewijs', 'GLB', 365, false, 'Indien eco-regeling', 3),
  ('00000000-0000-0000-0000-000000000003', 'GLB-004', 'Conditionaliteit naleving', 'GLB', 365, true, 'GLMC-normen', 4),
  ('00000000-0000-0000-0000-000000000003', 'GLB-005', 'Fosfaatrechten overzicht', 'Mest & Mineralen', 365, false, 'Indien melkveehouder', 5),
  ('00000000-0000-0000-0000-000000000003', 'GLB-006', 'Betalingsrechten overzicht', 'GLB', 365, true, null, 6),
  ('00000000-0000-0000-0000-000000000003', 'GLB-007', 'Landschapselementen kaart', 'Percelen', 365, false, 'Indien van toepassing', 7),
  ('00000000-0000-0000-0000-000000000003', 'GLB-008', 'Gewasnotificatie bewijs', 'Percelen', 365, true, null, 8)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================
