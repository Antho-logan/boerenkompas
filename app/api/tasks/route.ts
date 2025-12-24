/**
 * Tasks API Route
 * 
 * SECURITY: All operations are tenant-scoped via server actions
 */

import { NextResponse } from 'next/server';
import { getOpenTasks, createTask } from '@/lib/supabase/actions/tasks';
import { handleApiError, requireAuth } from '@/lib/supabase/guards';

export async function GET() {
    try {
        const tasks = await getOpenTasks();
        return NextResponse.json({ tasks });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const body = await request.json();
        const task = await createTask(body);
        return NextResponse.json({ task });
    } catch (error) {
        return handleApiError(error);
    }
}
