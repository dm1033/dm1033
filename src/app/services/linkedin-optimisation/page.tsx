import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { prices, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "LinkedIn Profile Optimisation for Construction Professionals",
  description:
    "LinkedIn headline, About section, experience and skills strategy for civil engineers, construction managers and site professionals — keyword-aligned for recruiter searches.",
};

export default function LinkedinPage() {
  return (
    <ServicePageTemplate
      eyebrow="LinkedIn Optimisation"
      title="LinkedIn Profiles Recruiters Can Actually Find"
      intro="Construction recruiters search LinkedIn daily for engineers, managers and temporary works professionals. If your profile is thin, generic or missing the right terminology, you don't appear — no matter how good you are on site."
      price={prices.linkedin}
      stripeLink={stripeLinks.linkedin}
      imageLabel="LinkedIn profile mockup on laptop"
      whoFor={[
        "Engineers and managers who get no recruiter approaches",
        "Professionals whose profile is a one-line job history",
        "People moving sectors (e.g. into data centres, rail, energy, HV)",
        "Professionals building visibility before a job search",
        "Senior staff who need an authority profile, not just a CV copy",
      ]}
      included={[
        "Headline rewrite — role, specialism and value, not just a job title",
        "About section rewritten around your real project story",
        "Experience sections rewritten with project evidence",
        "Featured section strategy",
        "Skills strategy aligned to recruiter searches",
        "Recruiter keyword strategy for your target role",
        "Banner text suggestion",
        "Connection message template for approaching recruiters",
      ]}
      sections={[
        {
          heading: "Why LinkedIn matters in construction hiring",
          body: (
            <p>
              A large share of construction roles are filled through recruiter
              search and direct approach before they are ever advertised.
              Recruiters search by job title, sector, qualification and project
              keywords. An optimised profile uses the terminology recruiters
              genuinely search for — truthfully reflecting your experience — so
              you appear in the right searches and look credible when they
              land on your profile.
            </p>
          ),
        },
        {
          heading: "CV and LinkedIn alignment",
          body: (
            <p>
              Recruiters cross-check. If your CV and LinkedIn tell different
              stories — different titles, different dates, different claims —
              trust drops immediately. We align both documents so they
              reinforce each other. Many clients combine this service with a
              CV rewrite; ask about combined pricing.
            </p>
          ),
        },
      ]}
    />
  );
}
