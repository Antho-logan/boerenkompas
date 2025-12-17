import { CalendarItem } from "./types";

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

// Helper to create date relative to today
const getDate = (dayOffset: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    return d;
};

// Fixed date helper
const getFixedDate = (day: number) => new Date(currentYear, currentMonth, day);

export const CALENDAR_Mock: CalendarItem[] = [
    {
        id: "1",
        title: "Grondmonsters uploaden perceel 12",
        date: getDate(2), // In 2 days
        type: "deadline",
        status: "open",
        priority: "urgent",
        source: "dossierbouwer",
        linkedEntity: { kind: "perceel", id: "p12", label: "Perceel 12 - Achterveld" },
        notes: "Nodig voor fosfaatdifferentiatie 2024.",
    },
    {
        id: "2",
        title: "Mesttransport bevestigen (RVO)",
        date: getDate(0), // Today
        time: "14:00",
        type: "manure",
        status: "open",
        priority: "urgent",
        source: "import",
        linkedEntity: { kind: "melding", id: "m55", label: "Vdm nr. 88392" }
    },
    {
        id: "3",
        title: "Bufferstroken controleren",
        date: getDate(5),
        type: "inspection",
        status: "open",
        priority: "normal",
        source: "regelradar",
    },
    {
        id: "4",
        title: "GLB subsidie peildatum",
        date: getFixedDate(15),
        type: "subsidy",
        status: "open",
        priority: "normal",
        source: "manual",
    },
    {
        id: "5",
        title: "NVWA controle – voorbereiding",
        date: getDate(10),
        type: "inspection",
        status: "in_progress",
        priority: "normal",
        source: "manual",
        notes: "Map met facturen klaarleggen."
    },
    {
        id: "6",
        title: "Jaaropgave accountant export",
        date: getDate(-2), // Past
        type: "task",
        status: "done",
        priority: "normal",
        source: "dossierbouwer",
    },
    {
        id: "7",
        title: "Nieuwe derogatie voorwaarden impact",
        date: getDate(1),
        type: "legislation",
        status: "open",
        priority: "soon",
        source: "regelradar",
        notes: "Berekening maken met nieuwe normen."
    },
    // Some future items to fill the month
    {
        id: "8",
        title: "Drijfmest uitrijden (Start)",
        date: getFixedDate(16),
        type: "manure",
        status: "open",
        priority: "normal",
        source: "manual"
    },
    {
        id: "9",
        title: "KvK gegevens check",
        date: getFixedDate(22),
        type: "task",
        status: "open",
        priority: "normal",
        source: "manual"
    }
];
