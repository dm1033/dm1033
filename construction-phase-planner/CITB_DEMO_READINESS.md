# CITB Demo Readiness Report

Updated: 2026-07-02 (post iteration 3 — recovery mechanic + engagement layer)

## Product scorecard (0–100, honest self-assessment)

| Category | Score | Notes |
|---|---|---|
| Learning quality | 90 | Phase-end feedback summaries + Learning/Assessment/Tutor/Demo modes |
| Construction accuracy | 85 | UK-correct; source-verified where chapters received; verification ongoing |
| Decision assessment | 88 | 7-tier classification, weighted 9-area model, critical-failure gate — engine-tested |
| Scenario depth | 88 | 3 scenarios × 15 phases × ~25 steps + delayed-consequence layer |
| Saving & recovery | 78 | Write-verified save indicator, Save & Exit, recovery export/import; revision history pending |
| Tutor functionality | 65 | Strong single-device tutor console; no cohorts/analytics (backend) |
| Report quality | 80 | 13 tabs + CSV + objective evidence; print-PDF only |
| Accessibility | 68 | Keyboard planner, focus indicators, reduced motion, skip link; formal WCAG audit pending |
| Technical reliability | 88 | Typecheck/build/E2E×3 green; static app, no infra to fail |
| CITB demonstration readiness | 82 | Demo mode with docked script, full collateral pack in docs/citb/ |
| Commercial readiness | 72 | Savings calculator live (illustrative); value case + pilot proposal drafted |

**Lowest category now: tutor functionality (65)** — cohort/analytics needs the backend decision (backlog 18); next code-level items: recovery mechanic (10), decision-record enrichment (11), trainer comments/audit id on reports (13).

## Mandatory quality gates

| Gate | Status |
|---|---|
| All three scenarios playable | ✅ verified E2E |
| Decisions receive transparent scores | ✅ weighted 7-tier model live |
| Good/bad decisions create consequences | ✅ immediate + delayed (7-rule engine, tested) |
| Critical-failure logic works | ✅ gate live and engine-tested |
| Partial credit works | ✅ |
| Delegate progress autosaves | ✅ with write-verified indicator |
| Sessions resumable | ✅ verified |
| Final reports download correctly | ✅ print-PDF + CSV verified |
| Tutor dashboard works | ✅ single-device scope |
| Model-answer comparison works | ✅ |
| Demonstration mode works | ✅ demo mode + script panel |
| Mobile/tablet usable | ✅ tablet verified; phone secondary |
| No major accessibility failure | 🔶 keyboard/motion/focus addressed; formal audit outstanding |
| No critical security issue | ✅ static app, no secrets, no PII collected |

## Demo environment plan
Static build runs from a laptop with `npx serve dist` or double-click via any static
server; offline-capable after first load. No accounts, keys or network needed. Seeded
demo delegate name and scripted walkthrough arrive with Demonstration Mode.
