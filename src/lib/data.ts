import { prices, stripeLinks } from "./site";

export type Service = {
  slug: string;
  title: string;
  short: string;
  icon: string;
  price: string;
  stripeLink?: string;
  features: string[];
};

export const services: Service[] = [
  {
    slug: "/services/cv-writing#review",
    title: "Construction CV Review",
    short:
      "A professional review of your existing CV: weaknesses, keyword gaps, project-evidence gaps and an action report.",
    icon: "🔍",
    price: prices.cvReview,
    stripeLink: stripeLinks.cvReview,
    features: [
      "Full review of your existing CV",
      "ATS/recruiter-readability check",
      "Keyword gap review against your target role",
      "Project evidence gap analysis",
      "Layout and formatting comments",
      "1-page improvement action report",
    ],
  },
  {
    slug: "/services/cv-writing",
    title: "Full CV / Résumé Rewrite",
    short:
      "A complete professional rewrite: 2-page CV, ATS-friendly version, recruiter-facing summary and keyword alignment.",
    icon: "📄",
    price: prices.cvRewrite,
    stripeLink: stripeLinks.cvRewrite,
    features: [
      "Professional 2-page CV",
      "Senior technical CV version where appropriate",
      "ATS-friendly plain version",
      "Recruiter-facing summary",
      "Role-specific keyword alignment",
      "Project achievement rewriting",
      "1 revision included",
    ],
  },
  {
    slug: "/services/linkedin-optimisation",
    title: "LinkedIn Profile Optimisation",
    short:
      "Headline, About section, experience, skills and recruiter keyword strategy — built for construction recruiter searches.",
    icon: "💼",
    price: prices.linkedin,
    stripeLink: stripeLinks.linkedin,
    features: [
      "Headline rewrite",
      "About section rewrite",
      "Experience sections rewritten",
      "Featured section advice",
      "Skills strategy",
      "Recruiter search keyword plan",
      "Banner text and connection message template",
    ],
  },
  {
    slug: "/services/cv-writing#application-pack",
    title: "Job Application Pack",
    short:
      "Everything for one specific role: tailored CV, cover letter, recruiter message and interview preparation notes.",
    icon: "🎯",
    price: prices.applicationPack,
    stripeLink: stripeLinks.applicationPack,
    features: [
      "CV tailored to one specific role",
      "Matching cover letter",
      "LinkedIn message to the recruiter",
      "Interview preparation notes",
      "Job advert keyword match review",
    ],
  },
  {
    slug: "/services/career-coaching",
    title: "Construction Career Coaching",
    short:
      "Career direction calls: routes into management, temporary works, HV/energy, overseas roles and chartership positioning.",
    icon: "🧭",
    price: prices.coachingCall,
    stripeLink: stripeLinks.coachingCall,
    features: [
      "45 or 60-minute career direction call",
      "Route into management or temporary works",
      "Route into HV / energy / utilities",
      "Overseas relocation positioning",
      "Chartership / professional membership profile support",
      "Salary and role targeting with written action plan",
    ],
  },
  {
    slug: "/services/international-cvs",
    title: "International / Middle East / Singapore CV Pack",
    short:
      "Location-targeted CV and relocation profile for UK professionals going overseas, or international engineers entering the UK.",
    icon: "🌍",
    price: prices.internationalPack,
    features: [
      "Location-targeted CV",
      "Relocation profile",
      "Family relocation wording where relevant",
      "Employer sponsorship positioning",
      "Major projects / infrastructure emphasis",
    ],
  },
  {
    slug: "/services/executive-profiles",
    title: "Executive Construction Profile",
    short:
      "Board-level CV, capability statement, LinkedIn authority profile and project portfolio for senior managers and directors.",
    icon: "🏛️",
    price: prices.executiveProfile,
    stripeLink: stripeLinks.executiveProfile,
    features: [
      "Board-level CV",
      "Capability statement",
      "LinkedIn authority profile",
      "Project portfolio summary",
      "Consulting profile",
    ],
  },
  {
    slug: "/services/graduate-cvs",
    title: "Graduate / Junior Engineer Pack",
    short:
      "First construction CV, placement CV, LinkedIn starter profile, interview coaching and skills translation.",
    icon: "🎓",
    price: prices.graduatePack,
    features: [
      "First construction CV",
      "Placement / year-in-industry CV",
      "LinkedIn starter profile",
      "Interview coaching",
      "Skills translation from study and part-time work",
    ],
  },
];

