import type { LogEntry } from "@/lib/types";

export default function formatLogRange(log: LogEntry) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: log.timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(log.startTime))} – ${formatter.format(new Date(log.endTime))}`;
}
