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
  {
    slug: "construction-cv-keywords",
    title: "Best Keywords for Construction CVs (Without Keyword Stuffing)",
    description:
      "The keyword themes recruiters search for by construction role — and how to use them honestly, naturally and effectively.",
    date: "2026-06-11",
    readMins: 7,
  },
  {
    slug: "construction-cover-letter",
    title: "How to Write a Construction Cover Letter That Gets Read",
    description:
      "A short, evidence-led cover letter structure for construction roles — what to include, what to cut, and a worked outline.",
    date: "2026-06-11",
    readMins: 7,
  },
  {
    slug: "middle-east-construction-cv",
    title: "Middle East Construction CV: How Gulf Employers Read CVs",
    description:
      "CV conventions for UAE, Saudi and Qatar construction roles — length, project detail, photos, visa status and mobilisation.",
    date: "2026-06-11",
    readMins: 8,
  },
  {
    slug: "linkedin-for-civil-engineers",
    title: "LinkedIn for Civil Engineers: A Profile Recruiters Find",
    description:
      "Headline, About and skills for civil engineers — how construction recruiters actually search LinkedIn and how to appear.",
    date: "2026-06-11",
    readMins: 8,
  },
  {
    slug: "move-into-temporary-works",
    title: "How to Move into Temporary Works Coordination",
    description:
      "Training, appointments and the evidence trail: a realistic route into temporary works coordination for engineers and supervisors.",
    date: "2026-06-11",
    readMins: 8,
  },
  {
    slug: "explain-career-gaps",
    title: "How to Explain Career Gaps on a Construction CV",
    description:
      "Honest, effective ways to handle career gaps — redundancy, contracting gaps, injury, family and travel — without losing trust.",
    date: "2026-06-11",
    readMins: 6,
  },
  {
    slug: "graduate-site-engineer-cv",
    title: "Graduate Site Engineer CV: Your First Construction CV",
    description:
      "No site experience yet? How graduates evidence projects, placements and skills on a first construction CV that gets shortlisted.",
    date: "2026-06-11",
    readMins: 7,
  },
];

/** Planned article titles (full 50-title SEO plan in docs/BLOG-SEO-PLAN.md). */
export const plannedTitles: string[] = [
  "Civil Engineer CV Example: Structure That Works in 2026",
  "Site Manager CV: What Recruiters Actually Look For",
  "Temporary Works CV: Evidencing TWC and TWS Experience",
  "Singapore Construction Jobs: CV Conventions That Matter",
  "Quantity Surveyor CV: Evidencing Commercial Delivery",
  "Planning Engineer / P6 Planner CV Guide",
  "Do Construction Job Portals Really Reject CVs Automatically?",
  "PDF or Word? The Right File Format for Construction Applications",
  "Breaking into Data Centre Construction",
  "Moving into HV and Energy Infrastructure Roles",
  "How to Position Your CV for Chartership (ICE/CIOB)",
  "Construction Graduate Schemes: How Screening Works",
];
