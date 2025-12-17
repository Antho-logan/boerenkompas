import {
    Tenant, User, Membership, KPI, Task,
    Document, AuditEvent, Notification, AICheck
} from '@/lib/types';
import { addDays, subDays, format } from 'date-fns';

// 1. Tenants & Users
export const MOCK_TENANTS: Tenant[] = [
    { id: 't-1', name: 'Maatschap Jansen', plan: 'pro', logoUrl: '/placeholder-farm-1.jpg', kvk: '12345678' },
    { id: 't-2', name: 'De Vries Agro', plan: 'plus', logoUrl: '/placeholder-farm-2.jpg', kvk: '87654321' },
];

export const MOCK_USER: User = {
    id: 'u-1',
    name: 'Jan de Boer',
    email: 'jan@jansen.nl',
    avatarUrl: 'https://github.com/shadcn.png', // Placeholder
};

export const MOCK_MEMBERSHIPS: Membership[] = [
    { userId: 'u-1', tenantId: 't-1', role: 'owner' },
    { userId: 'u-1', tenantId: 't-2', role: 'viewer' }, // Jan mag meekijken bij buurman/partner
];

// 2. Dashboard Data (KPIs)
export const MOCK_KPIS: Record<string, KPI[]> = {
    't-1': [
        { id: 'k-1', label: 'Stikstofruimte', value: 1450, unit: 'kg', target: 2500, status: 'good', trend: 5 },
        { id: 'k-2', label: 'Mestafzet', value: 80, unit: 'ton', target: 120, status: 'warning', trend: -10 },
        { id: 'k-3', label: 'Melkproductie', value: 28500, unit: 'L/wk', status: 'good', trend: 2 },
    ],
    't-2': [
        { id: 'k-4', label: 'Stikstofruimte', value: 200, unit: 'kg', target: 2200, status: 'critical', trend: -15 },
        { id: 'k-5', label: 'Mestafzet', value: 300, unit: 'ton', target: 300, status: 'good', trend: 0 },
    ]
};

// 3. Tasks & Deadlines
export const MOCK_TASKS: Task[] = [
    { id: 'tk-1', title: 'Gecombineerde Opgave controleren', dueDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), completed: false, priority: 'high' },
    { id: 'tk-2', title: 'Mesttransport aanmelden', dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), completed: true, priority: 'medium' },
    { id: 'tk-3', title: 'Jaarrekening doorsturen', dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), completed: false, priority: 'low' },
];

// 4. Documents
export const MOCK_DOCS: Document[] = [
    { id: 'd-1', filename: 'Kringloopwijzer_2024.pdf', uploadDate: '2024-02-10', status: 'valid', url: '#', tags: [{ id: 'tg-1', label: 'Stikstof', color: 'blue' }] },
    { id: 'd-2', filename: 'RVO_Brief_Mei.pdf', uploadDate: '2024-05-12', status: 'missing_info', url: '#', tags: [{ id: 'tg-2', label: 'RVO', color: 'orange' }] },
];

// 5. Audit Log
export const MOCK_AUDIT_LOG: AuditEvent[] = [
    { id: 'ev-1', timestamp: new Date().toISOString(), action: 'LOGIN', actorName: 'Jan de Boer', actorRole: 'owner', details: 'Ingelogd vanaf IP 192.168.1.1', severity: 'info' },
    { id: 'ev-2', timestamp: subDays(new Date(), 1).toISOString(), action: 'EXPORT_GENERATED', actorName: 'Pieter Adviseur', actorRole: 'advisor', details: 'Export Stikstof 2024 gegenereerd', severity: 'info' },
    { id: 'ev-3', timestamp: subDays(new Date(), 2).toISOString(), action: 'SETTINGS_CHANGED', actorName: 'Jan de Boer', actorRole: 'owner', details: 'Bedrijfsnaam gewijzigd', severity: 'warning' },
];

// 6. Notifications
export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n-1', title: 'Nieuwe RVO brief', message: 'Er staat een nieuwe brief klaar in Mijn Documenten.', timestamp: new Date().toISOString(), read: false, type: 'info' },
    { id: 'n-2', title: 'Stikstofruimte kritiek', message: 'Je nadert de 90% van je gebruiksruimte.', timestamp: subDays(new Date(), 1).toISOString(), read: false, type: 'alert' },
];

// 7. AI Checks
export const MOCK_AI_CHECKS: AICheck[] = [
    {
        id: 'ai-1',
        title: 'Mestboekhouding Consistentie',
        severity: 'low',
        summary: 'De afgevoerde tonnen komen overeen met de VDM export, maar wijken licht af van de productieprognose.',
        confidence: 92,
        evidence: {
            rules: [{ ruleset_version_id: 'v2024.1', title: 'Meststoffenwet Art 12', url: 'https://wetten.overheid.nl/' }],
            docs: [{ document_id: 'd-1', filename: 'Kringloopwijzer_2024.pdf', pageNumber: 4 }]
        }
    },
    {
        id: 'ai-2',
        title: 'Bufferstrook Overtreding Risico',
        severity: 'medium',
        summary: 'Op perceel 12 lijkt een teeltactiviteit gemeld binnen de 3 meter bufferstrook zone volgens satellietdata.',
        confidence: 78,
        evidence: {
            rules: [{ ruleset_version_id: 'glb-2024', title: 'GLB Bufferstroken regeling' }],
            docs: []
        }
    },
    {
        id: 'ai-3',
        title: 'Ontbrekende Factuur Voer',
        severity: 'high',
        summary: 'In de kringloopwijzer wordt 12 ton krachtvoer genoemd, maar er is geen bijbehorende inkoopfactuur gevonden.',
        confidence: 95,
        evidence: {
            rules: [],
            docs: [{ document_id: 'd-1', filename: 'Kringloopwijzer_2024.pdf' }]
        }
    }
];
