import { NextResponse, type NextRequest } from "next/server";
import { env, isStripeConfigured } from "@/lib/env";
import { getStripe } from "@/lib/stripe/stripe";
import { getProfile } from "@/lib/supabase/auth";

// Starts a Stripe Checkout session for a training-provider subscription.
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe-not-configured" }, { status: 503 });
  }
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "admin-required" }, { status: 403 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.stripePriceId, quantity: 1 }],
    customer_email: profile.email,
    client_reference_id: profile.organisation_id ?? profile.id,
    success_url: `${env.siteUrl}/admin?billing=success`,
    cancel_url: `${env.siteUrl}/admin?billing=cancelled`,
    metadata: { organisation_id: profile.organisation_id ?? "" },
  });

  return NextResponse.json({ url: session.url });
}
