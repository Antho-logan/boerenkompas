/**
 * Development Seed Data
 * 
 * Generates predictable test data for end-to-end testing.
 * 
 * SECURITY:
 * - This file should NEVER be imported in production code paths
 * - Only use via /api/dev/seed which has its own guards
 * 
 * GENERATED DATA OVERVIEW:
 * ─────────────────────────────────────────────────────────────────
 * Tenant: "Pilot Boerderij" (pilot-farm)
 * 
 * Documents (12 total):
 *   - 5x status='ok' (good documents)
 *   - 3x status='needs_review' (pending review)
 *   - 2x status='expired' (document expired)
 *   - 2x with expires_at in the past (date-expired)
 * 
 * Document Links (produces compliance-check mix):
 *   - 6x satisfied (linked to ok documents)
 *   - 4x missing (no link)
 *   - 3x expired (linked to expired documents)
 *   - 2x needs_review (linked to needs_review documents)
 * 
 * Tasks (10 total):
 *   - 2x overdue (due_at < now)
 *   - 3x upcoming 7 days
 *   - 2x future (>7 days)
 *   - 2x missing_item source
 *   - 1x done
 * 
 * Exports (4 total):
 *   - 2x this month
 *   - 2x previous month
 * ─────────────────────────────────────────────────────────────────
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Fixed UUIDs for idempotent seeding
export const PILOT_IDS = {
    tenant: '00000000-1111-2222-3333-444444444444',
    // Documents
    doc_ok_1: '10000000-0000-0000-0000-000000000001',
    doc_ok_2: '10000000-0000-0000-0000-000000000002',
    doc_ok_3: '10000000-0000-0000-0000-000000000003',
    doc_ok_4: '10000000-0000-0000-0000-000000000004',
    doc_ok_5: '10000000-0000-0000-0000-000000000005',
    doc_review_1: '10000000-0000-0000-0000-000000000006',
    doc_review_2: '10000000-0000-0000-0000-000000000007',
    doc_review_3: '10000000-0000-0000-0000-000000000008',
    doc_expired_1: '10000000-0000-0000-0000-000000000009',
    doc_expired_2: '10000000-0000-0000-0000-000000000010',
    doc_date_expired_1: '10000000-0000-0000-0000-000000000011',
    doc_date_expired_2: '10000000-0000-0000-0000-000000000012',
    // Exports
    export_1: '20000000-0000-0000-0000-000000000001',
    export_2: '20000000-0000-0000-0000-000000000002',
    export_3: '20000000-0000-0000-0000-000000000003',
    export_4: '20000000-0000-0000-0000-000000000004',
};

// Use the seeded "Inspectie Basis" template
const INSPECTIE_TEMPLATE_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Date helpers for predictable dates
 */
function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

