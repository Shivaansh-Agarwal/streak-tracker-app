"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/types";
import { formatLogRange } from "@/lib/formatLogRange";

export function LogList({
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

  if (loading) return <p className="text-sm text-muted">Loading logs...</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (logs.length === 0) return <p className="text-sm text-muted">No logs for this month.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) => (
        <li key={log.id} className="flex flex-col gap-1 border-b border-border pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{log.goalTitle}</p>
              <p className="text-sm">{log.description}</p>
              <p className="text-xs text-muted">
                {log.logDate} · {formatLogRange(log)}
              </p>
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
  );
}
