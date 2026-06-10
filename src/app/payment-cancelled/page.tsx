import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "Your payment was cancelled — nothing has been charged.",
  robots: { index: false },
};

export default function PaymentCancelledPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl" aria-hidden>↩️</p>
      <h1 className="mt-6 text-3xl font-extrabold text-navy-900 sm:text-4xl">
        Payment Cancelled
      </h1>
      <p className="mt-4 text-steel-600">
        No payment was taken. If something went wrong at checkout, or you have
        a question before ordering, we&apos;re happy to help — no pressure.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/pricing" className="rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright">
          Back to Pricing
        </Link>
        <Link href="/contact" className="rounded border border-navy-600 px-6 py-3 text-sm font-bold text-navy-800">
          Ask a Question First
        </Link>
      </div>
      <p className="mt-8 text-sm text-steel-500">
        Or email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>
      </p>
    </section>
  );
}
