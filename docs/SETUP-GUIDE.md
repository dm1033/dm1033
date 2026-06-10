# Setup Guide — Construction Career Edge Website

Start here. This is the master guide; detailed guides are linked per step.

## What this is
A complete, live-ready Next.js 15 + TypeScript + Tailwind CSS 4 website for the construction CV / LinkedIn / career-coaching business, plus the full marketing system (blog plan, email funnels, LinkedIn plan, launch plan) in this `docs/` folder.

**Architecture decision:** static site + Stripe Payment Links + Formspree + Calendly. No backend, no database, no secrets in the codebase — the cheapest, most secure way to launch. An upgrade path to Supabase/Firebase + Stripe webhooks is described at the end.

## The one file that matters
Almost every launch placeholder lives in **`src/lib/site.ts`**:
- `url` — your live domain
- `email` / `phone` — business contact
- `founder.credentials` — confirm exact wording before launch (IEng/membership, Tech IOSH)
- `calendly` — booking link
- `forms.*` — three Formspree endpoints
- `stripeLinks.*` — six Stripe Payment Links
- `prices.*` — real prices

Search the repo for `REPLACE` and `[insert` to find every placeholder.

## Setup order
1. **Run locally:** `npm install && npm run dev` → http://localhost:3000
2. **Deploy:** Vercel/Netlify + domain + SSL → `docs/DEPLOYMENT.md`
3. **Payments:** Stripe products + Payment Links → `docs/STRIPE-SETUP.md`
4. **Forms & booking:** Formspree + Calendly → `docs/FORMS-AND-BOOKING-SETUP.md`
5. **Legal:** fill bracketed placeholders in privacy/terms/disclaimer/refund/cookie pages; get reviewed by a qualified adviser
6. **Images:** replace `ImagePlaceholder` components with real photography (search for `ImagePlaceholder` in `src/`)
7. **Marketing:** work `docs/LAUNCH-PLAN-30-DAYS.md` day by day

## Repository map
```
src/lib/site.ts            ← central config (ALL placeholders)
src/lib/data.ts            ← services, pricing tiers, FAQs, lead magnets
src/lib/blog.ts            ← published + planned articles
src/app/                   ← all pages (App Router)
src/components/            ← header, footer, forms, ATS checker, cards…
content/lead-magnets/      ← lead magnet source content (markdown)
public/downloads/          ← placeholder PDFs (regenerate: npm run pdfs)
scripts/                   ← PDF generator
docs/                      ← this folder: setup + marketing system
```

## Page inventory (24 public pages + admin)
Home · Services hub · CV/Résumé Services · LinkedIn Optimisation · Career Coaching · ATS-Aware CV Review (with free in-browser checker) · International CVs · Graduate CVs · Executive Profiles · Pricing · How It Works · About David · Resources (blog + downloads) · 3 published articles · Free CV Checklist · Upload CV · Book a Call · FAQs · Contact · Privacy · Terms · Disclaimer · Refund Policy · Cookie Policy · Payment Success · Payment Cancelled · 404 · `/admin` (local order tracker, noindexed)

## Compliance posture (do not weaken)
- No guaranteed interviews / offers / ATS passes / salary claims anywhere.
- Advisory disclaimers on the ATS tool, pricing, FAQs, footer and legal pages.
- Consent checkbox on CV upload (required field).
- Credentials marked "to be verified before publication" until confirmed.
- The ATS checker runs client-side only — CV text never leaves the visitor's browser.
- Testimonials: real and permissioned only; templates in `docs/MARKETING-COPY.md` §7.

## Upgrade path (when volume justifies it)
1. **Supabase** (free tier): store enquiries + CV files (private storage bucket), replace Formspree.
2. **Next.js route handlers** + **Stripe webhook**: record orders automatically; secret key only in server env vars (Vercel project settings) — never in the repo.
3. Wire `/admin` to Supabase auth + data: the UI and status workflow (New enquiry → Paid → Documents received → In review → Drafting → Delivered → Revision requested → Complete) is already built in `src/components/AdminDashboard.tsx`.
4. **Email automation:** connect form events to the sequences in `docs/EMAIL-FUNNELS.md`.
