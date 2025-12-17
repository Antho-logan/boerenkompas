"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// --- Helper Hook for Animation ---
function useMounted() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        const t = window.setTimeout(() => setMounted(true), 0)
        return () => window.clearTimeout(t)
    }, [])
    return mounted
}

// --- Sparkline ---
export function Sparkline({ data, color = "#10b981", height = 40 }: { data: number[], color?: string, height?: number }) {
    const mounted = useMounted()
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((d - min) / range) * 100
        return `${x},${y}`
    }).join(" ")

    return (
        <div className="relative overflow-visible" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Fill Area with Gradient */}
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M0,100 ${points.split(" ").map(p => "L" + p).join(" ")} L100,100 Z`}
                    fill={`url(#grad-${color})`}
                    className="transition-opacity duration-1000"
                    style={{ opacity: mounted ? 1 : 0 }}
                />
                {/* Line with Drawing Animation */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className={cn("transition-all duration-1000 ease-out", mounted ? "opacity-100" : "opacity-0")}
                    style={{
                        strokeDasharray: 200, // Roughly enough for sparkline
                        strokeDashoffset: mounted ? 0 : 200
                    }}
                />
            </svg>
        </div>
    )
}

// --- Premium Area Chart ---
export function PremiumAreaChart({
    data,
    labels,
    data2, // Optional second line (comparison)
    height = 300,
    color = "#10b981",
    color2 = "#94a3b8"
}: {
    data: number[],
    labels: string[],
    data2?: number[],
    height?: number,
    color?: string,
    color2?: string
}) {
    const mounted = useMounted()
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    // Calc scales
    const allData = [...data, ...(data2 || [])]
    const max = Math.max(...allData) * 1.1
    const min = 0

    const getPath = (dataset: number[]) => {
        return dataset.map((d, i) => {
            const x = (i / (dataset.length - 1)) * 100
            const y = 100 - ((d - min) / (max - min)) * 100
            return `${x},${y}`
        }).join(" ")
    }

    const path1 = getPath(data)
    const path2 = data2 ? getPath(data2) : null

    return (
        <div className="relative w-full select-none group" style={{ height }} onMouseLeave={() => setHoverIndex(null)}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="mainGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                ))}

                {/* Secondary Line (e.g. Norm) */}
                {path2 && (
                    <polyline
                        points={path2}
                        fill="none"
                        stroke={color2}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                        className="opacity-50"
                    />
                )}

                {/* Primary Area */}
                <path
                    d={`M0,100 ${path1.split(" ").map(p => "L" + p).join(" ")} L100,100 Z`}
                    fill="url(#mainGradient)"
                    className="transition-opacity duration-1000"
                    style={{ opacity: mounted ? 1 : 0 }}
                />

                {/* Primary Line */}
                <polyline
                    points={path1}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className={cn("transition-all duration-[1500ms] ease-out drop-shadow-sm")}
                    style={{
                        strokeDasharray: 1000,
                        strokeDashoffset: mounted ? 0 : 1000
                    }}
                />

                {/* Interactive Overlay Points */}
                {data.map((val, i) => {
                    const x = (i / (data.length - 1)) * 100
                    const y = 100 - ((val - min) / (max - min)) * 100
                    const isActive = hoverIndex === i

                    return (
                        <g key={i} className="transition-all duration-300">
                            {/* Invisible Hit Area */}
                            <rect
                                x={x - 2} y="0" width="4" height="100" fill="transparent"
                                onMouseEnter={() => setHoverIndex(i)}
                                className="cursor-crosshair"
                            />

                            {/* Active State Dot */}
                            <circle
                                cx={x} cy={y} r={isActive ? 6 : 0}
                                fill="white" stroke={color} strokeWidth="3"
                                className="transition-all duration-200 pointer-events-none"
                                style={{ opacity: isActive ? 1 : 0 }}
                            />

                            {/* Vertical Line on Hover */}
                            {isActive && (
                                <line
                                    x1={x} y1="0" x2={x} y2="100"
                                    stroke={color} strokeWidth="1" strokeDasharray="4 4"
                                    className="opacity-50 pointer-events-none"
                                />
                            )}
                        </g>
                    )
                })}
            </svg>

            {/* Tooltip HTML Overlay */}
            {hoverIndex !== null && (
                <div
                    className="absolute top-0 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-xl pointer-events-none z-10 transition-all flex flex-col gap-0.5 animate-scale-in"
                    style={{
                        left: `${(hoverIndex / (data.length - 1)) * 100}%`,
                        transform: `translate(-50%, -120%)`
                    }}
                >
                    <span className="font-bold text-emerald-400">{data[hoverIndex]} units</span>
                    <span className="text-slate-400 text-[10px]">{labels[hoverIndex]}</span>
                </div>
            )}

            {/* Axis Labels */}
            <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-medium px-1">
                {labels.filter((_, i) => i % 2 === 0).map((l, i) => (
                    <span key={i}>{l}</span>
                ))}
            </div>
        </div>
    )
}

// --- Premium Bar Chart ---
export function PremiumBarChart({ data, labels, height = 200, color = "#10b981" }: { data: number[], labels: string[], height?: number, color?: string }) {
    const mounted = useMounted()
    const max = Math.max(...data) * 1.1
    const axisLabels = labels.length === data.length ? labels : []
    const midLabel = axisLabels.length ? axisLabels[Math.floor(axisLabels.length / 2)] : undefined

    return (
        <div className="w-full">
            <div className="w-full flex items-end justify-between gap-2" style={{ height }}>
                {data.map((d, i) => {
                    const label = axisLabels[i]

                    return (
                        <div key={i} className="relative flex-1 h-full flex items-end group">
                            <div
                                className="w-full rounded-t-sm transition-all duration-1000 ease-out group-hover:opacity-80 relative"
                                style={{
                                    height: mounted ? `${(d / max) * 100}%` : '0%',
                                    backgroundColor: color,
                                    transitionDelay: `${i * 50}ms`
                                }}
                            >
                                {/* Tooltip */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[120%] bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {label ? `${label}: ${d}` : d}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {axisLabels.length > 0 && (
                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium px-0.5">
                    <span>{axisLabels[0]}</span>
                    <span>{midLabel}</span>
                    <span>{axisLabels[axisLabels.length - 1]}</span>
                </div>
            )}
        </div>
    )
}
