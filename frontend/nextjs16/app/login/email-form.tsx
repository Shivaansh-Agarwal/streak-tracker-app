"use client";

export default function EmailForm({
  email,
  onChange,
  error,
  loading,
  onSubmit,
}: {
  email: string;
  onChange: (email: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Sending code..." : "Send code"}
      </button>
    </form>
  );
}
