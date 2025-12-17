export type AdvisorRole = "Accountant" | "Adviseur" | "Jurist" | "Overig";
export type AdvisorStatus = "Actief" | "Uitgenodigd" | "Verlopen";

export interface AdvisorPermissions {
    docsRead: boolean;
    dashboardRead: boolean;
    recordsEdit: boolean;
    exportsCreate: boolean;
    auditRead: boolean;
}

export interface Advisor {
    id: string;
    name: string;
    email: string;
    role: AdvisorRole;
    status: AdvisorStatus;
    permissions: AdvisorPermissions;
    lastActiveAt: string; // ISO
    createdAt: string; // ISO
    avatarInitials: string;
}

export type SharedItemType = "Document" | "Export" | "Notitie";
export type SharedItemStatus = "Nieuw" | "Gelezen" | "Te controleren";

export interface SharedItem {
    id: string;
    title: string;
    type: SharedItemType;
    advisorId: string;
    date: string; // ISO
    status: SharedItemStatus;
    sizeMb?: string;
}

export type RequestSeverity = "Urgent" | "Normaal";
export type RequestStatus = "Open" | "In behandeling" | "Afgerond";

export interface RequestItem {
    id: string;
    title: string;
    description: string;
    advisorId: string;
    severity: RequestSeverity;
    dueDate: string; // ISO
    status: RequestStatus;
    assignee: 'Farmer' | 'Advisor';
}

export type AuditIconKey = 'upload' | 'export' | 'invite' | 'edit' | 'access';

export interface AuditEvent {
    id: string;
    iconKey: AuditIconKey;
    message: string;
    at: string; // ISO
    actorName: string;
}

export interface Message {
    id: string;
    advisorId: string;
    from: "Farmer" | "Advisor";
    text: string;
    at: string; // ISO
}
