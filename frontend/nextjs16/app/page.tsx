import Link from "next/link";
import { GithubIcon } from "./GithubIcon";
import { HeroGraphic } from "./HeroGraphic";
import { GITHUB_URL } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <span className="font-semibold">Learn in Public</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-muted transition-colors hover:text-foreground"
          aria-label="View source on GitHub"
        >
          <GithubIcon className="h-6 w-6" />
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <HeroGraphic />
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold sm:text-5xl">Learn in Public</h1>
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

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6 text-sm text-muted">
        <span>© {new Date().getFullYear()} Learn in Public</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
          GitHub
        </a>
      </footer>
    </div>
  );
}
