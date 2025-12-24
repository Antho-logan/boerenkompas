/**
 * Exports API Route
 * 
 * ENTITLEMENTS:
 * - GET: All plans can view their exports
 * - POST: Requires admin role and export quota checks (enforced in createExport action)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExports, createExport } from '@/lib/supabase/actions/exports';
import { ExportLimitError } from '@/lib/supabase/errors';
import { requireAuth } from '@/lib/supabase/guards';
import { handlePlanError } from '@/lib/auth/plan';

export async function GET() {
    try {
        const exports = await getExports();
        return NextResponse.json({ exports });
    } catch (error) {
        console.error('Error fetching exports:', error);

        // Check for plan errors
        const planError = handlePlanError(error);
        if (planError) {
            return NextResponse.json(planError.body, { status: planError.status });
        }

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch exports' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const { templateId } = await request.json();

        if (!templateId) {
            return NextResponse.json(
                { error: 'Template ID required' },
                { status: 400 }
            );
        }

        // createExport enforces export quota based on plan
        const exportRecord = await createExport(templateId);
        return NextResponse.json({ export: exportRecord });
    } catch (error) {
        console.error('Error creating export:', error);

        if (error instanceof ExportLimitError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        // Check for plan errors
        const planError = handlePlanError(error);
        if (planError) {
            return NextResponse.json(planError.body, { status: planError.status });
        }

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create export' },
            { status: 500 }
        );
    }
}
