"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { StatCard } from "@/components/ai/shared-components"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    CheckCircle2, AlertTriangle, FileWarning, Clock, ShieldCheck,
    Loader2, Lock, X, Search, Upload, Link2, FileText, Plus, Unlink, Info,
    AlertCircle, RefreshCw
} from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import { Can } from "@/components/app/RBAC"
import type { RequirementWithStatus, DossierCheckSummary, DossierTemplate, Document } from "@/lib/supabase/types"
import { hasFeature } from "@/lib/plans"
import { mapApiErrorToMessage, canWrite } from "@/lib/supabase/errors"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import Link from "next/link"
import { cn } from "@/lib/utils"
import DashboardPage from "@/components/app/DashboardPage"

// --- Toast-like Notification Component ---
type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
}

function NotificationStack({ 
    notifications, 
    onDismiss 
}: { 
    notifications: Notification[];
    onDismiss: (id: string) => void;
}) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="region" aria-label="Meldingen">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    role="alert"
                    className={cn(
                        "px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right",
                        n.type === 'success' && "bg-emerald-50 border border-emerald-200 text-emerald-800",
                        n.type === 'error' && "bg-red-50 border border-red-200 text-red-800",
                        n.type === 'info' && "bg-blue-50 border border-blue-200 text-blue-800"
                    )}
                >
                    {n.type === 'success' && <CheckCircle2 className="size-4 flex-shrink-0" aria-hidden="true" />}
                    {n.type === 'error' && <AlertCircle className="size-4 flex-shrink-0" aria-hidden="true" />}
                    {n.type === 'info' && <Info className="size-4 flex-shrink-0" aria-hidden="true" />}
                    <span className="text-sm flex-1">{n.message}</span>
                    <button 
                        onClick={() => onDismiss(n.id)} 
                        className="text-current opacity-60 hover:opacity-100"
                        aria-label="Melding sluiten"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// --- Link Existing Document Dialog ---
