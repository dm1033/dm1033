# SiteSafe — UK Construction Safety Training Game

An interactive, commercial web app for UK construction training providers. Delegates
choose one of five project scenarios and work through a realistic site set-up
lifecycle, making safety decisions that shape the visible site layout, the project
risk profile, a generated **Construction Phase Plan (CPP)** and a final score
benchmarked against ideal **CDM 2015** controls.

Built with **Next.js (App Router) + TypeScript**, **Supabase** (Postgres + Auth +
RLS), **Stripe** (subscriptions) and **Tailwind CSS**.

## Features (MVP)
1. User login (Supabase Auth).
2. Roles: **delegate**, **trainer**, **admin** (enforced by RLS).
3. Five selectable project scenarios.
4. Stage-by-stage decision engine.
5. Each decision carries choice text, safety impact, legal/compliance impact,
   score effect, explanation and a layout effect.
6. Auto-generated Construction Phase Plan draft.
7. Final score report comparing the delegate's choices against ideal controls.
8. Downloadable PDF report (score + CPP).
9. Trainer dashboard of delegate scores.
10. Admin area to edit scenarios, stages, decisions and scoring.

## Quick start
```bash
npm install
npm run dev            # http://localhost:3000 — works in DEMO MODE with no keys
```

**Demo mode**: with no Supabase env vars set, the app serves the five seed
scenarios from `content/scenarios.json`, the game is fully playable, the report
and PDF work, but auth/persistence/admin/billing are disabled.

## Going live (Supabase + Stripe)
1. Create a Supabase project. In the SQL editor run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_policies.sql`
   - `supabase/seed.sql`
2. Copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`, `NEXT_PUBLIC_SITE_URL`
3. Point a Stripe webhook at `/api/stripe/webhook` (events:
   `checkout.session.completed`, `customer.subscription.updated|deleted`).
4. `npm run dev`.

## Editing content
Seed content is authored in `scripts/build-content.mjs` (single source of truth).
After editing, regenerate both the app fallback and the DB seed:
```bash
npm run build:content   # → content/scenarios.json + supabase/seed.sql
```
Admins can also edit scenarios/stages/decisions/scoring live in the **Admin** area.

## Scripts
| script | purpose |
|--------|---------|
| `npm run dev` | start dev server |
| `npm run build` / `start` | production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run build:content` | regenerate seed content |

## Documentation
See [`docs/`](./docs): architecture, database schema, user journeys, file
structure and the MVP build plan.

> For training purposes only — not a substitute for professional safety advice or a
> project-specific Construction Phase Plan.
