# Current State Audit — Construction Phase Safety Planner

**Date:** 2026-07-02 · **Auditor:** Claude Code (senior game dev / SMSTS SME / QA)
**Repository:** `dm1033/dm1033` (branch `main` at time of audit)

## 1. What exists in this repository

The repository contains **two separate construction-safety training applications**, built
in separate sessions:

| | `construction-phase-planner/` (this product) | `/` repo root — "SiteSafe" |
|---|---|---|
| Stack | Vite + React 19 + TypeScript strict + Tailwind v4 | Next.js 14 (App Router) + Supabase + Stripe + jsPDF |
| Runtime needs | None — fully static, offline-capable (service worker) | Node server; Supabase/Stripe keys for full function; demo mode without keys |
| Scenarios | 3 deep scenarios × 15 phases, ~70 scored decisions, 10-event random pools each | 5 shallower stage-based scenarios (linear decision list) |
| Interactivity | Drag-and-drop zoned site planner, TW register (7 fields/item), permit selection, incident events, live CPP builder | Stage decisions with layout effect visualisation |
| Assessment | 7 discipline scores + 5 meters, critical failures, missed-items, model-answer overlay, 10 mapped learning objectives enforced by validator | Single score vs ideal controls |
| Persistence | localStorage autosave (untested error paths) | Supabase Postgres + RLS (when configured) |
| Multi-user | None (single browser profile; tutor shares device) | Auth, delegate/trainer/admin roles, trainer dashboard |
| Reports | 13 on-screen report tabs, print-to-PDF, CSV exports | PDF via jsPDF, trainer score list |
| Billing | Placeholder tiers + Stripe link stubs | Stripe subscription code paths |
| Tests | Data validator + 3 Playwright E2E full playthroughs (all passing) | None found |
| Verified in this environment | Yes — typecheck, build, E2E ×3, screenshots | Structure reviewed; **not run** (Next server + keys not exercised here); README claims demo mode works |

## 2. Technology stack and structure (primary product)

`construction-phase-planner/`: see `README.md` → Project structure. Engine
(`src/engine/`), typed schema (`src/types.ts`), data-driven scenario JSON validated by
`scripts/validate-data.ts`, screens/components in React, state in a single reducer with
localStorage persistence.

## 3. Runtime verification performed

- `npm run check` — clean
- `npm run validate:data` — 3/3 scenarios valid (incl. objective-mapping gate)
- `npm run build` — clean (~160 kB gzip)
- Playwright E2E: 3/3 scenarios play home → 15 phases → all report tabs, zero console errors
- Screenshots: desktop 1440×900 and tablet 1024×768 (`docs/screenshots/`)

## 4. Strategic recommendation

**Demonstrate CITB on the Construction Phase Safety Planner.** It is deeper as an
assessment instrument, has no infrastructure dependencies (reliable on a laptop,
offline), and already evidences learning-outcome coverage.

**Retain SiteSafe as the multi-user platform track.** Cohorts, invitations, secure
authentication, server-side persistence and subscription billing (all in the brief) are
architecturally SiteSafe's strengths. The pilot-phase plan should port the planner's
engine and content into that backend (or add a Supabase adapter to the planner) rather
than duplicating either codebase. Recorded in `IMPROVEMENT_BACKLOG.md` as the
"platform convergence" epic.

## 5. Compliance posture (verified in copy)

- Alignment wording used throughout; no CITB approval claims; disclaimer on home screen,
  score report and certificate. Certificate states it is not a CITB certificate.
- Source publications (CITB GE700 A/B/D received chunks) used as paraphrased reference
  only; reading notes kept out of the repository; `docs/SOURCE-ALIGNMENT.md` maps
  chapters → game coverage.

## 6. Headline gaps against the product brief

See `KNOWN_ISSUES.md` and `IMPROVEMENT_BACKLOG.md`. The largest: 7-tier decision
classification, weighted competency scoring with a critical-failure gate, distinct
Learning/Assessment/Tutor/Demo modes, delayed consequences, phase-end feedback, save
status indicator + recovery export, savings calculator, CITB demo pack, cohort-level
tutor analytics (platform track), WCAG 2.2 AA audit, PDF report generation beyond
browser print.
