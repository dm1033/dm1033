import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "How to Move from Site Engineer to Project Manager",
  description:
    "The experience, evidence and CV positioning that supports a genuine step from site engineering into construction project management.",
};

export default function CareerMovePage() {
  return (
    <ArticleLayout
      title="How to Move from Site Engineer to Project Manager"
      intro="The most common career question in construction — and the answer is mostly about evidence you may already have."
      date="June 2026"
      readMins={9}
    >
      <h2>The gap you're actually bridging</h2>
      <p>
        Project management isn&apos;t a bigger version of engineering — it&apos;s
        a different axis: programme, commercial awareness, subcontractor
        management, client interface and risk. Employers promoting or hiring
        into PM roles look for early evidence of those behaviours, not just
        technical excellence.
      </p>

      <h2>Build the evidence before the title</h2>
      <ul>
        <li><strong>Programme:</strong> sections of programme you owned, lookaheads you ran, delays you recovered.</li>
        <li><strong>Commercial:</strong> involvement in measures, variations, early warnings, cost reports — even small ones.</li>
        <li><strong>People:</strong> subcontractor coordination, supervising juniors, toolbox talks delivered.</li>
        <li><strong>Client:</strong> progress meetings attended or led, inspection and assurance interfaces.</li>
        <li><strong>Risk and safety:</strong> RAMS reviews, temporary works interfaces, audits supported.</li>
      </ul>
      <p>
        Most site engineers with 4+ years already do several of these. The
        problem is the CV never says so — it&apos;s all setting out and QA
        records.
      </p>

      <h2>Reposition the CV honestly</h2>
      <ol>
        <li>Profile line states the direction: &quot;Senior Site Engineer with programme and subcontractor management experience, progressing towards Project Engineer / PM roles.&quot;</li>
        <li>Re-weight each role's bullets: lead with management-axis evidence, then technical delivery.</li>
        <li>Name the intermediate titles in your search: Project Engineer, Sub Agent, Section Engineer, Assistant Project Manager — these are the realistic next steps in most contractors.</li>
        <li>Add supporting signals truthfully: SMSTS, APM/PMI study, chartership progress, internal PM training.</li>
      </ol>

      <h2>What not to do</h2>
      <p>
        Don&apos;t retitle yourself &quot;Project Manager&quot; because you once
        ran a small package — misleading titles unravel at reference stage.
        The honest version (&quot;led a £2m drainage package within a £30m
        scheme&quot;) is actually more convincing to construction recruiters,
        because it&apos;s specific and checkable.
      </p>

      <h2>Talk it through</h2>
      <p>
        Every situation is different — sector, contractor size and timing all
        change the route. A{" "}
        <Link href="/services/career-coaching" className="font-semibold underline">
          career coaching call
        </Link>{" "}
        maps your specific next step, or a{" "}
        <Link href="/services/cv-writing" className="font-semibold underline">
          CV rewrite
        </Link>{" "}
        repositions the evidence you already have.
      </p>
    </ArticleLayout>
  );
}
