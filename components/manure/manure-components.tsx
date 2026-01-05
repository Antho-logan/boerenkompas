"use client"

import { useState } from "react"
import {
    ArrowUpRight, ArrowDownRight, MoreVertical, AlertTriangle,
    CheckCircle2, AlertCircle,
    Plus, Upload, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sparkline, PremiumAreaChart, PremiumBarChart } from "@/components/ui/premium-charts"
import { CHART_TONES, ChartCard } from "@/components/charts/chart-primitives"
import { MestKpi, BalancePoint, ActivityPoint, LedgerRecord, CheckItem } from "@/lib/manure/types"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { cn } from "@/lib/utils"

// --- Helper Components ---

function StatusIcon({ status }: { status: 'safe' | 'warning' | 'critical' }) {
    if (status === 'safe') return <CheckCircle2 className="text-emerald-500 size-4" />
    if (status === 'warning') return <AlertTriangle className="text-amber-500 size-4" />
    return <AlertCircle className="text-red-500 size-4" />
}

// Get sparkline color based on status
function getSparklineColor(status: 'safe' | 'warning' | 'critical'): string {
    switch (status) {
        case 'safe': return CHART_TONES.emerald.cssColor
        case 'warning': return CHART_TONES.amber.cssColor
        case 'critical': return CHART_TONES.emerald.cssColor.replace('0.696', '0.637').replace('162.48', '25.331') // red-500
        default: return CHART_TONES.emerald.cssColor
    }
}

const BALANCE_SERIES = ["productie", "aanvoer", "afvoer", "netto"] as const
type BalanceSeries = typeof BALANCE_SERIES[number]

// Get tone for balance series
function getBalanceTone(series: BalanceSeries): keyof typeof CHART_TONES {
    switch (series) {
        case 'productie': return 'emerald'
        case 'aanvoer': return 'blue'
        case 'afvoer': return 'amber'
        case 'netto': return 'slate'
        default: return 'emerald'
    }
}

export function MestKpiRow({ kpis }: { kpis: MestKpi[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up">
            {kpis.map((kpi, i) => (
                <Card
                    key={kpi.key}
                    className="relative overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    {kpi.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                                        {kpi.value}
                                    </h3>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {kpi.unit}
                                    </span>
                                </div>
                            </div>
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center",
                                kpi.status === 'safe' ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600" :
                                    kpi.status === 'warning' ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600" :
                                        "bg-red-50 dark:bg-red-950/50 text-red-600"
                            )}>
                                <StatusIcon status={kpi.status} />
                            </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between">
                            <Badge variant="secondary" className={cn(
                                "px-1.5 h-5 text-[10px] gap-1",
                                kpi.deltaPct > 0 ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" :
                                    "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50"
                            )}>
                                {kpi.deltaPct > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(kpi.deltaPct)}%
                            </Badge>
                            <div className="w-20 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Sparkline
                                    data={kpi.trend}
                                    color={getSparklineColor(kpi.status)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function BalanceChartPanel({ data }: { data: BalancePoint[] }) {
    const [series, setSeries] = useState<BalanceSeries>("productie")

    return (
        <ChartCard
            title="Balans over Tijd"
            description="Ontwikkeling per maand (YTD)"
            className="col-span-1 lg:col-span-2 animate-fade-in-up delay-200 h-full flex flex-col"
            headerRight={
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit overflow-x-auto">
                    {BALANCE_SERIES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSeries(s)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all capitalize whitespace-nowrap",
                                series === s
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="flex-1 min-h-[300px]">
                <PremiumAreaChart
                    data={data.map(d => d[series])}
                    labels={data.map(d => d.date)}
                    height={300}
                    tone={getBalanceTone(series)}
                />
            </div>
        </ChartCard>
    )
}

export function ActivityChartPanel({ data }: { data: ActivityPoint[] }) {
    const totals = data.map(d => d.vdm + d.opslag + d.plaatsing + d.analyse)

    return (
        <ChartCard
            title="Activiteit (30d)"
            description="Transacties per dag"
            className="col-span-1 animate-fade-in-up delay-300 h-full flex flex-col"
        >
            <div className="flex-1 flex flex-col justify-end">
                <PremiumBarChart
                    data={totals}
                    labels={data.map(d => d.day)}
                    height={200}
                    tone="violet"
                />
            </div>
        </ChartCard>
    )
}

export function LedgerPanel({ records, onAddClick }: { records: LedgerRecord[], onAddClick: () => void }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 animate-fade-in-up delay-400">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                        Registraties
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Recent verwerkte mutaties
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
                        <Input placeholder="Zoeken..." className="pl-9 h-9 text-sm bg-slate-50 dark:bg-slate-800 w-full" />
                    </div>
                    <Button onClick={onAddClick} size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md">
                        <Plus size={16} className="mr-2" /> Nieuw
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Datum</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Hoeveelheid</th>
                            <th className="px-6 py-3">Tegenpartij / Notitie</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {records.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                    {new Date(rec.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={cn("font-normal capitalize",
                                        rec.type === 'Productie' ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                                            rec.type === 'Aanvoer' ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" :
                                                rec.type === 'Afvoer' ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
                                                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    )}>
                                        {rec.type}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {rec.amountTon} ton
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                    {rec.counterparty || rec.notes || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {rec.docStatus === 'ok' && <CheckCircle2 size={16} className="text-emerald-500" aria-hidden="true" />}
                                    {rec.docStatus === 'missing' && <Badge variant="destructive" className="text-[10px] h-5">Mist Doc</Badge>}
                                    {rec.docStatus === 'review' && <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 h-5 text-[10px]">Checken</Badge>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500"
                                        aria-label="Meer opties (binnenkort)"
                                        disabled
                                    >
                                        <MoreVertical size={16} aria-hidden="true" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

export function ChecksPanel({ checks }: { checks: CheckItem[] }) {
    return (
        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Openstaande Checks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Actie vereist
                </p>
            </div>
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                {checks.map((check, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {check.title}
                            </h4>
                            <Badge className={cn("text-[10px] h-4 px-1.5",
                                check.severity === 'high' ? "bg-red-500" :
                                    check.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                            )}>
                                {check.severity}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {check.description}
                        </p>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                            {check.ctaLabel}
                        </Button>
                    </div>
                ))}
                {checks.length === 0 && (
                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                        Geen openstaande checks.
                    </div>
                )}
            </div>
        </Card>
    )
}

export function RecordDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [loading, setLoading] = useState(false)

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="Nieuwe Registratie">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Type Registratie</Label>
                    <Select>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prod">Productie</SelectItem>
                            <SelectItem value="aan">Aanvoer</SelectItem>
                            <SelectItem value="af">Afvoer</SelectItem>
                            <SelectItem value="plaatsing">Plaatsing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Datum</Label>
                    <Input type="date" />
                </div>

                <div className="space-y-2">
                    <Label>Hoeveelheid (ton)</Label>
                    <Input type="number" placeholder="0.00" />
                </div>

                <div className="space-y-2">
                    <Label>Tegenpartij / Notitie</Label>
                    <Input placeholder="Bijv. Jansen BV of Silo 3" />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <Label>Document (Optioneel)</Label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer text-xs">
                        <Upload className="mb-1 size-4" />
                        Sleep bestand of klik om te uploaden
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={() => { setLoading(true); setTimeout(onClose, 800) }} disabled={loading} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg h-12">
                        {loading ? "Opslaan..." : "Registratie Opslaan"}
                    </Button>
                </div>
            </div>
        </SlideOver>
    )
}
