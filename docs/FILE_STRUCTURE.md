# File Structure — SiteSafe

```
.
├─ docs/                          # planning artifacts (this folder)
│  ├─ ARCHITECTURE.md
│  ├─ DATABASE_SCHEMA.md
│  ├─ USER_JOURNEY.md
│  ├─ FILE_STRUCTURE.md
│  └─ MVP_BUILD_PLAN.md
│
├─ content/
│  └─ scenarios.json             # single source of truth for seed content
│
├─ scripts/
│  └─ build-content.mjs          # authors content → scenarios.json + seed.sql
│
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_init.sql           # enums + tables
│  │  └─ 0002_policies.sql       # RLS + helper functions + trigger
│  └─ seed.sql                   # generated seed (5 scenarios)
│
├─ lib/
│  ├─ types.ts                   # shared TS types (DB + game)
│  ├─ env.ts                     # env access + isSupabaseConfigured()
│  ├─ supabase/
│  │  ├─ client.ts               # browser client
│  │  ├─ server.ts               # server (RSC/route) client
│  │  └─ middleware.ts           # session refresh helper
│  ├─ stripe/
│  │  └─ stripe.ts               # Stripe SDK + helpers
│  ├─ game/
│  │  ├─ content.ts              # load scenarios (DB or fallback)
│  │  ├─ engine.ts               # gameplay state reducer
│  │  ├─ scoring.ts              # score %, banding, risk rating
│  │  ├─ cpp.ts                  # Construction Phase Plan generator
│  │  └─ pdf.ts                  # jsPDF report builder
│  └─ utils.ts                   # cn() + small helpers
│
├─ components/
│  ├─ ui/                        # Button, Card, Badge, Input, Select, Textarea
│  ├─ SiteLayout.tsx             # visual site plan (SVG)
│  ├─ RiskMeter.tsx              # risk index gauge
│  ├─ StageCard.tsx              # stage prompt + decisions
│  ├─ GamePlayer.tsx             # client gameplay orchestrator
│  ├─ ReportView.tsx             # score report UI
│  └─ Nav.tsx / RoleGate.tsx     # nav + role gating
│
├─ app/
│  ├─ layout.tsx                 # root layout + Nav
│  ├─ globals.css
│  ├─ page.tsx                   # marketing landing
│  ├─ login/page.tsx
│  ├─ signup/page.tsx
│  ├─ auth/callback/route.ts
│  ├─ auth/signout/route.ts
│  ├─ dashboard/page.tsx         # delegate
│  ├─ scenarios/page.tsx         # catalogue
│  ├─ play/[slug]/page.tsx       # loads content → GamePlayer
│  ├─ report/[sessionId]/page.tsx
│  ├─ trainer/page.tsx
│  ├─ admin/
│  │  ├─ page.tsx                # scenarios list
│  │  ├─ scenarios/[id]/page.tsx # stages + decisions editor
│  │  └─ actions.ts             # server actions (CRUD, validated)
│  └─ api/
│     ├─ sessions/route.ts       # persist completed session + CPP
│     └─ stripe/
│        ├─ checkout/route.ts
│        ├─ portal/route.ts
│        └─ webhook/route.ts
│
├─ middleware.ts                 # auth session refresh
├─ .env.example
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ tsconfig.json
├─ package.json
└─ README.md
```
