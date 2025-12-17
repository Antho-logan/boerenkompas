-- ============================================================================
-- BoerenKompas: Storage Bucket Setup
-- ============================================================================
-- Run this AFTER the main migration
-- Execute via Supabase Dashboard > SQL Editor
-- ============================================================================

-- Create the documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit per file
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies
-- Path format: {tenant_id}/documents/{doc_id}/{filename}
-- ============================================================================

-- Helper function to extract tenant_id from path
CREATE OR REPLACE FUNCTION storage.get_tenant_id_from_path(path text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (string_to_array(path, '/'))[1]::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- SELECT Policy (download) - members can download their tenant's files
CREATE POLICY "documents_download" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND public.is_tenant_member(storage.get_tenant_id_from_path(name))
  );

-- INSERT Policy (upload) - members can upload to their tenant's folder
CREATE POLICY "documents_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND public.is_tenant_member(storage.get_tenant_id_from_path(name))
  );

-- UPDATE Policy - members can update their tenant's files
CREATE POLICY "documents_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documents' 
    AND public.is_tenant_member(storage.get_tenant_id_from_path(name))
  );

-- DELETE Policy - admins can delete their tenant's files
CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' 
    AND public.is_tenant_admin(storage.get_tenant_id_from_path(name))
  );

-- ============================================================================
-- DONE
-- ============================================================================
