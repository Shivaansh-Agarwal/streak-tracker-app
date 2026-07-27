import { notFound } from "next/navigation";
import Link from "next/link";
import HeatmapByMonth from "@/components/heatmap/heatmap-by-month";
import { PublicMonthTabs } from "./public-month-tabs";
import { PublicLogList } from "./public-log-list";
import { monthsWithLogs } from "@/lib/monthsWithLogs";
import type { HeatmapDay, LogEntry } from "@/lib/types";

// Server component fetch happens inside the Next.js server process itself,
// so this bypasses the browser-facing /api/* rewrite and hits the backend's
// internal URL directly - same pattern as the dashboard layout's auth check.
const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type PublicProfile = {
  username: string;
  fullName: string;
  profilePictureUrl: string | null;
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { handle } = await params;
  const search = await searchParams;
  const year = Number(search.year) || currentYear;
  const month = Number(search.month) || currentMonth;

  const profileResponse = await fetch(`${backendUrl}/public/${handle}`, {
    cache: "no-store",
  });

  if (profileResponse.status === 404) {
    notFound();
  }
  if (profileResponse.status === 403) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold">This profile is private</h1>
        <p className="text-muted">
          @{handle} hasn&apos;t made their progress public.
        </p>
      </div>
    );
  }
  if (!profileResponse.ok) {
    throw new Error("Failed to load profile");
  }

  const profile: PublicProfile = await profileResponse.json();

  const [heatmapResponse, logsResponse] = await Promise.all([
    fetch(`${backendUrl}/public/${handle}/heatmap?year=${year}`, {
      cache: "no-store",
    }),
    fetch(`${backendUrl}/public/${handle}/logs?year=${year}&month=${month}`, {
      cache: "no-store",
    }),
  ]);

  const days: HeatmapDay[] = heatmapResponse.ok
    ? await heatmapResponse.json()
    : [];
  const logs: LogEntry[] = logsResponse.ok ? await logsResponse.json() : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">{profile.fullName}</h1>
        <p className="text-muted">@{profile.username}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Heatmap</h2>
          <div className="flex gap-1 text-sm">
            {YEAR_OPTIONS.map((y) => (
              <Link
                key={y}
                href={`?year=${y}&month=${month}`}
                className={`rounded-md px-2 py-1 ${
                  y === year
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
        <HeatmapByMonth days={days} loading={false} error="" />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Logs</h2>
        <PublicMonthTabs
          year={year}
          month={month}
          monthsWithLogs={monthsWithLogs(days)}
        />
        <PublicLogList logs={logs} />
      </section>
    </div>
  );
}
