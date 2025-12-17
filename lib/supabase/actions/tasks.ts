/**
 * Task Server Actions
 * Handles task CRUD operations
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { logAuditEvent } from './audit';
import type { Task, TaskInsert, TaskUpdate, TaskWithRequirement } from '@/lib/supabase/types';

/**
 * Get all tasks for the active tenant
 */
export async function getTasks(): Promise<TaskWithRequirement[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('tasks')
        .select(`
      *,
      requirement:dossier_requirements(*)
    `)
        .eq('tenant_id', tenant.id)
        .order('due_at', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        throw new Error('Failed to fetch tasks');
    }

    return (data || []) as TaskWithRequirement[];
}

/**
 * Get open tasks for calendar view
 */
export async function getOpenTasks(): Promise<TaskWithRequirement[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('tasks')
        .select(`
      *,
      requirement:dossier_requirements(*)
    `)
        .eq('tenant_id', tenant.id)
        .neq('status', 'done')
        .order('due_at', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Error fetching open tasks:', error);
        throw new Error('Failed to fetch tasks');
    }

    return (data || []) as TaskWithRequirement[];
}

/**
 * Create a new task
 */
export async function createTask(
    input: Omit<TaskInsert, 'tenant_id'>
): Promise<Task> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            ...input,
            tenant_id: tenant.id,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
    }

    // Log audit event
    await logAuditEvent({
        action: 'task.created',
        entity_type: 'task',
        entity_id: data.id,
        meta: { title: data.title },
    });

    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/ai/compliance-check');
    return data;
}

/**
 * Update a task
 */
export async function updateTask(
    id: string,
    updates: TaskUpdate
): Promise<Task> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // If completing, set completed_at
    const updateData: TaskUpdate & { completed_at?: string | null } = { ...updates };
    if (updates.status === 'done' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'done') {
        updateData.completed_at = null;
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }

    // Log audit event if completed
    if (updateData.completed_at) {
        await logAuditEvent({
            action: 'task.completed',
            entity_type: 'task',
            entity_id: id,
            meta: { title: data.title },
        });
    }

    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/ai/compliance-check');
    return data;
}

/**
 * Mark a task as done
 */
export async function completeTask(id: string): Promise<Task> {
    return updateTask(id, { status: 'done' });
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
    }

    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/ai/compliance-check');
}

/**
 * Get task counts for dashboard
 */
export async function getTaskCounts() {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('tasks')
        .select('id, status, priority, due_at')
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error fetching task counts:', error);
        return { total: 0, open: 0, urgent: 0, overdue: 0 };
    }

    const tasks = data || [];
    const now = new Date();

    return {
        total: tasks.length,
        open: tasks.filter(t => t.status === 'open').length,
        urgent: tasks.filter(t => t.status === 'open' && t.priority === 'urgent').length,
        overdue: tasks.filter(t =>
            t.status === 'open' &&
            t.due_at &&
            new Date(t.due_at) < now
        ).length,
    };
}
