"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { KPI, AICheck } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, Loader2, Sparkles, Lock, Info, Users } from "lucide-react"
import { EvidenceDrawer } from "@/components/app/EvidenceDrawer"
import { useTenant } from "@/components/app/TenantProvider"
import Link from "next/link"
import { DASHBOARD_DATA } from "@/lib/mock-data"
import { PremiumTrendChart } from "@/components/charts/PremiumTrendChart"
import { PremiumBarsChart } from "@/components/charts/PremiumBarsChart"
import { ChartCard, ChartLegend, ChartSkeleton } from "@/components/charts/chart-primitives"
import { Skeleton } from "@/components/ui/skeleton"
import { LockedFeatureCard } from "@/components/app/LockedFeatureCard"
import { PLAN_LABELS, hasFeature, isPlanAtLeast } from "@/lib/plans"
import DashboardPage from "@/components/app/DashboardPage"
import { PreviewBadge, PreviewBanner } from "@/components/ui/preview-badge"

export default function DashboardHomePage() {
    const { tenant, effectivePlan, isLoading: isTenantLoading } = useTenant();
    const [kpis, setKpis] = useState<KPI[]>([])
    const [aiChecks, setAiChecks] = useState<AICheck[]>([])
    const [loadedTenantId, setLoadedTenantId] = useState<string | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [selectedCheck, setSelectedCheck] = useState<AICheck | null>(null)
    const [trendMountKey, setTrendMountKey] = useState(0)

    const canSeeAI = hasFeature(effectivePlan, 'ai_compliance')
    const canSeeAllKPIs = isPlanAtLeast(effectivePlan, 'pro')
    const hasAdvisorWidget = isPlanAtLeast(effectivePlan, 'pro_advisor')

    useEffect(() => {
        if (!tenant?.id) return

        let isActive = true

        Promise.all([
            apiFetch<KPI[]>(`/tenants/${tenant.id}/kpis`),
            apiFetch<AICheck[]>(`/tenants/${tenant.id}/ai/checks`)
        ])
            .then(([kpiData, aiData]) => {
                if (!isActive) return
                setLoadError(null)
                setKpis(kpiData)
                setAiChecks(aiData)
                setLoadedTenantId(tenant.id)
                setTrendMountKey(prev => prev + 1)
            })
            .catch((error) => {
                console.error('Failed to load dashboard data', error)
                if (!isActive) return
                setKpis([])
                setAiChecks([])
                setLoadError('Dashboardgegevens konden niet worden geladen. Probeer het zo opnieuw.')
                setLoadedTenantId(tenant.id)
            })

        return () => {
            isActive = false
        }

    }, [tenant?.id]);

    if (isTenantLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
    if (!tenant) return <div className="p-8 text-slate-600">Selecteer een bedrijf om te starten.</div>

    const loading = loadedTenantId !== tenant.id

    // Transform mock data for charts
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
        <DashboardPage
            title="Welkom terug, Jan."
            description={`Hier is je dagelijkse overzicht voor ${tenant?.name}.`}
            actions={
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actief Plan:</span>
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 rounded">
                        {PLAN_LABELS[effectivePlan]}
                    </span>
                    <Link href="/pricing" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors ml-2 flex items-center gap-1" aria-label="Bekijk features en prijzen">
                        <Info size={10} /> Features
                    </Link>
                </div>
            }
            className="animate-fade-in-up"
        >
            {/* Demo Data Banner */}
            <PreviewBanner
                title="Demo Dashboard"
                description="De KPI's en grafieken tonen voorbeelddata. Koppel je bedrijfsgegevens om realtime inzichten te zien."
                variant="demo-data"
            />

            {loadError && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="text-amber-900">Dashboard laden mislukt</CardTitle>
                        <CardDescription className="text-amber-800">{loadError}</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* KPIs Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardContent className="p-5">
                                <Skeleton className="h-3 w-24 rounded-md" />
                                <Skeleton className="mt-3 h-8 w-40 rounded-md" />
                                <Skeleton className="mt-3 h-3 w-32 rounded-md" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        {kpis.slice(0, canSeeAllKPIs ? kpis.length : 2).map((kpi, idx) => (
                            <Card
                                key={kpi.id}
                                className="border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out animate-fade-in-up"
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {kpi.label}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <PreviewBadge variant="demo-data" size="sm" showIcon={false} />
                                        <div className={`size-2 rounded-full ${kpi.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                        {kpi.value.toLocaleString()}
                                        <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">
                                            {kpi.unit}
                                        </span>
                                    </div>
                                    {kpi.trend !== undefined && (
                                        <p className={`text-xs mt-1 flex items-center ${kpi.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {kpi.trend > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                            {Math.abs(kpi.trend)}% t.o.v. vorige maand
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* Locked KPI for Starter */}
                        {!canSeeAllKPIs && (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4 bg-slate-50/50 group hover:border-amber-200 transition-colors cursor-pointer">
                                <Link href="/pricing" className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                                        <Lock size={14} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-slate-900">Extra KPI&apos;s</div>
                                        <div className="text-[10px] text-slate-500">Beschikbaar vanaf Pro</div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Upload CTA */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="sm:col-span-2 lg:col-span-1 border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)]">
                    <CardHeader>
                        <CardTitle>Documenten uploaden</CardTitle>
                        <CardDescription>
                            Voeg snel nieuwe documenten toe aan je dossier.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500">
                        Upload je mestbonnen, vergunningen en andere bewijsstukken op één plek.
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <Link href="/dashboard/documents/upload-center">
                            <Button>Naar Uploadcentrum</Button>
                        </Link>
                        <Link href="/dashboard/documents">
                            <Button variant="outline">Mijn documenten</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Stikstof Trend Chart */}
                <div className="lg:col-span-2">
                    <ChartCard
                        title="Stikstofruimte trend"
                        description="Realisatie vs norm"
                        badge={<PreviewBadge variant="demo-data" size="sm" />}
                        className="h-full relative overflow-hidden"
                    >
                        {!canSeeAllKPIs && (
                            <LockedFeatureCard 
                                overlay
                                title="Gedetailleerde Trends"
                                description="Activeer Pro voor realtime trendanalyses en normvergelijking."
                                requiredPlanId="pro"
                            />
                        )}
                        {loading ? (
                            <ChartSkeleton height={300} />
                        ) : (
                            <>
                                <PremiumTrendChart
                                    key={`stikstof-trend-${tenant.id}-${trendMountKey}`}
                                    data={stikstofSeries}
                                    height={300}
                                    unit="kg"
                                    showTarget
                                    showCurrentValue
                                    tone="emerald"
                                    ariaLabel="Stikstofruimte trend grafiek"
                                />
                                <ChartLegend
                                    items={[
                                        { label: "Realisatie", colorClass: "bg-emerald-500" },
                                        { label: "Norm", colorClass: "bg-slate-400", dashed: true },
                                    ]}
                                />
                            </>
                        )}
                    </ChartCard>
                </div>

                {/* Mest Activity + AI Compliance */}
                <div className="space-y-6">
                    {/* Mest Activity Chart */}
                    <ChartCard
                        title="Mest activiteit"
                        description="Laatste weken"
                        badge={<PreviewBadge variant="demo-data" size="sm" />}
                    >
                        {loading ? (
                            <ChartSkeleton height={180} />
                        ) : (
                            <PremiumBarsChart
                                key={`mest-bars-${tenant.id}-${trendMountKey}`}
                                data={mestBars}
                                height={180}
                                valueLabel="ton"
                                unit="ton"
                                showTrack
                                ariaLabel="Mest activiteit staafgrafiek"
                                tone="amber"
                            />
                        )}
                    </ChartCard>

                    {/* AI Compliance Widget */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
                                AI Compliance
                            </h3>
                            <PreviewBadge variant="demo-data" size="sm" />
                        </div>

                        {!canSeeAI ? (
                            <LockedFeatureCard 
                                title="AI Compliance Check"
                                description="Onze AI analyseert je dossiers continu op risico's en missende documenten."
                                requiredPlanId="pro"
                            />
                        ) : loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)]">
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
                                    <div
                                        key={check.id}
                                        className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                check.severity === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                check.severity === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}>
                                                {check.severity}
                                            </span>
                                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tabular-nums">
                                                {check.confidence}%
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
                                            {check.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                            {check.summary}
                                        </p>
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

                    {/* Pro+ Extra Widget */}
                    {hasAdvisorWidget && (
                        <Card className="bg-slate-900 border-none shadow-xl overflow-hidden relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white text-sm">Adviseur Inzicht</h4>
                                            <PreviewBadge variant="demo-data" size="sm" className="border-amber-700" />
                                        </div>
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Pakket: {PLAN_LABELS[effectivePlan]}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                    Je adviseur heeft 3 nieuwe documenten klaargezet voor review.
                                </p>
                                <Link href="/dashboard/adviseurs">
                                    <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs">
                                        Bekijk Portaal
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Drawers/Modals */}
            <EvidenceDrawer
                check={selectedCheck}
                isOpen={!!selectedCheck}
                onClose={() => setSelectedCheck(null)}
            />
        </DashboardPage>
    )
}
