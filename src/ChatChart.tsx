import {
    LineChart, Line,
    AreaChart, Area,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export interface ChartPayload {
    type: "line" | "stackedArea" | "stackedBar" | "bar" | "overlayArea" | "area";
    title: string;
    x_labels: string[];
    series: { name: string; values: number[] }[];
    dual_axis?: boolean;
    color?: string;
    stats?: {
        avg_tir_pct?: number | null;
        avg_bp?: string | null;
        avg_hba1c?: number | null;
    };
}

interface ChatChartProps {
    data: ChartPayload;
}

const COLORS = ["#2a78d6", "#e0796a", "#5bb98c", "#d6a12a", "#8a6fd6"];

const TIR_COLORS = ["#e0576a", "#4caf7d", "#4a90e2"];

function CompactTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white text-[11px] rounded px-2 py-1 shadow-lg space-y-0.5">
            <p className="opacity-70">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i}>
                    {entry.name}: <span className="font-semibold">{entry.value}</span>
                </p>
            ))}
        </div>
    );
}

export default function ChatChart({ data }: ChatChartProps) {
    if (!data || !data.series?.length) return null;

    const chartRows = data.x_labels.map((label, i) => {
        const row: Record<string, string | number> = { label };
        data.series.forEach((s) => {
            row[s.name] = s.values[i];
        });
        return row;
    });

    const showLegend = data.series.length > 1;
    const commonMargin = { top: 5, right: 10, left: -20, bottom: 20 };

    return (
        <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">{data.title}</p>
            {!showLegend && (
                <p className="text-xs text-gray-500 mb-1">{data.series[0].name}</p>
            )}
            <div style={{ width: "100%", height: showLegend ? 220 : 190 }}>
                <ResponsiveContainer>
                    {data.type === "area" ? (
                        <AreaChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip content={<CompactTooltip />} />
                            <Area
                                type="monotone"
                                dataKey={data.series[0].name}
                                stroke={data.color || COLORS[0]}
                                fill={data.color || COLORS[0]}
                                fillOpacity={0.25}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    ) : data.type === "overlayArea" ? (
                        <AreaChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                            <Tooltip content={<CompactTooltip />} />
                            {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                            {data.series.map((s, i) => (
                                <Area
                                    key={s.name}
                                    type="monotone"
                                    dataKey={s.name}
                                    stroke={TIR_COLORS[i % TIR_COLORS.length]}
                                    fill={TIR_COLORS[i % TIR_COLORS.length]}
                                    fillOpacity={0.35}
                                />
                            ))}
                        </AreaChart>
                    ) : data.type === "stackedArea" ? (
                        <AreaChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<CompactTooltip />} />
                            {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                            {data.series.map((s, i) => (
                                <Area
                                    key={s.name}
                                    type="monotone"
                                    dataKey={s.name}
                                    stackId="1"
                                    stroke={COLORS[i % COLORS.length]}
                                    fill={COLORS[i % COLORS.length]}
                                    fillOpacity={0.5}
                                />
                            ))}
                        </AreaChart>
                    ) : data.type === "stackedBar" ? (
                        <BarChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<CompactTooltip />} />
                            {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                            {data.series.map((s, i) => (
                                <Bar key={s.name} dataKey={s.name} stackId="1" fill={COLORS[i % COLORS.length]} />
                            ))}
                        </BarChart>
                    ) : data.type === "bar" ? (
                        <BarChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<CompactTooltip />} />
                            <Bar dataKey={data.series[0].name} fill={COLORS[0]} radius={[3, 3, 0, 0]} />
                        </BarChart>
                    ) : (
                        <LineChart data={chartRows} margin={commonMargin}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={40} interval={0} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                            {data.dual_axis && (
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                            )}
                            <Tooltip content={<CompactTooltip />} />
                            {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                            {data.series.map((s, i) => (
                                <Line
                                    key={s.name}
                                    yAxisId={data.dual_axis && i > 0 ? "right" : "left"}
                                    type="monotone"
                                    dataKey={s.name}
                                    stroke={COLORS[i % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
            {data.stats && (data.stats.avg_tir_pct != null || data.stats.avg_bp || data.stats.avg_hba1c != null) && (
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-200 text-xs">
                    {data.stats.avg_tir_pct != null && (
                        <div>
                            <p className="text-gray-500">Avg TIR</p>
                            <p className="font-medium text-black">{data.stats.avg_tir_pct}%</p>
                        </div>
                    )}
                    {data.stats.avg_bp && (
                        <div>
                            <p className="text-gray-500">Avg BP</p>
                            <p className="font-medium text-black">{data.stats.avg_bp}</p>
                        </div>
                    )}
                    {data.stats.avg_hba1c != null && (
                        <div>
                            <p className="text-gray-500">Est. HbA1c</p>
                            <p className="font-medium text-black">{data.stats.avg_hba1c}%</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}