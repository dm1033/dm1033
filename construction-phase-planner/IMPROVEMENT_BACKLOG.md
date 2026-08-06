# Improvement Backlog

Ordered by the brief's priority ladder: (1) assessment correctness, (2) broken core
function, (3) data-loss risk, (4) CITB demo impact, (5) learner usability, (6) trainer
admin, (7) accessibility, (8) polish, (9) commercial.

## Delivered this iteration ✅ (items 1–8)
| # | Item | Problem | Solution | Acceptance criteria | Risk / rollback |
|---|------|---------|----------|--------------------|-----------------|
| 1 | Critical-failure gate + new grade bands | High average can mask a critical failure | Weighted score model computes result; any unresolved critical failure caps outcome at "Insufficient evidence of competence (critical failure)" with the score still shown | Unit-style test: run with critical failure → capped result; E2E passes | Pure additive engine module; revert commit |
| 2 | 7-tier decision classification | 4 tiers insufficient for defensible assessment | Deterministic derivation from authored quality + score attainment (documented rules in `docs/SCORING-MODEL.md`), leaving authored `quality` as source of truth; explicit per-option override field supported | Every recorded decision shows one of 7 classes; distribution sane across a full run | Additive mapping; revert commit |
| 3 | Weighted competency model (9 areas) | Brief requires declared weights | Topic-rule mapping of steps → 9 areas; per-area score from decision/step performance; weighted overall (30/15/15/10/10/5/5/5/5) shown beside area detail | Report shows overall + 9 areas + weights; sums to 100% | Additive; existing 7-category dashboard retained |
| 4 | Assessment / Learning / Tutor / Demo modes | Feedback always immediate | Mode chosen at scenario start; Assessment defers all feedback & learning notes to the report; Demo adds scripted beat panel | E2E: assessment run shows no feedback mid-game, full report at end | Mode flag defaults to learning; revert |
| 5 | Save status indicator + Save & Exit + recovery export/import | Data-loss risk invisible to user | Reducer persistence wrapped with status (saved/saving/error) surfaced in header; JSON recovery file export/import | Indicator visible; export→wipe→import restores run | Additive |
| 6 | Phase-end feedback summaries | Brief requires per-phase feedback | Interstitial at phase transition (learning mode): phase performance, strengths, missed controls, consequences | Appears after each phase; suppressed in assessment mode | Additive |
| 7 | Savings calculator | Value case needs evidence-based illustration | Editable-input calculator screen, all outputs labelled illustrative | Inputs editable; totals update; no fabricated claims | Additive screen |
| 8 | CITB demo pack docs | Demo requires script & collateral | `CITB_DEMO_SCRIPT.md`, `CITB_PRESENTATION_NOTES.md`, `CITB_QUESTIONS_AND_ANSWERS.md`, `PRODUCT_VALUE_CASE.md`, `PILOT_PROPOSAL.md` | Docs exist, compliant wording | Docs only |

## Delivered iteration 4 ✅
- (11, part / 13, part) Audit trail — unique run audit ID (shown on report header + decision CSV), ISO timestamp per decision, recovery quality in decision CSV

## Delivered iteration 3 ✅
- (10) Recovery mechanic — after a poor/unsafe answer (learning modes), a live recovery decision is offered; initial + recovery quality both recorded and shown in the report; sound recovery claws back half the meter damage but never alters assessment scores
- Fun layer: streak chip (3+ consecutive strong calls) in the phase header, learning modes only

## Delivered iteration 2 ✅
- (9) Delayed-consequence engine — src/engine/consequences.ts, 7 rules, fires once per run at phase entry, banner UI + report log + engine tests
- (15, part) Accessibility hardening — keyboard site planner, focus-visible, reduced motion, skip link, aria-live status; formal WCAG audit remains open

## Next iterations (priority order)
11. Decision record enrichment (remaining): affected persons, documents affected.
12. Change-control record, action tracker and handover checklist documents.
13. Trainer comments + delegate reflection on the final report (audit identifier done).
14. Unit tests for scoring engine (Vitest) + CI workflow.
15. WCAG 2.2 AA pass: keyboard alternative labelling, focus management, aria-live for status, reduced-motion, contrast audit.
16. Branded paginated PDF (evaluate jsPDF from SiteSafe).
17. Lifecycle mapping doc: 20 brief stages → 15 game phases.
18. **Platform convergence epic**: port planner engine/content onto SiteSafe's Supabase backend for cohorts, invitations, auth, cross-delegate analytics, score override with justification, licence management. Decision required from product owner on direction before major work.
19. Scenario difficulty ratings + improvement-between-attempts analytics (needs backend).
20. Offline sync (extend service worker + background sync) after backend exists.

## Explicitly rejected
- Rebuilding either app from scratch (brief forbids blind rebuilds).
- Claiming CITB approval anywhere in product or docs.