function dateOnly(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

/**
 * Seed result tracking
 */
export interface SeedResult {
    success: boolean;
    tenantId: string;
    tenantName: string;
    counts: {
        documents: number;
        documentLinks: number;
        tasks: number;
        exports: number;
    };
    errors: string[];
}

/**
 * Create all pilot seed data
 * 
 * @param supabase - Service role client (bypasses RLS)
 * @param userId - The user who will own/be member of the pilot tenant
 */
export async function createPilotSeedData(
    supabase: SupabaseClient,
    userId: string
): Promise<SeedResult> {
    const errors: string[] = [];
    const counts = { documents: 0, documentLinks: 0, tasks: 0, exports: 0 };

    try {
        // ─────────────────────────────────────────────────────────────
        // 1. CREATE TENANT
        // ─────────────────────────────────────────────────────────────
        const { error: tenantError } = await supabase
            .from('tenants')
            .upsert({
                id: PILOT_IDS.tenant,
                name: 'Pilot Boerderij',
                created_at: daysAgo(30),
                created_by: userId,
            }, { onConflict: 'id' });

        if (tenantError) {
            errors.push(`Tenant: ${tenantError.message}`);
        }

        // ─────────────────────────────────────────────────────────────
        // 2. ADD USER AS OWNER
        // ─────────────────────────────────────────────────────────────
        const { error: memberError } = await supabase
            .from('tenant_members')
            .upsert({
                tenant_id: PILOT_IDS.tenant,
                user_id: userId,
                role: 'owner',
                created_at: daysAgo(30),
            }, { onConflict: 'tenant_id,user_id' });

        if (memberError) {
            errors.push(`Member: ${memberError.message}`);
        }

        // ─────────────────────────────────────────────────────────────
        // 3. CREATE TENANT PROFILE (trigger should handle this, but ensure)
        // ─────────────────────────────────────────────────────────────
        await supabase
            .from('tenant_profile')
            .upsert({
                tenant_id: PILOT_IDS.tenant,
                farm_type: 'Melkveehouderij',
                province: 'Gelderland',
                municipality: 'Barneveld',
                hectares_total: 85,
                livestock_scale_band: 'medium',
            }, { onConflict: 'tenant_id' });

        // ─────────────────────────────────────────────────────────────
        // 4. CREATE DOCUMENTS
        // ─────────────────────────────────────────────────────────────
        const documents = [
            // OK documents (5)
            { id: PILOT_IDS.doc_ok_1, title: 'KvK-uittreksel 2024', file_name: 'kvk-2024.pdf', category: 'Bedrijfsgegevens', status: 'ok', doc_date: dateOnly(-30), created_at: daysAgo(25) },
            { id: PILOT_IDS.doc_ok_2, title: 'UBN Registratie', file_name: 'ubn-reg.pdf', category: 'Bedrijfsgegevens', status: 'ok', doc_date: dateOnly(-60), created_at: daysAgo(60) },
            { id: PILOT_IDS.doc_ok_3, title: 'Kadastrale overzicht', file_name: 'kadaster.pdf', category: 'Percelen & Grond', status: 'ok', doc_date: dateOnly(-45), created_at: daysAgo(45) },
            { id: PILOT_IDS.doc_ok_4, title: 'Mestboekhouding 2024', file_name: 'mest-2024.xlsx', category: 'Mest & Mineralen', status: 'ok', doc_date: dateOnly(-10), created_at: daysAgo(10) },
            { id: PILOT_IDS.doc_ok_5, title: 'Omgevingsvergunning', file_name: 'omgeving-verg.pdf', category: 'Vergunningen', status: 'ok', doc_date: dateOnly(-365), created_at: daysAgo(365) },
            
            // Needs review (3)
            { id: PILOT_IDS.doc_review_1, title: 'I&R Overzicht (nieuw)', file_name: 'ir-overzicht.pdf', category: 'Dierenwelzijn', status: 'needs_review', doc_date: dateOnly(-5), created_at: daysAgo(5) },
            { id: PILOT_IDS.doc_review_2, title: 'Dierenarts logboek', file_name: 'vet-log.pdf', category: 'Dierenwelzijn', status: 'needs_review', doc_date: dateOnly(-15), created_at: daysAgo(15) },
            { id: PILOT_IDS.doc_review_3, title: 'Kunstmest bonnen', file_name: 'kunstmest.pdf', category: 'Mest & Mineralen', status: 'needs_review', doc_date: dateOnly(-20), created_at: daysAgo(20) },
            
            // Status expired (2)
            { id: PILOT_IDS.doc_expired_1, title: 'Oude mestafzetovereenkomst', file_name: 'mest-afzet-oud.pdf', category: 'Mest & Mineralen', status: 'expired', doc_date: dateOnly(-400), created_at: daysAgo(400) },
            { id: PILOT_IDS.doc_expired_2, title: 'Verlopen KvK', file_name: 'kvk-oud.pdf', category: 'Bedrijfsgegevens', status: 'expired', doc_date: dateOnly(-500), created_at: daysAgo(500) },
            
            // Date-expired (expires_at in past, status still ok)
            { id: PILOT_IDS.doc_date_expired_1, title: 'Verzekeringspolis 2023', file_name: 'verzekering-2023.pdf', category: 'Financieel', status: 'ok', doc_date: dateOnly(-365), expires_at: dateOnly(-30), created_at: daysAgo(365) },
            { id: PILOT_IDS.doc_date_expired_2, title: 'Watervergunning (verlopen)', file_name: 'water-verg-oud.pdf', category: 'Vergunningen', status: 'ok', doc_date: dateOnly(-730), expires_at: dateOnly(-60), created_at: daysAgo(730) },
        ];

        for (const doc of documents) {
            const { error } = await supabase
                .from('documents')
                .upsert({
                    ...doc,
                    tenant_id: PILOT_IDS.tenant,
                    storage_key: `${PILOT_IDS.tenant}/documents/${doc.id}/${doc.file_name}`,
                    mime_type: doc.file_name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.ms-excel',
                    size_bytes: Math.floor(Math.random() * 5000000) + 100000,
                    created_by: userId,
                }, { onConflict: 'id' });

            if (error) {
                errors.push(`Document ${doc.title}: ${error.message}`);
            } else {
                counts.documents++;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 5. GET REQUIREMENTS FROM TEMPLATE
        // ─────────────────────────────────────────────────────────────
        const { data: requirements } = await supabase
            .from('dossier_requirements')
            .select('id, code, title')
            .eq('template_id', INSPECTIE_TEMPLATE_ID)
            .order('sort_order')
            .limit(15);

        if (!requirements || requirements.length === 0) {
            errors.push('No requirements found for Inspectie Basis template');
        }

        // ─────────────────────────────────────────────────────────────
        // 6. CREATE DOCUMENT LINKS (produces compliance mix)
        // ─────────────────────────────────────────────────────────────
        // Map requirements to documents for predictable results:
        // - First 6 requirements: link to OK docs (satisfied)
        // - Next 4: no link (missing)
        // - Next 3: link to expired docs (expired)
        // - Last 2: link to needs_review docs (needs_review)

        if (requirements) {
            const linkMappings = [
                // Satisfied (6)
                { reqIndex: 0, docId: PILOT_IDS.doc_ok_1 },  // KvK -> BG-001
                { reqIndex: 1, docId: PILOT_IDS.doc_ok_2 },  // UBN -> BG-003
                { reqIndex: 2, docId: PILOT_IDS.doc_ok_3 },  // Kadaster -> PG-001
                { reqIndex: 3, docId: PILOT_IDS.doc_ok_4 },  // Mestboek -> MM-001
                { reqIndex: 4, docId: PILOT_IDS.doc_ok_5 },  // Omgeving -> VG-001
                { reqIndex: 5, docId: PILOT_IDS.doc_review_1 }, // I&R -> DW-001 (will show as needs_review)
                
                // Missing: indices 6, 7, 8, 9 have no links
                
                // Expired (2)
                { reqIndex: 10, docId: PILOT_IDS.doc_expired_1 },
                { reqIndex: 11, docId: PILOT_IDS.doc_expired_2 },
                
                // Needs review (2)
                { reqIndex: 12, docId: PILOT_IDS.doc_review_2 },
                { reqIndex: 13, docId: PILOT_IDS.doc_review_3 },
            ];

            for (const mapping of linkMappings) {
                const req = requirements[mapping.reqIndex];
                if (!req) continue;

                const { error } = await supabase
                    .from('document_links')
                    .upsert({
                        tenant_id: PILOT_IDS.tenant,
                        requirement_id: req.id,
                        document_id: mapping.docId,
                        created_by: userId,
                    }, { onConflict: 'tenant_id,requirement_id' });

                if (error) {
                    errors.push(`Link ${req.code}: ${error.message}`);
                } else {
                    counts.documentLinks++;
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 7. CREATE TASKS
        // ─────────────────────────────────────────────────────────────
        const tasks = [
            // Overdue (2)
            { title: 'Upload mestafzetovereenkomst', source: 'missing_item', status: 'open', priority: 'urgent', due_at: daysAgo(3) },
            { title: 'Controleer perceelregistratie', source: 'manual', status: 'open', priority: 'normal', due_at: daysAgo(1) },
            
            // Upcoming 7 days (3)
            { title: 'Jaarlijkse I&R update', source: 'manual', status: 'open', priority: 'normal', due_at: daysFromNow(2) },
            { title: 'Grondmonsters laten nemen', source: 'missing_item', status: 'open', priority: 'normal', due_at: daysFromNow(5) },
            { title: 'KvK vernieuwen', source: 'manual', status: 'snoozed', priority: 'low', due_at: daysFromNow(7) },
            
            // Future >7 days (2)
            { title: 'Verzekering vernieuwen', source: 'manual', status: 'open', priority: 'low', due_at: daysFromNow(30) },
            { title: 'Jaarrekening aanleveren', source: 'manual', status: 'open', priority: 'normal', due_at: daysFromNow(60) },
            
            // Done (1)
            { title: 'Omgevingsvergunning uploaden', source: 'missing_item', status: 'done', priority: 'normal', due_at: daysAgo(10), completed_at: daysAgo(8) },
            
            // No due date (2)
            { title: 'Optionele documenten verzamelen', source: 'manual', status: 'open', priority: 'low', due_at: null },
            { title: 'Adviseur contacteren', source: 'manual', status: 'open', priority: 'low', due_at: null },
        ];

        for (const task of tasks) {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    ...task,
                    tenant_id: PILOT_IDS.tenant,
                    created_by: userId,
                    created_at: daysAgo(Math.floor(Math.random() * 30)),
                });

            if (error) {
                errors.push(`Task ${task.title}: ${error.message}`);
            } else {
                counts.tasks++;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 8. CREATE EXPORTS
        // ─────────────────────────────────────────────────────────────
        const exports = [
            // This month (2)
            { id: PILOT_IDS.export_1, title: 'Inspectie Export December', created_at: daysAgo(5) },
            { id: PILOT_IDS.export_2, title: 'Bank Financiering Dossier', created_at: daysAgo(10) },
            
            // Previous month (2)
            { id: PILOT_IDS.export_3, title: 'November Controle', created_at: daysAgo(35) },
            { id: PILOT_IDS.export_4, title: 'GLB Subsidie Pakket', created_at: daysAgo(45) },
        ];

        for (const exp of exports) {
            const { error } = await supabase
                .from('exports')
                .upsert({
                    ...exp,
                    tenant_id: PILOT_IDS.tenant,
                    template_id: INSPECTIE_TEMPLATE_ID,
                    index_html: `<html><head><title>${exp.title}</title></head><body><h1>${exp.title}</h1><p>Pilot test export</p></body></html>`,
                    share_token: `pilot-${exp.id.split('-')[0]}`,
                    expires_at: daysFromNow(30),
                    created_by: userId,
                }, { onConflict: 'id' });

            if (error) {
                errors.push(`Export ${exp.title}: ${error.message}`);
            } else {
                counts.exports++;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 9. ADD AUDIT LOG ENTRIES
        // ─────────────────────────────────────────────────────────────
        await supabase
            .from('audit_log')
            .insert([
                { tenant_id: PILOT_IDS.tenant, actor_user_id: userId, action: 'tenant.created', entity_type: 'tenant', meta: { source: 'pilot_seed' } },
                { tenant_id: PILOT_IDS.tenant, actor_user_id: userId, action: 'document.uploaded', entity_type: 'document', meta: { count: counts.documents } },
                { tenant_id: PILOT_IDS.tenant, actor_user_id: userId, action: 'seed.completed', entity_type: 'system', meta: { counts } },
            ]);

        return {
            success: errors.length === 0,
            tenantId: PILOT_IDS.tenant,
            tenantName: 'Pilot Boerderij',
            counts,
            errors,
        };

    } catch (err) {
        errors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        return {
            success: false,
            tenantId: PILOT_IDS.tenant,
            tenantName: 'Pilot Boerderij',
            counts,
            errors,
        };
    }
}

/**
 * Remove all pilot seed data
 * 
 * @param supabase - Service role client (bypasses RLS)
 */
export async function removePilotSeedData(
    supabase: SupabaseClient
): Promise<{ success: boolean; deleted: Record<string, number>; errors: string[] }> {
    const errors: string[] = [];
    const deleted: Record<string, number> = {};

    try {
        // Delete in reverse dependency order
        const tables = ['audit_log', 'exports', 'tasks', 'document_links', 'documents', 'tenant_profile', 'tenant_members', 'tenants'];

        for (const table of tables) {
            if (table === 'tenants') {
                // Delete tenant directly
                const { error, count } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', PILOT_IDS.tenant)
                    .select('id', { count: 'exact', head: true });

                deleted[table] = count ?? 0;
                if (error) errors.push(`${table}: ${error.message}`);
            } else {
                // Delete by tenant_id
                const { error, count } = await supabase
                    .from(table)
                    .delete()
                    .eq('tenant_id', PILOT_IDS.tenant)
                    .select('id', { count: 'exact', head: true });

                deleted[table] = count ?? 0;
                if (error) errors.push(`${table}: ${error.message}`);
            }
        }

        return {
            success: errors.length === 0,
            deleted,
            errors,
        };

    } catch (err) {
        errors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        return { success: false, deleted, errors };
    }
}

/**
 * Expected KPI values after seeding (for verification)
 */
export const EXPECTED_KPIS = {
    total_documents: 12,
    documents_attention: 5, // 3 needs_review + 2 expired status
    tasks_overdue: 2,
    tasks_upcoming_7d: 3,
    missing_items_open: 2, // 2 missing_item source with status=open
    exports_this_month: 2, // Depends on current date
};

