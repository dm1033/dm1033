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

    // Only AI-premium checkouts may activate premium. The marker is set by
    // /api/stripe/checkout; the amount check is belt-and-braces so a paid
    // session for any other (cheaper) product can never mint access.
    const expectedAmount = session.mode === "subscription" ? 2000 : 20000;
    if (
      session.metadata?.product !== "ai_premium" ||
      session.currency !== "gbp" ||
      (session.amount_total ?? 0) < expectedAmount
    ) {
      return NextResponse.json(
        { error: "This payment was not for AI Premium Access. If you believe it was, contact us with your receipt." },
        { status: 402 },
      );
    }

    let token: PremiumToken;
    let plan: string;
    let expires: string | null = null;
    let cookieMaxAge = ONE_TIME_ACCESS_DAYS * 24 * 60 * 60;

    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      token = { kind: "subscription", subscriptionId };
      plan = "Monthly subscription";
    } else {
      // Expiry runs from PURCHASE time (session.created, unix seconds), so
      // re-activating the same session later never extends the 12 months.
      const exp = session.created * 1000 + ONE_TIME_ACCESS_DAYS * 24 * 60 * 60 * 1000;
      if (exp <= Date.now()) {
        return NextResponse.json(
          { error: "The 12-month access period for this purchase has ended." },
          { status: 410 },
        );
      }
      token = { kind: "one_time", sessionId, exp };
      plan = "12 months access";
      expires = new Date(exp).toISOString().slice(0, 10);
      cookieMaxAge = Math.floor((exp - Date.now()) / 1000);
    }

    const signed = signPremiumToken(token);
    // `code` doubles as the customer's access code for other devices —
    // shown once on the activation page with a "keep it private" warning.
    const res = NextResponse.json({ ok: true, plan, expires, code: signed });
    res.cookies.set(PREMIUM_COOKIE, signed, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
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
