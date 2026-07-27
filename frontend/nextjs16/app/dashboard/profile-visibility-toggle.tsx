"use client";

import { useState } from "react";
import { useProfile } from "./profile-context";

export default function ProfileVisibilityToggle() {
  const { profile, setProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !profile.isPublic }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Something went wrong");
      }
      setProfile(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={profile.isPublic}
        onClick={handleToggle}
        disabled={loading}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          profile.isPublic ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            profile.isPublic ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <div className="text-sm">
        <p>{profile.isPublic ? "Public profile" : "Private profile"}</p>
        {profile.username && <p className="text-xs text-muted">/u/{profile.username}</p>}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
