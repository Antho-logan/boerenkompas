/**
 * Dossier Check API Route
 * Returns requirements with status for a template
 * 
 * ENTITLEMENTS:
 * - Requires Pro plan for full dossier check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequirementsWithStatus, getDossierCheckSummary } from '@/lib/supabase/actions/dossier';
import { assertFeature, handlePlanError } from '@/lib/auth/plan';
import { requireActiveTenant } from '@/lib/supabase/tenant';

export async function GET(request: NextRequest) {
    try {
        const tenant = await requireActiveTenant();

        // GATE: Full Dossier Check requires Pro plan
        await assertFeature(tenant.id, 'dossier_check_full');

        const templateId = request.nextUrl.searchParams.get('templateId');

        if (!templateId) {
            return NextResponse.json(
                { error: 'Template ID required' },
                { status: 400 }
            );
        }

        const [requirements, summary] = await Promise.all([
            getRequirementsWithStatus(templateId),
            getDossierCheckSummary(templateId),
        ]);

        return NextResponse.json({ requirements, summary });
    } catch (error) {
        console.error('Error fetching dossier check:', error);

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

        if (error instanceof Error && error.message.includes('No tenant found')) {
            return NextResponse.json(
                { error: 'No tenant found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch dossier check' },
            { status: 500 }
        );
    }
}
