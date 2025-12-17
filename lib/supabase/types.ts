/**
 * Supabase Database Types for BoerenKompas
 * Generated from schema - keep in sync with migrations
 */

// ============================================================================
// ENUMS
// ============================================================================

export type TenantRole = 'owner' | 'advisor' | 'staff';

export type DocumentStatus = 'ok' | 'needs_review' | 'expired' | 'missing';

export type TaskStatus = 'open' | 'done' | 'snoozed';

export type TaskPriority = 'low' | 'normal' | 'urgent';

export type TaskSource = 'missing_item' | 'manual';

export type PermitStatusConfidence = 'stable' | 'uncertain' | 'in_process';

export type PriorityMode = 'inspection_ready' | 'financing_ready' | 'subsidy_ready';

export type DocumentLinkStatus = 'satisfied' | 'not_sure' | 'rejected';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Tenant {
    id: string;
    name: string;
    created_at: string;
    created_by: string | null;
}

export interface TenantInsert {
    id?: string;
    name: string;
    created_by?: string | null;
}

export interface TenantMember {
    tenant_id: string;
    user_id: string;
    role: TenantRole;
    created_at: string;
}

export interface TenantMemberInsert {
    tenant_id: string;
    user_id: string;
    role: TenantRole;
}

export interface TenantProfile {
    tenant_id: string;
    farm_type: string | null;
    legal_entity_type: string | null;
    province: string | null;
    municipality: string | null;
    primary_contact: string | null;
    advisor_contact: string | null;
    locations_count: number | null;
    hectares_total: number | null;
    hectares_owned: number | null;
    hectares_leased: number | null;
    parcels_reference: string | null;
    livestock_categories_present: Record<string, boolean> | null;
    livestock_scale_band: string | null;
    manure_storage_present: boolean | null;
    manure_storage_type: string | null;
    manure_processing_or_export: boolean | null;
    glb_cap_participation: boolean | null;
    bank_involved: boolean | null;
    bank_name: string | null;
    last_inspection_date: string | null;
    permit_status_confidence: PermitStatusConfidence | null;
    priority_mode: PriorityMode | null;
    updated_at: string;
    updated_by: string | null;
}

export interface TenantProfileUpdate {
    farm_type?: string | null;
    legal_entity_type?: string | null;
    province?: string | null;
    municipality?: string | null;
    primary_contact?: string | null;
    advisor_contact?: string | null;
    locations_count?: number | null;
    hectares_total?: number | null;
    hectares_owned?: number | null;
    hectares_leased?: number | null;
    parcels_reference?: string | null;
    livestock_categories_present?: Record<string, boolean> | null;
    livestock_scale_band?: string | null;
    manure_storage_present?: boolean | null;
    manure_storage_type?: string | null;
    manure_processing_or_export?: boolean | null;
    glb_cap_participation?: boolean | null;
    bank_involved?: boolean | null;
    bank_name?: string | null;
    last_inspection_date?: string | null;
    permit_status_confidence?: PermitStatusConfidence | null;
    priority_mode?: PriorityMode | null;
}

export interface Document {
    id: string;
    tenant_id: string;
    title: string;
    file_name: string;
    mime_type: string | null;
    size_bytes: number | null;
    storage_key: string;
    category: string;
    status: DocumentStatus;
    doc_date: string | null;
    expires_at: string | null;
    tags: string[];
    summary: string | null;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface DocumentInsert {
    id?: string;
    tenant_id: string;
    title: string;
    file_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    storage_key: string;
    category?: string;
    status?: DocumentStatus;
    doc_date?: string | null;
    expires_at?: string | null;
    tags?: string[];
    summary?: string | null;
}

export interface DocumentUpdate {
    title?: string;
    category?: string;
    status?: DocumentStatus;
    doc_date?: string | null;
    expires_at?: string | null;
    tags?: string[];
    summary?: string | null;
}

export interface DossierTemplate {
    id: string;
    name: string;
    version: string;
    is_active: boolean;
    created_at: string;
}

export interface DossierRequirement {
    id: string;
    template_id: string;
    code: string;
    title: string;
    category: string;
    recency_days: number | null;
    required: boolean;
    notes: string | null;
    sort_order: number;
    created_at: string;
}

export interface DocumentLink {
    id: string;
    tenant_id: string;
    document_id: string | null;
    requirement_id: string;
    status_override: DocumentLinkStatus | null;
    created_at: string;
    created_by: string | null;
}

export interface DocumentLinkInsert {
    tenant_id: string;
    document_id?: string | null;
    requirement_id: string;
    status_override?: DocumentLinkStatus | null;
}

export interface Task {
    id: string;
    tenant_id: string;
    source: TaskSource;
    requirement_id: string | null;
    title: string;
    due_at: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    created_at: string;
    created_by: string | null;
    completed_at: string | null;
}

export interface TaskInsert {
    tenant_id: string;
    source?: TaskSource;
    requirement_id?: string | null;
    title: string;
    due_at?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
}

export interface TaskUpdate {
    title?: string;
    due_at?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    completed_at?: string | null;
}

export interface Export {
    id: string;
    tenant_id: string;
    template_id: string | null;
    title: string;
    index_html: string;
    share_token: string | null;
    expires_at: string | null;
    created_at: string;
    created_by: string | null;
}

export interface ExportInsert {
    tenant_id: string;
    template_id?: string | null;
    title: string;
    index_html: string;
    share_token?: string | null;
    expires_at?: string | null;
}

export interface AuditLog {
    id: string;
    tenant_id: string | null;
    actor_user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    meta: Record<string, unknown>;
    created_at: string;
}

export interface AuditLogInsert {
    tenant_id: string;
    action: string;
    entity_type?: string | null;
    entity_id?: string | null;
    meta?: Record<string, unknown>;
}

// ============================================================================
// VIEW TYPES (for UI)
// ============================================================================

export interface TenantWithRole extends Tenant {
    role: TenantRole;
}

export interface RequirementWithStatus extends DossierRequirement {
    // Computed fields for UI
    linkStatus: 'satisfied' | 'missing' | 'expired' | 'needs_review';
    linkedDocument: Document | null;
    documentLink: DocumentLink | null;
}

export interface DossierCheckSummary {
    satisfied: number;
    missing: number;
    expired: number;
    needs_review: number;
    total: number;
}

export interface TaskWithRequirement extends Task {
    requirement?: DossierRequirement | null;
}

export interface ExportWithDetails extends Export {
    template?: DossierTemplate | null;
}

// ============================================================================
// USER TYPES (from Supabase Auth)
// ============================================================================

export interface AuthUser {
    id: string;
    email: string | null;
    user_metadata: {
        full_name?: string;
        avatar_url?: string;
    };
}

export interface CurrentUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}
