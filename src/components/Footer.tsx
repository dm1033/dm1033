import Link from "next/link";
import { site, compliance } from "@/lib/site";

const serviceLinks = [
  { label: "CV / Résumé Services", href: "/services/cv-writing" },
  { label: "LinkedIn Optimisation", href: "/services/linkedin-optimisation" },
  { label: "Career Coaching", href: "/services/career-coaching" },
  { label: "ATS-Aware CV Review", href: "/services/ats-cv-review" },
  { label: "International CVs", href: "/services/international-cvs" },
  { label: "Graduate / Junior CVs", href: "/services/graduate-cvs" },
  { label: "Executive Profiles", href: "/services/executive-profiles" },
];

const companyLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About David", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Free CV Checklist", href: "/free-cv-checklist" },
  { label: "Upload CV", href: "/upload-cv" },
  { label: "Book a Call", href: "/book-a-call" },
  { label: "FAQs", href: "/faqs" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-steel-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-amber-brand text-sm font-black text-navy-950">
              CE
            </span>
            <span className="font-bold text-white">{site.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{site.tagline}</p>
          <p className="mt-4 text-sm">
            <a href={`mailto:${site.email}`} className="hover:text-amber-bright">
              {site.email}
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {serviceLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber-bright">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Company</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber-bright">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Legal</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber-bright">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-xs leading-relaxed text-steel-400">
            {compliance.serviceDisclaimer} Final hiring decisions remain with
            employers and recruiters.
          </p>
          <p className="mt-3 text-xs text-steel-500">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
