"use client"

import { useState } from "react"
import { MestKpiRow, LedgerPanel, RecordDialog, } from "@/components/manure/manure-components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Plus, FileText, CheckCircle2, AlertTriangle, FileWarning } from "lucide-react"
import { PremiumBarChart } from "@/components/ui/premium-charts"

// MVP Mock Data
const DOSSIER_KPIS = [
    { key: "readiness", label: "Dossier Compleet", value: "85%", unit: "dekking", status: "safe" as const, deltaPct: 5, trend: [60, 65, 70, 75, 80, 82, 85] },
    { key: "missing", label: "Ontbrekende stukken", value: "3", unit: "items", status: "critical" as const, deltaPct: -2, trend: [5, 5, 4, 4, 3, 3, 3] },
    { key: "expired", label: "Verloopt binnenkort", value: "1", unit: "item", status: "warning" as const, deltaPct: 0, trend: [0, 0, 1, 1, 1, 1, 1] },
    { key: "total", label: "Gekoppelde docs", value: "142", unit: "totaal", status: "safe" as const, deltaPct: 12, trend: [120, 125, 130, 132, 138, 140, 142] },
]

const COVERAGE_DATA = [
    { label: "Vervoersbewijzen", value: 95 },
    { label: "Analyses", value: 80 },
    { label: "Bemonsteringsplannen", value: 100 },
    { label: "Grondmonsters", value: 60 },
]

const REGISTRATIONS_MOCK = [
    { id: '1', date: '2023-10-24', type: 'Afvoer' as const, amountTon: 32.5, counterparty: 'Jansen BV', docStatus: 'ok' as const, notes: 'Vervoersbewijs compleet' },
    { id: '2', date: '2023-10-22', type: 'Productie' as const, amountTon: 15.0, counterparty: '-', docStatus: 'ok' as const, notes: 'Eigen productie' },
    { id: '3', date: '2023-10-18', type: 'Aanvoer' as const, amountTon: 28.0, counterparty: 'De Boer VOF', docStatus: 'missing' as const, notes: 'Bon ontbreekt' },
    { id: '4', date: '2023-10-15', type: 'Afvoer' as const, amountTon: 30.0, counterparty: 'Biogas Oost', docStatus: 'review' as const, notes: 'Wachten op analyse' },
    { id: '5', date: '2023-10-12', type: 'Productie' as const, amountTon: 14.5, counterparty: '-', docStatus: 'ok' as const, notes: '' },
]

export default function ManurePage() {
    const [isRecordOpen, setIsRecordOpen] = useState(false)

    return (
        <div className="space-y-6 lg:space-y-8 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dossier: Mest</h1>
                    <p className="text-sm text-slate-500 mt-1">Mestboekhouding & Vervoersbewijzen</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                        <FileText className="mr-2 size-4" /> Dossier Index
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 shadow-sm text-slate-700">
                        <Download className="mr-2 size-4" /> Exporteer Index (v1)
                    </Button>
                    <Button size="sm" className="bg-slate-900 text-white shadow-md hover:bg-slate-800" onClick={() => setIsRecordOpen(true)}>
                        <Plus className="mr-2 size-4" /> Nieuwe Mutatie
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <MestKpiRow kpis={DOSSIER_KPIS} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Panel */}
                <Card className="col-span-1 shadow-sm border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Vereisten Dekking</h3>
                    <p className="text-xs text-slate-500 mb-6">Percentage documenten aanwezig per categorie</p>
                    <PremiumBarChart
                        data={COVERAGE_DATA.map(d => d.value)}
                        labels={COVERAGE_DATA.map(d => d.label)}
                        height={250}
                        color="#10b981"
                    />
                </Card>

                {/* Tips / Missing Panel - Replaces ChecksPanel */}
                <Card className="col-span-1 shadow-sm border-slate-200 p-6 flex flex-col bg-amber-50/30">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Openstaande Acties</h3>
                    <p className="text-xs text-slate-500 mb-4">Om je dossier compleet te maken</p>

                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3">
                            <FileWarning className="text-amber-500 size-5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Missend Vervoersbewijs</h4>
                                <p className="text-xs text-slate-500 mt-1">Mutatie 18 okt van De Boer VOF mist een scan.</p>
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 mt-2">Uploaden</Button>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3">
                            <AlertTriangle className="text-red-500 size-5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Grondanalyse Verloopt</h4>
                                <p className="text-xs text-slate-500 mt-1">Perceel 4b. Geldig tot 1 Jan 2024.</p>
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 mt-2">Plan bemonstering</Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Quick Links / Info */}
                <Card className="col-span-1 shadow-sm border-slate-200 p-6 flex flex-col justify-center items-center text-center">
                    <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="text-emerald-500 size-6" />
                    </div>
                    <h3 className="font-bold text-slate-900">Dossier Status</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Je mestboekhouding voldoet voor 85% aan de vereisten voor de aankomende controle.</p>
                    <Button variant="outline">Bekijk RVO Checklist</Button>
                </Card>
            </div>

            {/* Ledger Panel reused as Document List */}
            <div className="grid grid-cols-1">
                <LedgerPanel records={REGISTRATIONS_MOCK} onAddClick={() => setIsRecordOpen(true)} />
            </div>

            <RecordDialog isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} />
        </div>
    )
}
