"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { KPI, AICheck } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, Loader2, Sparkles } from "lucide-react"
import { EvidenceDrawer } from "@/components/app/EvidenceDrawer"
import { useTenant } from "@/components/app/TenantProvider"
import { DASHBOARD_DATA } from "@/lib/mock-data"
import { PremiumTrendChart } from "@/components/charts/PremiumTrendChart"
import { PremiumBarsChart } from "@/components/charts/PremiumBarsChart"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const { tenant, isLoading: isTenantLoading } = useTenant();
    const [kpis, setKpis] = useState<KPI[]>([])
    const [aiChecks, setAiChecks] = useState<AICheck[]>([])
    const [loadedTenantId, setLoadedTenantId] = useState<string | null>(null)
    const [selectedCheck, setSelectedCheck] = useState<AICheck | null>(null)

    useEffect(() => {
        if (!tenant?.id) return

        Promise.all([
            apiFetch<KPI[]>(`/tenants/${tenant.id}/kpis`),
            apiFetch<AICheck[]>(`/tenants/${tenant.id}/ai/checks`)
        ]).then(([kpiData, aiData]) => {
            setKpis(kpiData);
            setAiChecks(aiData);
            setLoadedTenantId(tenant.id)
        });

    }, [tenant?.id]);

    if (isTenantLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
    if (!tenant) return <div className="p-8 text-slate-600">Selecteer een bedrijf om te starten.</div>

    const loading = loadedTenantId !== tenant.id

    const stikstofSeries = DASHBOARD_DATA.charts.stikstof.labels.map((label, i) => ({
        label,
        value: DASHBOARD_DATA.charts.stikstof.realisatie[i] ?? 0,
        target: DASHBOARD_DATA.charts.stikstof.norm[i],
    }))

    const mestBars = DASHBOARD_DATA.charts.mest.labels.map((label, i) => ({
        label,
        value: DASHBOARD_DATA.charts.mest.data[i] ?? 0,
    }))

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Welkom terug, Jan.</h1>
                <p className="text-slate-500">Hier is je dagelijkse overzicht voor {tenant?.name}.</p>
            </div>

            {/* KPIs Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="border-slate-200 shadow-sm">
                            <CardContent className="p-5">
                                <Skeleton className="h-3 w-24 rounded-md" />
                                <Skeleton className="mt-3 h-8 w-40 rounded-md" />
                                <Skeleton className="mt-3 h-3 w-32 rounded-md" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    kpis.map((kpi, idx) => (
                        <Card
                            key={kpi.id}
                            className="border-slate-200 shadow-sm hover:border-emerald-200 transition-all hover:shadow-md animate-fade-in-up"
                            style={{ animationDelay: `${idx * 80}ms` }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">
                                    {kpi.label}
                                </CardTitle>
                                {kpi.status === 'good' ? <div className="size-2 rounded-full bg-emerald-500" /> : <div className="size-2 rounded-full bg-amber-500" />}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">
                                    {kpi.value.toLocaleString()} <span className="text-sm font-normal text-slate-400">{kpi.unit}</span>
                                </div>
                                {kpi.trend !== undefined && (
                                    <p className={`text-xs mt-1 flex items-center ${kpi.trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {kpi.trend > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                        {Math.abs(kpi.trend)}% t.o.v. vorige maand
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Chart Slot */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Stikstofruimte trend</CardTitle>
                                    <CardDescription>Realisatie vs norm (indicatief, mock)</CardDescription>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        Realisatie
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-[2px] w-5 bg-slate-400/60" />
                                        Norm
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full rounded-2xl" />
                            ) : (
                                <PremiumTrendChart
                                    data={stikstofSeries}
                                    height={300}
                                    valueLabel="kg"
                                    showTarget
                                    ariaLabel="Stikstofruimte trend grafiek"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Compliance Widget */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle>Mest activiteit</CardTitle>
                            <CardDescription>Laatste weken (mock)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[180px] w-full rounded-2xl" />
                            ) : (
                                <PremiumBarsChart
                                    data={mestBars}
                                    height={180}
                                    valueLabel="ton"
                                    ariaLabel="Mest activiteit staafgrafiek"
                                    tone="amber"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-emerald-600" />
                                AI Compliance
                            </h3>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="border-slate-200 shadow-sm">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                                <Skeleton className="h-4 w-10 rounded-md" />
                                            </div>
                                            <Skeleton className="mt-3 h-4 w-48 rounded-md" />
                                            <Skeleton className="mt-2 h-3 w-full rounded-md" />
                                            <Skeleton className="mt-1 h-3 w-5/6 rounded-md" />
                                            <Skeleton className="mt-4 h-8 w-full rounded-lg" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {aiChecks.map(check => (
                                    <div key={check.id} className="group p-4 bg-white border border-slate-200 hover:border-emerald-200 rounded-xl shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${check.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                                                check.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {check.severity}
                                            </span>
                                            <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-600 transition-colors">{check.confidence}%</span>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 text-sm mb-1">{check.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{check.summary}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs h-8"
                                            onClick={() => setSelectedCheck(check)}
                                        >
                                            Bekijk bronnen
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Drawers/Modals */}
            <EvidenceDrawer
                check={selectedCheck}
                isOpen={!!selectedCheck}
                onClose={() => setSelectedCheck(null)}
            />
        </div>
    )
}
