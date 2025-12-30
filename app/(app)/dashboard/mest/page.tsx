"use client"

import { useState } from "react"
import { MestKpiRow, LedgerPanel, RecordDialog } from "@/components/manure/manure-components"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Download, Plus, FileText, CheckCircle2, AlertTriangle, FileWarning } from "lucide-react"
import { PremiumBarsChart, type BarDatum } from "@/components/charts/PremiumBarsChart"
import { ChartCard } from "@/components/charts/chart-primitives"
import DashboardPage from "@/components/app/DashboardPage"
<<<<<<< HEAD
=======
import { PreviewBadge, PreviewBanner, DisabledCta } from "@/components/ui/preview-badge"
import { UploadCta } from "@/components/documents/UploadCta"
>>>>>>> b0318de (chore: sync updates)

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
<<<<<<< HEAD
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                        <FileText className="mr-2 size-4" /> Dossier Index
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">
                        <Download className="mr-2 size-4" /> Exporteer Index (v1)
                    </Button>
                    <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-slate-200" onClick={() => setIsRecordOpen(true)}>
                        <Plus className="mr-2 size-4" /> Nieuwe Mutatie
                    </Button>
=======
                    <PreviewBadge variant="demo-data" size="md" />
                    <UploadCta 
                        variant="button" 
                        size="sm" 
                        label="Upload bewijsstuk" 
                        category="MEST" 
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
>>>>>>> b0318de (chore: sync updates)
                </div>
            }
            className="animate-fade-in-up"
        >
<<<<<<< HEAD
=======

            {/* Preview Banner */}
            <PreviewBanner
                title="Demo Mestdossier"
                description="Onderstaande gegevens zijn voorbeelddata. Koppel je systemen om je werkelijke mestboekhouding te zien."
                variant="demo-data"
            />
>>>>>>> b0318de (chore: sync updates)

            {/* KPIs */}
            <MestKpiRow kpis={DOSSIER_KPIS} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coverage Chart Panel */}
                <ChartCard
                    title="Vereisten Dekking"
                    description="Percentage documenten aanwezig per categorie"
<<<<<<< HEAD
=======
                    badge={<PreviewBadge variant="demo-data" size="sm" />}
>>>>>>> b0318de (chore: sync updates)
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
<<<<<<< HEAD
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Openstaande Acties
                        </CardTitle>
=======
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Openstaande Acties
                            </CardTitle>
                            <PreviewBadge variant="demo-data" size="sm" />
                        </div>
>>>>>>> b0318de (chore: sync updates)
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
<<<<<<< HEAD
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    Uploaden
                                </Button>
=======
                                <UploadCta 
                                    variant="inline" 
                                    label="Uploaden"
                                    category="MEST"
                                    className="mt-2"
                                />
>>>>>>> b0318de (chore: sync updates)
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
<<<<<<< HEAD
                                <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    Plan bemonstering
                                </Button>
=======
                                <DisabledCta reason="Planning komt binnenkort" className="inline-block">
                                    <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                        Plan bemonstering
                                    </Button>
                                </DisabledCta>
>>>>>>> b0318de (chore: sync updates)
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
<<<<<<< HEAD
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            Dossier Status
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                            Je mestboekhouding voldoet voor 85% aan de vereisten voor de aankomende controle.
                        </p>
                        <Button variant="outline" className="dark:border-slate-700">
                            Bekijk RVO Checklist
                        </Button>
=======
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                Dossier Status
                            </h3>
                            <PreviewBadge variant="demo-data" size="sm" showIcon={false} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                            Je mestboekhouding voldoet voor 85% aan de vereisten voor de aankomende controle.
                        </p>
                        <DisabledCta reason="RVO checklist komt binnenkort">
                            <Button variant="outline" className="dark:border-slate-700">
                                Bekijk RVO Checklist
                            </Button>
                        </DisabledCta>
>>>>>>> b0318de (chore: sync updates)
                    </CardContent>
                </Card>
            </div>

            {/* Ledger Panel */}
            <div className="grid grid-cols-1">
                <LedgerPanelWithPreview records={REGISTRATIONS_MOCK} onAddClick={() => setIsRecordOpen(true)} />
            </div>

            {/* Record Dialog */}
            <RecordDialog isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} />
        </DashboardPage>
<<<<<<< HEAD
=======
    )
}

// Ledger Panel with Preview badge
function LedgerPanelWithPreview({ records, onAddClick }: { records: typeof REGISTRATIONS_MOCK, onAddClick: () => void }) {
    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Registraties
                        </CardTitle>
                        <PreviewBadge variant="demo-data" size="sm" />
                    </div>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Recent verwerkte mutaties (voorbeelddata)
                    </CardDescription>
                </div>
                <DisabledCta reason="Nieuwe mutaties komen binnenkort">
                    <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                        <Plus size={16} className="mr-2" /> Nieuw
                    </Button>
                </DisabledCta>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Datum</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Hoeveelheid</th>
                                <th className="px-6 py-3">Tegenpartij / Notitie</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {records.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                        {new Date(rec.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            rec.type === 'Productie' ? "bg-emerald-50 text-emerald-700" :
                                            rec.type === 'Aanvoer' ? "bg-blue-50 text-blue-700" :
                                            "bg-amber-50 text-amber-700"
                                        }`}>
                                            {rec.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                        {rec.amountTon} ton
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                        {rec.counterparty || rec.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {rec.docStatus === 'ok' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        {rec.docStatus === 'missing' && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">Mist Doc</span>}
                                        {rec.docStatus === 'review' && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded">Checken</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
>>>>>>> b0318de (chore: sync updates)
    )
}
