"use client";

import { useState } from "react";
import type { Goal } from "@/lib/types";

export function GoalManager({
  goals,
  loading,
  error,
  createGoal,
  renameGoal,
  deleteGoal,
}: {
  goals: Goal[];
  loading: boolean;
  error: string;
  createGoal: (title: string) => Promise<Goal>;
  renameGoal: (id: number, title: string) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await createGoal(newTitle.trim());
      setNewTitle("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function startEditing(goal: Goal) {
    setEditingId(goal.id);
    setEditingTitle(goal.title);
    setRowError(null);
  }

  async function saveRename(id: number) {
    if (!editingTitle.trim()) return;
    try {
      await renameGoal(id, editingTitle.trim());
      setEditingId(null);
    } catch (err) {
      setRowError({ id, message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  async function handleDelete(id: number) {
    setRowError(null);
    try {
      await deleteGoal(id);
    } catch (err) {
      setRowError({ id, message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New goal title"
          className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {createError && <p className="text-sm text-red-700">{createError}</p>}

      {loading && <p className="text-sm text-muted">Loading goals...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && goals.length === 0 && (
        <p className="text-sm text-muted">No goals yet — add one above.</p>
      )}

      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li key={goal.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {editingId === goal.id ? (
                <>
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => saveRename(goal.id)}
                    className="text-sm text-accent"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-muted">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{goal.title}</span>
                  <button onClick={() => startEditing(goal)} className="text-sm text-accent">
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-sm text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            {rowError?.id === goal.id && (
              <p className="text-xs text-red-700">{rowError.message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
