import type { ReactNode } from "react";
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis,
    CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer,
} from "recharts";

// One meal as the backend sends it (mirrors the foodlog service fields).
export interface FoodLogMeal {
    meal_type?: string;
    date?: string;          // "YYYY-MM-DD" — present for range queries
    time?: string;          // display string, e.g. "08:00 AM"
    photo_url?: string;
    calories?: number | null;
    carbs_g?: number | null;
    protein_g?: number | null;
    fat_g?: number | null;
}

interface FoodLogChartProps {
    meals: FoodLogMeal[];
    title?: string;
}

// ---- fixed meal-time windows (the shaded bands) --------------------------
// These NEVER move — only the fork marker moves to the meal's actual time.
// One place to edit if the dashboard's windows differ.
const MEAL_WINDOWS = [
    { label: "breakfast", start: 6.5,   end: 9.0  },
    { label: "lunch",     start: 12.0,  end: 14.0 },
    { label: "dinner",    start: 18.75, end: 21.0 },
];
const BAND_FILL = "#f6c445";
const BAND_LABEL = "#b45309";
const FORK_COLOR = "#8b8f98";

// Up to this many distinct days -> band strips (one row per day). Beyond that,
// the compact date x time grid. Keeps a week readable and a month from becoming
// a giant vertical scroll.
const STRIP_MAX_DAYS = 10;

function normType(meal_type?: string): string {
    return (meal_type || "").toLowerCase().replace(/\s+/g, "");
}
function mealLabel(meal_type?: string): string {
    const nice: Record<string, string> = {
        breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack",
    };
    return nice[normType(meal_type)] || (meal_type || "Meal");
}

