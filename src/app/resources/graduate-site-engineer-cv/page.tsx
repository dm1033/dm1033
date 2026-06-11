import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "Graduate Site Engineer CV: Your First Construction CV",
  description:
    "No site experience yet? How graduates evidence projects, placements and transferable skills on a first construction CV that gets shortlisted.",
};

export default function GraduateCvPage() {
  return (
    <ArticleLayout
      title="Graduate Site Engineer CV: Your First Construction CV"
      intro="'I don't have any experience' is almost never true. You have evidence — final-year projects, placements, part-time work, site visits — it's just not written in the language employers scan for."
      date="June 2026"
      readMins={7}
    >
      <h2>What graduate recruiters actually scan for</h2>
      <ul>
        <li>Evidence of genuine interest in construction (not a scattergun application)</li>
        <li>Any site exposure at all — placements, visits, labouring summers</li>
        <li>Health and safety awareness</li>
        <li>Software: AutoCAD, Civil 3D, Revit, P6, Excel</li>
        <li>Practical projects with a deliverable, a deadline and a team</li>
        <li>Communication — because graduate engineers write records, emails and RFIs from day one</li>
      </ul>

      <h2>Treat your final-year project like a job</h2>
      <p>
        It had a brief, constraints, analysis, a deliverable and a deadline —
        write it that way: &quot;Designed a reinforced concrete footbridge to
        Eurocode 2 (final-year project): structural analysis in [software],
        full calculation package, presented to assessors — graded 78%.&quot;
        That bullet contains four searchable, defensible signals.
      </p>

      <h2>Translate part-time work — honestly</h2>
      <ul>
        <li>Bar/retail shifts → working under pressure, customer communication, reliability</li>
        <li>Team captaincy / society roles → organisation and leadership evidence</li>
        <li>Group design projects → coordination, deadlines, technical compromise</li>
      </ul>
      <p>
        Translation isn&apos;t inflation: &quot;supervised two junior staff on
        weekend shifts&quot; is evidence; &quot;leadership experience&quot;
        with nothing behind it is noise.
      </p>

      <h2>The structure (1.5–2 pages)</h2>
      <ol>
        <li>Contact details and a 3-line profile: degree, target role, sector interest</li>
        <li>Education — relevant modules only, dissertation topic, grade if strong</li>
        <li>Placements and work experience — site exposure first</li>
        <li>Projects — final-year and group work as evidence entries</li>
        <li>Skills — software, surveying kit, lab work</li>
        <li>Extras that signal seriousness: CSCS card, ICE student membership, site visits</li>
      </ol>

      <h2>Graduate scheme screening is real — so is the fix</h2>
      <p>
        Major contractors screen thousands of applications with the same
        keyword and structure logic as any other role — the principles in our{" "}
        <Link href="/resources/ats-aware-construction-cv" className="font-semibold underline">
          ATS-aware guide
        </Link>{" "}
        apply in full. No service can guarantee progression, but you can stop
        losing to vagueness and formatting. The free{" "}
        <Link href="/free-cv-checklist" className="font-semibold underline">
          Graduate Site Engineer CV Guide
        </Link>{" "}
        covers the details, and the{" "}
        <Link href="/services/graduate-cvs" className="font-semibold underline">
          Graduate Pack
        </Link>{" "}
        builds the whole first-CV set with interview coaching included.
      </p>
    </ArticleLayout>
  );
}
