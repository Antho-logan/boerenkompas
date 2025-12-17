/**
 * Tenant Utilities - Server-side tenant management
 * 
 * SECURITY: Active tenant is DB-authoritative (user_settings table)
 * - No client-side cookie writes
 * - Validated via membership check
 */

import { cookies } from 'next/headers';
import { createServerSupabaseClient, requireUser } from './server';
import type { Tenant, TenantWithRole, CurrentUser } from './types';

// Cookie name for backup storage (server sets only, httpOnly)
const ACTIVE_TENANT_COOKIE = 'bk_active_tenant';

/**
 * Get the active tenant ID from user_settings (DB source of truth)
 * Falls back to httpOnly cookie, then first tenant
 */
export async function getActiveTenantId(): Promise<string | null> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Try DB first (source of truth)
        const { data: settings } = await supabase
            .from('user_settings')
            .select('active_tenant_id')
            .eq('user_id', user.id)
            .single();

        if (settings?.active_tenant_id) {
            // Verify still a member
            const { data: membership } = await supabase
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .eq('tenant_id', settings.active_tenant_id)
                .single();

            if (membership) {
                return settings.active_tenant_id;
            }
        }

        // Fallback to cookie (if set by server)
        const cookieStore = await cookies();
        const cookieValue = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;

        if (cookieValue) {
            // Verify valid and user is member
            const { data: membership } = await supabase
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .eq('tenant_id', cookieValue)
                .single();

            if (membership) {
                return cookieValue;
            }
        }

        // Final fallback: first tenant user is member of
        const { data: memberships } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1);

        return memberships?.[0]?.tenant_id || null;
    } catch {
        return null;
    }
}

/**
 * Set the active tenant ID (server-only, validates membership)
 */
export async function setActiveTenantId(tenantId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();

    // Verify membership
    const { data: membership } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

    if (!membership) {
        throw new Error('Not a member of this tenant');
    }

    // Store in user_settings (DB source of truth)
    await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            active_tenant_id: tenantId
        });

    // Also set httpOnly cookie as backup
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
    });
}

/**
 * Get all tenants the current user is a member of
 */
export async function getUserTenants(): Promise<TenantWithRole[]> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();

    const { data, error } = await supabase
        .from('tenant_members')
        .select(`
      role,
      tenants (
        id,
        name,
        created_at,
        created_by
      )
    `)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching user tenants:', error);
        return [];
    }

    return (data || []).map((row) => ({
        ...(row.tenants as unknown as Tenant),
        role: row.role,
    }));
}

/**
 * Get the active tenant, falling back to first available
 */
export async function getActiveTenant(): Promise<TenantWithRole | null> {
    const tenants = await getUserTenants();
    if (tenants.length === 0) return null;

    const activeTenantId = await getActiveTenantId();

    // Find the active tenant or default to first
    const activeTenant = activeTenantId
        ? tenants.find(t => t.id === activeTenantId)
        : null;

    return activeTenant || tenants[0];
}

/**
 * Require an active tenant or throw
 */
export async function requireActiveTenant(): Promise<TenantWithRole> {
    const tenant = await getActiveTenant();
    if (!tenant) {
        throw new Error('No tenant found. Please complete onboarding.');
    }
    return tenant;
}

/**
 * Create a new tenant and add the current user as owner
 * Uses secure RPC function
 */
export async function createTenantWithOwner(name: string): Promise<Tenant> {
    const supabase = await createServerSupabaseClient();
    await requireUser();

    // Use secure RPC function
    const { data: tenantId, error } = await supabase
        .rpc('create_tenant_with_owner', { p_name: name });

    if (error) {
        console.error('Error creating tenant:', error);
        throw new Error('Failed to create tenant');
    }

    if (!tenantId) {
        throw new Error('No tenant ID returned');
    }

    // Get the created tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

    if (!tenant) {
        throw new Error('Tenant created but not found');
    }

    // Set as active tenant
    await setActiveTenantId(tenantId);

    return tenant;
}

/**
 * Get current user info formatted for UI
 */
export async function getCurrentUserInfo(): Promise<CurrentUser | null> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Gebruiker',
        avatarUrl: user.user_metadata?.avatar_url,
    };
}
