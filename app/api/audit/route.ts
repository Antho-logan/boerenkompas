/**
 * Audit Log API Route
 */

import { NextResponse } from 'next/server';
import { getAuditLogWithUsers } from '@/lib/supabase/actions/audit';

export async function GET() {
    try {
        const events = await getAuditLogWithUsers();
        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit log' },
            { status: 500 }
        );
    }
}
