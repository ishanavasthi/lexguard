"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import type { Clause, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  clause: Clause;
}

const RISK_STYLES: Record<RiskLevel, { border: string; badge: string }> = {
  HIGH: {
    border: "border-l-red-500",
    badge: "bg-red-500 hover:bg-red-500 text-white",
  },
  MEDIUM: {
    border: "border-l-amber-500",
    badge: "bg-amber-500 hover:bg-amber-500 text-white",
  },
  LOW: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500 hover:bg-emerald-500 text-white",
  },
};

function formatCategory(c: string): string {
  return c.replace(/_/g, " ");
}

export function ClauseCard({ clause }: Props) {
  const [open, setOpen] = useState(false);
  const styles = RISK_STYLES[clause.risk_level];

  return (
    <Card className={cn("border-l-4 transition-colors", styles.border)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            {clause.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="dark:bg-zinc-800 dark:text-zinc-200"
            >
              {formatCategory(clause.category)}
            </Badge>
            <Badge className={styles.badge}>
              {clause.risk_level} · {clause.risk_score}/10
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base text-slate-800 dark:text-zinc-200">
          {clause.plain_english}
        </p>

        {clause.red_flags.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Red Flags
            </p>
            <ul className="space-y-1.5 pl-1">
              {clause.red_flags.map((flag, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-slate-600 dark:text-zinc-300"
                >
                  <span className="text-red-500">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm italic text-slate-600 dark:text-zinc-300">
          {clause.what_it_means_for_you}
        </p>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="h-4 w-4" />
            Negotiation Tip
          </p>
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {clause.negotiation_tip}
          </p>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            {open ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide original text
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show original text
              </>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
              {clause.original_text}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
