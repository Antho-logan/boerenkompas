/**
 * Export Server Actions
 * Handles export generation (HTML index + signed URLs, NO ZIP)
 * 
 * SECURITY: All user content is HTML-escaped to prevent stored XSS
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import type { PlanId } from '@/lib/plans';
import { PLAN_ORDER, hasFeature } from '@/lib/plans';
import { getRequirementsWithStatus, getDossierTemplates } from './dossier';
import { logAuditEvent } from './audit';
import type { Export, ExportWithDetails, RequirementWithStatus } from '@/lib/supabase/types';
import { ExportLimitError } from '@/lib/supabase/errors';

/**
 * SECURITY: HTML escape function to prevent XSS
 * Escapes all special HTML characters in user content
 */
function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolvePlan(plan: string | null | undefined): PlanId {
  if (plan && PLAN_ORDER.includes(plan as PlanId)) {
    return plan as PlanId;
  }
  return 'starter';
}

function getMonthBounds(): { monthStart: string; nextMonthStart: string } {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { monthStart: monthStart.toISOString(), nextMonthStart: nextMonthStart.toISOString() };
}

/**
 * Get all exports for the active tenant
 */
export async function getExports(): Promise<ExportWithDetails[]> {
  const supabase = await createServerSupabaseClient();
  const tenant = await requireActiveTenant();

  const { data, error } = await supabase
    .from('exports')
    .select(`
      *,
      template:dossier_templates(*)
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exports:', error);
    throw new Error('Failed to fetch exports');
  }

  return (data || []) as ExportWithDetails[];
}

/**
 * Generate export HTML with token-based download links
 *
 * SECURITY: All user content is escaped
 */
function generateExportHtml(
  tenantName: string,
  templateName: string,
  templateVersion: string,
  requirements: RequirementWithStatus[],
  generatedAt: Date,
  shareToken: string
): string {
  // SECURITY: Escape all user-provided content
  const safeTenantName = escapeHtml(tenantName);
  const safeTemplateName = escapeHtml(templateName);
  const safeTemplateVersion = escapeHtml(templateVersion);

  const statusLabels = {
    satisfied: { text: 'Voldaan', class: 'status-ok' },
    missing: { text: 'Ontbreekt', class: 'status-missing' },
    expired: { text: 'Verlopen', class: 'status-expired' },
    needs_review: { text: 'Te controleren', class: 'status-review' },
  };

  const categorized = requirements.reduce((acc, req) => {
    if (!acc[req.category]) acc[req.category] = [];
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, RequirementWithStatus[]>);

  const tokenPath = encodeURIComponent(shareToken);

  const categoryHtml = Object.entries(categorized)
    .map(([category, reqs]) => {
      // SECURITY: Escape category name
      const safeCategory = escapeHtml(category);

      const reqsHtml = reqs.map(req => {
        const status = statusLabels[req.linkStatus];
        // SECURITY: Escape all user content
        const safeTitle = escapeHtml(req.title);
        const safeNotes = escapeHtml(req.notes);
        const safeDocTitle = req.linkedDocument ? escapeHtml(req.linkedDocument.title) : '';
        const docId = req.linkedDocument?.id;
        const downloadHref = docId
          ? `/api/share/${tokenPath}/documents/${encodeURIComponent(docId)}/download`
          : '';
        const safeDocId = docId ? escapeHtml(docId) : '';
        const safeDownloadHref = downloadHref ? escapeHtml(downloadHref) : '';

        const docInfo = req.linkedDocument
          ? `<a class="doc-link" data-doc-id="${safeDocId}" href="${safeDownloadHref}" target="_blank" rel="noopener">${safeDocTitle}</a>`
          : '<span class="no-doc">Geen document gekoppeld</span>';

        return `
          <tr class="requirement-row">
            <td class="req-title">
              <strong>${safeTitle}</strong>
              ${safeNotes ? `<br><small class="notes">${safeNotes}</small>` : ''}
            </td>
            <td class="req-status">
              <span class="status-badge ${status.class}">${status.text}</span>
            </td>
            <td class="req-doc">${docInfo}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="category-section">
          <h3>${safeCategory}</h3>
          <table class="requirements-table">
            <thead>
              <tr>
                <th>Vereiste</th>
                <th>Status</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody>
              ${reqsHtml}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  // Count summary
  const summary = requirements.reduce((acc, req) => {
    if (req.required || req.linkStatus !== 'missing') {
      acc[req.linkStatus]++;
    }
    return acc;
  }, { satisfied: 0, missing: 0, expired: 0, needs_review: 0 } as Record<string, number>);

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Index - ${safeTemplateName}</title>
  <style>
    :root {
      --green: #10b981;
      --red: #ef4444;
      --amber: #f59e0b;
      --blue: #3b82f6;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-500: #64748b;
      --slate-700: #334155;
      --slate-900: #0f172a;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6; 
      color: var(--slate-900);
      background: var(--slate-50);
      padding: 2rem;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { 
      background: white; 
      border-radius: 12px; 
      padding: 2rem; 
      margin-bottom: 1.5rem;
      border: 1px solid var(--slate-200);
    }
    .header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .header .meta { color: var(--slate-500); font-size: 0.875rem; }
    .disclaimer {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.875rem;
      color: #1e40af;
      margin-bottom: 1.5rem;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .summary-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      border: 1px solid var(--slate-200);
    }
    .summary-card .value { font-size: 1.5rem; font-weight: 700; }
    .summary-card .label { font-size: 0.75rem; text-transform: uppercase; color: var(--slate-500); }
    .summary-card.ok .value { color: var(--green); }
    .summary-card.missing .value { color: var(--red); }
    .summary-card.expired .value { color: var(--amber); }
    .summary-card.review .value { color: var(--blue); }
    .category-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border: 1px solid var(--slate-200);
    }
    .category-section h3 { 
      font-size: 1rem; 
      margin-bottom: 1rem; 
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--slate-100);
    }
    .requirements-table { width: 100%; border-collapse: collapse; }
    .requirements-table th { 
      text-align: left; 
      font-size: 0.75rem; 
      text-transform: uppercase; 
      color: var(--slate-500);
      padding: 0.75rem 0;
    }
    .requirements-table td { 
      padding: 0.75rem 0; 
      border-top: 1px solid var(--slate-100);
      vertical-align: top;
    }
    .req-title { width: 50%; }
    .req-status { width: 20%; }
    .req-doc { width: 30%; }
    .notes { color: var(--slate-500); }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-ok { background: #d1fae5; color: #065f46; }
    .status-missing { background: #fee2e2; color: #991b1b; }
    .status-expired { background: #fef3c7; color: #92400e; }
    .status-review { background: #dbeafe; color: #1e40af; }
    .doc-link { color: var(--blue); text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
    .no-doc { color: var(--slate-500); font-style: italic; }
    .footer { 
      text-align: center; 
      padding: 2rem; 
      color: var(--slate-500);
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .summary { grid-template-columns: repeat(2, 1fr); }
      body { padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${safeTemplateName}</h1>
      <div class="meta">
        <strong>${safeTenantName}</strong> • Versie ${safeTemplateVersion} • Gegenereerd op ${generatedAt.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
      </div>
    </div>

    <div class="disclaimer">
      <strong>Let op:</strong> BoerenKompas is een dossier-workflow tool. 
      Dit overzicht is geen juridisch advies en biedt geen garantie op een foutloze inspectie. 
      Controleer altijd actuele regelgeving bij de betreffende overheidsinstanties.
    </div>

    <div class="summary">
      <div class="summary-card ok">
        <div class="value">${summary.satisfied}</div>
        <div class="label">Voldaan</div>
      </div>
      <div class="summary-card missing">
        <div class="value">${summary.missing}</div>
        <div class="label">Ontbreekt</div>
      </div>
      <div class="summary-card expired">
        <div class="value">${summary.expired}</div>
        <div class="label">Verlopen</div>
      </div>
      <div class="summary-card review">
        <div class="value">${summary.needs_review}</div>
        <div class="label">Te controleren</div>
      </div>
    </div>

    ${categoryHtml}

    <div class="footer">
      Gegenereerd door BoerenKompas • www.boerenkompas.nl
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Create a new export for a template
 */
export async function createExport(templateId: string): Promise<Export> {
  const supabase = await createServerSupabaseClient();
  const user = await requireUser();
  const tenant = await requireActiveTenant();

  // Determine plan and enforce monthly export limits
  const { data: tenantRow, error: tenantError } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenant.id)
    .single();

  if (tenantError) {
    console.error('Error fetching tenant plan:', tenantError);
    throw new Error('Failed to verify export limits');
  }

  const plan = resolvePlan(tenantRow?.plan);
  const unlimited = hasFeature(plan, 'exports_unlimited') === true;
  const limitValue = hasFeature(plan, 'exports_monthly_limit');
  const monthlyLimit = unlimited ? null : typeof limitValue === 'number' ? limitValue : 0;

  if (!unlimited && monthlyLimit !== null) {
    const { monthStart, nextMonthStart } = getMonthBounds();
    const { count, error: countError } = await supabase
      .from('exports')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart);

    if (countError) {
      console.error('Error counting exports for quota:', countError);
      throw new Error('Failed to verify export limits');
    }

    const used = count ?? 0;
    if (monthlyLimit > 0 && used >= monthlyLimit) {
      throw new ExportLimitError(monthlyLimit, used, monthStart, nextMonthStart);
    }
  }

  // Get template info
  const templates = await getDossierTemplates();
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Get requirements with status
  const requirements = await getRequirementsWithStatus(templateId);

  // Generate share token
  const shareToken = crypto.randomUUID();

  // Generate HTML (with XSS protection + token-based download links)
  const now = new Date();
  const indexHtml = generateExportHtml(
    tenant.name,
    template.name,
    template.version,
    requirements,
    now,
    shareToken
  );

  // Create export record
  const { data, error } = await supabase
    .from('exports')
    .insert({
      tenant_id: tenant.id,
      template_id: templateId,
      title: `${template.name} - ${now.toLocaleDateString('nl-NL')}`,
      index_html: indexHtml,
      share_token: shareToken,
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating export:', error);
    throw new Error('Failed to create export');
  }

  // Log audit event
  await logAuditEvent({
    action: 'export.created',
    entity_type: 'export',
    entity_id: data.id,
    meta: { title: data.title, template: template.name },
  });

  revalidatePath('/dashboard/exports');
  return data;
}

/**
 * Get a single export by ID
 */
export async function getExport(id: string): Promise<ExportWithDetails | null> {
  const supabase = await createServerSupabaseClient();
  const tenant = await requireActiveTenant();

  const { data, error } = await supabase
    .from('exports')
    .select(`
      *,
      template:dossier_templates(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching export:', error);
    throw new Error('Failed to fetch export');
  }

  return data as ExportWithDetails;
}

/**
 * Get export by share token (public access)
 */
export async function getExportByToken(token: string): Promise<Export | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .eq('share_token', token)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching export by token:', error);
    return null;
  }

  return data;
}

/**
 * Delete an export
 */
export async function deleteExport(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const tenant = await requireActiveTenant();

  const { error } = await supabase
    .from('exports')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (error) {
    console.error('Error deleting export:', error);
    throw new Error('Failed to delete export');
  }

  revalidatePath('/dashboard/exports');
}

/**
 * Get signed URLs for documents in an export
 * This is called when viewing an export to inject fresh signed URLs
 */
export async function getExportDocumentUrls(
  exportId: string
): Promise<Record<string, string>> {
  const supabase = await createServerSupabaseClient();
  const tenant = await requireActiveTenant();

  // Get export
  const exp = await getExport(exportId);
  if (!exp) {
    throw new Error('Export not found');
  }

  // Extract document IDs from HTML (data-doc-id attributes)
  const docIdMatches = exp.index_html.matchAll(/data-doc-id="([^"]+)"/g);
  const docIds = [...docIdMatches].map(m => m[1]);

  if (docIds.length === 0) {
    return {};
  }

  // Get documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, storage_key')
    .eq('tenant_id', tenant.id)
    .in('id', docIds);

  // Generate signed URLs (15 minutes)
  const urls: Record<string, string> = {};
  for (const doc of docs || []) {
    if (doc.storage_key) {
      const { data } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(doc.storage_key, 900);

      if (data?.signedUrl) {
        urls[doc.id] = data.signedUrl;
      }
    }
  }

  return urls;
}
