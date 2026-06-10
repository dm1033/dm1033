import type { Metadata } from "next";
import Link from "next/link";
import AtsChecker from "@/components/AtsChecker";
import FinalCta from "@/components/FinalCta";
import { DisclaimerBox, PageHero, SectionHeading } from "@/components/ui";
import { compliance, prices, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "ATS-Aware CV Review & Free Screening-Readiness Checker",
  description:
    "Free advisory ATS-awareness checker for construction CVs: paste your CV and a job advert to see keyword alignment, formatting risks and evidence gaps — plus a professional human review service.",
};

export default function AtsReviewPage() {
  return (
    <>
      <PageHero
        eyebrow="ATS-Aware CV Review"
        title="Check How Screening-Ready Your Construction CV Is"
        intro="Paste your CV text and a job advert below for an advisory review: keyword alignment, formatting risks, missing evidence prompts and role alignment suggestions. The instant check runs entirely in your browser; an optional AI-powered deep review (with your consent) reads your CV like an experienced construction reviewer."
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <DisclaimerBox title="Advisory tool — please read">
          {compliance.toolDisclaimer} Final hiring decisions remain with
          employers and recruiters. The tool highlights clarity, relevance and
          structure — it does not produce a pass/fail verdict, because no
          honest tool can.
        </DisclaimerBox>
        <div className="mt-8">
          <AtsChecker />
        </div>
      </section>

      <section className="bg-steel-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Go further"
            title="The Professional ATS-Aware CV Review"
            intro="The free checker looks at text patterns. David looks at your career."
          />
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-steel-200 bg-white p-8">
            <p className="text-steel-700">
              The paid review ({prices.cvReview}) is a human expert review of
              your full CV against your target role, covering:
            </p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-steel-700">
              <li>Weaknesses a text scan can&apos;t see — credibility, positioning, seniority signals</li>
              <li>ATS / recruiter-readability check of the actual document file</li>
              <li>Keyword gaps with construction-specific judgement</li>
              <li>Project evidence gaps and what to add</li>
              <li>Layout and formatting issues</li>
              <li>A written 1-page improvement action report</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={stripeLinks.cvReview}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
              >
                Order a CV Review — {prices.cvReview}
              </a>
              <Link
                href="/upload-cv"
                className="rounded border border-navy-600 px-6 py-3 text-sm font-bold text-navy-800 hover:border-amber-brand"
              >
                Upload CV / Enquire First
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-steel-600">
            Want to understand the principles first? Read{" "}
            <Link href="/resources/ats-aware-construction-cv" className="font-semibold underline">
              How to Make a Construction CV More ATS-Aware
            </Link>
            .
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
