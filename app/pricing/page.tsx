"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, Leaf, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { PLANS } from "@/lib/plans"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false)
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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white">
                            <Leaf size={16} />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight text-lg">BoerenKompas</span>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-600">
                            <ArrowLeft size={16} className="mr-2" />
                            Terug naar Dashboard
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Kies het plan dat bij jou past
                        </h1>
                        <p className="text-xl text-slate-600 mb-10">
                            Van zelfstandige boer tot grote maatschap, BoerenKompas biedt de grip die je nodig hebt op je compliance.
                        </p>

                        {/* Annual Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-12">
                            <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-slate-900" : "text-slate-500")}>
                                Maandelijks
                            </span>
                            <Switch
                                checked={isAnnual}
                                onCheckedChange={setIsAnnual}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                            <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-slate-900" : "text-slate-500")}>
                                Jaarlijks <span className="text-emerald-600 ml-1">(10% besparen)</span>
                            </span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
                        {PLANS.map((plan) => (
                            <div key={plan.id} className="relative flex flex-col">
                                {plan.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                        <div className="rounded-full bg-emerald-600 px-4 py-1 text-[10px] uppercase font-bold text-white shadow-lg tracking-wide border-2 border-white">
                                            Populair
                                        </div>
                                    </div>
                                )}
                                <Card className={cn(
                                    "flex flex-col h-full border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white relative",
                                    plan.isPopular ? "ring-2 ring-emerald-500/20 shadow-md border-emerald-200" : ""
                                )}>
                                    <CardHeader className="pb-4 pt-8">
                                        <CardTitle className="text-lg font-bold text-slate-900">{plan.name}</CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-2 min-h-[40px] leading-relaxed">
                                            {plan.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-4">
                                        {(() => {
                                            if (plan.id === "enterprise") {
                                                return (
                                                    <div className="mb-6">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-bold text-slate-900">
                                                                Custom
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            const monthlyPrice = parseMonthlyPrice(plan.price)
                                            const annualTotal = monthlyPrice ? monthlyPrice * 12 : null
                                            const discountedTotal = annualTotal ? annualTotal * 0.9 : null
                                            const effectiveMonthly = discountedTotal ? discountedTotal / 12 : null

                                            if (isAnnual && annualTotal && discountedTotal && effectiveMonthly) {
                                                return (
                                                    <div className="mb-6 space-y-1">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-xs text-slate-400 line-through">
                                                                {formatCurrency(annualTotal)}
                                                            </span>
                                                            <span className="text-2xl font-bold text-slate-900">
                                                                {formatCurrency(discountedTotal)}
                                                            </span>
                                                            <span className="text-slate-500 text-[10px]">/jaar</span>
                                                        </div>
                                                        <p className="text-[10px] text-emerald-600 font-medium">
                                                            Gefactureerd per jaar • {formatCurrency(effectiveMonthly)} /maand
                                                        </p>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div className="mb-6">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold text-slate-900">
                                                            {plan.price}
                                                        </span>
                                                        <span className="text-slate-500 text-[10px]">/maand</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inbegrepen:</p>
                                            <ul className="space-y-2.5">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <div className="mt-0.5 size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                        <span className="text-[11px] text-slate-600 leading-snug">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-4 pb-6">
                                        <Button
                                            className={cn(
                                                "w-full h-9 text-xs font-bold transition-all",
                                                plan.isPopular 
                                                    ? "bg-emerald-900 text-white hover:bg-emerald-800 shadow-lg shadow-emerald-900/20" 
                                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                            )}
                                            variant="default"
                                            onClick={plan.id === "pro" && isAuthenticated ? handleUpgrade : undefined}
                                            disabled={plan.id === "pro" && isAuthenticated && checkoutLoading === "pro"}
                                        >
                                            {plan.id === "pro" && isAuthenticated ? (
                                                checkoutLoading === "pro" ? (
                                                    <>
                                                        <Loader2 size={14} className="mr-2 animate-spin" />
                                                        Bezig...
                                                    </>
                                                ) : (
                                                    "Upgrade"
                                                )
                                            ) : (
                                                plan.cta
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-24 text-center bg-emerald-900 rounded-3xl p-12 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-4">Hulp nodig bij je keuze?</h2>
                            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                                Onze experts staan klaar om je te helpen het juiste pakket te vinden voor jouw specifieke situatie.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button className="bg-white text-emerald-900 hover:bg-emerald-50 h-12 px-8 font-bold text-lg shadow-xl border-none">
                                    Plan een gesprek
                                </Button>
                                <Button variant="ghost" className="text-white hover:bg-emerald-800 h-12 px-8 font-medium">
                                    Bekijk alle features
                                </Button>
                            </div>
                        </div>
                        
                        {/* Abstract background elements */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-800 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-700 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl opacity-30" />
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-12 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        © 2024 BoerenKompas. Alle prijzen zijn exclusief BTW.
                    </p>
                </div>
            </footer>
            {errorToast && (
                <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg text-sm">
                    {errorToast}
                </div>
            )}
        </div>
    )
}
