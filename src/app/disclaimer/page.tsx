import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { compliance } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Service disclaimer — advisory career-document services only; no guaranteed interviews, offers or screening outcomes.",
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer">
      <h2>Service disclaimer</h2>
      <p>{compliance.serviceDisclaimer}</p>

      <h2>Screening systems</h2>
      <p>
        {compliance.atsDisclaimer} Every employer configures screening software
        differently, and many decisions involve human judgement that no
        document can control.
      </p>

      <h2>Advisory tool</h2>
      <p>
        The free screening-readiness checker on this site is advisory only.{" "}
        {compliance.toolDisclaimer}
      </p>

      <h2>Career and coaching advice</h2>
      <p>
        Coaching and career guidance reflect professional opinion based on the
        information you provide. They are not financial, legal or immigration
        advice. Decisions about applications, relocation, visas and career
        moves remain yours; consult appropriately qualified advisers where
        needed.
      </p>

      <h2>Credentials</h2>
      <p>
        Founder credentials and professional memberships stated on this site
        are subject to verification wording where indicated and will be
        confirmed before publication claims are finalised. No professional body
        endorsement of this business is claimed.
      </p>
    </LegalLayout>
  );
}
