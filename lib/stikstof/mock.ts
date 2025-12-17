import { ActionItem, ChangeLogItem, NitrogenKpi, NitrogenPoint, ParcelImpact, UtilizationBreakdown } from "./types";

export const STIKSTOF_KPIS: NitrogenKpi[] = [
    {
        key: "space",
        label: "Beschikbare Stikstofruimte",
        value: "2,450",
        unit: "kg",
        deltaPct: 5.4,
        status: "safe",
        trend: [2200, 2300, 2250, 2400, 2350, 2450],
    },
    {
        key: "utilization",
        label: "Benutting YTD",
        value: "68",
        unit: "%",
        deltaPct: -2.1,
        status: "safe",
        trend: [60, 62, 65, 66, 67, 68],
    },
    {
        key: "forecast",
        label: "Prognose Einde Jaar",
        value: "95",
        unit: "%",
        deltaPct: 12.5,
        status: "warning",
        trend: [85, 88, 90, 92, 94, 95],
    },
    {
        key: "risk",
        label: "Risico Score",
        value: "Low",
        unit: "",
        deltaPct: 0,
        status: "safe",
        trend: [2, 2, 3, 2, 1, 1],
    }
];

export const STIKSTOF_TREND_DATA: NitrogenPoint[] = [
    { date: 'Jan', actual: 400, forecast: 400, norm: 500 },
    { date: 'Feb', actual: 850, forecast: 850, norm: 1000 },
    { date: 'Mrt', actual: 1300, forecast: 1300, norm: 1500 },
    { date: 'Apr', actual: 1800, forecast: 1800, norm: 2000 },
    { date: 'Mei', actual: 2400, forecast: 2400, norm: 2500 },
    { date: 'Jun', actual: 2900, forecast: 2900, norm: 3000 },
    { date: 'Jul', actual: 3300, forecast: 3400, norm: 3500 },
    { date: 'Aug', actual: 0, forecast: 3900, norm: 4000 }, // Future
    { date: 'Sep', actual: 0, forecast: 4400, norm: 4500 },
    { date: 'Okt', actual: 0, forecast: 4800, norm: 5000 },
    { date: 'Nov', actual: 0, forecast: 5100, norm: 5200 },
    { date: 'Dec', actual: 0, forecast: 5300, norm: 5400 },
];

export const BREAKDOWN_DATA: UtilizationBreakdown[] = [
    { label: "Mestplaatsing (Dierlijk)", value: 3200, percentage: 60, color: "#10b981" }, // Emerald 500
    { label: "Kunstmest", value: 1200, percentage: 22, color: "#3b82f6" }, // Blue 500
    { label: "Overige Organisch", value: 600, percentage: 11, color: "#f59e0b" }, // Amber 500
    { label: "Depositie/Overig", value: 300, percentage: 7, color: "#64748b" }, // Slate 500
];

export const PARCEL_IMPACTS: ParcelImpact[] = [
    { id: "p1", name: "Perceel 12 - Achterveld", type: "Grasland", utilizationPct: 88, trendPct: 5, risk: "warning" },
    { id: "p2", name: "Perceel 04 - De Kamp", type: "Bouwland", utilizationPct: 45, trendPct: -2, risk: "safe" },
    { id: "p3", name: "Perceel 09 - Hoge Eng", type: "Grasland", utilizationPct: 95, trendPct: 12, risk: "critical" },
    { id: "p4", name: "Perceel 02 - Beekdal", type: "Natuur", utilizationPct: 12, trendPct: 0, risk: "safe" },
    { id: "p5", name: "Perceel 15 - Nieuw Land", type: "Bouwland", utilizationPct: 60, trendPct: 8, risk: "safe" },
];

export const CHANGELOG: ChangeLogItem[] = [
    { id: "c1", date: "2024-05-12", title: "Nieuwe Derogatie Norm", description: "Norm verlaagd naar 170kg/ha voor zandgronden.", impactLabel: "-15% Ruimte", severity: "high" },
    { id: "c2", date: "2024-05-01", title: "RVO Peildatum Gewijzigd", description: "Definitieve opgave datum verschoven.", impactLabel: "Deadline +2w", severity: "low" },
    { id: "c3", date: "2024-04-15", title: "Nieuw Perceel Toegevoegd", description: "Perceel 15 (4.2ha) toegevoegd aan areaal.", impactLabel: "+714kg Ruimte", severity: "medium" },
];

export const ACTIONS: ActionItem[] = [
    { id: "a1", title: "Upload grondmonster uitslag", description: "Perceel 12 mist recente analyse.", priority: "urgent", ctaLabel: "Uploaden" },
    { id: "a2", title: "Controleer bufferstroken", description: "Nieuwe kaartlaag beschikbaar.", priority: "soon", ctaLabel: "Bekijken" },
    { id: "a3", title: "Genereer RVO pakket", description: "Voorbereiding kwartaalcijfers.", priority: "normal", ctaLabel: "Exporteren" },
];
