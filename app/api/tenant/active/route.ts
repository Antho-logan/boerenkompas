/**
 * Active Tenant API Route
 * 
 * SECURITY: Server-authoritative tenant switching
 * - GET: Returns current active tenant from user_settings or httpOnly cookie
 * - POST: Validates membership, sets active tenant in DB + httpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const ACTIVE_TENANT_COOKIE = 'bk_active_tenant';

/**
 * GET /api/tenant/active
 * Returns the current active tenant ID (server-authoritative)
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await requireUser();

        // Try to get from user_settings first (DB is source of truth)
        const { data: settings } = await supabase
            .from('user_settings')
            .select('active_tenant_id')
            .eq('user_id', user.id)
            .single();

        if (settings?.active_tenant_id) {
            // Verify user is still a member
            const { data: membership } = await supabase
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .eq('tenant_id', settings.active_tenant_id)
                .single();

            if (membership) {
                return NextResponse.json({ tenantId: settings.active_tenant_id });
            }
        }

        // Fallback: get first tenant user is member of
        const { data: memberships } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1);

        if (memberships && memberships.length > 0) {
            const tenantId = memberships[0].tenant_id;

            // Store in user_settings for next time
            await supabase
                .from('user_settings')
                .upsert({ user_id: user.id, active_tenant_id: tenantId })
                .eq('user_id', user.id);

            return NextResponse.json({ tenantId });
        }

        return NextResponse.json({ tenantId: null });
    } catch (error) {
        console.error('Error getting active tenant:', error);
        return NextResponse.json({ tenantId: null });
    }
}

/**
 * POST /api/tenant/active
 * Sets the active tenant after validating membership
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await requireUser();
        const { tenantId } = await request.json();

        if (!tenantId || typeof tenantId !== 'string') {
            return NextResponse.json(
                { error: 'tenantId is required' },
                { status: 400 }
            );
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            return NextResponse.json(
                { error: 'Invalid tenant ID format' },
                { status: 400 }
            );
        }

        // Verify user is member of this tenant
        const { data: membership, error: memberError } = await supabase
            .from('tenant_members')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId)
            .single();

        if (memberError || !membership) {
            return NextResponse.json(
                { error: 'Not a member of this tenant' },
                { status: 403 }
            );
        }

        // Store in user_settings (DB source of truth)
        const { error: settingsError } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                active_tenant_id: tenantId
            });

        if (settingsError) {
            console.error('Error saving user settings:', settingsError);
            // Continue anyway - we'll set the cookie as backup
        }

        // Also set httpOnly cookie as backup/performance optimization
        const cookieStore = await cookies();
        cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });

        return NextResponse.json({
            success: true,
            tenantId,
            role: membership.role
        });
    } catch (error) {
        console.error('Error setting active tenant:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to set active tenant' },
            { status: 500 }
        );
    }
}
