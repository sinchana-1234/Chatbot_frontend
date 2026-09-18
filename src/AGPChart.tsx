import React, { useState } from "react";
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceDot,
} from "recharts";

interface TimeBlock {
    time_of_day: string;
    percentiles: {
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
    };
}

interface AGPChartProps {
    timeBlocks: TimeBlock[];
}

const PINK = "#F8B4C0";
const ORANGE = "#F5A623";
const GREEN = "#6B8E23";

const Y_MIN = 0;
const Y_MAX = 300;
const CHART_HEIGHT = 280;
const CHART_TOP_MARGIN = 5;
const CHART_BOTTOM_MARGIN = 5;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_TOP_MARGIN - CHART_BOTTOM_MARGIN - 25; // approx axis space

const SERIES = [
    { key: "p90", label: "p90 (upper band)", color: PINK },
    { key: "p75", label: "p75 (upper inner band)", color: ORANGE },
    { key: "p50", label: "p50 (median)", color: GREEN },
    { key: "p25", label: "p25 (lower inner band)", color: ORANGE },
    { key: "p10", label: "p10 (lower band)", color: PINK },
];

const CustomTooltip = ({ active, payload, label, coordinate, onMatch }: any) => {
    if (!active || !payload || !payload.length || !coordinate) {
        if (onMatch) onMatch(null);
        return null;
    }
    const p = payload[0]?.payload;
    if (!p) return null;

    // Convert cursor pixel Y back to a data value using the fixed Y domain,
    // then find whichever series (p10/p25/p50/p75/p90) is numerically closest.
    const yFraction = (coordinate.y - CHART_TOP_MARGIN) / PLOT_HEIGHT;
    const cursorValue = Y_MAX - yFraction * (Y_MAX - Y_MIN);

    let closestKey = "p50";
    let closestDist = Infinity;
    for (const s of SERIES) {
        const dist = Math.abs(p[s.key] - cursorValue);
        if (dist < closestDist) {
            closestDist = dist;
            closestKey = s.key;
        }
    }
    const matched = SERIES.find((s) => s.key === closestKey)!;

    if (onMatch) {
        onMatch((prev: any) => {
            if (prev && prev.time === label && prev.key === closestKey) {
                return prev; // unchanged — return the same reference, no re-render
            }
            return { time: label, key: closestKey, value: p[closestKey], color: matched.color };
        });
    }

    return (
        <div className="bg-gray-900 text-white rounded-md shadow-md px-3 py-2 text-xs">
            <div className="font-bold mb-1">{label}</div>
            <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3" style={{ backgroundColor: matched.color }} />
                {matched.label}: {p[closestKey]}
            </div>
        </div>
    );
};

