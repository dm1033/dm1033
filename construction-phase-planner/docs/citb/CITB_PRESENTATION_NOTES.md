# CITB Presentation — Presenter Background Notes

**Product:** Construction Phase Safety Planner — *"Plan the Site. Manage the Risk. Defend Every Decision."*
**Status statement:** This product is being presented to CITB for review and consideration. It is an SMSTS-aligned construction planning and safety simulation. It supports training and assessment but does not replace formal CITB course delivery, examination or certification, and it is not approved, accredited or endorsed by CITB.

---

## 1. The problem we are addressing

- **Paper-based exercises.** SMSTS-level delivery commonly relies on printed workbooks, case-study packs and paper site-plan exercises. Printing is a recurring per-delegate cost, packs date quickly, and remote delivery of paper exercises is awkward.
- **Trainer admin.** Tutors hand-mark exercises, collate results and assemble evidence. That time is not teaching time.
- **Unevidenced learning.** A completed paper exercise proves attendance and effort; it rarely proves that a specific delegate engaged with a specific learning outcome, made a specific judgement, and understood the consequence. When quality is reviewed, the evidence trail is thin.

## 2. What the product is

A browser-based, offline-capable simulation (no installation, no accounts) in which the delegate acts as Site Manager on one of three UK construction scenarios and must plan, set up and safely deliver the project across 15 phases — from Project Brief through site set-up, RAMS, temporary works, permits, high-risk work and incident events, to handover and a scored final report. Every choice is scored, logged and turned into evidence: 13 end-of-game outputs including a Construction Phase Plan, registers, a missed-items report, a model-answer overlay, a learning-objectives report, a tutor review sheet and a certificate placeholder.

## 3. Assessment philosophy: judgement over recall

Three design commitments distinguish this from e-learning quizzes:

1. **Judgement, not recall.** Decision cards offer four *plausible* management options, not one obvious answer and three distractors. Site set-up is a spatial planning task assessed against zone rules. The temporary works register requires the delegate to specify seven control fields per item, marked per field. Permits must be *selected proportionately* — choosing unnecessary permits is flagged, not just missing required ones.
2. **Consequences.** Decisions move seven discipline scores and five project meters immediately, with feedback explaining why. Unsafe choices are captured as critical failures that persist to the final report. Randomised incident events (three drawn per run from per-scenario pools) mean the "site fights back" and runs are not memorisable.
3. **Evidence.** Ten SMSTS-aligned learning outcomes are mapped to deterministic gameplay steps in every scenario — enforced by the data validator, so a delegate cannot complete a scenario without addressing every outcome. Every run produces a per-outcome coverage and performance report (screen, print-PDF and CSV), a full decision log against best answers, and a tutor review sheet.

## 4. What "SMSTS-aligned" means — and does not mean

**Means:**
- The ten learning outcomes are original wording written to align with the published aims of the CITB Site Management Safety Training Scheme (site managers able to manage health, safety, welfare and environment in line with current legislation).
- Content covers the ground SMSTS delegates must manage: HSWA and enforcement, CDM 2015 duties, RAMS and permits, site set-up and welfare, high-risk activities (work at height, lifting, excavations, services, demolition, confined spaces), occupational health, environment, workforce engagement, inspection and records, and delivery under pressure. All expressed in plain language from generally-known UK principles (CDM 2015, HSWA, RIDDOR, LOLER, PUWER, NRSWA, CoSHH, Work at Height, Confined Spaces).
- No CITB or HSE publication text is reproduced anywhere; all scenario copy is original.

**Does not mean:**
- CITB approval, accreditation or endorsement — none exists and none is claimed.
- Equivalence to, or replacement of, the SMSTS course, its examination or its certification.
- That completing the simulation confers any qualification. The in-app certificate states on its face that it is not a CITB certificate.

The disclaimer appears on the home screen, the score report and the certificate.

## 5. Honest current state vs roadmap

| Area | Current build (verified) | Roadmap / pilot phase |
|---|---|---|
| Scenarios | 3 complete scenarios × 15 phases, fully playable, E2E-tested | Additional scenarios; provider-customised scenarios (data-driven JSON already supports authoring + validation) |
| Decision assessment | 4-tier classification (best/partial/poor/unsafe), transparent scoring, partial credit, critical-failure capture | 7-tier classification, weighted competency model, critical-failure grade gating, recovery-decision tracking |
| Consequences | Immediate meter/score movement; accident-likelihood meter; persistent critical-failure log; missed-items and model-answer evidence at end | Delayed-consequence engine (earlier errors mechanically triggering later events) |
| Modes | Learning-style play (immediate feedback); tutor mode | Formal Assessment Mode (feedback withheld until completion); scripted Demonstration Mode |
| Tutor tools | Single-device console: pause, reveal answers, decision table vs best answers, custom questions/hazards, reset, CSV export | Multi-delegate cohort dashboards and analytics (requires server backend) |
| Persistence | Autosave to localStorage after every decision; reload-resume with double-scoring guard | Save-status indicator, recovery-file export, server-side persistence |
| Reports | 13 report tabs; browser print-to-PDF; 5 CSV exports; objective-coverage evidence | Branded, paginated PDF engine; delegate reflection and trainer comment capture |
| Accessibility | Desktop + tablet layouts verified; click-to-place alternative to drag | Formal WCAG 2.2 AA audit, keyboard/screen-reader pass, reduced-motion option |
| Commercial | Licence tiers and key screen are placeholders; in-app savings calculator (illustrative, provider-entered figures) | Licensing backend, agreed pricing |

Do not soften the right-hand column. The feature inventory marks these limitations deliberately, and the credibility of the whole presentation rests on it.

## 6. Technical facts (say these with confidence)

- **Fully static.** Vite + React 19 + TypeScript (strict) + Tailwind. The build output is a static site with relative paths — any static host, or a folder on a classroom machine.
- **Offline-capable.** A service worker caches the app after first load; verified in the production build. Suited to venues with poor connectivity.
- **No installation, no accounts.** Runs in a modern browser. The demo needs no network, no login, no keys.
- **No PII collected.** No analytics, no transmission. The delegate name is typed locally and stored only in the browser's localStorage on that device; clearing site data removes everything. There is no server to breach.
- **No secrets in the client.** Payment links are inert placeholders; the QA report confirms no secrets client-side.
- **Quality evidence.** TypeScript strict typecheck clean; scenario JSON validated against a schema (including objective-coverage gates); automated Playwright end-to-end playthroughs of all three scenarios pass with zero console errors; QA report at `docs/QA-TEST-REPORT.md` concludes release-ready for training-pilot use.
- **Known technical caveats.** Single-device tutor model; tutor access code is a demo constant; licence key validation is format-only; PDF is browser-print based; no unit tests on the scoring engine yet and no CI in the repo.

## 7. Tone guidance for the room

- Lead with evidence, not superlatives. Show the objective-coverage report early — it is the strongest provider-facing asset.
- Volunteer limitations before being asked; the audience will test for overclaiming.
- All savings figures are **illustrative** — say the word every time a number appears.
- If asked "can this replace the SMSTS exam?": the answer is an unqualified **no**, followed by what it *does* do (formative practice, evidence of engagement, tutor time savings).
