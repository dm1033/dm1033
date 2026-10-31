# Construction Phase Planner — SMSTS Safety Challenge

*(also known as **SafeSite Planner**)*

An interactive construction planning and safety training game. The delegate acts as Site
Manager and must plan, manage and safely deliver a construction project from site set-up to
handover — making decisions that affect safety, legal compliance, programme, cost, quality,
environment, client confidence, workforce morale, enforcement risk and accident likelihood.

> **SMSTS-aligned learning game**, based on construction site safety principles. Supports
> revision and practical understanding. **Does not replace formal CITB training, assessment
> or certification. Not endorsed or approved by CITB.**

## What's new in v2: "Run the Project"

v2 turns the quiz into a project simulation. See [`docs/GAME-DESIGN.md`](docs/GAME-DESIGN.md) for the full design and balance evidence.

- **No more answer-guessing.** In v1 the best answer was option A in 97 of 98 decisions and was
  always the longest. Options are now shuffled each run, and distractors have been rewritten as
  plausible rationalisations of similar length (best is the longest in only 26–29% of
  decisions).
- **Project economy.** A contingency budget (£) and programme float (days) on a live HUD.
  Decisions, incidents, notices and close-outs spend them.
- **Consequences that come back to bite.** Every poor or unsafe choice stays on site as a
  latent hazard. After each construction phase a **site week** passes, and hazards can fire as
  incidents with a narrative, a root-cause trace back to the original decision, a cost, lost
  days and RIDDOR flags.
- **Weekly risk review.** Close out open risks cheaply now, or gamble. On Expert, risks are
  hidden until you commission a site audit.
- **HSE enforcement.** Critical failures are strikes. HSE serves Improvement or Prohibition
  Notices, and enough prohibitions **shut the project down**.
- **Confidence wager.** Commit each answer as Certain, Fairly sure or Unsure. Certain pays ×1.5
  if right and costs double if wrong. The report includes a calibration table.
- **Three difficulty levels.** *Learning* (instant feedback, no clock), *Standard* (timed
  incidents, surprise events) and *Expert* (no marking until handover, everything timed,
  hidden risks, one prohibition and you're out).
- **New mini-games.**
  - *Hazard Hunt*: a timed site walk-round with 16 observations, 8 of them hazards among
    look-alike acceptable conditions.
  - *Sequence Planner*: put pre-construction and high-risk activities in a safe order, scored
    on genuine dependencies and hold points.
- **Lifelines, streaks, timers, keyboard play** (A–D to select; S, F or G to commit).
- **Career and competition.** XP ranks (Site Operative → Construction Director), 16 badges, a
  Hall of Fame, and a tutor class leaderboard with CSV export.
- **New reports.** *Project Outcome* (points breakdown, consequence timeline, calibration,
  badges) and *Decision Review* (every answer against the model answer, plus hunt and sequence
  review).
- **Sound effects** (synthesised, offline, mute toggle) and reduced-motion support.

## Features

- **Three complete scenarios** (all data-driven JSON):
  1. **Small Commercial Extension**: steel frame, pad foundations, scaffold, MEWP, lifting, public interface
  2. **City Centre Refurbishment & Demolition**: soft strip, propping, façade retention, asbestos, dust/noise, neighbours
  3. **Utilities & Roadworks**: street works, permit-to-dig, buried services, trench support, confined spaces, reinstatement
- **15-phase gameplay structure** per scenario, from Project Brief to Final Score, with site
  weeks between the construction phases
- **Site planner**: drag-and-drop site set-up items onto a zoned site plan
- **Live panels** while playing: scoring dashboard (RAG), Construction Phase Plan builder,
  risk register, RAMS tracker, Temporary Works Register, incident and consequence log
- **Randomised incident events** (phase 12, plus surprise events mid-project on Standard and
  Expert), and tutor-added questions
- **Scoring**: seven 0–100 competence disciplines plus five project meters, graded
  (90–100 Excellent · 75–89 Good · 60–74 Pass-level · 40–59 Significant gaps · <40 Unsafe planning),
  plus game points with a difficulty multiplier
- **End-of-game outputs (14)**: project outcome, score report, decision review, Construction
  Phase Plan, risk assessment summary, TW register, permit tracker, inspection tracker,
  environmental checklist, incident response log, missed items report, model answer overlay,
  tutor review sheet and certificate. All print to PDF; trackers download as CSV
- **Tutor/Admin mode**: pause for discussion (also pauses the clock), reveal answers, view every
  delegate choice and confidence against the best answer, see live budget, float, incidents and
  open risks, class leaderboard and CSV export, custom questions and hazards
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
npm run validate:data  # validate scenario JSON: schema, hunt/sequence integrity, consequences, answer-length cue
npm run sim:balance    # Monte-Carlo balance table: every scenario × difficulty × delegate ability
npm run smoke -- 0 standard random   # E2E playthrough (scenario 0|1|2, learner|standard|expert, random|first)
npm run screenshots    # refresh docs/screenshots (needs `npm run preview` running)
```

The smoke test and screenshots need `npm run preview` running on :4173. If Playwright cannot
find its browser, set `CHROMIUM_PATH` to a local Chrome/Chromium binary.

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
    scoring.ts              # competence scoring (decisions, placements, TW, permits, hunt, sequence, grades)
    game.ts                 # game layer: difficulty, economy, latent hazards, site weeks, HSE, points, ranks
    reports.ts              # report builders + CSV/print export
    sound.ts                # synthesised sound effects
  state/GameContext.tsx     # game + tutor state (reducer, localStorage persistence)
  state/profile.ts          # career XP, badges, leaderboard
  screens/                  # Home, ScenarioSelect, Game, Report, Tutor, Licence
  components/               # DecisionCard, Hud, SiteWeekCard, HazardHunt, SequenceBuilder, SitePlanner,
                            # TwRegisterForm, PermitForm, Dashboard…
scripts/
  validate-data.ts          # scenario JSON schema validator
  smoke-test.ts             # Playwright E2E playthrough
  balance-sim.ts            # Monte-Carlo balance simulation using the real reducer
  screenshots.ts            # QA screenshots
```

## Adding or editing scenarios

Scenarios are plain JSON in `src/data/scenarios/`. Copy an existing file, edit, then:

```bash
npm run validate:data
```

The validator enforces: 15 phases, exactly one best answer per decision, valid impact keys,
valid site item ids and zone references, TW item field values, permit consistency, event
pool sizing, a `consequence` on every poor/unsafe option, hazard-hunt balance (hazards vs
look-alikes), sequence integrity (authored order satisfies every constraint, at least one
critical), and an **answer-length cue check** (fails if the best answer is the longest option
in more than 60% of decisions). Register new files in `src/data/index.ts`.

**Writing good distractors:** wrong answers should be what a busy, well-meaning but less
competent site manager would actually do. Give them a plausible rationale, specific detail and
a similar length to the best answer. Avoid giveaway words ("just", "skip", "ignore").

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
