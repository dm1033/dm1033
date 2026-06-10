import type { ReactNode } from "react";
import FinalCta from "./FinalCta";
import {
  ButtonPrimary,
  ButtonSecondary,
  Check,
  DisclaimerBox,
  ImagePlaceholder,
  PageHero,
} from "./ui";
import { compliance } from "@/lib/site";

export type ServiceSection = {
  heading: string;
  body: ReactNode;
  bullets?: string[];
};

export default function ServicePageTemplate({
  eyebrow,
  title,
  intro,
  price,
  stripeLink,
  imageLabel,
  whoFor,
  included,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  price?: string;
  stripeLink?: string;
  imageLabel: string;
  whoFor: string[];
  included: string[];
  sections?: ServiceSection[];
  children?: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro}>
        {stripeLink ? (
          <ButtonPrimary href={stripeLink} external>
            Buy Now {price ? `— ${price}` : ""}
          </ButtonPrimary>
        ) : (
          <ButtonPrimary href="/upload-cv">Request This Service</ButtonPrimary>
        )}
        <ButtonSecondary href="/book-a-call" light>
          Book a Call First
        </ButtonSecondary>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">Who this is for</h2>
            <ul className="mt-5 space-y-2.5 text-steel-700">
              {whoFor.map((w) => (
                <Check key={w}>{w}</Check>
              ))}
            </ul>
            <ImagePlaceholder label={imageLabel} className="mt-8 h-56 w-full" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">What&apos;s included</h2>
            <ul className="mt-5 space-y-2.5 text-steel-700">
              {included.map((i) => (
                <Check key={i}>{i}</Check>
              ))}
            </ul>
            {price && (
              <p className="mt-8 text-lg font-bold text-navy-900">
                Investment: <span className="text-2xl">{price}</span>
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {stripeLink && (
                <ButtonPrimary href={stripeLink} external>
                  Buy with Stripe
                </ButtonPrimary>
              )}
              <ButtonSecondary href="/upload-cv">Upload CV / Enquire</ButtonSecondary>
            </div>
          </div>
        </div>
      </section>

      {sections && sections.length > 0 && (
        <section className="bg-steel-50">
          <div className="mx-auto max-w-4xl space-y-10 px-4 py-16 sm:px-6">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-2xl font-extrabold text-navy-900">{s.heading}</h2>
                <div className="mt-3 leading-relaxed text-steel-700">{s.body}</div>
                {s.bullets && (
                  <ul className="mt-4 space-y-2 text-steel-700">
                    {s.bullets.map((b) => (
                      <Check key={b}>{b}</Check>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {children}

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <DisclaimerBox>
          {compliance.serviceDisclaimer} All content is based on truthful career
          evidence you provide — we never invent experience, qualifications or
          project values.
        </DisclaimerBox>
      </section>

      <FinalCta />
    </>
  );
}
