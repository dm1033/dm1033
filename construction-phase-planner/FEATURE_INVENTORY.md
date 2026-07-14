# Feature Inventory — Construction Phase Safety Planner

Status: ✅ working & verified · 🔶 working with limitations · 🧩 placeholder by design

## Gameplay
- ✅ Three scenarios (commercial extension / city refurb & demolition / utilities & roadworks), each 15 phases, fully playable
- ✅ Decision cards with 4 options, feedback, learning notes, topic tags
- ✅ Drag-and-drop zoned site planner with placement assessment (good/neutral/unsafe/missing)
- ✅ Temporary works register: 8–10 items × 7 control fields per scenario, per-field marking
- ✅ Permit selection with required/not-essential assessment
- ✅ Randomised incident events (3 drawn per run from pools of 9–10) + fixed events
- ✅ Tutor-injected custom questions appear as Phase-12 events
- ✅ Critical-failure capture on unsafe options
- ✅ Reload-resume with double-scoring guard

## Assessment & scoring
- ✅ 7 discipline scores (earned/possible normalisation) + 5 project meters
- ✅ Grade bands; missed-items derivation (permits, TW, inspections, environment, placements)
- ✅ 10 SMSTS-aligned learning objectives mapped to deterministic steps in every scenario (validator-enforced) with per-outcome RAG + performance
- ✅ 7-tier decision classification (Excellent → Critical Failure), derived deterministically; rules in docs/SCORING-MODEL.md
- ✅ Weighted 9-area competency model (30/15/15/10/10/5/5/5/5) with per-area evidence counts
- ✅ Critical-failure gate: unresolved critical failure prevents a competent result regardless of score (verified by engine tests + screenshot evidence)
- ✅ Delayed-consequence engine: 7 rules (5 adverse, 2 positive) fire in later phases from earlier decisions/meter build-up, once per run, logged and reported
- 🔶 No recovery-decision tracking (initial error + recovery quality)

## Documents built during play
- ✅ Construction Phase Plan (16 sections, populated by decision quality)
- ✅ Risk register, TW register, permit register, incident log (live panels)
- 🔶 No change-control record, action tracker or handover checklist documents

## Reports (13 tabs)
- ✅ Score report, CPP, risk summary, TW register, permit tracker, inspection tracker,
  environmental checklist, incident log, missed items, model-answer overlay (site plan
  comparison), learning objectives, tutor review sheet, certificate placeholder
- ✅ Print-to-PDF (browser) + CSV exports (5 files)
- 🔶 PDF is browser-print based; no branded/paginated PDF engine
- 🔶 No delegate reflection / trainer comment capture in report

## Modes
- ✅ Learning-style play (immediate feedback) — current default
- ✅ Tutor mode: pause, reveal answers, delegate decision table vs best answers, custom questions/hazards, reset, CSV
- ✅ Assessment Mode: feedback and model answers deferred to the final report; tutor reveal disabled; E2E-tested
- ✅ Demonstration Mode: docked 13-beat presenter script panel + docs/citb/CITB_DEMO_SCRIPT.md

## Persistence
- ✅ Autosave to localStorage after every decision (reducer-level)
- ✅ Resume session on reload; new-scenario overwrite warning
- ✅ Save-status indicator (write-verified), Save & Exit, recovery-file export/import
- 🔶 No revision history / duplicate-session protection
- 🔶 No server-side persistence (platform track: SiteSafe/Supabase)

## Accessibility / responsiveness
- ✅ Desktop + tablet layouts verified by screenshot
- ✅ Keyboard-accessible site planner (focusable labelled cells, Enter/Space placement), global focus-visible indicator, reduced-motion support, skip-to-content link, aria-live save status
- 🔶 Full WCAG 2.2 AA audit still outstanding (contrast measurement, full screen-reader pass)

## Commercial
- 🧩 Licence tiers, Stripe payment-link stubs, licence key screen (format-only)
- ✅ Objective-coverage evidence report (provider-facing value)
- ✅ Savings calculator (editable inputs, all outputs labelled illustrative)
- 🧩 Tutor access code is a client constant (`TUTOR`)

## Quality infrastructure
- ✅ Scenario JSON validator (structural + objective-coverage gates)
- ✅ Playwright E2E playthroughs ×3 scenarios; screenshots script
- ✅ Engine test suite (classification, weighting, gate, bands) via scripts/test-engine.ts
- 🔶 No CI workflow in repo
