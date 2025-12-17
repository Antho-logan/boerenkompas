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
import { PremiumAreaChart, PremiumBarChart, Sparkline } from "@/components/ui/premium-charts"
import { MestKpi, BalancePoint, ActivityPoint, LedgerRecord, CheckItem } from "@/lib/manure/types"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { cn } from "@/lib/utils"

// --- Helper Components ---

function StatusIcon({ status }: { status: 'safe' | 'warning' | 'critical' }) {
    if (status === 'safe') return <CheckCircle2 className="text-emerald-500 size-4" />
    if (status === 'warning') return <AlertTriangle className="text-amber-500 size-4" />
    return <AlertCircle className="text-red-500 size-4" />
}

const BALANCE_SERIES = ["productie", "aanvoer", "afvoer", "netto"] as const
type BalanceSeries = typeof BALANCE_SERIES[number]

export function MestKpiRow({ kpis }: { kpis: MestKpi[] }) {
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

export function BalanceChartPanel({ data }: { data: BalancePoint[] }) {
    const [series, setSeries] = useState<BalanceSeries>("productie")

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 animate-fade-in-up delay-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Balans over Tijd</h3>
                    <p className="text-xs text-slate-500">Ontwikkeling per maand (YTD)</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
                    {BALANCE_SERIES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSeries(s)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize whitespace-nowrap",
                                series === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 p-6 min-h-[300px]">
                <PremiumAreaChart
                    data={data.map(d => d[series])}
                    labels={data.map(d => d.date)}
                    height={300}
                    color={series === 'productie' ? '#10b981' : series === 'aanvoer' ? '#3b82f6' : series === 'afvoer' ? '#f59e0b' : '#64748b'}
                />
            </div>
        </Card>
    )
}

export function ActivityChartPanel({ data }: { data: ActivityPoint[] }) {
    // Simplified bar chart of total activity
    const totals = data.map(d => d.vdm + d.opslag + d.plaatsing + d.analyse)

    return (
        <Card className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up delay-300 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Activiteit (30d)</h3>
                <p className="text-xs text-slate-500">Transacties per dag</p>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-end">
                <PremiumBarChart
                    data={totals}
                    labels={data.map(d => d.day)}
                    height={200}
                    color="#6366f1"
                />
            </div>
        </Card>
    )
}

export function LedgerPanel({ records, onAddClick }: { records: LedgerRecord[], onAddClick: () => void }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 animate-fade-in-up delay-400">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Registraties</h3>
                    <p className="text-xs text-slate-500">Recent verwerkte mutaties</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input placeholder="Zoeken..." className="pl-9 h-9 text-sm bg-slate-50 full-w" />
                    </div>
                    <Button onClick={onAddClick} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                        <Plus size={16} className="mr-2" /> Nieuw
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Datum</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Hoeveelheid</th>
                            <th className="px-6 py-3">Tegenpartij / Notitie</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-medium text-slate-900">{new Date(rec.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={cn("font-normal capitalize",
                                        rec.type === 'Productie' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            rec.type === 'Aanvoer' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                rec.type === 'Afvoer' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                    )}>
                                        {rec.type}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">{rec.amountTon} ton</td>
                                <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{rec.counterparty || rec.notes || '-'}</td>
                                <td className="px-6 py-4">
                                    {rec.docStatus === 'ok' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                    {rec.docStatus === 'missing' && <Badge variant="destructive" className="text-[10px] h-5">Mist Doc</Badge>}
                                    {rec.docStatus === 'review' && <Badge variant="secondary" className="bg-amber-100 text-amber-800 h-5 text-[10px]">Checken</Badge>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                        <MoreVertical size={16} />
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
        <Card className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up delay-500 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-amber-50/30">
                <h3 className="font-bold text-slate-900 text-lg">Openstaande Checks</h3>
                <p className="text-xs text-slate-500">Actie vereist</p>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
                {checks.map((check, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{check.title}</h4>
                            <Badge className={cn("text-[10px] h-4 px-1.5",
                                check.severity === 'high' ? "bg-red-500" :
                                    check.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                            )}>
                                {check.severity}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{check.description}</p>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50">
                            {check.ctaLabel}
                        </Button>
                    </div>
                ))}
                {checks.length === 0 && <div className="p-6 text-center text-slate-400 text-xs">Geen openstaande checks.</div>}
            </div>
        </Card>
    )
}

export function RecordDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) { // Use SlideOver for simplicity and consistency
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

                <div className="pt-4 border-t border-slate-100 space-y-3">
                    <Label>Document (Optioneel)</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-xs">
                        <Upload className="mb-1 size-4" />
                        Sleep bestand of klik om te uploaden
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={() => { setLoading(true); setTimeout(onClose, 800) }} disabled={loading} className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg h-12">
                        {loading ? "Opslaan..." : "Registratie Opslaan"}
                    </Button>
                </div>
            </div>
        </SlideOver>
    )
}
