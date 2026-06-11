import type { Metadata } from "next";
import RestorePremium from "@/components/RestorePremium";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Restore Premium Access",
  description: "Restore your AI Career Tools premium access on a new device using your access code.",
  robots: { index: false },
};

export default function RestorePage() {
  return (
    <>
      <PageHero
        eyebrow="Premium Access"
        title="Restore Access on This Device"
        intro="Paste the access code you were shown when you activated Premium (or copied from your other device) and your access moves here instantly."
      />
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <RestorePremium />
      </section>
    </>
  );
}
