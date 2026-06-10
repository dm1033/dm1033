import type { Metadata } from "next";
import Link from "next/link";
import FinalCta from "@/components/FinalCta";
import {
  ButtonPrimary,
  ButtonSecondary,
  Check,
  DisclaimerBox,
  ImagePlaceholder,
  SectionHeading,
} from "@/components/ui";
import PricingCard from "@/components/PricingCard";
import { pricingTiers, processSteps, services } from "@/lib/data";
import { compliance, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Construction CVs and LinkedIn Profiles That Get Read Properly | ${site.name}`,
  description:
    "Specialist CV, résumé, LinkedIn and career coaching for civil engineers, construction managers, temporary works professionals and site teams — written by a 29-year construction professional.",
};

const trustItems = [
  "MSc Construction Management",
  "PMI-CP",
  "29 years' construction experience",
  "Civil engineering background",
  "Temporary works & infrastructure specialist",
  "UK and international career positioning",
];

const problems = [
  ["Recruiters scan quickly", "Most CVs get seconds, not minutes. If your value isn't obvious immediately, it's missed."],
  ["Job portals use keyword matching", "Portals and screening software rank applications against role keywords before a human ever reads them."],
  ["AI screening can reject weak structure", "Poorly structured applications may be filtered out — not because the experience is missing, but because it can't be found."],
  ["Generic CVs lose against targeted CVs", "One CV for every job means you're competing against candidates whose documents speak directly to the role."],
  ["Technical value gets undersold", "Construction professionals routinely understate temporary works, HV, programme and safety expertise."],
  ["Project evidence is buried", "Scope, scale, responsibility and outcomes are exactly what recruiters look for — and exactly what's usually missing."],
  ["Duties listed, achievements missing", "'Responsible for…' lists tell a recruiter what your job description said — not what you actually delivered."],
];

const solutions = [
  "Role-specific CV structure",
  "ATS-aware formatting",
  "Construction keyword alignment",
  "Achievement rewriting",
  "Project evidence",
  "LinkedIn optimisation",
  "Recruiter approach messages",
  "Interview preparation",
];

const atsPoints = [
  "Use standard headings screening systems recognise",
  "Include your target job titles where truthful",
  "Include relevant keywords naturally — never stuffed",
  "Show project evidence: scope, scale, responsibility, outcomes",
  "Avoid graphics-heavy CVs for job portal submissions",
  "Keep formatting simple and parseable",
  "Match role requirements honestly",
  "Include measurable outcomes where you can evidence them",
  "Keep both a human-readable and an ATS-friendly version",
];

export default function HomePage() {
  return (
    <>
      {/* 1. HERO */}
      <section className="bg-blueprint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-amber-bright">
                {site.tagline}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Construction CVs and LinkedIn Profiles That Get{" "}
                <span className="text-amber-bright">Read Properly</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-steel-200">
                Specialist CV, résumé, LinkedIn and career coaching for civil
                engineers, construction managers, temporary works professionals
                and site teams — written by a 29-year construction professional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonPrimary href="/upload-cv">Get a CV Review</ButtonPrimary>
                <ButtonSecondary href="/services" light>View Services</ButtonSecondary>
                <ButtonSecondary href="/book-a-call" light>Book a Career Call</ButtonSecondary>
              </div>
            </div>
            <ImagePlaceholder
              label="Engineer reviewing drawings on site (hero image)"
              className="hidden h-96 lg:flex"
            />
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-navy-800 bg-navy-950/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
            {trustItems.map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm font-medium text-steel-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-brand" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. PROBLEM */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Your Experience Is Valuable — But Your CV May Not Be Showing It"
          intro="Construction hiring is increasingly filtered by recruiters, job boards and AI/ATS screening before a human ever reads your application."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-steel-200 bg-white p-6">
              <h3 className="font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SOLUTION */}
      <section className="bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="The solution"
            title="We Turn Construction Experience Into Clear, Evidence-Based Career Documents"
            intro="Truthful, targeted, recruiter-readable and ATS-aware — built around your real project work, not generic templates."
          />
          <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
            <ImagePlaceholder label="CV document and LinkedIn profile mockups" className="h-80" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {solutions.map((s) => (
                <Check key={s}>
                  <span className="font-medium text-navy-900">{s}</span>
                </Check>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SERVICES GRID */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" id="services">
        <SectionHeading
          eyebrow="Services"
          title="Specialist Services for Construction Careers"
          intro="From a single CV review to a full executive profile — every service is construction-specific."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.title}
              href={s.slug}
              className="group flex flex-col rounded-xl border border-steel-200 bg-white p-6 transition hover:-translate-y-1 hover:border-amber-brand hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden>{s.icon}</span>
              <h3 className="mt-4 font-bold text-navy-900 group-hover:text-navy-700">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-600">{s.short}</p>
              <span className="mt-4 text-sm font-bold text-amber-brand">Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. WHY DAVID */}
      <section className="bg-blueprint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ImagePlaceholder
              label="Professional headshot — David Miller"
              className="h-96 border-steel-600"
            />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-amber-bright">Why David</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Built by Someone Who Understands Construction
              </h2>
              <p className="mt-5 leading-relaxed text-steel-200">
                Most CV writers have never set foot on site. David Miller has
                spent 29 years in civil engineering, construction management,
                temporary works, HV infrastructure, safety, training and
                consultancy. He understands site language, technical roles and
                contractor expectations — and how to translate real project
                work into credible CV evidence.
              </p>
              <ul className="mt-6 space-y-2.5 text-steel-200">
                <Check>29 years in construction</Check>
                <Check>Civil engineering and temporary works background</Check>
                <Check>MSc Construction Management</Check>
                <Check>PMI-CP</Check>
                <Check>IEng — Incorporated Engineer, Institution of Civil Engineers (ICE)</Check>
                <Check>Project management, safety, HV infrastructure, training and consultancy experience</Check>
              </ul>
              <div className="mt-7">
                <ButtonPrimary href="/about">More About David</ButtonPrimary>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ATS-AWARE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="ATS-aware"
          title="Make Your CV Easier for Screening Systems and Recruiters to Understand"
          intro="No tricks, no hidden text, no keyword stuffing — just clear structure, honest keyword alignment and real project evidence."
        />
        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <ul className="space-y-3 text-steel-700">
            {atsPoints.map((p) => (
              <Check key={p}>{p}</Check>
            ))}
          </ul>
          <div className="space-y-6">
            <ImagePlaceholder label="ATS scan / CV screening illustration" className="h-56" />
            <DisclaimerBox>{compliance.atsDisclaimer}</DisclaimerBox>
            <Link
              href="/resources/ats-aware-construction-cv"
              className="inline-block font-bold text-navy-800 underline hover:text-amber-brand"
            >
              Read the full guide: How to Make a Construction CV More ATS-Aware →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="A Simple, Structured Process"
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {processSteps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-steel-200 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 font-extrabold text-amber-bright">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-600">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <ButtonSecondary href="/how-it-works">See the Full Process</ButtonSecondary>
          </div>
        </div>
      </section>

      {/* 8. PRICING PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Clear, Fixed-Fee Services"
          intro="No subscriptions, no surprises. Pay securely with Stripe."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonSecondary href="/pricing">Full Pricing Details</ButtonSecondary>
        </div>
      </section>

      {/* 9. LEAD MAGNET */}
      <section className="bg-navy-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-amber-bright">Free download</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Download the Construction CV Checklist
              </h2>
              <p className="mt-4 text-steel-200">
                A practical, free pack to improve your CV today:
              </p>
              <ul className="mt-5 space-y-2.5 text-steel-200">
                <Check>20-point CV checklist</Check>
                <Check>ATS-aware formatting guide</Check>
                <Check>LinkedIn profile checklist</Check>
                <Check>Construction keywords guide</Check>
                <Check>Project evidence worksheet</Check>
              </ul>
              <div className="mt-7">
                <ButtonPrimary href="/free-cv-checklist">Get the Free Checklist</ButtonPrimary>
              </div>
            </div>
            <ImagePlaceholder
              label="Notebook / checklist visual"
              className="hidden h-80 border-steel-600 lg:flex"
            />
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <FinalCta />
    </>
  );
}
