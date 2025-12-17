"use client";

import * as React from "react";

type Datum = {
    label: string;
    value: number;
    target?: number;
};

type Props = {
    data: Datum[];
    height?: number;
    valueLabel?: string;
    showTarget?: boolean;
    formatValue?: (n: number) => string;
    className?: string;
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setReduced(!!mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

function niceRange(min: number, max: number) {
    if (min === max) return { min: min - 1, max: max + 1 };
    const span = max - min;
    const pad = span * 0.08;
    return { min: min - pad, max: max + pad };
}

function formatDefault(n: number) {
    return new Intl.NumberFormat("nl-NL").format(Math.round(n));
}

export default function SmoothAreaChart({
    data,
    height = 320,
    valueLabel = "",
    showTarget = true,
    formatValue = formatDefault,
    className,
}: Props) {
    const reducedMotion = usePrefersReducedMotion();
    const wrapRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState(0);

    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width ?? 0;
            setWidth(Math.floor(w));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const pad = { l: 44, r: 20, t: 18, b: 28 };
    const w = Math.max(0, width);
    const h = height;
    const innerW = Math.max(0, w - pad.l - pad.r);
    const innerH = Math.max(0, h - pad.t - pad.b);

    const values = data.map((d) => d.value);
    const targets = showTarget
        ? data.map((d) => d.target).filter((x): x is number => typeof x === "number")
        : [];

    const minV = Math.min(...values, ...(targets.length ? targets : [Infinity]));
    const maxV = Math.max(...values, ...(targets.length ? targets : [-Infinity]));
    const { min, max } = niceRange(minV, maxV);

    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

    const xAt = (i: number) => pad.l + i * xStep;
    const yAt = (v: number) => {
        if (max === min) return pad.t + innerH / 2;
        const t = (v - min) / (max - min);
        return pad.t + (1 - t) * innerH;
    };

    // smooth path (Catmull-Rom-ish via cubic beziers)
    const buildSmoothPath = (vals: number[]) => {
        if (!vals.length) return "";
        const pts = vals.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

        const d: string[] = [];
        d.push(`M ${pts[0].x} ${pts[0].y}`);
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] ?? pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] ?? p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
        }
        return d.join(" ");
    };

    const linePath = buildSmoothPath(values);
    const areaPath = (() => {
        if (!values.length) return "";
        const baseY = pad.t + innerH;
        const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
        const top = buildSmoothPath(values);
        const last = pts[pts.length - 1]!;
        const first = pts[0]!;
        return `${top} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
    })();

    const targetPath = (() => {
        if (!showTarget) return "";
        const hasAny = data.some((d) => typeof d.target === "number");
        if (!hasAny) return "";
        const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(typeof d.target === "number" ? d.target : d.value) }));
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        const d: string[] = [];
        d.push(`M ${pts[0].x} ${pts[0].y}`);
        for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i].x} ${pts[i].y}`);
        return d.join(" ");
    })();

    // hover state
    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
    const [mouse, setMouse] = React.useState<{ x: number; y: number } | null>(null);

    const onLeave = () => {
        setHoverIdx(null);
        setMouse(null);
    };

    const onMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
        if (!wrapRef.current) return;
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // only inside plot area
        const insideX = mx >= pad.l && mx <= pad.l + innerW;
        const insideY = my >= pad.t && my <= pad.t + innerH;
        if (!insideX || !insideY) {
            setHoverIdx(null);
            setMouse(null);
            return;
        }

        const raw = (mx - pad.l) / (xStep || 1);
        const idx = clamp(Math.round(raw), 0, Math.max(0, data.length - 1));
        setHoverIdx(idx);
        setMouse({ x: mx, y: my });
    };

    // labels density
    const labelEvery = data.length <= 8 ? 1 : data.length <= 16 ? 2 : data.length <= 28 ? 3 : 4;

    // animation
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        const t = window.setTimeout(() => setMounted(true), 10);
        return () => window.clearTimeout(t);
    }, []);

    // cheap path length estimate (for dash anim); ok for UI polish
    const dash = reducedMotion ? "none" : mounted ? "0" : "900";
    const dashOffset = reducedMotion ? "0" : mounted ? "0" : "900";

    const hoverX = hoverIdx != null ? xAt(hoverIdx) : null;
    const hoverY = hoverIdx != null ? yAt(values[hoverIdx]!) : null;

    const tooltip = (() => {
        if (hoverIdx == null || mouse == null) return null;
        const d = data[hoverIdx];
        const val = formatValue(d.value);
        const tgt = typeof d.target === "number" ? formatValue(d.target) : null;

        // position
        const tipW = 220;
        const tipH = tgt ? 74 : 58;
        const left = clamp(mouse.x + 14, 8, w - tipW - 8);
        const top = clamp(mouse.y - tipH - 10, 8, h - tipH - 8);

        return (
            <foreignObject x={left} y={top} width={tipW} height={tipH} pointerEvents="none">
                <div className="rounded-xl border bg-white/95 shadow-sm backdrop-blur px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900">{d.label}</div>
                        <div className="text-gray-500">{valueLabel}</div>
                    </div>
                    <div className="mt-1 flex items-end justify-between">
                        <div className="text-gray-600">Realisatie</div>
                        <div className="font-semibold text-gray-900">{val}</div>
                    </div>
                    {tgt && (
                        <div className="mt-0.5 flex items-end justify-between">
                            <div className="text-gray-600">Norm</div>
                            <div className="font-medium text-gray-800">{tgt}</div>
                        </div>
                    )}
                </div>
            </foreignObject>
        );
    })();

    return (
        <div ref={wrapRef} className={className}>
            <div className="relative w-full">
                {/* frame */}
                <div className="absolute inset-0 rounded-2xl border bg-white" />
                <div className="relative rounded-2xl">
                    {w === 0 ? (
                        <div className="p-6">
                            <div className="h-[320px] w-full animate-pulse rounded-xl bg-gray-100" />
                        </div>
                    ) : (
                        <svg
                            width={w}
                            height={h}
                            className="block"
                            onMouseMove={onMove}
                            onMouseLeave={onLeave}
                            role="img"
                            aria-label="Trend grafiek"
                        >
                            <defs>
                                <linearGradient id="bk-area" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>

                            {/* grid */}
                            {Array.from({ length: 4 }).map((_, i) => {
                                const y = pad.t + (innerH * i) / 3;
                                return (
                                    <line
                                        key={i}
                                        x1={pad.l}
                                        x2={pad.l + innerW}
                                        y1={y}
                                        y2={y}
                                        stroke="rgba(15, 23, 42, 0.06)"
                                        strokeWidth={1}
                                    />
                                );
                            })}

                            {/* y labels */}
                            {Array.from({ length: 4 }).map((_, i) => {
                                const v = max - ((max - min) * i) / 3;
                                const y = pad.t + (innerH * i) / 3;
                                return (
                                    <text
                                        key={i}
                                        x={pad.l - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        fontSize={11}
                                        fill="rgba(15, 23, 42, 0.55)"
                                    >
                                        {formatValue(v)}
                                    </text>
                                );
                            })}

                            {/* x labels */}
                            {data.map((d, i) => {
                                if (i % labelEvery !== 0 && i !== data.length - 1) return null;
                                const x = xAt(i);
                                return (
                                    <text
                                        key={d.label}
                                        x={x}
                                        y={pad.t + innerH + 18}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fill="rgba(15, 23, 42, 0.55)"
                                    >
                                        {d.label}
                                    </text>
                                );
                            })}

                            {/* area */}
                            <g className="text-emerald-600">
                                <path
                                    d={areaPath}
                                    fill="url(#bk-area)"
                                    style={{
                                        opacity: reducedMotion ? 1 : mounted ? 1 : 0,
                                        transition: reducedMotion ? "none" : "opacity 320ms ease",
                                    }}
                                />
                            </g>

                            {/* target */}
                            {targetPath ? (
                                <path
                                    d={targetPath}
                                    fill="none"
                                    stroke="rgba(15, 23, 42, 0.25)"
                                    strokeWidth={1.5}
                                    strokeDasharray="5 5"
                                />
                            ) : null}

                            {/* line */}
                            <g className="text-emerald-600">
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.25}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        strokeDasharray: dash,
                                        strokeDashoffset: dashOffset,
                                        transition: reducedMotion ? "none" : "stroke-dashoffset 600ms ease",
                                    }}
                                />
                            </g>

                            {/* hover crosshair + dot */}
                            {hoverIdx != null && hoverX != null && hoverY != null ? (
                                <>
                                    <line
                                        x1={hoverX}
                                        x2={hoverX}
                                        y1={pad.t}
                                        y2={pad.t + innerH}
                                        stroke="rgba(15, 23, 42, 0.10)"
                                        strokeWidth={1}
                                    />
                                    {/* small dot - NO giant circle */}
                                    <circle cx={hoverX} cy={hoverY} r={4} fill="white" stroke="rgba(5,150,105,0.9)" strokeWidth={2} />
                                </>
                            ) : null}

                            {/* tooltip */}
                            {tooltip}
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}
