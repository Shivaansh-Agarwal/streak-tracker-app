import type { HeatmapDay } from "@/lib/types";
import { heatmapCellColor } from "@/lib/heatmapColor";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function Heatmap({
  days,
  loading,
  error,
}: {
  days: HeatmapDay[];
  loading: boolean;
  error: string;
}) {
  if (loading) return <p className="text-sm text-muted">Loading heatmap...</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;

  const byMonth: HeatmapDay[][] = Array.from({ length: 12 }, () => []);
  for (const day of days) {
    // day.date is a plain "YYYY-MM-DD" string - parse it directly instead of
    // via `new Date()`, which treats it as UTC midnight and can shift the
    // month when read back in a negative-UTC-offset local timezone.
    const month = Number(day.date.split("-")[1]) - 1;
    byMonth[month].push(day);
  }

  return (
    <div className="flex flex-col gap-2">
      {byMonth.map((monthDays, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-xs text-muted">{MONTH_NAMES[index]}</span>
          <div className="flex flex-wrap gap-1">
            {monthDays.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.hours.toFixed(1)}h`}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: heatmapCellColor(day.hours) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
