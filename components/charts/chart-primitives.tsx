"use client"

/**
 * Shared Chart Primitives & Design System
 *
 * Provides consistent styling, colors, and components for all charts.
 * Uses Tailwind CSS variables for theming support.
 * Premium Apple/OpenAI-level polish.
 */

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────────────────────────
 * COLOR SYSTEM
 * Using CSS variables that map to Tailwind colors for theme consistency
 * ────────────────────────────────────────────────────────────────────────────*/


/* Add shimmer animation for premium loading states */
/* This should be added to globals.css:
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
*/

export const CHART_COLORS = {
  // Primary palette (matches Tailwind defaults, works in light/dark)
  primary: "oklch(0.696 0.17 162.48)",    // emerald-500
  secondary: "oklch(0.623 0.214 259.815)", // blue-500
  tertiary: "oklch(0.769 0.188 70.08)",   // amber-500
  quaternary: "oklch(0.585 0.233 277.117)", // violet-500
  muted: "oklch(0.554 0.046 257.417)",    // slate-500

  // Semantic colors
  success: "oklch(0.696 0.17 162.48)",    // emerald-500
  warning: "oklch(0.769 0.188 70.08)",    // amber-500
  danger: "oklch(0.637 0.237 25.331)",    // red-500
  info: "oklch(0.623 0.214 259.815)",     // blue-500

  // Grid & axis - premium subtle colors
  grid: "rgba(15, 23, 42, 0.04)",
  gridDark: "rgba(248, 250, 252, 0.06)",
  axis: "rgba(15, 23, 42, 0.45)",
  axisDark: "rgba(248, 250, 252, 0.45)",
} as const

// Tone presets for charts (Tailwind-compatible class strings)
export const CHART_TONES = {
  emerald: {
    fill: "text-emerald-500",
    stroke: "text-emerald-600",
    bg: "bg-emerald-500",
    bgGradient: "bg-gradient-to-t from-emerald-600 to-emerald-400",
    cssColor: CHART_COLORS.primary,
  },
  blue: {
    fill: "text-blue-500",
    stroke: "text-blue-600",
    bg: "bg-blue-500",
    bgGradient: "bg-gradient-to-t from-blue-600 to-blue-400",
    cssColor: CHART_COLORS.secondary,
  },
  amber: {
    fill: "text-amber-500",
    stroke: "text-amber-600",
    bg: "bg-amber-500",
    bgGradient: "bg-gradient-to-t from-amber-600 to-amber-400",
    cssColor: CHART_COLORS.tertiary,
  },
  violet: {
    fill: "text-violet-500",
    stroke: "text-violet-600",
    bg: "bg-violet-500",
    bgGradient: "bg-gradient-to-t from-violet-600 to-violet-400",
    cssColor: CHART_COLORS.quaternary,
  },
  slate: {
    fill: "text-slate-500",
    stroke: "text-slate-600",
    bg: "bg-slate-500",
    bgGradient: "bg-gradient-to-t from-slate-600 to-slate-400",
    cssColor: CHART_COLORS.muted,
  },
} as const

export type ChartTone = keyof typeof CHART_TONES

/* ─────────────────────────────────────────────────────────────────────────────
 * TYPOGRAPHY & SPACING CONSTANTS
 * ────────────────────────────────────────────────────────────────────────────*/

export const CHART_CONFIG = {
  // Font sizes (in px) - refined for premium look
  fontSize: {
    tick: 10,
    tooltip: 12,
    label: 13,
    title: 14,
  },
  // Standard padding for charts - optimized for breathing room
  padding: {
    l: 48,
    r: 16,
    t: 16,
    b: 32,
  },
  // Standard heights
  height: {
    sm: 180,
    md: 240,
    lg: 300,
    xl: 400,
  },
  // Animation durations - smooth and refined
  animation: {
    line: 800,
    area: 400,
    bar: 600,
  },
} as const

/* ─────────────────────────────────────────────────────────────────────────────
 * TIME RANGE SELECTOR
 * Compact pill selector for time range filtering
 * ────────────────────────────────────────────────────────────────────────────*/

export type TimeRange = "7d" | "30d" | "90d" | "all"

interface TimeRangeSelectorProps {
  value?: TimeRange
  onChange?: (value: TimeRange) => void
  disabled?: boolean
  className?: string
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "Alles" },
]

