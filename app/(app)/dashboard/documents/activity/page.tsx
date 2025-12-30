"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Upload,
    Download,
    Trash2,
    Link2,
    RefreshCw,
    FileText,
    Filter,
    Calendar,
    ChevronRight,
    Clock,
    X,
    AlertCircle,
    History,
} from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import DashboardPage from "@/components/app/DashboardPage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DOC_CATEGORIES } from "@/lib/documents/types"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ActivityItem {
    id: string
    timestamp: string
    action: string
    label: string
    entityType: string
    entityId: string | null
    documentTitle: string | null
    documentId: string | null
    category: string | null
    actorName: string | null
    meta: {
        count?: number
        requirementTitle?: string
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION ICONS
// ─────────────────────────────────────────────────────────────────

function ActionIcon({ action }: { action: string }) {
    const iconClass = "size-4"

    switch (action) {
        case "document.created":
        case "dev.seed_documents":
            return <Upload className={cn(iconClass, "text-emerald-600")} aria-hidden="true" />
        case "document.downloaded":
            return <Download className={cn(iconClass, "text-blue-600")} aria-hidden="true" />
        case "document.deleted":
            return <Trash2 className={cn(iconClass, "text-red-600")} aria-hidden="true" />
        case "document.linked":
        case "document.unlinked":
            return <Link2 className={cn(iconClass, "text-purple-600")} aria-hidden="true" />
        default:
            return <FileText className={cn(iconClass, "text-slate-400")} aria-hidden="true" />
    }
}

function getActionBgColor(action: string): string {
    switch (action) {
        case "document.created":
        case "dev.seed_documents":
            return "bg-emerald-100"
        case "document.downloaded":
            return "bg-blue-100"
        case "document.deleted":
            return "bg-red-100"
        case "document.linked":
        case "document.unlinked":
            return "bg-purple-100"
        default:
            return "bg-slate-100"
    }
}

// ─────────────────────────────────────────────────────────────────
// FILTER OPTIONS
// ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
    { value: "", label: "Alle activiteiten" },
    { value: "upload", label: "Uploads" },
    { value: "download", label: "Downloads" },
    { value: "delete", label: "Verwijderd" },
    { value: "link", label: "Koppelingen" },
]

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function DocumentActivityPage() {
    const { tenant } = useTenant()
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters from URL
    const filters = useMemo(() => ({
        type: searchParams.get("type") || "",
        category: searchParams.get("category") || "",
        from: searchParams.get("from") || "",
        to: searchParams.get("to") || "",
    }), [searchParams])

    // Update URL with filters
    const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
        const updatedFilters = { ...filters, ...newFilters }
        const params = new URLSearchParams()

        if (updatedFilters.type) params.set("type", updatedFilters.type)
        if (updatedFilters.category) params.set("category", updatedFilters.category)
        if (updatedFilters.from) params.set("from", updatedFilters.from)
        if (updatedFilters.to) params.set("to", updatedFilters.to)

        const queryString = params.toString()
        router.push(`/dashboard/documents/activity${queryString ? `?${queryString}` : ""}`, { scroll: false })
    }, [filters, router])

    const hasActiveFilters = filters.type || filters.category || filters.from || filters.to

    const clearFilters = useCallback(() => {
        router.push("/dashboard/documents/activity", { scroll: false })
    }, [router])

    // ─────────────────────────────────────────────────────────────
    // DATA FETCHING
    // ─────────────────────────────────────────────────────────────
    const fetchActivities = useCallback(async (showRefreshing = false) => {
        if (!tenant) return

        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            const params = new URLSearchParams()
            if (filters.type) params.set("type", filters.type)
            if (filters.category) params.set("category", filters.category)
            if (filters.from) params.set("from", filters.from)
            if (filters.to) params.set("to", filters.to)

            const response = await fetch(`/api/documents/activity?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setActivities(data.activities || [])
            } else {
                setError("Kon activiteit niet laden.")
            }
        } catch (err) {
            console.error("Error fetching activities:", err)
            setError("Er is een fout opgetreden.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [tenant, filters])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        // Within last hour
        if (diff < 60 * 60 * 1000) {
            const mins = Math.floor(diff / 60 / 1000)
            return mins <= 1 ? "Zojuist" : `${mins} minuten geleden`
        }

        // Within last 24 hours
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / 60 / 60 / 1000)
            return `${hours} uur geleden`
        }

        // Within last week
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / 24 / 60 / 60 / 1000)
            return `${days} dag${days > 1 ? "en" : ""} geleden`
        }

        // Otherwise show date
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        })
    }

    const getCategoryLabel = (category: string | null) => {
        if (!category) return null
        return DOC_CATEGORIES.find(c => c.value === category)?.label || category
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <DashboardPage
            title="Document Activiteit"
            description="Bekijk wat er gebeurt met je documenten."
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchActivities(true)}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw size={16} className={cn(refreshing && "animate-spin")} aria-hidden="true" />
                        Verversen
                    </Button>
                    <Link href="/dashboard/documents">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText size={16} aria-hidden="true" />
                            <span className="hidden sm:inline">Naar Vault</span>
                        </Button>
                    </Link>
                </div>
            }
            className="animate-fade-in-up"
        >
            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 min-w-[160px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Type activiteit</label>
                        <Select value={filters.type || "all"} onValueChange={(v) => setFilters({ type: (v === "all" ? "" : v) ?? "" })}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[160px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Categorie</label>
                        <Select value={filters.category || "all"} onValueChange={(v) => setFilters({ category: (v === "all" ? "" : v) ?? "" })}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle categorieën</SelectItem>
                                {DOC_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Van</label>
                        <Input
                            type="date"
                            value={filters.from}
                            onChange={(e) => setFilters({ from: e.target.value })}
                            className="h-9 bg-white border-slate-200"
                        />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tot</label>
                        <Input
                            type="date"
                            value={filters.to}
                            onChange={(e) => setFilters({ to: e.target.value })}
                            className="h-9 bg-white border-slate-200"
                        />
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-9 text-slate-500 hover:text-slate-700"
                            >
                                <X size={14} className="mr-1" aria-hidden="true" />
                                Wis
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Activity List */}
            {loading ? (
                <Card className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <Skeleton className="size-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </Card>
            ) : error ? (
                <Card className="p-8 text-center">
                    <AlertCircle className="mx-auto size-12 text-red-400 mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Fout bij laden</h3>
                    <p className="text-sm text-slate-500 mb-4">{error}</p>
                    <Button onClick={() => fetchActivities()} variant="outline">
                        Opnieuw proberen
                    </Button>
                </Card>
            ) : activities.length === 0 ? (
                <Card className="p-8 text-center">
                    <History className="mx-auto size-12 text-slate-300 mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Geen activiteit gevonden</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        {hasActiveFilters
                            ? "Er zijn geen activiteiten die aan je filters voldoen."
                            : "Er is nog geen documentactiviteit geregistreerd."}
                    </p>
                    {hasActiveFilters && (
                        <Button onClick={clearFilters} variant="outline">
                            Filters wissen
                        </Button>
                    )}
                </Card>
            ) : (
                <Card className="divide-y divide-slate-100 overflow-hidden">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group"
                        >
                            {/* Icon */}
                            <div className={cn(
                                "size-10 rounded-full flex items-center justify-center shrink-0",
                                getActionBgColor(activity.action)
                            )}>
                                <ActionIcon action={activity.action} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-900">{activity.label}</span>
                                    {activity.category && (
                                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">
                                            {getCategoryLabel(activity.category)}
                                        </Badge>
                                    )}
                                </div>
                                {activity.documentTitle && (
                                    <p className="text-sm text-slate-600 truncate mt-0.5">
                                        {activity.documentTitle}
                                        {activity.meta?.count && activity.meta.count > 1 && (
                                            <span className="text-slate-400"> (+{activity.meta.count - 1} meer)</span>
                                        )}
                                    </p>
                                )}
                                {activity.meta?.requirementTitle && (
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        Eis: {activity.meta.requirementTitle}
                                    </p>
                                )}
                            </div>

                            {/* Timestamp */}
                            <div className="text-right shrink-0">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12} aria-hidden="true" />
                                    {formatTimestamp(activity.timestamp)}
                                </span>
                            </div>

                            {/* Action */}
                            {activity.documentId && (
                                <Link
                                    href={`/dashboard/documents?q=${encodeURIComponent(activity.documentTitle || "")}`}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Button variant="ghost" size="icon" className="size-8" aria-label="Bekijk document">
                                        <ChevronRight size={16} aria-hidden="true" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {/* Footer info */}
            {activities.length > 0 && (
                <p className="text-xs text-slate-400 text-center">
                    Laatste {activities.length} activiteiten. Activiteit wordt automatisch gelogd bij uploads, downloads en wijzigingen.
                </p>
            )}
        </DashboardPage>
    )
}

