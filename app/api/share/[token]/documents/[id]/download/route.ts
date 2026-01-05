/**
 * Public Export Document Download Route
 *
 * Allows unauthenticated users with a valid share token to download
 * documents that were included in the exported dossier.
 *
 * Security:
 * - Uses service-role to bypass RLS (server-side only)
 * - Validates token format (UUID)
 * - Checks export hasn't expired
 * - Verifies id exists in the export's HTML
 * - Verifies document belongs to export's tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const TOKEN_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractDocIds(indexHtml: string): Set<string> {
    const matches = indexHtml.matchAll(/data-doc-id="([^"]+)"/g);
    const ids = new Set<string>();
    for (const match of matches) {
        if (match[1]) ids.add(match[1]);
    }
    return ids;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string; id: string }> }
) {
    const { token, id } = await params;

    // Validate format
    if (!TOKEN_REGEX.test(token) || !UUID_REGEX.test(id)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Create service client (bypasses RLS)
    let supabase;
    try {
        supabase = createServiceSupabaseClient();
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch export by share token
    const now = new Date().toISOString();
    const { data: exportRecord, error: exportError } = await supabase
        .from('exports')
        .select('tenant_id, index_html, expires_at')
        .eq('share_token', token)
        .gte('expires_at', now)
        .single();

    if (exportError || !exportRecord?.expires_at) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Double-check expiry
    if (new Date(exportRecord.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify document ID exists in export's HTML
    const docIds = extractDocIds(exportRecord.index_html);
    if (!docIds.has(id)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch document (must belong to export's tenant)
    const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('id, storage_key')
        .eq('tenant_id', exportRecord.tenant_id)
        .eq('id', id)
        .single();

    if (docError || !doc?.storage_key) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Generate signed URL (15 minutes)
    const { data: urlData, error: urlError } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(doc.storage_key, 900);

    if (urlError || !urlData?.signedUrl) {
        return NextResponse.json({ error: 'Failed to generate download' }, { status: 500 });
    }

    return NextResponse.redirect(urlData.signedUrl);
}



