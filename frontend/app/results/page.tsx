"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ClauseCard } from "@/app/components/ClauseCard";
import { RiskGauge } from "@/app/components/RiskGauge";
import { SummaryStats } from "@/app/components/SummaryStats";
import { Button } from "@/app/components/ui/button";
import type { AnalysisResponse } from "@/lib/types";
import { clearResult, loadResult } from "@/lib/storage";

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) {
      router.replace("/");
      return;
    }
    setData(r);
  }, [router]);

  if (!data) return null;

  const sortedClauses = [...data.clauses].sort(
    (a, b) => b.risk_score - a.risk_score
  );

  function analyzeAnother() {
    clearResult();
    router.push("/");
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 py-10 transition-colors dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Analysis Results
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
              Clauses sorted by risk score, highest first.
            </p>
          </div>
          <Button variant="outline" onClick={analyzeAnother}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Analyze another
          </Button>
        </div>

        <RiskGauge
          score={data.overall_risk_score}
          level={data.overall_risk_level}
        />

        <SummaryStats type={data.contract_type} count={data.clause_count} />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Clause Breakdown
          </h2>
          {sortedClauses.map((c) => (
            <ClauseCard key={c.id} clause={c} />
          ))}
        </section>

        <footer className="pb-8 pt-6 text-center text-xs text-slate-500 dark:text-zinc-500">
          LexGuard provides informational analysis only and is not a substitute
          for legal advice.
        </footer>
      </div>
    </main>
  );
}
