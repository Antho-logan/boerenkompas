/**
 * Document Server Actions
 * Handles document CRUD and storage operations
 * 
 * SECURITY/CORRECTNESS:
 * - Delete requires admin role (matching storage policy)
 * - If storage delete fails, DB row is NOT deleted (prevents orphans)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { logAuditEvent } from './audit';
import type { Document, DocumentInsert, DocumentUpdate, DocumentStatus } from '@/lib/supabase/types';

/**
 * Get all documents for the active tenant
 */
export async function getDocuments(): Promise<Document[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching documents:', error);
        throw new Error('Failed to fetch documents');
    }

    return data || [];
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<Document | null> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching document:', error);
        throw new Error('Failed to fetch document');
    }

    return data;
}

/**
 * Create a document record (after file upload)
 */
export async function createDocument(
    input: Omit<DocumentInsert, 'tenant_id'>
): Promise<Document> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('documents')
        .insert({
            ...input,
            tenant_id: tenant.id,
            created_by: user.id,
            updated_by: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating document:', error);
        throw new Error('Failed to create document');
    }

    // Log audit event
    await logAuditEvent({
        action: 'document.created',
        entity_type: 'document',
        entity_id: data.id,
        meta: { title: data.title, file_name: data.file_name, category: data.category },
    });

    revalidatePath('/dashboard/documents');
    return data;
}

/**
 * Update a document
 * 
 * NOTE: Allowed fields are validated at the API route level (mass-assignment protection)
 */
export async function updateDocument(
    id: string,
    updates: DocumentUpdate
): Promise<Document> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('documents')
        .update({
            ...updates,
            updated_by: user.id,
        })
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating document:', error);
        throw new Error('Failed to update document');
    }

    // Log audit event
    await logAuditEvent({
        action: 'document.updated',
        entity_type: 'document',
        entity_id: id,
        meta: { updates },
    });

    revalidatePath('/dashboard/documents');
    return data;
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
    id: string,
    status: DocumentStatus
): Promise<Document> {
    return updateDocument(id, { status });
}

/**
 * Delete a document and its storage file
 * 
 * CORRECTNESS: 
 * - Requires admin role (enforced by RLS)
 * - Storage is deleted FIRST
 * - Only deletes DB row if storage succeeded (prevents orphaned files)
 */
export async function deleteDocument(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // Get document first to get storage key
    const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_key, title')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        throw new Error('Failed to fetch document');
    }

    // Delete from storage FIRST (before DB)
    if (doc?.storage_key) {
        const { error: storageError } = await supabase
            .storage
            .from('documents')
            .remove([doc.storage_key]);

        if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // CORRECTNESS: Do NOT delete DB row if storage delete fails
            // This prevents orphaned files in storage
            throw new Error('Failed to delete file from storage. Please try again or contact support.');
        }
    }

    // Only delete from DB if storage delete succeeded (or no storage key)
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error deleting document:', error);
        // Note: Storage file was already deleted, but this is better than orphaned DB rows
        throw new Error('Failed to delete document record');
    }

    // Log audit event
    await logAuditEvent({
        action: 'document.deleted',
        entity_type: 'document',
        entity_id: id,
        meta: { title: doc?.title },
    });

    revalidatePath('/dashboard/documents');
}

/**
 * Generate a signed URL for downloading a document
 * Returns URL valid for 15 minutes
 */
export async function getDocumentSignedUrl(id: string): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // Get document storage key
    const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_key')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (fetchError || !doc?.storage_key) {
        console.error('Error fetching document for signed URL:', fetchError);
        throw new Error('Document not found');
    }

    // Generate signed URL (15 minutes = 900 seconds)
    const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(doc.storage_key, 900);

    if (error || !data?.signedUrl) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate download URL');
    }

    return data.signedUrl;
}

/**
 * Get documents stats for the active tenant
 */
export async function getDocumentsStats() {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('documents')
        .select('id, status, created_at, size_bytes')
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error fetching document stats:', error);
        return { total: 0, attention: 0, recent: 0, storage: 0 };
    }

    const docs = data || [];
    const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
        total: docs.length,
        attention: docs.filter(d => d.status === 'needs_review' || d.status === 'expired').length,
        recent: docs.filter(d => new Date(d.created_at).getTime() > recentCutoff).length,
        storage: docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0),
    };
}
