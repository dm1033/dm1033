import type { Metadata } from "next";
import ChecklistForm from "@/components/ChecklistForm";
import { Check, ImagePlaceholder, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Free Construction CV Checklist",
  description:
    "Download the free Construction CV Checklist pack: 20-point CV checklist, ATS-aware formatting guide, LinkedIn checklist, construction keywords guide and project evidence worksheet.",
};

export default function ChecklistPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        title="Download the Construction CV Checklist"
        intro="A practical, free pack you can use on your CV today — no sales call, no obligation."
      />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">What&apos;s in the pack</h2>
            <ul className="mt-5 space-y-2.5 text-steel-700">
              <Check>20-point construction CV checklist</Check>
              <Check>ATS-aware formatting guide</Check>
              <Check>LinkedIn profile checklist</Check>
              <Check>Construction keywords guide</Check>
              <Check>Project evidence worksheet</Check>
            </ul>
            <ImagePlaceholder label="Checklist / notebook visual" className="mt-8 h-56 w-full" />
          </div>
          <div>
            <ChecklistForm />
          </div>
        </div>
      </section>
    </>
  );
}
