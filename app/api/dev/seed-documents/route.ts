/**
 * Development Seed Documents API Route
 * 
 * Creates dummy document files in storage for testing upload/download flows.
 * 
 * SECURITY:
 * ─────────────────────────────────────────────────────────────────
 * 1. Only available in development (NODE_ENV !== 'production')
 * 2. Requires authentication (user must be logged in)
 * 3. Requires DEV_SEED_SECRET header OR admin role
 * 4. Uses service role to bypass RLS (server-only)
 * ─────────────────────────────────────────────────────────────────
 * 
 * POST /api/dev/seed-documents
 *   - Creates 10 dummy documents with varied statuses
 *   - Creates actual storage objects (text files with .pdf extension)
 *   - Header: X-DEV-SEED-SECRET (required unless user is owner/advisor)
 *   - Returns: { success, documents, errors }
 * 
 * DELETE /api/dev/seed-documents  
 *   - Removes all seeded documents for the current tenant
 *   - Body: { confirm: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';

// ─────────────────────────────────────────────────────────────────
// SECURITY GUARDS
// ─────────────────────────────────────────────────────────────────

function isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === 'production';
}

const DEV_SEED_HEADER = 'x-dev-seed-secret';

function verifySecret(providedSecret?: string): boolean {
    const envSecret = process.env.DEV_SEED_SECRET;
    if (!envSecret) return false;
    return providedSecret === envSecret;
}

async function requireDevAccess(request: NextRequest) {
    if (isProductionEnvironment()) {
        return NextResponse.json(
            { error: 'Development seed endpoint is disabled in production', code: 'PRODUCTION_BLOCKED' },
            { status: 403 }
        );
    }

    try {
        const user = await requireUser();
        const headerSecret = request.headers.get(DEV_SEED_HEADER) || undefined;

        if (verifySecret(headerSecret)) {
            return { userId: user.id };
        }

        const supabase = await createServerSupabaseClient();
        const { data: membership } = await supabase
            .from('tenant_members')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['owner', 'advisor'])
            .limit(1);

        if (membership && membership.length > 0) {
            return { userId: user.id };
        }

        return NextResponse.json(
            { error: 'Invalid dev seed credentials', code: 'INVALID_SECRET' },
            { status: 403 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────
// DUMMY DOCUMENT DEFINITIONS
// ─────────────────────────────────────────────────────────────────

interface DummyDoc {
    title: string;
    file_name: string;
    category: string;
    status: 'ok' | 'needs_review' | 'expired';
    doc_date?: string;
    expires_at?: string;
    content: string;
}

function getDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

function getDaysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const DUMMY_DOCUMENTS: DummyDoc[] = [
    {
        title: 'Mestbon 2025-01-14',
        file_name: 'Mestbon_2025-01-14.pdf',
        category: 'MEST',
        status: 'ok',
        doc_date: getDaysAgo(10),
        expires_at: getDaysFromNow(365),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Mestbon
Date: ${getDaysAgo(10)}
Status: OK

This is a dummy document created for testing purposes.
It simulates a manure transport document (mestbon).

Contents:
- Transport ID: MB-2025-001234
- Quantity: 32.5 ton
- Destination: Akkerbouwbedrijf De Vries
- N-value: 4.2 kg/ton
- P2O5-value: 1.8 kg/ton

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Stikstofruimte berekening 2024',
        file_name: 'Stikstofruimte_berekening_2024.pdf',
        category: 'STIKSTOF',
        status: 'ok',
        doc_date: getDaysAgo(30),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Stikstofruimte Berekening
Year: 2024
Status: OK

AERIUS Calculation Summary:
- Total N-space: 12,500 kg
- Used: 10,250 kg (82%)
- Available: 2,250 kg

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'KVK Uittreksel',
        file_name: 'KVK_uittreksel.pdf',
        category: 'ADMINISTRATIE',
        status: 'ok',
        doc_date: getDaysAgo(90),
        expires_at: getDaysFromNow(275),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: KvK Uittreksel
Status: OK

Kamer van Koophandel Registration:
- KvK Number: 12345678
- Business Name: Test Boerderij BV
- Legal Form: BV
- Date of Registration: 01-01-2010

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Jaarrekening 2023',
        file_name: 'Jaarrekening_2023.pdf',
        category: 'ACCOUNTANT_BANK',
        status: 'ok',
        doc_date: getDaysAgo(180),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Jaarrekening
Year: 2023
Status: OK

Financial Summary (fictional):
- Revenue: €1,250,000
- Costs: €1,050,000
- Net Result: €200,000

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Machtiging Adviseur',
        file_name: 'Machtiging_adviseur.pdf',
        category: 'CONTRACTEN',
        status: 'ok',
        doc_date: getDaysAgo(60),
        expires_at: getDaysFromNow(305),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Machtiging
Status: OK

Authorization for advisor to act on behalf of:
- Client: Test Boerderij BV
- Advisor: BoerenKompas Adviseurs
- Valid until: ${getDaysFromNow(305)}

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'I&R Overzicht (controleren)',
        file_name: 'IR_overzicht_controleren.pdf',
        category: 'ADMINISTRATIE',
        status: 'needs_review',
        doc_date: getDaysAgo(5),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: I&R Overzicht
Status: NEEDS REVIEW

⚠️ This document requires manual review.
Please verify the animal counts.

Livestock Overview:
- Dairy Cows: 125
- Young Stock: 48
- Calves: 22

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Bodemanalyse Perceel Noord',
        file_name: 'Bodemanalyse_noord_review.pdf',
        category: 'KAARTEN_METINGEN',
        status: 'needs_review',
        doc_date: getDaysAgo(15),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Bodemanalyse
Status: NEEDS REVIEW

⚠️ Analysis results pending verification.

Soil Sample Results:
- pH: 6.2
- Organic Matter: 4.5%
- N-total: 2,800 mg/kg

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Vervoersbewijs (ontbreekt scan)',
        file_name: 'Vervoersbewijs_missing.pdf',
        category: 'MEST',
        status: 'needs_review',
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Vervoersbewijs Dierlijke Mest (VDM)
Status: NEEDS REVIEW

⚠️ Original scan is missing.
This is a placeholder document.

VDM Number: VDM-2025-00567
Please upload the original scan.

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Oude Omgevingsvergunning (verlopen)',
        file_name: 'Omgevingsvergunning_verlopen.pdf',
        category: 'VERGUNNINGEN',
        status: 'expired',
        doc_date: getDaysAgo(730),
        expires_at: getDaysAgo(30),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Omgevingsvergunning
Status: EXPIRED ❌

⚠️ This permit has expired!
Expired on: ${getDaysAgo(30)}

Original permit details:
- Permit Number: OV-2020-12345
- Issued: ${getDaysAgo(730)}

Please renew this permit.

[END OF DUMMY DOCUMENT]`
    },
    {
        title: 'Watervergunning 2019 (verlopen)',
        file_name: 'Watervergunning_2019_verlopen.pdf',
        category: 'VERGUNNINGEN',
        status: 'expired',
        doc_date: getDaysAgo(1825),
        expires_at: getDaysAgo(60),
        content: `[DUMMY TEST DOCUMENT]
===================================
Document Type: Watervergunning
Status: EXPIRED ❌

⚠️ This water permit has expired!
Expired on: ${getDaysAgo(60)}

Permit details:
- Water extraction permit for irrigation
- Annual limit: 50,000 m³
- Originally valid until: ${getDaysAgo(60)}

ACTION REQUIRED: Renew permit immediately.

[END OF DUMMY DOCUMENT]`
    },
];

// ─────────────────────────────────────────────────────────────────
// POST - Create dummy documents
// ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const access = await requireDevAccess(request);
    if (access instanceof NextResponse) return access;

    try {
        const tenant = await requireActiveTenant();
        const supabase = createServiceSupabaseClient();
        
        const results: { success: boolean; title: string; error?: string }[] = [];
        const errors: string[] = [];

        for (const doc of DUMMY_DOCUMENTS) {
            try {
                // Generate unique ID
                const docId = crypto.randomUUID();
                const storagePath = `${tenant.id}/documents/${docId}/${doc.file_name}`;

                // Create text content as a Blob (simulating PDF)
                const blob = new Blob([doc.content], { type: 'text/plain' });

                // Upload to storage
                const { error: uploadError } = await supabase
                    .storage
                    .from('documents')
                    .upload(storagePath, blob, {
                        contentType: 'application/pdf', // Mark as PDF for testing
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(`Storage: ${uploadError.message}`);
                }

                // Create document record
                const { error: dbError } = await supabase
                    .from('documents')
                    .insert({
                        id: docId,
                        tenant_id: tenant.id,
                        title: doc.title,
                        file_name: doc.file_name,
                        mime_type: 'application/pdf',
                        size_bytes: blob.size,
                        storage_key: storagePath,
                        category: doc.category,
                        status: doc.status,
                        doc_date: doc.doc_date || null,
                        expires_at: doc.expires_at || null,
                        tags: ['dev-seed', 'dummy'],
                        created_by: access.userId,
                        updated_by: access.userId,
                    });

                if (dbError) {
                    // Cleanup storage if DB insert fails
                    await supabase.storage.from('documents').remove([storagePath]);
                    throw new Error(`Database: ${dbError.message}`);
                }

                results.push({ success: true, title: doc.title });

            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${doc.title}: ${message}`);
                results.push({ success: false, title: doc.title, error: message });
            }
        }

        // Create audit log entry
        await supabase
            .from('audit_log')
            .insert({
                tenant_id: tenant.id,
                actor_user_id: access.userId,
                action: 'dev.seed_documents',
                entity_type: 'document',
                meta: {
                    count: results.filter(r => r.success).length,
                    source: 'dev_seed_documents',
                },
            });

        return NextResponse.json({
            success: errors.length === 0,
            created: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            documents: results,
            errors,
            message: errors.length === 0 
                ? `Succesvol ${results.filter(r => r.success).length} dummy documenten aangemaakt!`
                : `${results.filter(r => r.success).length} documenten aangemaakt, ${errors.length} fouten.`,
        });

    } catch (error) {
        console.error('Error seeding documents:', error);
        
        if (error instanceof Error && error.message === 'No active tenant found') {
            return NextResponse.json(
                { error: 'Selecteer eerst een bedrijf in de UI', code: 'NO_TENANT' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to seed documents' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────
// DELETE - Remove seeded documents
// ─────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    const access = await requireDevAccess(request);
    if (access instanceof NextResponse) return access;

    try {
        // Parse body
        let body: { confirm?: boolean } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Request body required with { confirm: true }', code: 'MISSING_CONFIRM' },
                { status: 400 }
            );
        }

        if (body.confirm !== true) {
            return NextResponse.json(
                { 
                    error: 'Deletion requires explicit confirmation',
                    code: 'MISSING_CONFIRM',
                    hint: 'Send { "confirm": true } in request body',
                },
                { status: 400 }
            );
        }

        const tenant = await requireActiveTenant();
        const supabase = createServiceSupabaseClient();

        // Get all seeded documents (tagged with 'dev-seed')
        const { data: docs } = await supabase
            .from('documents')
            .select('id, storage_key')
            .eq('tenant_id', tenant.id)
            .contains('tags', ['dev-seed']);

        if (!docs || docs.length === 0) {
            return NextResponse.json({
                success: true,
                deleted: 0,
                message: 'Geen dummy documenten gevonden om te verwijderen.',
            });
        }

        // Delete storage objects
        const storageKeys = docs.map(d => d.storage_key).filter(Boolean) as string[];
        if (storageKeys.length > 0) {
            await supabase.storage.from('documents').remove(storageKeys);
        }

        // Delete database records
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('tenant_id', tenant.id)
            .contains('tags', ['dev-seed']);

        if (deleteError) {
            return NextResponse.json(
                { error: `Failed to delete: ${deleteError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            deleted: docs.length,
            message: `${docs.length} dummy document${docs.length === 1 ? '' : 'en'} verwijderd.`,
        });

    } catch (error) {
        console.error('Error removing seeded documents:', error);
        
        if (error instanceof Error && error.message === 'No active tenant found') {
            return NextResponse.json(
                { error: 'Selecteer eerst een bedrijf in de UI', code: 'NO_TENANT' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to remove seeded documents' },
            { status: 500 }
        );
    }
}

