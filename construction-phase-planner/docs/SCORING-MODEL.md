# Scoring Model

The full, documented rule set behind the assessment. Keep this file in step with
`src/engine/assessment.ts`, `src/engine/scoring.ts` and `src/engine/performance.ts`.

## 1. Step performance (0–100)

| Step type | Performance rule |
|---|---|
| Decision | best = 100 · partial = 60 · poor = 25 · unsafe = 0 |
| Site set-up | Mean over required items: well placed = 100, acceptable zone = 60, unsafe/missing = 0 |
| Temporary works register | Correct fields ÷ total fields (7 per item) × 100 |
| Permits | Required permits raised ÷ required × 100 |

## 2. Seven-tier decision classification

Authored option quality remains the content source of truth. The 7-tier classification
is derived deterministically (an explicit `classification` on an option always
overrides):

| Authored quality | Derivation | Classification |
|---|---|---|
| best | — | **Excellent** |
| partial | attainment ≥ 50% of available points | **Good** |
| partial | attainment < 50% | **Acceptable** |
| poor | attainment ≥ 15% | **Weak** |
| poor | attainment < 15% | **Poor** |
| unsafe | no critical-failure flag | **Unsafe** |
| unsafe | carries `criticalFailure` | **Critical Failure** |

"Attainment" = positive score points the option earns ÷ maximum points available on
that question.

Definitions used when authoring options:
- **Excellent** — anticipates the issue, applies the hierarchy of control, coordinates
  the right parties and creates evidence.
- **Good** — safe and largely complete; may miss a secondary control or assurance step.
- **Acceptable** — controls immediate risk but lacks full planning/evidence/monitoring.
- **Weak** — incomplete, reactive, or over-reliant on administrative controls.
- **Poor** — leaves a significant risk or management gap.
- **Unsafe** — could expose people to foreseeable harm.
- **Critical Failure** — credible risk of fatality, multiple serious injuries,
  structural collapse, uncontrolled service strike or major public harm.

## 3. Weighted competency model

Nine areas, weights summing to 100%:

| Area | Weight |
|---|---|
| Health & safety control | 30% |
| Legal & management duties | 15% |
| Construction planning | 15% |
| High-risk activities | 10% |
| Temporary works management | 10% |
| Leadership & communication | 5% |
| Occupational health | 5% |
| Environmental management | 5% |
| Quality, completion & handover | 5% |

Every assessable step is assigned to exactly one area: TW register steps → temporary
works; permit steps → health & safety; site set-up → construction planning; decisions by
ordered topic rules (first match wins) in `AREA_RULES` — temporary works → occupational
health → environment → high-risk → leadership → legal → quality → planning → default
health & safety.

Area score = mean step performance of answered steps in that area. Overall = weighted
mean across areas with evidence (weights renormalised when an area has no data —
disclosed on the report as steps-per-area).

## 4. Performance bands and the critical-failure gate

90–100 Outstanding · 80–89 Strong · 70–79 Competent · 60–69 Developing competence ·
50–59 Significant improvement required · <50 Insufficient evidence of competence.

**Gate:** any unresolved critical failure forces the reported outcome to
*"Insufficient evidence of competence — unresolved critical failure"*, regardless of the
numeric score. The numeric score and band remain visible for feedback, clearly marked as
not overriding the gate. (A recovery mechanic that can downgrade a critical failure to a
recovered state is on the backlog; until it exists every critical failure is unresolved.)

## 5. Meters (formative, unscored)

Client confidence, workforce morale, enforcement risk, incident likelihood and cost
pressure move with decisions and drive feedback/consequence messaging. They do not enter
the weighted score.

## 6. Learning objectives

Ten SMSTS-aligned outcomes are mapped to deterministic steps per scenario
(`src/data/objectives.ts`), enforced by `npm run validate:data`, and reported with the
same step-performance rules (≥75 achieved, 50–74 partial, <50 revise).
