# Pilot Proposal — Construction Phase Safety Planner

**For:** Accredited training providers delivering SMSTS-level courses
**Product:** Construction Phase Safety Planner — an SMSTS-aligned construction planning and safety simulation (browser-based, offline-capable, no installation).
**Status:** This product is being presented to CITB for review and consideration. It supports training and assessment but does not replace formal CITB course delivery, examination or certification, and it is not approved, accredited or endorsed by CITB. The pilot changes nothing about how the provider delivers, examines or certificates the formal course.

---

## 1. Pilot objectives

1. Validate that the simulation works reliably in real classroom and remote delivery conditions (including offline classrooms).
2. Measure — rather than estimate — the tutor time and printing effect against the provider's current paper-based exercises.
3. Test whether the objective-coverage evidence packs meet the provider's internal quality-assurance needs.
4. Gather structured tutor and delegate feedback to prioritise the roadmap (assessment mode, cohort dashboards, accessibility, language support).
5. Subject the model answers and scoring to challenge by experienced SMSTS tutors.

## 2. Scope

| Element | Proposal |
|---|---|
| Duration | **8 weeks** (2 weeks set-up and tutor familiarisation, 5 weeks cohort delivery, 1 week review) |
| Tutors | **2 tutors**, trained on the tutor console (approx. half a day each, delivered by us) |
| Cohorts | **3 cohorts** (target 10–12 delegates each) using the simulation as a structured practical exercise alongside — never instead of — normal course delivery |
| Scenarios | All three current scenarios available; recommended start: Scenario 1 (Small Commercial Extension) |
| Delivery pattern | Current build is single-device tutor oversight: either one device per delegate with tutor collation of exported evidence, or projector-led group play. Multi-device cohort dashboards are roadmap and explicitly **not** part of this pilot. |
| Environment | Provider laptops/tablets, modern browser; app served from a local static folder or our hosted static build. Offline operation after first load. |
| Out of scope | Any summative assessment use; any change to formal examination or certification; server persistence; branded PDF output; formal WCAG-audited accessibility conformance (all roadmap). |

## 3. Success measures

Agreed and baselined in week 1; reviewed at exit.

| Measure | How captured | Success indication |
|---|---|---|
| Completion rate | % of participating delegates completing a full scenario run (app produces a completion report per run) | ≥ 90% of starters complete |
| Tutor time, before/after | Tutors log time spent marking/collating the equivalent paper exercise (baseline week) vs time spent with the simulation's automated outputs | Measured reduction reported honestly, whatever it is — this replaces the illustrative figures in the value case with real ones |
| Printing avoided | Count of packs not printed for pilot cohorts, at provider's own print cost | Quantified per-delegate figure |
| Delegate feedback | Short structured questionnaire per cohort (engagement, clarity, perceived learning, ease of use) | Median ≥ 4/5 on engagement and clarity; all free-text issues logged |
| Objective-coverage evidence quality | Provider QA reviewer inspects the per-outcome coverage reports, decision logs and tutor review sheets for 3 sampled delegates per cohort | Reviewer judges the evidence pack usable (or better than current) for internal QA purposes |
| Content challenge log | Tutors flag any model answer, score weight or scenario detail they dispute | Every flag logged, adjudicated and either fixed or justified in writing |
| Technical reliability | Incident log: crashes, lost progress, offline failures (app autosaves after every decision and resumes on reload) | Zero unrecoverable data-loss events |

## 4. Data handling

- **Minimal, local-only in the current build.** The app collects no personal data beyond a typed display name; nothing is transmitted — no accounts, no analytics, no server. All state is in the device's browser localStorage.
- **Pilot practice:** delegates use initials or pseudonyms (e.g. "A. Delegate") unless the provider decides otherwise; the provider owns and controls all exported evidence (PDF/CSV) under its own data-protection policies; devices are cleared (site data) at pilot end.
- **Feedback questionnaires** are administered by the provider; we receive anonymised or pseudonymised results only.
- Any future server-persistence features would be introduced only with a proper GDPR design and a data-processing agreement — not during this pilot.

## 5. Support arrangements

- Named contact with agreed response time: next-business-day for general issues, same-day for anything blocking a scheduled cohort.
- Half-day tutor training per tutor, plus a tutor quick-reference guide and demo walkthrough.
- Fortnightly 30-minute review call; a mid-pilot fix window in which we can ship content corrections (scenario JSON is centrally updatable and schema-validated).
- Fallback plan for every session: the provider's existing paper exercise remains available, so no cohort's delivery is ever dependent on the pilot software.

## 6. Pilot licence and pricing

- Pilot licence: full use of the current build for the pilot term, both tutors, all three cohorts, at a placeholder pilot fee of **£ TBC** (candidate structures: nominal fixed fee, or free with committed feedback obligations — to be agreed).
- No auto-conversion: the pilot creates no obligation to purchase. Post-pilot commercial tiers (single user, monthly, training provider, organisation) exist as placeholders today and will be priced **with** pilot partners using measured pilot data; pilot partners receive preferential terms on any subsequent licence.
- No payment is taken through the app; commerce integration is deliberately inert in the current build.

## 7. Exit criteria

The pilot concludes with a joint written report. We proceed to a commercial phase with the provider only if:

1. Technical reliability target met (no unrecoverable data loss; completion target met or misses explained).
2. Tutor time measurements captured for all three cohorts (whatever they show).
3. Evidence-pack quality judged usable by the provider's QA reviewer.
4. All content-challenge flags adjudicated.
5. Both parties agree the roadmap priorities (assessment mode, cohort dashboards, accessibility audit, language support) reflect pilot findings.

Either party may exit early at any point; the provider keeps all evidence exports and the joint findings.

## 8. What CITB review and consideration would add

This pilot stands on its own for a provider, but CITB engagement would strengthen it materially:

- **Content authority:** expert challenge to model answers, scoring weights and scenario realism from the scheme's owner — the highest-value validation available.
- **Positioning clarity:** confirmed language for how an aligned simulation may describe itself alongside the scheme, protecting providers and the market from overclaiming.
- **Evidence relevance:** guidance on whether and how objective-coverage evidence could support providers' quality-assurance obligations.
- **Roadmap steer:** which roadmap items (assessment mode, cohort analytics, accessibility) matter most from a scheme-integrity perspective.

We make no assumption about the outcome of CITB's review, and the product's wording will continue to state that it is not approved, accredited or endorsed by CITB unless and until CITB says otherwise.

---

*Prepared for demonstration and discussion. All pricing TBC; all savings figures referenced from the value case are illustrative.*
