export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RegulationUpdate {
    id: string;
    title: string;
    theme: 'stikstof' | 'mest' | 'water' | 'glb';
    effectiveDate: string; // ISO
    severity: Severity;
    summary: string;
    impactScore: number; // 0-100
    sourceLink?: string;
    isNew: boolean;
}

export interface ImpactTask {
    id: string;
    title: string;
    dueDate: string;
    urgency: 'normal' | 'urgent';
}

export interface ComplianceIssue {
    id: string;
    type: string;
    source: string;
    description: string;
    impact: string;
    deadline: string;
    confidence: number;
    status: 'open' | 'critical' | 'resolved';
}

export interface Scenario {
    id: string;
    name: string;
    createdAt: string;
    inputs: Record<string, unknown>;
    outputs: {
        nitrogenSpace: number;
        manureBalance: number;
        complianceScore: number;
    };
}

export interface ExportBundle {
    id: string;
    name: string;
    status: 'ready' | 'incomplete' | 'generating';
    itemsCount: number;
    missingCount: number;
    lastGenerated: string | null;
}

export interface AuditEvent {
    id: string;
    actor: string;
    action: string;
    module: string;
    timestamp: string;
    details: string;
}
