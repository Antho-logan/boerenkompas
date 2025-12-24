"use client"

import { useState, useEffect, useCallback } from "react"
import { DocumentsStats, DocumentsFilterBar, DocumentsList, DocumentDetailSheet, UploadDialog } from "@/components/documents/document-components"
import { useTenant } from "@/components/app/TenantProvider"
import DashboardPage from "@/components/app/DashboardPage"
import type { Document } from "@/lib/supabase/types"

// Map Supabase document to UI DocumentItem format
function toDocumentItem(doc: Document) {
    const categoryMap: Record<string, string> = {
        'onbekend': 'OVERIG',
        'bedrijfsgegevens': 'RVO_GLB',
        'percelen': 'RVO_GLB',
        'mest': 'MEST',
        'vergunningen': 'STIKSTOF',
        'dierenwelzijn': 'NVWA',
        'financieel': 'ACCOUNTANT_BANK',
    };

    const docTypeMap: Record<string, 'PDF' | 'IMAGE' | 'DOC' | 'XLS' | 'OTHER'> = {
        'application/pdf': 'PDF',
        'image/jpeg': 'IMAGE',
        'image/png': 'IMAGE',
        'image/webp': 'IMAGE',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
    };

    return {
        id: doc.id,
        title: doc.title,
        filename: doc.file_name,
        category: categoryMap[doc.category.toLowerCase()] || 'OVERIG',
        folder: doc.category,
        docType: docTypeMap[doc.mime_type || ''] || 'OTHER',
        year: doc.doc_date ? new Date(doc.doc_date).getFullYear() : new Date(doc.created_at).getFullYear(),
        status: doc.status === 'ok' ? 'ok' : doc.status === 'expired' ? 'expired' : doc.status === 'missing' ? 'missing_info' : 'needs_review',
        priority: 'normal' as const,
        source: 'manual' as const,
        uploadedAt: doc.created_at,
        updatedAt: doc.updated_at,
        tags: doc.tags || [],
        notes: doc.summary || undefined,
        // Keep original for API calls
        _original: doc,
    };
}

type DocumentsTabId = "all" | "recent" | "attention" | "folders"

function TabButton({
    id,
    label,
    count,
    active,
    onSelect,
}: {
    id: DocumentsTabId
    label: string
    count?: number
    active: boolean
    onSelect: (id: DocumentsTabId) => void
}) {
    return (
        <button
            onClick={() => onSelect(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${active
                ? "bg-white text-slate-900 border-slate-200 shadow-sm"
                : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900"
                }`}
        >
            {label}
            {count !== undefined && (
                <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-slate-100" : "bg-slate-200"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    )
}

export default function DocumentsPage() {
    const { tenant } = useTenant();
    const [docs, setDocs] = useState<ReturnType<typeof toDocumentItem>[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [currentTab, setCurrentTab] = useState<DocumentsTabId>("all")

    // Dialogs
    const [selectedDoc, setSelectedDoc] = useState<ReturnType<typeof toDocumentItem> | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        if (!tenant) return;

        setLoading(true);
        try {
            const response = await fetch('/api/documents');
            if (response.ok) {
                const data = await response.json();
                setDocs((data.documents || []).map(toDocumentItem));
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    }, [tenant]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Handlers
    const handleDocClick = (doc: ReturnType<typeof toDocumentItem>) => {
        setSelectedDoc(doc)
        setIsDetailOpen(true)
    }

    const handleUpload = async ({ title, file }: { title: string; file?: File }) => {
        if (!file) {
            // Just close dialog if no file
            setIsUploadOpen(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('category', 'onbekend');

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setDocs(prev => [toDocumentItem(data.document), ...prev]);
            } else {
                console.error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
        }

        setIsUploadOpen(false);
    }

    const handleUpdate = async (updatedDoc: ReturnType<typeof toDocumentItem>) => {
        try {
            const response = await fetch(`/api/documents/${updatedDoc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: updatedDoc.status === 'ok' ? 'ok' :
                        updatedDoc.status === 'expired' ? 'expired' : 'needs_review',
                }),
            });

            if (response.ok) {
                setDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    }

    // Filter Logic
    const filteredDocs = docs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))

        if (!matchesSearch) return false

        if (currentTab === 'recent') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return new Date(d.uploadedAt).getTime() > weekAgo;
        }
        if (currentTab === 'attention') return d.status === 'needs_review' || d.status === 'expired'

        return true
    })

    if (loading) {
        return (
            <DashboardPage
                title="Mijn documenten"
                description="Beheer je compliance en administratie op één plek."
                className="animate-fade-in-up"
            >
                <div className="h-64 flex items-center justify-center text-slate-400">
                    Documenten laden...
                </div>
            </DashboardPage>
        );
    }

    return (
        <DashboardPage
            title="Mijn documenten"
            description="Beheer je compliance en administratie op één plek."
            className="animate-fade-in-up"
        >
            <DocumentsStats docs={docs as any} />

            {/* Tabs & Toolbar */}
            <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl w-fit animate-fade-in-up delay-75">
                    <TabButton id="all" label="Alles" count={docs.length} active={currentTab === "all"} onSelect={setCurrentTab} />
                    <TabButton id="recent" label="Recent" active={currentTab === "recent"} onSelect={setCurrentTab} />
                    <TabButton id="attention" label="Te Controleren" count={docs.filter(d => d.status === 'needs_review').length} active={currentTab === "attention"} onSelect={setCurrentTab} />
                    <TabButton id="folders" label="Mappen" active={currentTab === "folders"} onSelect={setCurrentTab} />
                </div>

                <DocumentsFilterBar search={search} setSearch={setSearch} onUpload={() => setIsUploadOpen(true)} />
            </div>

            {/* Content */}
            {currentTab === 'folders' ? (
                <div className="h-64 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 animate-fade-in-up delay-200">
                    <div className="text-center">
                        <p>Mappenstructuur visualisatie (MVP Placeholder)</p>
                        <p className="text-xs mt-2">Hier komen de vaste mappen voor RVO, Mest, etc.</p>
                    </div>
                </div>
            ) : (
                <DocumentsList docs={filteredDocs as any} onSelect={handleDocClick as any} />
            )}

            <DocumentDetailSheet doc={selectedDoc as any} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} onUpdate={handleUpdate as any} />
            <UploadDialogWithFile isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUpload={handleUpload} />
        </DashboardPage>
    )
}

// Extended upload dialog with file support
function UploadDialogWithFile({
    isOpen,
    onClose,
    onUpload,
}: {
    isOpen: boolean
    onClose: () => void
    onUpload: (payload: { title: string; file?: File }) => void
}) {
    const [title, setTitle] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!file) return;
        setUploading(true);
        await onUpload({ title: title || file.name.replace(/\.[^/.]+$/, ''), file });
        setTitle("");
        setFile(null);
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl animate-scale-in p-6 space-y-4 rounded-xl">
                <h2 className="text-lg font-bold text-slate-900">Document Uploaden</h2>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Titel (optioneel)</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Bijv. Grondmonsters 2025"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Bestand</label>
                    <input
                        type="file"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {file && (
                        <p className="text-xs text-slate-500">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                    )}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        Annuleren
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || uploading}
                        className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                    >
                        {uploading ? 'Uploaden...' : 'Uploaden'}
                    </button>
                </div>
            </div>
        </div>
    )
}