function LinkDocumentDialog({
    isOpen,
    onClose,
    requirement,
    documents,
    onLink,
    linking,
}: {
    isOpen: boolean;
    onClose: () => void;
    requirement: RequirementWithStatus | null;
    documents: Document[];
    onLink: (docId: string) => Promise<void>;
    linking: boolean;
}) {
    const [search, setSearch] = useState("")

    const filtered = documents.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
        doc.category.toLowerCase().includes(search.toLowerCase())
    )

    const handleSelect = async (docId: string) => {
        await onLink(docId)
    }

    // Reset search when dialog opens
    useEffect(() => {
        if (isOpen) setSearch("")
    }, [isOpen])

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={requirement?.linkedDocument ? "Vervang document" : "Koppel bestaand document"}
            description={requirement?.title}
        >
            <div className="p-6 space-y-4">
                {/* Current link info */}
                {requirement?.linkedDocument && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm text-amber-800">
                        <strong>Let op:</strong> Er is al een document gekoppeld ({requirement.linkedDocument.title}). 
                        Door een ander document te selecteren wordt de huidige koppeling vervangen.
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Zoek op naam, categorie..."
                        className="pl-9 bg-slate-50 border-transparent focus:bg-white transition-all"
                        aria-label="Zoek documenten"
                    />
                </div>

                {/* Document List */}
                <div className="space-y-2" role="listbox" aria-label="Beschikbare documenten">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <FileText className="mx-auto size-8 mb-2 opacity-50" aria-hidden="true" />
                            <p className="text-sm">Geen documenten gevonden</p>
                        </div>
                    ) : (
                        filtered.map(doc => (
                            <div
                                key={doc.id}
                                role="option"
                                aria-selected={doc.id === requirement?.linkedDocument?.id}
                                tabIndex={0}
                                className={cn(
                                    "p-4 border rounded-xl cursor-pointer transition-all group",
                                    doc.id === requirement?.linkedDocument?.id
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-slate-50 hover:bg-emerald-50 border-slate-100 hover:border-emerald-200"
                                )}
                                onClick={() => !linking && handleSelect(doc.id)}
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && !linking) {
                                        e.preventDefault();
                                        handleSelect(doc.id);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                            <FileText size={18} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900 text-sm truncate group-hover:text-emerald-700">
                                                {doc.title}
                                                {doc.id === requirement?.linkedDocument?.id && (
                                                    <span className="ml-2 text-emerald-600 text-xs">(huidig)</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                                                <span>{doc.file_name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
                                                <Badge variant="secondary" className="text-[10px] h-4">
                                                    {doc.category}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={linking}
                                        aria-label={`Koppel ${doc.title}`}
                                        tabIndex={-1}
                                    >
                                        {linking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                                    <span>Status: </span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] h-5",
                                            doc.status === 'ok' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                doc.status === 'needs_review' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    doc.status === 'expired' ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-slate-100 text-slate-600"
                                        )}
                                    >
                                        {doc.status === 'ok' ? 'In orde' :
                                            doc.status === 'needs_review' ? 'Te controleren' :
                                                doc.status === 'expired' ? 'Verlopen' : doc.status}
                                    </Badge>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
                                    <span>{new Date(doc.created_at).toLocaleDateString('nl-NL')}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </SlideOver>
    )
}

// --- Upload New Document Dialog ---
function UploadDocumentDialog({
    isOpen,
    onClose,
    requirement,
    onUpload,
    uploading,
}: {
    isOpen: boolean;
    onClose: () => void;
    requirement: RequirementWithStatus | null;
    onUpload: (file: File, title: string) => Promise<void>;
    uploading: boolean;
}) {
    const [title, setTitle] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTitle("")
            setSelectedFile(null)
        }
    }, [isOpen])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''))
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''))
            }
        }
    }

    const handleSubmit = async () => {
        if (!selectedFile) return
        await onUpload(selectedFile, title || selectedFile.name.replace(/\.[^/.]+$/, ''))
    }

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Upload nieuw document"
            description={requirement?.title}
        >
            <div className="p-6 space-y-6">
                {/* Current link warning */}
                {requirement?.linkedDocument && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm text-amber-800">
                        <strong>Let op:</strong> Het huidige gekoppelde document ({requirement.linkedDocument.title}) 
                        wordt vervangen door het nieuwe document.
                    </div>
                )}

                {/* Title Input */}
                <div className="space-y-2">
                    <label htmlFor="upload-title" className="text-sm font-medium text-slate-700">Titel</label>
                    <Input
                        id="upload-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Bijv. Kringloopwijzer 2024"
                        className="bg-slate-50 focus:bg-white"
                    />
                </div>

                {/* Drop Zone */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Sleep bestand hierheen of klik om te selecteren"
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                        dragActive ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        selectedFile && "border-emerald-400 bg-emerald-50"
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        aria-label="Bestand selecteren"
                    />
                    {selectedFile ? (
                        <div className="space-y-2">
                            <div className="size-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FileText size={24} aria-hidden="true" />
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedFile(null)
                                }}
                                className="text-slate-500 hover:text-red-600"
                                aria-label="Geselecteerd bestand verwijderen"
                            >
                                <X size={14} className="mr-1" aria-hidden="true" /> Verwijder
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="size-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <Upload size={24} aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Sleep bestand hierheen</p>
                            <p className="text-xs text-slate-400 mt-1">of klik om te selecteren</p>
                            <p className="text-[10px] text-slate-400 mt-2">PDF, Word, Excel, of afbeeldingen</p>
                        </>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedFile || uploading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                    {uploading ? (
                        <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Uploaden...</>
                    ) : (
                        <><Upload className="mr-2 size-4" aria-hidden="true" /> Uploaden en koppelen</>
                    )}
                </Button>
            </div>
        </SlideOver>
    )
}

