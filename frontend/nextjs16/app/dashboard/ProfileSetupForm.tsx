"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileSetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Something went wrong");
      }
      // Re-runs the dashboard layout's server-side /users/me check, which
      // will now see status ACTIVE and render the real dashboard.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-border p-8">
      <h1 className="mb-2 text-center text-2xl font-semibold">Set up your profile</h1>
      <p className="mb-6 text-center text-sm text-muted">
        Choose a username — this becomes your public link at /u/&lt;username&gt;.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
