# Technical Architecture — SiteSafe (Construction Safety Training Game)

## 1. Overview
SiteSafe is a commercial, web-based construction safety training game for UK
construction training providers. Delegates work through a realistic site set-up
lifecycle for one of five project scenarios, making safety decisions that shape
the visible site layout, the project risk profile, a generated Construction
Phase Plan (CPP) and a final score benchmarked against ideal CDM 2015 controls.

The product is structured around UK good practice: **CDM 2015**, **CITB
SMSTS** learning outcomes, **RAMS**, **ITPs**, **permits-to-work**, **welfare
(CDM Schedule 2)**, **traffic management**, **temporary works (BS 5975)**,
**lifting (LOLER/PUWER)**, **excavations**, **work at height (WAHR 2005)**,
**emergency planning** and **site security**.

## 2. Tech stack
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 (App Router) + TypeScript** | SSR/RSC, route handlers for APIs, single deployable. |
| UI | **Tailwind CSS** + lightweight component primitives + `lucide-react` icons | Clean, responsive, fast to build. |
| Auth | **Supabase Auth** (email/password, magic link ready) | Managed auth + JWT that powers Row Level Security. |
| Database | **Supabase Postgres** with **Row Level Security** | Relational model fits scenarios→stages→decisions; RLS enforces roles. |
| Payments | **Stripe** (Checkout + Billing Portal + webhooks) | Subscriptions / seat entitlement for training providers. |
| PDF | **jsPDF + jspdf-autotable** (client-side) | Reliable, no SSR/native deps; generates the downloadable report. |
| Validation | **zod** | Runtime validation for admin edits and API payloads. |

## 3. Runtime topology
```
            ┌─────────────────────────────────────────────┐
  Browser ──┤ Next.js (Vercel/Node)                        │
            │  • RSC pages (catalogue, dashboards, admin)  │
            │  • Client gameplay engine (in-browser state) │
            │  • Route handlers: /api/sessions, /api/stripe │
            └───────────────┬─────────────────────────────┘
                            │ @supabase/ssr (cookie-bound JWT)
                            ▼
            ┌─────────────────────────────────────────────┐
            │ Supabase                                     │
            │  • Auth (users)                              │
            │  • Postgres + RLS (profiles, scenarios,...)  │
            └─────────────────────────────────────────────┘
                            ▲
            Stripe ─────────┘  (webhooks → entitlement)
```

## 4. Key architectural decisions
1. **Gameplay is client-side state, persistence is server-side.** A delegate
   plays a scenario entirely in the browser (instant, no round-trips). On
   completion the session, choices and generated CPP are persisted via
   `/api/sessions` to Supabase. This keeps the game snappy and lets the app be
   demoed even before Supabase is configured.
2. **Content is data, not code.** Scenarios/stages/decisions live in Postgres.
   The single source of truth for seed content is `content/scenarios.json`,
   which both seeds the DB (`scripts/build-content.mjs` → `supabase/seed.sql`)
   and acts as a read-only fallback when Supabase env vars are absent.
3. **Roles enforced in the database.** `profiles.role` (`delegate|trainer|admin`)
   drives RLS policies and UI gating, so a delegate can never read another
   delegate's sessions and only admins can mutate content.
4. **The scoring/CPP/risk logic is pure and isolated** in `lib/game/*` so it can
   be unit-tested and reused by both the client engine and server report code.

## 5. Security model (summary — see DATABASE_SCHEMA.md)
- All tables have RLS enabled.
- `delegate`: read published content; read/write **only their own** sessions.
- `trainer`: additionally read sessions for delegates in their organisation.
- `admin`: full read/write on content + read all sessions.
- Stripe webhook is the **only** writer of entitlement fields, verified by
  signature.

## 6. Environments & config
All secrets via env (`.env.example` documents them). No secret is committed.
The app degrades gracefully: if `NEXT_PUBLIC_SUPABASE_URL` is unset it runs in
**demo mode** (static content, no persistence, auth disabled).

## 7. Folder map
See `FILE_STRUCTURE.md`. Build order in `MVP_BUILD_PLAN.md`.
