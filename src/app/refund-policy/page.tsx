import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and cancellation terms for CV writing, LinkedIn optimisation and coaching services.",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy">
      <h2>Before work begins</h2>
      <p>
        You may cancel any order for a full refund at any time before work on
        your documents has started or your call takes place.
      </p>

      <h2>Written services (reviews, rewrites, packs)</h2>
      <ul>
        <li>These are personalised services; once work has begun, the right to cancel under consumer regulations is limited where you have requested performance to start.</li>
        <li>If you cancel after work has started but before delivery, we refund the undelivered portion at our reasonable assessment.</li>
        <li>After delivery, refunds are not normally available — but each rewrite includes a revision round, and we will always correct inaccuracies without charge.</li>
        <li>If we decline or terminate work (for example, where truthful content cannot be agreed), we refund all undelivered work.</li>
      </ul>

      <h2>Coaching calls</h2>
      <ul>
        <li>Full refund if cancelled at least 24 hours before the booked slot.</li>
        <li>One free reschedule with at least 24 hours&apos; notice.</li>
        <li>No-shows and late cancellations are non-refundable.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${site.email}`} className="underline">{site.email}</a> with
        your order details. Approved refunds are returned to the original
        payment method via Stripe, normally within 5–10 working days. Your
        statutory rights are unaffected.
      </p>
    </LegalLayout>
  );
}
