"use client";

import { useCallback, useEffect, useState } from "react";
import authFetch from "@/lib/auth-fetch";
import type { Goal } from "@/lib/types";

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.message ?? "Something went wrong";
}

export default function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/api/goals");
      if (!response.ok) throw new Error(await readError(response));
      setGoals(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function createGoal(title: string) {
    const response = await authFetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error(await readError(response));
    const goal: Goal = await response.json();
    await refetch();
    return goal;
  }

  async function renameGoal(id: number, title: string) {
    const response = await authFetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error(await readError(response));
    await refetch();
  }

  async function deleteGoal(id: number) {
    const response = await authFetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await readError(response));
    await refetch();
  }

  return { goals, loading, error, refetch, createGoal, renameGoal, deleteGoal };
}
