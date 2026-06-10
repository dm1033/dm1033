import Stripe from "stripe";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREMIUM_COOKIE, premiumConfigured, verifyPremiumToken } from "@/lib/premium";

/**
 * Self-service subscription management: redirects monthly subscribers to
 * the Stripe customer portal (update card, cancel — fully automated).
 * Note: enable the customer portal once in the Stripe Dashboard
 * (Settings → Billing → Customer portal → Save).
 */

export const runtime = "nodejs";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!premiumConfigured()) {
    return NextResponse.redirect(`${origin}/premium?error=not-configured`, 303);
  }

  const token = verifyPremiumToken((await cookies()).get(PREMIUM_COOKIE)?.value);
  if (!token || token.kind !== "subscription") {
    return NextResponse.redirect(`${origin}/premium?error=no-subscription`, 303);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const sub = await stripe.subscriptions.retrieve(token.subscriptionId);
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/premium`,
    });
    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    console.error("Stripe portal error", error);
    return NextResponse.redirect(`${origin}/premium?error=portal-failed`, 303);
  }
}
