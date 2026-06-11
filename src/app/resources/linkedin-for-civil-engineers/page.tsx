import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "LinkedIn for Civil Engineers: A Profile Recruiters Find",
  description:
    "Headline, About and skills for civil engineers — how construction recruiters actually search LinkedIn and the honest profile changes that make you findable.",
};

export default function LinkedinEngineersPage() {
  return (
    <ArticleLayout
      title="LinkedIn for Civil Engineers: A Profile Recruiters Find"
      intro="A large share of engineering roles are filled by recruiter search before they're ever advertised. If your profile says 'Engineer at [Company]' and little else, you are invisible to that entire market."
      date="June 2026"
      readMins={8}
    >
      <h2>How recruiters actually search</h2>
      <p>
        Construction recruiters run keyword searches: job titles
        (&quot;site engineer&quot;, &quot;section engineer&quot;), specialisms
        (&quot;temporary works&quot;, &quot;setting out&quot;), sectors
        (&quot;rail&quot;, &quot;highways&quot;, &quot;data centres&quot;),
        software (&quot;P6&quot;, &quot;Civil 3D&quot;) and qualifications
        (&quot;IEng&quot;, &quot;CSCS&quot;). LinkedIn searches your headline,
        About, job titles, experience text and skills. Words that aren&apos;t
        written down can&apos;t be found — implication doesn&apos;t index.
      </p>

      <h2>The headline formula</h2>
      <p>
        Your headline is your most searched field — a bare job title wastes
        it. Use <strong>role + specialism + sector</strong>:
      </p>
      <ul>
        <li>&quot;Senior Site Engineer | Highways &amp; Structures | Temporary Works | Setting Out&quot;</li>
        <li>&quot;Civil Engineer | Rail &amp; Infrastructure | P6 Planning | Working towards CEng&quot;</li>
      </ul>
      <p>Everything in it must be true — the headline is a claim like any other.</p>

      <h2>The About section</h2>
      <p>
        The first two lines show before &quot;see more&quot; — make them earn
        the click. Then one short paragraph each: your specialism and sectors,
        your strongest project evidence, and your direction. First person,
        natural keywords, no buzzword lists.
      </p>

      <h2>Experience entries that index</h2>
      <p>
        Each role needs more than a title and dates: two lines of context plus
        2-3 evidence bullets naming projects, methods and standards
        truthfully. Critically, <strong>titles and dates must match your CV
        exactly</strong> — recruiters cross-check, and mismatches quietly kill
        trust.
      </p>

      <h2>Skills, settings, activity</h2>
      <ul>
        <li>Fill the skills section with searchable, defensible terms; pin the top three to match your target role.</li>
        <li>Set &quot;Open to work&quot; visible to recruiters only if you&apos;re employed.</li>
        <li>Claim your custom URL and set location and industry correctly.</li>
        <li>One genuine comment on an industry post per week compounds visibility more than any profile tweak.</li>
      </ul>

      <h2>Do it properly once</h2>
      <p>
        Work through the free{" "}
        <Link href="/free-cv-checklist" className="font-semibold underline">
          LinkedIn Profile Checklist
        </Link>{" "}
        — or have the{" "}
        <Link href="/services/linkedin-optimisation" className="font-semibold underline">
          LinkedIn Optimisation service
        </Link>{" "}
        rewrite your headline, About, experience and skills strategy around
        the searches recruiters in your sector actually run.
      </p>
    </ArticleLayout>
  );
}
