/**
 * Dossier Templates API Route
 */

import { NextResponse } from 'next/server';
import { getDossierTemplates } from '@/lib/supabase/actions/dossier';

export async function GET() {
    try {
        const templates = await getDossierTemplates();
        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}
