# Construction Phase Planner — SMSTS Safety Challenge

*(also known as **SafeSite Planner**)*

An interactive construction planning and safety training game. The delegate acts as Site
Manager and must plan, manage and safely deliver a construction project from site set-up to
handover — making decisions that affect safety, legal compliance, programme, cost, quality,
environment, client confidence, workforce morale, enforcement risk and accident likelihood.

> **SMSTS-aligned learning game**, based on construction site safety principles. Supports
> revision and practical understanding. **Does not replace formal CITB training, assessment
> or certification. Not endorsed or approved by CITB.**

## Features

- **Three complete scenarios** (all data-driven JSON):
  1. **Small Commercial Extension** — steel frame, pad foundations, scaffold, MEWP, lifting, public interface
  2. **City Centre Refurbishment & Demolition** — soft strip, propping, façade retention, asbestos, dust/noise, neighbours
  3. **Utilities & Roadworks** — street works, permit-to-dig, buried services, trench support, confined spaces, reinstatement
- **15-phase gameplay structure** per scenario: Project Brief → Pre-Construction Planning →
  Construction Phase Plan → Site Set-Up → Welfare & Access → Hazard Identification → RAMS
  Review → Temporary Works Register → Permits & Inspections → High-Risk Activities →
  Environmental Management → Incident/Challenge Events → Progress Review → Handover →
  Final Score & Feedback
- **Citytopia-style site planner**: drag-and-drop site set-up items onto a zoned site plan
  (hoarding, gates, welfare, fire points, fuel storage, crane zones, exclusion zones…)
- **Live panels** while playing: scoring dashboard (RAG), Construction Phase Plan builder,
  risk register, RAMS tracker, Temporary Works Register, incident log
- **Randomised incident events** drawn from a per-scenario pool, plus tutor-added questions
- **Scoring engine**: seven 0–100 disciplines + five project meters, graded
  (90–100 Excellent · 75–89 Good · 60–74 Pass-level · 40–59 Significant gaps · <40 Unsafe planning)
- **Learning objective coverage, enforced and evidenced**: ten SMSTS-aligned learning
  outcomes are mapped to deterministic gameplay steps in every scenario (enforced by the
  data validator), and every completed run produces a per-outcome coverage and
  performance report (screen, PDF and CSV) — the delegate cannot finish a scenario
  without addressing every outcome
- **End-of-game outputs (13)**: score report, Construction Phase Plan, risk assessment
  summary, TW register, permit tracker, inspection tracker, environmental checklist,
  incident response log, missed items report, model answer overlay, learning objectives
  report, tutor review sheet, certificate placeholder — printable to PDF, trackers
  downloadable as CSV
- **Built to sell to training providers**: paperless (no printed workbooks or handouts),
  fully remote-deliverable in a browser, offline-capable for classrooms, with delegate
  evidence packs and tutor oversight
- **Tutor/Admin mode**: pause for discussion, reveal answers, view every delegate choice
  against the best answer, add custom questions and hazards, reset scenario, download logs
- **Offline-capable** (service worker) · **local storage persistence** · **responsive tablet layout**
- **Monetisation placeholders**: licence tiers, Stripe payment link stubs, licence key screen
  (no payment secrets anywhere in the client)

## Tech stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · localStorage · Playwright (E2E smoke tests)

## Getting started

```bash
npm install
npm run dev          # dev server on http://localhost:5173
```

## Build

```bash
npm run build        # typecheck + production build to dist/
npm run preview      # serve the production build locally
```

## Quality checks

```bash
npm run check          # TypeScript typecheck
npm run validate:data  # validate all scenario JSON against the game schema
npx tsx scripts/smoke-test.ts 0   # E2E playthrough of scenario 1 (0|1|2), needs `npm run preview` running
```

## Deployment

The build output (`dist/`) is a fully static site with relative asset paths (`base: './'`).

- **Netlify / Vercel / GitHub Pages / any static host**: publish the `dist/` directory.
  Build command `npm run build`, output directory `dist`.
- **Offline / kiosk / classroom**: copy `dist/` to the machine and serve with any static
  server. After first load the service worker caches the app for offline use.
- **Android APK**: wrap with [Capacitor](https://capacitorjs.com):
  ```bash
  npm i -D @capacitor/core @capacitor/cli @capacitor/android
  npx cap init "SafeSite Planner" com.example.safesite --web-dir dist
  npx cap add android && npm run build && npx cap sync && npx cap open android
  ```
  The relative base path and offline cache make the app WebView-ready as-is.

See `docs/DEPLOYMENT.md` for details, and `docs/QA-TEST-REPORT.md` for the test evidence.

## Project structure

```
src/
  types.ts                  # full game schema (scenarios, steps, scoring, CPP sections)
  data/
    siteItems.ts            # catalogue of placeable site set-up items
    scenarios/*.json        # three complete scenarios (validated JSON)
    index.ts                # scenario registry
  engine/
    scoring.ts              # scoring engine (decisions, placements, TW, permits, grades)
    reports.ts              # report builders + CSV/print export
  state/GameContext.tsx     # game + tutor state (reducer, localStorage persistence)
  screens/                  # Home, ScenarioSelect, Game, Report, Tutor, Licence
  components/               # SitePlanner, DecisionCard, TwRegisterForm, PermitForm, Dashboard…
scripts/
  validate-data.ts          # scenario JSON schema validator
  smoke-test.ts             # Playwright E2E playthrough
```

## Adding or editing scenarios

Scenarios are plain JSON in `src/data/scenarios/`. Copy an existing file, edit, then:

```bash
npm run validate:data
```

The validator enforces: 15 phases, exactly one best answer per decision, valid impact keys,
valid site item ids and zone references, TW item field values, permit consistency and event
pool sizing. Register new files in `src/data/index.ts`.

## Tutor mode

Open **Tutor Mode** in the header. Demo access code: `TUTOR` (replace
`TUTOR_ACCESS_CODE` in `src/screens/TutorScreen.tsx`, or wire to your licensing backend,
before production use).

## Monetisation placeholders

`src/screens/LicenceScreen.tsx` contains the licence tiers (single user, monthly,
training provider, organisation), Stripe Payment Link placeholders
(`STRIPE_PAYMENT_LINKS`) and a licence key entry screen with format-only validation.
Replace the placeholder URLs with real Stripe Payment Links and connect key validation to
your licensing server. **Never put Stripe secret keys in this client-side app.**

## Compliance & content

- Wording throughout uses "SMSTS-aligned learning game", "based on construction site safety
  principles", "supports revision and practical understanding", and states that the game
  "does not replace formal CITB training, assessment or certification".
- No CITB/HSE publication text is reproduced. All scenarios, questions, feedback and
  learning notes are original content written from generally-known UK construction safety
  and management principles (CDM 2015, HSWA, RIDDOR, LOLER, PUWER, NRSWA, CoSHH, Work at
  Height, Confined Spaces — described in plain language).

## Disclaimer

> This game is an educational simulation designed to support construction safety training
> and SMSTS-style revision. It does not replace formal CITB training, official assessment,
> legal advice, competent supervision, approved RAMS, project-specific risk assessment,
> statutory duties or employer procedures.
