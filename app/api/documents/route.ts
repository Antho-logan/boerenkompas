/**
 * Documents List API Route
 * Returns documents for the active tenant
 */

import { NextResponse } from 'next/server';
import { getDocuments, getDocumentsStats } from '@/lib/supabase/actions/documents';

export async function GET() {
    try {
        const [documents, stats] = await Promise.all([
            getDocuments(),
            getDocumentsStats(),
        ]);

        return NextResponse.json({
            documents,
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
