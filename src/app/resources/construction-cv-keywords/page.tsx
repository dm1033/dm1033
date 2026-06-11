import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "Best Keywords for Construction CVs (Without Keyword Stuffing)",
  description:
    "The keyword themes recruiters search for by construction role — and how to use them honestly, naturally and effectively. No stuffing, no tricks.",
};

export default function KeywordsPage() {
  return (
    <ArticleLayout
      title="Best Keywords for Construction CVs (Without Keyword Stuffing)"
      intro="Recruiters and screening systems find CVs through words. If the words that describe your real experience aren't on the page, you don't exist in the search results — no matter how good you are on site."
      date="June 2026"
      readMins={7}
    >
      <h2>What a keyword actually is</h2>
      <p>
        A keyword is simply the term a recruiter types into a search box or a
        system matches against an advert: a job title (&quot;temporary works
        coordinator&quot;), a standard (&quot;BS 5975&quot;, &quot;NEC4&quot;),
        a method (&quot;deep drainage&quot;, &quot;post-tensioning&quot;), a
        software package (&quot;Primavera P6&quot;, &quot;Civil 3D&quot;) or a
        sector (&quot;rail&quot;, &quot;data centres&quot;, &quot;HV&quot;).
        Keyword alignment means naming your genuine experience using the
        industry&apos;s words — nothing more.
      </p>

      <h2>Keyword themes by role</h2>
      <ul>
        <li><strong>Site / civil engineers:</strong> setting out, GPS/total station, earthworks, drainage, reinforced concrete, ITPs, QA records, RAMS, permits, NEC4, AutoCAD, Civil 3D.</li>
        <li><strong>Temporary works:</strong> BS 5975, design briefs, design check categories, falsework, formwork, excavation support, TW register, PAS 8811/8812.</li>
        <li><strong>Site / construction managers:</strong> SMSTS, programme, subcontractor management, short-term planning, quality, safety leadership, handover.</li>
        <li><strong>Project managers:</strong> NEC4/JCT administration, early warnings, compensation events, risk, cost control, stakeholder management.</li>
        <li><strong>Planners:</strong> Primavera P6, Asta, baseline, critical path, EOT, delay analysis, progress reporting.</li>
        <li><strong>H&amp;S:</strong> NEBOSH, IOSH, CDM 2015, audits, incident investigation, behavioural safety, ISO 45001.</li>
      </ul>
      <p>
        The full role-by-role list is in our free{" "}
        <Link href="/free-cv-checklist" className="font-semibold underline">
          Construction Keywords by Role guide
        </Link>.
      </p>

      <h2>The three placement rules</h2>
      <ol>
        <li><strong>Profile line:</strong> your target job title and specialism, stated truthfully.</li>
        <li><strong>Key skills:</strong> the searchable terms you can defend at interview — full name and abbreviation: &quot;Temporary Works Coordinator (TWC)&quot;.</li>
        <li><strong>Experience bullets:</strong> keywords embedded in project evidence, not floating in a list. &quot;Managed 25+ design briefs to BS 5975&quot; beats a bare &quot;BS 5975&quot; every time.</li>
      </ol>

      <h2>Why stuffing backfires</h2>
      <p>
        Repeating phrases unnaturally, pasting the advert into your CV or
        hiding white text isn&apos;t a shortcut — modern systems flag it,
        recruiters spot it instantly, and interviews expose it. Worse, a CV
        optimised for machines but unreadable by humans fails at the step that
        actually matters. One natural, evidenced use of a term is worth more
        than ten repetitions.
      </p>

      <h2>The defensibility test</h2>
      <p>
        Before any keyword goes in, ask: could I talk about this for two
        minutes in an interview with a real example? If yes, it belongs. If
        no, leave it out — no search ranking is worth losing the job at
        interview. Want your keyword alignment checked against a real advert?
        Try the{" "}
        <Link href="/services/ats-cv-review" className="font-semibold underline">
          free checker
        </Link>{" "}
        or get a{" "}
        <Link href="/upload-cv" className="font-semibold underline">
          professional review
        </Link>.
      </p>
    </ArticleLayout>
  );
}
