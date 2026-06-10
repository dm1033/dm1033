export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMins: number;
};

/** Published articles — each has a page under src/app/resources/<slug>/. */
export const posts: Post[] = [
  {
    slug: "ats-aware-construction-cv",
    title: "How to Make a Construction CV More ATS-Aware",
    description:
      "How ATS and AI screening usually work, why construction CVs fail it, and how to structure, format and evidence your CV — ethically.",
    date: "2026-06-01",
    readMins: 12,
  },
  {
    slug: "construction-cv-mistakes",
    title: "10 CV Mistakes Construction Professionals Keep Making",
    description:
      "From 'responsible for' lists to buried project evidence — the most common construction CV mistakes and how to fix each one.",
    date: "2026-06-01",
    readMins: 8,
  },
  {
    slug: "site-engineer-to-project-manager",
    title: "How to Move from Site Engineer to Project Manager",
    description:
      "The experience, evidence and CV positioning that supports a genuine step from site engineering into project management.",
    date: "2026-06-01",
    readMins: 9,
  },
];

/** Planned article titles (full 50-title SEO plan in docs/BLOG-SEO-PLAN.md). */
export const plannedTitles: string[] = [
  "Civil Engineer CV Example: Structure That Works in 2026",
  "Site Manager CV: What Recruiters Actually Look For",
  "Temporary Works CV: Evidencing TWC and TWS Experience",
  "LinkedIn for Civil Engineers: A Profile Recruiters Find",
  "Middle East Construction CV: How Gulf Employers Read CVs",
  "How to Explain Career Gaps on a Construction CV",
  "Best Keywords for Construction CVs (Without Stuffing)",
  "How to Write a Construction Cover Letter That Gets Read",
  "Graduate Site Engineer CV: Your First Construction CV",
  "How to Show Project Achievements on a Construction CV",
  "Singapore Construction Jobs: CV Conventions That Matter",
  "How to Move into Temporary Works Coordination",
];