const AGPChart: React.FC<AGPChartProps> = ({ timeBlocks }) => {
    const [hidden, setHidden] = useState<Record<string, boolean>>({});
    const [hoverPoint, setHoverPoint] = useState<{ time: string; key: string; value: number; color: string } | null>(null);

    if (!timeBlocks || timeBlocks.length === 0) return null;

    const data = timeBlocks.map((block) => ({
        time: block.time_of_day,
        p10: block.percentiles.p10,
        p25: block.percentiles.p25,
        p50: block.percentiles.p50,
        p75: block.percentiles.p75,
        p90: block.percentiles.p90,
        band90: block.percentiles.p90 - block.percentiles.p10,
        band75: block.percentiles.p75 - block.percentiles.p25,
    }));

    const toggle = (key: string) => {
        setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Toggling p90 or p10 hides the outer band; toggling p75/p25 hides inner band.
    const outerHidden = hidden.p90 || hidden.p10;
    const innerHidden = hidden.p75 || hidden.p25;
    const medianHidden = hidden.p50;

    return (
        <div className="mt-3 bg-white rounded-lg border border-gray-300 p-3">
            <div className="text-center mb-2">
                <div className="font-bold text-green-700">Ambulatory Glucose Profile (AGP)</div>
                <div className="text-xs text-gray-500 mt-0.5">Median and glucose variability bands</div>
            </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 justify-items-start mb-3 px-2 max-w-xs mx-auto">
                <span
                    onClick={() => toggle("p10")}
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ${outerHidden ? "line-through opacity-50" : ""}`}
                >
                    <span className="inline-block w-4 h-3 flex-shrink-0" style={{ backgroundColor: PINK }} />
                    p10 (lower band)
                </span>
                <span
                    onClick={() => toggle("p10")}
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ${outerHidden ? "line-through opacity-50" : ""}`}
                >
                    <span className="inline-block w-4 h-3 flex-shrink-0" style={{ backgroundColor: PINK }} />
                    p90 (upper band)
                </span>
                <span
                    onClick={() => toggle("p25")}
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ${innerHidden ? "line-through opacity-50" : ""}`}
                >
                    <span className="inline-block w-4 h-3 flex-shrink-0" style={{ backgroundColor: ORANGE }} />
                    p25 (lower inner band)
                </span>
                <span
                    onClick={() => toggle("p25")}
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ${innerHidden ? "line-through opacity-50" : ""}`}
                >
                    <span className="inline-block w-4 h-3 flex-shrink-0" style={{ backgroundColor: ORANGE }} />
                    p75 (upper inner band)
                </span>
                <span
                    onClick={() => toggle("p50")}
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none col-span-2 justify-self-center ${medianHidden ? "line-through opacity-50" : ""}`}
                >
                    <span className="inline-block w-4 h-3 flex-shrink-0" style={{ backgroundColor: GREEN }} />
                    p50 (median)
                </span>
            </div>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <ComposedChart data={data} margin={{ top: CHART_TOP_MARGIN, right: 20, left: 0, bottom: CHART_BOTTOM_MARGIN }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis
                        domain={[Y_MIN, Y_MAX]}
                        ticks={[0, 50, 100, 150, 200, 250, 300]}
                        tick={{ fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip onMatch={setHoverPoint} />} cursor={false} />

                    {!outerHidden && (
                        <>
                            <Area type="monotone" dataKey="p10" stackId="outer" stroke="none" fill="transparent" dot={false} activeDot={false} />
                            <Area type="monotone" dataKey="band90" stackId="outer" stroke="none" fill={PINK} fillOpacity={0.55} dot={false} activeDot={false} />
                            <Line type="monotone" dataKey="p90" stroke={PINK} strokeWidth={1} dot={{ r: 2, fill: PINK, stroke: "none" }} activeDot={false} />
                            <Line type="monotone" dataKey="p10" stroke={PINK} strokeWidth={1} dot={{ r: 2, fill: PINK, stroke: "none" }} activeDot={false} />
                        </>
                    )}

                    {!innerHidden && (
                        <>
                            <Area type="monotone" dataKey="p25" stackId="inner" stroke="none" fill="transparent" dot={false} activeDot={false} />
                            <Area type="monotone" dataKey="band75" stackId="inner" stroke="none" fill={ORANGE} fillOpacity={0.65} dot={false} activeDot={false} />
                            <Line type="monotone" dataKey="p75" stroke={ORANGE} strokeWidth={1} dot={{ r: 2, fill: ORANGE, stroke: "none" }} activeDot={false} />
                            <Line type="monotone" dataKey="p25" stroke={ORANGE} strokeWidth={1} dot={{ r: 2, fill: ORANGE, stroke: "none" }} activeDot={false} />
                        </>
                    )}

                    {!medianHidden && (
                        <Line type="monotone" dataKey="p50" stroke={GREEN} strokeWidth={2} dot={{ r: 2, fill: GREEN, stroke: "none" }} activeDot={false} />
                    )}

                    {hoverPoint && (
                        <ReferenceDot
                            x={hoverPoint.time}
                            y={hoverPoint.value}
                            r={5}
                            fill={hoverPoint.color}
                            stroke="none"
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AGPChart;