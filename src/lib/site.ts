/**
 * Central site configuration for Construction Career Edge.
 *
 * EVERYTHING that needs replacing before launch lives in this file:
 * Stripe Payment Links, Calendly URL, Formspree form IDs, contact details
 * and placeholder prices. Search for "REPLACE" to find every placeholder.
 */

export const site = {
  name: "Construction Career Edge",
  tagline:
    "CVs, LinkedIn Profiles and Career Coaching for Construction Professionals",
  positioning:
    "Construction CVs, LinkedIn Profiles and Career Coaching — Built by a Civil Engineer Who Understands the Industry",
  // REPLACE with the live domain once purchased (no trailing slash).
  url: "https://www.constructioncareeredge.example",
  email: "david@dmtecs.com",
  // REPLACE with a business phone number, or leave blank to hide.
  phone: "",
  founder: {
    name: "David Miller",
    // Credentials and memberships to be verified before publication.
    credentials: [
      "MSc Construction Management",
      "PMI-CP",
      "IEng / Civil Engineer [confirm exact membership wording]",
      "Tech IOSH [confirm]",
    ],
    yearsExperience: 29,
    linkedin: "https://www.linkedin.com/in/REPLACE_WITH_PROFILE",
  },
  // REPLACE with your Calendly (or equivalent) booking link.
  calendly: "https://calendly.com/REPLACE_WITH_CALENDLY_LINK",
  // REPLACE with your Formspree form endpoints (see docs/FORMS-AND-BOOKING-SETUP.md).
  forms: {
    upload: "https://formspree.io/f/REPLACE_UPLOAD_FORM_ID",
    contact: "https://formspree.io/f/REPLACE_CONTACT_FORM_ID",
    checklist: "https://formspree.io/f/REPLACE_CHECKLIST_FORM_ID",
  },
} as const;

/**
 * Stripe Payment Links — create each product in the Stripe Dashboard and
 * paste the Payment Link URL here (see docs/STRIPE-SETUP.md).
 * NEVER put a Stripe secret key anywhere in this codebase.
 */
export const stripeLinks = {
  cvReview: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
  cvRewrite: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
  linkedin: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
  applicationPack: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
  coachingCall: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
  executiveProfile: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK",
} as const;

/** Placeholder prices — edit freely; "£—" renders as "price on enquiry". */
export const prices = {
  cvReview: "£[insert]",
  cvRewrite: "£[insert]",
  linkedin: "£[insert]",
  applicationPack: "£[insert]",
  coachingCall: "£[insert]",
  executiveProfile: "£[insert]",
  internationalPack: "£[insert]",
  graduatePack: "£[insert]",
} as const;

/** Compliance copy used across the site — keep wording consistent. */
export const compliance = {
  atsDisclaimer:
    "No ethical CV service can guarantee that an ATS or employer will approve an application. The aim is to improve clarity, relevance and screening-readiness.",
  toolDisclaimer:
    "This is an advisory screening-readiness review. It cannot replicate every employer system and cannot guarantee job progression.",
  serviceDisclaimer:
    "The service provides career-document advice, CV writing, LinkedIn optimisation and coaching. It does not provide recruitment services, does not guarantee interviews, does not guarantee job offers and does not guarantee acceptance by any employer, recruiter or automated screening system.",
  consentWording:
    "I confirm I have permission to share this CV and understand that the review is advisory and does not guarantee interviews, offers or selection.",
  credentialsNote:
    "Credentials and memberships to be verified before publication.",
} as const;

export const nav = [
  { label: "Services", href: "/services" },
  { label: "ATS CV Review", href: "/services/ats-cv-review" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About David", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
] as const;
