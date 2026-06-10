import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { prices } from "@/lib/site";

export const metadata: Metadata = {
  title: "Graduate & Junior Engineer CVs — First Construction CV",
  description:
    "First construction CVs, placement CVs, LinkedIn starter profiles and interview coaching for graduate engineers, apprentices and junior construction professionals.",
};

export default function GraduatePage() {
  return (
    <ServicePageTemplate
      eyebrow="Graduate / Junior Pack"
      title="Graduate & Junior Engineer CV Pack"
      intro="You don't have a project portfolio yet — but you do have evidence: your degree projects, placements, part-time work, site exposure and the skills behind them. We translate what you've actually done into a credible first construction CV."
      price={prices.graduatePack}
      imageLabel="Graduate engineer on site with tablet"
      whoFor={[
        "Final-year civil engineering and construction management students",
        "Graduates applying to contractor and consultancy schemes",
        "Students seeking placements and years in industry",
        "Apprentices moving into professional roles",
        "Junior engineers writing their first 'real' CV after 1–2 years on site",
      ]}
      included={[
        "First construction CV built around genuine evidence",
        "Placement / year-in-industry CV version",
        "LinkedIn starter profile",
        "Interview coaching session",
        "Skills translation — coursework, part-time jobs and projects into employer language",
      ]}
      sections={[
        {
          heading: "The graduate CV problem",
          body: (
            <p>
              Most graduate CVs list modules and say &quot;hard-working team
              player&quot;. Employers and screening systems are looking for
              something else: evidence of site awareness, health and safety
              understanding, software skills (AutoCAD, Civil 3D, P6, Revit),
              practical projects and the ability to communicate technically. We
              find that evidence in what you&apos;ve already done and present it
              properly — without inventing anything.
            </p>
          ),
        },
        {
          heading: "Graduate scheme screening",
          body: (
            <p>
              Large contractors receive thousands of graduate applications and
              screen heavily. A clearly structured, keyword-aligned,
              evidence-based CV improves how your application reads to both
              software and humans. No service can guarantee progression — but
              you can stop losing out to formatting and vagueness.
            </p>
          ),
        },
      ]}
    />
  );
}
