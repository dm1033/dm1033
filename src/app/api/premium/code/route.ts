import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREMIUM_COOKIE, verifyPremiumToken } from "@/lib/premium";

/** Returns the current device's access code (for copying to another device).
 *  Only works where a valid premium cookie is already present. */

export const runtime = "nodejs";

export async function GET() {
  const raw = (await cookies()).get(PREMIUM_COOKIE)?.value;
  const token = verifyPremiumToken(raw);
  if (!token || !raw) {
    return NextResponse.json({ error: "No active premium access on this device." }, { status: 404 });
  }
  return NextResponse.json({ code: raw });
}
