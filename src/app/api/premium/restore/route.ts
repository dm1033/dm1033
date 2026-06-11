import { NextResponse } from "next/server";
import {
  ONE_TIME_ACCESS_DAYS,
  PREMIUM_COOKIE,
  verifyPremiumToken,
} from "@/lib/premium";

/**
 * Restores premium access on a new device from the customer's access code
 * (the signed token shown at activation). The signature check makes forged
 * codes useless; subscription codes are still live-verified against Stripe
 * whenever the AI service is used.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  let code: string;
  try {
    const body = await req.json();
    code = String(body.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = verifyPremiumToken(code);
  if (!token) {
    return NextResponse.json(
      {
        error:
          "That access code is invalid or has expired. Check you copied the whole code — or contact us with your Stripe receipt.",
      },
      { status: 400 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    plan: token.kind === "subscription" ? "Monthly subscription" : "12 months access",
    expires:
      token.kind === "one_time" ? new Date(token.exp).toISOString().slice(0, 10) : null,
  });
  res.cookies.set(PREMIUM_COOKIE, code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_TIME_ACCESS_DAYS * 24 * 60 * 60,
  });
  return res;
}
