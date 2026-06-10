import type { Metadata } from "next";
import UploadForm from "@/components/UploadForm";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Upload CV / Request a Review",
  description:
    "Send your construction CV securely for a professional review or rewrite. Include your target role and job advert for keyword and requirement alignment.",
};

export default function UploadPage() {
  return (
    <>
      <PageHero
        eyebrow="Upload CV"
        title="Upload Your CV / Request a Review"
        intro="Send your CV, target role and (ideally) a job advert. David will reply by email — usually within one working day — with the recommended next step. No obligation."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <UploadForm />
      </section>
    </>
  );
}
