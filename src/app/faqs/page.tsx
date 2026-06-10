import type { Metadata } from "next";
import FaqAccordion from "@/components/FaqAccordion";
import FinalCta from "@/components/FinalCta";
import { PageHero } from "@/components/ui";
import { faqs } from "@/lib/data";

export const metadata: Metadata = {
  title: "FAQs — Honest Answers About CV & LinkedIn Services",
  description:
    "Frequently asked questions about construction CV writing, LinkedIn optimisation, ATS screening, turnaround times, confidentiality and what we can and cannot guarantee.",
};

export default function FaqsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="Honest Answers to Common Questions"
        intro="Including the questions other CV services dodge — like what we genuinely can and cannot guarantee."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <FaqAccordion items={[...faqs]} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FinalCta />
    </>
  );
}
