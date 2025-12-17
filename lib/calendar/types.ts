export type CalendarViewType = 'month' | 'week' | 'agenda';

export type ItemType = 'deadline' | 'task' | 'inspection' | 'manure' | 'subsidy' | 'document' | 'legislation';
export type ItemStatus = 'open' | 'in_progress' | 'done';
export type ItemPriority = 'urgent' | 'soon' | 'normal';

export interface LinkedEntity {
    kind: 'dossier' | 'document' | 'perceel' | 'melding';
    id: string;
    label: string;
}

export interface CalendarItem {
    id: string;
    title: string;
    date: Date; // Keep it simple for MVP
    time?: string;
    endDate?: Date;
    type: ItemType;
    status: ItemStatus;
    priority: ItemPriority;
    source: 'manual' | 'regelradar' | 'dossierbouwer' | 'import';
    linkedEntity?: LinkedEntity;
    notes?: string;
    tags?: string[];
}
