import Link from "next/link";
import type { PricingTier } from "@/lib/data";
import { Check } from "./ui";

export default function PricingCard({ tier }: { tier: PricingTier }) {
  const isPlaceholder = tier.stripeLink.includes("REPLACE");

  return (
    <div
      className={`flex flex-col rounded-xl border bg-white p-7 shadow-sm transition hover:shadow-lg ${
        tier.highlighted ? "border-amber-brand ring-2 ring-amber-brand" : "border-steel-200"
      }`}
    >
      {tier.highlighted && (
        <span className="mb-3 self-start rounded-full bg-amber-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-bold text-navy-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-steel-600">{tier.description}</p>
      <p className="mt-4 text-3xl font-extrabold text-navy-900">{tier.price}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-steel-700">
        {tier.features.map((f) => (
          <Check key={f}>{f}</Check>
        ))}
      </ul>
      <a
        href={tier.stripeLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-7 rounded px-5 py-3 text-center text-sm font-bold transition ${
          tier.highlighted
            ? "bg-amber-brand text-navy-950 hover:bg-amber-bright"
            : "bg-navy-800 text-white hover:bg-navy-700"
        }`}
      >
        Buy with Stripe
      </a>
      {isPlaceholder && (
        <p className="mt-2 text-center text-xs text-steel-400">
          (Placeholder link — connect in src/lib/site.ts)
        </p>
      )}
      <Link
        href="/contact"
        className="mt-2 text-center text-xs font-medium text-steel-500 underline hover:text-navy-800"
      >
        Questions first? Contact David
      </Link>
    </div>
  );
}
