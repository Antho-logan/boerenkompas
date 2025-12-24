"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Upload,
    FileText,
    CheckCircle2,
    Info,
    X,
    Download,
    Trash2,
    ExternalLink,
    AlertCircle,
    FileSearch,
    Lock,
    Pencil,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTenant } from "@/components/app/TenantProvider"
import DashboardPage from "@/components/app/DashboardPage"
import { DOC_CATEGORIES, DocCategory } from "@/lib/documents/types"
import type { Document } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

// --- Config & Constants ---

type UploadCategory = {
    value: DocCategory
    title: string
    reasons: string[]
    examples: string
    important?: string
}

const UPLOAD_CATEGORIES: UploadCategory[] = [
    {
        value: "ACCOUNTANT_BANK",
        title: "Bank & Financiering",
        reasons: [
            "Nodig voor audit trail richting financiers.",
            "Sneller inzicht in liquiditeit en ratio's.",
            "Sterke onderbouwing bij kredietaanvragen.",
        ],
        examples: "PDF, JPG, scans, statements, jaarcijfers",
        important: "Zet altijd datum/nummer zichtbaar op de scan.",
    },
    {
        value: "VERGUNNINGEN",
        title: "Vergunningen",
        reasons: [
            "Nodig om eisen op 'voldaan' te zetten.",
            "Automatische reminders voor verlenging.",
            "Onderbouwing bij controles en audits.",
        ],
        examples: "Omgevingsvergunning, watervergunning, meldingen",
    },
    {
        value: "MEST",
        title: "Mest",
        reasons: [
            "Nodig voor mestboekhouding en gebruiksnormen.",
            "Automatisch vullen van aan- en afvoer.",
            "Controle op analyses en VDM's.",
        ],
        examples: "VDM, mestbonnen, analyseverslagen, BEM",
    },
    {
        value: "STIKSTOF",
        title: "Stikstof",
        reasons: [
            "Input voor AERIUS en stikstofdossier.",
            "Bewijs voor natuur- en depositie-eisen.",
            "Onderbouwing bij vergunningverlening.",
        ],
        examples: "AERIUS-berekeningen, rapporten, kaartmateriaal",
    },
    {
        value: "CONTRACTEN",
        title: "Contracten",
        reasons: [
            "Overzicht van looptijden en opzegdata.",
            "Koppeling met percelen en verplichtingen.",
            "Sneller aantonen van afspraken met derden.",
        ],
        examples: "Pachtcontracten, huurovereenkomsten, leveringen",
    },
    {
        value: "ADMINISTRATIE",
        title: "Administratie",
        reasons: [
            "Nodig voor audit log en traceerbaarheid.",
            "Snellere aanlevering bij accountant of adviseur.",
            "Centraal archief van correspondentie.",
        ],
        examples: "Polissen, facturen, correspondentie, scans",
        important: "Zet altijd datum/nummer zichtbaar op de scan.",
    },
    {
        value: "INSPECTIES_CERTIFICATEN",
        title: "Inspecties/Certificaten",
        reasons: [
            "Bewijs voor kwaliteitsregelingen en audits.",
            "Inspectierapporten direct beschikbaar.",
            "Reminders voor herkeuringen.",
        ],
        examples: "NVWA-rapporten, certificaten, auditverslagen",
    },
    {
        value: "KAARTEN_METINGEN",
        title: "Kaarten & Metingen",
        reasons: [
            "Onderbouwing van perceeldata.",
            "Historie van bodemkwaliteit en metingen.",
            "Input voor advies en optimalisatie.",
        ],
        examples: "Bodemkaarten, perceelskaarten, meetrapporten",
    },
]

const DEFAULT_CATEGORY: DocCategory = UPLOAD_CATEGORIES[0]?.value || "OVERIG"

const getCategoryLabel = (value: string) =>
    DOC_CATEGORIES.find((category) => category.value === value)?.label || value

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })

// --- Main Component ---

