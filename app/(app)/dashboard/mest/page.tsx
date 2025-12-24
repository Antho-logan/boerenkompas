"use client"

import { useState } from "react"
import { MestKpiRow, LedgerPanel, RecordDialog } from "@/components/manure/manure-components"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Download, Plus, FileText, CheckCircle2, AlertTriangle, FileWarning } from "lucide-react"
import { PremiumBarsChart, type BarDatum } from "@/components/charts/PremiumBarsChart"
import { ChartCard } from "@/components/charts/chart-primitives"
import DashboardPage from "@/components/app/DashboardPage"

// MVP Mock Data
const DOSSIER_KPIS = [
    { key: "readiness", label: "Dossier Compleet", value: "85%", unit: "dekking", status: "safe" as const, deltaPct: 5, trend: [60, 65, 70, 75, 80, 82, 85] },
    { key: "missing", label: "Ontbrekende stukken", value: "3", unit: "items", status: "critical" as const, deltaPct: -2, trend: [5, 5, 4, 4, 3, 3, 3] },
    { key: "expired", label: "Verloopt binnenkort", value: "1", unit: "item", status: "warning" as const, deltaPct: 0, trend: [0, 0, 1, 1, 1, 1, 1] },
    { key: "total", label: "Gekoppelde docs", value: "142", unit: "totaal", status: "safe" as const, deltaPct: 12, trend: [120, 125, 130, 132, 138, 140, 142] },
]

const COVERAGE_DATA: BarDatum[] = [
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
        <DashboardPage
            title="Dossier: Mest"
            description="Mestboekhouding & Vervoersbewijzen"
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                        <FileText className="mr-2 size-4" /> Dossier Index
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">
                        <Download className="mr-2 size-4" /> Exporteer Index (v1)
                    </Button>
                    <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-slate-200" onClick={() => setIsRecordOpen(true)}>
                        <Plus className="mr-2 size-4" /> Nieuwe Mutatie
                    </Button>
                </div>
            }
            className="animate-fade-in-up"
        >

            {/* KPIs */}
            <MestKpiRow kpis={DOSSIER_KPIS} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coverage Chart Panel */}
                <ChartCard
                    title="Vereisten Dekking"
                    description="Percentage documenten aanwezig per categorie"
                    className="col-span-1"
                >
                    <PremiumBarsChart
                        data={COVERAGE_DATA}
                        height={250}
                        tone="emerald"
                        valueLabel="%"
                        unit="%"
                        formatValue={(n) => `${Math.round(n)}`}
                        ariaLabel="Vereisten dekking per document categorie"
                    />
                </ChartCard>

                {/* Action Items Panel */}
                <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Openstaande Acties
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Om je dossier compleet te maken
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3">
                            <FileWarning className="text-amber-500 size-5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                    Missend Vervoersbewijs
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Mutatie 18 okt van De Boer VOF mist een scan.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    Uploaden
                                </Button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3">
                            <AlertTriangle className="text-red-500 size-5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                    Grondanalyse Verloopt
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Perceel 4b. Geldig tot 1 Jan 2024.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    Plan bemonstering
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                    <CardContent className="p-6 flex flex-col items-center">
                        <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="text-emerald-500 size-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            Dossier Status
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                            Je mestboekhouding voldoet voor 85% aan de vereisten voor de aankomende controle.
                        </p>
                        <Button variant="outline" className="dark:border-slate-700">
                            Bekijk RVO Checklist
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Ledger Panel */}
            <div className="grid grid-cols-1">
                <LedgerPanel records={REGISTRATIONS_MOCK} onAddClick={() => setIsRecordOpen(true)} />
            </div>

            {/* Record Dialog */}
            <RecordDialog isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} />
        </DashboardPage>
    )
}
