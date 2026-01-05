/**
 * Documents List API Route
 * Returns documents for the active tenant
 */

import { NextResponse } from 'next/server';
import { getDocuments, getDocumentsStats } from '@/lib/supabase/actions/documents';
import type { Document } from '@/lib/supabase/types';

const sanitizeDocument = (doc: Document) => {
    const safe = { ...doc } as Record<string, unknown>;
    delete safe.storage_key;
    delete safe.tenant_id;
    delete safe.created_by;
    delete safe.updated_by;
    return safe as Omit<Document, "storage_key" | "tenant_id" | "created_by" | "updated_by">;
};

export async function GET() {
    try {
        const [documents, stats] = await Promise.all([
            getDocuments(),
            getDocumentsStats(),
        ]);

        return NextResponse.json({
            documents: documents.map(sanitizeDocument),
            stats,
        });
    } catch (error) {
        console.error('Error fetching documents:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
