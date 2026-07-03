import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { bandFor, percentFor, riskRatingFor } from "@/lib/game/scoring";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrainerPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Trainer dashboard</h1>
        <Card className="mt-6 p-8">
          <Badge tone="amber" className="mb-3">Demo mode</Badge>
          <p className="text-slate-600">
            Connect Supabase and sign in as a trainer to monitor delegate performance across your
            organisation.
          </p>
        </Card>
      </div>
    );
  }

  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "trainer" && profile.role !== "admin") {
    return <p className="text-slate-600">You need a trainer or admin account to view this page.</p>;
  }

  const supabase = createServerSupabase();
  // RLS limits this to delegates in the trainer's organisation (admins see all).
  const { data } = await supabase
    .from("game_sessions")
    .select(
      "id, total_score, max_score, risk_index, status, completed_at, profiles(full_name, email), scenarios(title)",
    )
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const rows = (data ?? []) as any[];
  const avg =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((a, r) => a + percentFor(r.total_score, r.max_score), 0) / rows.length);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Trainer dashboard</h1>
      <p className="mt-1 text-slate-600">Delegate results across your organisation.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs uppercase text-slate-400">Completed sessions</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase text-slate-400">Average score</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{avg}%</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase text-slate-400">Average band</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{bandFor(avg)}</div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No completed delegate sessions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Delegate</th>
                <th className="px-4 py-3">Scenario</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const percent = percentFor(r.total_score, r.max_score);
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.profiles?.full_name || r.profiles?.email || "—"}
                    </td>
                    <td className="px-4 py-3">{r.scenarios?.title ?? "—"}</td>
                    <td className="px-4 py-3">{percent}%</td>
                    <td className="px-4 py-3">
                      <Badge tone={percent >= 70 ? "green" : percent >= 50 ? "blue" : "red"}>
                        {bandFor(percent)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{riskRatingFor(r.risk_index)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.completed_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/report/${r.id}`} className="text-brand-700 underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
