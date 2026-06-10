import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Construction Career Edge collects, uses, stores and deletes your personal data, including CV uploads.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <h2>1. Who we are</h2>
      <p>
        {site.name} (&quot;we&quot;, &quot;us&quot;) provides CV writing,
        LinkedIn optimisation and career coaching services for construction
        professionals. Data controller: David Miller, [insert trading
        name/company number and registered address]. Contact:{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>.
      </p>

      <h2>2. What we collect and why</h2>
      <p>CVs contain personal data, and we treat them accordingly. We only collect what is required to deliver the service:</p>
      <ul>
        <li><strong>Enquiry and order data</strong> — name, email, phone, current/target role, experience details and messages: to respond and deliver the service (legal basis: contract / pre-contract steps).</li>
        <li><strong>CV documents and career information</strong> — files you upload and questionnaire answers: to perform the review or rewrite you ordered (legal basis: contract).</li>
        <li><strong>Payment data</strong> — processed by Stripe; we never see or store full card details (legal basis: contract).</li>
        <li><strong>Marketing data</strong> — email address if you request the free checklist or opt in to tips; you can unsubscribe at any time (legal basis: consent).</li>
        <li><strong>Technical data</strong> — essential cookies, and analytics only with your consent (legal basis: consent / legitimate interests).</li>
      </ul>

      <h2>3. Processors we use</h2>
      <ul>
        <li><strong>Stripe</strong> — payment processing (see Stripe&apos;s privacy policy).</li>
        <li><strong>[Formspree / form provider]</strong> — receives form submissions and uploaded CVs and forwards them to us by email.</li>
        <li><strong>[Calendly / booking provider]</strong> — call scheduling.</li>
        <li><strong>[Hosting provider — e.g. Vercel/Netlify]</strong> — serves this website.</li>
        <li>
          <strong>Anthropic</strong> — if you use the optional AI-powered CV
          review and give consent, the CV and advert text you paste is
          processed by Anthropic&apos;s Claude API to generate the review. We
          do not store this text, and API inputs are not used by Anthropic to
          train models (see Anthropic&apos;s commercial privacy documentation).
        </li>
        <li><strong>[Email provider]</strong> — email correspondence and delivery of documents.</li>
      </ul>
      <p>We do not sell personal data and do not share your CV with any third party without your consent.</p>

      <h2>4. Storage, security and retention</h2>
      <ul>
        <li>Data is transferred over HTTPS and stored on access-controlled accounts.</li>
        <li>CVs and working documents are retained for [e.g. 90 days] after delivery so revisions can be completed, then deleted.</li>
        <li>Enquiry emails are retained for [e.g. 12 months]; accounting records as legally required.</li>
        <li>You may request earlier deletion at any time (see your rights below).</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>
        Under UK GDPR you have the right to access, rectify, erase, restrict
        and object to processing of your personal data, and to data
        portability. To exercise any right, email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>.
        You also have the right to complain to the ICO (ico.org.uk).
      </p>

      <h2>6. Cookies</h2>
      <p>See the Cookie Policy for details of essential and optional cookies and how consent is managed.</p>

      <h2>7. Changes</h2>
      <p>We will post any changes to this policy on this page with an updated date.</p>
    </LegalLayout>
  );
}
