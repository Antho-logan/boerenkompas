/**
 * Tasks API Route
 */

import { NextResponse } from 'next/server';
import { getTasks, getOpenTasks, createTask } from '@/lib/supabase/actions/tasks';

export async function GET() {
    try {
        const tasks = await getOpenTasks();
        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const task = await createTask(body);
        return NextResponse.json({ task });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
