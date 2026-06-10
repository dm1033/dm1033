import crypto from "node:crypto";

/**
 * Signed premium-access tokens — lets the site grant and verify paid access
 * without a database. Tokens are HMAC-signed with PREMIUM_TOKEN_SECRET and
 * stored in an httpOnly cookie.
 *
 * - one_time  → access until `exp` (12 months from purchase)
 * - subscription → carries the Stripe subscription ID; status is verified
 *   live against Stripe when the premium AI service is used, so a cancelled
 *   subscription loses access automatically at period end.
 */

export const PREMIUM_COOKIE = "cce_premium";
export const ONE_TIME_ACCESS_DAYS = 365;

export type PremiumToken =
  | { kind: "one_time"; sessionId: string; exp: number }
  | { kind: "subscription"; subscriptionId: string };

function secret(): string | null {
  const s = process.env.PREMIUM_TOKEN_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function premiumConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && secret());
}

export function signPremiumToken(payload: PremiumToken): string {
  const key = secret();
  if (!key) throw new Error("PREMIUM_TOKEN_SECRET is not configured");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPremiumToken(token: string | undefined): PremiumToken | null {
  const key = secret();
  if (!token || !key) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", key).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as PremiumToken;
    if (payload.kind === "one_time") {
      return typeof payload.exp === "number" && payload.exp > Date.now() ? payload : null;
    }
    if (payload.kind === "subscription") {
      return typeof payload.subscriptionId === "string" ? payload : null;
    }
    return null;
  } catch {
    return null;
  }
}
