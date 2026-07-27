"use client";

import { useState } from "react";
import type { Goal, LogEntry } from "@/lib/types";
import type { LogInput } from "@/app/dashboard/utils/use-logs";

// datetime-local inputs work in the browser's own local time, with no
// timezone in the value itself - `new Date(value)`/`.toISOString()` handles
// the local -> UTC conversion for us. When editing an existing log, the
// stored UTC instant is converted back for display using the *editing
// browser's* local time rather than the log's originally captured zone -
// an accepted simplification for now, since datetime-local can't target an
// arbitrary IANA zone without extra formatting logic.
function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AddLogForm({
  goals,
  editingLog,
  onDoneEditing,
  onSaved,
  createLog,
  updateLog,
}: {
  goals: Goal[];
  editingLog: LogEntry | null;
  onDoneEditing: () => void;
  onSaved: () => void;
  createLog: (input: LogInput) => Promise<void>;
  updateLog: (id: number, input: LogInput) => Promise<void>;
}) {
  // Initial state is derived directly from editingLog rather than synced via
  // an effect - the parent remounts this component with a fresh `key` (see
  // page.tsx) whenever editingLog changes, so these initial values are
  // exactly the ones needed on every mount.
  const [goalId, setGoalId] = useState<string>(editingLog ? String(editingLog.goalId) : "");
  const [description, setDescription] = useState(editingLog?.description ?? "");
  const [startTime, setStartTime] = useState(editingLog ? toDatetimeLocal(editingLog.startTime) : "");
  const [endTime, setEndTime] = useState(editingLog ? toDatetimeLocal(editingLog.endTime) : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // startTime/endTime are datetime-local strings ("YYYY-MM-DDTHH:mm") - a
    // plain string slice of the date portion avoids the same UTC-midnight
    // shift risk as parsing through `new Date()` for a date-only comparison.
    if (startTime.slice(0, 10) !== endTime.slice(0, 10)) {
      setError("A log cannot span multiple days");
      return;
    }
    if (new Date(endTime).getTime() - new Date(startTime).getTime() > 12 * 60 * 60 * 1000) {
      setError("A log cannot be longer than 12 hours");
      return;
    }

    setLoading(true);
    try {
      const input: LogInput = {
        goalId: Number(goalId),
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (editingLog) {
        await updateLog(editingLog.id, input);
        onDoneEditing();
      } else {
        await createLog(input);
        setDescription("");
        setStartTime("");
        setEndTime("");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Goal
        <select
          required
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        >
          <option value="" disabled>
            Select a goal
          </option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Start time
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          End time
          <input
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || goals.length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Saving..." : editingLog ? "Save changes" : "Add log"}
        </button>
        {editingLog && (
          <button type="button" onClick={onDoneEditing} className="text-sm text-muted">
            Cancel
          </button>
        )}
      </div>
      {goals.length === 0 && (
        <p className="text-xs text-muted">Add a goal above before logging an entry.</p>
      )}
    </form>
  );
}
