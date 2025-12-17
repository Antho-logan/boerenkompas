"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ChevronRight, AlertCircle, FileCheck, ArrowUpRight } from "lucide-react"
import { Sparkline } from "@/components/ui/premium-charts"
import { cn } from "@/lib/utils"
import { KPI } from "@/lib/mock-data"

type DashboardTask = {
    id: number
    title: string
    due: string
    urgency: "high" | "medium" | "low"
    status: "open" | "done"
}

type DashboardUpdate = {
    id: number
    title: string
    desc: string
    type: "critical" | "info"
}

export function KPICard({ kpi, index }: { kpi: KPI, index: number }) {
    return (
        <Card className={cn(
            "overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group opacity-0 animate-fade-in-up",
        )} style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-5 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.title}</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                            <span className="text-sm font-medium text-slate-500">{kpi.suffix}</span>
                        </div>
                    </div>
                    {kpi.alert && <div className="size-2 rounded-full bg-red-500 animate-pulse mt-1" />}
                </div>

                <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={cn(
                            "w-fit text-[10px] h-5 px-1.5 border-0 font-medium",
                            kpi.trendDirection === 'up' ? "bg-emerald-50 text-emerald-700" :
                                kpi.trendDirection === 'down' ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                        )}>
                            {kpi.trendDirection === 'up' && <TrendingUp size={10} className="mr-1" />}
                            {kpi.trendDirection === 'down' && <TrendingDown size={10} className="mr-1" />}
                            {kpi.trend}
                        </Badge>
                        <span className="text-[10px] text-slate-400">{kpi.target}</span>
                    </div>
                    <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-500 origin-bottom-right">
                        <Sparkline data={kpi.history} color={kpi.trendDirection === 'down' ? '#ef4444' : '#10b981'} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function TaskListWidget({ tasks }: { tasks: DashboardTask[] }) {
    return (
        <Card className="border-slate-200 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in-up delay-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-900">Mijn Taken</h4>
                <Badge variant="outline" className="bg-white text-slate-600 text-[10px] h-5">{tasks.length} Open</Badge>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-slate-100">
                {tasks.map((task, i) => (
                    <div key={i} className="p-3.5 hover:bg-slate-50 transition-colors group cursor-pointer flex items-center gap-3">
                        <div className={cn(
                            "size-3 rounded-full border-2 shrink-0",
                            task.urgency === 'high' ? "border-red-500 bg-red-100" : "border-slate-300"
                        )} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{task.title}</p>
                            <p className="text-[10px] text-slate-500">{task.due}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-1" />
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-slate-500">Alle taken bekijken</Button>
            </div>
        </Card>
    )
}

export function UpdatesWidget({ updates }: { updates: DashboardUpdate[] }) {
    return (
        <Card className="border-slate-200 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in-up delay-400">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-900">Wetgeving Updates</h4>
            </div>
            <div className="flex-1 p-0 divide-y divide-slate-100">
                {updates.map((update, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex gap-3">
                            <div className={cn(
                                "mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0 text-white",
                                update.type === 'critical' ? "bg-red-500" : "bg-blue-500"
                            )}>
                                <AlertCircle size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">{update.title}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{update.desc}</p>
                                <button className="text-[10px] font-semibold text-emerald-600 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-300">
                                    Bereken Impact <ArrowUpRight size={10} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export function ExportWidget() {
    return (
        <Card className="bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden relative group animate-fade-in-up delay-500">
            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-1000"></div>
            <CardContent className="p-5 relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <FileCheck size={16} /> <span className="text-xs font-bold tracking-wider uppercase">Export Center</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                        Genereer officiële dossiers voor RVO of Bank audits in één klik.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="h-9 text-[10px] bg-white/10 hover:bg-white/20 text-white border-white/5 hover:border-emerald-500/50">RVO Pakket</Button>
                    <Button variant="secondary" className="h-9 text-[10px] bg-white/10 hover:bg-white/20 text-white border-white/5 hover:border-blue-500/50">Bank Audit</Button>
                </div>
            </CardContent>
        </Card>
    )
}
