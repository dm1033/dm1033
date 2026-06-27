"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured.");
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("Admin access required.");
  return createServerSupabase();
}

const num = (v: FormDataEntryValue | null, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// ── Scenarios ────────────────────────────────────────────────────────────────
const scenarioSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "lowercase, digits and dashes only"),
  title: z.string().min(2),
  sector: z.string().min(2),
  difficulty: z.enum(["foundation", "intermediate", "advanced"]),
  summary: z.string().min(2),
  description: z.string().min(2),
});

export async function createScenario(formData: FormData) {
  const supabase = await requireAdmin();
  const parsed = scenarioSchema.parse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    sector: formData.get("sector"),
    difficulty: formData.get("difficulty"),
    summary: formData.get("summary"),
    description: formData.get("description"),
  });
  await supabase.from("scenarios").insert({ ...parsed, is_published: false });
  revalidatePath("/admin");
}

export async function updateScenario(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = scenarioSchema.partial().parse({
    title: formData.get("title") ?? undefined,
    sector: formData.get("sector") ?? undefined,
    difficulty: formData.get("difficulty") ?? undefined,
    summary: formData.get("summary") ?? undefined,
    description: formData.get("description") ?? undefined,
  });
  await supabase.from("scenarios").update(parsed).eq("id", id);
  revalidatePath(`/admin/scenarios/${id}`);
  revalidatePath("/admin");
}

export async function togglePublish(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const next = String(formData.get("is_published")) === "true";
  await supabase.from("scenarios").update({ is_published: next }).eq("id", id);
  revalidatePath("/admin");
}

export async function deleteScenario(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("scenarios").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin");
}

// ── Stages ───────────────────────────────────────────────────────────────────
export async function createStage(formData: FormData) {
  const supabase = await requireAdmin();
  const scenarioId = String(formData.get("scenario_id"));
  await supabase.from("stages").insert({
    scenario_id: scenarioId,
    key: String(formData.get("key")),
    title: String(formData.get("title")),
    phase: String(formData.get("phase")),
    learning_outcome: String(formData.get("learning_outcome")),
    prompt: String(formData.get("prompt")),
    sort_order: num(formData.get("sort_order")),
  });
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}

export async function updateStage(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenario_id"));
  await supabase
    .from("stages")
    .update({
      title: String(formData.get("title")),
      phase: String(formData.get("phase")),
      learning_outcome: String(formData.get("learning_outcome")),
      prompt: String(formData.get("prompt")),
      sort_order: num(formData.get("sort_order")),
    })
    .eq("id", id);
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}

export async function deleteStage(formData: FormData) {
  const supabase = await requireAdmin();
  const scenarioId = String(formData.get("scenario_id"));
  await supabase.from("stages").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}

// ── Decisions (incl. scoring) ────────────────────────────────────────────────
export async function createDecision(formData: FormData) {
  const supabase = await requireAdmin();
  const scenarioId = String(formData.get("scenario_id"));
  await supabase.from("decisions").insert({
    stage_id: String(formData.get("stage_id")),
    choice_text: String(formData.get("choice_text")),
    safety_impact: String(formData.get("safety_impact")),
    legal_impact: String(formData.get("legal_impact")),
    explanation: String(formData.get("explanation")),
    score_effect: num(formData.get("score_effect")),
    risk_effect: num(formData.get("risk_effect")),
    is_ideal: String(formData.get("is_ideal")) === "on",
    sort_order: num(formData.get("sort_order")),
    layout_effect: {
      add: String(formData.get("layout_add") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  });
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}

export async function updateDecision(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenario_id"));
  await supabase
    .from("decisions")
    .update({
      choice_text: String(formData.get("choice_text")),
      safety_impact: String(formData.get("safety_impact")),
      legal_impact: String(formData.get("legal_impact")),
      explanation: String(formData.get("explanation")),
      score_effect: num(formData.get("score_effect")),
      risk_effect: num(formData.get("risk_effect")),
      is_ideal: String(formData.get("is_ideal")) === "on",
      sort_order: num(formData.get("sort_order")),
      layout_effect: {
        add: String(formData.get("layout_add") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    })
    .eq("id", id);
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}

export async function deleteDecision(formData: FormData) {
  const supabase = await requireAdmin();
  const scenarioId = String(formData.get("scenario_id"));
  await supabase.from("decisions").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/admin/scenarios/${scenarioId}`);
}
