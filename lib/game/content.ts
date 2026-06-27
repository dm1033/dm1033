import "server-only";
import scenariosData from "@/content/scenarios.json";
import type { Scenario } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

const fallback = (scenariosData as { scenarios: Scenario[] }).scenarios;

/** All published scenarios with stages + decisions (DB if configured, else JSON). */
export async function getScenarios(): Promise<Scenario[]> {
  if (!isSupabaseConfigured()) return fallback;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("scenarios")
    .select(
      "*, stages(*, decisions(*))",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return fallback;

  // Normalise nested ordering (PostgREST does not guarantee child order).
  return (data as Scenario[]).map((s) => ({
    ...s,
    stages: [...(s.stages ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((st) => ({
        ...st,
        decisions: [...(st.decisions ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      })),
  }));
}

export async function getScenarioBySlug(slug: string): Promise<Scenario | null> {
  const all = await getScenarios();
  return all.find((s) => s.slug === slug) ?? null;
}
