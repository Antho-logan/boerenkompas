/**
 * Generate Missing Items API Route
 * Runs the deterministic missing items generator
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMissingItems } from '@/lib/supabase/actions/dossier';

export async function POST(request: NextRequest) {
    try {
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
        return NextResponse.json(
            { error: 'Failed to generate missing items' },
            { status: 500 }
        );
    }
}
