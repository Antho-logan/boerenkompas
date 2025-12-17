/**
 * Tenant Members Server Actions
 * Handles advisor/staff management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { logAuditEvent } from './audit';
import type { TenantMember, TenantRole } from '@/lib/supabase/types';

/**
 * Get all members of the active tenant
 */
export async function getTenantMembers(): Promise<TenantMember[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('role');

    if (error) {
        console.error('Error fetching tenant members:', error);
        throw new Error('Failed to fetch members');
    }

    return data || [];
}

/**
 * Add a member to the tenant (by user id)
 * In a real app, this would send an invite email
 */
export async function addTenantMember(
    userId: string,
    role: TenantRole
): Promise<TenantMember> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // Check if user is owner
    if (tenant.role !== 'owner') {
        throw new Error('Only owners can add members');
    }

    const { data, error } = await supabase
        .from('tenant_members')
        .insert({
            tenant_id: tenant.id,
            user_id: userId,
            role,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding tenant member:', error);
        throw new Error('Failed to add member');
    }

    await logAuditEvent({
        action: 'member.added',
        entity_type: 'tenant_member',
        meta: { user_id: userId, role },
    });

    revalidatePath('/dashboard/adviseurs');
    return data;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
    userId: string,
    role: TenantRole
): Promise<TenantMember> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // Check if user is owner
    if (tenant.role !== 'owner') {
        throw new Error('Only owners can update member roles');
    }

    const { data, error } = await supabase
        .from('tenant_members')
        .update({ role })
        .eq('tenant_id', tenant.id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating member role:', error);
        throw new Error('Failed to update member role');
    }

    await logAuditEvent({
        action: 'member.role_updated',
        entity_type: 'tenant_member',
        meta: { user_id: userId, role },
    });

    revalidatePath('/dashboard/adviseurs');
    return data;
}

/**
 * Remove a member from the tenant
 */
export async function removeTenantMember(userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    // Check if user is owner
    if (tenant.role !== 'owner') {
        throw new Error('Only owners can remove members');
    }

    // Prevent removing self
    if (userId === user.id) {
        throw new Error('Cannot remove yourself');
    }

    const { error } = await supabase
        .from('tenant_members')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing tenant member:', error);
        throw new Error('Failed to remove member');
    }

    await logAuditEvent({
        action: 'member.removed',
        entity_type: 'tenant_member',
        meta: { user_id: userId },
    });

    revalidatePath('/dashboard/adviseurs');
}
