# Known Issues & Limitations

Severity: 🔴 blocks demo credibility · 🟠 material gap vs brief · 🟡 quality/polish · ⚪ by design/roadmap

## Assessment correctness
- ✅ RESOLVED (iter. 1): critical-failure gate, 7-tier classification, weighted 9-area model.
- ✅ RESOLVED (iter. 2): delayed-consequence engine.
- ✅ RESOLVED (iter. 3): recovery mechanic with both attempts recorded.
- ✅ RESOLVED (iter. 4): decision timestamps, recovery attempts and run audit ID recorded and exported.

## Modes
- ✅ RESOLVED (iter. 1): Learning / Assessment / Tutor-Led / Demonstration modes all live.

## Persistence
- ✅ RESOLVED (iter. 1): write-verified save indicator, Save & Exit, recovery export/import.
- 🟡 No revision history; no duplicate-session protection.
- ⚪ No server persistence / multi-device resume (platform track — SiteSafe/Supabase convergence).

## Tutor & admin
- ⚪ No cohorts, invitations, per-delegate accounts, cross-delegate analytics, score override with justification (requires backend — platform track).
- 🟡 Tutor access code is a client-side constant; document as demo-only.

## Reports
- 🟡 Print-based PDF only; no branded paginated PDF (jsPDF exists in SiteSafe — convergence candidate).
- 🟡 No trainer comment / delegate reflection fields.
- 🟡 No audit identifier on reports.

## Accessibility
- 🟠 No WCAG 2.2 AA pass: keyboard-only drag-and-drop alternative exists (click-to-place) but unlabelled for screen readers; focus order unaudited; no reduced-motion preference; contrast unaudited on amber-on-dark text.

## Content
- 🟡 Source-verification pending for most GE700 chapters (only A-ch01, B-ch01, D-ch01 received). `docs/SOURCE-ALIGNMENT.md` tracks.
- 🟡 Scenario lifecycle covers the brief's 20 stages within 15 phases; mapping table needed to demonstrate coverage of all 20 explicitly.

## SiteSafe app (repo root — separate product)
- ⚪ Not executed in this environment; demo-mode claim untested here; no automated tests; overlap/duplication with planner unresolved (see convergence epic).

## Environment constraints (development)
- 🟡 CITB website blocks automated fetch (403) — objective wording anchored to published course aims via search; tighten when GE706 material is supplied.
- 🟡 Uploaded publication PDFs arrive as 20-page chunks; most chapters still outstanding.
