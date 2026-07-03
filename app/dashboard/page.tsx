import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge, Button, Card } from "@/components/ui";
import { bandFor, percentFor, riskRatingFor } from "@/lib/game/scoring";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <DemoNotice
        title="Delegate dashboard"
        body="Connect Supabase to track your training history. You can still play any scenario in demo mode."
      />
    );
  }

  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = createServerSupabase();
  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("id, total_score, max_score, risk_index, status, completed_at, scenarios(title, sector)")
    .eq("delegate_id", profile.id)
    .order("started_at", { ascending: false });

  const rows = (sessions ?? []) as any[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your dashboard</h1>
          <p className="mt-1 text-slate-600">Welcome, {profile.full_name || profile.email}.</p>
        </div>
        <Link href="/scenarios">
          <Button>Start a new scenario</Button>
        </Link>
      </div>

      <div className="mt-8">
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No sessions yet. <Link href="/scenarios" className="text-brand-700 underline">Play your first scenario.</Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
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
                      <td className="px-4 py-3 font-medium text-slate-800">{r.scenarios?.title ?? "—"}</td>
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
          </Card>
        )}
      </div>
    </div>
  );
}

function DemoNotice({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <Card className="mt-6 p-8">
        <Badge tone="amber" className="mb-3">Demo mode</Badge>
        <p className="text-slate-600">{body}</p>
        <Link href="/scenarios" className="mt-4 inline-block">
          <Button>Play a scenario</Button>
        </Link>
      </Card>
    </div>
  );
}
