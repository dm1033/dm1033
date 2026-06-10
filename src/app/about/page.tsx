import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import { Check, ImagePlaceholder, PageHero } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About David Miller — 29 Years in Construction",
  description:
    "David Miller: MSc Construction Management, PMI-CP, 29 years across civil engineering, construction management, temporary works, HV infrastructure, safety, training and consultancy.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About David"
        title="Built by Someone Who Understands Construction"
        intro="Most CV writers have never set foot on site. David Miller has spent 29 years in the industry — and that changes what your CV can say."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <ImagePlaceholder label="Professional headshot — David Miller" className="h-96 w-full" />
            <div className="mt-8 rounded-xl border border-steel-200 bg-white p-6">
              <h2 className="font-bold text-navy-900">Credentials</h2>
              <ul className="mt-4 space-y-2.5 text-steel-700">
                {site.founder.credentials.map((c) => (
                  <Check key={c}>{c}</Check>
                ))}
                <Check>29 years&apos; construction experience</Check>
              </ul>
            </div>
          </div>

          <div className="space-y-6 leading-relaxed text-steel-700">
            <h2 className="text-2xl font-extrabold text-navy-900">
              29 years of real construction experience
            </h2>
            <p>
              David Miller has spent 29 years working in civil engineering,
              construction management, temporary works, HV infrastructure,
              safety, training and consultancy. He has worked the roles your CV
              is describing — setting out on site, coordinating temporary
              works, managing programmes, leading safety and training, and
              advising as a consultant.
            </p>
            <p>
              That matters because translating construction experience into a
              credible career document is a technical job. A generalist CV
              writer doesn&apos;t know the difference between a TWS and a TWC,
              why a 132kV cable route crossing matters, or what a contracts
              manager actually controls. David does — which means your real
              value gets onto the page in language recruiters and hiring
              managers recognise.
            </p>
            <h3 className="text-xl font-bold text-navy-900">What David brings to your documents</h3>
            <ul className="space-y-2.5">
              <Check>Understands site language, technical roles and contractor expectations</Check>
              <Check>Translates real project work into credible CV evidence</Check>
              <Check>Knows what recruiters in civils, infrastructure, energy and temporary works look for</Check>
              <Check>Experience across UK and international project environments</Check>
              <Check>Training and consultancy background — explains, not just edits</Check>
            </ul>
            <h3 className="text-xl font-bold text-navy-900">The ethical commitment</h3>
            <p>
              Every document this business produces is based on truthful career
              evidence. No invented achievements, no inflated titles, no fake
              project values, no hidden keywords, no false chartership claims.
              We cannot guarantee interviews or offers — nobody honestly can —
              but we can make sure your real experience is presented properly.
            </p>
          </div>
        </div>
      </section>

      <FinalCta title="Want Your Experience Presented Properly?" />
    </>
  );
}
