export type SituationStatus = 'safe' | 'warning' | 'critical';

export interface NitrogenKpi {
    key: string;
    label: string;
    value: string;
    unit: string;
    deltaPct: number;
    status: SituationStatus;
    trend: number[]; // For sparkline
}

export interface NitrogenPoint {
    date: string; // ISO date or Label
    actual: number;
    forecast: number;
    norm: number;
}

export interface UtilizationBreakdown {
    label: string;
    value: number; // kg
    percentage: number;
    color: string;
}

export interface ParcelImpact {
    id: string;
    name: string;
    type: 'Grasland' | 'Bouwland' | 'Natuur';
    utilizationPct: number;
    trendPct: number;
    risk: SituationStatus;
}

export interface ChangeLogItem {
    id: string;
    date: string;
    title: string;
    description: string;
    impactLabel: string;
    severity: 'low' | 'medium' | 'high';
}

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'urgent' | 'soon' | 'normal';
    ctaLabel: string;
}
