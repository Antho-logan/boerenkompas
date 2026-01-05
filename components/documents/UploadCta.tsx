"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Upload, FileText, ArrowRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Can } from "@/components/app/RBAC"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface UploadCtaProps {
    /** Visual style variant */
    variant?: "button" | "card" | "inline"
    /** Size for button variant */
    size?: "sm" | "md" | "lg"
    /** Custom label text */
    label?: string
    /** Optional category to pre-select */
    category?: string
    /** Optional requirement ID for guided upload */
    requirementId?: string
    /** Custom className */
    className?: string
    /** Show description text (card variant only) */
    showDescription?: boolean
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

/**
 * UploadCta - Reusable upload call-to-action component
 * 
 * Use this to add consistent upload entry points throughout the app.
 * Supports multiple variants:
 * - "button": Simple button that navigates to Upload Center
 * - "card": Full card with icon, description, and CTA
 * - "inline": Inline link-style button
 * 
 * @example
 * // Simple button
 * <UploadCta variant="button" label="Upload Document" />
 * 
 * @example
 * // Card with description
 * <UploadCta variant="card" showDescription />
 * 
 * @example
 * // Guided upload for a specific requirement
 * <UploadCta variant="button" requirementId="abc-123" label="Upload voor deze eis" />
 */
export function UploadCta({
    variant = "button",
    size = "md",
    label,
    category,
    requirementId,
    className,
    showDescription = true,
}: UploadCtaProps) {
    const router = useRouter()

    // Build upload URL with optional query params
    const getUploadUrl = () => {
        const params = new URLSearchParams()
        if (category) params.set("category", category)
        if (requirementId) params.set("requirementId", requirementId)
        
        const queryString = params.toString()
        return `/dashboard/documents/upload-center${queryString ? `?${queryString}` : ""}`
    }

    const handleClick = () => {
        router.push(getUploadUrl())
    }

    // Default labels based on context
    const defaultLabel = requirementId 
        ? "Upload bewijsstuk" 
        : "Document uploaden"
    const displayLabel = label || defaultLabel

    // Size classes for button variant
    const sizeClasses = {
        sm: "h-8 text-xs px-3",
        md: "h-10 text-sm px-4",
        lg: "h-12 text-base px-6",
    }

    // ─────────────────────────────────────────────────────────────
    // BUTTON VARIANT
    // ─────────────────────────────────────────────────────────────
    if (variant === "button") {
        return (
            <Can roles={["owner", "advisor"]}>
                <Button
                    onClick={handleClick}
                    className={cn(
                        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2",
                        sizeClasses[size],
                        className
                    )}
                >
                    <Upload size={size === "sm" ? 14 : size === "lg" ? 18 : 16} aria-hidden="true" />
                    {displayLabel}
                </Button>
            </Can>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // INLINE VARIANT
    // ─────────────────────────────────────────────────────────────
    if (variant === "inline") {
        return (
            <Can roles={["owner", "advisor"]}>
                <button
                    onClick={handleClick}
                    className={cn(
                        "inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors",
                        className
                    )}
                >
                    <Upload size={14} aria-hidden="true" />
                    {displayLabel}
                    <ArrowRight size={12} className="opacity-60" aria-hidden="true" />
                </button>
            </Can>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // CARD VARIANT
    // ─────────────────────────────────────────────────────────────
    return (
        <Can roles={["owner", "advisor"]}>
            <Link
                href={getUploadUrl()}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                onKeyDown={(event) => {
                    if (event.key === " ") {
                        event.preventDefault()
                        event.currentTarget.click()
                    }
                }}
            >
                <Card
                    className={cn(
                        "border-dashed border-2 border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer group",
                        className
                    )}
                >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                            <Upload size={24} aria-hidden="true" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{displayLabel}</h3>
                        {showDescription && (
                            <p className="text-sm text-slate-500 mb-4">
                                Sleep je documenten hierheen of klik om te uploaden.
                            </p>
                        )}
                        <span
                            className={buttonVariants({
                                size: "sm",
                                className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2",
                            })}
                        >
                            <FileText size={14} aria-hidden="true" />
                            Naar Uploadcentrum
                        </span>
                    </CardContent>
                </Card>
            </Link>
        </Can>
    )
}

// ─────────────────────────────────────────────────────────────────
// QUICK UPLOAD CARD (Dashboard variant)
// ─────────────────────────────────────────────────────────────────

/**
 * QuickUploadCard - Dashboard-specific upload card
 * 
 * A more prominent card for the main dashboard with stats and quick actions.
 */
export function QuickUploadCard({ 
    recentCount = 0,
    className 
}: { 
    recentCount?: number
    className?: string 
}) {
    return (
        <Can roles={["owner", "advisor"]}>
            <Link
                href="/dashboard/documents/upload-center"
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                onKeyDown={(event) => {
                    if (event.key === " ") {
                        event.preventDefault()
                        event.currentTarget.click()
                    }
                }}
            >
                <Card 
                    className={cn(
                        "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-lg overflow-hidden relative group cursor-pointer",
                        className
                    )}
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden="true" />
                    
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="size-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Upload size={24} aria-hidden="true" />
                            </div>
                            {recentCount > 0 && (
                                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                                    {recentCount} recent
                                </span>
                            )}
                        </div>
                        
                        <h3 className="text-lg font-bold mb-1">Document uploaden</h3>
                        <p className="text-emerald-100 text-sm mb-4 leading-relaxed">
                            Upload je mestbonnen, vergunningen en andere documenten. Wij checken automatisch of je dossier compleet is.
                        </p>
                        
                        <span
                            className={buttonVariants({
                                size: "sm",
                                className: "w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-md",
                            })}
                        >
                            <Upload size={16} className="mr-2" aria-hidden="true" />
                            Naar Uploadcentrum
                        </span>
                    </CardContent>
                </Card>
            </Link>
        </Can>
    )
}
