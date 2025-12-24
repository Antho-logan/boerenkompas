/**
 * Dossier Server Actions
 * Handles dossier templates, requirements, document links, and missing items generation
 * 
 * CORRECTNESS:
 * - recency_days is respected using doc_date
 * - Missing items generator is idempotent (doesn't reset due_at)
 * - Tasks are completed (not deleted) when requirement becomes satisfied
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { logAuditEvent } from './audit';
import type {
    DossierTemplate,
    DossierRequirement,
    DocumentLink,
    DocumentLinkInsert,
    RequirementWithStatus,
    DossierCheckSummary,
    Document,
} from '@/lib/supabase/types';

/**
 * Get all active dossier templates
 */
export async function getDossierTemplates(): Promise<DossierTemplate[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('dossier_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching dossier templates:', error);
        throw new Error('Failed to fetch templates');
    }

    return data || [];
}

/**
 * Get requirements for a template
 */
export async function getTemplateRequirements(
    templateId: string
): Promise<DossierRequirement[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('dossier_requirements')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order');

    if (error) {
        console.error('Error fetching template requirements:', error);
        throw new Error('Failed to fetch requirements');
    }

    return data || [];
}

/**
 * Get document links for the active tenant
 */
export async function getDocumentLinks(): Promise<DocumentLink[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error fetching document links:', error);
        throw new Error('Failed to fetch document links');
    }

    return data || [];
}

/**
 * Link a document to a requirement
 */
export async function linkDocumentToRequirement(
    input: Omit<DocumentLinkInsert, 'tenant_id'>
): Promise<DocumentLink> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    // Use upsert with unique constraint (tenant_id, requirement_id)
    const { data, error } = await supabase
        .from('document_links')
        .upsert({
            tenant_id: tenant.id,
            requirement_id: input.requirement_id,
            document_id: input.document_id,
            status_override: input.status_override,
            created_by: user.id,
        }, {
            onConflict: 'tenant_id,requirement_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating/updating document link:', error);
        throw new Error('Failed to link document');
    }

    revalidatePath('/dashboard/ai/compliance-check');
    return data;
}

/**
 * Remove a document link by ID
 */
export async function removeDocumentLink(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error removing document link:', error);
        throw new Error('Failed to remove document link');
    }

    revalidatePath('/dashboard/ai/compliance-check');
}

/**
 * Remove a document link by requirement ID (unlink)
 * Returns the deleted link info for UI state management
 */
export async function unlinkDocumentFromRequirement(
    requirementId: string
): Promise<{ requirementId: string; deleted: boolean }> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // First, get the link to ensure it exists
    const { data: existingLink, error: fetchError } = await supabase
        .from('document_links')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('requirement_id', requirementId)
        .single();

    if (fetchError || !existingLink) {
        // No link exists - that's fine, return success
        return { requirementId, deleted: false };
    }

    // Delete the link
    const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', existingLink.id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Error unlinking document:', error);
        throw new Error('Failed to unlink document');
    }

    // Log audit event
    await logAuditEvent({
        action: 'document_link.deleted',
        entity_type: 'document_link',
        entity_id: existingLink.id,
        meta: { requirement_id: requirementId },
    });

    revalidatePath('/dashboard/ai/compliance-check');
    return { requirementId, deleted: true };
}

/**
 * Check if document is stale based on recency_days
 * 
 * @param doc The document
 * @param recencyDays Maximum age in days (null = no limit)
 * @returns true if document is too old
 */
function isDocumentStale(doc: Document, recencyDays: number | null): boolean {
    if (!recencyDays) return false; // No recency requirement
    if (!doc.doc_date) return true; // No date = assume stale for dated requirements

    const docDate = new Date(doc.doc_date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - recencyDays);

    return docDate < cutoff;
}

/**
 * Get requirements with their status for a template
 * DETERMINISTIC: This is the core dossier check logic
 * 
 * Status determination:
 * 1. No link → missing
 * 2. Link with status_override → use override
 * 3. Document expired (expires_at < now) → expired
 * 4. Document stale (doc_date older than recency_days) → expired
 * 5. Document status = 'ok' → satisfied
 * 6. Otherwise → needs_review
 */
export async function getRequirementsWithStatus(
    templateId: string
): Promise<RequirementWithStatus[]> {
    const supabase = await createServerSupabaseClient();
    const tenant = await requireActiveTenant();

    // Get requirements
    const requirements = await getTemplateRequirements(templateId);

    // Get all document links for this template's requirements
    const requirementIds = requirements.map(r => r.id);
    const { data: links } = await supabase
        .from('document_links')
        .select(`
      *,
      document:documents(*)
    `)
        .eq('tenant_id', tenant.id)
        .in('requirement_id', requirementIds);

    // Build a map of requirement_id to link data
    const linkMap = new Map<string, { link: DocumentLink; document: Document | null }>();
    (links || []).forEach((link) => {
        linkMap.set(link.requirement_id, {
            link: link,
            document: link.document as Document | null,
        });
    });

    const today = new Date();

    // Process each requirement
    return requirements.map((req): RequirementWithStatus => {
        const linkData = linkMap.get(req.id);
        const doc = linkData?.document || null;
        const docLink = linkData?.link || null;

        // Determine status
        let linkStatus: RequirementWithStatus['linkStatus'] = 'missing';

        if (docLink) {
            // Check status override first
            if (docLink.status_override === 'satisfied') {
                linkStatus = 'satisfied';
            } else if (docLink.status_override === 'rejected') {
                linkStatus = 'missing';
            } else if (docLink.status_override === 'not_sure') {
                linkStatus = 'needs_review';
            } else if (doc) {
                // No override, check document status
                if (doc.status === 'expired') {
                    linkStatus = 'expired';
                } else if (doc.expires_at && new Date(doc.expires_at) < today) {
                    linkStatus = 'expired';
                } else if (isDocumentStale(doc, req.recency_days)) {
                    // CORRECTNESS: Check recency_days against doc_date
                    linkStatus = 'expired';
                } else if (doc.status === 'needs_review') {
                    linkStatus = 'needs_review';
                } else if (doc.status === 'ok') {
                    linkStatus = 'satisfied';
                } else {
                    linkStatus = 'needs_review';
                }
            }
        }

        return {
            ...req,
            linkStatus,
            linkedDocument: doc,
            documentLink: docLink,
        };
    });
}

