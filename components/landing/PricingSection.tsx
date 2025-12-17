"use client"

import React, { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { LANDING_COPY } from "@/lib/landing-copy"

export default function PricingSection() {
    const [isAnnual, setIsAnnual] = useState(false)
    const [openFaq, setOpenFaq] = useState<number | null>(null)

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
                    <div className="flex items-center justify-center gap-4">
                        <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-slate-900" : "text-slate-500")}>
                            {LANDING_COPY.pricing.intro.toggle_monthly}
                        </span>
                        <Switch
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                        <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-slate-900" : "text-slate-500")}>
                            {LANDING_COPY.pricing.intro.toggle_yearly}
                        </span>
                    </div>

                    {/* Value microcopy */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-600">
                        {LANDING_COPY.pricing.intro.value_points.map((p, i) => (
                            <div key={i} className="inline-flex items-center gap-2">
                                <div className="size-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span>{p}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-start">
                    {LANDING_COPY.pricing.plans.map((plan, i) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col h-full pt-4 animate-fade-in-up",
                                plan.label ? "z-10" : ""
                            )}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {/* BADGE OUTSIDE CARD */}
                            {plan.label && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                    <div className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] uppercase font-bold text-white shadow-sm ring-4 ring-white tracking-wide">
                                        {plan.label}
                                    </div>
                                </div>
                            )}

                            <Card
                                className={cn(
                                    "flex flex-col h-full border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 bg-white relative",
                                    plan.label ? "ring-2 ring-emerald-500/20 shadow-md" : ""
                                )}
                            >
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                                    <CardDescription className="text-sm text-slate-500 min-h-[40px] mt-2">{plan.intro}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="mb-6 flex items-baseline">
                                        <span className="text-4xl font-bold text-slate-900">
                                            €{isAnnual ? Math.round(plan.price_monthly * 0.9) : plan.price_monthly}
                                        </span>
                                        <span className="text-slate-500 ml-1">/ maand</span>
                                    </div>
                                    <ul className="space-y-3 text-sm">
                                        {plan.bullets.map((feat, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="mt-0.5 size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                                <span className="text-slate-700 leading-tight">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="pt-4 pb-8 flex flex-col gap-3">
                                    <Button
                                        className={cn("w-full h-11 text-base shadow-sm group", !plan.label ? "hover:bg-slate-50 border-slate-200 text-slate-700" : "bg-emerald-900 text-white hover:bg-emerald-800 shadow-emerald-900/10")}
                                        variant={!plan.label ? "outline" : "default"}
                                    >
                                        {plan.cta}
                                        {plan.label && <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>}
                                    </Button>
                                    <div className="text-xs text-center text-slate-400 font-medium">
                                        {plan.micro}
                                    </div>
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
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
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
                            {LANDING_COPY.faq.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:border-emerald-200 transition-colors cursor-pointer"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <div className="p-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-900">{item.q}</span>
                                        {openFaq === idx ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>
                                    {openFaq === idx && (
                                        <div className="px-4 pb-4 text-sm text-slate-600 animate-fade-in-down border-t border-slate-50 pt-2">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 pointer-events-none" />
        </section>
    )
}
