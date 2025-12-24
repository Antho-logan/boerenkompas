/**
 * Task Update/Delete API Route
 * 
 * SECURITY:
 * - PATCH has strict allowlist for updatable fields (mass-assignment protection)
 * - All operations are tenant-scoped via server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateTask, deleteTask } from '@/lib/supabase/actions/tasks';
import { handleApiError, requireAuth } from '@/lib/supabase/guards';
import type { TaskUpdate } from '@/lib/supabase/types';

// Allowlist of fields that can be updated via PATCH
const ALLOWED_UPDATE_FIELDS: (keyof TaskUpdate)[] = [
    'title',
    'status',
    'due_at',
    'priority',
    'completed_at',
];

// Fields that are NEVER allowed to be updated (security-sensitive)
const FORBIDDEN_FIELDS = [
    'id',
    'tenant_id',
    'source',
    'requirement_id',
    'created_at',
    'created_by',
];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const { id } = await params;
        const body = await request.json();

        // SECURITY: Check for forbidden fields
        const forbiddenFound = FORBIDDEN_FIELDS.filter(f => f in body);
        if (forbiddenFound.length > 0) {
            return NextResponse.json(
                {
                    error: 'Forbidden fields in request',
                    code: 'FORBIDDEN_FIELDS',
                    fields: forbiddenFound,
                },
                { status: 400 }
            );
        }

        // SECURITY: Only allow allowlisted fields
        const sanitized: TaskUpdate = {};
        for (const key of ALLOWED_UPDATE_FIELDS) {
            if (key in body) {
                (sanitized as Record<string, unknown>)[key] = body[key];
            }
        }

        // Check if there are any valid updates
        if (Object.keys(sanitized).length === 0) {
            return NextResponse.json(
                {
                    error: 'No valid fields to update',
                    code: 'NO_VALID_FIELDS',
                    allowed: ALLOWED_UPDATE_FIELDS,
                },
                { status: 400 }
            );
        }

        // If marking as done, set completed_at
        if (sanitized.status === 'done' && !sanitized.completed_at) {
            sanitized.completed_at = new Date().toISOString();
        }

        const task = await updateTask(id, sanitized);
        return NextResponse.json({ task });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const { id } = await params;
        await deleteTask(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
