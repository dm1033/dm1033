import type { Metadata } from "next";
import Link from "next/link";
import { Check, PageHero } from "@/components/ui";
import { prices, site, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Construction Career Call",
  description:
    "Book a 45 or 60-minute construction career coaching call with David Miller — career direction, role targeting, relocation and chartership positioning.",
};

export default function BookACallPage() {
  const calendlyIsPlaceholder = site.calendly.includes("REPLACE");

  return (
    <>
      <PageHero
        eyebrow="Book a call"
        title="Book a Construction Career Call"
        intro="A focused 45 or 60-minute call about your career direction, target roles and how to position your experience — followed by a written action plan."
      />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">What the call covers</h2>
            <ul className="mt-5 space-y-2.5 text-steel-700">
              <Check>Honest assessment of your current position</Check>
              <Check>Routes into management, temporary works, HV/energy</Check>
              <Check>Overseas relocation positioning</Check>
              <Check>Chartership / professional membership profiles</Check>
              <Check>Salary and role targeting</Check>
              <Check>Written action plan after the call</Check>
            </ul>
            <p className="mt-6 text-steel-700">
              Price: <strong>{prices.coachingCall}</strong>
            </p>
            <p className="mt-2 text-sm text-steel-500">
              Coaching is advisory — it is not a recruitment service and cannot
              guarantee any role or outcome.
            </p>
          </div>

          <div className="rounded-xl border border-steel-200 bg-white p-8">
            <h2 className="text-xl font-bold text-navy-900">How to book</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-steel-700">
              <li>
                Pay securely with Stripe:{" "}
                <a
                  href={stripeLinks.coachingCall}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-navy-800 underline hover:text-amber-brand"
                >
                  Pay for a Coaching Call
                </a>
              </li>
              <li>
                Pick a time that suits you on the booking calendar:{" "}
                <a
                  href={site.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-navy-800 underline hover:text-amber-brand"
                >
                  Open Booking Calendar
                </a>
                {calendlyIsPlaceholder && (
                  <span className="block text-xs text-steel-400">
                    (Placeholder — connect Calendly in src/lib/site.ts)
                  </span>
                )}
              </li>
              <li>
                You&apos;ll get a confirmation email with the video-call link
                and a short pre-call questionnaire.
              </li>
            </ol>
            <p className="mt-6 text-sm text-steel-600">
              Prefer to ask something first?{" "}
              <Link href="/contact" className="font-semibold underline">
                Contact David
              </Link>{" "}
              — no obligation.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
