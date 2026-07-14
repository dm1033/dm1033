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
- 🔶 Decision classification is 4-tier (best/partial/poor/unsafe) — brief requires 7-tier
- 🔶 No weighted competency model yet (brief specifies 9 areas with % weights)
- 🔶 Numeric grade not yet gated by unresolved critical failures
- 🔶 No delayed-consequence engine (meters move immediately only)
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
- 🔶 No formal Assessment Mode (feedback withheld until completion)
- 🔶 No scripted Demonstration Mode

## Persistence
- ✅ Autosave to localStorage after every decision (reducer-level)
- ✅ Resume session on reload; new-scenario overwrite warning
- 🔶 No save-status indicator, manual save/exit, recovery-file export, revision history
- 🔶 No server-side persistence (platform track: SiteSafe/Supabase)

## Accessibility / responsiveness
- ✅ Desktop + tablet layouts verified by screenshot
- 🔶 No WCAG 2.2 AA audit yet; colour-only meaning in places (RAG bars carry numbers, but review needed); no reduced-motion option; keyboard/screen-reader pass outstanding

## Commercial
- 🧩 Licence tiers, Stripe payment-link stubs, licence key screen (format-only)
- ✅ Objective-coverage evidence report (provider-facing value)
- 🔶 No savings calculator yet
- 🧩 Tutor access code is a client constant (`TUTOR`)

## Quality infrastructure
- ✅ Scenario JSON validator (structural + objective-coverage gates)
- ✅ Playwright E2E playthroughs ×3 scenarios; screenshots script
- 🔶 No unit tests for scoring engine; no CI workflow in repo
