"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const MESSAGES = [
  "Extracting clauses…",
  "Analyzing risks…",
  "Almost done…",
];

export function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 transition-colors dark:from-black dark:to-black">
      <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-white" />
      <p className="mt-6 text-lg font-medium text-slate-700 dark:text-zinc-200">
        {MESSAGES[index]}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
        This usually takes 15–30 seconds.
      </p>
    </main>
  );
}
