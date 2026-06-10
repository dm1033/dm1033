import type { Metadata } from "next";
import Link from "next/link";
import FinalCta from "@/components/FinalCta";
import { PageHero, SectionHeading } from "@/components/ui";
import { leadMagnets } from "@/lib/data";
import { plannedTitles, posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Resources — Construction CV, LinkedIn & Career Guides",
  description:
    "Free guides, checklists and articles on construction CVs, LinkedIn optimisation, ATS screening and career moves for engineers, managers and site professionals.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Construction Career Guides & Downloads"
        intro="Free, practical articles and downloadable checklists — written for construction professionals, not generic job-seekers."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Articles" title="Latest Guides" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/resources/${p.slug}`}
              className="group flex flex-col rounded-xl border border-steel-200 bg-white p-7 transition hover:-translate-y-1 hover:border-amber-brand hover:shadow-lg"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-brand">
                {p.readMins} min read
              </p>
              <h2 className="mt-2 text-lg font-bold text-navy-900">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-600">{p.description}</p>
              <span className="mt-4 text-sm font-bold text-amber-brand">Read article →</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-steel-300 bg-steel-50 p-6">
          <h3 className="font-bold text-navy-900">Coming soon</h3>
          <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-sm text-steel-600 sm:grid-cols-2">
            {plannedTitles.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Free downloads"
            title="Checklists, Guides & Worksheets"
            intro="Placeholder PDFs included — final designed versions to follow."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadMagnets.map((m) => (
              <div key={m.slug} className="flex flex-col rounded-xl border border-steel-200 bg-white p-6">
                <h3 className="font-bold text-navy-900">{m.title}</h3>
                <p className="mt-2 flex-1 text-sm text-steel-600">{m.description}</p>
                <a
                  href={m.file}
                  download
                  className="mt-4 inline-block text-sm font-bold text-amber-brand hover:text-navy-800"
                >
                  ⬇ Download PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
