"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
<<<<<<< HEAD
import { FileText, CheckCircle2, Clock, Eye, Trash2, Plus, Loader2, Lock } from "lucide-react"
=======
import { Skeleton } from "@/components/ui/skeleton"
import { 
    FileText, CheckCircle2, Clock, Eye, Trash2, Plus, Loader2, Lock,
    Copy, ExternalLink, AlertTriangle, CreditCard
} from "lucide-react"
>>>>>>> b0318de (chore: sync updates)
import { useTenant } from "@/components/app/TenantProvider"
import { Can } from "@/components/app/RBAC"
import type { ExportWithDetails, DossierTemplate } from "@/lib/supabase/types"
import { hasFeature } from "@/lib/plans"
<<<<<<< HEAD
import Link from "next/link"
import { cn } from "@/lib/utils"
import DashboardPage from "@/components/app/DashboardPage"

export default function ExportsPage() {
    const { tenant, effectivePlan } = useTenant();
    const [exports, setExports] = useState<ExportWithDetails[]>([]);
    
=======
import { canWrite } from "@/lib/supabase/errors"
import Link from "next/link"
import { cn } from "@/lib/utils"
import DashboardPage from "@/components/app/DashboardPage"

// Simple toast notification component (no dependencies)
function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in",
            type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
            {type === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
            {message}
        </div>
    );
}

// Template card skeleton for loading state
function TemplateCardSkeleton() {
    return (
        <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-4 w-8 rounded" />
            </div>
            <Skeleton className="h-5 w-32 rounded mb-2" />
            <Skeleton className="h-4 w-full rounded mb-1" />
            <Skeleton className="h-4 w-2/3 rounded mb-4" />
            <Skeleton className="h-10 w-full rounded-lg" />
        </Card>
    );
}

// Export row skeleton for loading state
function ExportRowSkeleton() {
    return (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-56 rounded" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
            </div>
        </div>
    );
}

// Check if a share link has expired
function isLinkExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

