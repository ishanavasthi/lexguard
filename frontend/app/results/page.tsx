"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">LexGuard</span>
          </div>
          <Button variant="outline" onClick={analyzeAnother}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Analyze another
          </Button>
        </header>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analysis Results
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Clauses sorted by risk score, highest first.
          </p>
        </div>

        <RiskGauge
          score={data.overall_risk_score}
          level={data.overall_risk_level}
        />

        <SummaryStats type={data.contract_type} count={data.clause_count} />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Clause Breakdown
          </h2>
          {sortedClauses.map((c) => (
            <ClauseCard key={c.id} clause={c} />
          ))}
        </section>

        <footer className="pb-8 pt-6 text-center text-xs text-slate-500">
          LexGuard provides informational analysis only and is not a substitute
          for legal advice.
        </footer>
      </div>
    </main>
  );
}
