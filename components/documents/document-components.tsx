"use client"

import React, { useState } from "react"
import {
    Search, Filter, Plus, FileText, Download, MoreVertical,
    CheckCircle2, Pin, FolderClosed
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DocumentItem, DOC_CATEGORIES } from "@/lib/documents/types"
import { SlideOver } from "@/components/calendar/calendar-overlays"

// --- Helper Components ---

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const RECENT_CUTOFF_MS = Date.now() - RECENT_WINDOW_MS

function openDocumentDownload(docId: string) {
    const url = `/api/documents/${docId}/download`
    const newWindow = window.open(url, "_blank", "noopener,noreferrer")
    if (!newWindow) {
        window.location.assign(url)
    }
}

export function StatusBadge({ status }: { status: DocumentItem['status'] }) {
    if (status === 'ok') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">In orde</Badge>
    if (status === 'needs_review') return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">Te controleren</Badge>
    if (status === 'missing_info') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Mist info</Badge>
    if (status === 'expired') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Verlopen</Badge>
    return null
}

export function FileIcon({ type }: { type: DocumentItem['docType'] }) {
    if (type === 'PDF') return <div className="size-8 rounded bg-red-100/80 text-red-600 flex items-center justify-center font-bold text-[10px] border border-red-200">PDF</div>
    if (type === 'XLS') return <div className="size-8 rounded bg-green-100/80 text-green-600 flex items-center justify-center font-bold text-[10px] border border-green-200">XLS</div>
    if (type === 'IMAGE') return <div className="size-8 rounded bg-purple-100/80 text-purple-600 flex items-center justify-center font-bold text-[10px] border border-purple-200">IMG</div>
    if (type === 'DOC') return <div className="size-8 rounded bg-blue-100/80 text-blue-600 flex items-center justify-center font-bold text-[10px] border border-blue-200">DOC</div>
    return <div className="size-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200"><FileText size={14} /></div>
}

// --- Main Components ---

export function DocumentsStats({ docs }: { docs: DocumentItem[] }) {
    const total = docs.length
    const attention = docs.filter(d => d.status === 'needs_review' || d.status === 'expired').length
    const recent = docs.filter(d => new Date(d.uploadedAt).getTime() > RECENT_CUTOFF_MS).length

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
            <Card className="p-4 border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Totaal</p>
                <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
            </Card>
            <Card className="p-4 border-slate-200 shadow-sm relative overflow-hidden group">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Te Controleren</p>
                <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                    {attention}
                    {attention > 0 && <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                {attention > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 opacity-20" />}
            </Card>
            <Card className="p-4 border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nieuw (7d)</p>
                <div className="text-2xl font-bold text-slate-900 mt-1">{recent}</div>
            </Card>
            <Card className="p-4 border-slate-200 shadow-sm bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opslag</p>
                <div className="text-2xl font-bold text-slate-900 mt-1">2.4 <span className="text-sm font-medium text-slate-400">GB</span></div>
            </Card>
        </div>
    )
}

export function DocumentsFilterBar({ search, setSearch, onUpload }: { search: string, setSearch: (s: string) => void, onUpload: () => void }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up delay-100">
            <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek op naam, tag, perceel..."
                    className="pl-9 bg-slate-50 border-transparent focus:bg-white transition-all h-10 rounded-lg text-sm"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="h-10 border-slate-200 text-slate-600 gap-2">
                    <Filter size={16} /> Filter
                </Button>
                <Button onClick={onUpload} size="sm" className="h-10 bg-slate-900 text-white hover:bg-slate-800 shadow-md gap-2 flex-1 sm:flex-none">
                    <Plus size={16} /> Upload
                </Button>
            </div>
        </div>
    )
}

export function DocumentsList({
    docs,
    onSelect
}: {
    docs: DocumentItem[],
    onSelect: (d: DocumentItem) => void
}) {
    if (docs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                <FolderClosed size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Geen documenten gevonden</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up delay-200">
            <div className="grid grid-cols-12 gap-4 p-3 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider align-middle">
                <div className="col-span-6 pl-2">Naam</div>
                <div className="col-span-2 hidden md:block">Categorie</div>
                <div className="col-span-2 hidden md:block">Status</div>
                <div className="col-span-2 text-right pr-2">Actie</div>
            </div>
            <div className="divide-y divide-slate-50">
                {docs.map(doc => (
                    <div
                        key={doc.id}
                        onClick={() => onSelect(doc)}
                        className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                        <div className="col-span-6 md:col-span-6 flex items-center gap-3 min-w-0">
                            <FileIcon type={doc.docType} />
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-700 text-sm truncate group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                                    {doc.isPinned && <Pin size={12} className="fill-slate-400 text-slate-400" />}
                                    {doc.title}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                    {doc.filename}
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center">
                            <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-600 font-normal">
                                {DOC_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                            </Badge>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center">
                            <StatusBadge status={doc.status} />
                        </div>
                        <div className="col-span-6 md:col-span-2 flex justify-end items-center gap-1 pr-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    openDocumentDownload(doc.id)
                                }}
                                aria-label="Download document"
                            >
                                <Download size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                <MoreVertical size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function DocumentDetailSheet({ doc, isOpen, onClose, onUpdate }: { doc: DocumentItem | null, isOpen: boolean, onClose: () => void, onUpdate: (d: DocumentItem) => void }) {
    if (!doc) return null

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="Details">
            <div className="space-y-6">
                {/* Header Preview */}
                <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center border border-slate-200">
                    <FileIcon type={doc.docType} />
                    <span className="ml-2 font-bold text-slate-500">VOORBEELD</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{doc.title}</h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">{doc.filename}</p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant="outline">{doc.year}</Badge>
                        <StatusBadge status={doc.status} />
                        {doc.isPinned && <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Gepind</Badge>}
                    </div>

                    <div className="space-y-3 pt-4">
                        <Button
                            className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => openDocumentDownload(doc.id)}
                        >
                            <Download className="mr-2 size-4" /> Download
                        </Button>
                        {doc.status !== 'ok' && (
                            <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => {
                                onUpdate({ ...doc, status: 'ok' })
                                onClose()
                            }}>
                                <CheckCircle2 className="mr-2 size-4" /> Goedkeuren
                            </Button>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Informatie</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Categorie</dt>
                                <dd className="font-medium text-slate-900">{DOC_CATEGORIES.find(c => c.value === doc.category)?.label}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Map</dt>
                                <dd className="font-medium text-slate-900">{doc.folder || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Geüpload</dt>
                                <dd className="font-medium text-slate-900">{new Date(doc.uploadedAt).toLocaleDateString()}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </SlideOver>
    )
}

export function UploadDialog({
    isOpen,
    onClose,
    onUpload,
}: {
    isOpen: boolean
    onClose: () => void
    onUpload: (payload: { title: string }) => void
}) {
    const [title, setTitle] = useState("")
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <Card className="relative w-full max-w-lg bg-white shadow-2xl animate-scale-in p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Document Uploaden</h2>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Titel</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bijv. Grondmonsters 2025" />
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">
                    <Plus className="mb-2" />
                    <span className="text-xs">Sleep bestand hierheen of klik</span>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" onClick={onClose}>Annuleren</Button>
                    <Button
                        onClick={() => {
                            onUpload({ title: title || "Nieuw Document" })
                            onClose()
                            setTitle("")
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        Uploaden
                    </Button>
                </div>
            </Card>
        </div>
    )
}
