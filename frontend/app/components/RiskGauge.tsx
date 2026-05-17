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
    text: "text-red-600",
    bar: "bg-red-500",
    bg: "bg-red-50",
    label: "High Risk",
  },
  MEDIUM: {
    text: "text-amber-600",
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    label: "Medium Risk",
  },
  LOW: {
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    label: "Low Risk",
  },
};

export function RiskGauge({ score, level }: Props) {
  const styles = LEVEL_STYLES[level];
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <Card className={cn("border-2", styles.bg)}>
      <CardContent className="pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Overall Risk
            </p>
            <p className={cn("mt-1 text-5xl font-bold", styles.text)}>
              {score.toFixed(1)}
              <span className="text-2xl text-slate-400">/10</span>
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
          className="mt-6 bg-white"
          indicatorClassName={styles.bar}
        />
      </CardContent>
    </Card>
  );
}
