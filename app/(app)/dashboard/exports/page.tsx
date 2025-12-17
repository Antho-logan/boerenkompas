"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/ai/shared-components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock, Eye, Trash2, Plus, Loader2 } from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import type { ExportWithDetails, DossierTemplate } from "@/lib/supabase/types"

export default function ExportsPage() {
    const { tenant } = useTenant();
    const [exports, setExports] = useState<ExportWithDetails[]>([]);
    const [templates, setTemplates] = useState<DossierTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);

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
        setGenerating(templateId);
        try {
            const response = await fetch('/api/exports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId }),
            });

            if (response.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error('Error generating export:', error);
        } finally {
            setGenerating(null);
        }
    };

    // View export
    const handleViewExport = (exp: ExportWithDetails) => {
        // Open in new window with the export HTML
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
        <div className="space-y-8 animate-fade-in-up">
            <PageHeader
                title="Export Center"
                subtitle="Genereer dossier-index documenten voor externe partijen."
            />

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
                            disabled={generating === template.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {generating === template.id ? (
                                <><Loader2 className="mr-2 size-4 animate-spin" /> Genereren...</>
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
        </div>
    )
}
