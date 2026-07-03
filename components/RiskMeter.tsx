import * as React from "react";
import { cn } from "@/lib/utils";
import { riskRatingFor } from "@/lib/game/scoring";

export function RiskMeter({ value, className }: { value: number; className?: string }) {
  const rating = riskRatingFor(value);
  const tone =
    rating === "Low"
      ? "bg-emerald-500"
      : rating === "Medium"
        ? "bg-amber-500"
        : rating === "High"
          ? "bg-orange-500"
          : "bg-red-600";
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Project risk</h3>
        <span className="text-sm font-semibold text-slate-900">
          {value}/100 · {rating}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">Lower is safer. Good decisions reduce the risk index.</p>
    </div>
  );
}
