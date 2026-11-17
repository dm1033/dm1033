import { useEffect, useId, type ReactNode } from 'react'
import type { InfoStep } from '../types'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES } from '../engine/game'
import { GLOSSARY, lookupTerm } from '../data/glossary'
import { Abbr } from './Abbr'
import { shortcutAllowed } from '../state/shortcuts'
import { useSettings } from '../state/settings'

// ---------- Glossary terms in running text ----------

let termPattern: { size: number; re: RegExp | null } | null = null

function glossaryPattern(): RegExp | null {
  if (termPattern && termPattern.size === GLOSSARY.length) return termPattern.re
  const terms = GLOSSARY.map((g) => g.term.trim())
    .filter((t) => t.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = terms.length ? new RegExp(`(^|[^A-Za-z0-9])(${terms.join('|')})(s?)(?![A-Za-z0-9])`, 'gi') : null
  termPattern = { size: GLOSSARY.length, re }
  return re
}

/**
 * Wrap the first use of each glossary term in a piece of text with <Abbr>, so the delegate can
 * open its meaning. Pass the same `seen` set for every piece of text on one card: a term is then
 * explained once per card, not on every line.
 *
 * Do not use inside a button or other control (the glossary term is itself a control).
 */
export function withTerms(text: string, seen: Set<string> = new Set()): ReactNode {
  const re = glossaryPattern()
  if (!re || !text) return text
  const out: ReactNode[] = []
  let last = 0
  re.lastIndex = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const [, lead, word, plural] = m
    const entry = lookupTerm(word)
    if (!entry) continue
    // An abbreviation must match letter for letter ("PC" is a term, "pc" is not).
    const isAbbreviation = entry.term === entry.term.toUpperCase()
    if (isAbbreviation && word !== entry.term) continue
    const key = entry.term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const start = m.index + lead.length
    out.push(text.slice(last, start))
    out.push(<Abbr key={`${key}-${start}`} term={entry.term}>{word + plural}</Abbr>)
    last = start + word.length + plural.length
  }
  if (out.length === 0) return text
  out.push(text.slice(last))
  return out
}

// ---------- The card ----------

const continueBtn =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent bg-amber-500 px-6 py-2.5 text-base font-bold text-slate-950 hover:bg-amber-400'

function KeyHint({ children }: { children: string }) {
  return (
    <kbd aria-hidden="true" className="hidden rounded border border-slate-950/40 px-1.5 text-xs font-semibold [@media(pointer:fine)]:inline">
      {children}
    </kbd>
  )
}

interface Props {
  step: InfoStep
  onContinue: () => void
  /** Tutor pause: the Enter shortcut stands down. */
  paused?: boolean
}

export default function InfoCard({ step, onContinue, paused = false }: Props) {
  const { state, scenario, tutor } = useGame()
  const settings = useSettings()
  const titleId = useId()
  const g = state.game
  const diff = DIFFICULTIES[g.difficulty]
  const hold = paused || (tutor.enabled && tutor.paused) || !!g.pendingWeek
  const isProjectBrief = !!scenario && scenario.phases[0]?.steps[0]?.id === step.id
  const seen = new Set<string>()

  // Enter continues, as it does after a decision. A focused button or link keeps its own Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !shortcutAllowed(e, { paused: hold })) return
      const t = e.target as HTMLElement | null
      if (t?.closest('button, a, summary, [role="button"], header, nav, footer, aside')) return
      e.preventDefault()
      onContinue()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hold, onContinue])

  const timed = diff.decisionTimer !== null || diff.eventTimer !== null

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      <h3 id={titleId} className="mb-3 text-xl font-bold">{step.title}</h3>
      <div className="max-w-prose space-y-3 text-base leading-relaxed text-slate-200">
        {step.body.map((p, i) => <p key={i}>{withTerms(p, seen)}</p>)}
      </div>

      {step.keyPoints && step.keyPoints.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-1 text-sm font-bold text-amber-300">Key points</h4>
          <ul className="max-w-prose space-y-1.5 text-base leading-relaxed text-amber-100">
            {step.keyPoints.map((k) => (
              <li key={k} className="flex gap-2">
                <span aria-hidden="true" className="text-amber-400">▸</span>
                <span>{withTerms(k, seen)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isProjectBrief && scenario && (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 md:col-span-2">
              <h4 className="mb-2 text-sm font-bold text-slate-100">Project facts</h4>
              <dl className="grid gap-x-4 gap-y-1.5 text-sm text-slate-200 sm:grid-cols-[auto_1fr]">
                <dt className="font-semibold text-slate-300">Client</dt>
                <dd>{scenario.brief.client}</dd>
                <dt className="font-semibold text-slate-300">Location</dt>
                <dd>{scenario.brief.location}</dd>
                <dt className="font-semibold text-slate-300">Value and length</dt>
                <dd>{scenario.brief.value}, {scenario.brief.duration}</dd>
              </dl>
            </div>
            {scenario.brief.constraints.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <h4 className="mb-2 text-sm font-bold text-slate-100">Site constraints</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-200">
                  {scenario.brief.constraints.map((c) => <li key={c}>{withTerms(c, seen)}</li>)}
                </ul>
              </div>
            )}
            {scenario.brief.keyRisks.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <h4 className="mb-2 text-sm font-bold text-slate-100">Key risks</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-200">
                  {scenario.brief.keyRisks.map((r) => <li key={r}>{withTerms(r, seen)}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-sky-800 bg-sky-950/40 p-3">
            <h4 className="mb-2 text-sm font-bold text-sky-200">How the game works</h4>
            <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-100">
              <li>
                <b>Answer, then say how sure you are.</b> Being certain earns more points if you are right and
                costs double if you are wrong.
              </li>
              <li>
                <b>Contingency</b> is your spare money and <b>float</b> is your spare time in working days.
                Safe choices can use some of both. That is normal.
              </li>
              <li>
                <b>Risky choices stay on site.</b> They can cause an incident in a later site week unless you
                close them out at a weekly review.
              </li>
              <li>
                <b>Critical safety failures</b> count as strikes. Three strikes bring an HSE inspection.
              </li>
              <li>
                <b>Points</b> are for the leaderboard. The <b>competence grade</b> out of 100 is your learning score.
              </li>
              {diff.lifelines > 0 && (
                <li>
                  <b>H&amp;S adviser:</b> you can ask {diff.lifelines === 1 ? 'once' : `${diff.lifelines} times`}.
                  The adviser rules out wrong answers and halves the points for that question.
                </li>
              )}
              {timed && (
                <li>
                  <b>Timed questions</b> allow time to read the card aloud and 30 seconds to agree. The clock stops
                  when the tutor pauses the game.
                </li>
              )}
              {state.team && (
                <li>
                  <b>Playing as {state.team.name}:</b> read each card aloud and agree the answer before anyone commits.
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      <button type="button" onClick={onContinue} className={`mt-5 ${continueBtn}`}>
        Continue <span aria-hidden="true">→</span>
        {settings.shortcuts && <KeyHint>Enter</KeyHint>}
      </button>
    </section>
  )
}