export type PricingTier = {
  name: string;
  price: string;
  description: string;
  features: string[];
  stripeLink: string;
  highlighted?: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Starter CV Review",
    price: prices.cvReview,
    description: "For people who want a professional review only.",
    features: [
      "CV review",
      "ATS-aware formatting comments",
      "Keyword gap review",
      "Recruiter-readability comments",
      "1-page action report",
    ],
    stripeLink: stripeLinks.cvReview,
  },
  {
    name: "Professional CV Rewrite",
    price: prices.cvRewrite,
    description: "A complete rewrite built around your target role.",
    features: [
      "Full CV rewrite",
      "ATS-friendly version",
      "Recruiter-ready version",
      "Achievement rewriting",
      "Role keyword alignment",
      "1 revision",
    ],
    stripeLink: stripeLinks.cvRewrite,
    highlighted: true,
  },
  {
    name: "LinkedIn Optimisation",
    price: prices.linkedin,
    description: "Make your profile findable and credible to recruiters.",
    features: [
      "Headline",
      "About section",
      "Experience rewrite",
      "Skills strategy",
      "Featured section advice",
      "Recruiter search keyword plan",
    ],
    stripeLink: stripeLinks.linkedin,
  },
  {
    name: "CV + LinkedIn Bundle",
    price: prices.cvLinkedinBundle,
    description: "The full rewrite and LinkedIn optimisation together — aligned documents, one process.",
    features: [
      "Everything in Professional CV Rewrite",
      "Everything in LinkedIn Optimisation",
      "CV and LinkedIn fully aligned (titles, dates, claims)",
      "One combined questionnaire and revision round",
      "Priority over single-service orders",
    ],
    stripeLink: stripeLinks.cvLinkedinBundle,
  },
  {
    name: "Job Application Pack",
    price: prices.applicationPack,
    description: "Everything you need for one specific application.",
    features: [
      "Role-targeted CV",
      "Cover letter",
      "LinkedIn recruiter message",
      "Interview talking points",
      "Job advert keyword alignment",
    ],
    stripeLink: stripeLinks.applicationPack,
  },
  {
    name: "Coaching Call",
    price: prices.coachingCall,
    description: "A focused 45 or 60-minute career strategy session.",
    features: [
      "45 or 60-minute career call",
      "Written action plan",
      "Target role strategy",
      "Application plan",
    ],
    stripeLink: stripeLinks.coachingCall,
  },
  {
    name: "Executive Construction Profile",
    price: prices.executiveProfile,
    description: "For senior managers, consultants and directors.",
    features: [
      "Senior / board-level CV",
      "LinkedIn profile",
      "Capability statement",
      "Project portfolio summary",
      "Consulting profile",
    ],
    stripeLink: stripeLinks.executiveProfile,
  },
];