export function TimeRangeSelector({ value = "30d", onChange, disabled, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => onChange?.(range.value)}
          disabled={disabled}
          className={cn(
            "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500/30",
            value === range.value
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={`Toon ${range.label}`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CHART CARD WRAPPER
 * Consistent card layout for all chart blocks with premium styling
 * ────────────────────────────────────────────────────────────────────────────*/

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
  /** Optional badge to show next to title (e.g., PreviewBadge) */
  badge?: React.ReactNode
  /** Controls whether CardContent has padding (default true) */
  padded?: boolean
  /** Optional time range selector */
  timeRange?: TimeRange
  onTimeRangeChange?: (value: TimeRange) => void
  timeRangeDisabled?: boolean
}

export function ChartCard({
  title,
  description,
  children,
  className,
  headerRight,
  badge,
  padded = true,
  timeRange,
  onTimeRangeChange,
  timeRangeDisabled,
}: ChartCardProps) {
  return (
    <Card className={cn(
      "border-slate-200/80 dark:border-slate-800/80",
      "shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)]",
      "hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.04)]",
      "overflow-hidden rounded-2xl transition-all duration-300 ease-out",
      className
    )}>
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase leading-tight">
                {title}
              </CardTitle>
              {badge}
            </div>
            {description && (
              <CardDescription className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {timeRange && (
              <TimeRangeSelector
                value={timeRange}
                onChange={onTimeRangeChange}
                disabled={timeRangeDisabled}
              />
            )}
            {headerRight}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(padded ? "px-5 sm:px-6 pb-5" : "p-0")}>
        {children}
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CHART TOOLTIP
 * Consistent tooltip styling for hover states with premium polish
 * ────────────────────────────────────────────────────────────────────────────*/

interface ChartTooltipProps {
  label: string
  items: Array<{
    name: string
    value: string | number
    color?: string
    colorClass?: string
  }>
  className?: string
}

export function ChartTooltip({ label, items, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 dark:border-slate-700/50",
        "bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl",
        "shadow-[0_10px_40px_-8px_rgba(0,0,0,0.15),0_4px_12px_-4px_rgba(0,0,0,0.1)]",
        "px-4 py-3.5 text-[11px] min-w-[150px] max-w-[220px]",
        "animate-in fade-in zoom-in-95 duration-150 ease-out",
        className
      )}
    >
      <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2.5 pb-2.5 border-b border-slate-100/80 dark:border-slate-800/40">
        {label}
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {(item.color || item.colorClass) && (
                <span
                  className={cn("size-2 rounded-full shrink-0", item.colorClass)}
                  style={item.color ? { backgroundColor: item.color } : undefined}
                />
              )}
              <span className="text-slate-600 dark:text-slate-400 font-medium truncate">
                {item.name}
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CHART LEGEND
 * Consistent legend styling with premium polish
 * ────────────────────────────────────────────────────────────────────────────*/

interface LegendItem {
  label: string
  color?: string
  colorClass?: string
  dashed?: boolean
}

interface ChartLegendProps {
  items: LegendItem[]
  className?: string
  position?: "top" | "bottom"
}

export function ChartLegend({ items, className, position = "bottom" }: ChartLegendProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-5 sm:gap-6 flex-wrap",
        position === "top" ? "mb-4" : "mt-4",
        className
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span
            className={cn(
              "w-3.5 h-[3px] rounded-full shrink-0",
              item.dashed && "border border-dashed border-current bg-transparent",
              item.colorClass
            )}
            style={item.color && !item.dashed ? { backgroundColor: item.color } : undefined}
          />
          <span className="font-medium tracking-tight">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CHART EMPTY STATE
 * Display when no data is available with premium styling
 * ────────────────────────────────────────────────────────────────────────────*/

interface ChartEmptyStateProps {
  message?: string
  height?: number
  className?: string
}

export function ChartEmptyState({
  message = "Geen data beschikbaar",
  height = 200,
  className,
}: ChartEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl",
        "bg-slate-50/50 dark:bg-slate-800/30",
        "border border-dashed border-slate-200 dark:border-slate-700/50",
        className
      )}
      style={{ height }}
    >
      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{message}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CHART SKELETON
 * Loading state placeholder with premium animation
 * ────────────────────────────────────────────────────────────────────────────*/

interface ChartSkeletonProps {
  height?: number
  className?: string
}

export function ChartSkeleton({ height = 200, className }: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl",
        "bg-gradient-to-br from-slate-100/80 via-slate-50/60 to-slate-100/80",
        "dark:from-slate-800/40 dark:via-slate-800/30 dark:to-slate-800/40",
        "animate-shimmer",
        className
      )}
      style={{ height }}
    />
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * UTILITY HOOKS
 * ────────────────────────────────────────────────────────────────────────────*/

/** Detect reduced motion preference */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(!!mq.matches)
    onChange()
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])
  return reduced
}

/** Track container width for responsive charts */
export function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0
      setWidth(Math.floor(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return width
}

/** Mounted state for animations */
export function useMounted(delay = 10) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), delay)
    return () => window.clearTimeout(t)
  }, [delay])
  return mounted
}

/* ─────────────────────────────────────────────────────────────────────────────
 * UTILITY FUNCTIONS
 * ────────────────────────────────────────────────────────────────────────────*/

/** Clamp number between min and max */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Calculate nice axis range with padding */
export function niceRange(min: number, max: number, padding = 0.08) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
  if (min === max) return { min: min - 1, max: max + 1 }
  const span = max - min
  const pad = span * padding
  return { min: min - pad, max: max + pad }
}

/** Dutch number formatting */
export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

/** Format value with unit */
export function formatWithUnit(value: number, unit?: string, decimals = 0): string {
  const formatted = formatNumber(value, decimals)
  return unit ? `${formatted} ${unit}` : formatted
}

/** Build smooth Catmull-Rom path through points */
export function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`

  const d: string[] = []
  d.push(`M ${points[0]!.x} ${points[0]!.y}`)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`)
  }
  return d.join(" ")
}

/** Calculate smart label interval to avoid overlap */
export function getLabelInterval(count: number, maxLabels = 8): number {
  if (count <= maxLabels) return 1
  if (count <= maxLabels * 2) return 2
  if (count <= maxLabels * 3) return 3
  return Math.ceil(count / maxLabels)
}
