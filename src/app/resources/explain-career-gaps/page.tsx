import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "How to Explain Career Gaps on a Construction CV",
  description:
    "Honest, effective ways to handle career gaps on a construction CV — redundancy, contracting gaps, injury, family and travel — without losing recruiter trust.",
};

export default function CareerGapsPage() {
  return (
    <ArticleLayout
      title="How to Explain Career Gaps on a Construction CV"
      intro="Gaps aren't the problem — unexplained gaps are. Recruiters scan dates first, and a silent hole invites the worst assumption. One honest line removes the question entirely."
      date="June 2026"
      readMins={6}
    >
      <h2>Why silence backfires</h2>
      <p>
        Construction recruiters cross-check dates between your CV, LinkedIn
        and references. A gap you don&apos;t mention looks like a gap
        you&apos;re hiding; the imagined reason is usually worse than the real
        one. Never stretch dates to paper over it — that&apos;s the kind of
        small dishonesty that unravels at reference stage and taints
        everything else on the page.
      </p>

      <h2>The one-line method</h2>
      <p>
        Treat the gap like an entry: dates plus a single factual line. No
        apology, no essay.
      </p>
      <ul>
        <li>&quot;2023 – 2024 · Career break — primary carer for a family member. Returned to site March 2024.&quot;</li>
        <li>&quot;2022 · Between contracts following project completion; completed SMSTS refresher and P6 training during this period.&quot;</li>
        <li>&quot;2021 · Recovery from injury (fully resolved); maintained CPD and tickets throughout.&quot;</li>
        <li>&quot;2019 – 2020 · Travel career break. Returned with [employer] January 2020.&quot;</li>
      </ul>

      <h2>Contracting gaps are normal — frame them that way</h2>
      <p>
        Freelance and contract professionals have natural gaps between
        schemes. Group short contracts under one heading (&quot;Freelance Site
        Engineer — various contractors, 2020 – present&quot;) with project
        bullets beneath, and gaps between contracts stop looking like gaps at
        all.
      </p>

      <h2>Redundancy isn't a confession</h2>
      <p>
        Redundancies follow project pipelines in this industry and every
        recruiter knows it. &quot;Role ended on completion of the scheme&quot;
        or &quot;departed in company-wide restructure&quot; is sufficient —
        factual, unemotional, done.
      </p>

      <h2>Fill what you can, honestly</h2>
      <p>
        Anything genuinely done during a gap strengthens the line: tickets
        renewed, courses completed, voluntary work, family business. One
        truthful specific beats a vague &quot;personal development&quot;.
        Longer gaps may deserve a sentence in the{" "}
        <Link href="/resources/construction-cover-letter" className="font-semibold underline">
          cover letter
        </Link>{" "}
        instead — confident, brief, forward-looking.
      </p>

      <h2>When the gap feels bigger than the CV</h2>
      <p>
        Returning after years away is a positioning question, not just a
        formatting one. A{" "}
        <Link href="/services/career-coaching" className="font-semibold underline">
          coaching call
        </Link>{" "}
        plans the return story; a{" "}
        <Link href="/services/cv-writing" className="font-semibold underline">
          professional rewrite
        </Link>{" "}
        builds the document around your strongest current evidence.
      </p>
    </ArticleLayout>
  );
}
