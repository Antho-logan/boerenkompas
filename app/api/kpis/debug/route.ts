/**
 * KPI Debug API Route
 * Returns detailed KPI snapshot for debugging and testing
 * 
 * GET /api/kpis/debug
 * 
 * SECURITY: Requires authentication, only returns data for authenticated user's active tenant
 * 
 * Response:
 * {
 *   meta: { tenantId, tenantName, generatedAt, queryTimeMs, environment },
 *   dateBoundaries: { now, todayStart, ..., todayDate },
 *   rawCounts: { totalDocuments, documentsAttention, ... },
 *   kpis: [...formatted KPIs]
 * }
 * 
 * Use this endpoint to:
 * - Verify KPI calculations are correct
 * - Debug why counts seem off
 * - Test after seeding data
 */

import { NextResponse } from 'next/server';
import { getKpiDebugSnapshot } from '@/lib/supabase/actions/kpis';
import { handleApiError } from '@/lib/supabase/guards';

export async function GET() {
    try {
        const snapshot = await getKpiDebugSnapshot();
        
        return NextResponse.json({
            ...snapshot,
            _documentation: {
                endpoint: 'GET /api/kpis/debug',
                purpose: 'Debug KPI calculations and verify counts',
                kpiDefinitions: {
                    total_documents: 'All documents for tenant (no filters)',
                    documents_attention: 'Documents with status=needs_review OR status=expired',
                    tasks_overdue: 'Tasks with status IN (open, snoozed) AND due_at < NOW',
                    tasks_upcoming_7d: 'Tasks with status IN (open, snoozed) AND due_at between today and today+7',
                    missing_items_open: 'Tasks with source=missing_item AND status IN (open, snoozed)',
                    exports_this_month: 'Exports created in current calendar month',
                },
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}



