# MVP Build Plan — SiteSafe

Each step is independently committable. ✅ = covered in this MVP build.

## Phase 0 — Foundations ✅
- [x] Planning docs (architecture, schema, journeys, file structure, plan).
- [x] Next.js + TypeScript + Tailwind scaffold, config, `.env.example`.
- [x] Shared types (`lib/types.ts`) and env helper.

## Phase 1 — Content model ✅
- [x] Author 5 scenarios × 6 stages × 3 decisions in `scripts/build-content.mjs`.
- [x] Generate `content/scenarios.json` (app fallback) + `supabase/seed.sql`.
- [x] CDM-aligned spine: Mobilisation/Welfare/Security → Logistics/Traffic →
      Excavations/Temporary Works → Work at Height → Lifting → RAMS/Permits/
      ITPs/Emergency.

## Phase 2 — Database & auth ✅
- [x] Migrations: enums, tables, RLS policies, `handle_new_user` trigger.
- [x] Supabase clients (browser/server/middleware) + auth pages + callback.
- [x] Demo-mode fallback when Supabase env absent.

## Phase 3 — Game engine (feature 4 & 5) ✅
- [x] Pure engine/reducer: progress stages, apply score + risk + layout.
- [x] `GamePlayer` client component: stage prompt, decisions, live feedback,
      site layout + risk meter updates.
- [x] Each decision surfaces: choice text, safety impact, legal/compliance
      impact, score effect, explanation, layout effect.

## Phase 4 — CPP, scoring, report, PDF (features 6,7,8) ✅
- [x] `cpp.ts` generates a structured Construction Phase Plan draft.
- [x] `scoring.ts`: score %, banding, risk rating, chosen-vs-ideal comparison.
- [x] `ReportView` UI; `pdf.ts` downloadable PDF (score + CPP).
- [x] Persist session/choices/CPP via `/api/sessions`.

## Phase 5 — Dashboards (features 9 & 10) ✅
- [x] Delegate dashboard (own history).
- [x] Trainer dashboard (org delegates' scores).
- [x] Admin area: CRUD scenarios/stages/decisions/scoring (server actions + zod).

## Phase 6 — Billing ✅
- [x] Stripe Checkout + Billing Portal + webhook (entitlement on
      organisations). Functional once keys are added.

## Phase 7 — Hardening (post-MVP backlog)
- [ ] Unit tests for scoring/CPP; E2E happy path.
- [ ] Per-org branding on PDF/report.
- [ ] Timed mode, leaderboards, certificates.
- [ ] Image assets for scenarios & richer SVG site layouts.
- [ ] Audit log for admin content changes.

## How to run (after keys added)
1. `npm install`
2. Create a Supabase project; run `supabase/migrations/*` then `supabase/seed.sql`.
3. Copy `.env.example` → `.env.local`, fill Supabase + Stripe keys.
4. `npm run dev` → http://localhost:3000  (works in demo mode without keys).
5. Regenerate content after edits: `npm run build:content`.
