"use client"

/**
 * Premium Charts (UI Components)
 *
 * Lightweight chart components for KPI cards and compact visualizations.
 * Uses the shared chart primitives for consistency.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  CHART_TONES,
  type ChartTone,
  usePrefersReducedMotion,
  useMounted,
  clamp,
  formatNumber,
  getLabelInterval,
  ChartTooltip,
} from "@/components/charts/chart-primitives"

/* ─────────────────────────────────────────────────────────────────────────────
 * SPARKLINE
 * Compact inline chart for KPI cards and tables
 * ────────────────────────────────────────────────────────────────────────────*/

interface SparklineProps {
  data: number[]
  height?: number
  tone?: ChartTone
  /** Direct color override (for dynamic colors based on status) */
  color?: string
  className?: string
}

export function Sparkline({
  data,
  height = 40,
  tone = "emerald",
  color,
  className,
}: SparklineProps) {
  const mounted = useMounted()
  const reducedMotion = usePrefersReducedMotion()
  const gradientId = React.useId().replace(/:/g, "")

  if (!data.length) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100
    const y = 100 - ((d - min) / range) * 100
    return `${x},${y}`
  }).join(" ")

  const toneConfig = CHART_TONES[tone]
  const strokeColor = color || toneConfig.cssColor

  return (
    <div className={cn("relative overflow-visible", className)} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`spark-grad-${gradientId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`M0,100 ${points.split(" ").map(p => "L" + p).join(" ")} L100,100 Z`}
          fill={`url(#spark-grad-${gradientId})`}
          className={cn(
            "transition-opacity",
            reducedMotion ? "duration-0" : "duration-700"
          )}
          style={{ opacity: mounted ? 1 : 0 }}
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={cn(
            "transition-all ease-out",
            reducedMotion ? "duration-0" : "duration-700",
            mounted ? "opacity-100" : "opacity-0"
          )}
          style={{
            strokeDasharray: reducedMotion ? "none" : 200,
            strokeDashoffset: reducedMotion ? 0 : mounted ? 0 : 200,
          }}
        />
      </svg>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * PREMIUM AREA CHART
 * Full-featured area chart with comparison line and hover interactions
 * ────────────────────────────────────────────────────────────────────────────*/

interface PremiumAreaChartProps {
  data: number[]
  labels: string[]
  /** Optional second dataset for comparison (e.g., norm/target) */
  data2?: number[]
  height?: number
  tone?: ChartTone
  tone2?: ChartTone
  /** Direct color override */
  color?: string
  color2?: string
  className?: string
}

export function PremiumAreaChart({
  data,
  labels,
  data2,
  height = 300,
  tone = "emerald",
  tone2 = "slate",
  color,
  color2,
  className,
}: PremiumAreaChartProps) {
  const mounted = useMounted()
  const reducedMotion = usePrefersReducedMotion()
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const gradientId = React.useId().replace(/:/g, "")

  if (!data.length) return null

  // Calculate scales
  const allData = [...data, ...(data2 || [])]
  const max = Math.max(...allData) * 1.1
  const min = 0

  const getPath = (dataset: number[]) => {
    return dataset.map((d, i) => {
      const x = (i / Math.max(1, dataset.length - 1)) * 100
      const y = 100 - ((d - min) / (max - min)) * 100
      return `${x},${y}`
    }).join(" ")
  }

  const path1 = getPath(data)
  const path2 = data2 ? getPath(data2) : null

  const toneConfig = CHART_TONES[tone]
  const tone2Config = CHART_TONES[tone2]
  const primaryColor = color || toneConfig.cssColor
  const secondaryColor = color2 || tone2Config.cssColor
  const labelEvery = getLabelInterval(labels.length)

  return (
    <div
      className={cn("relative w-full select-none group", className)}
      style={{ height }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`area-main-${gradientId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0" y1={y} x2="100" y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            className="text-slate-200 dark:text-slate-700"
          />
        ))}

        {/* Secondary line (comparison/norm) */}
        {path2 && (
          <polyline
            points={path2}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            className="opacity-50"
          />
        )}

        {/* Primary area fill */}
        <path
          d={`M0,100 ${path1.split(" ").map(p => "L" + p).join(" ")} L100,100 Z`}
          fill={`url(#area-main-${gradientId})`}
          className={cn(
            "transition-opacity",
            reducedMotion ? "duration-0" : "duration-700"
          )}
          style={{ opacity: mounted ? 1 : 0 }}
        />

        {/* Primary line */}
        <polyline
          points={path1}
          fill="none"
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={cn(
            "transition-all ease-out drop-shadow-sm",
            reducedMotion ? "duration-0" : "duration-1000"
          )}
          style={{
            strokeDasharray: reducedMotion ? "none" : 1000,
            strokeDashoffset: reducedMotion ? 0 : mounted ? 0 : 1000,
          }}
        />

        {/* Interactive overlay points */}
        {data.map((val, i) => {
          const x = (i / Math.max(1, data.length - 1)) * 100
          const y = 100 - ((val - min) / (max - min)) * 100
          const isActive = hoverIndex === i

          return (
            <g key={i} className="transition-all duration-200">
              {/* Hit area */}
              <rect
                x={x - 3} y="0" width="6" height="100"
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-crosshair"
              />

              {/* Active dot */}
              <circle
                cx={x} cy={y}
                r={isActive ? 6 : 0}
                fill="white"
                stroke={primaryColor}
                strokeWidth="3"
                className="transition-all duration-200 pointer-events-none"
                style={{ opacity: isActive ? 1 : 0 }}
              />

              {/* Vertical hover line */}
              {isActive && (
                <line
                  x1={x} y1="0" x2={x} y2="100"
                  stroke={primaryColor}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="opacity-40 pointer-events-none"
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* HTML Tooltip */}
      {hoverIndex !== null && (
        <div
          className="absolute top-0 z-10 pointer-events-none"
          style={{
            left: `${(hoverIndex / Math.max(1, data.length - 1)) * 100}%`,
            transform: "translate(-50%, -130%)"
          }}
        >
          <ChartTooltip
            label={labels[hoverIndex]}
            items={[
              {
                name: "Waarde",
                value: formatNumber(data[hoverIndex]!),
                colorClass: toneConfig.bg,
              },
              ...(data2 ? [{
                name: "Norm",
                value: formatNumber(data2[hoverIndex]!),
                colorClass: tone2Config.bg,
              }] : [])
            ]}
          />
        </div>
      )}

      {/* X-axis labels */}
      <div className="flex justify-between mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1">
        {labels.filter((_, i) => i % labelEvery === 0 || i === labels.length - 1).map((l, i) => (
          <span key={i} className="truncate">{l}</span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * PREMIUM BAR CHART (SIMPLE)
 * Legacy-compatible bar chart for quick visualizations
 * ────────────────────────────────────────────────────────────────────────────*/

interface PremiumBarChartProps {
  data: number[]
  labels: string[]
  height?: number
  tone?: ChartTone
  /** Direct color override */
  color?: string
  className?: string
}

export function PremiumBarChart({
  data,
  labels,
  height = 200,
  tone = "emerald",
  color,
  className,
}: PremiumBarChartProps) {
  const mounted = useMounted()
  const reducedMotion = usePrefersReducedMotion()

  if (!data.length) return null

  const max = Math.max(...data) * 1.1
  const toneConfig = CHART_TONES[tone]
  const barColor = color || toneConfig.cssColor
  const labelEvery = getLabelInterval(labels.length)

  // Show first, middle, last labels
  const visibleLabels = labels.length <= 5
    ? labels
    : [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]]

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full flex items-end justify-between gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((d, i) => {
          const label = labels[i]

          return (
            <div key={i} className="relative flex-1 h-full flex items-end group">
              <div
                className={cn(
                  "w-full rounded-t-md transition-all ease-out",
                  "group-hover:opacity-100",
                  reducedMotion ? "opacity-80" : "animate-bar-grow opacity-0"
                )}
                style={{
                  height: mounted ? `${clamp((d / max) * 100, 2, 100)}%` : '0%',
                  backgroundColor: barColor,
                  animationDelay: reducedMotion ? "0ms" : `${i * 40}ms`,
                  transition: reducedMotion ? "none" : "height 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Hover tooltip */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[130%] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                  <ChartTooltip 
                    label={label} 
                    items={[{ name: "Waarde", value: formatNumber(d), color: barColor }]} 
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      {labels.length > 0 && (
        <div className="flex justify-between mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
          {visibleLabels.map((l, i) => (
            <span key={i} className="truncate">{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}