// Build the share URL
function getShareUrl(shareToken: string | null): string | null {
    if (!shareToken) return null;
    // Use window.location.origin for full URL
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/exports/${shareToken}`;
    }
    return `/exports/${shareToken}`;
}

export default function ExportsPage() {
    const { tenant, effectivePlan, role } = useTenant();
    const [exports, setExports] = useState<ExportWithDetails[]>([]);
    
    const isAdmin = canWrite(role);
>>>>>>> b0318de (chore: sync updates)
    const isUnlimited = hasFeature(effectivePlan, 'exports_unlimited')
    const limitValue = hasFeature(effectivePlan, 'exports_monthly_limit')
    const exportLimit = isUnlimited ? Infinity : (typeof limitValue === 'number' ? limitValue : 0)
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const currentExportsCount = exports.filter(exp => new Date(exp.created_at) >= monthStart).length
    const isLimitReached = !isUnlimited && currentExportsCount >= exportLimit

    const [templates, setTemplates] = useState<DossierTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
<<<<<<< HEAD
    const [error, setError] = useState<string | null>(null);
=======
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
>>>>>>> b0318de (chore: sync updates)

    // Fetch exports and templates
    const fetchData = useCallback(async () => {
        if (!tenant) return;

        setLoading(true);
        try {
            const [exportsRes, templatesRes] = await Promise.all([
                fetch('/api/exports'),
                fetch('/api/dossier/templates'),
            ]);

            if (exportsRes.ok) {
                const data = await exportsRes.json();
                setExports(data.exports || []);
            }
            if (templatesRes.ok) {
                const data = await templatesRes.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [tenant]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Generate new export
    const handleGenerateExport = async (templateId: string) => {
<<<<<<< HEAD
        if (isLimitReached) return;
=======
        if (isLimitReached || !isAdmin) return;
>>>>>>> b0318de (chore: sync updates)
        setGenerating(templateId);
        setError(null);
        try {
            const response = await fetch('/api/exports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId }),
            });

            if (response.ok) {
                await fetchData();
<<<<<<< HEAD
            } else if (response.status === 402 || response.status === 403) {
                const data = await response.json();
                if (data.code === 'EXPORT_LIMIT_REACHED') {
                    setError(data.error || 'Je exportlimiet voor deze maand is bereikt.');
                } else if (data.code === 'PLAN_UPGRADE_REQUIRED') {
                    setError(`Upgrade naar ${data.requiredPlan || 'Pro'} vereist voor exports.`);
                } else {
                    setError('Je hebt geen toegang tot deze functie.');
                }
            } else {
                setError('Er is iets misgegaan. Probeer het opnieuw.');
            }
        } catch (err) {
            console.error('Error generating export:', err);
            setError('Er is iets misgegaan. Probeer het opnieuw.');
=======
                setToast({ message: 'Export succesvol gegenereerd!', type: 'success' });
            } else {
                const data = await response.json().catch(() => ({}));
                // Improved error handling for 402/403
                if (response.status === 402 && data?.code === 'EXPORT_LIMIT_REACHED') {
                    setError({ 
                        message: 'Je maandelijkse exportlimiet is bereikt. Upgrade je abonnement voor meer exports.',
                        code: 'EXPORT_LIMIT_REACHED'
                    });
                } else if (response.status === 403) {
                    setError({ 
                        message: 'Je hebt geen rechten om exports te genereren (admin vereist).',
                        code: 'FORBIDDEN'
                    });
                } else {
                    setError({ message: data?.error || 'Er is iets misgegaan. Probeer het opnieuw.' });
                }
            }
        } catch (err) {
            console.error('Error generating export:', err);
            setError({ message: 'Er is iets misgegaan. Probeer het opnieuw.' });
>>>>>>> b0318de (chore: sync updates)
        } finally {
            setGenerating(null);
        }
    };

    // View export (in new window)
    const handleViewExport = (exp: ExportWithDetails) => {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(exp.index_html);
            newWindow.document.close();
        }
    };

    // Copy share link to clipboard
    const handleCopyLink = async (exp: ExportWithDetails) => {
        const url = getShareUrl(exp.share_token);
        if (!url) {
            setToast({ message: 'Geen deellink beschikbaar', type: 'error' });
            return;
        }
        if (isLinkExpired(exp.expires_at)) {
            setToast({ message: 'Deze link is verlopen', type: 'error' });
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setToast({ message: 'Link gekopieerd naar klembord!', type: 'success' });
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setToast({ message: 'Link gekopieerd naar klembord!', type: 'success' });
        }
    };

    // Open share link in new tab
    const handleOpenLink = (exp: ExportWithDetails) => {
        const url = getShareUrl(exp.share_token);
        if (!url || isLinkExpired(exp.expires_at)) return;
        window.open(url, '_blank');
    };

    // Delete export
    const handleDeleteExport = async (id: string) => {
        if (!isAdmin) {
            setError({ message: 'Je hebt geen rechten (admin vereist).', code: 'FORBIDDEN' });
            return;
        }
        try {
            const response = await fetch(`/api/exports/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setExports(prev => prev.filter(e => e.id !== id));
                setToast({ message: 'Export verwijderd', type: 'success' });
            } else {
                const data = await response.json().catch(() => ({}));
                if (response.status === 403) {
                    setError({ message: 'Je hebt geen rechten (admin vereist).', code: 'FORBIDDEN' });
                } else {
                    setError({ message: data?.error || 'Er is iets misgegaan bij het verwijderen.' });
                }
            }
        } catch (error) {
            console.error('Error deleting export:', error);
            setError({ message: 'Er is iets misgegaan bij het verwijderen.' });
        }
    };

    return (
        <DashboardPage
            title="Export Center"
            description="Genereer dossier-index documenten voor externe partijen."
            actions={
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        {isUnlimited ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
<<<<<<< HEAD
                                <CheckCircle2 size={12} /> Onbeperkte exports
=======
                                <CheckCircle2 size={12} aria-hidden="true" /> Onbeperkte exports
>>>>>>> b0318de (chore: sync updates)
                            </span>
                        ) : (
                            <>
                                Maandelijks verbruik: <span className={cn("font-bold", isLimitReached ? "text-red-600" : "text-slate-900 dark:text-slate-100")}>{currentExportsCount} / {exportLimit}</span>
                            </>
                        )}
                    </div>
                    {!isUnlimited && (
<<<<<<< HEAD
                        <Link href="/pricing">
=======
                        <Link href="/dashboard/settings/billing">
>>>>>>> b0318de (chore: sync updates)
                            <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                Upgrade
                            </Button>
                        </Link>
                    )}
                </div>
            }
            className="animate-fade-in-up"
        >
