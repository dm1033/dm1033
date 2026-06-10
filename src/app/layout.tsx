import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieNotice from "@/components/CookieNotice";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Construction CVs, LinkedIn & Career Coaching`,
    template: `%s | ${site.name}`,
  },
  description:
    "Specialist CV, résumé, LinkedIn and career coaching for civil engineers, construction managers, temporary works professionals and site teams — ATS-aware, recruiter-readable and built on truthful career evidence.",
  keywords: [
    "construction CV writer",
    "civil engineer CV",
    "construction LinkedIn optimisation",
    "construction career coaching",
    "ATS-aware CV",
    "temporary works CV",
    "site manager CV",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | Construction CVs, LinkedIn & Career Coaching`,
    description:
      "Construction CVs, LinkedIn Profiles and Career Coaching — Built by a Civil Engineer Who Understands the Industry.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieNotice />
      </body>
    </html>
  );
}
