# CITB Demo Readiness Report

Updated: 2026-07-02 (post-audit, pre-iteration)

## Product scorecard (0–100, honest self-assessment)

| Category | Score | Notes |
|---|---|---|
| Learning quality | 88 | Phase-end feedback summaries + Learning/Assessment/Tutor/Demo modes |
| Construction accuracy | 85 | UK-correct; source-verified where chapters received; verification ongoing |
| Decision assessment | 88 | 7-tier classification, weighted 9-area model, critical-failure gate — engine-tested |
| Scenario depth | 85 | 3 scenarios × 15 phases × ~25 steps; delayed consequences pending |
| Saving & recovery | 78 | Write-verified save indicator, Save & Exit, recovery export/import; revision history pending |
| Tutor functionality | 65 | Strong single-device tutor console; no cohorts/analytics (backend) |
| Report quality | 80 | 13 tabs + CSV + objective evidence; print-PDF only |
| Accessibility | 55 | Responsive + click-to-place; no formal WCAG pass |
| Technical reliability | 88 | Typecheck/build/E2E×3 green; static app, no infra to fail |
| CITB demonstration readiness | 82 | Demo mode with docked script, full collateral pack in docs/citb/ |
| Commercial readiness | 72 | Savings calculator live (illustrative); value case + pilot proposal drafted |

**Lowest category now: accessibility (55) → next iteration focus**, followed by delayed consequences and recovery mechanic (see backlog items 9–10).

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
| Demonstration mode works | ✅ demo mode + script panel |
| Mobile/tablet usable | ✅ tablet verified; phone secondary |
| No major accessibility failure | ❌ audit outstanding |
| No critical security issue | ✅ static app, no secrets, no PII collected |

## Demo environment plan
Static build runs from a laptop with `npx serve dist` or double-click via any static
server; offline-capable after first load. No accounts, keys or network needed. Seeded
demo delegate name and scripted walkthrough arrive with Demonstration Mode.
