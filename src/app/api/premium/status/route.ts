import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREMIUM_COOKIE, verifyPremiumAccess } from "@/lib/premium";

/** Premium state for the UI. Subscription tokens are verified live against
 *  Stripe (same check as the AI endpoint), so a cancelled subscriber is
 *  never shown an active badge their requests wouldn't honour. */

export const runtime = "nodejs";

export async function GET() {
  const token = await verifyPremiumAccess((await cookies()).get(PREMIUM_COOKIE)?.value);
  if (!token) return NextResponse.json({ active: false });
  return NextResponse.json({
    active: true,
    plan: token.kind === "subscription" ? "monthly" : "one_time",
    expires: token.kind === "one_time" ? new Date(token.exp).toISOString().slice(0, 10) : null,
  });
}