// "08:00 AM" / "8:00 AM" / "20:15" / "8 PM" -> hour as a float 0..24, or null.
function parseHour(t?: string): number | null {
    if (!t) return null;
    const m = t.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3];
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return h + min / 60;
}
function hourLabel(h: number): string {
    const hr = Math.floor(h) % 24;
    const ap = hr < 12 ? "AM" : "PM";
    const h12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${h12} ${ap}`;
}
function fmtDateShort(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

// Grey fork marker (fork + knife). Big transparent hit-area for the tooltip.
function MealFork(props: any) {
    const { cx, cy } = props;
    if (cx == null || cy == null) return null;
    return (
        <g style={{ cursor: "pointer" }}>
            <rect x={cx - 8} y={cy - 11} width={16} height={22} fill="transparent" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fill={FORK_COLOR}>🍴</text>
        </g>
    );
}

// Dark popup with the photo + macro breakdown (same as before).
function FoodTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const m: FoodLogMeal = payload[0].payload;
    // Never render a raw object — coerce to a finite number or drop the line.
    const num = (v: any): number | null => {
        if (v == null) return null;
        if (typeof v === "object") v = v.value ?? v.grams ?? v.best_estimate;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    const line = (label: string, raw: any, unit = "g") => {
        const v = num(raw);
       return v == null ? null : (
            <p key={label}>{label}: <span className="font-semibold">{Math.round(v * 10) / 10}{unit}</span></p>
        );
    };
    return (
        <div className="bg-gray-900 text-white text-[11px] rounded-lg p-2 shadow-lg w-40 space-y-0.5">
            {m.photo_url && (
                <img src={m.photo_url} alt={m.meal_type || "meal"}
                    className="w-full h-24 object-cover rounded-md mb-1" />
            )}
            <p className="font-semibold text-[12px] mb-0.5">
                {mealLabel(m.meal_type)}
                {m.date ? ` — ${fmtDateShort(m.date)}` : ""}{m.time ? ` — ${m.time}` : ""}
            </p>
            {line("Calories", m.calories, " kcal")}
            {line("Carbs", m.carbs_g)}
            {line("Protein", m.protein_g)}
            {line("Fat", m.fat_g)}
        </div>
    );
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-100 p-3" style={{ width: 520, maxWidth: "100%" }}>
        <p className="text-sm font-semibold text-gray-700 mb-2">{title}</p>
        {children}
    </div>
);

// ---- single day: fixed windows + forks pinned to the top -----------------
function DayView({ meals, title }: { meals: FoodLogMeal[]; title: string }) {
    const points = meals
        .map((meal) => ({ meal, hour: parseHour(meal.time) }))
        .filter((p): p is { meal: FoodLogMeal; hour: number } => p.hour != null)
        .map((p) => ({ ...p.meal, hour: p.hour, y: 0.9 }));
    if (!points.length) return null;

    return (
        <Card title={title}>
            <div style={{ width: "100%", height: 190 }}>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 24, right: 18, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                        {MEAL_WINDOWS.map((w) => (
                            <ReferenceArea key={w.label} x1={w.start} x2={w.end} y1={0} y2={1}
                                fill={BAND_FILL} fillOpacity={0.15}
                                stroke={BAND_FILL} strokeOpacity={0.9} strokeDasharray="5 4"
                                label={{ value: w.label, position: "top",
                                    fill: BAND_LABEL, fontSize: 11, fontWeight: 600 }} />
                        ))}
                        <XAxis type="number" dataKey="hour" domain={[0, 24]}
                            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                            tickFormatter={hourLabel} tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis type="number" dataKey="y" domain={[0, 1]} hide />
                        <ZAxis range={[400, 400]} />
                        <Tooltip content={<FoodTooltip />} cursor={false} isAnimationActive={false} wrapperStyle={{ transition: "none" }} />
                        <Scatter data={points} shape={<MealFork />} isAnimationActive={false} />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// ---- week: one row per day, fixed windows as vertical columns ------------
function WeekView({ meals, title, dates }: { meals: FoodLogMeal[]; title: string; dates: string[] }) {
    const idxOf = new Map(dates.map((d, i) => [d, i]));
    const points = meals
        .map((meal) => ({ meal, hour: parseHour(meal.time), day: idxOf.get(meal.date || "") }))
        .filter((p): p is { meal: FoodLogMeal; hour: number; day: number } =>
            p.hour != null && p.day != null)
        .map((p) => ({ ...p.meal, hour: p.hour, day: p.day }));
    if (!points.length) return null;

    const N = dates.length;
    const height = 54 + N * 30;

    return (
        <Card title={title}>
            <div style={{ width: "100%", height }}>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                        {MEAL_WINDOWS.map((w) => (
                            <ReferenceArea key={w.label} x1={w.start} x2={w.end} y1={-0.5} y2={N - 0.5}
                                fill={BAND_FILL} fillOpacity={0.14}
                                stroke={BAND_FILL} strokeOpacity={0.75} strokeDasharray="5 4"
                                label={{ value: w.label, position: "insideTop",
                                    fill: BAND_LABEL, fontSize: 10, fontWeight: 600 }} />
                        ))}
                        <XAxis type="number" dataKey="hour" domain={[0, 24]}
                            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                            tickFormatter={hourLabel} tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis type="number" dataKey="day" domain={[-0.5, N - 0.5]}
                            ticks={dates.map((_, i) => i)} reversed width={52}
                            tickFormatter={(i: number) => fmtDateShort(dates[i])}
                            tick={{ fontSize: 10 }} tickLine={false} />
                        <ZAxis range={[300, 300]} />
                        <Tooltip content={<FoodTooltip />} cursor={false} isAnimationActive={false} wrapperStyle={{ transition: "none" }} />
                        <Scatter data={points} shape={<MealFork />} isAnimationActive={false} />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// ---- month / cycle: date x time-of-day grid, windows as horizontal zones -
function MonthView({ meals, title, dates }: { meals: FoodLogMeal[]; title: string; dates: string[] }) {
    const idxOf = new Map(dates.map((d, i) => [d, i]));
    const raw = meals
        .map((meal) => ({ meal, hour: parseHour(meal.time), day: idxOf.get(meal.date || "") }))
        .filter((p): p is { meal: FoodLogMeal; hour: number; day: number } =>
            p.hour != null && p.day != null);
    if (!raw.length) return null;
    const points = raw.map((p) => ({ ...p.meal, hour: p.hour, day: p.day }));

    const N = dates.length;
    const hours = points.map((p) => p.hour);
    const hMin = Math.max(0, Math.min(5, Math.floor(Math.min(...hours) - 0.5)));
    const hMax = Math.min(24, Math.max(22, Math.ceil(Math.max(...hours) + 0.5)));

    const step = Math.max(1, Math.ceil(N / 14));
    const xticks = dates.map((_, i) => i).filter((i) => i % step === 0);

    return (
        <Card title={title}>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                        <ScatterChart margin={{ top: 12, right: 62, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                            {MEAL_WINDOWS.map((w) => (
                                <ReferenceArea key={w.label} x1={-0.5} x2={N - 0.5} y1={w.start} y2={w.end}
                                    fill={BAND_FILL} fillOpacity={0.13}
                                    label={{ value: w.label, position: "right",
                                        fill: BAND_LABEL, fontSize: 9, fontWeight: 600 }} />
                            ))}
                            <XAxis type="number" dataKey="day" domain={[-0.5, N - 0.5]}
                                ticks={xticks} tickFormatter={(i: number) => fmtDateShort(dates[i])}
                                tick={{ fontSize: 9 }} tickLine={false} />
                            <YAxis type="number" dataKey="hour" domain={[hMin, hMax]} reversed
                                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24].filter((h) => h >= hMin && h <= hMax)}
                                tickFormatter={hourLabel} tick={{ fontSize: 10 }} tickLine={false} />
                            <ZAxis range={[220, 220]} />
                            <Tooltip content={<FoodTooltip />} cursor={false} isAnimationActive={false} wrapperStyle={{ transition: "none" }} />
                            <Scatter data={points} shape={<MealFork />} isAnimationActive={false} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
        </Card>
    );
}

export default function FoodLogChart({ meals, title = "Food Log" }: FoodLogChartProps) {
    if (!meals?.length) return null;

    // Distinct days present picks the layout. Meals with no `date` (old single-day
    // payloads) collapse to one day, so the day view still works unchanged.
    const dates = Array.from(new Set(meals.map((m) => m.date).filter(Boolean) as string[])).sort();

    if (dates.length <= 1) return <DayView meals={meals} title={title} />;
    if (dates.length <= STRIP_MAX_DAYS) return <WeekView meals={meals} title={title} dates={dates} />;
    return <MonthView meals={meals} title={title} dates={dates} />;
}