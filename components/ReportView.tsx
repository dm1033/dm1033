"use client";

import * as React from "react";
import { Download, CheckCircle2, XCircle, FileText, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { GameResult, Scenario } from "@/lib/types";
import { buildReport } from "@/lib/game/scoring";
import { generateCpp } from "@/lib/game/cpp";
import { generateReportPdf } from "@/lib/game/pdf";
import { Badge, Button, Card } from "@/components/ui";
import { SiteLayout } from "@/components/SiteLayout";
import { RiskMeter } from "@/components/RiskMeter";

export function ReportView({
  result,
  scenario,
  delegateName,
  persist = true,
}: {
  result: GameResult;
  scenario: Scenario;
  delegateName: string;
  persist?: boolean;
}) {
  const report = React.useMemo(() => buildReport(result, scenario), [result, scenario]);
  const cpp = React.useMemo(() => generateCpp(result, scenario), [result, scenario]);
  const [saved, setSaved] = React.useState<"idle" | "saving" | "ok" | "skip">(
    persist ? "idle" : "ok",
  );

  // Persist the completed session (no-op in demo mode / when logged out).
  React.useEffect(() => {
    if (!persist) return;
    let cancelled = false;
    setSaved("saving");
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, cpp }),
    })
      .then((r) => {
        if (cancelled) return;
        setSaved(r.ok ? "ok" : "skip");
      })
      .catch(() => !cancelled && setSaved("skip"));
    return () => {
      cancelled = true;
    };
  }, [result, cpp, persist]);

  const bandTone =
    report.band === "Distinction" || report.band === "Merit"
      ? "green"
      : report.band === "Pass"
        ? "blue"
        : "red";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{scenario.title}</p>
            <h1 className="text-2xl font-bold text-slate-900">Training Report</h1>
            <p className="mt-1 text-sm text-slate-500">
              {delegateName} ·{" "}
              {saved === "ok" ? "Saved to your record" : saved === "saving" ? "Saving…" : "Not saved (demo mode)"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-4xl font-bold text-brand-700">{report.percent}%</div>
              <Badge tone={bandTone}>{report.band}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Score" value={`${report.total_score} / ${report.max_score}`} />
          <Stat label="Risk index" value={`${report.risk_index} / 100`} />
          <Stat label="Risk rating" value={report.risk_rating} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() =>
              generateReportPdf(report, cpp, {
                scenarioTitle: scenario.title,
                delegateName,
                date: new Date().toLocaleDateString("en-GB"),
              })
            }
          >
            <Download className="h-4 w-4" /> Download PDF report
          </Button>
          <Link href="/scenarios">
            <Button variant="secondary">
              <RotateCcw className="h-4 w-4" /> Play another scenario
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Decision review — your choice vs. the ideal control
            </h2>
            <div className="space-y-4">
              {report.comparisons.map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-slate-800">{c.stage_title}</h3>
                    {c.is_ideal ? (
                      <span className="flex items-center gap-1 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Best control
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-amber-700">
                        <XCircle className="h-4 w-4" /> {c.chosen_score}/{c.ideal_score} pts
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">
                    <strong>You chose:</strong> {c.chosen_text}
                  </p>
                  {!c.is_ideal && (
                    <p className="mt-1 text-sm text-emerald-800">
                      <strong>Ideal control:</strong> {c.ideal_text}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">{c.explanation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <RiskMeter value={report.risk_index} />
          <SiteLayout layout={result.layout} />
        </div>
      </div>

      {/* CPP draft */}
      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-700" />
          <h2 className="text-lg font-semibold text-slate-900">Construction Phase Plan (Draft)</h2>
        </div>
        <p className="mb-4 text-xs text-slate-400">{cpp.generated_label}</p>
        <div className="space-y-4">
          {cpp.sections.map((s, i) => (
            <div key={i}>
              <h3 className="font-medium text-slate-800">{s.heading}</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {s.body.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
