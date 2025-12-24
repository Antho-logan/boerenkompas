"use client"

import { useState } from "react"
import {
    ArrowUpRight, ArrowDownRight, MoreVertical, TrendingUp, AlertTriangle,
    CheckCircle2, AlertCircle, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkline, PremiumAreaChart } from "@/components/ui/premium-charts"
import { CHART_TONES, ChartCard } from "@/components/charts/chart-primitives"
import { NitrogenKpi, NitrogenPoint, UtilizationBreakdown, ParcelImpact, ChangeLogItem, ActionItem } from "@/lib/stikstof/types"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { cn } from "@/lib/utils"

// --- Helper Components ---

function StatusIcon({ status }: { status: 'safe' | 'warning' | 'critical' | 'low' | 'medium' | 'high' | string }) {
    if (status === 'safe' || status === 'low') return <CheckCircle2 className="text-emerald-500 size-4" />
    if (status === 'warning' || status === 'medium') return <AlertTriangle className="text-amber-500 size-4" />
    if (status === 'critical' || status === 'high') return <AlertCircle className="text-red-500 size-4" />
    return <div className="size-4 rounded-full bg-slate-200 dark:bg-slate-700" />
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

export function StikstofKpiRow({ kpis }: { kpis: NitrogenKpi[] }) {
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

export function PrimaryChartPanel({ data }: { data: NitrogenPoint[] }) {
    const [range, setRange] = useState('YTD')

    return (
        <ChartCard
            title="Stikstofruimte Verloop"
            description="Realisatie vs Norm (Cumulatief)"
            className="col-span-1 lg:col-span-2 animate-fade-in-up delay-200 h-full flex flex-col"
            headerRight={
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                    {['30d', '90d', 'YTD', '12m'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                                range === r
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="flex-1 min-h-[300px]">
                <PremiumAreaChart
                    data={data.filter(d => d.actual > 0).map(d => d.actual)}
                    data2={data.map(d => d.norm)}
                    labels={data.map(d => d.date)}
                    height={300}
                    tone="emerald"
                    tone2="slate"
                />

                <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span className="block w-3 h-1 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20" /> Realisatie
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        <span className="block w-3 h-1 bg-slate-400 rounded-full border border-dashed border-slate-400" /> Norm
                    </div>
                </div>
            </div>
        </ChartCard>
    )
}

export function BreakdownChartPanel({ data }: { data: UtilizationBreakdown[] }) {
    return (
        <ChartCard
            title="Benutting per Bron"
            description="Verdeling van totale aanwending"
            className="col-span-1 lg:col-span-1 animate-fade-in-up delay-300 h-full flex flex-col"
        >
            <div className="flex-1 flex flex-col justify-center">
                {/* Segmented Progress Bar */}
                <div className="w-full h-10 rounded-2xl overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900">
                    {data.map((item, i) => (
                        <div
                            key={i}
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            className="h-full relative group transition-all hover:opacity-90"
                        >
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                                <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl">
                                    {item.label}: {item.value}kg
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 mt-10">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2.5">
                                <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {item.label}
                                </span>
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                                {item.percentage}%
                                <span className="text-slate-400 dark:text-slate-500 font-medium text-xs ml-1.5 tabular-nums">
                                    ({item.value} kg)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ChartCard>
    )
}

export function ParcelImpactPanel({ parcels }: { parcels: ParcelImpact[] }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 animate-fade-in-up delay-400">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Perceel Impact
                </h3>
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400">
                    Bekijk alles
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Perceel</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Benutting</th>
                            <th className="px-6 py-3">Trend</th>
                            <th className="px-6 py-3">Risico</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parcels.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                    {p.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                    {p.type}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 w-8 tabular-nums">
                                            {p.utilizationPct}%
                                        </span>
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", p.utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                                                style={{ width: `${p.utilizationPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("flex items-center gap-1 tabular-nums", p.trendPct > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                                        {p.trendPct > 0 ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(p.trendPct)}%
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={cn("border-0",
                                        p.risk === 'safe' ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" :
                                            p.risk === 'warning' ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" :
                                                "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                                    )}>
                                        {p.risk}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical size={16} className="text-slate-400" />
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

export function ActionPanel({ actions }: { actions: ActionItem[] }) {
    return (
        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Aanbevolen Acties
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optimaliseer uw ruimte
                </p>
            </div>
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                {actions.map(action => (
                    <div key={action.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {action.title}
                            </h4>
                            {action.priority === 'urgent' && (
                                <Badge className="bg-red-500 text-[10px] h-4 px-1.5">Urgent</Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {action.description}
                        </p>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                            {action.ctaLabel}
                        </Button>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export function ChangeLogPanel({ logs }: { logs: ChangeLogItem[] }) {
    return (
        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Wat is er veranderd?
                </h3>
            </div>
            <div className="flex-1 p-0">
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-6 my-4 space-y-6">
                    {logs.map(log => (
                        <div key={log.id} className="relative pl-6 pr-4 group">
                            <div className={cn(
                                "absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                log.severity === 'high' ? "bg-red-500" : log.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {new Date(log.date).toLocaleDateString()}
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {log.impactLabel}
                                </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                                {log.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {log.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}

export function ScenarioSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<number | null>(null)

    const handleSimulate = () => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setResult(850) // Mock result
        }, 1500)
    }

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="Scenario Analyse">
            <div className="space-y-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Simuleer de impact van extra dierlijke mest of areaal uitbreiding op uw stikstofgebruiksruimte.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Extra Mestplaatsing</Label>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">0 ton</span>
                        </div>
                        <Input type="range" className="accent-emerald-600" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">Schuif om hoeveelheid te wijzigen.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Areaal Wijziging</Label>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">+0 ha</span>
                        </div>
                        <Input type="range" className="accent-emerald-600" />
                    </div>

                    <div className="space-y-3">
                        <Label>Type Wijziging</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue>
                                    {(value) => {
                                        if (!value) return "Selecteer type..."
                                        if (value === "a") return "Aankoop grond"
                                        if (value === "b") return "Pacht (Kort)"
                                        if (value === "c") return "Pacht (Lang)"
                                        return String(value)
                                    }}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">Aankoop grond</SelectItem>
                                <SelectItem value="b">Pacht (Kort)</SelectItem>
                                <SelectItem value="c">Pacht (Lang)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={handleSimulate} disabled={loading} className="w-full h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg">
                    {loading ? "Berekenen..." : "Bereken Impact"}
                </Button>

                {result !== null && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 animate-fade-in-up">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm mb-1">Resultaat</h4>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">
                            Uw geschatte ruimte neemt toe met <span className="font-bold">850 kg</span>.
                        </p>
                        <div className="mt-3 h-2 w-full bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 w-[65%]" />
                        </div>
                    </div>
                )}
            </div>
        </SlideOver>
    )
}

export function ExportDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <Card className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl animate-scale-in p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exporteer Rapportage</h2>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Rapportage Periode</Label>
                        <Select defaultValue="ytd">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">Laatste 30 dagen</SelectItem>
                                <SelectItem value="90">Laatste kwartaal</SelectItem>
                                <SelectItem value="ytd">Huidig boekjaar (YTD)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label>Inclusief</Label>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked readOnly className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Beknopt overzicht</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Perceel details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Prognose scenarios</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" onClick={onClose}>Annuleren</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onClose}>
                        <Download className="mr-2 size-4" /> Download PDF
                    </Button>
                </div>
            </Card>
        </div>
    )
}