<<<<<<< HEAD

            {/* Error Banner */}
            {error && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="size-5 text-amber-600" />
                        <span className="text-sm text-amber-800 font-medium">{error}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/pricing">
                            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                                Bekijk plannen
                            </Button>
                        </Link>
                        <button
                            onClick={() => setError(null)}
                            className="text-amber-500 hover:text-amber-700 p-1"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Generate New Export Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                    <Card key={template.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                <FileText size={24} className="text-slate-400" />
                            </div>
                            <span className="text-xs text-slate-400">v{template.version}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">{template.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Genereer een dossier-index voor {template.name.toLowerCase()}.
                        </p>
                        <Button
                            onClick={() => handleGenerateExport(template.id)}
                            disabled={generating === template.id || isLimitReached}
                            className={cn(
                                "w-full",
                                isLimitReached 
                                    ? "bg-slate-100 text-slate-400 hover:bg-slate-100 border-dashed border-2 border-slate-200 shadow-none cursor-not-allowed" 
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                            )}
                        >
                            {generating === template.id ? (
                                <><Loader2 className="mr-2 size-4 animate-spin" /> Genereren...</>
                            ) : isLimitReached ? (
                                <><Lock className="mr-2 size-4" /> Limiet bereikt</>
                            ) : (
                                <><Plus className="mr-2 size-4" /> Genereer Index</>
=======

            {/* Error Banner with improved UX */}
            {error && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center justify-between",
                    error.code === 'EXPORT_LIMIT_REACHED' 
                        ? "bg-amber-50 border border-amber-200" 
                        : "bg-red-50 border border-red-200"
                )}>
                    <div className="flex items-center gap-3">
                        {error.code === 'EXPORT_LIMIT_REACHED' ? (
                            <CreditCard className="size-5 text-amber-600" aria-hidden="true" />
                        ) : (
                            <Lock className="size-5 text-red-600" aria-hidden="true" />
                        )}
                        <span className={cn(
                            "text-sm font-medium",
                            error.code === 'EXPORT_LIMIT_REACHED' ? "text-amber-800" : "text-red-800"
                        )}>
                            {error.message}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {error.code === 'EXPORT_LIMIT_REACHED' && (
                            <Link href="/dashboard/settings/billing">
                                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                                    <CreditCard size={14} className="mr-1" aria-hidden="true" /> Upgrade abonnement
                                </Button>
                            </Link>
                        )}
                        <button
                            onClick={() => setError(null)}
                            className={cn(
                                "p-1",
                                error.code === 'EXPORT_LIMIT_REACHED' 
                                    ? "text-amber-500 hover:text-amber-700" 
                                    : "text-red-500 hover:text-red-700"
>>>>>>> b0318de (chore: sync updates)
                            )}
                            aria-label="Foutmelding sluiten"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Generate New Export Section - Only visible to admins */}
            <Can roles={['owner', 'advisor']}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        // Skeleton loading state for template cards
                        <>
                            <TemplateCardSkeleton />
                            <TemplateCardSkeleton />
                            <TemplateCardSkeleton />
                        </>
                    ) : (
                        templates.map(template => (
                            <Card key={template.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                        <FileText size={24} className="text-slate-400" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs text-slate-400">v{template.version}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{template.name}</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Genereer een dossier-index voor {template.name.toLowerCase()}.
                                </p>
                                <Button
                                    onClick={() => handleGenerateExport(template.id)}
                                    disabled={generating === template.id || isLimitReached}
                                    className={cn(
                                        "w-full",
                                        isLimitReached 
                                            ? "bg-slate-100 text-slate-400 hover:bg-slate-100 border-dashed border-2 border-slate-200 shadow-none cursor-not-allowed" 
                                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                    )}
                                >
                                    {generating === template.id ? (
                                        <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Genereren...</>
                                    ) : isLimitReached ? (
                                        <><Lock className="mr-2 size-4" aria-hidden="true" /> Limiet bereikt</>
                                    ) : (
                                        <><Plus className="mr-2 size-4" aria-hidden="true" /> Genereer Index</>
                                    )}
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            </Can>

            {/* Member view: show read-only message */}
            <Can roles={['staff', 'viewer']} fallback={null}>
                <Card className="p-6 bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-3 text-slate-600">
                        <Lock size={20} aria-hidden="true" />
                        <span className="text-sm">Je hebt alleen leesrechten. Neem contact op met een admin om exports te genereren.</span>
                    </div>
                </Card>
            </Can>

            {/* Existing Exports */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                    Gegenereerde Exports
                </h3>

                {loading ? (
                    // Skeleton loading state for exports list
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        <ExportRowSkeleton />
                        <ExportRowSkeleton />
                        <ExportRowSkeleton />
                    </div>
                ) : exports.length === 0 ? (
                    <Card className="p-8 text-center border-slate-200">
                        <div className="size-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <FileText className="size-6 text-slate-400" aria-hidden="true" />
                        </div>
                        <p className="font-medium text-slate-600 mb-1">Nog geen exports</p>
                        <p className="text-sm text-slate-400">
                            {isAdmin ? 'Gebruik de knoppen hierboven om te beginnen.' : 'Vraag een admin om exports te genereren.'}
                        </p>
                    </Card>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {exports.map(exp => {
                            const expired = isLinkExpired(exp.expires_at);
                            const hasShareLink = !!exp.share_token;

                            return (
                                <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-10 rounded-full flex items-center justify-center",
                                            expired ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {expired ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">{exp.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Clock size={12} aria-hidden="true" />
                                                {new Date(exp.created_at).toLocaleDateString('nl-NL', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {exp.template && (
                                                    <>
                                                        <span className="text-slate-300" aria-hidden="true">•</span>
                                                        {exp.template.name}
                                                    </>
                                                )}
                                                {/* Show expiry status */}
                                                {hasShareLink && (
                                                    <>
                                                        <span className="text-slate-300" aria-hidden="true">•</span>
                                                        {expired ? (
                                                            <span className="text-red-500 font-medium">Link verlopen</span>
                                                        ) : exp.expires_at ? (
                                                            <span className="text-emerald-600">
                                                                Geldig tot {new Date(exp.expires_at).toLocaleDateString('nl-NL', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600">Geldig</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Share link actions */}
                                        {hasShareLink && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyLink(exp)}
                                                    disabled={expired}
                                                    aria-label="Kopieer deellink"
                                                    title={expired ? "Link verlopen" : "Kopieer deellink"}
                                                    className={cn(
                                                        "text-xs",
                                                        expired 
                                                            ? "text-slate-300 cursor-not-allowed" 
                                                            : "text-slate-600 hover:text-emerald-600"
                                                    )}
                                                >
                                                    <Copy size={14} className="mr-1" aria-hidden="true" /> 
                                                    <span className="hidden sm:inline">Kopieer link</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenLink(exp)}
                                                    disabled={expired}
                                                    aria-label="Open deellink in nieuw tabblad"
                                                    title={expired ? "Link verlopen" : "Open in nieuw tabblad"}
                                                    className={cn(
                                                        "text-xs",
                                                        expired 
                                                            ? "text-slate-300 cursor-not-allowed" 
                                                            : "text-slate-600 hover:text-emerald-600"
                                                    )}
                                                >
                                                    <ExternalLink size={14} className="mr-1" aria-hidden="true" /> 
                                                    <span className="hidden sm:inline">Open</span>
                                                </Button>
                                            </>
                                        )}
                                        {/* View raw HTML */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewExport(exp)}
                                            aria-label="Bekijk export preview"
                                            title="Bekijk HTML preview"
                                            className="text-slate-600 hover:text-emerald-600 text-xs"
                                        >
                                            <Eye size={14} className="mr-1" aria-hidden="true" /> 
                                            <span className="hidden sm:inline">Preview</span>
                                        </Button>
                                        {/* Delete button - only visible to admins */}
                                        <Can roles={['owner', 'advisor']}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteExport(exp.id)}
                                                className="text-slate-400 hover:text-red-600"
                                                title="Verwijder export"
                                                aria-label="Verwijder export"
                                            >
                                                <Trash2 size={14} aria-hidden="true" />
                                            </Button>
                                        </Can>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900">
                <strong>Let op:</strong> Gegenereerde exports bevatten een momentopname van uw dossier-status.
                Deellinks zijn standaard 7 dagen geldig. BoerenKompas is een workflow-tool en
                biedt geen juridische garanties.
            </div>
<<<<<<< HEAD
=======

            {/* Toast notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
>>>>>>> b0318de (chore: sync updates)
        </DashboardPage>
    )
}
