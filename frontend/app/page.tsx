"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { LoadingState } from "@/app/components/LoadingState";
import { UploadZone } from "@/app/components/UploadZone";
import { AnalyzeError, analyzeContract } from "@/lib/api";
import { saveResult } from "@/lib/storage";

type Status = "idle" | "loading" | "error";

function mapError(e: unknown): string {
  if (e instanceof AnalyzeError) {
    switch (e.status) {
      case 400:
        return "File appears to be empty.";
      case 413:
        return "File too large (max 10MB).";
      case 415:
        return "Only PDF or DOCX files are supported.";
      case 422:
        return "Could not extract text from this document.";
      case 502:
        return "Analysis failed — please retry.";
      default:
        return `Request failed (HTTP ${e.status}).`;
    }
  }
  if (e instanceof Error) return e.message;
  return "Unexpected error.";
}

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("loading");
    setError(null);
    try {
      const result = await analyzeContract(file);
      saveResult(result);
      router.push("/results");
    } catch (e) {
      setStatus("error");
      setError(mapError(e));
    }
  }

  if (status === "loading") return <LoadingState />;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <ShieldAlert className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">LexGuard</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Know what you&apos;re signing.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Upload a contract. Get a plain-English risk breakdown of every clause
          — red flags, real-world impact, and negotiation tips.
        </p>

        <div className="mt-10 w-full">
          <UploadZone onFile={handleFile} />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 w-full rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <p className="mt-12 text-xs text-slate-500">
          PDF or DOCX, max 10MB. Files are analyzed in memory and never stored.
        </p>
      </div>
    </main>
  );
}
