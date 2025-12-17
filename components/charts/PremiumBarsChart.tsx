"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type BarDatum = {
  label: string
  value: number
}

type Tone = "emerald" | "amber" | "slate"

type Props = {
  data: BarDatum[]
  height?: number
  valueLabel?: string
  formatValue?: (n: number) => string
  ariaLabel?: string
  className?: string
  tone?: Tone
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function formatDefault(n: number) {
  return new Intl.NumberFormat("nl-NL").format(Math.round(n))
}

function usePrefersReducedMotion() {
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

const TONE = {
  emerald:
    "bg-gradient-to-t from-emerald-700 to-emerald-500 shadow-emerald-900/10 ring-emerald-500/20",
  amber:
    "bg-gradient-to-t from-amber-700 to-amber-500 shadow-amber-900/10 ring-amber-500/20",
  slate:
    "bg-gradient-to-t from-slate-900 to-slate-700 shadow-slate-900/10 ring-slate-500/20",
} satisfies Record<Tone, string>

export function PremiumBarsChart({
  data,
  height = 160,
  valueLabel = "",
  formatValue = formatDefault,
  ariaLabel = "Staafgrafiek",
  className,
  tone = "emerald",
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.05
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)

  const labelEvery = data.length <= 8 ? 1 : data.length <= 12 ? 2 : 3
  const tooltipLeft = hoverIdx == null ? 0 : ((hoverIdx + 0.5) / data.length) * 100

  return (
    <div
      className={cn("relative select-none overflow-visible", className)}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200/80" />

      <div className="flex items-end gap-2" style={{ height }} role="list">
        {data.map((d, i) => {
          const heightPct = clamp((d.value / max) * 100, 2, 100)
          const active = hoverIdx === i

          return (
            <div
              key={`${d.label}-${i}`}
              className="relative flex-1 h-full group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 rounded-md"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
              tabIndex={0}
              role="listitem"
              aria-label={`${d.label}: ${formatValue(d.value)} ${valueLabel}`}
            >
              <div
                className={cn(
                  "w-full rounded-lg ring-1 transition-all duration-200 ease-out origin-bottom",
                  reducedMotion ? "" : "animate-bar-grow",
                  TONE[tone],
                  active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                )}
                style={{
                  height: `${heightPct}%`,
                  animationDelay: reducedMotion ? "0ms" : `${i * 60}ms`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {hoverIdx != null && data[hoverIdx] ? (
        <div
          className="pointer-events-none absolute top-0 z-10"
          style={{ left: `${tooltipLeft}%`, transform: "translate(-50%, -120%)" }}
        >
          <div className="rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur px-3 py-2 text-xs min-w-[180px]">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-slate-900">{data[hoverIdx]!.label}</div>
              <div className="text-slate-500">{valueLabel}</div>
            </div>
            <div className="mt-1 flex items-end justify-between">
              <div className="text-slate-600">Waarde</div>
              <div className="font-semibold text-slate-900">{formatValue(data[hoverIdx]!.value)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* X axis labels */}
      <div className="mt-3 flex justify-between text-[10px] text-slate-400 font-medium px-1">
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null
          return <span key={`${d.label}-label-${i}`}>{d.label}</span>
        })}
      </div>
    </div>
  )
}
