import { notFound } from "next/navigation";
import { getScenarioBySlug } from "@/lib/game/content";
import { getProfile } from "@/lib/supabase/auth";
import { GamePlayer } from "@/components/GamePlayer";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: { slug: string } }) {
  const scenario = await getScenarioBySlug(params.slug);
  if (!scenario) notFound();

  const profile = await getProfile();
  const delegateName = profile?.full_name || profile?.email || "Guest delegate";

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge tone="blue">{scenario.sector}</Badge>
          <Badge tone="slate">{scenario.difficulty}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{scenario.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{scenario.description}</p>
      </div>

      <GamePlayer scenario={scenario} delegateName={delegateName} />
    </div>
  );
}
