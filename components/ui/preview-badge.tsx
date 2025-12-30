"use client"

import { cn } from "@/lib/utils"
import { Sparkles, Clock, Info } from "lucide-react"

type BadgeVariant = "preview" | "coming-soon" | "demo-data"

interface PreviewBadgeProps {
    variant?: BadgeVariant
    className?: string
    size?: "sm" | "md"
    showIcon?: boolean
}

const variantConfig = {
    "preview": {
        label: "Preview",
        icon: Sparkles,
        colors: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800",
    },
    "coming-soon": {
        label: "Binnenkort",
        icon: Clock,
        colors: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    },
    "demo-data": {
        label: "Demo Data",
        icon: Info,
        colors: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    },
}

export function PreviewBadge({ variant = "preview", className, size = "sm", showIcon = true }: PreviewBadgeProps) {
    const config = variantConfig[variant]
    const Icon = config.icon

    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded border font-bold tracking-wider uppercase",
            config.colors,
            size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
            className
        )}>
            {showIcon && <Icon size={size === "sm" ? 10 : 12} />}
            {config.label}
        </span>
    )
}

/**
 * A banner component for larger preview notices
 */
interface PreviewBannerProps {
    title?: string
    description?: string
    variant?: BadgeVariant
    className?: string
}

export function PreviewBanner({ 
    title = "Preview Mode", 
    description = "Deze gegevens zijn indicatief en dienen alleen ter demonstratie.",
    variant = "demo-data",
    className 
}: PreviewBannerProps) {
    const config = variantConfig[variant]
    const Icon = config.icon

    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            variant === "demo-data" && "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
            variant === "preview" && "bg-violet-50/50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
            variant === "coming-soon" && "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700",
            className
        )}>
            <div className={cn(
                "size-8 rounded-full flex items-center justify-center shrink-0",
                variant === "demo-data" && "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
                variant === "preview" && "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400",
                variant === "coming-soon" && "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
            )}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-bold",
                    variant === "demo-data" && "text-amber-800 dark:text-amber-200",
                    variant === "preview" && "text-violet-800 dark:text-violet-200",
                    variant === "coming-soon" && "text-slate-700 dark:text-slate-300",
                )}>
                    {title}
                </p>
                <p className={cn(
                    "text-xs mt-0.5",
                    variant === "demo-data" && "text-amber-700 dark:text-amber-300",
                    variant === "preview" && "text-violet-700 dark:text-violet-300",
                    variant === "coming-soon" && "text-slate-500 dark:text-slate-400",
                )}>
                    {description}
                </p>
            </div>
        </div>
    )
}

/**
 * Wrapper to disable a button with tooltip
 */
interface DisabledCtaProps {
    children: React.ReactNode
    reason?: string
    className?: string
}

export function DisabledCta({ children, reason = "Deze functie is binnenkort beschikbaar.", className }: DisabledCtaProps) {
    return (
        <div className={cn("relative group", className)}>
            <div className="opacity-50 pointer-events-none">
                {children}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {reason}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            </div>
        </div>
    )
}
