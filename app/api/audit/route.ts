/**
 * Audit Log API Route
 * 
 * SECURITY: Tenant-scoped via server actions
 */

import { NextResponse } from 'next/server';
import { getAuditLogWithUsers } from '@/lib/supabase/actions/audit';
import { handleApiError } from '@/lib/supabase/guards';

export async function GET() {
    try {
        const events = await getAuditLogWithUsers();
        return NextResponse.json({ events });
    } catch (error) {
        return handleApiError(error);
    }
}
