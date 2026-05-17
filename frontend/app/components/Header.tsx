import Link from "next/link";
import { Github, ShieldAlert } from "lucide-react";

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Button } from "@/app/components/ui/button";

const REPO_URL = "https://github.com/ishanavasthi/lexguard";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 dark:text-white"
        >
          <ShieldAlert className="h-6 w-6 text-primary dark:text-white" />
          <span className="text-lg font-bold tracking-tight">LexGuard</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="View source on GitHub"
            className="text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
