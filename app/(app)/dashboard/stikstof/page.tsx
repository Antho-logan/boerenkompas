"use client"

import { useState } from "react"
import { StikstofKpiRow, ActionPanel } from "@/components/stikstof/stikstof-components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, FileText, CheckCircle2, Sliders, Calculator, File, FileCheck } from "lucide-react"
import { PremiumBarChart } from "@/components/ui/premium-charts"

// MVP Mock Data - Dossier focused
const DOSSIER_KPIS = [
    { key: "readiness", label: "Dossier Compleet", value: "92%", unit: "dekking", status: "safe" as const, deltaPct: 8, trend: [80, 82, 85, 88, 90, 92, 92] },
    { key: "missing", label: "Ontbrekende stukken", value: "1", unit: "item", status: "safe" as const, deltaPct: -5, trend: [5, 4, 3, 2, 1, 1, 1] },
    { key: "valid", label: "Geldige Kringloop", value: "Ja", unit: "2024", status: "safe" as const, deltaPct: 0, trend: [1, 1, 1, 1, 1, 1, 1] },
    { key: "total", label: "Totaal Documenten", value: "48", unit: "stuks", status: "safe" as const, deltaPct: 4, trend: [40, 42, 45, 46, 48, 48, 48] },
]

const COVERAGE_DATA = [
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
        <div className="space-y-6 lg:space-y-8 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dossier: Stikstof</h1>
                    <p className="text-sm text-slate-500 mt-1">Gebruiksruimte & BEX/Kringloop Documentatie</p>
                </div>
                <div className="flex items-center gap-2 text-sm z-30">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                        <FileText className="mr-2 size-4" /> Dossier Index
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 shadow-sm text-slate-700">
                        <Download className="mr-2 size-4" /> Exporteer Index (v1)
                    </Button>
                    <Button size="sm" disabled className="bg-slate-100 text-slate-400 cursor-not-allowed">
                        <Calculator className="mr-2 size-4" /> Scenario (Binnenkort)
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <StikstofKpiRow kpis={DOSSIER_KPIS} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Vereisten Dekking</h3>
                    <p className="text-xs text-slate-500 mb-6">Compleetheid van verplichte onderdelen</p>
                    <PremiumBarChart
                        data={COVERAGE_DATA.map(d => d.value)}
                        labels={COVERAGE_DATA.map(d => d.label)}
                        height={280}
                        color="#3b82f6"
                    />
                </Card>

                {/* Status Card */}
                <Card className="col-span-1 shadow-sm border-slate-200 p-6 flex flex-col justify-center items-center text-center bg-blue-50/30">
                    <div className="mb-4 relative">
                        <svg className="size-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - 0.92)} className="text-blue-500" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-slate-800">92%</div>
                    </div>
                    <h3 className="font-bold text-slate-900">Bijna Compleet</h3>
                    <p className="text-xs text-slate-500 mt-2 mb-4">Je stikstofdossier mist nog 1 analyseverslag.</p>
                    <Button variant="outline" className="w-full bg-white">Bekijk Acties</Button>
                </Card>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Gekoppelde Documenten</h3>
                        <Button variant="ghost" size="sm" className="text-xs">Alles bekijken</Button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {RECENT_DOCS.map(doc => (
                            <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                        <File size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                                        <div className="text-xs text-slate-500">{doc.type} • {doc.date}</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400">
                                    <Download size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Action Panel Reused */}
                <ActionPanel actions={[
                    { id: '1', title: 'Upload Monstername Veld Zuid', priority: 'urgent', description: 'Ontbrekend document', ctaLabel: 'Uploaden' },
                    { id: '2', title: 'Controleer Kringloopwijzer', priority: 'soon', description: 'Concept versie beschikbaar', ctaLabel: 'Controleren' }
                ]} />
            </div>
        </div>
    )
}
