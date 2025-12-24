/**
 * KPI API Route
 * Returns dashboard KPIs for the active tenant
 * 
 * GET /api/kpis
 * 
 * Query Parameters:
 * - format: 'array' (default) | 'full'
 *   - array: Returns KPI[] directly (backwards compatible)
 *   - full: Returns { data: KPI[], meta: {...} }
 * 
 * Response Formats:
 * 
 * format=array (default):
 * [
 *   { id: 'total_documents', label: 'Documenten', value: 42, unit: 'stuks', status: 'good', trend: 5 },
 *   ...
 * ]
 * 
 * format=full:
 * {
 *   data: [...KPIs],
 *   meta: { tenantId: '...', generatedAt: '...', queryTimeMs: 45 }
 * }
 * 
 * Error Response (all formats):
 * { error: 'message', code: 'ERROR_CODE' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardKpis, getDashboardKpisWithMeta } from '@/lib/supabase/actions/kpis';
import { handleApiError } from '@/lib/supabase/guards';

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'array';

        if (format === 'full') {
            const response = await getDashboardKpisWithMeta();
            return NextResponse.json({
                data: response.kpis,
                meta: {
                    ...response.meta,
                    apiTimeMs: Date.now() - startTime,
                },
            });
        }

        // Default: array format (backwards compatible)
        const kpis = await getDashboardKpis();
        return NextResponse.json(kpis);

    } catch (error) {
        return handleApiError(error);
    }
}
