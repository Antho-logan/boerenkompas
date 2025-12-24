"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ChevronRight, AlertCircle, FileCheck, ArrowUpRight } from "lucide-react"
import { Sparkline } from "@/components/ui/premium-charts"
import { CHART_TONES } from "@/components/charts/chart-primitives"
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
    // Get sparkline color based on trend direction
    const sparklineColor = kpi.trendDirection === 'down'
        ? CHART_TONES.emerald.cssColor.replace('0.696', '0.637').replace('162.48', '25.331') // red-500
        : CHART_TONES.emerald.cssColor

    return (
        <Card className={cn(
            "overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group opacity-0 animate-fade-in-up",
        )} style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-5 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {kpi.title}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                                {kpi.value}
                            </h3>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {kpi.suffix}
                            </span>
                        </div>
                    </div>
                    {kpi.alert && (
                        <div className="size-2 rounded-full bg-red-500 animate-pulse mt-1" />
                    )}
                </div>

                <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={cn(
                            "w-fit text-[10px] h-5 px-1.5 border-0 font-medium",
                            kpi.trendDirection === 'up' ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" :
                                kpi.trendDirection === 'down' ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400" :
                                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                            {kpi.trendDirection === 'up' && <TrendingUp size={10} className="mr-1" />}
                            {kpi.trendDirection === 'down' && <TrendingDown size={10} className="mr-1" />}
                            {kpi.trend}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {kpi.target}
                        </span>
                    </div>
                    <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-500 origin-bottom-right">
                        <Sparkline data={kpi.history} color={sparklineColor} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function TaskListWidget({ tasks }: { tasks: DashboardTask[] }) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in-up delay-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Mijn Taken
                </h4>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] h-5">
                    {tasks.length} Open
                </Badge>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task, i) => (
                    <div key={i} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer flex items-center gap-3">
                        <div className={cn(
                            "size-3 rounded-full border-2 shrink-0",
                            task.urgency === 'high' ? "border-red-500 bg-red-100 dark:bg-red-950" : "border-slate-300 dark:border-slate-600"
                        )} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {task.title}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {task.due}
                            </p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-transform group-hover:translate-x-1" />
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-slate-500 dark:text-slate-400">
                    Alle taken bekijken
                </Button>
            </div>
        </Card>
    )
}

export function UpdatesWidget({ updates }: { updates: DashboardUpdate[] }) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in-up delay-400">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Wetgeving Updates
                </h4>
            </div>
            <div className="flex-1 p-0 divide-y divide-slate-100 dark:divide-slate-800">
                {updates.map((update, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <div className="flex gap-3">
                            <div className={cn(
                                "mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0 text-white",
                                update.type === 'critical' ? "bg-red-500" : "bg-blue-500"
                            )}>
                                <AlertCircle size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {update.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {update.desc}
                                </p>
                                <button className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-300">
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
        <Card className="bg-slate-900 dark:bg-slate-950 text-white border-slate-800 dark:border-slate-900 shadow-xl overflow-hidden relative group animate-fade-in-up delay-500">
            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-1000"></div>
            <CardContent className="p-5 relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <FileCheck size={16} />
                        <span className="text-xs font-bold tracking-wider uppercase">Export Center</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Genereer officiële dossiers voor RVO of Bank audits in één klik.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="h-9 text-[10px] bg-white/10 hover:bg-white/20 text-white border-white/5 hover:border-emerald-500/50">
                        RVO Pakket
                    </Button>
                    <Button variant="secondary" className="h-9 text-[10px] bg-white/10 hover:bg-white/20 text-white border-white/5 hover:border-blue-500/50">
                        Bank Audit
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
