"use client";

import * as React from "react";

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
    const [width, setWidth] = React.useState(0);
    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            setWidth(entries[0]?.contentRect?.width ?? 0);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const pad = { t: 20, b: 20, l: 0, r: 0 };
    const w = width > 0 ? width : 300; // default/fallback
    const h = height;
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const vals = data.map(d => d.value);
    const norms = data.map(d => d.norm || 0);
    const all = [...vals, ...norms];
    const min = Math.min(...all) * 0.9;
    const max = Math.max(...all) * 1.05;

    const x = (i: number) => pad.l + (i / (data.length - 1)) * innerW;
    const y = (v: number) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

    // Path Gen
    const linePath = (() => {
        if (!data.length) return "";
        return "M " + data.map((d, i) => `${x(i)} ${y(d.value)}`).join(" L ");
    })();

    const areaPath = (() => {
        if (!data.length) return "";
        return `${linePath} L ${w} ${h} L 0 ${h} Z`;
    })();

    // Interaction
    const onMove = (e: React.MouseEvent) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        // find nearest index
        const relX = Math.max(0, Math.min(1, (mx - pad.l) / innerW));
        const idx = Math.round(relX * (data.length - 1));
        setHoverIdx(idx);
    };

    const onLeave = () => setHoverIdx(null);

    const hoverData = hoverIdx !== null ? data[hoverIdx] : null;

    return (
        <div ref={wrapRef} className={className} onMouseMove={onMove} onMouseLeave={onLeave}>
            <svg width="100%" height={height} className="overflow-visible">
                <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Grid lines (subtle) */}
                {[0, 0.5, 1].map(t => (
                    <line
                        key={t}
                        x1={0} x2={w}
                        y1={pad.t + t * innerH} y2={pad.t + t * innerH}
                        stroke="currentColor" strokeOpacity="0.05"
                    />
                ))}

                {/* Area */}
                <path
                    d={areaPath}
                    fill="url(#heroGradient)"
                    className="text-emerald-500 transition-opacity duration-700"
                    style={{ opacity: mounted ? 1 : 0 }}
                />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-emerald-600"
                    strokeLinecap="round"
                    strokeDasharray={1000}
                    strokeDashoffset={mounted ? 0 : 1000}
                    style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                />

                {/* Hover State */}
                {hoverData && hoverIdx !== null && (
                    <g>
                        <line
                            x1={x(hoverIdx)} x2={x(hoverIdx)}
                            y1={pad.t} y2={h}
                            stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4"
                            className="text-slate-400"
                        />
                        <circle
                            cx={x(hoverIdx)} cy={y(hoverData.value)} r={4}
                            fill="white" stroke="currentColor" strokeWidth={2} className="text-emerald-600"
                        />
                    </g>
                )}
            </svg>

            {/* External Tooltip (Card) */}
            {hoverData && hoverIdx !== null && (
                <div
                    className="absolute z-20 top-0 left-0 pointer-events-none transform -translate-y-full mb-2 bg-white rounded-lg shadow-lg border border-slate-100 p-2 text-xs w-32"
                    style={{
                        left: Math.min(w - 130, Math.max(0, x(hoverIdx) - 64)),
                        top: y(hoverData.value) - 10
                    }}
                >
                    <div className="font-bold text-slate-900 mb-1">{hoverData.label}</div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Realisatie</span>
                        <span>{hoverData.value}</span>
                    </div>
                    {hoverData.norm && (
                        <div className="flex justify-between text-slate-400">
                            <span>Norm</span>
                            <span>{hoverData.norm}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
