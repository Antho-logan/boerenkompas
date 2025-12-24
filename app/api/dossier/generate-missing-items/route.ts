/**
 * Generate Missing Items API Route
 * Runs the deterministic missing items generator
 * 
 * ENTITLEMENTS:
 * - Requires Pro plan (missing_items_generator feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMissingItems } from '@/lib/supabase/actions/dossier';
import { assertFeature, handlePlanError } from '@/lib/auth/plan';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { requireAuth } from '@/lib/supabase/guards';

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const tenant = await requireActiveTenant();

        // GATE: Missing Items Generator requires Pro plan
        await assertFeature(tenant.id, 'missing_items_generator');

        const { templateId } = await request.json();

        if (!templateId) {
            return NextResponse.json(
                { error: 'Template ID required' },
                { status: 400 }
            );
        }

        const summary = await generateMissingItems(templateId);

        return NextResponse.json({
            success: true,
            summary,
            message: `Taken gegenereerd: ${summary.missing} ontbrekend, ${summary.expired} verlopen`
        });
    } catch (error) {
        console.error('Error generating missing items:', error);

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
            { error: 'Failed to generate missing items' },
            { status: 500 }
        );
    }
}
