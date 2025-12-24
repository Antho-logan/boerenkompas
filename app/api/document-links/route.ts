/**
 * Document Links API Route
 * Handles linking/unlinking documents to dossier requirements
 * 
 * GET    /api/document-links              - List all links for tenant
 * POST   /api/document-links              - Link/update a document to a requirement  
 * PATCH  /api/document-links              - Replace/update link (same as POST, explicit)
 * DELETE /api/document-links?requirementId=X - Unlink document from requirement
 * 
 * SECURITY: All operations are tenant-scoped via server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    linkDocumentToRequirement, 
    unlinkDocumentFromRequirement, 
    getDocumentLinks 
} from '@/lib/supabase/actions/dossier';
import { handleApiError, requireAuth } from '@/lib/supabase/guards';

async function requireAdmin() {
    const auth = await requireAuth({ requireRole: 'admin' });
    if (auth instanceof NextResponse) return auth;
    return null;
}

export async function GET() {
    try {
        const links = await getDocumentLinks();
        return NextResponse.json({ links });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth) return auth;

        const body = await request.json();
        const { requirement_id, document_id, status_override } = body;

        if (!requirement_id) {
            return NextResponse.json(
                { error: 'requirement_id is required', code: 'MISSING_REQUIREMENT_ID' },
                { status: 400 }
            );
        }

        const link = await linkDocumentToRequirement({
            requirement_id,
            document_id: document_id || null,
            status_override: status_override || null,
        });

        return NextResponse.json({ 
            link,
            success: true,
            message: document_id ? 'Document gekoppeld' : 'Status bijgewerkt'
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PATCH - Replace/update a document link
 * Body: { requirement_id, document_id?, status_override? }
 */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth) return auth;

        const body = await request.json();
        const { requirement_id, document_id, status_override } = body;

        if (!requirement_id) {
            return NextResponse.json(
                { error: 'requirement_id is required', code: 'MISSING_REQUIREMENT_ID' },
                { status: 400 }
            );
        }

        // If document_id is provided, update the link
        // If document_id is null/undefined and status_override is provided, update override only
        const link = await linkDocumentToRequirement({
            requirement_id,
            document_id: document_id ?? undefined,
            status_override: status_override ?? undefined,
        });

        return NextResponse.json({ 
            link,
            success: true,
            message: 'Document link bijgewerkt'
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE - Unlink a document from a requirement
 * Query params: ?requirementId=X (preferred) or ?id=X (legacy, by link ID)
 */
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth) return auth;

        const { searchParams } = new URL(request.url);
        const requirementId = searchParams.get('requirementId');
        const linkId = searchParams.get('id'); // Legacy support

        if (!requirementId && !linkId) {
            return NextResponse.json(
                { error: 'requirementId or id is required', code: 'MISSING_ID' },
                { status: 400 }
            );
        }

        // Prefer unlinking by requirement ID (cleaner for UI)
        if (requirementId) {
            const result = await unlinkDocumentFromRequirement(requirementId);
            return NextResponse.json({ 
                success: true,
                requirementId: result.requirementId,
                deleted: result.deleted,
                message: result.deleted ? 'Document ontkoppeld' : 'Geen link gevonden'
            });
        }

        // Legacy: delete by link ID
        const { removeDocumentLink } = await import('@/lib/supabase/actions/dossier');
        await removeDocumentLink(linkId!);
        return NextResponse.json({ 
            success: true,
            message: 'Document link verwijderd'
        });
    } catch (error) {
        return handleApiError(error);
    }
}
