import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import {
  createDecision,
  createStage,
  deleteDecision,
  deleteStage,
  updateDecision,
  updateScenario,
  updateStage,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function ScenarioEditor({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) redirect("/admin");
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") return <p className="text-slate-600">Admin access required.</p>;

  const supabase = createServerSupabase();
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*, stages(*, decisions(*))")
    .eq("id", params.id)
    .single();

  if (!scenario) notFound();
  const s = scenario as any;
  const stages = [...(s.stages ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand-700 underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Edit: {s.title}</h1>
        <Badge tone={s.is_published ? "green" : "slate"} className="mt-1">
          {s.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      {/* Scenario meta */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Scenario details</h2>
        <form action={updateScenario} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={s.id} />
          <div>
            <Label>Title</Label>
            <Input name="title" defaultValue={s.title} />
          </div>
          <div>
            <Label>Sector</Label>
            <Input name="sector" defaultValue={s.sector} />
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select name="difficulty" defaultValue={s.difficulty}>
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
          <div>
            <Label>Summary</Label>
            <Input name="summary" defaultValue={s.summary} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea name="description" rows={3} defaultValue={s.description} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save details</Button>
          </div>
        </form>
      </Card>

      {/* Stages */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stages ({stages.length})</h2>
        {stages.map((st: any) => {
          const decisions = [...(st.decisions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          return (
            <Card key={st.id} className="p-5">
              <details>
                <summary className="cursor-pointer font-medium text-slate-800">
                  {st.sort_order + 1}. {st.title}{" "}
                  <span className="text-sm font-normal text-slate-400">({decisions.length} decisions)</span>
                </summary>

                {/* Stage edit */}
                <form action={updateStage} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={st.id} />
                  <input type="hidden" name="scenario_id" value={s.id} />
                  <div>
                    <Label>Title</Label>
                    <Input name="title" defaultValue={st.title} />
                  </div>
                  <div>
                    <Label>Phase</Label>
                    <Input name="phase" defaultValue={st.phase} />
                  </div>
                  <div>
                    <Label>Sort order</Label>
                    <Input type="number" name="sort_order" defaultValue={st.sort_order} />
                  </div>
                  <div>
                    <Label>Learning outcome</Label>
                    <Input name="learning_outcome" defaultValue={st.learning_outcome} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Prompt</Label>
                    <Textarea name="prompt" rows={2} defaultValue={st.prompt} />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit" size="sm">Save stage</Button>
                  </div>
                </form>
                <form action={deleteStage} className="mt-1">
                  <input type="hidden" name="id" value={st.id} />
                  <input type="hidden" name="scenario_id" value={s.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-red-600">
                    Delete stage
                  </Button>
                </form>

                {/* Decisions */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-slate-600">Decisions & scoring</h4>
                  {decisions.map((d: any) => (
                    <DecisionForm key={d.id} d={d} scenarioId={s.id} />
                  ))}

                  {/* Add decision */}
                  <details className="rounded-lg border border-dashed border-slate-300 p-3">
                    <summary className="cursor-pointer text-sm text-brand-700">+ Add decision</summary>
                    <DecisionForm scenarioId={s.id} stageId={st.id} isNew />
                  </details>
                </div>
              </details>
            </Card>
          );
        })}

        {/* Add stage */}
        <Card className="p-5">
          <h3 className="mb-3 font-medium">Add a stage</h3>
          <form action={createStage} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="scenario_id" value={s.id} />
            <div>
              <Label>Key</Label>
              <Input name="key" placeholder="e.g. environment" required />
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" required />
            </div>
            <div>
              <Label>Phase</Label>
              <Input name="phase" required />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" name="sort_order" defaultValue={stages.length} />
            </div>
            <div className="sm:col-span-2">
              <Label>Learning outcome</Label>
              <Input name="learning_outcome" required />
            </div>
            <div className="sm:col-span-2">
              <Label>Prompt</Label>
              <Textarea name="prompt" rows={2} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm">Add stage</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function DecisionForm({
  d,
  scenarioId,
  stageId,
  isNew = false,
}: {
  d?: any;
  scenarioId: string;
  stageId?: string;
  isNew?: boolean;
}) {
  const action = isNew ? createDecision : updateDecision;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      {d && <input type="hidden" name="id" value={d.id} />}
      <input type="hidden" name="scenario_id" value={scenarioId} />
      <input type="hidden" name="stage_id" value={d?.stage_id ?? stageId} />
      <div className="sm:col-span-2">
        <Label>Choice text</Label>
        <Textarea name="choice_text" rows={2} defaultValue={d?.choice_text} required />
      </div>
      <div>
        <Label>Safety impact</Label>
        <Input name="safety_impact" defaultValue={d?.safety_impact} required />
      </div>
      <div>
        <Label>Legal/compliance impact</Label>
        <Input name="legal_impact" defaultValue={d?.legal_impact} required />
      </div>
      <div className="sm:col-span-2">
        <Label>Explanation</Label>
        <Textarea name="explanation" rows={2} defaultValue={d?.explanation} required />
      </div>
      <div>
        <Label>Score effect</Label>
        <Input type="number" name="score_effect" defaultValue={d?.score_effect ?? 0} />
      </div>
      <div>
        <Label>Risk effect</Label>
        <Input type="number" name="risk_effect" defaultValue={d?.risk_effect ?? 0} />
      </div>
      <div>
        <Label>Sort order</Label>
        <Input type="number" name="sort_order" defaultValue={d?.sort_order ?? 0} />
      </div>
      <div>
        <Label>Layout elements (comma-separated)</Label>
        <Input name="layout_add" defaultValue={(d?.layout_effect?.add ?? []).join(", ")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="is_ideal" defaultChecked={d?.is_ideal} /> Ideal control (benchmark)
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          {isNew ? "Add decision" : "Save decision"}
        </Button>
      </div>
    </form>
    {!isNew && d && (
      <form action={deleteDecision} className="mt-1">
        <input type="hidden" name="id" value={d.id} />
        <input type="hidden" name="scenario_id" value={scenarioId} />
        <Button type="submit" variant="ghost" size="sm" className="text-red-600">
          Delete decision
        </Button>
      </form>
    )}
    </div>
  );
}
