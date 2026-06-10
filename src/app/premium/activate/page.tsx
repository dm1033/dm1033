import type { Metadata } from "next";
import { Suspense } from "react";
import ActivatePremium from "@/components/ActivatePremium";

export const metadata: Metadata = {
  title: "Activating Premium Access",
  robots: { index: false },
};

export default function ActivatePage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <Suspense fallback={<p className="text-steel-600">Loading…</p>}>
        <ActivatePremium />
      </Suspense>
    </section>
  );
}
