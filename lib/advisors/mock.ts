import { Advisor, AuditEvent, Message, RequestItem, SharedItem } from "./types";

const now = new Date();
const subtractHours = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const subtractDays = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export const ADVISORS_MOCK: Advisor[] = [
    {
        id: "adv1",
        name: "Jan de Vries",
        email: "jan@agri-accountants.nl",
        role: "Accountant",
        status: "Actief",
        permissions: { docsRead: true, dashboardRead: true, recordsEdit: false, exportsCreate: true, auditRead: false },
        lastActiveAt: subtractHours(2),
        createdAt: subtractDays(180),
        avatarInitials: "JD"
    },
    {
        id: "adv2",
        name: "Petra van Dam",
        email: "p.vandam@stikstof-experts.nl",
        role: "Adviseur",
        status: "Actief",
        permissions: { docsRead: true, dashboardRead: true, recordsEdit: true, exportsCreate: true, auditRead: true },
        lastActiveAt: subtractDays(1),
        createdAt: subtractDays(45),
        avatarInitials: "PV"
    },
    {
        id: "adv3",
        name: "Klaas Jansen",
        email: "k.jansen@agro-juristen.nl",
        role: "Jurist",
        status: "Uitgenodigd",
        permissions: { docsRead: true, dashboardRead: false, recordsEdit: false, exportsCreate: false, auditRead: false },
        lastActiveAt: subtractDays(3),
        createdAt: subtractDays(2),
        avatarInitials: "KJ"
    }
];

export const SHARED_ITEMS_MOCK: SharedItem[] = [
    { id: "si1", title: "Jaaropgave 2023 Concept", type: "Document", advisorId: "adv1", date: subtractHours(4), status: "Nieuw", sizeMb: "2.4 MB" },
    { id: "si2", title: "RVO Pakket Q1 2024", type: "Export", advisorId: "adv1", date: subtractDays(2), status: "Gelezen", sizeMb: "14 MB" },
    { id: "si3", title: "Derogatie Beschikking", type: "Document", advisorId: "adv2", date: subtractDays(5), status: "Te controleren", sizeMb: "0.8 MB" },
    { id: "si4", title: "Mestboekhouding April", type: "Export", advisorId: "adv1", date: subtractDays(10), status: "Gelezen" },
];

export const REQUESTS_MOCK: RequestItem[] = [
    { id: "req1", title: "Controleer Jaaropgave 2023 Concept", description: "Graag controleren op nieuwe stikstofnormen.", advisorId: "adv1", severity: "Urgent", dueDate: subtractDays(-2), status: "Open", assignee: 'Advisor' },
    { id: "req2", title: "Bevestig mesttransporten (april)", description: "VDM's lijken incompleet.", advisorId: "adv2", severity: "Normaal", dueDate: subtractDays(-5), status: "In behandeling", assignee: 'Farmer' },
    { id: "req3", title: "Review pachtovereenkomst", description: "Graag juridische check.", advisorId: "adv3", severity: "Normaal", dueDate: subtractDays(-10), status: "Open", assignee: 'Advisor' },
];

export const AUDIT_MOCK: AuditEvent[] = [
    { id: "aud1", iconKey: "export", message: "J. de Vries heeft Export 'RVO pakket' gedownload", at: subtractHours(1), actorName: "Jan de Vries" },
    { id: "aud2", iconKey: "upload", message: "H. Veenstra (Jij) heeft document 'VDM April' geüpload", at: subtractHours(5), actorName: "H. Veenstra" },
    { id: "aud3", iconKey: "access", message: "Toegang gewijzigd: Exporteren ingeschakeld voor P. van Dam", at: subtractDays(1), actorName: "H. Veenstra" },
    { id: "aud4", iconKey: "invite", message: "Uitnodiging verstuurd naar K. Jansen", at: subtractDays(2), actorName: "H. Veenstra" },
    { id: "aud5", iconKey: "edit", message: "P. van Dam heeft perceelgegevens gewijzigd", at: subtractDays(3), actorName: "Petra van Dam" },
];

export const MESSAGES_MOCK: Message[] = [
    { id: "msg1", advisorId: "adv1", from: "Farmer", text: "Hoi Jan, kun je naar de cijfers van Q1 kijken?", at: subtractDays(3) },
    { id: "msg2", advisorId: "adv1", from: "Advisor", text: "Zeker, ik heb ze gedownload. Ziet er op het eerste gezicht goed uit, maar ik heb nog een vraag over de krachtvoer aankoop.", at: subtractDays(2) },
    { id: "msg3", advisorId: "adv1", from: "Farmer", text: "Die facturen staan nu ook bij Documenten.", at: subtractDays(1) },
];
