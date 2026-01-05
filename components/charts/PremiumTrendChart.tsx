"use client"

/**
 * PremiumTrendChart
 *
 * A polished area/line chart for trend visualization.
 * Features smooth Catmull-Rom curves, optional target line,
 * responsive sizing, and accessible interactions.
 * Premium Apple/OpenAI-level polish.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  CHART_CONFIG,
  CHART_COLORS,
  CHART_TONES,
  type ChartTone,
  usePrefersReducedMotion,
  useContainerWidth,
  useMounted,
  clamp,
  niceRange,
  formatNumber,
  buildSmoothPath,
  getLabelInterval,
  ChartSkeleton,
  ChartTooltip,
} from "./chart-primitives"

export type TrendDatum = {
  label: string
  value: number
  target?: number
}

type Props = {
  data: TrendDatum[]
  height?: number
  unit?: string
  showTarget?: boolean
  formatValue?: (n: number) => string
  ariaLabel?: string
  className?: string
  tone?: ChartTone
  /** Show loading skeleton */
  loading?: boolean
  /** Show current value callout on the right */
  showCurrentValue?: boolean
}

export function PremiumTrendChart({
  data,
  height = CHART_CONFIG.height.lg,
  unit = "",
  showTarget = true,
  formatValue = (n) => formatNumber(Math.round(n)),
  ariaLabel = "Trend grafiek",
  className,
  tone = "emerald",
  loading = false,
  showCurrentValue = false,
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const width = useContainerWidth(wrapRef)
  const mounted = useMounted(50) // Slight delay to ensure path is ready
  const gradientId = React.useId().replace(/:/g, "")
  
  // Deferred data mount to satisfy "draw in" effect request
  const [displayData, setDisplayData] = React.useState<TrendDatum[]>([])
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const [mouse, setMouse] = React.useState<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    if (reducedMotion) {
      setDisplayData(data)
      return
    }

    // Set to empty first
    setDisplayData([])

    // Then set to real data in next frame to trigger path updates
    const raf = requestAnimationFrame(() => {
      setDisplayData(data)
    })
    return () => cancelAnimationFrame(raf)
  }, [data, reducedMotion])

  const pad = CHART_CONFIG.padding
  const w = Math.max(0, width)
  const h = height
  const innerW = Math.max(0, w - pad.l - pad.r)
  const innerH = Math.max(0, h - pad.t - pad.b)

  // Handle empty/loading states
  if (loading) {
    return (
      <div ref={wrapRef} className={cn("relative w-full", className)}>
        <ChartSkeleton height={height} />
      </div>
    )
  }

  // Use original data for scales to keep axes stable
  const values = data.map((d) => d.value)
  const targets = showTarget
    ? data.map((d) => d.target).filter((x): x is number => typeof x === "number")
    : []

  const minV = Math.min(...values, ...(targets.length ? targets : [Infinity]))
  const maxV = Math.max(...values, ...(targets.length ? targets : [-Infinity]))
  const { min, max } = niceRange(minV, maxV)

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0
  const xAt = (i: number) => pad.l + i * xStep
  const yAt = (v: number) => {
    if (max === min) return pad.t + innerH / 2
    const t = (v - min) / (max - min)
    return pad.t + (1 - t) * innerH
  }

  // Use displayData for rendering
  const displayValues = displayData.map((d) => d.value)
  const points = displayValues.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const linePath = buildSmoothPath(points)
  const areaPath = (() => {
    if (points.length === 0) return ""
    const baseY = pad.t + innerH
    const last = points[points.length - 1]!
    const first = points[0]!
    return `${buildSmoothPath(points)} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
  })()

  const targetPath = (() => {
    if (!showTarget || displayData.length === 0) return ""
    const hasAny = displayData.some((d) => typeof d.target === "number")
    if (!hasAny) return ""
    const tPoints = displayData.map((d, i) => ({
      x: xAt(i),
      y: yAt(typeof d.target === "number" ? d.target : d.value),
    }))
    if (tPoints.length === 1) return `M ${tPoints[0]!.x} ${tPoints[0]!.y}`
    return `M ${tPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`
  })()

  const labelEvery = getLabelInterval(data.length)

  const onLeave = () => {
    setHoverIdx(null)
    setMouse(null)
  }

  const onMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const insideX = mx >= pad.l && mx <= pad.l + innerW
    const insideY = my >= pad.t && my <= pad.t + innerH
    if (!insideX || !insideY || displayData.length === 0) {
      setHoverIdx(null)
      setMouse(null)
      return
    }

    const raw = (mx - pad.l) / (xStep || 1)
    const idx = clamp(Math.round(raw), 0, Math.max(0, displayData.length - 1))
    setHoverIdx(idx)
    setMouse({ x: mx, y: my })
  }

  const dashArray = reducedMotion ? "none" : "1000 1000"
  const dashOffset = reducedMotion ? "0" : (mounted && displayData.length > 0) ? "0" : "1000"

  const hoverX = hoverIdx != null ? xAt(hoverIdx) : null
  const hoverY = hoverIdx != null ? yAt(displayValues[hoverIdx]!) : null

  const toneConfig = CHART_TONES[tone]

  // Current value callout
  const currentValue = data.length > 0 ? data[data.length - 1]!.value : null
  const currentTarget = data.length > 0 ? data[data.length - 1]!.target : null

  // Tooltip rendering
  const tooltip = (() => {
    if (hoverIdx == null || mouse == null || displayData.length === 0) return null
    const d = displayData[hoverIdx]!
    
    const tipW = 200
    const tipH = d.target ? 100 : 70
    const left = clamp(mouse.x + 20, 10, w - tipW - 10)
    const top = clamp(mouse.y - tipH - 20, 10, h - tipH - 10)

    const tooltipItems: Array<{
      name: string
      value: string
      colorClass?: string
      color?: string
    }> = [
      {
        name: "Realisatie",
        value: `${formatValue(d.value)}${unit ? ` ${unit}` : ""}`,
        colorClass: toneConfig.bg,
      },
    ]

    if (typeof d.target === "number") {
      tooltipItems.push({
        name: "Norm",
        value: `${formatValue(d.target)}${unit ? ` ${unit}` : ""}`,
        colorClass: "bg-slate-300 dark:bg-slate-600",
      })
    }

    return (
      <foreignObject x={left} y={top} width={tipW} height={tipH} pointerEvents="none" className="overflow-visible">
        <ChartTooltip label={d.label} items={tooltipItems} />
      </foreignObject>
    )
  })()

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      {w === 0 ? (
        <ChartSkeleton height={height} />
      ) : (
        <svg
          width={w}
          height={h}
          className="block select-none"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={`bk-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={toneConfig.cssColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={toneConfig.cssColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines - premium subtle styling */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = pad.t + (innerH * i) / 3
            return (
              <line
                key={i}
                x1={pad.l}
                x2={pad.l + innerW}
                y1={y}
                y2={y}
                stroke={CHART_COLORS.grid}
                strokeWidth={1}
                className="dark:stroke-slate-800/50"
              />
            )
          })}

          {/* Y-axis labels - refined typography */}
          {Array.from({ length: 4 }).map((_, i) => {
            const v = max - ((max - min) * i) / 3
            const y = pad.t + (innerH * i) / 3
            return (
              <text
                key={i}
                x={pad.l - 12}
                y={y + 3.5}
                textAnchor="end"
                fontSize={CHART_CONFIG.fontSize.tick}
                className="fill-slate-400 dark:fill-slate-500 font-medium tabular-nums"
              >
                {formatValue(v)}
              </text>
            )
          })}

          {/* X-axis labels - refined typography */}
          {data.map((d, i) => {
            if (i % labelEvery !== 0 && i !== data.length - 1) return null
            const x = xAt(i)
            return (
              <text
                key={`${d.label}-${i}`}
                x={x}
                y={pad.t + innerH + 20}
                textAnchor="middle"
                fontSize={CHART_CONFIG.fontSize.tick}
                className="fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {d.label}
              </text>
            )
          })}

          {/* Area fill - premium gradient */}
          <path
            d={areaPath}
            fill={`url(#bk-area-${gradientId})`}
            style={{
              opacity: reducedMotion ? 1 : (mounted && displayData.length > 0) ? 1 : 0,
              transition: reducedMotion ? "none" : `opacity ${CHART_CONFIG.animation.area}ms ease-out`,
            }}
          />

          {/* Target/norm line - refined dashed line */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              stroke={CHART_COLORS.muted}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          )}

          {/* Main data line - premium stroke with rounded caps */}
          <path
            d={linePath}
            fill="none"
            stroke={toneConfig.cssColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: dashArray,
              strokeDashoffset: dashOffset,
              transition: reducedMotion ? "none" : "stroke-dashoffset 3000ms ease-out 200ms",
            }}
          />

          {/* Current value callout on the right */}
          {showCurrentValue && currentValue !== null && mounted && displayData.length > 0 && (
            <g>
              {/* Value text */}
              <text
                x={w - 8}
                y={pad.t + innerH / 2}
                textAnchor="end"
                fontSize={14}
                fontWeight="bold"
                className="fill-slate-900 dark:fill-slate-100 tabular-nums"
                style={{
                  opacity: reducedMotion ? 1 : 0,
                  transition: reducedMotion ? "none" : "opacity 400ms ease-out 800ms",
                }}
              >
                {formatValue(currentValue)}{unit ? ` ${unit}` : ""}
              </text>
              {/* Optional target value below */}
              {currentTarget !== undefined && currentTarget !== null && (
                <text
                  x={w - 8}
                  y={pad.t + innerH / 2 + 14}
                  textAnchor="end"
                  fontSize={10}
                  className="fill-slate-400 dark:fill-slate-500 font-medium tabular-nums"
                  style={{
                    opacity: reducedMotion ? 1 : 0,
                    transition: reducedMotion ? "none" : "opacity 400ms ease-out 900ms",
                  }}
                >
                  Norm: {formatValue(currentTarget)}{unit ? ` ${unit}` : ""}
                </text>
              )}
            </g>
          )}

          {/* Hover crosshair and dot - premium styling */}
          {hoverIdx != null && hoverX != null && hoverY != null && displayData.length > 0 && (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={pad.t}
                y2={pad.t + innerH}
                stroke={CHART_COLORS.grid}
                strokeWidth={1}
                className="opacity-60"
              />
              <circle
                cx={hoverX}
                cy={hoverY}
                r={5.5}
                fill="white"
                stroke={toneConfig.cssColor}
                strokeWidth={2.5}
                className="drop-shadow-sm"
              />
              {/* Inner dot for extra polish */}
              <circle
                cx={hoverX}
                cy={hoverY}
                r={2.5}
                fill={toneConfig.cssColor}
              />
            </>
          )}

          {/* Tooltip */}
          {tooltip}
        </svg>
      )}
    </div>
  )
}

export default PremiumTrendChart
