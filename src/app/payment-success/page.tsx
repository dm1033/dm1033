import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Thank you — your payment has been received. Here's what happens next.",
  robots: { index: false },
};

export default function PaymentSuccessPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl" aria-hidden>✅</p>
      <h1 className="mt-6 text-3xl font-extrabold text-navy-900 sm:text-4xl">
        Payment Received — Thank You
      </h1>
      <p className="mt-4 text-steel-600">
        Your order is confirmed and a Stripe receipt is on its way to your
        email. Here&apos;s what to do next:
      </p>
      <ol className="mx-auto mt-8 max-w-md list-decimal space-y-3 pl-6 text-left text-steel-700">
        <li>
          <strong>Upload your documents</strong> — send your CV, target role
          and job advert via the{" "}
          <Link href="/upload-cv" className="font-semibold underline">upload form</Link>{" "}
          (mention your order in the message).
        </li>
        <li>
          <strong>Booked a coaching call?</strong>{" "}
          <Link href="/book-a-call" className="font-semibold underline">Pick your slot here</Link>.
        </li>
        <li>
          <strong>Watch your inbox</strong> — David will confirm receipt and
          the delivery timeline, usually within one working day.
        </li>
      </ol>
      <p className="mt-8 text-sm text-steel-500">
        Questions? Email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/upload-cv" className="rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright">
          Upload My Documents
        </Link>
        <Link href="/" className="rounded border border-navy-600 px-6 py-3 text-sm font-bold text-navy-800">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