/**
 * Get dossier check summary for a template
 */
export async function getDossierCheckSummary(
    templateId: string
): Promise<DossierCheckSummary> {
    const requirements = await getRequirementsWithStatus(templateId);

    const summary: DossierCheckSummary = {
        satisfied: 0,
        missing: 0,
        expired: 0,
        needs_review: 0,
        total: requirements.length,
    };

    requirements.forEach((req) => {
        if (!req.required) {
            // Optional requirements count as satisfied if not linked
            if (req.linkStatus === 'missing') {
                summary.satisfied++;
            } else {
                summary[req.linkStatus]++;
            }
        } else {
            summary[req.linkStatus]++;
        }
    });

    return summary;
}

/**
 * MISSING ITEMS GENERATOR
 * 
 * CORRECTNESS: 
 * - Idempotent: Does NOT reset due_at on existing tasks
 * - Respects recency_days via getRequirementsWithStatus
 * - Marks tasks as 'done' when satisfied (doesn't delete)
 * - Only creates/reopens when needed
 * 
 * SECURITY:
 * - Requires Pro plan (missing_items_generator feature)
 * 
 * Returns summary of counts after processing
 */
export async function generateMissingItems(
    templateId: string
): Promise<DossierCheckSummary> {
    const supabase = await createServerSupabaseClient();
    const user = await requireUser();
    const tenant = await requireActiveTenant();

    // GATE: Missing Items Generator requires Pro plan
    // This is also checked in the API route, but we enforce here for direct action calls
    const { assertFeature } = await import('@/lib/auth/plan');
    await assertFeature(tenant.id, 'missing_items_generator');

    // Get requirements with status (includes recency_days logic)
    const requirements = await getRequirementsWithStatus(templateId);

    // Get existing missing_item tasks for this tenant
    const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id, requirement_id, status, due_at')
        .eq('tenant_id', tenant.id)
        .eq('source', 'missing_item');

    const existingTaskMap = new Map<string, {
        id: string;
        status: string;
        due_at: string | null;
    }>();

    (existingTasks || []).forEach(t => {
        if (t.requirement_id) {
            existingTaskMap.set(t.requirement_id, {
                id: t.id,
                status: t.status,
                due_at: t.due_at,
            });
        }
    });

    const today = new Date();
    const defaultDueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    let created = 0;
    let completed = 0;
    let reopened = 0;

    for (const req of requirements) {
        const existingTask = existingTaskMap.get(req.id);
        const isSatisfied = req.linkStatus === 'satisfied';
        const isOptional = !req.required;

        if (isSatisfied || isOptional) {
            // Mark task as done if it exists and is open
            if (existingTask && existingTask.status !== 'done') {
                await supabase
                    .from('tasks')
                    .update({
                        status: 'done',
                        completed_at: today.toISOString(),
                    })
                    .eq('id', existingTask.id);
                completed++;
            }
        } else {
            // Requirement not satisfied - need a task
            const taskTitle = `Ontbrekend: ${req.title}`;
            const priority = req.linkStatus === 'expired' ? 'urgent' : 'normal';

            if (existingTask) {
                if (existingTask.status === 'done') {
                    // Reopen task but DON'T change due_at (idempotency)
                    await supabase
                        .from('tasks')
                        .update({
                            status: 'open',
                            priority,
                            completed_at: null,
                            // IDEMPOTENCY: Keep existing due_at
                        })
                        .eq('id', existingTask.id);
                    reopened++;
                }
                // If already open, don't touch it (idempotency: preserve due_at)
            } else {
                // Create new task
                await supabase
                    .from('tasks')
                    .insert({
                        tenant_id: tenant.id,
                        source: 'missing_item',
                        requirement_id: req.id,
                        title: taskTitle,
                        due_at: defaultDueDate.toISOString(),
                        status: 'open',
                        priority,
                        created_by: user.id,
                    });
                created++;
            }
        }
    }

    // Get updated summary
    const summary = await getDossierCheckSummary(templateId);

    // Log audit event
    await logAuditEvent({
        action: 'missing_items.generated',
        entity_type: 'dossier',
        meta: {
            template_id: templateId,
            created,
            completed,
            reopened,
            missing: summary.missing,
        },
    });

    revalidatePath('/dashboard/ai/compliance-check');
    revalidatePath('/dashboard/calendar');

    return summary;
}
