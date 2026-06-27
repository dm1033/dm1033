# User Journeys — SiteSafe

## Roles
- **Delegate** — the trainee playing scenarios.
- **Trainer** — runs courses, monitors delegate performance.
- **Admin** — content owner; edits scenarios/stages/decisions/scoring; manages
  billing for the organisation.

## A. Delegate journey (core loop)
1. **Sign up / log in** (email + password). First login creates a `profile`
   with role `delegate`.
2. **Dashboard** — sees past sessions/scores and a "Start new scenario" CTA.
3. **Scenario catalogue** — picks 1 of 5 projects (card: sector, difficulty,
   summary).
4. **Brief** — reads the project brief and starting conditions.
5. **Play stages (decision engine)** — for each stage:
   - reads the prompt + learning outcome,
   - reviews the visible **site layout** and current **risk index**,
   - selects one of several decisions,
   - sees immediate feedback: safety impact, legal/compliance impact, score
     effect and explanation; the **site layout** and **risk index** update.
6. **CPP draft** — on completion the app compiles a **Construction Phase Plan**
   draft from the delegate's choices.
7. **Score report** — overall score %, banding (Fail/Pass/Merit/Distinction),
   risk rating, and a per-stage comparison of *their choice vs the ideal control*
   with explanations.
8. **Download PDF** — one-click branded report (score + CPP summary).
9. Session is persisted; appears on the dashboard and to their trainer.

```
login → dashboard → catalogue → brief → [stage→decide→feedback]×N
      → CPP draft → score report → download PDF → dashboard
```

## B. Trainer journey
1. Log in (role `trainer`).
2. **Trainer dashboard** — table of delegates in their organisation: sessions,
   scenario, score %, band, risk index, completion date.
3. Drill into any session to view the full report and CPP.
4. (Read-only on content; cannot edit scenarios.)

## C. Admin journey
1. Log in (role `admin`).
2. **Admin area**:
   - **Scenarios** — list, create, edit, publish/unpublish.
   - **Stages** — per scenario: add/reorder/edit (title, phase, learning
     outcome, prompt).
   - **Decisions** — per stage: add/edit (choice text, safety/legal impact,
     explanation, score effect, risk effect, ideal flag, layout effect).
   - **Scoring** — adjust score/risk values; mark the ideal control.
3. Changes are validated (zod) and written to Supabase; immediately reflected in
   the catalogue.
4. Admin also manages the organisation subscription via the **Stripe Billing
   Portal**.

## Permissions matrix
| Action | Delegate | Trainer | Admin |
|--------|:--:|:--:|:--:|
| Play scenarios | ✅ | ✅ | ✅ |
| See own results | ✅ | ✅ | ✅ |
| See org delegates' results | ❌ | ✅ | ✅ |
| Edit content/scoring | ❌ | ❌ | ✅ |
| Manage billing | ❌ | ❌ | ✅ |
