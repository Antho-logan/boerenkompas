"use client"

import React, { useMemo, useState } from "react"
import {
    Search,
    Filter,
    SlidersHorizontal,
    FileText,
    Download,
    Trash2,
    Eye,
    Link2,
    Calendar,
    AlertCircle,
    ChevronRight,
    X,
    Loader2,
    FolderOpen,
    Upload,
    HardDrive,
    Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DOC_CATEGORIES } from "@/lib/documents/types"
import { formatBytes } from "@/components/documents/document-components"
import type { Document } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface VaultFilters {
    q: string
    category: string
    status: string
    sort: string
    expiry: string
    linked: string
}

export interface CategoryCount {
    category: string
    count: number
    label: string
}

// ─────────────────────────────────────────────────────────────────
// CATEGORY SIDEBAR
// ─────────────────────────────────────────────────────────────────

interface VaultSidebarProps {
    categories: CategoryCount[]
    selectedCategory: string
    onCategorySelect: (category: string) => void
    totalCount: number
    loading?: boolean
}

export function VaultSidebar({
    categories,
    selectedCategory,
    onCategorySelect,
    totalCount,
    loading,
}: VaultSidebarProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-6 rounded-full" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {/* All Documents */}
            <button
                onClick={() => onCategorySelect("")}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedCategory === ""
                        ? "bg-emerald-50 text-emerald-900"
                        : "text-slate-600 hover:bg-slate-50"
                )}
            >
                <span className="flex items-center gap-2">
                    <FolderOpen size={16} className={cn(selectedCategory === "" ? "text-emerald-600" : "text-slate-400")} aria-hidden="true" />
                    Alle documenten
                </span>
                <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    selectedCategory === "" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                )}>
                    {totalCount}
                </span>
            </button>

            <div className="h-px bg-slate-100 my-2" />

            {/* Category List */}
            {categories.map((cat) => (
                <button
                    key={cat.category}
                    onClick={() => onCategorySelect(cat.category)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === cat.category
                            ? "bg-emerald-50 text-emerald-900 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <span className="truncate">{cat.label}</span>
                    <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                        selectedCategory === cat.category ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {cat.count}
                    </span>
                </button>
            ))}
        </div>
    )
}

