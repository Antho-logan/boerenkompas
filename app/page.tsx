"use client"

import Link from "next/link";
import {
    ArrowRight, Leaf, BarChart3, ShieldCheck,
    FileText, Users, Menu, X, Check, Calendar, FolderOpen, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PricingSection from "@/components/landing/PricingSection";
import HeroMockup from "@/components/landing/HeroMockup";
import { LANDING_COPY } from "@/lib/landing-copy";

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0">
                <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center">
                            <Leaf size={18} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">BoerenKompas</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="#features" className="hover:text-emerald-700 transition-colors">{LANDING_COPY.nav.features}</Link>
                        <Link href="#prijzen" className="hover:text-emerald-700 transition-colors">{LANDING_COPY.nav.pricing}</Link>
                        <Link href="#over-ons" className="hover:text-emerald-700 transition-colors">{LANDING_COPY.nav.about}</Link>
                        <Link href="/login" className="text-slate-900 hover:text-emerald-700">{LANDING_COPY.nav.login}</Link>
                        <Link href="/login">
                            <Button size="sm" className="bg-emerald-900 text-white hover:bg-emerald-800 shadow-lg shadow-emerald-900/10">
                                {LANDING_COPY.nav.cta}
                            </Button>
                        </Link>
                    </div>

                    <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-4 flex flex-col gap-4 shadow-xl animate-fade-in-up">
                        <Link href="#features" className="p-2 hover:bg-slate-50 rounded-lg">{LANDING_COPY.nav.features}</Link>
                        <Link href="#prijzen" className="p-2 hover:bg-slate-50 rounded-lg">{LANDING_COPY.nav.pricing}</Link>
                        <Link href="/login" className="p-2 hover:bg-slate-50 rounded-lg">{LANDING_COPY.nav.login}</Link>
                        <Link href="/login">
                            <Button className="w-full bg-emerald-900 text-white">{LANDING_COPY.nav.cta}</Button>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent -z-10" />

                <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">

                    <div className="max-w-xl animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {LANDING_COPY.hero.badge}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                            <span className="relative">
                                {LANDING_COPY.hero.h1}
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            {LANDING_COPY.hero.sub}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <Link href="/login">
                                <Button size="lg" className="w-full sm:w-auto bg-emerald-900 hover:bg-emerald-800 text-white shadow-xl shadow-emerald-900/20 h-12 px-8 text-base">
                                    {LANDING_COPY.hero.cta_primary} <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-white hover:text-emerald-800 h-12 px-8 text-base">
                                {LANDING_COPY.hero.cta_secondary}
                            </Button>
                        </div>

                        {/* Social Proof Mini */}
                        <div className="flex flex-col gap-4">
                            <div className="text-sm text-slate-500 font-medium">
                                {LANDING_COPY.hero.trust}
                            </div>
                            <div className="flex gap-6 text-sm text-slate-600">
                                {LANDING_COPY.social_proof.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <Check className="size-4 text-emerald-600" strokeWidth={3} />
                                        <span>{item.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Hero Mockup */}
                    <div className="relative animate-fade-in-up delay-200 lg:pl-10">
                        <HeroMockup />
                    </div>

                </div>
            </section>

            {/* Pain -> Solution */}
            <section className="py-20 bg-slate-100/50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{LANDING_COPY.pain_solution.heading}</h2>
                        <p className="text-lg text-slate-600">{LANDING_COPY.pain_solution.intro}</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {LANDING_COPY.pain_solution.bullets.map((bullet, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-start">
                                <div className="mt-1 size-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-emerald-700">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="text-slate-700 font-medium">{bullet}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-slate-100 -z-10" />

                        {LANDING_COPY.how_it_works.map((step, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center">
                                <div className="size-16 rounded-2xl bg-white border border-emerald-100 text-emerald-800 shadow-sm flex items-center justify-center text-2xl font-bold mb-6 z-10">
                                    {step.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">Grip op elke hectare.</h2>
                        <p className="text-lg text-slate-600">Alle tools die je nodig hebt voor een gezonde bedrijfsvoering.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={BarChart3} title={LANDING_COPY.features[0].title} desc={LANDING_COPY.features[0].desc} />
                        <FeatureCard icon={Calendar} title={LANDING_COPY.features[1].title} desc={LANDING_COPY.features[1].desc} />
                        <FeatureCard icon={FileText} title={LANDING_COPY.features[2].title} desc={LANDING_COPY.features[2].desc} />
                        <FeatureCard icon={FolderOpen} title={LANDING_COPY.features[3].title} desc={LANDING_COPY.features[3].desc} />
                        <FeatureCard icon={ShieldCheck} title={LANDING_COPY.features[4].title} desc={LANDING_COPY.features[4].desc} />
                        <FeatureCard icon={Users} title={LANDING_COPY.features[5].title} desc={LANDING_COPY.features[5].desc} />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <PricingSection />

            <div className="container mx-auto px-4 md:px-6 pb-12">
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-center text-slate-600 text-sm max-w-3xl mx-auto">
                    <span className="font-bold block mb-2 text-slate-900">Belangrijke Informatie</span>
                    BoerenKompas geeft geen juridisch of vergunning-advies. Het is een workflow tool voor documentbeheer en dossiervorming.
                    U blijft zelf verantwoordelijk voor de juistheid van uw administratie.
                </div>
            </div>

            {/* Closing CTA */}
            <section className="py-24 bg-emerald-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://grain-url-placeholder')] opacity-10 mix-blend-overlay"></div>
                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-800/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-3xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{LANDING_COPY.closing.heading}</h2>
                    <p className="text-emerald-100 text-lg md:text-xl mb-10 leading-relaxed">
                        {LANDING_COPY.closing.sub}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg h-14 px-8 rounded-xl font-bold shadow-xl">
                            {LANDING_COPY.closing.cta_primary}
                        </Button>
                        <Button variant="outline" className="border-emerald-700 text-emerald-100 hover:bg-emerald-800 hover:text-white text-lg h-14 px-8 rounded-xl font-medium">
                            {LANDING_COPY.closing.cta_secondary}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="size-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center">
                                    <Leaf size={18} />
                                </div>
                                <span className="font-bold text-xl text-slate-900">BoerenKompas</span>
                            </div>
                            <p className="text-slate-500 max-w-xs leading-relaxed text-sm">
                                De standaard voor agrarisch ondernemerschap in Nederland.
                                Gebouwd met trots in Wageningen.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#features" className="hover:text-emerald-700">Features</a></li>
                                <li><a href="#prijzen" className="hover:text-emerald-700">Prijzen</a></li>
                                <li><a href="/login" className="hover:text-emerald-700">Inloggen</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Bedrijf</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-emerald-700">Over ons</a></li>
                                <li><a href="#" className="hover:text-emerald-700">Contact</a></li>
                                <li><a href="#" className="hover:text-emerald-700">Privacy & Voorwaarden</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                        <p>© 2024 BoerenKompas B.V. Alle rechten voorbehouden.</p>
                        <div className="flex gap-4">
                            {LANDING_COPY.footer_micro.map((micro, i) => (
                                <span key={i}>{micro}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

type FeatureCardProps = {
    icon: LucideIcon
    title: string
    desc: string
}

function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300 group">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
        </div>
    )
}
