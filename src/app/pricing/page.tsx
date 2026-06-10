import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import PricingCard from "@/components/PricingCard";
import { DisclaimerBox, PageHero } from "@/components/ui";
import { pricingTiers } from "@/lib/data";
import { prices } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing — Construction CV, LinkedIn & Coaching Services",
  description:
    "Clear fixed-fee pricing for construction CV reviews, rewrites, LinkedIn optimisation, application packs, career coaching and executive profiles. Pay securely with Stripe.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Clear, Fixed-Fee Pricing"
        intro="No subscriptions, no hidden extras. Every service is a fixed fee, paid securely through Stripe. Not sure which service fits? Book a call or send your CV and David will advise honestly — including telling you if you don't need the bigger package."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border-2 border-navy-200 bg-navy-50 p-7">
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold text-navy-900">
            <span aria-hidden>✨</span> AI Career Tools — Fully Automated Premium Access
          </h2>
          <p className="mt-2 text-sm text-steel-700">
            Self-service, instant and unlimited: AI CV reviews against any job
            advert, truthful bullet rewrites and tailored cover-letter drafts —
            available 24/7, activated automatically the moment you pay.
          </p>
          <p className="mt-3 font-bold text-navy-900">
            £200 one-off (12 months) &nbsp;·&nbsp; or £20/month, cancel anytime
          </p>
          <a
            href="/premium"
            className="mt-4 inline-block rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
          >
            View Premium Access
          </a>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-6">
          <div className="rounded-xl border border-steel-200 bg-white p-6">
            <h2 className="font-bold text-navy-900">Also available</h2>
            <ul className="mt-3 space-y-2 text-sm text-steel-700">
              <li>
                <strong>International / Middle East / Singapore CV Pack</strong> —{" "}
                {prices.internationalPack} (enquire via the upload form)
              </li>
              <li>
                <strong>Graduate / Junior Engineer Pack</strong> —{" "}
                {prices.graduatePack} (enquire via the upload form)
              </li>
              <li>
                <strong>Combined CV + LinkedIn packages</strong> — ask for
                combined pricing before ordering
              </li>
            </ul>
          </div>
          <DisclaimerBox>
            Prices shown are placeholders pending launch confirmation. All
            services are advisory: we cannot guarantee interviews, offers, ATS
            outcomes or salary increases. Final hiring decisions remain with
            employers and recruiters. See the refund policy for terms on
            personalised written work.
          </DisclaimerBox>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
