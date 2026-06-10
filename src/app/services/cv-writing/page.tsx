import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { Check } from "@/components/ui";
import { prices, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Construction CV & Résumé Services — Review, Rewrite, Application Pack",
  description:
    "Professional construction CV review, full CV/résumé rewrite and job application packs. ATS-aware, recruiter-readable, keyword-aligned and built on truthful project evidence.",
};

export default function CvWritingPage() {
  return (
    <ServicePageTemplate
      eyebrow="CV / Résumé Services"
      title="Construction CV Review, Rewrite & Application Packs"
      intro="Your CV is your most important career document. We review and rewrite construction CVs so they are clearer, truthful, targeted, recruiter-readable and ATS-aware — built on the real project evidence behind your career."
      price={prices.cvRewrite}
      stripeLink={stripeLinks.cvRewrite}
      imageLabel="Laptop with CV document mockup"
      whoFor={[
        "Civil, site, senior, section and project engineers",
        "Temporary works coordinators, supervisors and designers",
        "Construction, site, project and contracts managers",
        "Quantity surveyors, design managers and planners (incl. Primavera P6)",
        "Health & safety managers, HSE advisers and BIM coordinators",
        "Trades moving into supervision; professionals targeting chartership-aligned CVs",
      ]}
      included={[
        "Professional 2-page CV",
        "Senior technical CV version where appropriate",
        "ATS-friendly plain version for portal uploads",
        "Recruiter-facing summary",
        "Role-specific keyword alignment",
        "Project achievement rewriting — duties become evidence",
        "1 revision round included",
      ]}
      sections={[
        {
          heading: "Option 1 — Construction CV Review",
          body: (
            <>
              <p>
                Not ready for a full rewrite? Start with a professional review of
                your existing CV ({prices.cvReview}). You receive a written
                report covering:
              </p>
              <ul className="mt-4 space-y-2">
                <Check>Identified weaknesses and structural problems</Check>
                <Check>ATS / recruiter-readability check</Check>
                <Check>Keyword gaps against your target role</Check>
                <Check>Project evidence gaps</Check>
                <Check>Layout and formatting issues</Check>
                <Check>A 1-page improvement action report</Check>
              </ul>
            </>
          ),
        },
        {
          heading: "Option 2 — Full CV / Résumé Rewrite",
          body: (
            <p>
              The complete service. We take your existing CV, your target role
              and a structured questionnaire about your real project history,
              and rebuild the document from the ground up: a focused 2-page CV,
              an ATS-friendly plain version for job portals, and a
              recruiter-facing summary. Achievements are rewritten around scope,
              scale, responsibility and outcome — always truthfully.
            </p>
          ),
        },
        {
          heading: "Option 3 — Job Application Pack",
          body: (
            <>
              <p>
                Applying for one specific role that really matters? The
                application pack ({prices.applicationPack}) tailors everything
                to that single advert:
              </p>
              <ul className="mt-4 space-y-2">
                <Check>CV tailored to the role</Check>
                <Check>Matching cover letter</Check>
                <Check>LinkedIn message to the recruiter</Check>
                <Check>Interview preparation notes</Check>
                <Check>Keyword match review against the advert</Check>
              </ul>
            </>
          ),
        },
        {
          heading: "Our ethical standard",
          body: (
            <p>
              Everything is based on truthful career evidence you provide. We do
              not use hidden text, keyword stuffing, invented project values,
              misleading job titles, false chartership claims or any
              AI-deception tricks. A CV that misrepresents you fails at
              interview — and we won&apos;t write one.
            </p>
          ),
        },
      ]}
    />
  );
}
