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
import { NitrogenKpi, NitrogenPoint, UtilizationBreakdown, ParcelImpact, ChangeLogItem, ActionItem } from "@/lib/stikstof/types"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { cn } from "@/lib/utils"

// --- Helper Components ---

function StatusIcon({ status }: { status: 'safe' | 'warning' | 'critical' | 'low' | 'medium' | 'high' | string }) {
    if (status === 'safe' || status === 'low') return <CheckCircle2 className="text-emerald-500 size-4" />
    if (status === 'warning' || status === 'medium') return <AlertTriangle className="text-amber-500 size-4" />
    if (status === 'critical' || status === 'high') return <AlertCircle className="text-red-500 size-4" />
    return <div className="size-4 rounded-full bg-slate-200" />
}

export function StikstofKpiRow({ kpis }: { kpis: NitrogenKpi[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up">
            {kpis.map((kpi, i) => (
                <Card key={kpi.key} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all group" style={{ animationDelay: `${i * 100}ms` }}>
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                                    <span className="text-xs font-medium text-slate-500">{kpi.unit}</span>
                                </div>
                            </div>
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center bg-slate-50",
                                kpi.status === 'safe' ? "bg-emerald-50 text-emerald-600" :
                                    kpi.status === 'warning' ? "bg-amber-50 text-amber-600" :
                                        "bg-red-50 text-red-600"
                            )}>
                                <StatusIcon status={kpi.status} />
                            </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between">
                            <Badge variant="secondary" className={cn(
                                "px-1.5 h-5 text-[10px] gap-1",
                                kpi.deltaPct > 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                            )}>
                                {kpi.deltaPct > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(kpi.deltaPct)}%
                            </Badge>
                            <div className="w-20 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Sparkline data={kpi.trend} color={kpi.status === 'safe' ? '#10b981' : kpi.status === 'warning' ? '#f59e0b' : '#ef4444'} />
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
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 animate-fade-in-up delay-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Stikstofruimte Verloop</h3>
                    <p className="text-xs text-slate-500">Realisatie vs Norm (Cumulatief)</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                    {['30d', '90d', 'YTD', '12m'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 p-6 min-h-[300px]">
                <PremiumAreaChart
                    data={data.filter(d => d.actual > 0).map(d => d.actual)}
                    data2={data.map(d => d.norm)}
                    labels={data.map(d => d.date)}
                    height={300}
                    color="#10b981" // Emerald
                    color2="#94a3b8" // Slate (Norm)
                />

                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <span className="block w-3 h-1 bg-emerald-500 rounded-full" /> Realisatie
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="block w-3 h-1 bg-slate-400 rounded-full border border-dashed" /> Norm
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="block w-3 h-1 bg-slate-200 rounded-full border border-dashed" /> Prognose
                    </div>
                </div>
            </div>
        </Card>
    )
}

export function BreakdownChartPanel({ data }: { data: UtilizationBreakdown[] }) {
    return (
        <Card className="col-span-1 lg:col-span-1 shadow-sm border-slate-200 animate-fade-in-up delay-300 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Benutting per Bron</h3>
                <p className="text-xs text-slate-500">Verdeling van totale aanwending</p>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center">
                {/* Custom Stacked/Segmented bar since PremiumBarChart is simple vertical bars */}
                <div className="w-full h-8 rounded-full overflow-hidden flex shadow-inner">
                    {data.map((item, i) => (
                        <div
                            key={i}
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            className="h-full relative group transition-all hover:opacity-90"
                        >
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {item.label}: {item.value}kg
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 mt-8">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {item.percentage}% <span className="text-slate-400 font-normal text-xs ml-1">({item.value} kg)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}

export function ParcelImpactPanel({ parcels }: { parcels: ParcelImpact[] }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 animate-fade-in-up delay-400">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">Perceel Impact</h3>
                <Button variant="ghost" size="sm" className="text-emerald-600">Bekijk alles</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Perceel</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Benutting</th>
                            <th className="px-6 py-3">Trend</th>
                            <th className="px-6 py-3">Risico</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {parcels.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                                <td className="px-6 py-4 text-slate-500">{p.type}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-700 w-8">{p.utilizationPct}%</span>
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full", p.utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                                                style={{ width: `${p.utilizationPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("flex items-center gap-1", p.trendPct > 0 ? "text-amber-600" : "text-emerald-600")}>
                                        {p.trendPct > 0 ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(p.trendPct)}%
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={cn("border-0",
                                        p.risk === 'safe' ? "bg-emerald-50 text-emerald-700" :
                                            p.risk === 'warning' ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
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
        <Card className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-emerald-50/30">
                <h3 className="font-bold text-slate-900 text-lg">Aanbevolen Acties</h3>
                <p className="text-xs text-slate-500">Optimaliseer uw ruimte</p>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
                {actions.map(action => (
                    <div key={action.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{action.title}</h4>
                            {action.priority === 'urgent' && <Badge className="bg-red-500 text-[10px] h-4 px-1.5">Urgent</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{action.description}</p>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50">
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
        <Card className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Wat is er veranderd?</h3>
            </div>
            <div className="flex-1 p-0">
                <div className="relative border-l border-slate-200 ml-6 my-4 space-y-6">
                    {logs.map(log => (
                        <div key={log.id} className="relative pl-6 pr-4 group">
                            <div className={cn(
                                "absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-white shadow-sm",
                                log.severity === 'high' ? "bg-red-500" : log.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(log.date).toLocaleDateString()}</span>
                                <Badge variant="secondary" className="text-[10px] h-4 bg-slate-100 text-slate-600">{log.impactLabel}</Badge>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 mt-0.5">{log.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{log.description}</p>
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
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600">
                        Simuleer de impact van extra dierlijke mest of areaal uitbreiding op uw stikstofgebruiksruimte.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Extra Mestplaatsing</Label>
                            <span className="text-sm font-bold text-slate-900">0 ton</span>
                        </div>
                        <Input type="range" className="accent-emerald-600" />
                        <p className="text-xs text-slate-400">Schuif om hoeveelheid te wijzigen.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Areaal Wijziging</Label>
                            <span className="text-sm font-bold text-slate-900">+0 ha</span>
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

                <Button onClick={handleSimulate} disabled={loading} className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 shadow-lg">
                    {loading ? "Berekenen..." : "Bereken Impact"}
                </Button>

                {result !== null && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fade-in-up">
                        <h4 className="font-bold text-emerald-900 text-sm mb-1">Resultaat</h4>
                        <p className="text-sm text-emerald-800">
                            Uw geschatte ruimte neemt toe met <span className="font-bold">850 kg</span>.
                        </p>
                        <div className="mt-3 h-2 w-full bg-emerald-200 rounded-full overflow-hidden">
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
            <Card className="relative w-full max-w-md bg-white shadow-2xl animate-scale-in p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Exporteer Rapportage</h2>
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
                            <input type="checkbox" checked readOnly className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700">Beknopt overzicht</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700">Perceel details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm text-slate-700">Prognose scenarios</span>
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
