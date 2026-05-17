import { FileText } from "lucide-react";

import { Card, CardContent } from "@/app/components/ui/card";
import type { ClauseCount } from "@/lib/types";

interface Props {
  type: string;
  count: ClauseCount;
}

export function SummaryStats({ type, count }: Props) {
  const total = count.high + count.medium + count.low;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="md:col-span-1">
        <CardContent className="flex h-full flex-col justify-center pt-6">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">
              Contract Type
            </p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{type}</p>
          <p className="mt-1 text-xs text-slate-500">
            {total} clause{total === 1 ? "" : "s"} analyzed
          </p>
        </CardContent>
      </Card>

      <CountChip
        label="High Risk"
        value={count.high}
        accent="bg-red-500"
        text="text-red-600"
        bg="bg-red-50"
      />
      <CountChip
        label="Medium Risk"
        value={count.medium}
        accent="bg-amber-500"
        text="text-amber-600"
        bg="bg-amber-50"
      />
      <CountChip
        label="Low Risk"
        value={count.low}
        accent="bg-emerald-500"
        text="text-emerald-600"
        bg="bg-emerald-50"
      />
    </div>
  );
}

interface ChipProps {
  label: string;
  value: number;
  accent: string;
  text: string;
  bg: string;
}

function CountChip({ label, value, accent, text, bg }: ChipProps) {
  return (
    <Card className={bg}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            {label}
          </p>
        </div>
        <p className={`mt-2 text-3xl font-bold ${text}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
