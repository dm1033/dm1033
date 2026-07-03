import Link from "next/link";
import { getScenarios } from "@/lib/game/content";
import { Badge, Button, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const scenarios = await getScenarios();
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Choose a scenario</h1>
      <p className="mt-2 text-slate-600">
        Pick a project and work through its safe site set-up. Your decisions shape the layout, risk
        and Construction Phase Plan.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s) => (
          <Card key={s.id} className="flex flex-col p-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="blue">{s.sector}</Badge>
              <Badge tone="slate">{s.difficulty}</Badge>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600">{s.summary}</p>
            <p className="mt-3 text-xs text-slate-400">{s.stages.length} stages</p>
            <Link href={`/play/${s.slug}`} className="mt-3">
              <Button className="w-full">Start</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
