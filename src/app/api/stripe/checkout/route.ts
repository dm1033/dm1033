import Stripe from "stripe";
import { NextResponse } from "next/server";
import { premiumConfigured } from "@/lib/premium";

/**
 * Starts a Stripe Checkout session for the automated AI premium service.
 * Prices are defined inline (price_data) so NO Stripe Dashboard product
 * setup is required — set STRIPE_SECRET_KEY and it works.
 *
 *   GET /api/stripe/checkout?plan=one_time   £200 one-off, 12 months access
 *   GET /api/stripe/checkout?plan=monthly    £20/month subscription
 */

export const runtime = "nodejs";

const PLANS = {
  one_time: {
    mode: "payment" as const,
    line_item: {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: 20000, // £200.00
        product_data: {
          name: "AI Career Tools — 12 Months Access",
          description:
            "12 months of unlimited automated AI CV reviews, rewritten bullet examples and tailored cover-letter drafts. Advisory service — no guaranteed interviews, offers or screening outcomes.",
        },
      },
    },
  },
  monthly: {
    mode: "subscription" as const,
    line_item: {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: 2000, // £20.00 / month
        recurring: { interval: "month" as const },
        product_data: {
          name: "AI Career Tools — Monthly",
          description:
            "Unlimited automated AI CV reviews, rewritten bullet examples and tailored cover-letter drafts. Cancel anytime. Advisory service — no guaranteed interviews, offers or screening outcomes.",
        },
      },
    },
  },
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (!premiumConfigured()) {
    return NextResponse.redirect(`${url.origin}/premium?error=not-configured`, 303);
  }

  const plan = url.searchParams.get("plan");
  if (plan !== "one_time" && plan !== "monthly") {
    return NextResponse.redirect(`${url.origin}/premium?error=invalid-plan`, 303);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const config = PLANS[plan];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [config.line_item],
      allow_promotion_codes: true,
      success_url: `${url.origin}/premium/activate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/payment-cancelled`,
    });
    return NextResponse.redirect(session.url!, 303);
  } catch (error) {
    console.error("Stripe checkout error", error);
    return NextResponse.redirect(`${url.origin}/premium?error=checkout-failed`, 303);
  }
}
