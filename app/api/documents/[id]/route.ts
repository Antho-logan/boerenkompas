/**
 * Document Update/Delete API Route
 * 
 * SECURITY: 
 * - PATCH has strict allowlist for updatable fields (mass-assignment protection)
 * - DELETE requires admin role (aligned with storage policy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateDocument, deleteDocument, getDocument } from '@/lib/supabase/actions/documents';
import type { DocumentUpdate } from '@/lib/supabase/types';

// Allowlist of fields that can be updated via PATCH
const ALLOWED_UPDATE_FIELDS: (keyof DocumentUpdate)[] = [
    'title',
    'status',
    'category',
    'tags',
    'doc_date',
    'expires_at',
    'summary',
];

// Fields that are NEVER allowed to be updated (security-sensitive)
const FORBIDDEN_FIELDS = [
    'id',
    'tenant_id',
    'storage_key',
    'file_name',
    'mime_type',
    'size_bytes',
    'created_at',
    'created_by',
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const document = await getDocument(id);

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // SECURITY: Check for forbidden fields
        const forbiddenFound = FORBIDDEN_FIELDS.filter(f => f in body);
        if (forbiddenFound.length > 0) {
            return NextResponse.json(
                {
                    error: 'Forbidden fields in request',
                    fields: forbiddenFound,
                    message: `Cannot update: ${forbiddenFound.join(', ')}`
                },
                { status: 400 }
            );
        }

        // SECURITY: Only allow allowlisted fields
        const sanitized: DocumentUpdate = {};
        for (const key of ALLOWED_UPDATE_FIELDS) {
            if (key in body) {
                (sanitized as Record<string, unknown>)[key] = body[key];
            }
        }

        // Check if there are any valid updates
        if (Object.keys(sanitized).length === 0) {
            return NextResponse.json(
                {
                    error: 'No valid fields to update',
                    allowed: ALLOWED_UPDATE_FIELDS
                },
                { status: 400 }
            );
        }

        const document = await updateDocument(id, sanitized);

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Error updating document:', error);
        return NextResponse.json(
            { error: 'Failed to update document' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Note: deleteDocument already requires admin role via RLS
        // If storage delete fails, we keep the DB row to avoid orphans
        await deleteDocument(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