// Mobile Category Dropdown
export function VaultCategoryDropdown({
    categories,
    selectedCategory,
    onCategorySelect,
    totalCount,
}: VaultSidebarProps) {
    return (
        <Select value={selectedCategory || "all"} onValueChange={(v) => onCategorySelect(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Alle documenten ({totalCount})</SelectItem>
                {categories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                        {cat.label} ({cat.count})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

// ─────────────────────────────────────────────────────────────────
// TOOLBAR
// ─────────────────────────────────────────────────────────────────

interface VaultToolbarProps {
    filters: VaultFilters
    onFiltersChange: (filters: Partial<VaultFilters>) => void
    onUpload: () => void
    isAdmin: boolean
}

const STATUS_OPTIONS = [
    { value: "", label: "Alle statussen" },
    { value: "ok", label: "In orde" },
    { value: "needs_review", label: "Te controleren" },
    { value: "expired", label: "Verlopen" },
]

const SORT_OPTIONS = [
    { value: "newest", label: "Nieuwste eerst" },
    { value: "oldest", label: "Oudste eerst" },
    { value: "name", label: "Naam A-Z" },
    { value: "name_desc", label: "Naam Z-A" },
    { value: "expiry", label: "Verloopt binnenkort" },
    { value: "size", label: "Grootste eerst" },
]

const EXPIRY_OPTIONS = [
    { value: "", label: "Alle vervaldatums" },
    { value: "soon", label: "Verloopt binnen 30 dagen" },
    { value: "expired", label: "Verlopen" },
]

const LINKED_OPTIONS = [
    { value: "", label: "Alle koppelingen" },
    { value: "yes", label: "Gekoppeld aan eis" },
    { value: "no", label: "Niet gekoppeld" },
]

export function VaultToolbar({ filters, onFiltersChange, onUpload, isAdmin }: VaultToolbarProps) {
    const [showFilters, setShowFilters] = useState(false)

    const hasActiveFilters = filters.status || filters.expiry || filters.linked

    return (
        <div className="space-y-3">
            {/* Main Row: Search + Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                    <Input
                        value={filters.q}
                        onChange={(e) => onFiltersChange({ q: e.target.value })}
                        placeholder="Zoek op naam of bestand..."
                        className="pl-9 bg-white border-slate-200 h-10"
                        aria-label="Zoek documenten"
                    />
                    {filters.q && (
                        <button
                            onClick={() => onFiltersChange({ q: "" })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            aria-label="Zoekopdracht wissen"
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-10 gap-2 border-slate-200",
                            hasActiveFilters && "border-emerald-300 bg-emerald-50 text-emerald-700"
                        )}
                    >
                        <Filter size={16} aria-hidden="true" />
                        Filters
                        {hasActiveFilters && (
                            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        )}
                    </Button>

                    <Select value={filters.sort || "newest"} onValueChange={(v) => onFiltersChange({ sort: v ?? "newest" })}>
                        <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200">
                            <SlidersHorizontal size={14} className="mr-2 text-slate-400" aria-hidden="true" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {isAdmin && (
                        <Button onClick={onUpload} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Upload size={16} aria-hidden="true" />
                            <span className="hidden sm:inline">Upload</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Row (Collapsible) */}
            {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Status</label>
                        <Select value={filters.status || "all"} onValueChange={(v) => onFiltersChange({ status: (v === "all" ? "" : v) ?? "" })}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Vervaldatum</label>
                        <Select value={filters.expiry || "all"} onValueChange={(v) => onFiltersChange({ expiry: (v === "all" ? "" : v) ?? "" })}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPIRY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Koppeling</label>
                        <Select value={filters.linked || "all"} onValueChange={(v) => onFiltersChange({ linked: (v === "all" ? "" : v) ?? "" })}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LINKED_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onFiltersChange({ status: "", expiry: "", linked: "" })}
                                className="h-9 text-slate-500 hover:text-slate-700"
                            >
                                <X size={14} className="mr-1" aria-hidden="true" />
                                Wis filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DOCUMENT TABLE (Desktop)
// ─────────────────────────────────────────────────────────────────

interface VaultTableProps {
    documents: Document[]
    onSelect: (doc: Document) => void
    onDownload: (doc: Document) => void
    onDelete?: (doc: Document) => void
    isAdmin: boolean
    downloadingId: string | null
}

export function VaultTable({
    documents,
    onSelect,
    onDownload,
    onDelete,
    isAdmin,
    downloadingId,
}: VaultTableProps) {
    const getCategoryLabel = (category: string) => {
        return DOC_CATEGORIES.find(c => c.value === category)?.label || category
    }

    const formatDate = (date: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
    }

    const getStatusBadge = (status: string, expiresAt: string | null) => {
        const isExpired = expiresAt && new Date(expiresAt) < new Date()

        if (status === 'expired' || isExpired) {
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Verlopen</Badge>
        }
        if (status === 'needs_review') {
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Te controleren</Badge>
        }
        if (status === 'ok') {
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">In orde</Badge>
        }
        return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{status}</Badge>
    }

    const expiresSoonThreshold = useMemo(() => {
        const threshold = new Date()
        threshold.setDate(threshold.getDate() + 30)
        return threshold
    }, [])

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3" scope="col">Document</th>
                            <th className="px-4 py-3 hidden md:table-cell" scope="col">Categorie</th>
                            <th className="px-4 py-3 hidden lg:table-cell" scope="col">Status</th>
                            <th className="px-4 py-3 hidden lg:table-cell" scope="col">Doc. datum</th>
                            <th className="px-4 py-3 hidden xl:table-cell" scope="col">Verloopt</th>
                            <th className="px-4 py-3 hidden xl:table-cell" scope="col">Grootte</th>
                            <th className="px-4 py-3 text-right" scope="col">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {documents.map((doc) => {
                            const { value: sizeValue, unit: sizeUnit } = formatBytes(doc.size_bytes || 0)
                            const expiresSoon = doc.expires_at && new Date(doc.expires_at) < expiresSoonThreshold

                            return (
                                <tr
                                    key={doc.id}
                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-inset"
                                    onClick={() => onSelect(doc)}
                                    onKeyDown={(event) => {
                                        if (event.currentTarget !== event.target) return
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault()
                                            onSelect(doc)
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Open document ${doc.title || doc.file_name}`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                <FileText size={18} aria-hidden="true" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                                    {doc.title}
                                                </div>
                                                <div className="text-xs text-slate-400 truncate">
                                                    {doc.file_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600">
                                            {getCategoryLabel(doc.category)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {getStatusBadge(doc.status, doc.expires_at)}
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                                        {formatDate(doc.doc_date)}
                                    </td>
                                    <td className="px-4 py-3 hidden xl:table-cell">
                                        <span className={cn(
                                            "text-xs",
                                            expiresSoon ? "text-amber-600 font-medium" : "text-slate-500"
                                        )}>
                                            {formatDate(doc.expires_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden xl:table-cell text-slate-500 text-xs">
                                        {sizeValue} {sizeUnit}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                onClick={() => onDownload(doc)}
                                                disabled={downloadingId === doc.id}
                                                aria-label="Download document"
                                                title="Download via tijdelijke link (15 min)"
                                            >
                                                {downloadingId === doc.id ? (
                                                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                                ) : (
                                                    <Download size={16} aria-hidden="true" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-slate-400 hover:text-slate-600"
                                                onClick={() => onSelect(doc)}
                                                aria-label="Bekijk details"
                                                title="Bekijk details"
                                            >
                                                <Eye size={16} aria-hidden="true" />
                                            </Button>
                                            {isAdmin && onDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => onDelete(doc)}
                                                    aria-label="Verwijder document"
                                                    title="Verwijder"
                                                >
                                                    <Trash2 size={16} aria-hidden="true" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DOCUMENT CARDS (Mobile)
// ─────────────────────────────────────────────────────────────────

export function VaultCardList({
    documents,
    onSelect,
    onDownload,
    onDelete,
    isAdmin,
    downloadingId,
}: VaultTableProps) {
    const getCategoryLabel = (category: string) => {
        return DOC_CATEGORIES.find(c => c.value === category)?.label || category
    }

    const formatDate = (date: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    }

    const getStatusBadge = (status: string, expiresAt: string | null) => {
        const isExpired = expiresAt && new Date(expiresAt) < new Date()

        if (status === 'expired' || isExpired) {
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Verlopen</Badge>
        }
        if (status === 'needs_review') {
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Te controleren</Badge>
        }
        if (status === 'ok') {
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">In orde</Badge>
        }
        return null
    }

    return (
        <div className="space-y-3">
            {documents.map((doc) => (
                <Card
                    key={doc.id}
                    className="p-4 hover:shadow-md transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
                    onClick={() => onSelect(doc)}
                    onKeyDown={(event) => {
                        if (event.currentTarget !== event.target) return
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            onSelect(doc)
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open document ${doc.title || doc.file_name}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            <FileText size={20} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h4 className="font-medium text-slate-900 truncate group-hover:text-emerald-700">
                                        {doc.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                                </div>
                                {getStatusBadge(doc.status, doc.expires_at)}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-500">
                                    {getCategoryLabel(doc.category)}
                                </Badge>
                                {doc.doc_date && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} aria-hidden="true" /> {formatDate(doc.doc_date)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-slate-500 hover:text-emerald-600"
                            onClick={() => onDownload(doc)}
                            disabled={downloadingId === doc.id}
                        >
                            {downloadingId === doc.id ? (
                                <Loader2 size={14} className="mr-1 animate-spin" aria-hidden="true" />
                            ) : (
                                <Download size={14} className="mr-1" aria-hidden="true" />
                            )}
                            Download
                        </Button>
                        {isAdmin && onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-slate-500 hover:text-red-600"
                                onClick={() => onDelete(doc)}
                            >
                                <Trash2 size={14} className="mr-1" aria-hidden="true" />
                                Verwijder
                            </Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DETAILS DRAWER
// ─────────────────────────────────────────────────────────────────

interface DocumentDrawerProps {
    document: Document | null
    isOpen: boolean
    onClose: (open: boolean) => void
    onDownload: (doc: Document) => void
    onDelete?: (doc: Document) => void
    isAdmin: boolean
    downloadingId: string | null
    linkedRequirements?: { id: string; title: string }[]
}

export function DocumentDrawer({
    document,
    isOpen,
    onClose,
    onDownload,
    onDelete,
    isAdmin,
    downloadingId,
    linkedRequirements = [],
}: DocumentDrawerProps) {
    if (!document) return null

    const getCategoryLabel = (category: string) => {
        return DOC_CATEGORIES.find(c => c.value === category)?.label || category
    }

    const formatDate = (date: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    }

    const { value: sizeValue, unit: sizeUnit } = formatBytes(document.size_bytes || 0)

    const getStatusBadge = (status: string, expiresAt: string | null) => {
        const isExpired = expiresAt && new Date(expiresAt) < new Date()

        if (status === 'expired' || isExpired) {
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Verlopen</Badge>
        }
        if (status === 'needs_review') {
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Te controleren</Badge>
        }
        if (status === 'ok') {
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">In orde</Badge>
        }
        return <Badge variant="outline">{status}</Badge>
    }

    // Missing metadata
    const missingDocDate = !document.doc_date
    const missingExpiry = !document.expires_at

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
                <SheetHeader className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            <SheetTitle className="text-lg truncate">{document.title}</SheetTitle>
                            <SheetDescription className="truncate">{document.file_name}</SheetDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 shrink-0" 
                            aria-label="Sluit paneel"
                            onClick={() => onClose(false)}
                        >
                            <X size={16} aria-hidden="true" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Preview placeholder */}
                    <div className="aspect-[4/3] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <div className="text-center">
                            <FileText size={48} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
                            <span className="text-sm text-slate-400">Preview niet beschikbaar</span>
                        </div>
                    </div>

                    {/* Status & Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(document.status, document.expires_at)}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            {getCategoryLabel(document.category)}
                        </Badge>
                    </div>

                    {/* Missing metadata warnings */}
                    {(missingDocDate || missingExpiry) && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                                <AlertCircle size={16} aria-hidden="true" />
                                Metadata onvolledig
                            </div>
                            <ul className="text-xs text-amber-700 space-y-1 ml-6">
                                {missingDocDate && <li>• Documentdatum ontbreekt</li>}
                                {missingExpiry && <li>• Vervaldatum ontbreekt</li>}
                            </ul>
                            <Link
                                href={`/dashboard/documents/upload-center`}
                                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium"
                            >
                                Aanvullen <ChevronRight size={12} aria-hidden="true" />
                            </Link>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informatie</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Documentdatum</dt>
                                <dd className="font-medium text-slate-900">{formatDate(document.doc_date)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Verloopt op</dt>
                                <dd className={cn(
                                    "font-medium",
                                    document.expires_at && new Date(document.expires_at) < new Date() ? "text-red-600" : "text-slate-900"
                                )}>
                                    {formatDate(document.expires_at)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Bestandsgrootte</dt>
                                <dd className="font-medium text-slate-900">{sizeValue} {sizeUnit}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Geüpload</dt>
                                <dd className="font-medium text-slate-900">{formatDate(document.created_at)}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Linked Requirements */}
                    {linkedRequirements.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gekoppeld aan</h4>
                            <div className="space-y-2">
                                {linkedRequirements.map((req) => (
                                    <div key={req.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                                        <Link2 size={14} className="text-emerald-600" aria-hidden="true" />
                                        <span className="text-slate-700">{req.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {document.tags && document.tags.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                                {document.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs bg-slate-50">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Download info */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                        <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Download via tijdelijke link (15 min geldig). Je documenten zijn veilig opgeslagen en alleen toegankelijk voor jouw organisatie.</span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 space-y-2">
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onDownload(document)}
                        disabled={downloadingId === document.id}
                    >
                        {downloadingId === document.id ? (
                            <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
                        ) : (
                            <Download size={16} className="mr-2" aria-hidden="true" />
                        )}
                        Download
                    </Button>
                    {isAdmin && onDelete && (
                        <Button
                            variant="outline"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(document)}
                        >
                            <Trash2 size={16} className="mr-2" aria-hidden="true" />
                            Verwijderen
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─────────────────────────────────────────────────────────────────
// LOADING SKELETONS
// ─────────────────────────────────────────────────────────────────

export function VaultTableSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="size-9 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────

interface VaultEmptyStateProps {
    hasFilters: boolean
    onClearFilters: () => void
    isAdmin: boolean
}

export function VaultEmptyState({ hasFilters, onClearFilters, isAdmin }: VaultEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FolderOpen size={32} className="text-slate-400" aria-hidden="true" />
            </div>
            {hasFilters ? (
                <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Geen documenten gevonden</h3>
                    <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                        Er zijn geen documenten die aan je zoekcriteria voldoen.
                    </p>
                    <Button variant="outline" onClick={onClearFilters}>
                        <X size={14} className="mr-2" aria-hidden="true" />
                        Filters wissen
                    </Button>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nog geen documenten</h3>
                    <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                        Begin met het uploaden van documenten om je dossier op te bouwen.
                    </p>
                    {isAdmin && (
                        <Link href="/dashboard/documents/upload-center">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Upload size={16} className="mr-2" aria-hidden="true" />
                                Naar Uploadcentrum
                            </Button>
                        </Link>
                    )}
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────────

interface VaultStatsProps {
    total: number
    attention: number
    expiringSoon: number
    storage: number
    loading?: boolean
}

export function VaultStats({ total, attention, expiringSoon, storage, loading }: VaultStatsProps) {
    const { value: storageValue, unit: storageUnit } = formatBytes(storage)

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4">
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-7 w-12" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Totaal</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
            </Card>
            <Card className="p-4 border-slate-200 relative overflow-hidden">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Te controleren</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                    {attention}
                    {attention > 0 && <span className="size-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />}
                </p>
                {attention > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 opacity-20" />}
            </Card>
            <Card className="p-4 border-slate-200 relative overflow-hidden">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verloopt binnenkort</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                    {expiringSoon}
                    {expiringSoon > 0 && <span className="size-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />}
                </p>
                {expiringSoon > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500 opacity-20" />}
            </Card>
            <Card className="p-4 border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opslag</p>
                    <HardDrive size={14} className="text-slate-400" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                    {storageValue} <span className="text-sm font-medium text-slate-400">{storageUnit}</span>
                </p>
            </Card>
        </div>
    )
}
