# CITB Presentation — Anticipated Questions and Honest Answers

**Product:** Construction Phase Safety Planner (SMSTS-aligned construction planning and safety simulation).
**Ground rule for every answer:** never claim CITB approval, accreditation or endorsement; label all value figures illustrative; distinguish current build from roadmap.

---

**1. How is this different from an e-learning quiz?**
Three ways. First, the tasks are management tasks, not recall: a drag-and-drop site set-up assessed against zone rules; a temporary works register with seven control fields per item marked per field; proportionate permit selection where over-permitting is flagged as well as under-permitting. Second, decisions have consequences — seven discipline scores and five project meters move live, unsafe choices are logged as critical failures that persist to the final report, and three incident events are drawn at random per run so the site "fights back". Third, the output is an evidence pack — a Construction Phase Plan the delegate effectively built, registers, a decision log against best answers, and a per-outcome coverage report — not a percentage score.

**2. How do you prevent delegates simply guessing?**
We reduce guessing value rather than pretend to eliminate it. All four options on a decision card are plausible management responses; partial credit distinguishes best from defensible from poor from unsafe. Spatial planning, the TW register and permit selection cannot be guessed profitably. Randomised event draws prevent memorising a run. And the tutor sees the complete decision log against best answers, so a guessing pattern is visible. This is a formative training tool, not a summative examination — the SMSTS examination remains where high-stakes assessment happens.

**3. Is the scoring defensible? Who validated the content?**
The scoring is transparent and deterministic: every decision option carries declared impacts against a published schema; scores are earned/possible normalisation across seven disciplines; a data validator enforces exactly one best answer per decision and full objective coverage per scenario. Content is original, written from generally-known UK construction safety and management principles (CDM 2015, HSWA, RIDDOR, LOLER, PUWER, NRSWA, CoSHH, Work at Height, Confined Spaces), with source-alignment checking recorded in our documentation. What we have **not** yet done is independent validation by external SMSTS tutors — that is precisely what the pilot phase and CITB review are for, and we would welcome expert challenge to any model answer. Decisions are classified on a seven-tier scale (Excellent to Critical Failure) feeding a weighted nine-area competency model (30% health & safety control, 15% legal, 15% planning, and so on), with an absolute rule that an unresolved critical failure prevents a competent result regardless of the numeric score. The full rule set is published in the product documentation (docs/SCORING-MODEL.md).

**4. Can it replace the SMSTS exam or course?**
**No.** Explicitly and by design. It supports training and assessment but does not replace formal CITB course delivery, examination or certification. The disclaimer appears on the home screen, the score report and the certificate, and the certificate states on its face that it is not a CITB certificate. We position it as structured practice and evidence generation *within* tutor-led delivery.

**5. Are you claiming CITB approval or alignment?**
No approval, accreditation or endorsement — and we say so in the app. "SMSTS-aligned" means the ten learning outcomes are original wording written to align with the scheme's published aims, and the content covers the ground a site manager on that course must manage. We are presenting the product to CITB for review and consideration; any formal relationship would be for CITB to define.

**6. What about delegates with limited English?**
Honest answer: partially addressed. All content is plain-language UK English with feedback and learning notes rather than jargon-dense text, and one learning outcome (LO8) explicitly covers engaging workers whose first language is not English. But there is no multi-language support and no read-aloud feature in the current build. Tutor mode's pause-and-discuss supports tutors working through content with delegates. Language support is a roadmap item we would prioritise on pilot feedback.

**7. What about accessibility needs?**
Current state: responsive desktop and tablet layouts verified by screenshot, and click-to-place as an alternative to drag-and-drop. Not yet done: a formal WCAG 2.2 AA audit, a keyboard and screen-reader pass, and a reduced-motion option — these are tracked openly in our feature inventory and are pilot-phase work. We will not claim accessibility conformance we have not tested.

**8. How does the tutor evidence objective coverage?**
This is the strongest part of the build. Ten SMSTS-aligned learning outcomes are mapped to deterministic gameplay steps in every scenario — the mapping is machine-enforced by our data validator, so a delegate cannot complete a scenario without addressing every outcome. Every completed run produces a per-outcome coverage and performance report (screen, print-PDF, CSV), plus a tutor review sheet and a full decision log against best answers. That is per-delegate, per-outcome evidence generated automatically.

**9. What happens to delegate data? Is this GDPR-compliant?**
The current build collects no personal data beyond a display name the delegate types, and nothing leaves the device: no accounts, no analytics, no transmission, no server. State lives in the browser's localStorage and is deleted by clearing site data. That makes the current data-protection footprint minimal — providers remain controllers of anything they export (CSV/PDF) and should handle those under their own policies. If the roadmap server-persistence and cohort features are built, they will require a proper GDPR design (lawful basis, retention, DPA with providers) before release, and we say so now.

