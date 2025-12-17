/**
 * Exports API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExports, createExport } from '@/lib/supabase/actions/exports';

export async function GET() {
    try {
        const exports = await getExports();
        return NextResponse.json({ exports });
    } catch (error) {
        console.error('Error fetching exports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exports' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { templateId } = await request.json();

        if (!templateId) {
            return NextResponse.json(
                { error: 'Template ID required' },
                { status: 400 }
            );
        }

        const exportRecord = await createExport(templateId);
        return NextResponse.json({ export: exportRecord });
    } catch (error) {
        console.error('Error creating export:', error);
        return NextResponse.json(
            { error: 'Failed to create export' },
            { status: 500 }
        );
    }
}
