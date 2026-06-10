import type { Metadata } from "next";
import Link from "next/link";
import FinalCta from "@/components/FinalCta";
import { PageHero } from "@/components/ui";
import { services } from "@/lib/data";

export const metadata: Metadata = {
  title: "Construction CV, LinkedIn & Career Services",
  description:
    "CV reviews, full rewrites, LinkedIn optimisation, application packs, career coaching, international CVs, graduate packs and executive profiles — all construction-specific.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Construction Career Services"
        intro="Every service is construction-specific, ATS-aware and built on truthful career evidence. Choose the one that fits where you are — or get in touch and David will advise."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.title}
              href={s.slug}
              className="group flex flex-col rounded-xl border border-steel-200 bg-white p-7 transition hover:-translate-y-1 hover:border-amber-brand hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden>{s.icon}</span>
              <h2 className="mt-4 text-lg font-bold text-navy-900">{s.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-600">{s.short}</p>
              <p className="mt-4 font-bold text-navy-900">{s.price}</p>
              <span className="mt-2 text-sm font-bold text-amber-brand">View details →</span>
            </Link>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