// --- Status Reason Helper ---
function getStatusReason(req: RequirementWithStatus): { reason: string; detail?: string } {
    const { linkStatus, linkedDocument: doc, documentLink, recency_days } = req;

    switch (linkStatus) {
        case 'satisfied':
            return { reason: 'Document voldoet aan de vereisten' };

        case 'missing':
            if (!documentLink) {
                return {
                    reason: 'Geen document gekoppeld',
                    detail: 'Koppel een bestaand document of upload een nieuw document.'
                };
            }
            if (documentLink.status_override === 'rejected') {
                return {
                    reason: 'Document afgekeurd',
                    detail: 'Het gekoppelde document is handmatig afgekeurd.'
                };
            }
            return { reason: 'Document ontbreekt' };

        case 'expired':
            if (doc?.status === 'expired') {
                return {
                    reason: 'Document is verlopen',
                    detail: doc.expires_at
                        ? `Verloopt op ${new Date(doc.expires_at).toLocaleDateString('nl-NL')}`
                        : 'Document status is "verlopen"'
                };
            }
            if (doc?.expires_at && new Date(doc.expires_at) < new Date()) {
                return {
                    reason: 'Document is verlopen',
                    detail: `Verlopen op ${new Date(doc.expires_at).toLocaleDateString('nl-NL')}`
                };
            }
            if (recency_days && doc) {
                const docDate = doc.doc_date ? new Date(doc.doc_date) : null;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - recency_days);

                if (!docDate) {
                    return {
                        reason: 'Documentdatum ontbreekt',
                        detail: `Dit document moet een datum hebben (max ${recency_days} dagen oud)`
                    };
                }
                if (docDate < cutoff) {
                    return {
                        reason: 'Document is te oud',
                        detail: `Document van ${docDate.toLocaleDateString('nl-NL')} is ouder dan ${recency_days} dagen`
                    };
                }
            }
            return { reason: 'Document is niet meer geldig' };

        case 'needs_review':
            if (documentLink?.status_override === 'not_sure') {
                return {
                    reason: 'Handmatig gemarkeerd voor controle',
                    detail: 'Dit document is handmatig gemarkeerd als "onzeker"'
                };
            }
            if (doc?.status === 'needs_review') {
                return {
                    reason: 'Document moet gecontroleerd worden',
                    detail: 'Controleer de inhoud en markeer als "ok" of "verlopen"'
                };
            }
            return { reason: 'Controle vereist' };

        default:
            return { reason: 'Onbekende status' };
    }
}

