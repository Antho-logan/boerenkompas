"use client"

/**
 * PremiumBarsChart
 *
 * A polished bar chart with animated bars, consistent styling,
 * and accessible interactions.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  CHART_CONFIG,
  CHART_TONES,
  type ChartTone,
  usePrefersReducedMotion,
  clamp,
  formatNumber,
  getLabelInterval,
  ChartEmptyState,
  ChartSkeleton,
  ChartTooltip,
} from "./chart-primitives"

export type BarDatum = {
  label: string
  value: number
}

type Props = {
  data: BarDatum[]
  height?: number
  valueLabel?: string
  unit?: string
  formatValue?: (n: number) => string
  ariaLabel?: string
  className?: string
  tone?: ChartTone
  /** Show loading skeleton */
  loading?: boolean
}

export function PremiumBarsChart({
  data,
  height = CHART_CONFIG.height.sm,
  valueLabel = "",
  unit = "",
  formatValue = (n) => formatNumber(Math.round(n)),
  ariaLabel = "Staafgrafiek",
  className,
  tone = "emerald",
  loading = false,
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)

  // Handle empty/loading states
  if (loading) {
    return (
      <div className={cn("relative w-full", className)}>
        <ChartSkeleton height={height + 32} />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={cn("relative w-full", className)}>
        <ChartEmptyState height={height} />
      </div>
    )
  }

  const max = Math.max(1, ...data.map((d) => d.value)) * 1.05
  const labelEvery = getLabelInterval(data.length)
  const tooltipLeft = hoverIdx == null ? 0 : ((hoverIdx + 0.5) / data.length) * 100
  const toneConfig = CHART_TONES[tone]

  return (
    <div
      className={cn("relative select-none overflow-visible", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Bottom axis line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-700" />

      {/* Bars container */}
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }} role="list">
        {data.map((d, i) => {
          const heightPct = clamp((d.value / max) * 100, 2, 100)
          const active = hoverIdx === i

          return (
            <div
              key={`${d.label}-${i}`}
              className={cn(
                "relative flex-1 h-full group outline-none rounded-md",
                "focus-visible:ring-2 focus-visible:ring-offset-2",
                tone === "emerald" && "focus-visible:ring-emerald-500/30",
                tone === "blue" && "focus-visible:ring-blue-500/30",
                tone === "amber" && "focus-visible:ring-amber-500/30",
                tone === "violet" && "focus-visible:ring-violet-500/30",
                tone === "slate" && "focus-visible:ring-slate-500/30"
              )}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
              tabIndex={0}
              role="listitem"
              aria-label={`${d.label}: ${formatValue(d.value)}${unit ? ` ${unit}` : ""}`}
            >
              <div
                className={cn(
                  "w-full rounded-lg ring-1 ring-white/10 shadow-sm",
                  "transition-all duration-200 ease-out origin-bottom",
                  reducedMotion ? "" : "animate-bar-grow",
                  toneConfig.bgGradient,
                  active ? "opacity-100 scale-[1.02]" : "opacity-75 group-hover:opacity-100"
                )}
                style={{
                  height: `${heightPct}%`,
                  animationDelay: reducedMotion ? "0ms" : `${i * 50}ms`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {hoverIdx != null && data[hoverIdx] && (
        <div
          className="pointer-events-none absolute top-0 z-10"
          style={{ left: `${tooltipLeft}%`, transform: "translate(-50%, -130%)" }}
        >
          <ChartTooltip
            label={data[hoverIdx]!.label}
            items={[
              {
                name: valueLabel || "Waarde",
                value: `${formatValue(data[hoverIdx]!.value)}${unit ? ` ${unit}` : ""}`,
                colorClass: toneConfig.bg,
              },
            ]}
          />
        </div>
      )}

      {/* X-axis labels */}
      <div className="mt-3 flex justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null
          return (
            <span
              key={`${d.label}-label-${i}`}
              className="truncate max-w-[60px] sm:max-w-none"
            >
              {d.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default PremiumBarsChart
