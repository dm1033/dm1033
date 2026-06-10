import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  ONE_TIME_ACCESS_DAYS,
  PREMIUM_COOKIE,
  premiumConfigured,
  signPremiumToken,
  type PremiumToken,
} from "@/lib/premium";

/**
 * Called by /premium/activate after Stripe redirects back with a
 * session_id. Verifies the Checkout session is genuinely paid, then issues
 * a signed access token as an httpOnly cookie. No database required.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!premiumConfigured()) {
    return NextResponse.json({ error: "Premium service is not configured." }, { status: 503 });
  }

  let sessionId: string;
  try {
    const body = await req.json();
    sessionId = String(body.session_id ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== "complete" || session.payment_status === "unpaid") {
      return NextResponse.json(
        { error: "This checkout has not completed. If you were charged, contact us." },
        { status: 402 },
      );
    }

    let token: PremiumToken;
    let plan: string;
    let expires: string | null = null;

    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      token = { kind: "subscription", subscriptionId };
      plan = "Monthly subscription";
    } else {
      const exp = Date.now() + ONE_TIME_ACCESS_DAYS * 24 * 60 * 60 * 1000;
      token = { kind: "one_time", sessionId, exp };
      plan = "12 months access";
      expires = new Date(exp).toISOString().slice(0, 10);
    }

    const res = NextResponse.json({ ok: true, plan, expires });
    res.cookies.set(PREMIUM_COOKIE, signPremiumToken(token), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_TIME_ACCESS_DAYS * 24 * 60 * 60,
    });
    return res;
  } catch (error) {
    console.error("Stripe activation error", error);
    return NextResponse.json(
      { error: "Could not verify the payment. Please contact us with your Stripe receipt." },
      { status: 502 },
    );
  }
}
