import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface TIRData {
    labels: string[];
    data: number[];
}

interface TIRChartProps {
    tir: TIRData;
}

const COLORS: Record<string, string> = {
    "Normal (70-180 mg/dL)": "#6B8E23",
    "Low (<70 mg/dL)": "#F5D9B8",
    "Very Low (<54 mg/dL)": "#4B0082",
    "High (>180 mg/dL)": "#FFEB00",
    "Very High (>250 mg/dL)": "#FF0000",
};

const TIRChart: React.FC<TIRChartProps> = ({ tir }) => {
    if (!tir || !tir.labels || !tir.data) return null;

    // Keep all five categories (even 0%) so the legend always shows the full
    // reference set, but only render a visible slice for non-zero values.
    const allEntries = tir.labels.map((label, i) => ({
        name: label,
        value: tir.data[i],
    }));
    const sliceData = allEntries.filter((d) => d.value > 0);

    return (
        <div className="mt-3 bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
                <span className="font-bold text-gray-900">Time in Range (TIR)</span>
            </div>
            <div className="flex items-center px-4 py-3">
                <ResponsiveContainer width="55%" height={240}>
                    <PieChart>
                        <Pie
                            data={sliceData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={false}
                        >
                            {sliceData.map((entry) => (
                                <Cell key={entry.name} fill={COLORS[entry.name] || "#999"} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value}%`} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 flex flex-col gap-2 pl-2">
                    {allEntries.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-700">
                            <span
                                className="inline-block w-4 h-4 flex-shrink-0 rounded-sm"
                                style={{ backgroundColor: COLORS[entry.name] || "#999" }}
                            />
                            {entry.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TIRChart;