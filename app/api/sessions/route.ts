import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  result: z.object({
    scenario_id: z.string().uuid(),
    total_score: z.number().int(),
    max_score: z.number().int(),
    risk_index: z.number().int(),
    choices: z.array(
      z.object({
        stage_id: z.string().uuid(),
        decision_id: z.string().uuid(),
        score_awarded: z.number().int(),
      }),
    ),
  }),
  cpp: z.object({}).passthrough(),
});

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ saved: false, reason: "demo-mode" }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  }
  const { result, cpp } = parsed.data;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ saved: false, reason: "not-authenticated" }, { status: 401 });
  }

  // Insert the session (RLS ensures delegate_id = auth.uid()).
  const { data: session, error: sErr } = await supabase
    .from("game_sessions")
    .insert({
      delegate_id: user.id,
      scenario_id: result.scenario_id,
      status: "completed",
      total_score: result.total_score,
      max_score: result.max_score,
      risk_index: result.risk_index,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: "session-insert-failed", detail: sErr?.message }, { status: 500 });
  }

  if (result.choices.length) {
    const { error: cErr } = await supabase.from("session_choices").insert(
      result.choices.map((c) => ({
        session_id: session.id,
        stage_id: c.stage_id,
        decision_id: c.decision_id,
        score_awarded: c.score_awarded,
      })),
    );
    if (cErr) {
      return NextResponse.json({ error: "choices-insert-failed", detail: cErr.message }, { status: 500 });
    }
  }

  await supabase.from("cpp_drafts").insert({ session_id: session.id, content: cpp });

  return NextResponse.json({ saved: true, id: session.id });
}
