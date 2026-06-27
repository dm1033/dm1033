import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { env, isStripeConfigured, isSupabaseConfigured } from "@/lib/env";
import { getStripe } from "@/lib/stripe/stripe";
import { createServiceSupabase } from "@/lib/supabase/server";

// Stripe webhook — the ONLY writer of organisation entitlement fields.
export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "stripe-not-configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.stripeWebhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `signature: ${err.message}` }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, note: "supabase-not-configured" });
  }
  const supabase = createServiceSupabase();

  async function setEntitlement(orgId: string, fields: Record<string, unknown>) {
    if (!orgId) return;
    await supabase.from("organisations").update(fields).eq("id", orgId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const orgId = (s.metadata?.organisation_id || s.client_reference_id || "") as string;
      await setEntitlement(orgId, {
        stripe_customer_id: s.customer as string,
        plan: "pro",
        seats: 25,
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.organisation_id || "") as string;
      const active = sub.status === "active" || sub.status === "trialing";
      await setEntitlement(orgId, { plan: active ? "pro" : "free" });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
