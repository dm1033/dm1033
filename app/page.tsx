import Link from "next/link";
import { ShieldCheck, HardHat, FileText, BarChart3, Layers, Building2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { getScenarios } from "@/lib/game/content";

export default async function HomePage() {
  const scenarios = await getScenarios();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center">
        <Badge tone="green" className="mb-4">
          CDM 2015 · SMSTS-aligned · UK construction
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Learn to set up a construction site <span className="text-brand-700">safely</span> — by doing.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          SiteSafe is an interactive training game for UK construction training providers. Delegates
          run real project scenarios, make safety decisions, and see the impact on site layout, risk
          and their Construction Phase Plan.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/scenarios">
            <Button size="lg">Start a scenario</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Create an account
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Feature icon={<HardHat />} title="Decision-driven gameplay" desc="Progress through site set-up stages; every choice changes safety, compliance and score." />
        <Feature icon={<Layers />} title="Live site layout" desc="Watch the site plan and risk index respond to your decisions in real time." />
        <Feature icon={<FileText />} title="Generated CPP" desc="A Construction Phase Plan draft is compiled automatically from the delegate's choices." />
        <Feature icon={<ShieldCheck />} title="Benchmarked scoring" desc="Final report compares each decision against the ideal CDM 2015 control." />
        <Feature icon={<BarChart3 />} title="Trainer dashboards" desc="Trainers track delegate scores and outcomes across their organisation." />
        <Feature icon={<Building2 />} title="Editable content" desc="Admins create and tune scenarios, stages, decisions and scoring." />
      </section>

      {/* Scenario preview */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Five project scenarios</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="blue">{s.sector}</Badge>
                <Badge tone="slate">{s.difficulty}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">{s.summary}</p>
              <Link href={`/play/${s.slug}`} className="mt-4">
                <Button variant="secondary" size="sm" className="w-full">
                  Play scenario
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </Card>
  );
}
