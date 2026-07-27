import type { LogEntry } from "@/lib/types";
import { formatLogRange } from "@/lib/formatLogRange";
import { groupLogsByDate } from "@/lib/groupLogsByDate";
import { formatDateDMY } from "@/lib/formatDateDMY";

export function PublicLogList({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted">No logs for this month.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groupLogsByDate(logs).map(([date, dateLogs]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatDateDMY(date)}
          </h3>
          <ul className="flex flex-col gap-3">
            {dateLogs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 border-b border-border pb-3">
                <p className="text-sm font-medium">{log.goalTitle}</p>
                <p className="text-sm">{log.description}</p>
                <p className="text-xs text-muted">{formatLogRange(log)}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
