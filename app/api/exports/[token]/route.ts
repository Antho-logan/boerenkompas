/**
 * Export API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteExport, getExport } from '@/lib/supabase/actions/exports';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const exportRecord = await getExport(token);

        if (!exportRecord) {
            return NextResponse.json(
                { error: 'Export not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ export: exportRecord });
    } catch (error) {
        console.error('Error fetching export:', error);
        return NextResponse.json(
            { error: 'Failed to fetch export' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        await deleteExport(token);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting export:', error);
        return NextResponse.json(
            { error: 'Failed to delete export' },
            { status: 500 }
        );
    }
}

