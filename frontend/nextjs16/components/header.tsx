import GITHUB_URL from "@/lib/constants";
import Image from "next/image";

function Header() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
      <span className="font-semibold">Learn in Public</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="text-muted transition-colors hover:text-foreground"
        aria-label="View source on GitHub"
      >
        <Image
          src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
          alt="GitHub"
          width={24}
          height={24}
          className="h-6 w-6"
        />
      </a>
    </header>
  );
}

export default Header;
