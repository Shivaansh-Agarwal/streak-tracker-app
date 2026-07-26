import type { HeatmapDay } from "@/lib/types";

export function monthsWithLogs(days: HeatmapDay[]) {
  const months = new Set<number>();
  for (const day of days) {
    if (day.hours > 0) {
      // day.date is "YYYY-MM-DD" - parse the month directly rather than via
      // `new Date()`, which can shift the date across a UTC day boundary.
      months.add(Number(day.date.split("-")[1]));
    }
  }
  return months;
}
