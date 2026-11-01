# Game Design: v2 "Run the Project"

Version 2 turns the Construction Phase Planner from a 15-phase quiz into a project
simulation. The delegate is the Site Manager and must protect three things at once: **their
people, their contingency budget and their programme**. The seven competence categories (legal,
safety, planning, temporary works, environment, programme, quality) are still the learning
assessment. Everything below is the game layer on top.

## Why it changed

An audit of v1 content found that in **97 of 98 decisions the best answer was option A**, and
in **all 98 it was the longest option**. A delegate could score highly by always picking the
longest answer. v2 removes both cues and adds consequences, pressure and replay value.

| Problem in v1 | v2 fix |
|---|---|
| Best answer always "A" | Options are shuffled per run (seeded, so stable across reloads) |
| Best answer always longest | Distractors across all three scenarios rewritten as plausible rationalisations of similar length. Best is now the longest in 26–29% of decisions (close to chance). The validator fails above 60% |
| Wrong answers had no lasting effect | Every poor/unsafe choice becomes a **latent hazard** that can fire weeks later |
| No resources to manage | **Contingency budget (£)** and **programme float (days)** |
| Same run every time | Random incident draw, surprise events, seeded consequence rolls |
| Linear Q&A only | Two new mini-games: **Hazard Hunt** (timed) and **Sequence Planner** |
| No stakes | HSE strikes, Improvement/Prohibition Notices, project **shutdown** |
| One difficulty | Learning / Standard / Expert |

## Core loop

1. **Decide.** Pick an answer (A–D), then commit as *Certain*, *Fairly sure* or *Unsure*.
2. **A site week passes** after every construction phase (phases 4–13). Open latent hazards
   roll to fire; HSE may inspect.
3. **Weekly risk review.** Close out risks now (cheap) or gamble on them not firing (expensive
   if they do). On Expert, risks are hidden until you pay for an audit.
4. **Hand over.** Completion bonuses, badges, XP, leaderboard entry and the full report set.

## Difficulty

| | Learning | Standard | Expert |
|---|---|---|---|
| Play as | Assistant Site Manager | Site Manager | Contracts Manager |
| Feedback | Instant | Instant | **Sealed until handover** (no marking, points, streaks or strikes shown) |
| Decision clock | none | incidents 50 s | all decisions 75 s, incidents 40 s |
| Hazard hunt time | ×1.5 | ×1 | ×0.75 |
| Incident frequency | ×0.6 | ×1 | ×1.4 |
| Incident events (phase 12 + surprise) | 2 + 0 | 3 + 1 | 4 + 2 |
| Adviser lifelines | 3 | 2 | 1 |
| Contingency | 5% of value | 4% of value | 3.2% of value |
| Shutdown after | never | 2 prohibition notices | 1 prohibition notice |
| Points multiplier | ×1 | ×1.25 | ×1.6 |

All values live in `DIFFICULTIES` in `src/engine/game.ts`.

## Mechanics

### Confidence wager
| | Best | Partial | Poor | Unsafe |
|---|---|---|---|---|
| Base points | 100 | 40 | −40 | −120 |
| Certain | ×1.5 | ×1 | ×2 | ×2 |
| Fairly sure | ×1 | ×1 | ×1 | ×1 |
| Unsure | ×0.6 | ×0.8 | ×0.5 | ×0.5 |

Best answers also earn a streak bonus (+10 per consecutive best answer, capped at +100) and a
time bonus on timed questions (up to +50). The report includes a **confidence calibration**
table and flags answers that were wrong while marked *Certain*. Being confidently wrong is the
most dangerous behaviour on site, and it is a useful tutor discussion point.

### Latent hazards and consequences
* Poor choice → **minor** hazard; unsafe choice → **major** hazard; a critical hold point out
  of order in a sequence → major hazard.
* Each site week, every open hazard from an earlier phase rolls:
  `p = base × difficulty × (0.6 + incidentLikelihood/100 × 0.8)` where base is 0.10 (minor)
  or 0.20 (major). At most two fire per week.
* A fired hazard shows its authored `consequence` narrative and the **root cause**: the phase,
  topic and exact answer that caused it.
