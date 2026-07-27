"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/types";
import formatLogRange from "@/lib/format-log-range";
import groupLogsByDate from "@/lib/group-logs-by-date";
import formatDateDMY from "@/lib/format-date-dmy";

export default function LogList({
  logs,
  loading,
  error,
  onEdit,
  deleteLog,
  onDeleted,
}: {
  logs: LogEntry[];
  loading: boolean;
  error: string;
  onEdit: (log: LogEntry) => void;
  deleteLog: (id: number) => Promise<void>;
  onDeleted: () => void;
}) {
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  async function handleDelete(id: number) {
    setRowError(null);
    try {
      await deleteLog(id);
      onDeleted();
    } catch (err) {
      setRowError({ id, message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  // Only blank the list on the very first load. On a month/year switch,
  // logs already holds the previous month's data while the new one is
  // fetched - keep showing it (dimmed) instead of collapsing the section to
  // a single line, which was causing a large layout shift and scroll jump.
  if (loading && logs.length === 0) return <p className="text-sm text-muted">Loading logs...</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (logs.length === 0) return <p className="text-sm text-muted">No logs for this month.</p>;

  return (
    <div className={`flex flex-col gap-5 transition-opacity ${loading ? "opacity-50" : ""}`}>
      {groupLogsByDate(logs).map(([date, dateLogs]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatDateDMY(date)}
          </h3>
          <ul className="flex flex-col gap-3">
            {dateLogs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 border-b border-border pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{log.goalTitle}</p>
                    <p className="text-sm">{log.description}</p>
                    <p className="text-xs text-muted">{formatLogRange(log)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => onEdit(log)} className="text-sm text-accent">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(log.id)} className="text-sm text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
                {rowError?.id === log.id && <p className="text-xs text-red-700">{rowError.message}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
