import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

/** Server-side Stripe SDK instance. Throws if STRIPE_SECRET_KEY is unset. */
export function getStripe(): Stripe {
  if (!env.stripeSecret) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  return new Stripe(env.stripeSecret, { apiVersion: "2024-06-20" });
}
