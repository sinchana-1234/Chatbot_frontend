import React from "react";

interface AGPSummaryTableProps {
    summary: Record<string, { Results: string; Unit: string }>;
}

const extractDays = (monitoringResult: string): number | null => {
    const match = monitoringResult?.match(/\((\d+)\s*days?\)/i);
    return match ? parseInt(match[1], 10) : null;
};

const AGPSummaryTable: React.FC<AGPSummaryTableProps> = ({ summary }) => {
    if (!summary || Object.keys(summary).length === 0) return null;

    const monitoringPeriod = summary["Monitoring period"]?.Results || "";
    const days = extractDays(monitoringPeriod);
    const isShortDuration = days !== null && days < 7;

    return (
        <div className="mt-3 bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
                <span className="font-bold text-sm">AGP Summary</span>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="text-left px-3 py-2 font-semibold">Item</th>
                        <th className="text-left px-3 py-2 font-semibold">Results</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(summary).map(([label, value], i) => {
                        const isEHbA1c = label.toLowerCase().includes("ehba1c") || label.toLowerCase().includes("hba1c");
                        return (
                            <tr key={label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <td className="px-3 py-2 text-gray-700">{label}</td>
                                <td className="px-3 py-2 font-medium">
                                    {value.Results}
                                    {isEHbA1c && isShortDuration && (
                                        <span className="text-amber-600 text-xs ml-1">*</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {isShortDuration && (
                <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800">
                    * Based on {days} day{days !== 1 ? "s" : ""} of available glucose data — interpretation is limited.
                </div>
            )}
        </div>
    );
};

export default AGPSummaryTable;