/**
 * Document Download Route Handler
 * Generates signed URL and redirects to it
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDocumentSignedUrl } from '@/lib/supabase/actions/documents';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const signedUrl = await getDocumentSignedUrl(id);

        // Redirect to signed URL
        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error('Download error:', error);

        if (error instanceof Error) {
            if (error.message === 'Authentication required') {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }
            if (error.message === 'Document not found') {
                return NextResponse.json(
                    { error: 'Document not found' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Download failed' },
            { status: 500 }
        );
    }
}