* Costs (scaled to project value; reference £1.4m): minor £4k and 1.5 days; major £15k and
  4 days, plus enforcement risk. Major incidents whose narrative involves injury or a
  dangerous occurrence are flagged **RIDDOR reportable**.
* Close-out costs £1.5k / 0.5 day (minor) or £4k / 1 day (major). Prevention is cheaper than
  cure, by design.

### HSE enforcement
* A critical failure is a **strike** (max one per decision or sequence).
* HSE inspects at a site week if enforcement risk ≥ 70 or there are 3 strikes (and there was no
  notice the previous week).
* **Prohibition Notice** if enforcement risk ≥ 88 or 3 strikes: £12k (scaled), 6 days lost,
  strikes reset. Otherwise an **Improvement Notice**: £3k, 2 days.
* Each notice cites only the findings that are new since the previous notice.

### Mini-games
* **Hazard Hunt** (phase 6): a timed walk-round of 16 observations, 8 hazards and 8 look-alike
  acceptable conditions. Points for hazards found (more for high severity), penalties for false
  alarms, and a time bonus for a clean sweep. Missed hazards raise incident likelihood and are
  added to the risk register as "not identified".
* **Sequence Planner** (phases 2 and 10): order 8 activities. Scored on precedence constraints,
  not exact position, so any order that respects every dependency is correct. Breaking a
  critical constraint (e.g. loading temporary works before the permit to load) is a critical
  failure.

### Completion bonuses
On budget (+400, plus up to +300 for contingency left) · on programme (+400, plus 25 per spare
day) · no RIDDOR (+500) · no notices (+300) · no critical failures (+400) · −50 per open risk
handed over. All are multiplied by difficulty. A shutdown scores −1,500 and caps the competence
grade at 39 (*Unsafe planning*).

### Meta-game
* **Career XP and ranks** (Site Operative → Construction Director) persist on the device.
* **16 badges**: Zero Harm, TW Guru, Hawk Eye, Master Planner, Calibrated, Contracts Manager
  Class, and others.
* **Hall of Fame / class leaderboard**: the tutor can export it as CSV or clear it.

## Balance evidence

`npm run sim:balance` plays every scenario at every difficulty with four simulated delegate
profiles, using the real reducer. Results (100 runs per cell) for Scenario 1:

| Level | Delegate | Shut down | On budget | On programme | Incidents | Grade | Points |
|---|---|---|---|---|---|---|---|
| Learning | Strong | 0% | 100% | 99% | 0.0 | 86 | 9,079 |
| Learning | Weak | 0% | 87% | 44% | 4.4 | 55 | 1,150 |
| Standard | Strong | 0% | 100% | 98% | 0.0 | 86 | 11,596 |
| Standard | Competent | 0% | 100% | 95% | 1.9 | 72 | 7,798 |
| Standard | Weak | 10% | 48% | 15% | 5.9 | 53 | 76 |
| Standard | Reckless | 72% | 4% | 1% | 6.3 | 39 | −4,851 |
| Expert | Strong | 2% | 100% | 94% | 0.4 | 84 | 14,512 |
| Expert | Competent | 13% | 66% | 49% | 2.8 | 68 | 7,891 |
| Expert | Weak | 67% | 35% | 9% | 5.3 | 45 | −1,265 |

Profiles: Strong = 85% best answers and closes out every risk; Competent = 65% and closes out
major risks; Weak = 40% and never closes out; Reckless = random. The design intent holds: good
planning is rewarded, shortcuts compound, and Expert is genuinely hard.

## Tuning knobs

| What | Where |
|---|---|
| Difficulty table | `DIFFICULTIES`, `src/engine/game.ts` |
| Incident probabilities and costs | `simulateWeek()`, `src/engine/game.ts` |
| Contingency and float | `economyFor()`, `src/engine/game.ts` |
| Points tables | `BASE_POINTS`, `CONFIDENCE_FACTOR`, `completionBonuses()` |
| Ranks and badges | `RANKS` (`game.ts`), `ACHIEVEMENTS` (`src/state/profile.ts`) |
| Content rules | `scripts/validate-data.ts` |

Re-run `npm run sim:balance` after any change.
