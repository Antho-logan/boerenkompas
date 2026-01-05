"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LANDING_COPY } from "@/lib/landing-copy"
import { PLANS } from "@/lib/plans"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"

export default function PricingSection() {
    const [isAnnual, setIsAnnual] = useState(false)
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
    const [errorToast, setErrorToast] = useState<string | null>(null)
    const toastTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isSupabaseConfigured()) return
        const supabase = createClient()
        supabase.auth.getSession().then(({ data }) => {
            setIsAuthenticated(Boolean(data.session))
        })
    }, [])

    const showErrorToast = (message: string) => {
        setErrorToast(message)
        if (toastTimeoutRef.current) {
            window.clearTimeout(toastTimeoutRef.current)
        }
        toastTimeoutRef.current = window.setTimeout(() => {
            setErrorToast(null)
        }, 4000)
    }

    const parseMonthlyPrice = (price: string) => {
        const normalized = price.replace(/[^0-9.,]/g, "").replace(",", ".")
        const value = Number(normalized)
        return Number.isFinite(value) ? value : null
    }

    const formatCurrency = (value: number) => {
        const rounded = Math.round(value * 100) / 100
        const hasDecimals = Math.round(rounded * 100) % 100 !== 0
        return new Intl.NumberFormat("nl-NL", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2,
        }).format(rounded)
    }

    const handleUpgrade = async () => {
        if (checkoutLoading) return
        setCheckoutLoading("pro")
        try {
            const response = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan: "pro",
                    interval: isAnnual ? "annual" : "monthly",
                }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showErrorToast(data?.error || "Kon upgrade niet starten.")
                return
            }

            if (!data?.url) {
                showErrorToast("Geen checkout URL ontvangen.")
                return
            }

            window.location.href = data.url
        } catch (error) {
            console.error("Upgrade failed:", error)
            showErrorToast("Kon upgrade niet starten.")
        } finally {
            setCheckoutLoading(null)
        }
    }

    return (
        <section id="prijzen" className="py-24 bg-white border-t border-slate-100 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
                        {LANDING_COPY.pricing.intro.heading}
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        {LANDING_COPY.pricing.intro.sub}
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center">
                        <div
                            role="group"
                            aria-label="Facturatieperiode"
                            className="relative grid grid-cols-2 items-center rounded-full bg-slate-100 p-1 border border-slate-200 shadow-inner"
                        >
                            <span
                                className={cn(
                                    "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                                    isAnnual ? "translate-x-full" : "translate-x-0"
                                )}
                                aria-hidden="true"
                            />
                            <button
                                type="button"
                                onClick={() => setIsAnnual(false)}
                                aria-pressed={!isAnnual}
                                className={cn(
                                    "relative z-10 px-4 py-2 text-xs font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 whitespace-nowrap motion-reduce:transition-none",
                                    !isAnnual ? "text-slate-900" : "text-slate-500"
                                )}
                            >
                                Maandelijks
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAnnual(true)}
                                aria-pressed={isAnnual}
                                className={cn(
                                    "relative z-10 px-4 py-2 text-xs font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 whitespace-nowrap motion-reduce:transition-none",
                                    isAnnual ? "text-slate-900" : "text-slate-500"
                                )}
                            >
                                Jaarlijks <span className="ml-1 text-[10px] text-emerald-600">-10%</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16 items-start">
                    {PLANS.map((plan, i) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col h-full pt-4 animate-fade-in-up",
                                plan.isPopular ? "z-10" : ""
                            )}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                    <div className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] uppercase font-bold text-white shadow-sm ring-4 ring-white tracking-wide">
                                        Populair
                                    </div>
                                </div>
                            )}

                            <Card
                                className={cn(
                                    "flex flex-col h-full border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 bg-white relative focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none",
                                    plan.isPopular ? "ring-2 ring-emerald-500/20 shadow-md" : ""
                                )}
                            >
                                <CardHeader className="pb-4 pt-8">
                                    <CardTitle className="text-lg font-bold text-slate-900">{plan.name}</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 min-h-[40px] mt-2">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    {(() => {
                                        if (plan.id === "enterprise") {
                                            return (
                                                <div className="mb-6 flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-slate-900">Custom</span>
                                                </div>
                                            )
                                        }

                                        const monthlyPrice = parseMonthlyPrice(plan.price)
                                        const annualTotal = monthlyPrice ? monthlyPrice * 12 : null
                                        const discountedTotal = annualTotal ? annualTotal * 0.9 : null
                                        const effectiveMonthly = discountedTotal ? discountedTotal / 12 : null
                                        const canShowAnnual = Boolean(annualTotal && discountedTotal && effectiveMonthly)
                                        const showAnnual = isAnnual && canShowAnnual

                                        const monthlyMarkup = (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-slate-900">
                                                    {plan.price}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">/mnd</span>
                                            </div>
                                        )

                                        const annualMarkup = canShowAnnual ? (
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {formatCurrency(annualTotal as number)}
                                                    </span>
                                                    <span className="text-2xl font-bold text-slate-900">
                                                        {formatCurrency(discountedTotal as number)}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px]">/jaar</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                    {formatCurrency(effectiveMonthly as number)} /mnd (jaarlijks)
                                                </div>
                                            </div>
                                        ) : (
                                            monthlyMarkup
                                        )

                                        return (
                                            <div className="relative mb-6 min-h-[56px]">
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                                                        showAnnual ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                                                    )}
                                                >
                                                    {monthlyMarkup}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                                                        showAnnual ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                                                    )}
                                                >
                                                    {annualMarkup}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <div className="mt-0.5 size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Check size={10} strokeWidth={3} aria-hidden="true" />
                                                </div>
                                                <span className="text-slate-700 leading-tight text-[11px]">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="pt-4 pb-8 flex flex-col gap-3">
                                    <Button
                                        className={cn(
                                            "w-full h-9 text-xs font-bold shadow-sm group", 
                                            !plan.isPopular ? "hover:bg-slate-50 border-slate-200 text-slate-700" : "bg-emerald-900 text-white hover:bg-emerald-800 shadow-emerald-900/10"
                                        )}
                                        variant={!plan.isPopular ? "outline" : "default"}
                                        onClick={plan.id === "pro" && isAuthenticated ? handleUpgrade : undefined}
                                        disabled={plan.id === "pro" && isAuthenticated && checkoutLoading === "pro"}
                                    >
                                        {plan.id === "pro" && isAuthenticated ? (
                                            checkoutLoading === "pro" ? (
                                                <>
                                                    <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
                                                    Bezig...
                                                </>
                                            ) : (
                                                "Upgrade"
                                            )
                                        ) : (
                                            plan.cta
                                        )}
                                        {plan.isPopular && <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Add-ons & FAQ */}
                <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto border-t border-slate-100 pt-12">

                    {/* Add-ons */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Extra mogelijkheden</h4>
                        <div className="space-y-4">
                            {LANDING_COPY.pricing.addons.map((addon, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:border-emerald-200 hover:shadow-sm hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none">
                                    <div>
                                        <span className="text-sm font-medium text-slate-900 block">{addon.title}</span>
                                        <span className="text-xs text-slate-500">{addon.desc}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{addon.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Veelgestelde vragen pricing</h4>
                        <div className="space-y-2">
                            {LANDING_COPY.faq.map((item, idx) => {
                                const isOpen = openFaq === idx
                                const panelId = `faq-panel-${idx}`
                                const buttonId = `faq-button-${idx}`

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "border rounded-lg overflow-hidden bg-white transition-all",
                                            isOpen ? "border-emerald-200 shadow-sm" : "border-slate-200 hover:border-emerald-200",
                                            "focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:ring-offset-2"
                                        )}
                                    >
                                        <button
                                            id={buttonId}
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full p-4 flex items-center justify-between text-left text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                                        >
                                            <span className="pr-4">{item.q}</span>
                                            <ChevronDown
                                                size={16}
                                                className={cn(
                                                    "text-slate-400 transition-transform duration-300 motion-reduce:transition-none",
                                                    isOpen ? "rotate-180" : "rotate-0"
                                                )}
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <div
                                            className={cn(
                                                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                                                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <div
                                                    id={panelId}
                                                    role="region"
                                                    aria-labelledby={buttonId}
                                                    className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-50 pt-2"
                                                >
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 pointer-events-none" />
            {errorToast && (
                <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg text-sm">
                    {errorToast}
                </div>
            )}
        </section>
    )
}
