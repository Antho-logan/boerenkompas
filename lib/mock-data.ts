export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KPI {
    id: string;
    title: string;
    value: string;
    suffix?: string;
    target?: string;
    trend: string;
    trendDirection: TrendDirection;
    history: number[]; // For sparkline
    alert?: boolean;
}

export const DASHBOARD_DATA = {
    kpis: [
        {
            id: 'stikstof',
            title: 'Est. Stikstofruimte',
            value: '2,450',
            suffix: 'kg',
            target: 'Resterend',
            trend: '+5.4%',
            trendDirection: 'up' as TrendDirection,
            history: [40, 42, 45, 40, 38, 50, 55, 60, 58, 65, 70, 75],
        },
        {
            id: 'mestafzet',
            title: 'Mestafzet & Verwerking',
            value: '140',
            suffix: 'ton',
            target: 'vs 200t prognose',
            trend: '-12%',
            trendDirection: 'down' as TrendDirection,
            history: [80, 75, 70, 65, 60, 55, 50, 45, 40, 42, 38, 35],
            alert: true,
        },
        {
            id: 'compliance',
            title: 'Compliance Score',
            value: '98',
            suffix: '/100',
            target: 'Audit Ready',
            trend: 'Stabiel',
            trendDirection: 'neutral' as TrendDirection,
            history: [90, 92, 94, 95, 95, 96, 96, 97, 98, 98, 98, 98],
        },
        {
            id: 'meldingen',
            title: 'Open Meldingen',
            value: '3',
            suffix: '',
            target: '1 Urgent',
            trend: '-2',
            trendDirection: 'up' as TrendDirection, // Good
            history: [5, 6, 8, 7, 5, 4, 3, 4, 3, 2, 4, 3],
        }
    ],
    charts: {
        stikstof: {
            labels: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
            realisatie: [15, 35, 25, 45, 35, 55, 50, 65, 60, 80, 85, 90],
            norm: [20, 30, 40, 50, 60, 70, 75, 80, 85, 85, 90, 95],
        },
        mest: {
            labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
            data: [120, 150, 130, 180, 90, 110, 140, 160],
        }
    },
    tasks: [
        { id: 1, title: "Grondmonsters perceel 12", due: "Vandaag", urgency: "high", status: "open" },
        { id: 2, title: "Mesttransport bevestigen", due: "Morgen", urgency: "medium", status: "open" },
        { id: 3, title: "Bufferstrook check", due: "3 dagen", urgency: "low", status: "open" },
        { id: 4, title: "Jaaropgave accountant", due: "Volgende week", urgency: "low", status: "open" },
    ],
    updates: [
        { id: 1, title: "Afbouw Derogatie 2025", desc: "Verwachte daling mestplaatsingsruimte: 15%.", type: "critical" },
        { id: 2, title: "RVO Peildatum Update", desc: "Controleer uw gewaspercelen voor 15 mei.", type: "info" },
    ]
};
