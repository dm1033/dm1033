import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "How to Write a Construction Cover Letter That Gets Read",
  description:
    "A short, evidence-led cover letter structure for construction roles — what to include, what to cut, and a worked outline you can adapt.",
};

export default function CoverLetterPage() {
  return (
    <ArticleLayout
      title="How to Write a Construction Cover Letter That Gets Read"
      intro="Most cover letters are skimmed in seconds or skipped entirely — which is exactly why a short, specific one stands out. Here's the structure that works for construction roles."
      date="June 2026"
      readMins={7}
    >
      <h2>The job of a cover letter</h2>
      <p>
        It is not a prose version of your CV. Its job is to answer three
        questions the CV can&apos;t: why this role, why this company, and how
        your strongest evidence maps to their biggest requirement. If a
        recruiter reads only the first two sentences, those sentences should
        do the work.
      </p>

      <h2>The four-paragraph structure</h2>
      <ol>
        <li>
          <strong>The hook (2 sentences):</strong> who you are and the single
          most relevant fact. &quot;I&apos;m a Senior Site Engineer with eight
          years on highways structures, currently delivering a £40m scheme —
          and your Project Engineer role on the A executes exactly the kind of
          work I want to lead.&quot;
        </li>
        <li>
          <strong>The evidence match (3-4 sentences):</strong> take the
          advert&apos;s top two requirements and answer each with a specific,
          truthful project example. Mirror their terminology where it
          genuinely applies.
        </li>
        <li>
          <strong>The fit (2 sentences):</strong> something real about the
          company — their project pipeline, sector, values — and why that
          matches your direction. One researched sentence beats three generic
          ones.
        </li>
        <li>
          <strong>The close (1-2 sentences):</strong> availability, notice
          period if asked, and a simple invitation to talk. No begging, no
          guarantees-style hype.
        </li>
      </ol>

      <h2>What to cut</h2>
      <ul>
        <li>&quot;I am writing to apply for…&quot; — they know; start with value</li>
        <li>Repeating your CV chronologically</li>
        <li>Generic adjectives (&quot;dynamic&quot;, &quot;passionate&quot;) without evidence</li>
        <li>Anything you cannot defend at interview</li>
        <li>Anything beyond one page — 250-350 words is the sweet spot</li>
      </ul>

      <h2>Handle the gaps honestly</h2>
      <p>
        The cover letter is the right place to address an obvious mismatch
        head-on: a requirement you partially meet, a sector switch, a career
        gap. One honest, confident sentence (&quot;My tunnelling experience is
        from a TW interface rather than delivery — here&apos;s why it
        transfers&quot;) builds more trust than hoping nobody notices.
      </p>

      <h2>Make it part of the pack</h2>
      <p>
        A tailored CV plus a matching letter plus a short recruiter message is
        the combination that gets applications taken seriously. That&apos;s
        exactly what the{" "}
        <Link href="/services/cv-writing" className="font-semibold underline">
          Job Application Pack
        </Link>{" "}
        delivers for one specific role — or{" "}
        <Link href="/premium" className="font-semibold underline">
          Premium Access
        </Link>{" "}
        drafts a tailored letter automatically for every advert you target.
      </p>
    </ArticleLayout>
  );
}
