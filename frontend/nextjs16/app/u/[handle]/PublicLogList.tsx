import type { LogEntry } from "@/lib/types";
import { formatLogRange } from "@/lib/formatLogRange";

export function PublicLogList({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted">No logs for this month.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) => (
        <li key={log.id} className="flex flex-col gap-1 border-b border-border pb-3">
          <p className="text-sm font-medium">{log.goalTitle}</p>
          <p className="text-sm">{log.description}</p>
          <p className="text-xs text-muted">
            {log.logDate} · {formatLogRange(log)}
          </p>
        </li>
      ))}
    </ul>
  );
}
