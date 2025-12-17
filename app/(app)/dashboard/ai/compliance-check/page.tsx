"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader, StatCard } from "@/components/ai/shared-components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, FileWarning, Clock, ArrowRight, ShieldCheck, RefreshCw, Loader2 } from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import type { RequirementWithStatus, DossierCheckSummary, DossierTemplate } from "@/lib/supabase/types"

export default function DossierCheckPage() {
    const { tenant } = useTenant();
    const [templates, setTemplates] = useState<DossierTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<RequirementWithStatus[]>([]);
    const [summary, setSummary] = useState<DossierCheckSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

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

    // Fetch requirements with status
    const fetchRequirements = useCallback(async () => {
        if (!selectedTemplateId || !tenant) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/dossier/check?templateId=${selectedTemplateId}`);
            if (response.ok) {
                const data = await response.json();
                setRequirements(data.requirements || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error('Error fetching requirements:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedTemplateId, tenant]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);

    // Generate missing items
    const handleGenerateMissingItems = async () => {
        if (!selectedTemplateId) return;

        setGenerating(true);
        try {
            const response = await fetch('/api/dossier/generate-missing-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: selectedTemplateId }),
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data.summary);
                // Refresh requirements
                await fetchRequirements();
            }
        } catch (error) {
            console.error('Error generating missing items:', error);
        } finally {
            setGenerating(false);
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
        <div className="space-y-6 lg:space-y-8 animate-fade-in-up">
            <PageHeader
                title="Dossier Check"
                subtitle="Controleer of je dossier compleet is volgens de geselecteerde template."
                actions={
                    <div className="flex items-center gap-3">
                        {/* Template Selector */}
                        <select
                            value={selectedTemplateId || ''}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                            ))}
                        </select>

                        <Button
                            onClick={handleGenerateMissingItems}
                            disabled={!selectedTemplateId || generating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        >
                            {generating ? (
                                <><Loader2 className="mr-2 size-4 animate-spin" /> Bezig...</>
                            ) : (
                                <><ShieldCheck className="mr-2 size-4" /> Genereer missende items</>
                            )}
                        </Button>
                    </div>
                }
            />

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
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-900">
                <div className="font-bold">Let op:</div>
                <div className="opacity-90">
                    BoerenKompas is een dossier-workflow tool. Dit overzicht is geen juridisch advies en biedt geen garantie op een foutloze inspectie.
                    Controleer altijd actuele regelgeving bij de betreffende overheidsinstanties.
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <Card className="p-12 text-center text-slate-400">
                    <Loader2 className="mx-auto size-8 animate-spin mb-4" />
                    Vereisten laden...
                </Card>
            ) : requirements.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                    Geen vereisten gevonden voor deze template.
                </Card>
            ) : (
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
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Vereiste</th>
                                        <th className="px-6 py-3">Document</th>
                                        <th className="px-6 py-3">Actie</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reqs.map(req => (
                                        <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {statusBadge(req.linkStatus)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{req.title}</div>
                                                {req.notes && (
                                                    <div className="text-xs text-slate-500 mt-1">{req.notes}</div>
                                                )}
                                                {!req.required && (
                                                    <Badge variant="secondary" className="mt-1 text-[10px]">Optioneel</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {req.linkedDocument ? (
                                                    <span className="text-blue-600 hover:underline cursor-pointer">
                                                        {req.linkedDocument.title}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Geen document</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    {req.linkStatus === 'missing' ? 'Uploaden' : 'Bekijk'}
                                                    <ArrowRight size={14} className="ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))
            )}
        </div>
    )
}
