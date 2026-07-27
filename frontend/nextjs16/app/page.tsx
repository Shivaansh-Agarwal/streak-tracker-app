import Link from "next/link";
import StaticHeatmap from "../components/heatmap/static-heatmap";
import Header from "@/components/header";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <StaticHeatmap />
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Learn in Public
          </h1>
          <p className="max-w-md text-lg text-muted">
            Log what you learn. Share your streak.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-accent px-6 py-3 text-white transition-colors hover:bg-accent-hover"
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}
