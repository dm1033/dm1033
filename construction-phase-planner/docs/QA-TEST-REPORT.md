# QA / Test Report

**Application:** Construction Phase Planner — SMSTS Safety Challenge v1.0.0
**Date:** 2026-07-02
**Environment:** Node 22 · Vite 8 · React 19 · TypeScript 6 (strict) · Chromium (Playwright)

## 1. Static analysis

| Check | Command | Result |
|---|---|---|
| TypeScript strict typecheck | `npm run check` | ✅ PASS — 0 errors |
| Production build | `npm run build` | ✅ PASS — bundle ~536 kB (158 kB gzip) |
| Scenario data validation | `npm run validate:data` | ✅ PASS — all 3 files valid |

### Scenario data validation detail

The validator (`scripts/validate-data.ts`) enforces: 15 phases numbered 1–15; ≥12 decisions
per scenario; exactly one `best` option per decision; valid option qualities; impact keys
restricted to the scoring/meter schema; site items restricted to the shared catalogue; zone
rectangle bounds within the grid; zone references resolvable; ≥5 TW register items with
valid design/category/responsible values; permit `required` ⊆ options; event pools ≥5 with
`eventDraw` ≤ pool size; unique step ids.

| Scenario | Phases | Decisions | Pool events | Site setup | TW step | Permit step |
|---|---|---|---|---|---|---|
| 1 — Small Commercial Extension | 15 | 26 | 8 | 1 | 1 (8 items) | 1 (6 required) |
| 2 — City Centre Refurb & Demolition | 15 | 22 | 8 | 1 | 1 (10 items) | 1 (6 required) |
| 3 — Utilities & Roadworks | 15 | 21 | 8 | 1 | 1 (9 items) | 1 (6 required) |

All three scenarios populate all 15 authorable CPP sections (project description is
populated from the scenario base text).

## 2. End-to-end playthroughs (automated, Chromium)

`scripts/smoke-test.ts` plays a complete game — home → scenario select → all 15 phases,
answering every decision, submitting the site planner, completing every TW register field,
selecting permits, resolving all incident events — then opens all 12 report tabs.

| Run | Result | Notes |
|---|---|---|
| Scenario 1 full playthrough | ✅ PASS (68 steps) | Report reached; 12/12 report tabs render; 0 console/page errors |
| Scenario 2 full playthrough | ✅ PASS (60 steps) | Report reached; 12/12 report tabs render; 0 console/page errors |
| Scenario 3 full playthrough | ✅ PASS (58 steps) | Report reached; 12/12 report tabs render; 0 console/page errors |

Also verified during E2E: scoring dashboard updates live; RAG bars move with decisions;
critical failures surface in the sidebar; CPP panel populates progressively; certificate
renders delegate name, scenario, score and grade band.

## 3. Functional checks (manual/scripted)

| Area | Check | Result |
|---|---|---|
| Site planner | Click-to-place, drag-and-drop, removal, blocked zones (road/buildings) refuse items, required-item counter | ✅ |
| Site planner scoring | Good/neutral/unsafe/missing assessment vs zone rules; unsafe placements penalise safety and raise incident likelihood | ✅ |
| TW register | Submit disabled until all fields answered per item; per-field marking with required values shown | ✅ |
| Permits | Missed-required flagged red, non-essential selections flagged amber | ✅ |
| Event draw | 3 events drawn per run from pool of 8, stable across reload (persisted ids) | ✅ |
| Persistence | Game resumes from localStorage after reload; answered step re-entry guarded against double-scoring | ✅ |
| Tutor mode | Access code gate, pause overlay, reveal-answer highlighting (decisions, TW, site planner), delegate choice table vs best answers, custom questions injected into Phase 12, custom hazards in risk panel, reset, CSV export | ✅ |
| Reports | Print stylesheet emits only the active report; CSV downloads for TW register, permit tracker, inspection tracker, environmental checklist, decision log | ✅ |
| Offline | Service worker registers in production build and caches app shell | ✅ (registration verified; long-term cache behaviour needs field testing) |
| Responsive | 1440×900 desktop and 1024×768 tablet layouts verified by screenshot | ✅ |
| Licensing | Placeholder tiers render; licence key format validation and local persistence work; no secrets in client | ✅ |

Screenshots: `docs/screenshots/`.

## 4. Known limitations / deferred items

1. **Licence key validation is format-only** — production requires a licensing backend.
2. **Tutor access code is a client-side constant** (`TUTOR`) — replace before commercial use.
3. **Single-device model** — delegate and tutor share a browser profile (classroom
   projector / shared-tablet pattern). Multi-device tutor dashboards would need a backend.
4. **PDF output uses the browser print dialog** (deliberate: dependency-free and offline);
   pixel-perfect branded PDFs would need a PDF library.
5. **Certificate is a placeholder** by design, per compliance requirements.
6. Bundle is a single chunk (~536 kB). Acceptable for offline-first use; code-splitting per
   scenario is a future optimisation.

## 5. Content compliance review

- No CITB/HSE publication text reproduced; all scenario copy is original.
- Alignment wording used throughout ("SMSTS-aligned learning game… does not replace formal
  CITB training, assessment or certification"; "not endorsed or approved by CITB").
- Required legal disclaimer displayed on the home screen, score report and certificate.
- Certificate explicitly states it is not a CITB certificate.

**Overall assessment: RELEASE-READY for training-pilot use**, subject to the production
hardening checklist in `docs/DEPLOYMENT.md`.
