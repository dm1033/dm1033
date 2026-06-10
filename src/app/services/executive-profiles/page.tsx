import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { prices, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Executive Construction Profiles — Directors, Consultants & Senior Managers",
  description:
    "Board-level CVs, capability statements, LinkedIn authority profiles and project portfolio summaries for senior construction managers, consultants and directors.",
};

export default function ExecutivePage() {
  return (
    <ServicePageTemplate
      eyebrow="Executive Profiles"
      title="Executive Construction Profile"
      intro="At senior level, a CV is no longer a job application — it's a leadership document. Boards, clients and headhunters read for delivery record, commercial scale, governance and credibility. This service builds the full senior profile set."
      price={prices.executiveProfile}
      stripeLink={stripeLinks.executiveProfile}
      imageLabel="Senior manager reviewing programme on site"
      whoFor={[
        "Operations, regional and framework directors",
        "Senior project and contracts managers stepping up",
        "Construction consultants building a client-facing profile",
        "Interim managers and NED candidates",
        "Senior professionals moving into consultancy",
      ]}
      included={[
        "Board-level CV",
        "Capability statement",
        "LinkedIn authority profile",
        "Project portfolio summary",
        "Board-level career summary",
        "Consulting profile for independent work",
      ]}
      sections={[
        {
          heading: "What changes at executive level",
          body: (
            <p>
              Below senior level, CVs sell competence. At senior level, they
              sell judgement: portfolio value delivered, teams and supply
              chains led, commercial outcomes, safety leadership, client
              relationships and governance. We restructure your record around
              those signals — using real, verifiable delivery history, never
              inflated figures.
            </p>
          ),
        },
        {
          heading: "The consulting profile",
          body: (
            <p>
              Moving into consultancy or interim work? Buyers don&apos;t read
              CVs — they read capability statements. We produce a concise,
              client-facing document covering your services, sectors, delivery
              record and engagement model, plus a LinkedIn profile positioned
              for authority rather than job-seeking.
            </p>
          ),
        },
      ]}
    />
  );
}
