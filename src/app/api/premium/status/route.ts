import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREMIUM_COOKIE, verifyPremiumToken } from "@/lib/premium";

/** Lightweight structural check of the premium cookie (no Stripe call —
 *  subscription validity is verified live when the AI service is used). */

export const runtime = "nodejs";

export async function GET() {
  const token = verifyPremiumToken((await cookies()).get(PREMIUM_COOKIE)?.value);
  if (!token) return NextResponse.json({ active: false });
  return NextResponse.json({
    active: true,
    plan: token.kind === "subscription" ? "monthly" : "one_time",
    expires: token.kind === "one_time" ? new Date(token.exp).toISOString().slice(0, 10) : null,
  });
}
