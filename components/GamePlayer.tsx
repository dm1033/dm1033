"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, Scale, ShieldCheck } from "lucide-react";
import type { Decision, Scenario } from "@/lib/types";
import { applyChoice, initialState, toResult, type GameState } from "@/lib/game/engine";
import { Badge, Button, Card } from "@/components/ui";
import { SiteLayout } from "@/components/SiteLayout";
import { RiskMeter } from "@/components/RiskMeter";
import { ReportView } from "@/components/ReportView";

export function GamePlayer({
  scenario,
  delegateName,
}: {
  scenario: Scenario;
  delegateName: string;
}) {
  const [state, setState] = React.useState<GameState>(initialState);
  const [selected, setSelected] = React.useState<Decision | null>(null);

  const stage = scenario.stages[state.stageIndex];
  const done = state.stageIndex >= scenario.stages.length;

  function choose(d: Decision) {
    setSelected(d);
  }

  function next() {
    if (!selected || !stage) return;
    setState((s) => applyChoice(s, stage, selected));
    setSelected(null);
  }

  if (done) {
    return (
      <ReportView result={toResult(state, scenario)} scenario={scenario} delegateName={delegateName} />
    );
  }

  const progress = Math.round((state.stageIndex / scenario.stages.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm text-slate-500">
            <span>
              Stage {state.stageIndex + 1} of {scenario.stages.length} · {stage.phase}
            </span>
            <span>Score {state.score}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card className="p-6">
          <Badge tone="blue" className="mb-3">
            {stage.title}
          </Badge>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Learning outcome
          </p>
          <p className="mb-4 text-sm text-slate-600">{stage.learning_outcome}</p>
          <h2 className="text-lg font-semibold text-slate-900">{stage.prompt}</h2>

          <div className="mt-5 space-y-3">
            {stage.decisions.map((d) => {
              const isSel = selected?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => choose(d)}
                  disabled={!!selected}
                  className={[
                    "w-full rounded-lg border p-4 text-left transition-colors",
                    isSel
                      ? "border-brand-600 ring-2 ring-brand-600/30 bg-brand-50"
                      : "border-slate-200 hover:border-brand-400 hover:bg-slate-50",
                    selected && !isSel ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <span className="text-sm text-slate-800">{d.choice_text}</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                {selected.is_ideal ? (
                  <Badge tone="green">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Strong control
                  </Badge>
                ) : selected.score_effect > 0 ? (
                  <Badge tone="amber">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Could be improved
                  </Badge>
                ) : (
                  <Badge tone="red">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Non-compliant
                  </Badge>
                )}
                <span className="text-sm font-medium text-slate-700">
                  {selected.score_effect >= 0 ? "+" : ""}
                  {selected.score_effect} pts · risk {selected.risk_effect >= 0 ? "+" : ""}
                  {selected.risk_effect}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex gap-2 text-slate-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <strong>Safety:</strong> {selected.safety_impact}
                  </span>
                </p>
                <p className="flex gap-2 text-slate-700">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <strong>Legal/compliance:</strong> {selected.legal_impact}
                  </span>
                </p>
                <p className="text-slate-600">
                  <strong>Why:</strong> {selected.explanation}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>
                  {state.stageIndex + 1 >= scenario.stages.length ? "See report" : "Next stage"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Live side panel */}
      <div className="space-y-4">
        <RiskMeter value={selected ? Math.max(0, Math.min(100, state.risk + selected.risk_effect)) : state.risk} />
        <SiteLayout
          layout={
            selected
              ? Array.from(new Set([...state.layout, ...(selected.layout_effect?.add ?? [])]))
              : state.layout
          }
        />
      </div>
    </div>
  );
}
