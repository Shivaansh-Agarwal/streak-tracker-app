"use client";

import { useCallback, useEffect, useState } from "react";
import authFetch from "@/lib/auth-fetch";
import type { LogEntry } from "@/lib/types";

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.message ?? "Something went wrong";
}

export type LogInput = {
  goalId: number;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
};

export function useLogs(year: number, month: number) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/logs?year=${year}&month=${month}`);
      if (!response.ok) throw new Error(await readError(response));
      setLogs(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    // Deliberate: this hand-rolled fetch+loading-state pattern (chosen over
    // a data-fetching library) always sets loading state synchronously
    // before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  async function createLog(input: LogInput) {
    const response = await authFetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await readError(response));
  }

  async function updateLog(id: number, input: LogInput) {
    const response = await authFetch(`/api/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await readError(response));
  }

  async function deleteLog(id: number) {
    const response = await authFetch(`/api/logs/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await readError(response));
  }

  return { logs, loading, error, refetch, createLog, updateLog, deleteLog };
}
