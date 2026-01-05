/**
 * Document Activity API Route
 *
 * Returns document-related activity (uploads, downloads, deletes, links)
 * from the audit_log table for the current tenant.
 *
 * Security:
 * - Requires authentication
 * - Scoped to active tenant only
 * - Does not expose PII or file contents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server';
import { getActiveTenantId } from '@/lib/supabase/tenant';

export const runtime = 'nodejs';

// Document-related action types
const DOCUMENT_ACTIONS = [
    'document.created',
    'document.updated',
    'document.deleted',
    'document.downloaded',
    'document.linked',
    'document.unlinked',
    'dev.seed_documents',
];

// Action labels for Dutch UI
const ACTION_LABELS: Record<string, string> = {
    'document.created': 'Geüpload',
    'document.updated': 'Bijgewerkt',
    'document.deleted': 'Verwijderd',
    'document.downloaded': 'Gedownload',
    'document.linked': 'Gekoppeld aan eis',
    'document.unlinked': 'Ontkoppeld van eis',
    'dev.seed_documents': 'Dev: Documenten geseed',
};

// Event type categories for filtering
const EVENT_CATEGORIES: Record<string, string[]> = {
    upload: ['document.created', 'dev.seed_documents'],
    download: ['document.downloaded'],
    delete: ['document.deleted'],
    link: ['document.linked', 'document.unlinked'],
    update: ['document.updated'],
};

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Tenant check
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json(
                { error: 'No active tenant' },
                { status: 400 }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
        const eventType = searchParams.get('type') || ''; // upload, download, delete, link
        const category = searchParams.get('category') || '';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';

        // Build query
        const supabase = await createServerSupabaseClient();
        let query = supabase
            .from('audit_log')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('action', DOCUMENT_ACTIONS)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Event type filter
        if (eventType && EVENT_CATEGORIES[eventType]) {
            query = query.in('action', EVENT_CATEGORIES[eventType]);
        }

        // Date filters
        if (from) {
            query = query.gte('created_at', new Date(from).toISOString());
        }
        if (to) {
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1); // Include the end date
            query = query.lt('created_at', toDate.toISOString());
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error('Error fetching activity:', error);
            return NextResponse.json(
                { error: 'Failed to fetch activity' },
                { status: 500 }
            );
        }

        // Transform for UI
        const activities = (logs || [])
            .filter((log) => {
                // Category filter (if specified)
                if (category && log.meta?.category !== category) {
                    return false;
                }
                return true;
            })
            .map((log) => ({
                id: log.id,
                timestamp: log.created_at,
                action: log.action,
                label: ACTION_LABELS[log.action] || log.action,
                entityType: log.entity_type || 'document',
                entityId: log.entity_id || null,
                documentTitle: log.meta?.title || log.meta?.documentTitle || null,
                documentId: log.entity_id || log.meta?.documentId || null,
                category: log.meta?.category || null,
                actorName: log.meta?.actorName || null,
                meta: {
                    // Only expose safe fields
                    count: log.meta?.count,
                    requirementTitle: log.meta?.requirementTitle,
                },
            }));

        return NextResponse.json({
            activities,
            total: activities.length,
            filters: {
                type: eventType || null,
                category: category || null,
                from: from || null,
                to: to || null,
            },
        });
    } catch (error) {
        console.error('Activity API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}



