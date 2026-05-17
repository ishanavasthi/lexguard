import { Card, CardContent } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  level: RiskLevel;
}

const LEVEL_STYLES: Record<
  RiskLevel,
  { text: string; bar: string; bg: string; label: string }
> = {
  HIGH: {
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
    label: "High Risk",
  },
  MEDIUM: {
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50",
    label: "Medium Risk",
  },
  LOW: {
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50",
    label: "Low Risk",
  },
};

export function RiskGauge({ score, level }: Props) {
  const styles = LEVEL_STYLES[level];
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <Card className={cn("border-2 transition-colors", styles.bg)}>
      <CardContent className="pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Overall Risk
            </p>
            <p className={cn("mt-1 text-5xl font-bold", styles.text)}>
              {score.toFixed(1)}
              <span className="text-2xl text-slate-400 dark:text-zinc-500">
                /10
              </span>
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold text-white",
              styles.bar
            )}
          >
            {styles.label}
          </span>
        </div>
        <Progress
          value={pct}
          className="mt-6 bg-white dark:bg-zinc-800"
          indicatorClassName={styles.bar}
        />
      </CardContent>
    </Card>
  );
}
