"use client";

import { useCallback, useEffect, useState } from "react";
import authFetch from "@/lib/auth-fetch";
import type { HeatmapDay } from "@/lib/types";

export default function useHeatmap(year: number) {
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/logs/heatmap?year=${year}`);
      if (!response.ok) throw new Error("Failed to load heatmap");
      setDays(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    // Deliberate: this hand-rolled fetch+loading-state pattern (chosen over
    // a data-fetching library) always sets loading state synchronously
    // before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { days, loading, error, refetch };
}
