import type { Metadata } from "next";
import Link from "next/link";
import { Check, DisclaimerBox, PageHero, SectionHeading } from "@/components/ui";
import { compliance } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Career Tools — Premium Access",
  description:
    "Fully automated AI CV reviews for construction professionals: unlimited reviews, rewritten bullet examples and tailored cover-letter drafts. £200 for 12 months or £20/month, cancel anytime.",
};

const errorMessages: Record<string, string> = {
  "not-configured":
    "Online checkout is not switched on yet for this deployment. Please contact us to purchase.",
  "invalid-plan": "That plan wasn't recognised — please choose one below.",
  "checkout-failed": "Checkout could not be started. Please try again or contact us.",
  "no-subscription":
    "No active monthly subscription was found on this device. If you subscribed on another device, repurchase is not needed — contact us and we'll restore access.",
  "portal-failed": "The billing portal could not be opened. Please contact us to manage your plan.",
};

const premiumFeatures = [
  "Unlimited AI CV reviews against any job advert",
  "Advisory alignment estimate with construction-specific judgement",
  "Your weakest CV bullets rewritten as truthful, evidence-led examples",
  "A tailored draft cover letter for every advert you target",
  "Evidence gaps, formatting risks and prioritised recommendations",
  "Instant, automated access after payment — use it any time, day or night",
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : null;

  return (
    <>
      <PageHero
        eyebrow="AI Premium Access"
        title="Fully Automated AI CV Reviews — On Demand"
        intro="Applying for several roles? Premium Access gives you unlimited AI-powered reviews, truthful bullet rewrites and tailored cover-letter drafts for every application — instantly, whenever you need them."
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {errorMessage && (
          <p className="mb-8 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">What you get</h2>
            <ul className="mt-5 space-y-2.5 text-steel-700">
              {premiumFeatures.map((f) => (
                <Check key={f}>{f}</Check>
              ))}
            </ul>
            <p className="mt-6 text-sm text-steel-600">
              Powered by the same AI engine as the free checker, with deeper
              output and no usage limits. Everything stays grounded in your
              real, evidenced experience — the service never invents
              qualifications, titles or project values, and never uses
              keyword-stuffing tricks.
            </p>
            <p className="mt-4 text-sm text-steel-600">
              Prefer a human expert?{" "}
              <Link href="/services/cv-writing" className="font-semibold underline">
                David&apos;s personal CV review and rewrite services
              </Link>{" "}
              remain available — many clients use both.
            </p>
          </div>

          <div className="space-y-6">
            {/* One-off plan */}
            <div className="rounded-xl border-2 border-amber-brand bg-white p-7 shadow-sm">
              <span className="rounded-full bg-amber-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
                Best value
              </span>
              <h3 className="mt-3 text-lg font-bold text-navy-900">12 Months Access</h3>
              <p className="mt-1 text-3xl font-extrabold text-navy-900">
                £200 <span className="text-base font-medium text-steel-500">one-off</span>
              </p>
              <p className="mt-2 text-sm text-steel-600">
                A full year of unlimited AI reviews and drafts — ideal for an
                active job search or career move.
              </p>
              <a
                href="/api/stripe/checkout?plan=one_time"
                className="mt-5 block rounded bg-amber-brand px-6 py-3 text-center text-sm font-bold text-navy-950 transition hover:bg-amber-bright"
              >
                Buy 12 Months — £200
              </a>
            </div>

            {/* Monthly plan */}
            <div className="rounded-xl border border-steel-200 bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold text-navy-900">Monthly</h3>
              <p className="mt-1 text-3xl font-extrabold text-navy-900">
                £20 <span className="text-base font-medium text-steel-500">/ month</span>
              </p>
              <p className="mt-2 text-sm text-steel-600">
                Same unlimited access, cancel anytime — access continues to the
                end of the paid period.
              </p>
              <a
                href="/api/stripe/checkout?plan=monthly"
                className="mt-5 block rounded bg-navy-800 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-navy-700"
              >
                Subscribe — £20/month
              </a>
              <a
                href="/api/stripe/portal"
                className="mt-3 block text-center text-xs font-medium text-steel-500 underline hover:text-navy-800"
              >
                Already subscribed? Manage or cancel your plan
              </a>
              <Link
                href="/premium/restore"
                className="mt-1.5 block text-center text-xs font-medium text-steel-500 underline hover:text-navy-800"
              >
                New device? Restore access with your code
              </Link>
            </div>

            <p className="text-xs text-steel-500">
              Secure payment by Stripe. Access is activated automatically on
              this device immediately after payment. By purchasing you request
              immediate access to the digital service and acknowledge this
              affects the 14-day cooling-off right once the service is used —
              see the{" "}
              <Link href="/refund-policy" className="underline">refund policy</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-steel-50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <SectionHeading eyebrow="Honest scope" title="What Premium Is — and Isn't" />
          <div className="mx-auto mt-8 max-w-3xl">
            <DisclaimerBox>
              {compliance.toolDisclaimer} {compliance.serviceDisclaimer} All AI
              output is advisory and draft material based on the truthful
              career evidence you provide — review everything before using it,
              and never submit claims you cannot evidence at interview.
            </DisclaimerBox>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/services/ats-cv-review"
              className="inline-block rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
            >
              Try the Free Checker First
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
