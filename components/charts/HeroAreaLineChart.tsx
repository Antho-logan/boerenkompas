"use client";

import * as React from "react";
import { 
    CHART_COLORS, 
    CHART_CONFIG, 
    useMounted, 
    useContainerWidth, 
    buildSmoothPath, 
    clamp,
    ChartTooltip
} from "./chart-primitives";
import { cn } from "@/lib/utils";

type Datum = {
    label: string;
    value: number;
    norm?: number;
};

type Props = {
    data: Datum[];
    height?: number;
    className?: string;
};

export default function HeroAreaLineChart({
    data,
    height = 180,
    className,
}: Props) {
    const wrapRef = React.useRef<HTMLDivElement | null>(null);
    const width = useContainerWidth(wrapRef);
    const mounted = useMounted();
    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
    const [mouse, setMouse] = React.useState<{ x: number; y: number } | null>(null);

    const pad = { t: 20, b: 20, l: 0, r: 0 };
    const w = Math.max(width, 300);
    const h = height;
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const values = data.map(d => d.value);
    const norms = data.map(d => d.norm || 0);
    const allValues = [...values, ...norms];
    const minV = Math.min(...allValues) * 0.95;
    const maxV = Math.max(...allValues) * 1.05;

    const xAt = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * innerW;
    const yAt = (v: number) => pad.t + innerH - ((v - minV) / (maxV - minV)) * innerH;

    const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
    const linePath = buildSmoothPath(points);
    const areaPath = (() => {
        if (!points.length) return "";
        const last = points[points.length - 1];
        const first = points[0];
        return `${linePath} L ${last.x} ${h} L ${first.x} ${h} Z`;
    })();

    const onMove: React.MouseEventHandler = (e) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const relX = clamp((mx - pad.l) / innerW, 0, 1);
        const idx = Math.round(relX * (data.length - 1));
        
        setHoverIdx(idx);
        setMouse({ x: mx, y: my });
    };

    const hoverData = hoverIdx !== null ? data[hoverIdx] : null;
    const hoverX = hoverIdx !== null ? xAt(hoverIdx) : null;
    const hoverY = (hoverData && hoverIdx !== null) ? yAt(hoverData.value) : null;

    const tooltip = (() => {
        if (hoverIdx === null || !hoverData || !mouse) return null;
        const tipW = 180;
        const tipH = hoverData.norm ? 90 : 60;
        const left = clamp(mouse.x + 15, 10, w - tipW - 10);
        const top = clamp(mouse.y - tipH - 15, 10, h - tipH - 10);

        const items = [
            { name: "Realisatie", value: hoverData.value, colorClass: "bg-emerald-500" }
        ];
        if (hoverData.norm) {
            items.push({ name: "Norm", value: hoverData.norm, colorClass: "bg-slate-300" });
        }

        return (
            <foreignObject x={left} y={top} width={tipW} height={tipH} className="overflow-visible pointer-events-none">
                <ChartTooltip label={hoverData.label} items={items} />
            </foreignObject>
        );
    })();

    return (
        <div ref={wrapRef} className={cn("relative", className)} onMouseMove={onMove} onMouseLeave={() => { setHoverIdx(null); setMouse(null); }}>
            <svg width="100%" height={height} className="overflow-visible select-none">
                <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.5, 1].map(t => (
                    <line
                        key={t}
                        x1={0} x2={w}
                        y1={pad.t + t * innerH} y2={pad.t + t * innerH}
                        stroke={CHART_COLORS.grid}
                        strokeOpacity={0.1}
                    />
                ))}

                {/* Area */}
                <path
                    d={areaPath}
                    fill="url(#heroGradient)"
                    className="transition-opacity duration-1000"
                    style={{ opacity: mounted ? 1 : 0 }}
                />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="rgb(5, 150, 105)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ 
                        strokeDasharray: 1000, 
                        strokeDashoffset: mounted ? 0 : 1000,
                        transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                />

                {/* Hover state */}
                {hoverX !== null && hoverY !== null && (
                    <g>
                        <line
                            x1={hoverX} x2={hoverX}
                            y1={pad.t} y2={h}
                            stroke={CHART_COLORS.grid}
                            strokeWidth={1}
                        />
                        <circle
                            cx={hoverX} cy={hoverY} r={5}
                            fill="white" stroke="rgb(5, 150, 105)" strokeWidth={2.5}
                            className="shadow-sm"
                        />
                    </g>
                )}

                {tooltip}
            </svg>
        </div>
    );
}
