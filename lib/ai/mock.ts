import { AuditEvent, ComplianceIssue, ExportBundle, ImpactTask, RegulationUpdate, Scenario } from "./types";

export const REGULATION_MOCK: RegulationUpdate[] = [
    {
        id: "reg1",
        title: "Derogatie afbouw 2025",
        theme: "mest",
        effectiveDate: "2025-01-01",
        severity: "critical",
        summary: "Norm voor zandgronden verlaagd naar 170kg N/ha.",
        impactScore: 85,
        isNew: true
    },
    {
        id: "reg2",
        title: "Bufferstroken Uitbreiding",
        theme: "water",
        effectiveDate: "2024-03-01",
        severity: "high",
        summary: "Nieuwe KRW-doelen vereisen 3m strook langs KRW-waterlichamen.",
        impactScore: 60,
        isNew: false
    },
    {
        id: "reg3",
        title: "GLB Ecoregeling 2025",
        theme: "glb",
        effectiveDate: "2025-01-01",
        severity: "medium",
        summary: "Puntenwaardering voor eiwitgewassen aangepast.",
        impactScore: 40,
        isNew: true
    }
];

export const IMPACT_TASKS_MOCK: ImpactTask[] = [
    { id: 't1', title: 'Bereken nieuwe mestplaatsingsruimte', dueDate: '2024-12-01', urgency: 'urgent' },
    { id: 't2', title: 'Upload nieuwe pachtcontracten', dueDate: '2024-11-15', urgency: 'normal' },
    { id: 't3', title: 'Controleer gewascodes voor bufferstroken', dueDate: '2025-02-01', urgency: 'normal' },
];

export const ISSUES_MOCK: ComplianceIssue[] = [
    { id: 'i1', type: 'Inconsistentie', source: 'Gecombineerde Opgave', description: 'Perceel 12 gewas verschilt van bodemanalyse.', impact: 'Subsidie risico', deadline: '2024-12-31', confidence: 92, status: 'open' },
    { id: 'i2', type: 'Ontbrekend Doc', source: 'Mestboekhouding', description: 'VDM Bon 88392 mist handtekening.', impact: 'Boete risico', deadline: '2024-11-20', confidence: 88, status: 'critical' },
    { id: 'i3', type: 'Deadline', source: 'Stikstof', description: 'Kunstmestruimte bijna overschreden (95%).', impact: 'Gebruiksruimte', deadline: '2024-12-31', confidence: 100, status: 'open' },
];

export const SCENARIOS_MOCK: Scenario[] = [
    { id: 's1', name: 'Inkrimping Vee', createdAt: '2024-10-12', inputs: { cows: -15 }, outputs: { nitrogenSpace: 1200, manureBalance: 50, complianceScore: 98 } },
    { id: 's2', name: 'Aankoop Buurman', createdAt: '2024-11-05', inputs: { land: +12 }, outputs: { nitrogenSpace: 3400, manureBalance: -200, complianceScore: 85 } },
];

export const EXPORTS_MOCK: ExportBundle[] = [
    { id: 'e1', name: 'RVO Pakket 2024', status: 'ready', itemsCount: 12, missingCount: 0, lastGenerated: '2024-11-01' },
    { id: 'e2', name: 'Bank Audit Q3', status: 'incomplete', itemsCount: 8, missingCount: 2, lastGenerated: null },
    { id: 'e3', name: 'NVWA Controle Map', status: 'generating', itemsCount: 24, missingCount: 0, lastGenerated: null },
];

export const AUDIT_MOCK_LOGS: AuditEvent[] = [
    { id: 'a1', actor: 'H. Veenstra', action: 'Login', module: 'Auth', timestamp: '2024-12-14T08:00:00Z', details: 'IP 192.168.1.1' },
    { id: 'a2', actor: 'System AI', action: 'Scan', module: 'RegelRadar', timestamp: '2024-12-14T09:15:00Z', details: 'Nieuwe update gevonden' },
    { id: 'a3', actor: 'J. de Vries (Adv)', action: 'Export', module: 'Mestboekhouding', timestamp: '2024-12-13T14:30:00Z', details: 'Gedownload: VDM rapport' },
];
