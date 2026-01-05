"use client"

import { useState } from "react"
import { StikstofKpiRow, ActionPanel } from "@/components/stikstof/stikstof-components"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Download, FileText, Calculator, File, Upload } from "lucide-react"
import { PremiumBarsChart, type BarDatum } from "@/components/charts/PremiumBarsChart"
import { ChartCard } from "@/components/charts/chart-primitives"
import DashboardPage from "@/components/app/DashboardPage"
import { PreviewBadge, PreviewBanner, DisabledCta } from "@/components/ui/preview-badge"
import { UploadCta } from "@/components/documents/UploadCta"

// MVP Mock Data - Dossier focused
const DOSSIER_KPIS = [
    { key: "readiness", label: "Dossier Compleet", value: "92%", unit: "dekking", status: "safe" as const, deltaPct: 8, trend: [80, 82, 85, 88, 90, 92, 92] },
    { key: "missing", label: "Ontbrekende stukken", value: "1", unit: "item", status: "safe" as const, deltaPct: -5, trend: [5, 4, 3, 2, 1, 1, 1] },
    { key: "valid", label: "Geldige Kringloop", value: "Ja", unit: "2024", status: "safe" as const, deltaPct: 0, trend: [1, 1, 1, 1, 1, 1, 1] },
    { key: "total", label: "Totaal Documenten", value: "48", unit: "stuks", status: "safe" as const, deltaPct: 4, trend: [40, 42, 45, 46, 48, 48, 48] },
]

const COVERAGE_DATA: BarDatum[] = [
    { label: "BEX/Kringloop", value: 100 },
    { label: "Grondgebruik", value: 100 },
    { label: "Bemestingsplan", value: 85 },
    { label: "Analyses", value: 90 },
]

const RECENT_DOCS = [
    { id: 1, name: "Kringloopwijzer_2024_Concept.pdf", date: "2 d geleden", type: "Rapport" },
    { id: 2, name: "Bemonstering_Veld_Zuid.pdf", date: "5 d geleden", type: "Labuitslag" },
    { id: 3, name: "Bemestingsplan_2024_v3.pdf", date: "1 week geleden", type: "Plan" },
]

export default function StikstofPage() {
    const [isScenarioOpen, setIsScenarioOpen] = useState(false)

    return (
        <DashboardPage
            title="Dossier: Stikstof"
            description="Gebruiksruimte & BEX/Kringloop Documentatie"
            actions={
                <div className="flex items-center gap-2 text-sm z-30">
                    <PreviewBadge variant="demo-data" size="md" />
                    <UploadCta 
                        variant="button" 
                        size="sm" 
                        label="Upload bewijsstuk" 
                        category="STIKSTOF" 
                    />
                    <DisabledCta reason="Dossier index komt binnenkort">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                            <FileText className="mr-2 size-4" /> Dossier Index
                        </Button>
                    </DisabledCta>
                    <DisabledCta reason="Export komt binnenkort">
                        <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">
                            <Download className="mr-2 size-4" /> Exporteer Index (v1)
                        </Button>
                    </DisabledCta>
                </div>
            }
            className="animate-fade-in-up"
        >

            {/* Preview Banner */}
            <PreviewBanner
                title="Demo Stikstofdossier"
                description="Onderstaande gegevens zijn voorbeelddata. Koppel je RVO-account om je werkelijke dossierstatus te zien."
                variant="demo-data"
            />

            {/* KPIs */}
            <StikstofKpiRow kpis={DOSSIER_KPIS} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coverage Chart */}
                <ChartCard
                    title="Vereisten Dekking"
                    description="Compleetheid van verplichte onderdelen"
                    badge={<PreviewBadge variant="demo-data" size="sm" />}
                    className="col-span-1 lg:col-span-2"
                >
                    <PremiumBarsChart
                        data={COVERAGE_DATA}
                        height={280}
                        tone="blue"
                        valueLabel="%"
                        unit="%"
                        formatValue={(n) => `${Math.round(n)}`}
                        ariaLabel="Vereisten dekking per stikstof categorie"
                    />
                </ChartCard>

                {/* Status Progress Card */}
                <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center bg-blue-50/30 dark:bg-blue-950/20">
                    <CardContent className="p-6 flex flex-col items-center">
                        {/* Circular Progress */}
                        <div className="mb-4 relative">
                            <svg className="size-24 transform -rotate-90">
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-slate-200 dark:text-slate-700"
                                />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 * (1 - 0.92)}
                                    strokeLinecap="round"
                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-slate-800 dark:text-slate-200">
                                92%
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                Bijna Compleet
                            </h3>
                            <PreviewBadge variant="demo-data" size="sm" showIcon={false} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
                            Je stikstofdossier mist nog 1 analyseverslag.
                        </p>
                        <DisabledCta reason="Acties bekijken komt binnenkort">
                            <Button variant="outline" className="w-full bg-white dark:bg-slate-900 dark:border-slate-700">
                                Bekijk Acties
                            </Button>
                        </DisabledCta>
                    </CardContent>
                </Card>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-0 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Gekoppelde Documenten
                            </CardTitle>
                            <PreviewBadge variant="demo-data" size="sm" />
                        </div>
                        <DisabledCta reason="Document beheer komt binnenkort">
                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                                Alles bekijken
                            </Button>
                        </DisabledCta>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {RECENT_DOCS.map(doc => (
                                <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                                            <File size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {doc.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {doc.type} • {doc.date}
                                            </div>
                                        </div>
                                    </div>
                                    <DisabledCta reason="Downloads komen binnenkort">
                                        <Button variant="ghost" size="icon" className="text-slate-400 dark:text-slate-500">
                                            <Download size={16} />
                                        </Button>
                                    </DisabledCta>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Panel Reused */}
                <ActionPanelWithPreview actions={[
                    { id: '1', title: 'Upload Monstername Veld Zuid', priority: 'urgent', description: 'Ontbrekend document', ctaLabel: 'Uploaden' },
                    { id: '2', title: 'Controleer Kringloopwijzer', priority: 'soon', description: 'Concept versie beschikbaar', ctaLabel: 'Controleren' }
                ]} />
            </div>
        </DashboardPage>
    )
}

// Action Panel with Preview badges and working upload CTAs
function ActionPanelWithPreview({ actions }: { actions: { id: string, title: string, priority: string, description: string, ctaLabel: string }[] }) {
    return (
        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 flex flex-col">
            <CardHeader className="pb-2 bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Aanbevolen Acties
                    </CardTitle>
                    <PreviewBadge variant="demo-data" size="sm" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Optimaliseer uw dossier
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 p-0">
                {actions.map(action => (
                    <div key={action.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {action.title}
                            </h4>
                            {action.priority === 'urgent' && (
                                <span className="bg-red-500 text-white text-[10px] h-4 px-1.5 rounded">Urgent</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {action.description}
                        </p>
                        {action.ctaLabel === 'Uploaden' ? (
                            <UploadCta 
                                variant="button" 
                                size="sm" 
                                label={action.ctaLabel}
                                category="STIKSTOF"
                                className="w-full"
                            />
                        ) : (
                            <DisabledCta reason={`${action.ctaLabel} komt binnenkort`}>
                                <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    {action.ctaLabel}
                                </Button>
                            </DisabledCta>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
