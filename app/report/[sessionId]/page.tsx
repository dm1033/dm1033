import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getScenarios } from "@/lib/game/content";
import { ReportView } from "@/components/ReportView";
import type { ChoiceRecord, GameResult, Scenario } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  if (!isSupabaseConfigured()) redirect("/scenarios");

  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = createServerSupabase();
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, scenario_id, total_score, max_score, risk_index, delegate_id")
    .eq("id", params.sessionId)
    .single();

  if (!session) notFound();

  const { data: choices } = await supabase
    .from("session_choices")
    .select(
      "score_awarded, stage_id, decision_id, stages(key, title, phase), decisions(choice_text, safety_impact, legal_impact, explanation, risk_effect, is_ideal, layout_effect)",
    )
    .eq("session_id", session.id);

  const scenarios = await getScenarios();
  const scenario = scenarios.find((s) => s.id === session.scenario_id) as Scenario | undefined;
  if (!scenario) notFound();

  const choiceRecords: ChoiceRecord[] = (choices ?? []).map((c: any) => ({
    stage_id: c.stage_id,
    stage_key: c.stages?.key ?? "",
    stage_title: c.stages?.title ?? "",
    phase: c.stages?.phase ?? "",
    decision_id: c.decision_id,
    choice_text: c.decisions?.choice_text ?? "",
    safety_impact: c.decisions?.safety_impact ?? "",
    legal_impact: c.decisions?.legal_impact ?? "",
    explanation: c.decisions?.explanation ?? "",
    score_awarded: c.score_awarded,
    risk_effect: c.decisions?.risk_effect ?? 0,
    is_ideal: c.decisions?.is_ideal ?? false,
    layout_add: c.decisions?.layout_effect?.add ?? [],
  }));

  // Order choices by the scenario's stage order.
  const order = new Map(scenario.stages.map((s, i) => [s.id, i]));
  choiceRecords.sort((a, b) => (order.get(a.stage_id) ?? 0) - (order.get(b.stage_id) ?? 0));

  const layout = Array.from(new Set(choiceRecords.flatMap((c) => c.layout_add)));

  const result: GameResult = {
    scenario_id: scenario.id,
    scenario_slug: scenario.slug,
    scenario_title: scenario.title,
    choices: choiceRecords,
    total_score: session.total_score,
    max_score: session.max_score,
    risk_index: session.risk_index,
    layout,
  };

  const delegateName = profile.full_name || profile.email;

  return <ReportView result={result} scenario={scenario} delegateName={delegateName} persist={false} />;
}
