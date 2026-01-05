/**
 * Development Seed API Route
 * 
 * Creates/removes pilot test data for end-to-end testing.
 * 
 * SECURITY:
 * ─────────────────────────────────────────────────────────────────
 * 1. Only available in development (NODE_ENV !== 'production')
 * 2. Requires authentication (user must be logged in)
 * 3. Requires DEV_SEED_SECRET header OR admin role
 * 4. Uses service role to bypass RLS (server-only)
 * ─────────────────────────────────────────────────────────────────
 * 
 * ENDPOINTS:
 * 
 * POST /api/dev/seed
 *   - Creates pilot tenant and links current user as owner
 *   - Idempotent: safe to call multiple times
 *   - Header: X-DEV-SEED-SECRET (required unless user is owner/advisor)
 *   - Returns: { success, tenantId, tenantName, counts, errors, expectedKpis }
 * 
 * DELETE /api/dev/seed
 *   - Removes all pilot seed data
 *   - Body: { confirm: true }
 *   - Header: X-DEV-SEED-SECRET (required unless user is owner/advisor)
 *   - Returns: { success, deleted, errors }
 * 
 * GET /api/dev/seed
 *   - Returns current state: whether pilot tenant exists, counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { 
    createPilotSeedData, 
    removePilotSeedData, 
    PILOT_IDS,
    EXPECTED_KPIS 
} from '@/lib/dev/seed-data';

// ─────────────────────────────────────────────────────────────────
// SECURITY GUARDS
// ─────────────────────────────────────────────────────────────────

function isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === 'production';
}

const DEV_SEED_HEADER = 'x-dev-seed-secret';

function verifySecret(providedSecret?: string): boolean {
    const envSecret = process.env.DEV_SEED_SECRET;
    if (!envSecret) return false;
    return providedSecret === envSecret;
}

function devGuardResponse(): NextResponse | null {
    if (isProductionEnvironment()) {
        return NextResponse.json(
            { 
                error: 'Development seed endpoint is disabled in production',
                code: 'PRODUCTION_BLOCKED'
            },
            { status: 403 }
        );
    }
    if (!process.env.DEV_SEED_SECRET) {
        return NextResponse.json(
            {
                error: 'DEV_SEED_SECRET is required for dev seed endpoints',
                code: 'MISSING_DEV_SEED_SECRET',
            },
            { status: 403 }
        );
    }
    return null;
}

async function requireDevSeedAccess(request: NextRequest) {
    const blocked = devGuardResponse();
    if (blocked) return blocked;

    try {
        const user = await requireUser();
        const headerSecret = request.headers.get(DEV_SEED_HEADER) || undefined;

        if (verifySecret(headerSecret)) {
            return { userId: user.id };
        }

        const supabase = await createServerSupabaseClient();
        const { data: membership } = await supabase
            .from('tenant_members')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['owner', 'advisor'])
            .limit(1);

        if (membership && membership.length > 0) {
            return { userId: user.id };
        }

        return NextResponse.json(
            { error: 'Invalid dev seed credentials', code: 'INVALID_SECRET' },
            { status: 403 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────
// GET - Check pilot status
// ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const access = await requireDevSeedAccess(request);
    if (access instanceof NextResponse) return access;

    try {
        const supabase = createServiceSupabaseClient();

        // Check if pilot tenant exists
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, name, created_at')
            .eq('id', PILOT_IDS.tenant)
            .single();

        if (!tenant) {
            return NextResponse.json({
                exists: false,
                pilotTenantId: PILOT_IDS.tenant,
                message: 'Pilot tenant does not exist. Use POST to create.',
            });
        }

        // Get counts
        const [docs, tasks, exports, links] = await Promise.all([
            supabase.from('documents').select('id', { count: 'exact', head: true }).eq('tenant_id', PILOT_IDS.tenant),
            supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('tenant_id', PILOT_IDS.tenant),
            supabase.from('exports').select('id', { count: 'exact', head: true }).eq('tenant_id', PILOT_IDS.tenant),
            supabase.from('document_links').select('id', { count: 'exact', head: true }).eq('tenant_id', PILOT_IDS.tenant),
        ]);

        return NextResponse.json({
            exists: true,
            pilotTenantId: PILOT_IDS.tenant,
            pilotTenantName: tenant.name,
            createdAt: tenant.created_at,
            counts: {
                documents: docs.count ?? 0,
                tasks: tasks.count ?? 0,
                exports: exports.count ?? 0,
                documentLinks: links.count ?? 0,
            },
            expectedKpis: EXPECTED_KPIS,
            actions: {
                refresh: 'POST /api/dev/seed (re-seeds data)',
                remove: 'DELETE /api/dev/seed (removes all pilot data)',
            },
        });

    } catch (error) {
        console.error('Error checking pilot status:', error);
        return NextResponse.json(
            { error: 'Failed to check pilot status' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────
// POST - Create pilot seed data
// ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const access = await requireDevSeedAccess(request);
    if (access instanceof NextResponse) return access;

    try {
        // Create seed data
        const supabase = createServiceSupabaseClient();
        const result = await createPilotSeedData(supabase, access.userId);

        return NextResponse.json({
            ...result,
            expectedKpis: EXPECTED_KPIS,
            nextSteps: result.success ? [
                `Switch to "Pilot Boerderij" tenant in the UI`,
                `Visit /dashboard to see KPIs`,
                `Visit /dashboard/ai/compliance-check to see mixed statuses`,
                `Use GET /api/kpis/debug to verify counts`,
            ] : [
                'Check errors and retry',
                'Ensure user is authenticated',
            ],
        });

    } catch (error) {
        console.error('Error creating pilot seed data:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create pilot seed data' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────
// DELETE - Remove pilot seed data
// ─────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    const access = await requireDevSeedAccess(request);
    if (access instanceof NextResponse) return access;

    try {
        // Parse body
        let body: { secret?: string; confirm?: boolean } = {};
        try {
            body = await request.json();
        } catch {
            // Body required for DELETE
            return NextResponse.json(
                { error: 'Request body required with { confirm: true }', code: 'MISSING_CONFIRM' },
                { status: 400 }
            );
        }

        // Require explicit confirmation
        if (body.confirm !== true) {
            return NextResponse.json(
                { 
                    error: 'Deletion requires explicit confirmation',
                    code: 'MISSING_CONFIRM',
                    hint: 'Send { "confirm": true } in request body',
                },
                { status: 400 }
            );
        }

        // Remove seed data
        const supabase = createServiceSupabaseClient();
        const result = await removePilotSeedData(supabase);

        return NextResponse.json({
            ...result,
            message: result.success 
                ? 'Pilot seed data removed successfully'
                : 'Some errors occurred during removal',
        });

    } catch (error) {
        console.error('Error removing pilot seed data:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to remove pilot seed data' },
            { status: 500 }
        );
    }
}


