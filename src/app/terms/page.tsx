import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { compliance, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms of service for Construction Career Edge CV writing, LinkedIn optimisation and career coaching services.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms and Conditions">
      <h2>1. The service</h2>
      <p>
        {site.name} provides career-document services: CV reviews and rewrites,
        LinkedIn profile optimisation, application packs, coaching calls and
        related advisory work. {compliance.serviceDisclaimer}
      </p>

      <h2>2. No guarantees</h2>
      <p>
        We cannot and do not guarantee interviews, job offers, ATS or AI
        screening outcomes, recruiter responses or salary increases. Final
        hiring decisions remain with employers and recruiters. Our commitment
        is to improve the clarity, structure, relevance and
        screening-readiness of your documents.
      </p>

      <h2>3. Your obligations — truthful information</h2>
      <ul>
        <li>All career information you provide must be truthful and accurate.</li>
        <li>We will not include qualifications, experience, job titles, project values or memberships that cannot be evidenced.</li>
        <li>We may decline or terminate work that would require misleading content, with a refund for undelivered work.</li>
        <li>You are responsible for final approval of every document before you use it.</li>
      </ul>

      <h2>4. Ordering, payment and delivery</h2>
      <ul>
        <li>Services are paid in advance through Stripe at the prices shown at checkout.</li>
        <li>Typical turnaround is 5–7 working days from receipt of all required information; timescales are estimates, not guarantees.</li>
        <li>Rewrites include one revision round, requested within 14 days of delivery.</li>
        <li>Coaching calls may be rescheduled with at least 24 hours&apos; notice.</li>
      </ul>

      <h2>5. Cancellation and refunds</h2>
      <p>
        See the Refund Policy. In summary: full refund before work begins;
        once personalised written work has started, refunds are limited to the
        undelivered portion; coaching calls are refundable until 24 hours
        before the booked slot. Your statutory rights are unaffected.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        On full payment, you own the delivered documents for your personal
        career use. We retain the right to reuse generic (non-personal)
        structures and wording approaches.
      </p>

      <h2>7. Confidentiality and data</h2>
      <p>
        Your documents and career information are handled confidentially under
        the Privacy Policy and are never shared without your consent.
      </p>

      <h2>8. Liability</h2>
      <p>
        Nothing limits liability that cannot lawfully be limited. Otherwise,
        our total liability for any claim is limited to the amount you paid for
        the relevant service. We are not liable for hiring decisions made by
        third parties.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of England and Wales [confirm jurisdiction].</p>
    </LegalLayout>
  );
}
