import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "10 CV Mistakes Construction Professionals Keep Making",
  description:
    "The most common construction CV mistakes — duty lists, buried project evidence, generic profiles, bad formatting — and how to fix each one honestly.",
};

const mistakes: [string, string][] = [
  [
    "Listing duties instead of achievements",
    "'Responsible for site supervision' describes the job description, not you. Show what you delivered: the project, your specific role, the scale and the outcome.",
  ],
  [
    "Burying project evidence",
    "Recruiters look for named project types, value bands, methods and standards. If your best project is a paragraph on page three, it doesn't exist.",
  ],
  [
    "One generic CV for every application",
    "A CV aimed at everything convinces no one. Keep a master CV, then tailor the profile, key skills and emphasis to each role.",
  ],
  [
    "Vague profiles full of adjectives",
    "'Dynamic, motivated team player' is invisible. 'Senior Site Engineer, 8 years on highways and structures, moving towards project engineering' is a profile.",
  ],
  [
    "Missing the words recruiters search",
    "If you've coordinated temporary works, the words 'temporary works coordinator' must appear — truthfully — or recruiter searches will never find you.",
  ],
  [
    "Graphics-heavy templates",
    "Multi-column designs, skill bars and text boxes can parse badly in screening systems. Keep a plain single-column version for portals.",
  ],
  [
    "Inconsistent qualifications",
    "SMSTS, CSCS, first aid, NRSWA, degree, memberships — list them clearly in one place, with full names and abbreviations.",
  ],
  [
    "Dates that don't add up",
    "Gaps and overlaps that contradict LinkedIn destroy trust instantly. Align everything and explain gaps honestly.",
  ],
  [
    "Four pages and rising",
    "A focused 2-page CV with your strongest evidence beats a complete history. Summarise roles older than 10–15 years.",
  ],
  [
    "Trying to game the system",
    "Hidden white text, keyword stuffing, inflated titles — detectable, unethical and fatal to your credibility when discovered. Honest clarity wins.",
  ],
];

export default function MistakesPage() {
  return (
    <ArticleLayout
      title="10 CV Mistakes Construction Professionals Keep Making"
      intro="Twenty-nine years in the industry, and the same CV problems appear again and again. Here are the ten most damaging — and how to fix each one."
      date="June 2026"
      readMins={8}
    >
      {mistakes.map(([title, body], i) => (
        <section key={title}>
          <h2>
            {i + 1}. {title}
          </h2>
          <p>{body}</p>
        </section>
      ))}
      <p>
        Recognise a few of these?{" "}
        <Link href="/upload-cv" className="font-semibold underline">
          Get a professional CV review
        </Link>{" "}
        — David will tell you honestly which ones apply.
      </p>
    </ArticleLayout>
  );
}
