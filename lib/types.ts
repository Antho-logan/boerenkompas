import { PlanId } from './plans';

export type Role = 'owner' | 'advisor' | 'staff' | 'viewer';

export interface Tenant {
    id: string;
    name: string;
    plan: PlanId;
    logoUrl?: string;
    kvk?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface Membership {
    userId: string;
    tenantId: string;
    role: Role;
}

// Data Models
export interface KPI {
    id: string;
    label: string;
    value: number;
    unit: string;
    target?: number;
    trend?: number; // percentage change
    status: 'good' | 'warning' | 'critical';
}

export interface Task {
    id: string;
    title: string;
    dueDate: string; // ISO date
    completed: boolean;
    assignedTo?: string; // userId
    priority: 'low' | 'medium' | 'high';
}

export interface DeadlineEvent {
    id: string;
    title: string;
    date: string;
    type: 'rvo' | 'nvwa' | 'glb' | 'internal';
    completed: boolean;
}

export interface DocumentTag {
    id: string;
    label: string;
    color: string;
}

export interface Document {
    id: string;
    filename: string;
    uploadDate: string;
    status: 'valid' | 'invalid' | 'missing_info' | 'pending';
    tags: DocumentTag[];
    url: string;
}

export interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    actorName: string; // denormalized for easier display
    actorRole: Role;
    details: string;
    severity: 'info' | 'warning' | 'alert';
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'alert' | 'info' | 'success';
}

export interface RuleRef {
    ruleset_version_id: string;
    title: string;
    url?: string;
}

export interface DocRef {
    document_id: string;
    filename: string;
    pageNumber?: number;
}

export interface AICheck {
    id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    summary: string;
    confidence: number; // 0-100
    evidence: {
        rules: RuleRef[];
        docs: DocRef[];
    };
}
