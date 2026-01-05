"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTenant } from "@/components/app/TenantProvider"
import DashboardPage from "@/components/app/DashboardPage"
import { mapApiErrorToMessage, canWrite } from "@/lib/supabase/errors"
import { downloadDocument } from "@/components/documents/document-components"
import type { Document } from "@/lib/supabase/types"
import { DOC_CATEGORIES } from "@/lib/documents/types"
import {
    VaultSidebar,
    VaultCategoryDropdown,
    VaultToolbar,
    VaultTable,
    VaultCardList,
    DocumentDrawer,
    VaultTableSkeleton,
    VaultEmptyState,
    VaultStats,
    type VaultFilters,
    type CategoryCount,
} from "@/components/documents/vault-components"
import { Lock, AlertCircle, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ─────────────────────────────────────────────────────────────────
// ERROR TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────

function ErrorToast({ message, onDismiss, variant = "warning" }: { message: string; onDismiss: () => void; variant?: "warning" | "error" }) {
    const isError = variant === "error"
    return (
        <div 
            className={`fixed bottom-4 right-4 z-50 max-w-sm ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'} border px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3 animate-in slide-in-from-bottom-4`}
            role="alert"
        >
            {isError ? <AlertCircle size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            <span className="flex-1">{message}</span>
            <button onClick={onDismiss} className={`${isError ? 'text-red-600 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'}`} aria-label="Melding sluiten">×</button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT FILTERS
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function DocumentsVaultPage() {
    const { tenant, role, isLoading: isTenantLoading } = useTenant()
    const router = useRouter()
    const searchParams = useSearchParams()

    const isAdmin = canWrite(role)

    // State
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [errorVariant, setErrorVariant] = useState<"warning" | "error">("warning")
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    // Drawer state
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Stats
    const [stats, setStats] = useState<{
        total: number
        attention: number
        storage: number
    } | null>(null)

    // ─────────────────────────────────────────────────────────────
    // URL SYNC: Read filters from URL
    // ─────────────────────────────────────────────────────────────
    const filters: VaultFilters = useMemo(() => ({
        q: searchParams.get("q") || "",
        category: searchParams.get("category") || "",
        status: searchParams.get("status") || "",
        sort: searchParams.get("sort") || "newest",
        expiry: searchParams.get("expiry") || "",
        linked: searchParams.get("linked") || "",
    }), [searchParams])

    // URL SYNC: Update URL when filters change
    const setFilters = useCallback((newFilters: Partial<VaultFilters>) => {
        const updatedFilters = { ...filters, ...newFilters }
        const params = new URLSearchParams()

        // Only add non-empty values
        if (updatedFilters.q) params.set("q", updatedFilters.q)
        if (updatedFilters.category) params.set("category", updatedFilters.category)
        if (updatedFilters.status) params.set("status", updatedFilters.status)
        if (updatedFilters.sort && updatedFilters.sort !== "newest") params.set("sort", updatedFilters.sort)
        if (updatedFilters.expiry) params.set("expiry", updatedFilters.expiry)
        if (updatedFilters.linked) params.set("linked", updatedFilters.linked)

        const queryString = params.toString()
        router.push(`/dashboard/documents${queryString ? `?${queryString}` : ""}`, { scroll: false })
    }, [filters, router])

    // Clear all filters
    const clearFilters = useCallback(() => {
        router.push("/dashboard/documents", { scroll: false })
    }, [router])

    // Check if any filters are active
    const hasActiveFilters = filters.q || filters.category || filters.status || filters.expiry || filters.linked

    // ─────────────────────────────────────────────────────────────
    // ERROR HANDLING
    // ─────────────────────────────────────────────────────────────
    const showError = useCallback((message: string, variant: "warning" | "error" = "warning") => {
        setError(message)
        setErrorVariant(variant)
        setTimeout(() => setError(null), 5000)
    }, [])

    // ─────────────────────────────────────────────────────────────
    // DATA FETCHING
    // ─────────────────────────────────────────────────────────────
    const fetchDocuments = useCallback(async () => {
        if (!tenant) {
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const response = await fetch("/api/documents")
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                showError(mapApiErrorToMessage(response.status, data), "error")
                setDocuments([])
                setStats(null)
                return
            }
            setDocuments(data.documents || [])
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (err) {
            console.error("Error fetching documents:", err)
            showError("Kon documenten niet laden.", "error")
        } finally {
            setLoading(false)
        }
    }, [tenant, showError])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    // ─────────────────────────────────────────────────────────────
    // FILTERING & SORTING (Client-side for MVP)
    // ─────────────────────────────────────────────────────────────
    const filteredDocuments = useMemo(() => {
        let result = [...documents]

        // Search filter
        if (filters.q) {
            const query = filters.q.toLowerCase()
            result = result.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.file_name.toLowerCase().includes(query) ||
                (doc.tags || []).some(tag => tag.toLowerCase().includes(query))
            )
        }

        // Category filter
        if (filters.category) {
            result = result.filter(doc => doc.category === filters.category)
        }

        // Status filter
        if (filters.status) {
            result = result.filter(doc => doc.status === filters.status)
        }

        // Expiry filter
        if (filters.expiry === "soon") {
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            result = result.filter(doc =>
                doc.expires_at &&
                new Date(doc.expires_at) <= thirtyDaysFromNow &&
                new Date(doc.expires_at) > new Date()
            )
        } else if (filters.expiry === "expired") {
            result = result.filter(doc =>
                doc.expires_at && new Date(doc.expires_at) < new Date()
            )
        }

        // Sorting
        switch (filters.sort) {
            case "newest":
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
            case "oldest":
                result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                break
            case "name":
                result.sort((a, b) => a.title.localeCompare(b.title, "nl"))
                break
            case "name_desc":
                result.sort((a, b) => b.title.localeCompare(a.title, "nl"))
                break
            case "expiry":
                result.sort((a, b) => {
                    if (!a.expires_at) return 1
                    if (!b.expires_at) return -1
                    return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
                })
                break
            case "size":
                result.sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0))
                break
        }

        return result
    }, [documents, filters])

    // ─────────────────────────────────────────────────────────────
    // CATEGORY COUNTS
    // ─────────────────────────────────────────────────────────────
    const categoryCounts = useMemo<CategoryCount[]>(() => {
        const counts: Record<string, number> = {}

        documents.forEach(doc => {
            counts[doc.category] = (counts[doc.category] || 0) + 1
        })

        return DOC_CATEGORIES.map(cat => ({
            category: cat.value,
            label: cat.label,
            count: counts[cat.value] || 0,
        })).filter(cat => cat.count > 0)
    }, [documents])

    // ─────────────────────────────────────────────────────────────
    // COMPUTED STATS
    // ─────────────────────────────────────────────────────────────
    const computedStats = useMemo(() => {
        const attention = documents.filter(d => d.status === "needs_review" || d.status === "expired").length
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const expiringSoon = documents.filter(d =>
            d.expires_at &&
            new Date(d.expires_at) <= thirtyDaysFromNow &&
            new Date(d.expires_at) > new Date()
        ).length

        return {
            total: stats?.total ?? documents.length,
            attention: stats?.attention ?? attention,
            expiringSoon,
            storage: stats?.storage ?? 0,
        }
    }, [documents, stats])

    // ─────────────────────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────────────────────
    const handleDocumentSelect = (doc: Document) => {
        setSelectedDocument(doc)
        setDrawerOpen(true)
    }

    const handleDownload = useCallback(async (doc: Document) => {
        setDownloadingId(doc.id)
        try {
            const error = await downloadDocument(doc.id)
            if (error) {
                showError(error, "error")
            }
        } finally {
            setDownloadingId(null)
        }
    }, [showError])

    const handleDelete = useCallback(async (doc: Document) => {
        if (!isAdmin) {
            showError("Je hebt geen rechten (admin vereist).")
            return
        }

        if (!confirm(`Weet je zeker dat je "${doc.title}" wilt verwijderen?`)) return

        try {
            const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
            if (response.ok) {
                setDrawerOpen(false)
                await fetchDocuments()
            } else {
                const data = await response.json().catch(() => ({}))
                showError(mapApiErrorToMessage(response.status, data), "error")
            }
        } catch (err) {
            console.error("Delete error:", err)
            showError("Er is iets misgegaan bij het verwijderen.", "error")
        }
    }, [isAdmin, fetchDocuments, showError])

    const handleUpload = () => {
        if (!isAdmin) {
            showError("Je hebt geen rechten (admin vereist).")
            return
        }
        router.push("/dashboard/documents/upload-center")
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    if (isTenantLoading) {
        return (
            <DashboardPage
                title="Mijn Documenten"
                description="Beheer je compliance en administratie op één plek."
                className="animate-fade-in-up"
            >
                <VaultStats
                    total={0}
                    attention={0}
                    expiringSoon={0}
                    storage={0}
                    loading
                />
                <VaultTableSkeleton />
            </DashboardPage>
        )
    }

    if (!tenant) {
        return (
            <DashboardPage
                title="Mijn Documenten"
                description="Beheer je compliance en administratie op één plek."
                className="animate-fade-in-up"
            >
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600 flex items-center gap-3">
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>Selecteer een bedrijf om je documenten te bekijken.</span>
                </div>
            </DashboardPage>
        )
    }

    return (
        <DashboardPage
            title="Mijn Documenten"
            description="Beheer je compliance en administratie op één plek."
            actions={
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/documents/activity">
                        <Button variant="outline" size="sm" className="gap-2 text-slate-600">
                            <History size={16} aria-hidden="true" />
                            <span className="hidden sm:inline">Activiteit</span>
                        </Button>
                    </Link>
                </div>
            }
            className="animate-fade-in-up"
        >
            {/* Stats */}
            <VaultStats
                total={computedStats.total}
                attention={computedStats.attention}
                expiringSoon={computedStats.expiringSoon}
                storage={computedStats.storage}
                loading={loading}
            />

            {/* Main Layout */}
            <div className="flex gap-6">
                {/* Sidebar - Desktop only */}
                <aside className="hidden lg:block w-56 shrink-0">
                    <div className="sticky top-4 space-y-4">
                        <VaultSidebar
                            categories={categoryCounts}
                            selectedCategory={filters.category}
                            onCategorySelect={(cat) => setFilters({ category: cat })}
                            totalCount={documents.length}
                            loading={loading}
                        />
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Mobile Category Dropdown */}
                    <div className="lg:hidden">
                        <VaultCategoryDropdown
                            categories={categoryCounts}
                            selectedCategory={filters.category}
                            onCategorySelect={(cat) => setFilters({ category: cat })}
                            totalCount={documents.length}
                        />
                    </div>

                    {/* Toolbar */}
                    <VaultToolbar
                        filters={filters}
                        onFiltersChange={setFilters}
                        onUpload={handleUpload}
                        isAdmin={isAdmin}
                    />

                    {/* Results */}
                    {loading ? (
                        <VaultTableSkeleton />
                    ) : filteredDocuments.length === 0 ? (
                        <VaultEmptyState
                            hasFilters={!!hasActiveFilters}
                            onClearFilters={clearFilters}
                            isAdmin={isAdmin}
                        />
                    ) : (
                        <>
                            {/* Results count */}
                            <div className="text-sm text-slate-500">
                                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "en" : ""} gevonden
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Filters wissen
                                    </button>
                                )}
                            </div>

                            {/* Table (Desktop) / Cards (Mobile) */}
                            <div className="hidden md:block">
                                <VaultTable
                                    documents={filteredDocuments}
                                    onSelect={handleDocumentSelect}
                                    onDownload={handleDownload}
                                    onDelete={isAdmin ? handleDelete : undefined}
                                    isAdmin={isAdmin}
                                    downloadingId={downloadingId}
                                />
                            </div>
                            <div className="md:hidden">
                                <VaultCardList
                                    documents={filteredDocuments}
                                    onSelect={handleDocumentSelect}
                                    onDownload={handleDownload}
                                    onDelete={isAdmin ? handleDelete : undefined}
                                    isAdmin={isAdmin}
                                    downloadingId={downloadingId}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Document Details Drawer */}
            <DocumentDrawer
                document={selectedDocument}
                isOpen={drawerOpen}
                onClose={(open) => setDrawerOpen(open)}
                onDownload={handleDownload}
                onDelete={isAdmin ? handleDelete : undefined}
                isAdmin={isAdmin}
                downloadingId={downloadingId}
            />

            {/* Error Toast */}
            {error && <ErrorToast message={error} onDismiss={() => setError(null)} variant={errorVariant} />}
        </DashboardPage>
    )
}
