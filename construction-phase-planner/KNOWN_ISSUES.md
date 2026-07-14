# Known Issues & Limitations

Severity: 🔴 blocks demo credibility · 🟠 material gap vs brief · 🟡 quality/polish · ⚪ by design/roadmap

## Assessment correctness
- 🔴 Numeric grade can currently mask a critical failure (no gate). Brief: "a delegate must not receive a competent result where they have committed an unresolved critical failure."
- 🟠 4-tier decision classification vs required 7-tier (excellent → critical failure).
- 🟠 No weighted competency model (9 areas with declared % weights) — current 7 equal-weight categories.

- 🟠 No recovery mechanic (recognise-and-recover with both attempts recorded).
- 🟡 Decision records lack timestamps and attempt counts.

## Modes
- 🟠 No Assessment Mode (feedback currently always immediate — unsuitable for formal assessment).
- 🟠 No Demonstration Mode (scripted 10–15 min CITB walkthrough).

## Persistence
- 🟠 No save-status indicator; a delegate cannot tell work is saved (brief: never claim saved unless tested).
- 🟠 No recovery-file export/import; no revision history; no duplicate-session protection.
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
