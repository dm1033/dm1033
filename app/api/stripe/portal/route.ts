import { NextResponse, type NextRequest } from "next/server";
import { env, isStripeConfigured, isSupabaseConfigured } from "@/lib/env";
import { getStripe } from "@/lib/stripe/stripe";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";

// Opens the Stripe Billing Portal for the admin's organisation.
export async function POST(_request: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "billing-not-configured" }, { status: 503 });
  }
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.organisation_id) {
    return NextResponse.json({ error: "admin-org-required" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { data: org } = await supabase
    .from("organisations")
    .select("stripe_customer_id")
    .eq("id", profile.organisation_id)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "no-customer" }, { status: 400 });
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${env.siteUrl}/admin`,
  });

  return NextResponse.json({ url: portal.url });
}
