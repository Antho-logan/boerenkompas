/**
 * Audit Log Server Actions
 * Handles audit event logging
 */

'use server';

import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server';
import { getActiveTenantId } from '@/lib/supabase/tenant';
import type { AuditLog, AuditLogInsert } from '@/lib/supabase/types';

/**
 * Log an audit event for the current user and tenant
 */
export async function logAuditEvent(
    input: Omit<AuditLogInsert, 'tenant_id'>
): Promise<void> {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await getCurrentUser();
        const tenantId = await getActiveTenantId();

        if (!tenantId) {
            console.warn('Cannot log audit event: no active tenant');
            return;
        }

        const { error } = await supabase
            .from('audit_log')
            .insert({
                ...input,
                tenant_id: tenantId,
                actor_user_id: user?.id || null,
            });

        if (error) {
            console.error('Error logging audit event:', error);
            // Don't throw - audit logging should not break operations
        }
    } catch (err) {
        console.error('Error in logAuditEvent:', err);
        // Don't throw - audit logging should not break operations
    }
}

/**
 * Get audit log entries for the active tenant
 */
export async function getAuditLog(limit = 100): Promise<AuditLog[]> {
    const supabase = await createServerSupabaseClient();
    const tenantId = await getActiveTenantId();

    if (!tenantId) {
        return [];
    }

    const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching audit log:', error);
        return [];
    }

    return data || [];
}

/**
 * Get audit log entries with user info
 */
export async function getAuditLogWithUsers(limit = 100) {
    const supabase = await createServerSupabaseClient();
    const tenantId = await getActiveTenantId();

    if (!tenantId) {
        return [];
    }

    // Get audit logs
    const { data: logs, error: logsError } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (logsError) {
        console.error('Error fetching audit log:', logsError);
        return [];
    }

    // Get unique user IDs
    const userIds = [...new Set((logs || []).map(l => l.actor_user_id).filter(Boolean))];

    // Get user emails from tenant_members (we can't access auth.users directly)
    // For MVP, we'll use the user ID and show it, or rely on the meta field

    return (logs || []).map(log => ({
        ...log,
        actorName: log.meta?.actorName || log.actor_user_id?.slice(0, 8) || 'Systeem',
        actorRole: log.meta?.actorRole || 'unknown',
        details: log.meta?.details || formatAuditAction(log.action, log.meta),
        severity: log.meta?.severity || 'info',
    }));
}

/**
 * Format audit action into readable details
 */
function formatAuditAction(action: string, meta: Record<string, unknown>): string {
    switch (action) {
        case 'document.created':
            return `Nieuw document: ${meta?.title || 'Onbekend'}`;
        case 'document.updated':
            return `Document bijgewerkt`;
        case 'document.deleted':
            return `Document verwijderd: ${meta?.title || 'Onbekend'}`;
        case 'task.created':
            return `Nieuwe taak: ${meta?.title || 'Onbekend'}`;
        case 'task.completed':
            return `Taak afgerond: ${meta?.title || 'Onbekend'}`;
        case 'export.created':
            return `Export gegenereerd: ${meta?.title || 'Onbekend'}`;
        case 'missing_items.generated':
            return `Missende items gegenereerd (${meta?.missing || 0} ontbrekend)`;
        default:
            return action;
    }
}