export default function UploadCenterPage() {
    const { tenant, effectivePlan } = useTenant()
    const router = useRouter()
    const [docs, setDocs] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [renaming, setRenaming] = useState(false)
    const [errorToast, setErrorToast] = useState<string | null>(null)
    const toastTimeoutRef = useRef<number | null>(null)

    // Form state
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState<DocCategory>(DEFAULT_CATEGORY)
    const [docDate, setDocDate] = useState("")
    const [expiresAt, setExpiresAt] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // Rename dialog state
    const [renameOpen, setRenameOpen] = useState(false)
    const [renameDoc, setRenameDoc] = useState<Document | null>(null)
    const [renameValue, setRenameValue] = useState("")

    const showErrorToast = useCallback((message: string) => {
        setErrorToast(message)
        if (toastTimeoutRef.current) {
            window.clearTimeout(toastTimeoutRef.current)
        }
        toastTimeoutRef.current = window.setTimeout(() => {
            setErrorToast(null)
        }, 4000)
    }, [])

    const setSelectedFile = (selected: File | null) => {
        setFile(selected)
        if (selected) {
            setTitle((prev) => prev || selected.name.replace(/\.[^/.]+$/, ""))
        }
    }

    // Fetch documents
    const fetchRecentDocs = useCallback(async () => {
        if (!tenant) return
        setLoading(true)
        try {
            const response = await fetch("/api/documents")
            if (!response.ok) {
                showErrorToast("Kon documenten niet ophalen.")
                setDocs([])
                return
            }
            const data = await response.json()
            const documents = Array.isArray(data.documents) ? data.documents : []
            setDocs(documents.slice(0, 10))
        } catch (error) {
            console.error("Error fetching documents:", error)
            showErrorToast("Kon documenten niet ophalen.")
        } finally {
            setLoading(false)
        }
    }, [tenant, showErrorToast])

    useEffect(() => {
        fetchRecentDocs()
    }, [fetchRecentDocs])

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!file) {
            showErrorToast("Selecteer een bestand om te uploaden.")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("title", title.trim() || file.name.replace(/\.[^/.]+$/, ""))
            formData.append("category", category)
            if (docDate) formData.append("doc_date", docDate)
            if (expiresAt) formData.append("expires_at", expiresAt)

            const response = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showErrorToast(data?.error || "Upload mislukt.")
                return
            }

            if (data?.document) {
                setDocs((prev) => [data.document, ...prev].slice(0, 10))
            }

            setSelectedFile(null)
            setTitle("")
            setCategory(DEFAULT_CATEGORY)
            setDocDate("")
            setExpiresAt("")
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        } catch (error) {
            console.error("Upload error:", error)
            showErrorToast("Er is een fout opgetreden bij de upload.")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return

        try {
            const response = await fetch(`/api/documents/${id}`, { method: "DELETE" })
            if (response.ok) {
                setDocs((prev) => prev.filter((doc) => doc.id !== id))
            } else {
                showErrorToast("Verwijderen mislukt.")
            }
        } catch (error) {
            console.error("Delete error:", error)
            showErrorToast("Verwijderen mislukt.")
        }
    }

    const handleDownload = (id: string) => {
        window.open(`/api/documents/${id}/download`, "_blank", "noopener,noreferrer")
    }

    const openRename = (doc: Document) => {
        setRenameDoc(doc)
        setRenameValue(doc.title)
        setRenameOpen(true)
    }

    const closeRename = () => {
        setRenameOpen(false)
        setRenameDoc(null)
        setRenameValue("")
    }

    const handleRename = async () => {
        if (!renameDoc) return
        const nextTitle = renameValue.trim()
        if (!nextTitle) {
            showErrorToast("Naam mag niet leeg zijn.")
            return
        }

        setRenaming(true)
        try {
            const response = await fetch(`/api/documents/${renameDoc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: nextTitle }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showErrorToast(data?.error || "Hernoemen mislukt.")
                return
            }

            if (data?.document) {
                setDocs((prev) => prev.map((doc) => (doc.id === renameDoc.id ? data.document : doc)))
            } else {
                setDocs((prev) => prev.map((doc) => (doc.id === renameDoc.id ? { ...doc, title: nextTitle } : doc)))
            }

            closeRename()
        } catch (error) {
            console.error("Rename error:", error)
            showErrorToast("Hernoemen mislukt.")
        } finally {
            setRenaming(false)
        }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)
        const droppedFile = event.dataTransfer.files?.[0]
        if (droppedFile) {
            setSelectedFile(droppedFile)
        }
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const isStarterPlan = effectivePlan === "starter"

    return (
        <DashboardPage
            title="Uploadcentrum"
            description="Upload hier al je documenten zodat BoerenKompas je dossier automatisch kan checken, taken kan genereren en exports kan maken."
            className="pb-12 animate-in fade-in duration-500"
        >

            {/* Why This Matters Info Box */}
            <Card className="bg-emerald-50 border-emerald-100 shadow-none">
                <CardContent className="pt-6 flex gap-4">
                    <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Info size={20} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-emerald-900">Waarom dit belangrijk is</h3>
                        <p className="text-sm text-emerald-800 leading-relaxed">
                            Zonder uploads kunnen we geen dossier-check uitvoeren. Uploads worden gebruikt om:
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                            <li className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 size={14} /> Eisen te matchen
                            </li>
                            <li className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 size={14} /> Taken te maken
                            </li>
                            <li className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 size={14} /> Exports te genereren
                            </li>
                            <li className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 size={14} /> Audit log bij te houden
                            </li>
                        </ul>
                        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-emerald-100">
                            <Lock size={12} className="text-emerald-600" />
                            <p className="text-[11px] text-emerald-600 font-medium">
                                Alleen jouw organisatie kan deze documenten zien (tenant-scoped).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Categories */}
                <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 px-1">Wat je hier uploadt (en waarom)</h2>
                    <div className="grid gap-4">
                        {UPLOAD_CATEGORIES.map((cat) => (
                            <Card key={cat.value} className="group hover:border-emerald-200 transition-colors">
                                <CardHeader className="py-4 px-5">
                                    <CardTitle className="text-base text-slate-900">{cat.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 px-5 pb-4 space-y-3">
                                    <ul className="space-y-1.5">
                                        {cat.reasons.map((reason, index) => (
                                            <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                                                <div className="size-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-2 border-t border-slate-50">
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Voorbeelden</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{cat.examples}</p>
                                    </div>
                                    {cat.important && (
                                        <div className="p-2 bg-amber-50 rounded text-[10px] text-amber-700 border border-amber-100 flex gap-2">
                                            <AlertCircle size={12} className="shrink-0" />
                                            <span><strong>Belangrijk:</strong> {cat.important}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Upload & List */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Upload Card */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg">Nieuw Document</CardTitle>
                            <CardDescription>Selecteer een bestand en vul de details aan.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file-input" className="text-slate-700">Bestand</Label>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
                                            isDragging ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50",
                                            uploading && "opacity-70 cursor-not-allowed"
                                        )}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault()
                                                fileInputRef.current?.click()
                                            }
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            id="file-input"
                                            type="file"
                                            className="hidden"
                                            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                            disabled={uploading}
                                        />
                                        {file ? (
                                            <div className="text-center">
                                                <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                                                    <FileText size={24} />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-7"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        setSelectedFile(null)
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = ""
                                                        }
                                                    }}
                                                    disabled={uploading}
                                                >
                                                    <X size={14} className="mr-1" /> Verwijder
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="size-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">Sleep hier een bestand heen of klik om te uploaden</p>
                                                <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel of afbeeldingen (max. 10MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Naam (optioneel)</Label>
                                        <Input
                                            id="title"
                                            placeholder="Bijv. Gecombineerde Opgave 2024"
                                            value={title}
                                            onChange={(event) => setTitle(event.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categorie</Label>
                                        <Select value={category} onValueChange={(value) => setCategory(value as DocCategory)}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Kies categorie" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UPLOAD_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>{cat.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="doc-date">Documentdatum (optioneel)</Label>
                                        <Input
                                            id="doc-date"
                                            type="date"
                                            value={docDate}
                                            onChange={(event) => setDocDate(event.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expires-at">Vervaldatum (optioneel)</Label>
                                        <Input
                                            id="expires-at"
                                            type="date"
                                            value={expiresAt}
                                            onChange={(event) => setExpiresAt(event.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-12 text-base font-semibold"
                                    disabled={!file || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full size-4" />
                                            Uploaden...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 size-5" /> Start Upload
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Plan Gating Callout */}
                    {isStarterPlan && (
                        <Card className="bg-slate-900 text-white overflow-hidden relative group border-none">
                            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                <div className="space-y-2 flex-1 text-center md:text-left">
                                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 mb-2">Starter plan</Badge>
                                    <h3 className="text-xl font-bold">Automatiseer je dossier</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Uploaden kan altijd. Voor geavanceerde automatisering zoals AI dossier-check,
                                        missing items genereren en exports maken is een upgrade nodig.
                                    </p>
                                </div>
                                <Button
                                    className="bg-white text-slate-900 hover:bg-slate-100 px-6 h-12 font-bold shrink-0"
                                    onClick={() => router.push("/dashboard/settings")}
                                >
                                    Bekijk plannen
                                </Button>
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform group-hover:scale-110 transition-transform">
                                    <CheckCircle2 size={120} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    {/* Recent Uploads List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                            Recente uploads
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => router.push("/dashboard/documents")}
                            >
                                Alles bekijken <ExternalLink size={14} className="ml-1.5" />
                            </Button>
                        </h2>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Card key={i} className="animate-pulse">
                                            <CardContent className="p-4 h-20 bg-slate-50/50" />
                                        </Card>
                                    ))}
                                </div>
                            ) : docs.length > 0 ? (
                                docs.map((doc) => (
                                    <Card key={doc.id} className="group hover:shadow-md transition-all border-slate-200">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-900 truncate">{doc.title || doc.file_name}</h4>
                                                    <Badge variant="outline" className="text-[10px] font-medium h-5 px-1.5 bg-slate-50 text-slate-500 border-slate-200">
                                                        {getCategoryLabel(doc.category)}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 truncate">{doc.file_name}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                    <span className="text-xs text-slate-400 shrink-0">
                                                        {formatDate(doc.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                    title="Link naar requirement"
                                                    onClick={() => router.push("/dashboard/ai/compliance-check")}
                                                >
                                                    <FileSearch size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                    onClick={() => openRename(doc)}
                                                    title="Hernoem"
                                                >
                                                    <Pencil size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                    onClick={() => handleDownload(doc.id)}
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => handleDelete(doc.id)}
                                                    title="Verwijder"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <Upload size={32} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500 font-medium">Nog geen documenten geupload</p>
                                    <p className="text-xs text-slate-400 mt-1">Begin hierboven met je eerste upload.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={renameOpen}
                onOpenChange={(open) => {
                    if (!open) closeRename()
                    setRenameOpen(open)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Document hernoemen</DialogTitle>
                        <DialogDescription>Geef een duidelijke naam zodat je dit later snel terugvindt.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rename-title">Nieuwe naam</Label>
                        <Input
                            id="rename-title"
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault()
                                    handleRename()
                                }
                            }}
                            disabled={renaming}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeRename} disabled={renaming}>
                            Annuleren
                        </Button>
                        <Button onClick={handleRename} disabled={renaming} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {renaming ? "Opslaan..." : "Opslaan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {errorToast && (
                <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg text-sm">
                    {errorToast}
                </div>
            )}
        </DashboardPage>
    )
}
