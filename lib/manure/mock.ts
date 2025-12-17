import { BalancePoint, CheckItem, LedgerRecord, MestKpi, PlacementPoint, ActivityPoint } from "./types";

export const MEST_KPIS: MestKpi[] = [
    {
        key: "prod",
        label: "Mestproductie (YTD)",
        value: "1,240",
        unit: "ton",
        deltaPct: 2.1,
        status: "safe",
        trend: [1100, 1150, 1180, 1210, 1225, 1240],
    },
    {
        key: "supply",
        label: "Aanvoer (Periode)",
        value: "350",
        unit: "ton",
        deltaPct: 15.4,
        status: "warning",
        trend: [100, 150, 200, 250, 300, 350],
    },
    {
        key: "discharge",
        label: "Afvoer (Periode)",
        value: "890",
        unit: "ton",
        deltaPct: -5.2,
        status: "safe",
        trend: [800, 820, 850, 870, 880, 890],
    },
    {
        key: "balance",
        label: "Netto Balans",
        value: "+700",
        unit: "ton",
        deltaPct: 0.5,
        status: "safe",
        trend: [600, 620, 640, 660, 680, 700],
    }
];

export const BALANCE_DATA: BalancePoint[] = [
    { date: 'Jan', productie: 100, aanvoer: 20, afvoer: 50, netto: 70 },
    { date: 'Feb', productie: 110, aanvoer: 30, afvoer: 60, netto: 80 },
    { date: 'Mrt', productie: 105, aanvoer: 25, afvoer: 55, netto: 75 },
    { date: 'Apr', productie: 120, aanvoer: 40, afvoer: 70, netto: 90 },
    { date: 'Mei', productie: 115, aanvoer: 35, afvoer: 65, netto: 85 },
    { date: 'Jun', productie: 125, aanvoer: 45, afvoer: 80, netto: 90 },
    { date: 'Jul', productie: 130, aanvoer: 50, afvoer: 90, netto: 90 },
    { date: 'Aug', productie: 120, aanvoer: 40, afvoer: 80, netto: 80 },
    { date: 'Sep', productie: 110, aanvoer: 30, afvoer: 70, netto: 70 },
    { date: 'Okt', productie: 0, aanvoer: 0, afvoer: 0, netto: 0 },
    { date: 'Nov', productie: 0, aanvoer: 0, afvoer: 0, netto: 0 },
    { date: 'Dec', productie: 0, aanvoer: 0, afvoer: 0, netto: 0 },
];

export const PLACEMENT_DATA: PlacementPoint[] = [
    { label: 'Q1', grasland: 150, bouwland: 50, mais: 20, overig: 10, norm: 250 },
    { label: 'Q2', grasland: 200, bouwland: 80, mais: 40, overig: 20, norm: 350 },
    { label: 'Q3', grasland: 180, bouwland: 70, mais: 30, overig: 15, norm: 300 },
    { label: 'Q4', grasland: 0, bouwland: 0, mais: 0, overig: 0, norm: 100 },
];

export const ACTIVITY_DATA: ActivityPoint[] = Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    vdm: (i % 5) + 1,
    opslag: (i % 3),
    plaatsing: (i % 7),
    analyse: (i % 2),
}));

export const LEDGER_MOCK: LedgerRecord[] = [
    { id: '1', date: '2024-05-12', type: 'Productie', amountTon: 45, notes: 'Melkvee', docStatus: 'ok' },
    { id: '2', date: '2024-05-10', type: 'Afvoer', amountTon: 32, counterparty: 'Biogas BV', docStatus: 'ok' },
    { id: '3', date: '2024-05-08', type: 'Productie', amountTon: 42, notes: 'Melkvee', docStatus: 'ok' },
    { id: '4', date: '2024-05-05', type: 'Aanvoer', amountTon: 28, counterparty: 'Buurman Jansen', docStatus: 'missing' },
    { id: '5', date: '2024-05-01', type: 'Plaatsing', amountTon: 50, notes: 'Perceel 12', docStatus: 'ok' },
    { id: '6', date: '2024-04-28', type: 'Afvoer', amountTon: 30, counterparty: 'Biogas BV', docStatus: 'review' },
    { id: '7', date: '2024-04-25', type: 'Productie', amountTon: 40, notes: 'Melkvee', docStatus: 'ok' },
    { id: '8', date: '2024-04-20', type: 'Opslag', amountTon: 100, notes: 'Silo 2', docStatus: 'ok' },
];

export const CHECKS_MOCK: CheckItem[] = [
    { id: 'c1', title: 'VDM ontbreekt', description: 'Transport 05-05 van Jansen', severity: 'high', ctaLabel: 'Uploaden' },
    { id: 'c2', title: 'Analyse verlopen', description: 'Analyseraapport mestkelder 1', severity: 'medium', ctaLabel: 'Vernieuwen' },
    { id: 'c3', title: 'Afwijkende hoeveelheid', description: 'Productie P3 hoger dan norm', severity: 'low', ctaLabel: 'Checken' },
];
