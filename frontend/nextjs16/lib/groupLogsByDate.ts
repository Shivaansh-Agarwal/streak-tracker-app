import type { LogEntry } from "@/lib/types";

// Logs already arrive sorted by start_time, so a Map (which preserves
// insertion order) groups same-date entries together without re-sorting.
export function groupLogsByDate(logs: LogEntry[]): [string, LogEntry[]][] {
  const groups = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = groups.get(log.logDate);
    if (existing) {
      existing.push(log);
    } else {
      groups.set(log.logDate, [log]);
    }
  }
  return [...groups.entries()];
}
