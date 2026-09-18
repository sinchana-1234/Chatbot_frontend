import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Period {
    periodStart: string;
    periodEnd: string;
    tir: number;
    avgGlucose: number;
    ehba1c: number;
}

interface EHbA1cTIRChartProps {
    periods: Period[];
}

const EHbA1cTIRChart: React.FC<EHbA1cTIRChartProps> = ({ periods }) => {
    if (!periods || periods.length === 0) return null;

    const data = periods.map((p) => ({
        period: p.periodStart,
        eHbA1c: p.ehba1c,
        TIR: p.tir,
    }));

    return (
        <div className="mt-3 bg-white rounded-lg border border-gray-300 p-3">
            <div className="text-center font-bold text-gray-700 mb-2">eHbA1c & TIR Trend</div>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="left" type="monotone" dataKey="eHbA1c" stroke="#2C5FA8" strokeWidth={2} dot={{ r: 2 }} />
                    <Line yAxisId="right" type="monotone" dataKey="TIR" stroke="#6B8E23" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EHbA1cTIRChart;