export const processSteps = [
  {
    title: "Upload your CV and target role",
    body: "Send your current CV plus the job advert or role type you are aiming for, using the secure upload form.",
  },
  {
    title: "Receive your review or book a call",
    body: "You get a written review, or we talk through your situation on a career call — whichever you ordered.",
  },
  {
    title: "Identify gaps and positioning",
    body: "We pinpoint missing project evidence, weak keywords, structural problems and how to position you honestly for the role.",
  },
  {
    title: "Rewrite CV / LinkedIn / application pack",
    body: "Your documents are rewritten with role-specific structure, ATS-aware formatting and truthful, evidence-based achievements.",
  },
  {
    title: "Review and refine",
    body: "You review the drafts and request a revision. Nothing goes out until you are satisfied it is accurate.",
  },
  {
    title: "Apply with stronger documents",
    body: "Apply with documents that are clearer, more targeted and easier for recruiters and screening systems to read.",
  },
] as const;

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Can you guarantee my CV will pass ATS screening?",
    a: "No — and no ethical CV service can. Every employer configures their systems differently, and final decisions always rest with employers and recruiters. What we do is make your CV ATS-aware: clearly structured, keyword-aligned to the role and easy for both software and humans to parse. That improves clarity and relevance; it cannot guarantee selection.",
  },
  {
    q: "Will this get me more interviews?",
    a: "We cannot guarantee interviews or job offers — anyone who promises that is misleading you. A clearer, better-targeted, evidence-based CV gives recruiters a more accurate picture of your real experience, which is the honest foundation for any application.",
  },
  {
    q: "Do you invent achievements or inflate job titles?",
    a: "Never. Everything in your rewritten CV is based on truthful career evidence you provide. We help you surface and articulate real project work you may be underselling — we do not fabricate qualifications, experience, project values or titles.",
  },
  {
    q: "Do you use hidden keywords or 'white text' tricks?",
    a: "No. Hidden text, keyword stuffing and AI-deception tricks are unethical, are detected by modern systems and can destroy your credibility with a recruiter. We use natural, relevant keyword alignment based on your genuine experience.",
  },
  {
    q: "What construction roles do you cover?",
    a: "Civil, site, senior, section and project engineers; temporary works coordinators, supervisors and designers; construction, site, project and contracts managers; quantity surveyors; design managers; H&S managers and HSE advisers; planners (including Primavera P6); BIM coordinators; graduates and apprentices; trades moving into supervision; and senior managers and directors.",
  },
  {
    q: "Do you cover international roles?",
    a: "Yes. We prepare location-targeted CVs for UK professionals applying to the Middle East, Singapore and other overseas markets, and for international engineers applying to UK roles — including sponsorship positioning and relocation wording.",
  },
  {
    q: "How long does a CV rewrite take?",
    a: "Typical turnaround is 5–7 working days from receiving your documents and completed questionnaire. Urgent turnarounds may be available — ask before ordering.",
  },
  {
    q: "What do you need from me?",
    a: "Your current CV, your target role or a job advert, and honest answers about your projects: what you did, the scale, your responsibility and outcomes. The more truthful detail you give, the stronger the evidence in your CV.",
  },
  {
    q: "Is my CV kept confidential?",
    a: "Yes. CVs contain personal data and are handled under our privacy policy: collected only for the service, stored securely, never shared with third parties without your consent, and deleted after the agreed retention period. You can request deletion at any time.",
  },
  {
    q: "What if I'm not happy with the result?",
    a: "Each rewrite includes a revision round. If something is inaccurate or doesn't reflect your experience, we fix it. See the refund policy for full details of what is and isn't refundable for a personalised written service.",
  },
];

export type LeadMagnet = {
  slug: string;
  title: string;
  description: string;
  file: string;
};

export const leadMagnets: LeadMagnet[] = [
  {
    slug: "construction-cv-checklist",
    title: "Construction CV Checklist",
    description: "A 20-point checklist covering structure, evidence, keywords and formatting for construction CVs.",
    file: "/downloads/construction-cv-checklist.pdf",
  },
  {
    slug: "ats-aware-formatting-guide",
    title: "ATS-Aware CV Formatting Guide",
    description: "How to format a CV so screening systems and recruiters can actually read it.",
    file: "/downloads/ats-aware-formatting-guide.pdf",
  },
  {
    slug: "linkedin-profile-checklist",
    title: "LinkedIn Profile Checklist for Construction Professionals",
    description: "Headline, About, experience, skills and settings — section by section.",
    file: "/downloads/linkedin-profile-checklist.pdf",
  },
  {
    slug: "project-achievement-worksheet",
    title: "Project Achievement Worksheet",
    description: "Turn 'responsible for' duties into truthful, measurable project achievements.",
    file: "/downloads/project-achievement-worksheet.pdf",
  },
  {
    slug: "construction-keywords-by-role",
    title: "Construction Keywords by Role",
    description: "Relevant keyword themes for engineers, managers, planners, QS, H&S and temporary works roles.",
    file: "/downloads/construction-keywords-by-role.pdf",
  },
  {
    slug: "interview-star-worksheet",
    title: "Interview STAR Answer Worksheet",
    description: "Prepare structured, evidence-based answers to construction interview questions.",
    file: "/downloads/interview-star-worksheet.pdf",
  },
  {
    slug: "international-cv-guide",
    title: "International Construction CV Guide",
    description: "Adapting your CV for the Middle East, Singapore and other overseas markets.",
    file: "/downloads/international-cv-guide.pdf",
  },
  {
    slug: "graduate-site-engineer-cv-guide",
    title: "Graduate Site Engineer CV Guide",
    description: "Your first construction CV: what to include when you have little site experience.",
    file: "/downloads/graduate-site-engineer-cv-guide.pdf",
  },
  {
    slug: "temporary-works-career-checklist",
    title: "Temporary Works Career Profile Checklist",
    description: "Evidencing TWC/TWS/TW design experience for your CV and LinkedIn.",
    file: "/downloads/temporary-works-career-checklist.pdf",
  },
  {
    slug: "construction-manager-cv-checklist",
    title: "Construction Manager CV Checklist",
    description: "What a construction/site manager CV must show: delivery, safety, commercial and people.",
    file: "/downloads/construction-manager-cv-checklist.pdf",
  },
];
