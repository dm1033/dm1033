import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import { PageHero, SectionHeading } from "@/components/ui";
import { processSteps } from "@/lib/data";

export const metadata: Metadata = {
  title: "How It Works — From Upload to Stronger Applications",
  description:
    "The six-step process: upload your CV and target role, get reviewed, identify gaps, rewrite, refine and apply with stronger documents. Typical turnaround 5–7 working days.",
};

const details = [
  "Use the secure upload form to send your current CV, your target role or a job advert, and any deadline. If you ordered a coaching call, you'll book a slot instead.",
  "For reviews and rewrites, David personally reads your documents. For coaching, you talk through your situation live. Either way, you get an honest professional assessment — not a sales pitch.",
  "We identify what's actually holding the document back: missing project evidence, weak or absent keywords, structural problems, formatting that parses badly, or positioning that undersells your seniority.",
  "Documents are rewritten with role-specific structure, ATS-aware formatting, natural keyword alignment and achievement-led project evidence. You may receive a short questionnaire — truthful detail from you is what makes the rewrite strong.",
  "You review every draft. One revision round is included with rewrites; we correct anything inaccurate without question, because the document must be true.",
  "You apply with documents that are clearer, targeted and easier for recruiters and screening systems to read — and you keep editable copies for future tailoring.",
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A Simple, Structured Process"
        intro="From first upload to final documents — here's exactly what happens, step by step. Typical rewrite turnaround is 5–7 working days from receiving your completed information."
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <ol className="space-y-8">
          {processSteps.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-lg font-extrabold text-amber-bright">
                {i + 1}
              </span>
              <div>
                <h2 className="text-xl font-bold text-navy-900">{step.title}</h2>
                <p className="mt-2 leading-relaxed text-steel-700">{details[i]}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-steel-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Data handling"
            title="Your CV Is Personal Data — We Treat It That Way"
          />
          <ul className="mx-auto mt-8 max-w-2xl list-disc space-y-2 pl-5 text-steel-700">
            <li>CVs are transferred over HTTPS and stored securely.</li>
            <li>We only collect the information needed to deliver the service.</li>
            <li>Documents are never shared with third parties without your consent.</li>
            <li>Files are deleted after the agreed retention period.</li>
            <li>You can request deletion of your data at any time.</li>
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
