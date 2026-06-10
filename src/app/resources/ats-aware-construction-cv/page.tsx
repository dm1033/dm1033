import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";
import { DisclaimerBox } from "@/components/ui";
import { compliance } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Make a Construction CV More ATS-Aware",
  description:
    "How ATS and AI screening usually work, why construction CVs fail it, and how to structure, format and keyword-align your CV ethically — with project evidence that recruiters trust.",
};

export default function AtsGuidePage() {
  return (
    <ArticleLayout
      title="How to Make a Construction CV More ATS-Aware"
      intro="A practical, honest guide to how screening systems usually work — and how to write a construction CV that both software and recruiters can read properly. No tricks, no hacks, no guarantees."
      date="June 2026"
      readMins={12}
    >
      <h2>1. What ATS means</h2>
      <p>
        ATS stands for Applicant Tracking System — the software employers and
        recruiters use to receive, store, parse and search job applications.
        When you apply through a job portal, your CV is usually converted into
        structured text: contact details, job titles, dates, skills, education.
        Recruiters then search and filter that data, and some systems rank
        applications against the advert. Increasingly, AI-assisted tools
        summarise or score CVs before a human reads them.
      </p>
      <p>
        Two things follow. First, your CV must be machine-parseable — if the
        software can&apos;t extract your job titles and dates, you may be
        invisible regardless of your experience. Second, it must be
        keyword-relevant — if the recruiter searches &quot;temporary works
        coordinator&quot; and those words never appear in your CV, you won&apos;t
        be in the results, even if you&apos;ve done the job for a decade.
      </p>

      <h2>2. Why construction CVs fail screening</h2>
      <ul>
        <li>Job titles that don&apos;t match industry-standard terms (&quot;Engineering Lead — Civils Delivery&quot; instead of &quot;Senior Site Engineer&quot;)</li>
        <li>Project evidence buried in dense paragraphs or missing entirely</li>
        <li>Heavy graphic templates — multi-column layouts, icons, text boxes — that parse badly</li>
        <li>Skills implied but never named: you ran temporary works but the words &quot;temporary works&quot; never appear</li>
        <li>One generic CV sent to every role instead of tailoring</li>
        <li>Key qualifications (SMSTS, CSCS, degree, professional memberships) scattered or abbreviated inconsistently</li>
      </ul>

      <h2>3. How to structure a CV</h2>
      <p>Use a conventional structure that parsers and recruiters both expect:</p>
      <ol>
        <li><strong>Name and contact details</strong> — in the body text, not a header graphic</li>
        <li><strong>Professional profile</strong> — 3–4 lines: who you are, your specialism, your target</li>
        <li><strong>Key skills / competencies</strong> — short, scannable, truthful</li>
        <li><strong>Experience</strong> — reverse chronological, with job title, employer, dates, and project-evidence bullets</li>
        <li><strong>Education and qualifications</strong> — including tickets and professional memberships</li>
      </ol>
      <p>
        Use standard headings (Profile, Experience, Education, Skills).
        Screening systems map sections by these labels; creative headings like
        &quot;My Journey&quot; can break the mapping.
      </p>

      <h2>4. Keywords without keyword stuffing</h2>
      <p>
        Keyword alignment means naming your genuine experience using the
        terminology the industry and the advert actually use — job titles,
        methods, standards, software, sectors. It does not mean repeating
        phrases unnaturally, pasting the advert into your CV, or hiding white
        text (which is unethical, detectable and reputation-ending).
      </p>
      <p>
        The test is simple: every keyword in your CV should be defensible in an
        interview with evidence. If you write &quot;BS 5975&quot;, you should be
        able to talk about applying it.
      </p>

      <h2>5. How to match a job advert</h2>
      <ol>
        <li>Read the advert and list its core requirements and repeated terms.</li>
        <li>For each requirement you genuinely meet, make sure your CV says so explicitly — in the advert&apos;s terminology, backed by a project example.</li>
        <li>Mirror the target job title in your profile line where truthful (&quot;Senior Site Engineer seeking Project Engineer role&quot;).</li>
        <li>Where you don&apos;t meet a requirement, never fake it — address it honestly in the cover letter or accept it&apos;s a stretch role.</li>
      </ol>

      <h2>6. Formatting to avoid</h2>
      <ul>
        <li>Multi-column layouts and text boxes (content can be read out of order or skipped)</li>
        <li>Contact details inside headers, footers or images</li>
        <li>Skill bars, charts and icons in place of words</li>
        <li>Photos and graphics-heavy templates for portal submissions</li>
        <li>Unusual fonts and dense tables</li>
      </ul>
      <p>
        PDFs generally parse well in modern systems, but some portals prefer
        Word. The safe approach: keep a clean designed PDF for humans and a
        plain, single-column ATS-friendly version for portal uploads.
      </p>

      <h2>7. Project evidence</h2>
      <p>
        Construction recruiters trust project evidence above adjectives. For
        each significant role, show: the project (type, sector, approximate
        value band where public), your specific responsibility, the methods or
        systems involved, and the outcome. &quot;Coordinated temporary works on
        a £40m highways scheme, managing 25+ design briefs to BS 5975&quot;
        beats &quot;responsible for temporary works&quot; every time — provided
        it&apos;s true.
      </p>

      <h2>8. LinkedIn alignment</h2>
      <p>
        Recruiters cross-check your CV against LinkedIn. Titles, dates and
        claims should match. LinkedIn is also a search engine of its own —
        the same honest keyword principles apply to your headline, About
        section and experience entries. See our{" "}
        <Link href="/services/linkedin-optimisation" className="font-semibold underline">
          LinkedIn optimisation service
        </Link>{" "}
        for the full approach.
      </p>

      <h2>9. Common mistakes</h2>
      <ul>
        <li>Sending one generic CV to every role</li>
        <li>Listing duties instead of achievements</li>
        <li>Leaving out the words recruiters actually search for</li>
        <li>Four-page CVs with the best evidence on page three</li>
        <li>Inconsistent dates between CV and LinkedIn</li>
        <li>Abbreviating qualifications inconsistently (write both: &quot;Temporary Works Coordinator (TWC)&quot;)</li>
        <li>Trying to trick the system — hidden text, stuffing, inflated titles</li>
      </ul>

      <h2>10. Ethical disclaimer</h2>
      <DisclaimerBox>
        {compliance.atsDisclaimer} Every system is configured differently and
        final hiring decisions remain with employers and recruiters. The
        techniques in this guide improve clarity, structure and honest
        relevance — nothing more, and nothing less is needed.
      </DisclaimerBox>
      <p>
        Want this applied to your CV?{" "}
        <Link href="/services/ats-cv-review" className="font-semibold underline">
          Try the free advisory checker
        </Link>{" "}
        or{" "}
        <Link href="/upload-cv" className="font-semibold underline">
          request a professional review
        </Link>
        .
      </p>
    </ArticleLayout>
  );
}
