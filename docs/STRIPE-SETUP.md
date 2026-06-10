# Stripe Setup Guide

This site uses **Stripe Payment Links** — no backend, no API keys in the codebase, nothing to secure on the server. You create products in the Stripe Dashboard, copy each Payment Link URL and paste it into one file.

> ⚠️ **Never put a Stripe secret key (sk_live_… / sk_test_…) anywhere in this codebase.** Payment Links don't need any key in the frontend. If you later add webhooks or a backend, secret keys live only in server-side environment variables.

## Step 1 — Create your Stripe account
1. Sign up at https://dashboard.stripe.com (business details, bank account for payouts).
2. Complete identity verification so live payments are enabled.

## Step 2 — Create the products
Dashboard → **Product catalogue** → **+ Add product**. Create one product per service:

| Product name | Suggested description |
|---|---|
| Construction CV Review | Professional review of your existing CV with a 1-page action report. Advisory service. |
| Full CV Rewrite | Complete CV rewrite incl. ATS-friendly version and recruiter summary. 1 revision included. |
| LinkedIn Profile Optimisation | Headline, About, experience, skills and recruiter keyword strategy. |
| Job Application Pack | Role-targeted CV, cover letter, recruiter message and interview notes. |
| Career Coaching Call | 45/60-minute construction career call with written action plan. |
| Executive Construction Profile | Board-level CV, capability statement, LinkedIn authority profile, portfolio summary. |

For each: set a **one-time price** in GBP. Keep the description free of guarantees (no "guaranteed interviews" etc.).

## Step 3 — Create Payment Links
For each product: open it → **Create payment link** (or **Payment links** in the left menu):
1. Select the product/price.
2. **After payment** → "Don't show confirmation page — redirect customers to your website" → enter:
   `https://YOURDOMAIN.com/payment-success`
3. (Optional) Under advanced options, enable **collect customers' phone numbers** and add a custom field "Target role" if you want that data at checkout.
4. Copy the link (looks like `https://buy.stripe.com/xxxxxxxx`).

There's no native "cancel URL" for Payment Links — customers who abandon simply stay on Stripe's page. The site's `/payment-cancelled` page is used if you later switch to Stripe Checkout sessions; it also works as a landing page you can link from emails.

## Step 4 — Paste the links into the site
Open `src/lib/site.ts` and replace each placeholder in `stripeLinks`:

```ts
export const stripeLinks = {
  cvReview: "https://buy.stripe.com/YOUR_REAL_LINK",
  cvRewrite: "https://buy.stripe.com/YOUR_REAL_LINK",
  linkedin: "https://buy.stripe.com/YOUR_REAL_LINK",
  applicationPack: "https://buy.stripe.com/YOUR_REAL_LINK",
  coachingCall: "https://buy.stripe.com/YOUR_REAL_LINK",
  executiveProfile: "https://buy.stripe.com/YOUR_REAL_LINK",
};
```

Also set real prices in the `prices` object in the same file. Rebuild/redeploy — every Buy button on the site updates automatically (the "placeholder link" hints under buttons disappear once the URL no longer contains "REPLACE").

## Step 5 — After-payment flow
The `/payment-success` page already tells customers to:
1. Upload documents via `/upload-cv`
2. Book their slot via `/book-a-call` (coaching orders)
3. Watch for your confirmation email

Manual workflow for now: Stripe emails you on each payment → you reply with onboarding Email 1 from `docs/EMAIL-FUNNELS.md` (Sequence B).

## Step 6 — Test before launch
1. Toggle **Test mode** in the dashboard, create one test payment link.
2. Pay with card `4242 4242 4242 4242` (any future expiry/CVC).
3. Confirm the redirect to `/payment-success` works on your deployed site.
4. Switch to live links for launch.

## Later upgrades (optional)
- **Stripe webhook + Supabase/Firebase:** record orders automatically, drive the admin dashboard with real data. Requires a backend (Next.js route handlers work) — at that point use a secret key in server env vars only.
- **Stripe Checkout sessions:** programmatic checkout with proper success/cancel URLs per session.
- **Combined packages:** create extra products (e.g. CV + LinkedIn bundle) and add a tier in `src/lib/data.ts`.
