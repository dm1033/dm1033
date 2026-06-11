import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "Middle East Construction CV: How Gulf Employers Read CVs",
  description:
    "CV conventions for UAE, Saudi and Qatar construction roles — length, project detail, photos, visa status and mobilisation readiness.",
};

export default function MiddleEastPage() {
  return (
    <ArticleLayout
      title="Middle East Construction CV: How Gulf Employers Read CVs"
      intro="A CV that performs well with UK contractors can quietly fail in Dubai, Riyadh or Doha — not because the experience is wrong, but because the document answers the wrong questions."
      date="June 2026"
      readMins={8}
    >
      <h2>What changes in the Gulf</h2>
      <ul>
        <li><strong>Length:</strong> three pages is normal at senior level. Gulf employers want project detail UK recruiters would trim.</li>
        <li><strong>Named projects:</strong> mega-projects and major clients carry real weight — name them (where not confidential), with values and your scope.</li>
        <li><strong>Mobilisation:</strong> state your availability, notice period and readiness to relocate up front. &quot;Available to mobilise within 30 days&quot; answers the first question every Gulf recruiter asks.</li>
        <li><strong>Personal details:</strong> nationality and current location are routinely expected; photos are common (unlike the UK). Optional, but their absence isn&apos;t the signal it is in London.</li>
        <li><strong>Environment evidence:</strong> remote sites, large multinational workforces, extreme-climate delivery and fast-track programmes all read as directly relevant experience.</li>
      </ul>

      <h2>Visa status: state it, always</h2>
      <p>
        Whether you need sponsorship, hold a transferable visa or are applying
        from the UK — say so clearly and truthfully. Disguising visa status
        wastes everyone&apos;s time and can end an application permanently.
        Clear positioning is the strategy that actually works, and it&apos;s
        the only ethical one.
      </p>

      <h2>What stays the same</h2>
      <p>
        Evidence still beats adjectives. The bullet formula — action, scale,
        standard, outcome — works in every market. So does truthfulness: Gulf
        employers reference-check thoroughly, and false project claims on a
        sponsored visa have consequences well beyond a rejected application.
      </p>

      <h2>Family and package wording</h2>
      <p>
        If you&apos;re relocating with family, a single line (&quot;relocating
        with family; family-status package preferred&quot;) sets expectations
        early without negotiating in the CV. Keep salary expectations out of
        the document unless the advert asks.
      </p>

      <h2>One career, two documents</h2>
      <p>
        Keep your UK master CV, then build a Gulf-targeted version: longer,
        project-led, mobilisation-ready. Sending the UK version to Gulf roles
        is the most common reason strong candidates hear nothing back. The{" "}
        <Link href="/services/international-cvs" className="font-semibold underline">
          International CV Pack
        </Link>{" "}
        builds the targeted version for your market — and the free{" "}
        <Link href="/free-cv-checklist" className="font-semibold underline">
          International Construction CV Guide
        </Link>{" "}
        covers the basics.
      </p>
    </ArticleLayout>
  );
}
