# Fully Automated Premium AI Service — Setup & Operations

A self-service paid product that runs with **zero manual work**: customers pay via Stripe Checkout, access activates instantly, the AI does the work, and cancellations enforce themselves.

## The product

| Plan | Price | Stripe mode | Access |
|---|---|---|---|
| 12 Months Access | **£200 one-off** | `payment` | 365 days from purchase |
| Monthly | **£20/month** | `subscription` | While the subscription is active; cancel anytime |

**What customers get** (vs the free checker): unlimited AI reviews (no rate limit), plus premium output — their weakest CV bullets rewritten truthfully, and a tailored cover-letter draft per advert. All grounded in the compliance rules: advisory only, evidence-based, no fabrication, no guarantees.

## How the automation works (no database)

1. `/premium` → "Buy" links hit `GET /api/stripe/checkout?plan=…`, which creates a Stripe Checkout session with **inline price_data** — you don't have to create any products in the Stripe Dashboard.
2. After payment Stripe redirects to `/premium/activate?session_id=…`. The page calls `POST /api/stripe/activate`, which verifies the session with Stripe server-side and sets a **signed httpOnly cookie** (HMAC, `PREMIUM_TOKEN_SECRET`).
3. The AI route (`/api/ats-review`) checks the cookie. One-off tokens carry their own expiry; **subscription tokens are verified live against Stripe on every use**, so a cancelled subscription loses access automatically at period end — no webhooks, no database, nothing to maintain.
4. Monthly customers manage/cancel via `GET /api/stripe/portal` (Stripe customer portal).

## Setup (10 minutes)

1. **Env vars** (Vercel → Project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — already needed for the free AI review
   - `STRIPE_SECRET_KEY` — Stripe Dashboard → Developers → API keys
   - `PREMIUM_TOKEN_SECRET` — run `openssl rand -base64 32`
2. **Customer portal** (one-time): Stripe Dashboard → Settings → Billing → Customer portal → enable cancellation → Save. (Needed only for the "manage/cancel" link.)
3. **Test in test mode**: use `sk_test_…`, buy both plans with card `4242 4242 4242 4242`, confirm the activation page, run a premium review, open the portal, cancel, and confirm access expires.
4. Swap to `sk_live_…` and redeploy.

## Operational notes

- **Cost per premium review**: one Claude Opus call (~3–8K input + 2–4K output tokens) — roughly £0.10–£0.30. At £20/month a heavy user running 60 reviews still leaves healthy margin; the 12-month plan assumes typical job-search bursts. Set a spend limit in the Anthropic Console as a backstop.
- **Device transfer is self-service.** The activation page shows the customer a private **access code**; pasting it at `/premium/restore` activates any other device — no contact with you needed. Fallback for lost codes: find their Checkout session ID (`cs_…`) in the Stripe Dashboard and send them to `/premium/activate?session_id=cs_…`. If even that becomes frequent, that's the trigger to add accounts (Supabase + magic links).
- **Refund/cancellation terms** are already in the refund policy (immediate-access cooling-off waiver for the one-off; cancel-anytime for monthly). Have them included in the legal review.
- **VAT**: digital services may have VAT implications depending on your registration status — confirm with your accountant; Stripe Tax can automate it later.
- **Revenue visibility**: everything shows in the Stripe Dashboard (payments, subscriptions, MRR). No separate admin needed.

## Files

| File | Role |
|---|---|
| `src/app/premium/page.tsx` | Sales page with both plans |
| `src/app/premium/activate/page.tsx` + `src/components/ActivatePremium.tsx` | Post-payment activation |
| `src/app/api/stripe/checkout/route.ts` | Creates Checkout sessions (prices defined here — edit to change pricing) |
| `src/app/api/stripe/activate/route.ts` | Verifies payment, issues access cookie |
| `src/app/api/stripe/portal/route.ts` | Self-service subscription management |
| `src/app/api/premium/status/route.ts` | Lets the UI show premium state |
| `src/app/premium/restore/page.tsx` + `/api/premium/restore` + `/api/premium/code` | Self-service device transfer via access code |
| `src/lib/premium.ts` | Token signing/verification |
| `src/app/api/ats-review/route.ts` | Premium gate + premium output schema |
