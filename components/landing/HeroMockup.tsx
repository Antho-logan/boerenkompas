"use client"

import React from "react"
import HeroAreaLineChart from "@/components/charts/HeroAreaLineChart"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function HeroMockup() {
    const chartData = [
        { label: "Jan", value: 1200, norm: 2300 },
        { label: "Feb", value: 1350, norm: 2300 },
        { label: "Mrt", value: 1600, norm: 2300 },
        { label: "Apr", value: 1550, norm: 2300 },
        { label: "Mei", value: 1750, norm: 2300 },
        { label: "Jun", value: 1880, norm: 2300 },
        { label: "Jul", value: 2010, norm: 2300 },
        { label: "Aug", value: 2090, norm: 2300 },
        { label: "Sep", value: 2120, norm: 2300 },
    ]

    return (
        <div className="relative w-full max-w-[600px] aspect-[4/3] mx-auto perspective-[2000px] group">

            {/* Main Dashboard Card */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden transform transition-all duration-700 hover:rotate-x-1 hover:rotate-y-1 hover:scale-[1.01]">

                {/* Mockup Header */}
                <div className="h-10 bg-slate-50/80 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="size-2.5 rounded-full bg-red-400/80" />
                        <div className="size-2.5 rounded-full bg-amber-400/80" />
                        <div className="size-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <div className="ml-4 h-4 w-32 bg-slate-200/50 rounded-full" />
                </div>

                {/* Dashboard Grid */}
                <div className="p-6 space-y-6">

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KPIMock label="Stikstof" value="84%" status="Binnen norm" color="emerald" isProgress />
                        <KPIMock label="Meldingen" value="2" status="Urgent" color="rose" />
                        <KPIMock label="Deadline" value="16 dec" status="GLB / RVO" color="slate" />
                        <KPIMock label="Compliance" value="98/100" status="Audit Ready" color="blue" />
                    </div>

                    {/* Main Chart Section */}
                    <div className="rounded-xl border border-slate-100 p-5 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <div className="text-sm font-bold text-slate-800">Stikstofruimte Verloop</div>
                                <div className="text-xs text-slate-400">Prognose vs Realisatie 2024</div>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center text-[10px] text-slate-500 gap-1"><div className="size-2 rounded-full bg-emerald-500" /> Realisatie</span>
                                <span className="flex items-center text-[10px] text-slate-400 gap-1"><div className="size-2 rounded-full bg-slate-200" /> Norm</span>
                            </div>
                        </div>
                        <HeroAreaLineChart data={chartData} height={180} className="w-full relative z-10" />
                    </div>
                </div>
            </div>

            {/* Floating Notification Toast */}
            <div className="absolute -right-4 top-16 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 border border-slate-100 flex items-center gap-3 animate-fade-in-right z-20 max-w-[240px]">
                <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={18} />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-800">NVWA Dossier</div>
                    <div className="text-[10px] text-slate-500">Automatisch geëxporteerd</div>
                </div>
            </div>

            {/* Floating Alert Toast (Left Bottom) */}
            <div className="absolute -left-6 bottom-20 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 border border-slate-100 flex items-center gap-3 animate-fade-in-up delay-700 z-20 max-w-[220px]">
                <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertCircle size={18} />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-800">Mestbalans</div>
                    <div className="text-[10px] text-slate-500">Naderende limiet (90%)</div>
                </div>
            </div>
        </div>
    )
}

type KPIMockColor = "emerald" | "rose" | "slate" | "blue"

type KPIMockProps = {
    label: string
    value: string
    status: string
    color: KPIMockColor
    isProgress?: boolean
}

function KPIMock({ label, value, status, color, isProgress }: KPIMockProps) {
    return (
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-20 relative overflow-hidden group hover:border-emerald-100 transition-colors">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</div>
            <div className="flex flex-col">
                <div className={`text-lg font-bold text-slate-900 ${color === 'rose' ? 'text-rose-600' : ''}`}>{value}</div>
                <div className={`text-[9px] font-medium mt-0.5 w-fit rounded-full px-1.5 py-0.5 ${color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                        color === 'rose' ? 'bg-rose-50 text-rose-700' :
                            color === 'blue' ? 'bg-blue-50 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                    }`}>
                    {status}
                </div>
            </div>
            {isProgress && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-100">
                    <div className="h-full bg-emerald-500 w-[84%]" />
                </div>
            )}
        </div>
    )
}