// --- Main Page Component ---
export default function DossierCheckPage() {
    const { tenant, effectivePlan, role } = useTenant();
    const [templates, setTemplates] = useState<DossierTemplate[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);

    const isAdmin = canWrite(role);
    const canGenerate = hasFeature(effectivePlan, 'missing_items_generator')

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<RequirementWithStatus[]>([]);
    const [summary, setSummary] = useState<DossierCheckSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Dialog state
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<RequirementWithStatus | null>(null);
    const [linking, setLinking] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planError, setPlanError] = useState<{ message: string; requiredPlan: string } | null>(null);

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notificationIdRef = useRef(0);

    const addNotification = useCallback((type: NotificationType, message: string) => {
        const id = `notification-${++notificationIdRef.current}`;
        setNotifications(prev => [...prev, { id, type, message }]);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Fetch templates
    const fetchTemplates = useCallback(async () => {
        try {
            const response = await fetch('/api/dossier/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
                if (data.templates?.length > 0 && !selectedTemplateId) {
                    setSelectedTemplateId(data.templates[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    }, [selectedTemplateId]);

    // Fetch documents for linking
    const fetchDocuments = useCallback(async () => {
        try {
            const response = await fetch('/api/documents');
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    }, []);

    // Fetch requirements with status
    const fetchRequirements = useCallback(async (showRefreshing = false) => {
        if (!selectedTemplateId || !tenant) return;

        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setPlanError(null);

        try {
            const response = await fetch(`/api/dossier/check?templateId=${selectedTemplateId}`);
            if (response.ok) {
                const data = await response.json();
                setRequirements(data.requirements || []);
                setSummary(data.summary || null);
            } else if (response.status === 403) {
                const data = await response.json();
                if (data.code === 'PLAN_UPGRADE_REQUIRED') {
                    setPlanError({
                        message: data.error || 'Upgrade vereist voor deze functie.',
                        requiredPlan: data.requiredPlan || 'pro',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching requirements:', error);
            addNotification('error', 'Kon vereisten niet laden');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedTemplateId, tenant, addNotification]);

    useEffect(() => {
        fetchTemplates();
        fetchDocuments();
    }, [fetchTemplates, fetchDocuments]);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);

    // Refresh button handler
    const handleRefresh = () => {
        fetchRequirements(true);
        fetchDocuments();
    };

    // Generate missing items
    const handleGenerateMissingItems = async () => {
        if (!selectedTemplateId || !canGenerate || !isAdmin) {
            if (!isAdmin) {
                addNotification('error', 'Je hebt geen rechten (admin vereist).');
            }
            return;
        }

        setGenerating(true);
        setError(null);
        try {
            const response = await fetch('/api/dossier/generate-missing-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: selectedTemplateId }),
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data.summary);
                await fetchRequirements(true);
                addNotification('success', data.message || 'Missende items gegenereerd');
            } else {
                const data = await response.json().catch(() => ({}));
                setError(mapApiErrorToMessage(response.status, data));
            }
        } catch (error) {
            console.error('Error generating missing items:', error);
            setError('Er is iets misgegaan. Probeer het opnieuw.');
        } finally {
            setGenerating(false);
        }
    };

    // Open link dialog
    const handleOpenLinkDialog = (req: RequirementWithStatus) => {
        if (!isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }
        setSelectedRequirement(req);
        setLinkDialogOpen(true);
        setError(null);
    };

    // Open upload dialog
    const handleOpenUploadDialog = (req: RequirementWithStatus) => {
        if (!isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }
        setSelectedRequirement(req);
        setUploadDialogOpen(true);
        setError(null);
    };

    // Open unlink confirmation dialog
    const handleOpenUnlinkDialog = (req: RequirementWithStatus) => {
        if (!isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }
        setSelectedRequirement(req);
        setUnlinkDialogOpen(true);
    };

    // Helper to update requirement status and summary
    const updateRequirementStatus = useCallback((
        reqId: string, 
        newStatus: RequirementWithStatus['linkStatus'], 
        linkedDoc: Document | null,
        oldStatus: RequirementWithStatus['linkStatus']
    ) => {
        setRequirements(prev =>
            prev.map(req =>
                req.id === reqId
                    ? { ...req, linkStatus: newStatus, linkedDocument: linkedDoc, documentLink: linkedDoc ? req.documentLink : null }
                    : req
            )
        );

        // Update summary counts
        setSummary(prev => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (oldStatus in updated) (updated as Record<string, number>)[oldStatus]--;
            if (newStatus in updated) (updated as Record<string, number>)[newStatus]++;
            return updated;
        });
    }, []);

    // Link document to requirement
    const handleLinkDocument = async (docId: string) => {
        if (!selectedRequirement || !isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }

        setLinking(true);
        const oldStatus = selectedRequirement.linkStatus;
        const linkedDoc = documents.find(d => d.id === docId);
        const newStatus: RequirementWithStatus['linkStatus'] = linkedDoc?.status === 'ok' ? 'satisfied' :
            linkedDoc?.status === 'expired' ? 'expired' : 'needs_review';

        // Optimistic update
        if (linkedDoc) {
            updateRequirementStatus(selectedRequirement.id, newStatus, linkedDoc, oldStatus);
        }

        try {
            const response = await fetch('/api/document-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirement_id: selectedRequirement.id,
                    document_id: docId,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(mapApiErrorToMessage(response.status, data));
            }

            setLinkDialogOpen(false);
            addNotification('success', 'Document gekoppeld');

            // Refresh to get accurate server state (especially for recency_days checks)
            setTimeout(() => fetchRequirements(true), 500);
        } catch (err) {
            // Revert optimistic update
            updateRequirementStatus(selectedRequirement.id, oldStatus, selectedRequirement.linkedDocument, newStatus);
            const message = err instanceof Error ? err.message : 'Kon document niet koppelen';
            addNotification('error', message);
            console.error('Error linking document:', err);
        } finally {
            setLinking(false);
        }
    };

    // Upload and link document
    const handleUploadAndLink = async (file: File, title: string) => {
        if (!selectedRequirement || !isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }

        setUploading(true);
        const oldStatus = selectedRequirement.linkStatus;

        try {
            // 1. Upload document
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('category', selectedRequirement.category);

            const uploadResponse = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const data = await uploadResponse.json().catch(() => ({}));
                throw new Error(mapApiErrorToMessage(uploadResponse.status, data));
            }

            const { document: uploadedDoc } = await uploadResponse.json();

            // 2. Link document to requirement
            const linkResponse = await fetch('/api/document-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirement_id: selectedRequirement.id,
                    document_id: uploadedDoc.id,
                }),
            });

            if (!linkResponse.ok) {
                // If link fails, the document is still uploaded (not orphaned in storage due to upload route handling)
                const data = await linkResponse.json().catch(() => ({}));
                throw new Error(mapApiErrorToMessage(linkResponse.status, data));
            }

            // Optimistic update
            updateRequirementStatus(selectedRequirement.id, 'needs_review', uploadedDoc, oldStatus);

            // Refresh documents list
            fetchDocuments();

            setUploadDialogOpen(false);
            addNotification('success', 'Document geüpload en gekoppeld');

            // Refresh requirements for accurate status
            setTimeout(() => fetchRequirements(true), 500);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kon document niet uploaden';
            addNotification('error', message);
            console.error('Error uploading document:', err);
        } finally {
            setUploading(false);
        }
    };

    // Unlink document from requirement
    const handleUnlinkDocument = async () => {
        if (!selectedRequirement || !isAdmin) {
            addNotification('error', 'Je hebt geen rechten (admin vereist).');
            return;
        }

        setUnlinking(true);
        const oldStatus = selectedRequirement.linkStatus;
        const oldDoc = selectedRequirement.linkedDocument;

        // Optimistic update
        updateRequirementStatus(selectedRequirement.id, 'missing', null, oldStatus);

        try {
            const response = await fetch(`/api/document-links?requirementId=${selectedRequirement.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(mapApiErrorToMessage(response.status, data));
            }

            setUnlinkDialogOpen(false);
            addNotification('success', 'Document ontkoppeld');
        } catch (err) {
            // Revert optimistic update
            updateRequirementStatus(selectedRequirement.id, oldStatus, oldDoc, 'missing');
            const message = err instanceof Error ? err.message : 'Kon document niet ontkoppelen';
            addNotification('error', message);
            console.error('Error unlinking document:', err);
        } finally {
            setUnlinking(false);
        }
    };

    // Group requirements by category
    const categorizedRequirements = requirements.reduce((acc, req) => {
        if (!acc[req.category]) acc[req.category] = [];
        acc[req.category].push(req);
        return acc;
    }, {} as Record<string, RequirementWithStatus[]>);

    const statusBadge = (status: RequirementWithStatus['linkStatus']) => {
        switch (status) {
            case 'satisfied':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Compleet</Badge>;
            case 'missing':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Ontbreekt</Badge>;
            case 'expired':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Verlopen</Badge>;
            case 'needs_review':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Controleren</Badge>;
            default:
                return null;
        }
    };

    return (
        <DashboardPage
            title="Dossier Check"
            description="Controleer of je dossier compleet is volgens de geselecteerde template."
            actions={
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="text-slate-600"
                        aria-label={refreshing ? 'Bezig met verversen' : 'Lijst verversen'}
                    >
                        <RefreshCw className={cn("size-4 mr-1", refreshing && "animate-spin")} aria-hidden="true" />
                        {refreshing ? 'Verversen...' : 'Verversen'}
                    </Button>

                    <select
                        value={selectedTemplateId || ''}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        aria-label="Selecteer dossier template"
                    >
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                        ))}
                    </select>

                    {/* Generate button - hidden for non-admins */}
                    <Can roles={['owner', 'advisor']}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger
                                    disabled={!selectedTemplateId || generating || !canGenerate}
                                    onClick={handleGenerateMissingItems}
                                    className={cn(
                                        buttonVariants({ variant: "default", size: "default" }),
                                        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md relative group",
                                        (!selectedTemplateId || generating || !canGenerate) && "opacity-50 pointer-events-none"
                                    )}
                                    aria-label={canGenerate ? "Genereer missende items" : "Upgrade naar Pro voor deze functie"}
                                >
                                    {generating ? (
                                        <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Bezig...</>
                                    ) : (
                                        <><ShieldCheck className="mr-2 size-4" aria-hidden="true" /> Genereer missende items</>
                                    )}
                                    {!canGenerate && (
                                        <div className="absolute -top-2 -right-2 bg-amber-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border-2 border-white shadow-sm">
                                            Pro
                                        </div>
                                    )}
                                </TooltipTrigger>
                                {!canGenerate && (
                                    <TooltipContent className="max-w-xs p-4 bg-white border-slate-200 shadow-xl">
                                        <div className="space-y-2 text-center">
                                            <p className="text-xs font-bold text-slate-900">AI Generator is een Pro feature</p>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                Bespaar tijd door AI automatisch ontbrekende dossier-items te laten identificeren en voorbereiden.
                                            </p>
                                            <Link href="/pricing">
                                                <Button size="sm" variant="outline" className="w-full text-[10px] font-bold h-7">
                                                    Upgrade naar Pro
                                                </Button>
                                            </Link>
                                        </div>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </Can>
                </div>
            }
            className="animate-fade-in-up"
        >

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-between" role="alert">
                    <span className="text-sm text-red-700">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Foutmelding sluiten">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Vereisten voldaan"
                    value={summary?.satisfied?.toString() || '0'}
                    icon={CheckCircle2}
                    variant="default"
                />
                <StatCard
                    label="Ontbreekt"
                    value={summary?.missing?.toString() || '0'}
                    icon={AlertTriangle}
                    variant="critical"
                />
                <StatCard
                    label="Verlopen"
                    value={summary?.expired?.toString() || '0'}
                    icon={Clock}
                    variant="warning"
                />
                <StatCard
                    label="Te controleren"
                    value={summary?.needs_review?.toString() || '0'}
                    icon={FileWarning}
                    variant="default"
                />
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-900" role="note">
                <div className="font-bold">Let op:</div>
                <div className="opacity-90">
                    BoerenKompas is een dossier-workflow tool. Dit overzicht is geen juridisch advies en biedt geen garantie op een foutloze inspectie.
                    Controleer altijd actuele regelgeving bij de betreffende overheidsinstanties.
                </div>
            </div>

            {/* Plan Upgrade Required */}
            {planError && (
                <Card className="p-8 text-center border-amber-200 bg-amber-50">
                    <Lock className="mx-auto size-12 text-amber-500 mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Upgrade Vereist</h3>
                    <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                        {planError.message}
                    </p>
                    <Link href="/pricing">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                            Bekijk plannen
                        </Button>
                    </Link>
                </Card>
            )}

            {/* Loading State */}
            {!planError && loading ? (
                <div className="space-y-4" role="status" aria-live="polite">
                    <span className="sr-only">Vereisten laden...</span>
                    {[1, 2].map((section) => (
                        <Card key={section} className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map((row) => (
                                    <div key={row} className="grid grid-cols-12 gap-4 items-center">
                                        <Skeleton className="h-4 w-12 col-span-2" />
                                        <Skeleton className="h-4 w-full col-span-5" />
                                        <Skeleton className="h-4 w-full col-span-3" />
                                        {isAdmin && <Skeleton className="h-8 w-20 col-span-2" />}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : !planError && requirements.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                    Geen vereisten gevonden voor deze template.
                </Card>
            ) : !planError && (
                /* Requirements by Category */
                Object.entries(categorizedRequirements).map(([category, reqs]) => (
                    <Card key={category} className="border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900">{category}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3" scope="col">Status</th>
                                        <th className="px-6 py-3" scope="col">Vereiste</th>
                                        <th className="px-6 py-3" scope="col">Document</th>
                                        {isAdmin && <th className="px-6 py-3" scope="col">Actie</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reqs.map(req => {
                                        const statusInfo = getStatusReason(req);
                                        return (
                                            <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="cursor-help">
                                                                    {statusBadge(req.linkStatus)}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p className="font-medium">{statusInfo.reason}</p>
                                                                {statusInfo.detail && (
                                                                    <p className="text-xs text-slate-500 mt-1">{statusInfo.detail}</p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{req.title}</div>
                                                    {req.notes && (
                                                        <div className="text-xs text-slate-500 mt-1">{req.notes}</div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {!req.required && (
                                                            <Badge variant="secondary" className="text-[10px]">Optioneel</Badge>
                                                        )}
                                                        {req.recency_days && (
                                                            <Badge variant="outline" className="text-[10px] bg-slate-50">
                                                                Max {req.recency_days} dagen oud
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {req.linkedDocument ? (
                                                        <div>
                                                            <span className="text-blue-600 hover:underline cursor-pointer">
                                                                {req.linkedDocument.title}
                                                            </span>
                                                            {req.linkedDocument.doc_date && (
                                                                <div className="text-xs text-slate-400 mt-0.5">
                                                                    Datum: {new Date(req.linkedDocument.doc_date).toLocaleDateString('nl-NL')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Geen document</span>
                                                    )}
                                                </td>
                                                {/* Action column - only for admins */}
                                                {isAdmin && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            {/* Link/Replace button */}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenLinkDialog(req)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Link2 size={14} className="mr-1" aria-hidden="true" />
                                                                {req.linkedDocument ? 'Vervang' : 'Koppel'}
                                                            </Button>

                                                            {/* Upload button */}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenUploadDialog(req)}
                                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            >
                                                                <Plus size={14} className="mr-1" aria-hidden="true" /> Upload
                                                            </Button>

                                                            {/* Unlink button - only if linked */}
                                                            {req.linkedDocument && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleOpenUnlinkDialog(req)}
                                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    aria-label={`Ontkoppel document van ${req.title}`}
                                                                >
                                                                    <Unlink size={14} aria-hidden="true" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))
            )}

            {/* Link Document Dialog */}
            <LinkDocumentDialog
                isOpen={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                requirement={selectedRequirement}
                documents={documents}
                onLink={handleLinkDocument}
                linking={linking}
            />

            {/* Upload Document Dialog */}
            <UploadDocumentDialog
                isOpen={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                requirement={selectedRequirement}
                onUpload={handleUploadAndLink}
                uploading={uploading}
            />

            {/* Unlink Confirmation Dialog */}
            <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-red-100 text-red-600">
                            <Unlink className="size-5" aria-hidden="true" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Document ontkoppelen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Weet je zeker dat je &quot;{selectedRequirement?.linkedDocument?.title}&quot; wilt ontkoppelen 
                            van &quot;{selectedRequirement?.title}&quot;?
                            <br /><br />
                            Het document wordt niet verwijderd, alleen de koppeling wordt opgeheven.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unlinking}>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnlinkDocument}
                            disabled={unlinking}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {unlinking ? (
                                <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Bezig...</>
                            ) : (
                                'Ontkoppelen'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Notifications */}
            <NotificationStack 
                notifications={notifications} 
                onDismiss={dismissNotification} 
            />
        </DashboardPage>
    )
}
