/**
 * Dossier Check API Route
 * Returns requirements with status for a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequirementsWithStatus, getDossierCheckSummary } from '@/lib/supabase/actions/dossier';

export async function GET(request: NextRequest) {
    try {
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
        return NextResponse.json(
            { error: 'Failed to fetch dossier check' },
            { status: 500 }
        );
    }
}
