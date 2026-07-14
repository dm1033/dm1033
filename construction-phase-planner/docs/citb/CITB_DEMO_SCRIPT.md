# CITB Demo Script — Construction Phase Safety Planner

**Product:** Construction Phase Safety Planner — *"Plan the Site. Manage the Risk. Defend Every Decision."*
**Format:** Live demonstration, 10–15 minutes plus Q&A
**Audience:** CITB representatives and accredited training providers
**Positioning (say verbatim at least once):** *"This is an SMSTS-aligned construction planning and safety simulation. It is being presented to CITB for review and consideration. It supports training and assessment, but it does not replace formal CITB course delivery, examination or certification, and it is not approved or endorsed by CITB."*

---

## Pre-demo checklist (30 minutes before)

| # | Check | How |
|---|---|---|
| 1 | Production build served locally | `npm run build` then `npx serve dist` (or `npm run preview`). Confirm the app loads at the local URL. Offline-capable after first load — no network dependency during the demo. |
| 2 | Second, pre-completed run ready | In a **separate browser profile** (localStorage is per-profile), play Scenario 1 to completion in advance and leave it on the **Final Score & Feedback / Report** screen. This is your fast path to beats 8–11 without playing all 15 phases live. |
| 3 | localStorage cleared in the live-demo profile | DevTools → Application → Clear site data (or the app's reset). Guarantees a clean Home screen and no resume prompt. |
| 4 | Delegate name seeded | Enter delegate name **"A. Delegate"** where the delegate name is captured, so the certificate and reports show a neutral name. Never use a real person's name. |
| 5 | Browser zoom | 100% on a 1440×900+ display; the layout is verified for desktop and 1024×768 tablet. Check the site-planner grid is fully visible without scrolling. |
| 6 | Tutor access code to hand | Demo code is `TUTOR` (a demo-build constant; production would use licensing-backed access). |
| 7 | Notifications off, single window | Close other tabs; presentation mode on. |
| 8 | Recovery plan rehearsed | Know the reload-resume behaviour: the app autosaves after every decision and resumes on reload without double-scoring. A refresh is a safe recovery, not a restart. |

---

## Timed demo beats (total ≈ 13–14 minutes)

### Beat 1 — The problem and the value proposition (0:00–1:30)
**On screen:** Home screen.
**Say:**
- "SMSTS-level training today still leans on printed workbooks, paper exercises and tutor marking. That means printing cost, admin time, and — critically — weak evidence that each delegate actually engaged with each learning outcome."
- "This is a browser-based, offline-capable simulation. No installation, no accounts, no personal data collected. The delegate acts as Site Manager and must plan, set up and safely deliver a project from brief to handover — and every decision is scored, logged and evidenced."
- Deliver the positioning statement above, verbatim.

### Beat 2 — Scenario selection (1:30–2:00)
**Click path:** Home → **Start as Delegate** → Scenario select screen.
**Say:** "Three complete scenarios, all data-driven JSON validated against a schema: a small commercial extension; a city-centre refurbishment and demolition with asbestos and façade retention; and utilities and roadworks with permit-to-dig and confined spaces. We'll use Scenario 1."
**Click:** **Scenario 1 — Small Commercial Extension** → confirm delegate name shows "A. Delegate" → start.

### Beat 3 — Initial site-plan decision: the drag-and-drop planner (2:00–3:30)
**Click path:** Answer the Phase 1–3 decisions briskly (Project Brief → Pre-Construction Planning → Construction Phase Plan), narrating: "Every phase opens with judgement decisions — notice the four options are all plausible; this is not true/false recall." Arrive at **Phase 4 — Site Set-Up**.
**Do:** Drag hoarding, gates, welfare, fire point onto the zoned site plan. Then deliberately drag **fuel storage next to the site office/public boundary**.
**Say:** "This is the Citytopia-style planner. Every placement is assessed against zone rules — good, neutral, unsafe or missing. Blocked zones like the live road refuse items outright. Watch what the fuel-store placement does in a moment."
**Click:** Submit the site plan.

### Beat 4 — A good delegate decision (3:30–4:30)
**Click path:** Continue to **Phase 5 — Welfare & Access**, pick the **best** option on the welfare decision (e.g. proportionate welfare provision from day one).
**Say:** "Immediate feedback with a learning note — the delegate learns *why*, not just *that*. The scoring dashboard on the side moves live: seven discipline scores and five project meters, all RAG-rated. And note the topic tags — this decision just evidenced learning outcome LO4, safe site set-up."

### Beat 5 — A poor/unsafe decision, with consequence (4:30–6:00)
**Click path:** Continue to **Phase 6/7 (Hazard Identification / RAMS Review)** and deliberately pick a clearly **unsafe** option (e.g. accepting a generic RAMS to keep the programme moving).
**Say:** "I've just done what real sites do under pressure. Watch the consequences: safety and legal-compliance scores drop, the accident-likelihood meter rises, and — importantly — this is captured as a **critical failure** in the sidebar. It will follow this delegate all the way to the final report and the tutor review sheet. Nothing is hidden and nothing is forgotten."

### Beat 6 — Immediate and delayed consequences (6:00–7:00)
**On screen:** the dashboard after the unsafe choice.
**Say:**
- "Consequences work at two ranges. **Immediate:** meters and discipline scores move the moment you decide, with feedback explaining why."
- "**Downstream:** unsafe placements and decisions raise the accident-likelihood meter, critical failures are logged permanently, and everything the delegate skipped or got wrong resurfaces in the missed-items report and the model-answer overlay at the end. So a bad call in Phase 4 is still visible — and defensible — at handover."
- **Honesty line (use it):** "A fully simulated delayed-consequence engine — where a Phase 4 error mechanically triggers a specific Phase 10 event — is on the roadmap for the pilot phase; today the downstream effects work through the meters, the critical-failure log and the end-of-game evidence."

### Beat 7 — Dynamic site condition: an incident event (7:00–8:30)
**Click path:** Move briskly through Phases 8–11, narrating one-liners: "Phase 8 — a Temporary Works Register, eight items, seven control fields each, marked per field. Phase 9 — permit selection, with missed required permits flagged red. Phase 11 — environmental controls." Arrive at **Phase 12 — Incident/Challenge Events**.
**Say:** "Now the site fights back. Three events are drawn at random from a per-scenario pool of eight-plus, so no two runs are identical — delegates can't memorise the game. Tutors can also inject their own custom questions into this phase live." Resolve one event, showing the incident log updating.

### Beat 8 — Scoring and feedback (8:30–9:30)
**Click path:** Switch to the **pre-completed run** in the second browser profile, on the Final Score & Feedback screen. (Say so openly: "To respect your time I completed a full run earlier — everything you've watched me do live feeds this screen.")
**Say:** "Seven discipline scores from 0–100, five project meters, and a grade band from Excellent down to Unsafe Planning. And the part providers care most about: the **learning objectives report** — all ten SMSTS-aligned outcomes, each mapped to deterministic gameplay steps enforced by our data validator, each with a RAG coverage-and-performance rating. A delegate cannot finish a scenario without addressing every outcome."

### Beat 9 — The generated Construction Phase Plan (9:30–10:30)
**Click path:** Report screen → **Construction Phase Plan** tab.
**Say:** "Sixteen sections, built progressively from the delegate's own decision quality during play — a CPP the delegate effectively wrote by managing the project. It prints to PDF from the browser, and the registers export as CSV. This is a teaching artefact, not a legally reviewed CPP for real use — the disclaimer says so on the document."

### Beat 10 — Tutor console (10:30–12:00)
**Click path:** Header → **Tutor Mode** → enter access code `TUTOR`.
**Do/Say:**
- "Pause the game for a classroom discussion." (show pause overlay)
- "Reveal answers — the site plan and decisions highlight against the model answer."
- "The decision table shows every delegate choice against the best answer — this is the marking done for you, exportable to CSV."
- "Tutors can add custom questions and hazards on the fly, and reset the scenario."
- **Honesty line:** "Today this is a single-device tutor console — projector or shared-tablet pattern. Multi-delegate cohort dashboards with server persistence are roadmap, planned for the pilot phase."

### Beat 11 — Final delegate report and certificate (12:00–12:45)
**Click path:** Back to the Report screen → walk the tab strip: score report, risk summary, TW register, permit tracker, inspection tracker, environmental checklist, incident log, missed items, model-answer overlay, learning objectives, tutor review sheet → **Certificate**.
**Say:** "Thirteen outputs in total — a complete evidence pack per delegate. The certificate shows name, scenario, score and grade band, and it states explicitly on its face that it is **not** a CITB certificate — it's a completion record for the simulation, nothing more."

### Beat 12 — Estimated administrative savings, illustrative (12:45–13:30)
**On screen:** value slide (or the value-case handout).
**Say:** "All figures here are **illustrative**, not measured claims — we have no proven-savings data yet, and we won't pretend otherwise. As an illustration: a provider running 40 courses a year of 12 delegates prints zero workbooks and stops hand-marking exercises. On typical assumptions that's several thousand pounds of print and a three-figure number of tutor-hours per year. Open the **Savings** screen in the app and adjust the inputs live — every figure is computed from the numbers the provider enters, and the screen itself labels the results illustrative. The worked example with stated assumptions is in the value-case document."

### Beat 13 — Licensing and deployment (13:30–14:00)
**Click path:** Header → **Licence** screen.
**Say:** "Licence tiers — single user, monthly, training provider, organisation — are placeholders today; commercial terms are TBC and would be shaped with pilot partners. Deployment is trivially simple: a static build on any host, or copied onto classroom machines and run fully offline via the service worker. No accounts, no server, no personal data leaves the device."
**Close:** "We'd welcome CITB's review and consideration, and we're seeking pilot providers. Questions?"

---

## Recovery lines (if something goes wrong)

| Situation | Do | Say |
|---|---|---|
| App freezes or misrenders | Refresh the page | "One of the design features: it autosaves after every decision to local storage — watch it resume exactly where we were, with no double scoring." |
| Wrong option clicked | Carry on | "That's actually the point — in this simulation, as on site, you live with your decisions. It's now in the log and we'll see it again in the missed-items report." |
| Random event pool draws an awkward event | Resolve it plainly | "Events are randomised per run — this is exactly why delegates can't rote-learn the exercise." |
| Drag-and-drop misbehaves on the venue machine | Use click-to-place | "There's a click-to-place alternative to dragging — it's also the accessible path we're building on." |
| Pre-completed run lost | Play Phase 15 quickly from the live run | "Let me finish this run live — it's short — and you'll see the same report built from the decisions you just watched." |
| Asked something the product doesn't do | Answer honestly | "That's roadmap, not current build — it's in our feature inventory as a known limitation, and it's part of what the pilot phase is designed to shape." |

---

*This product is being presented to CITB for review and consideration. It is not approved, accredited or endorsed by CITB.*