**10. Can providers customise scenarios?**
Structurally yes, today: scenarios are plain, data-driven JSON validated against a published schema (15 phases, best answers, impacts, zones, TW items, permits, event pools, objective coverage). Tutors can already inject custom questions and hazards live in tutor mode. A supported authoring workflow for providers — templates, documentation, review — is roadmap; in the pilot we would co-author variants with partners rather than hand over raw JSON.

**11. What does it cost?**
Pricing is genuinely not settled. The licence screen shows placeholder tiers (single user, monthly, training provider, organisation) with inert payment links — there is deliberately no live commerce in the product. Pilot licensing is proposed at a placeholder rate marked TBC, and we intend to set commercial pricing with pilot partners using real usage data rather than invent figures now.

**12. What about cheating in remote use?**
The same answer as any unproctored formative tool: it is not designed to be a secure remote examination and we do not present it as one. Mitigations that exist: randomised event draws, plausible-option design, partial credit, and a decision log that makes anomalous patterns visible to the tutor. For anything summative, the delegate sits the formal CITB examination under its own controls — we do not touch that.

**13. Does it work in classrooms with no or poor internet?**
Yes — this is a design goal, not an afterthought. The production build is fully static; a service worker caches the app after first load (verified in QA), and it can be copied to classroom machines and served locally with any static server. No accounts or network calls are needed to run a session. Caveat we own: long-term cache behaviour across weeks needs field testing, which the pilot covers.

**14. Can a tutor run a multi-delegate cohort with a live dashboard?**
Not in the current build — and we will not pretend otherwise. Today's model is single-device: delegate and tutor share a browser (projector or shared-tablet pattern), and the tutor console gives pause, reveal-answers, the decision table, custom questions and CSV export on that device. Cohort dashboards, cross-device visibility and server persistence are roadmap items requiring a backend, planned for the pilot phase. A workable interim pattern is one device per delegate with CSV/PDF evidence collated by the tutor.

**15. How was CITB/HSE source material used without infringing copyright?**
No CITB or HSE publication text is reproduced anywhere in the product. All scenarios, questions, feedback and learning notes are original writing based on generally-known UK legal and safety principles, described in plain language. The learning-outcome wording is original, written to align with the scheme's published aims. Our QA report includes a content-compliance review confirming this, and our source-alignment work is documented. We use the scheme name descriptively ("SMSTS-aligned") with an explicit non-endorsement statement.

**16. How do you know the product actually works — what testing has been done?**
TypeScript strict typecheck clean; all scenario data validated against the schema including objective-coverage gates; automated Playwright end-to-end playthroughs of all three full scenarios (58–68 steps each) pass with zero console errors and all report tabs rendering; manual functional checks across the planner, TW register, permits, persistence, tutor mode, reports, offline registration and responsive layouts. Documented in `docs/QA-TEST-REPORT.md`. Known gaps we declare: no unit tests on the scoring engine yet and no CI pipeline in the repository.

**17. The consequences seem immediate only — where's the realism of delayed outcomes?**
Fair challenge. Today, consequences are immediate meter and score movement, a rising accident-likelihood meter, a persistent critical-failure log, and end-of-run evidence (missed items, model-answer overlay) that resurfaces every earlier error. A mechanical delayed-consequence engine — where a specific early failure triggers a specific later event — is on the roadmap, along with recovery-decision tracking (scoring how well a delegate recovers from an initial error). We flag both in our own readiness report.

**18. What would CITB review actually change, given you claim no endorsement?**
Three things we would value: expert challenge to the model answers and scoring weights; guidance on where a tool like this legitimately sits alongside scheme delivery without confusing the market; and clarity on the language we should and should not use. We have written the product so that the answer to "does this overstate its status?" is already no — review would let us evidence that, not discover it.

**19. What is your commercial model — are you selling to delegates or providers?**
Providers first. The value case is provider-side: eliminated printing, reduced marking and admin, remote delivery capability and automatic evidence packs — all quantified only as clearly-labelled illustrations until pilots produce real data. The placeholder tiers include individual access, but the pilot and the design centre (tutor console, evidence reports, objective coverage) are built for accredited training providers.

**20. Why should a provider trust a product whose own documents list this many limitations?**
Because the alternative is a product that hides them. Our feature inventory, readiness scorecard and QA report grade the product honestly — including the categories where we score ourselves in the 50s and 60s. A provider piloting this knows exactly what works today (verified by automated tests), what is limited, and what is roadmap. That is the same defend-every-decision discipline the simulation teaches.
