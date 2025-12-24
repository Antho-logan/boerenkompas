"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock, Eye, Trash2, Plus, Loader2, Lock } from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import type { ExportWithDetails, DossierTemplate } from "@/lib/supabase/types"
import { hasFeature } from "@/lib/plans"
import Link from "next/link"
import { cn } from "@/lib/utils"
import DashboardPage from "@/components/app/DashboardPage"

export default function ExportsPage() {
    const { tenant, effectivePlan } = useTenant();
    const [exports, setExports] = useState<ExportWithDetails[]>([]);
    
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
    const [error, setError] = useState<string | null>(null);

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
        if (isLimitReached) return;
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
        } finally {
            setGenerating(null);
        }
    };

    // View export
    const handleViewExport = (exp: ExportWithDetails) => {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(exp.index_html);
            newWindow.document.close();
        }
    };

    // Delete export
    const handleDeleteExport = async (id: string) => {
        try {
            await fetch(`/api/exports/${id}`, { method: 'DELETE' });
            setExports(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting export:', error);
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
                                <CheckCircle2 size={12} /> Onbeperkte exports
                            </span>
                        ) : (
                            <>
                                Maandelijks verbruik: <span className={cn("font-bold", isLimitReached ? "text-red-600" : "text-slate-900 dark:text-slate-100")}>{currentExportsCount} / {exportLimit}</span>
                            </>
                        )}
                    </div>
                    {!isUnlimited && (
                        <Link href="/pricing">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                Upgrade
                            </Button>
                        </Link>
                    )}
                </div>
            }
            className="animate-fade-in-up"
        >

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
                            )}
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Existing Exports */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                    Gegenereerde Exports
                </h3>

                {loading ? (
                    <Card className="p-8 text-center text-slate-400">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                        Exports laden...
                    </Card>
                ) : exports.length === 0 ? (
                    <Card className="p-8 text-center text-slate-400">
                        Nog geen exports gegenereerd. Gebruik de knoppen hierboven om te beginnen.
                    </Card>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {exports.map(exp => (
                            <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{exp.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Clock size={12} />
                                            {new Date(exp.created_at).toLocaleDateString('nl-NL', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            {exp.template && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    {exp.template.name}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewExport(exp)}
                                        className="text-slate-600 hover:text-emerald-600"
                                    >
                                        <Eye size={16} className="mr-1" /> Bekijk
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteExport(exp.id)}
                                        className="text-slate-400 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900">
                <strong>Let op:</strong> Gegenereerde exports bevatten een momentopname van uw dossier-status.
                Document-links zijn tijdelijk geldig (15 minuten). BoerenKompas is een workflow-tool en
                biedt geen juridische garanties.
            </div>
        </DashboardPage>
    )
}
