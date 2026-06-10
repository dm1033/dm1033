import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies this site uses, what they do, and how consent is managed.",
};

export default function CookiePage() {
  return (
    <LegalLayout title="Cookie Policy">
      <h2>What cookies we use</h2>
      <h3>Essential</h3>
      <ul>
        <li>
          <strong>cce-cookie-consent</strong> (localStorage) — remembers your
          cookie choice. No personal data; kept until you clear browser data.
        </li>
      </ul>
      <h3>Analytics (only with consent)</h3>
      <ul>
        <li>
          [If analytics is added — e.g. Plausible (cookie-free) or Google
          Analytics — list the cookies, purpose and retention here. No
          analytics is active until configured.]
        </li>
      </ul>
      <h3>Third-party services</h3>
      <ul>
        <li>
          Stripe (payments) and the booking/form providers may set their own
          cookies on their pages when you use them — see their policies.
        </li>
      </ul>

      <h2>Managing consent</h2>
      <p>
        The cookie banner lets you accept all cookies or essential only. To
        change your choice, clear this site&apos;s data in your browser and the
        banner will reappear. You can also block cookies entirely in browser
        settings; essential features may still work, but some embedded
        services may not.
      </p>
    </LegalLayout>
  );
}
