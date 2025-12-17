export type ManureAmountType = 'Productie' | 'Aanvoer' | 'Afvoer' | 'Plaatsing' | 'Opslag';
export type DocStatus = 'ok' | 'missing' | 'review';
export type Severity = 'low' | 'medium' | 'high';

export interface MestKpi {
    key: string;
    label: string;
    value: string;
    unit: string;
    deltaPct: number;
    status: 'safe' | 'warning' | 'critical';
    trend: number[];
}

export interface BalancePoint {
    date: string; // ISO or Label
    productie: number;
    aanvoer: number;
    afvoer: number;
    netto: number;
}

export interface PlacementPoint {
    label: string;
    grasland: number;
    bouwland: number;
    mais: number;
    overig: number;
    norm: number;
}

export interface ActivityPoint {
    day: string;
    vdm: number;
    opslag: number;
    plaatsing: number;
    analyse: number;
}

export interface LedgerRecord {
    id: string;
    date: string;
    type: ManureAmountType;
    amountTon: number;
    nKg?: number;
    pKg?: number;
    counterparty?: string;
    docStatus: DocStatus;
    notes?: string;
}

export interface CheckItem {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    ctaLabel: string;
    linkedRecordId?: string;
}
