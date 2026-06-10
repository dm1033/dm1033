import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { PageHero } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Construction Career Edge — questions about CV reviews, rewrites, LinkedIn optimisation or career coaching. Reply usually within one working day.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        intro="Questions about a service, turnaround or whether your situation fits? Send a message — replies usually within one working day."
      />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-5 text-steel-700 lg:col-span-1">
            <div>
              <h2 className="font-bold text-navy-900">Email</h2>
              <a href={`mailto:${site.email}`} className="text-sm underline hover:text-amber-brand">
                {site.email}
              </a>
            </div>
            <div>
              <h2 className="font-bold text-navy-900">LinkedIn</h2>
              <a
                href={site.founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:text-amber-brand"
              >
                Connect with David on LinkedIn
              </a>
            </div>
            <div>
              <h2 className="font-bold text-navy-900">Response time</h2>
              <p className="text-sm">Usually within one working day.</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
