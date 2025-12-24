export type DocCategory =
    | "RVO_GLB"
    | "MEST"
    | "STIKSTOF"
    | "NVWA"
    | "SUBSIDIES"
    | "ACCOUNTANT_BANK"
    | "CONTRACTEN"
    | "VERGUNNINGEN"
    | "ADMINISTRATIE"
    | "INSPECTIES_CERTIFICATEN"
    | "KAARTEN_METINGEN"
    | "OVERIG";

export type DocStatus = "ok" | "needs_review" | "missing_info" | "expired";
export type DocPriority = "urgent" | "soon" | "normal";

export interface DocumentItem {
    id: string;
    title: string;
    filename: string;
    category: DocCategory;
    folder?: string;
    docType: "PDF" | "IMAGE" | "DOC" | "XLS" | "OTHER";
    year: number;
    status: DocStatus;
    priority: DocPriority;
    source: "manual" | "regelradar" | "dossierbouwer" | "export" | "advisor";
    linkedEntities?: {
        kind: "perceel" | "melding" | "registratie" | "audit" | "subsidie" | "accountant";
        id: string;
        label: string
    }[];
    uploadedAt: string; // ISO
    updatedAt: string; // ISO
    tags: string[];
    notes?: string;
    isPinned?: boolean;
}

export const DOC_CATEGORIES: { value: DocCategory; label: string; color: string }[] = [
    { value: "RVO_GLB", label: "RVO & GLB", color: "bg-blue-500" },
    { value: "MEST", label: "Mest", color: "bg-amber-600" },
    { value: "STIKSTOF", label: "Stikstof", color: "bg-emerald-600" },
    { value: "NVWA", label: "NVWA & Controles", color: "bg-red-500" },
    { value: "SUBSIDIES", label: "Subsidies", color: "bg-purple-500" },
    { value: "ACCOUNTANT_BANK", label: "Bank & Financiering", color: "bg-slate-700" },
    { value: "CONTRACTEN", label: "Contracten", color: "bg-gray-500" },
    { value: "VERGUNNINGEN", label: "Vergunningen", color: "bg-emerald-700" },
    { value: "ADMINISTRATIE", label: "Administratie", color: "bg-slate-500" },
    { value: "INSPECTIES_CERTIFICATEN", label: "Inspecties & Certificaten", color: "bg-rose-500" },
    { value: "KAARTEN_METINGEN", label: "Kaarten & Metingen", color: "bg-blue-600" },
    { value: "OVERIG", label: "Overige", color: "bg-gray-400" },
];
