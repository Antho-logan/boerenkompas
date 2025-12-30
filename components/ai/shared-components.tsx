"use client"

import type { ReactNode } from "react"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// --- Page Header ---
export function PageHeader({ title, subtitle, actions, badge }: { title: ReactNode, subtitle: string, actions?: ReactNode, badge?: ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up pb-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    {badge}
                </div>
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    )
}

// --- Stat Card ---
export function StatCard({ label, value, icon: Icon, trend, variant = 'default', badge }: { label: string, value: string, icon: LucideIcon, trend?: { val: number, label: string }, variant?: 'default' | 'warning' | 'critical', badge?: ReactNode }) {
    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                            {badge}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        variant === 'critical' ? "bg-red-50 text-red-600" :
                            variant === 'warning' ? "bg-amber-50 text-amber-600" :
                                "bg-slate-100 text-slate-600"
                    )}>
                        <Icon size={18} />
                    </div>
                </div>
                {trend && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className={cn(
                            "px-1.5 h-5 flex items-center gap-1",
                            trend.val > 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                        )}>
                            {trend.val > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {Math.abs(trend.val)}%
                        </Badge>
                        <span className="text-slate-400">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Severity Badge ---
export function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
    const styles = {
        low: "bg-slate-100 text-slate-600 border-slate-200",
        medium: "bg-blue-50 text-blue-700 border-blue-200",
        high: "bg-amber-50 text-amber-700 border-amber-200",
        critical: "bg-red-50 text-red-700 border-red-200 animate-pulse"
    }
    return (
        <Badge variant="outline" className={cn("text-[10px] h-5 uppercase tracking-wide border", styles[severity] || styles.low)}>
            {severity}
        </Badge>
    )
}

// --- Empty State ---
export function EmptyState({ title, desc, icon: Icon, action }: { title: string, desc: string, icon: LucideIcon, action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="size-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm text-slate-400">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-1 mb-6">{desc}</p>
            {action}
        </div>
    )
}
