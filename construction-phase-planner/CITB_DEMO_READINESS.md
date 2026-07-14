# CITB Demo Readiness Report

Updated: 2026-07-02 (post-audit, pre-iteration)

## Product scorecard (0–100, honest self-assessment)

| Category | Score | Notes |
|---|---|---|
| Learning quality | 82 | Deep judgement-testing content; phase feedback + assessment mode pending |
| Construction accuracy | 85 | UK-correct; source-verified where chapters received; verification ongoing |
| Decision assessment | 68 | Transparent but 4-tier; no weighting or critical gate yet |
| Scenario depth | 85 | 3 scenarios × 15 phases × ~25 steps; delayed consequences pending |
| Saving & recovery | 60 | Autosave + resume work; no indicator/export/history |
| Tutor functionality | 65 | Strong single-device tutor console; no cohorts/analytics (backend) |
| Report quality | 80 | 13 tabs + CSV + objective evidence; print-PDF only |
| Accessibility | 55 | Responsive + click-to-place; no formal WCAG pass |
| Technical reliability | 88 | Typecheck/build/E2E×3 green; static app, no infra to fail |
| CITB demonstration readiness | 60 | Reliable to run, but no scripted demo mode or collateral yet |
| Commercial readiness | 60 | Tiers/keys placeholder; objective evidence strong; no savings calculator |

**Lowest categories → current iteration focus:** accessibility (tracked), saving
indicators, demo mode/collateral, decision assessment upgrade (chosen first — priority
ladder puts assessment correctness above all).

## Mandatory quality gates

| Gate | Status |
|---|---|
| All three scenarios playable | ✅ verified E2E |
| Decisions receive transparent scores | ✅ (upgrading to weighted 7-tier this iteration) |
| Good/bad decisions create consequences | 🔶 immediate only |
| Critical-failure logic works | 🔶 captured & reported; result gate this iteration |
| Partial credit works | ✅ |
| Delegate progress autosaves | ✅ (indicator this iteration) |
| Sessions resumable | ✅ verified |
| Final reports download correctly | ✅ print-PDF + CSV verified |
| Tutor dashboard works | ✅ single-device scope |
| Model-answer comparison works | ✅ |
| Demonstration mode works | ❌ this iteration |
| Mobile/tablet usable | ✅ tablet verified; phone secondary |
| No major accessibility failure | ❌ audit outstanding |
| No critical security issue | ✅ static app, no secrets, no PII collected |

## Demo environment plan
Static build runs from a laptop with `npx serve dist` or double-click via any static
server; offline-capable after first load. No accounts, keys or network needed. Seeded
demo delegate name and scripted walkthrough arrive with Demonstration Mode.
