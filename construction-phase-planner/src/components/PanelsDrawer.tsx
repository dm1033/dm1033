import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useGame } from '../state/GameContext'
import { CPP_SECTIONS, TW_FIELDS } from '../types'
import { allDecisionSteps, findSteps } from '../engine/reports'
import type {
  CppSectionId, DecisionRecord, DecisionStep, HazardHuntStep, OptionQuality, RiskRegisterRow, Scenario,
  SequenceStep, TwAnswerRecord, TwRegisterStep,
} from '../types'
import { DIFFICULTIES, fmtMoney } from '../engine/game'
import { Abbr } from './Abbr'

type Tab = 'brief' | 'cpp' | 'risk' | 'tw' | 'rams' | 'incidents'

const TABS: { id: Tab; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'cpp', label: 'CPP' },
  { id: 'risk', label: 'Risks' },
  { id: 'tw', label: 'Temp works' },
  { id: 'rams', label: 'RAMS' },
  { id: 'incidents', label: 'Incidents' },
]

const QUALITY_CHIP: Record<OptionQuality, { icon: string; word: string; cls: string }> = {
  best: { icon: '✓', word: 'Best answer', cls: 'text-emerald-400' },
  partial: { icon: '◐', word: 'Partly right', cls: 'text-amber-300' },
  poor: { icon: '!', word: 'Poor choice', cls: 'text-orange-300' },
  unsafe: { icon: '✕', word: 'Unsafe', cls: 'text-red-300' },
}
const HANDLED_CHIP: Record<OptionQuality, { icon: string; word: string; cls: string }> = {
  best: { icon: '✓', word: 'Well handled', cls: 'text-emerald-400' },
  partial: { icon: '◐', word: 'Partly controlled', cls: 'text-amber-300' },
  poor: { icon: '!', word: 'Poorly handled', cls: 'text-orange-300' },
  unsafe: { icon: '✕', word: 'Unsafe response', cls: 'text-red-300' },
}

const RAMS_TOPIC = /rams|method|scaffold/i

function chosenText(d: DecisionRecord, steps: Map<string, DecisionStep>): string {
  if (d.timedOut) return 'No decision made in time'
  return steps.get(d.stepId)?.options.find((o) => o.id === d.chosenOptionId)?.text ?? 'Decision recorded'
}

function twValue(v: TwAnswerRecord[keyof TwAnswerRecord]): string {
  if (v === undefined) return 'Not answered'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (v === 'standard-solution') return 'Standard solution'
  if (v === 'bespoke') return 'Bespoke design'
  if (v === 'none') return 'None'
  const cat = /^cat(\d)$/.exec(v)
  return cat ? `Category ${cat[1]}` : v
}

/**
 * Expert: marking is sealed until handover. The stored CPP and risk-register text is worded by how
 * good each answer was, so during a sealed game these two builders show what was decided, in the
 * group's own words, with no verdict, tally or model answer.
 */
function neutralCpp(
  scenario: Scenario,
  decisions: DecisionRecord[],
  steps: Map<string, DecisionStep>,
  hunts: { stepId: string; flagged: string[] }[],
  sequences: { stepId: string; order: string[] }[],
): Partial<Record<CppSectionId, string[]>> {
  const out: Partial<Record<CppSectionId, string[]>> = {}
  const add = (id: CppSectionId, text: string) => { out[id] = [...(out[id] ?? []), text] }
  for (const d of decisions) {
    const step = steps.get(d.stepId)
    if (step?.cppSection && step.cppText) add(step.cppSection, `Phase ${d.phaseNumber} decision: “${chosenText(d, steps)}”`)
  }
  for (const h of hunts) {
    const n = h.flagged.length
    add('riskAssessmentSummary', `Site walk-round carried out: ${n} ${n === 1 ? 'observation' : 'observations'} flagged for action.`)
  }
  for (const s of sequences) {
    const phase = scenario.phases.find((p) => p.steps.some((x) => x.id === s.stepId))
    const step = phase?.steps.find((x) => x.id === s.stepId) as SequenceStep | undefined
    if (!phase || !step) continue
    const label = (id: string) => step.activities.find((a) => a.id === id)?.label ?? id
    add(phase.number <= 3 ? 'projectDescription' : 'highRiskActivities', `Planned sequence (${step.topic}): ${s.order.map(label).join(' → ')}.`)
  }
  return out
}

function neutralRisks(
  scenario: Scenario,
  decisions: DecisionRecord[],
  steps: Map<string, DecisionStep>,
  hunts: { stepId: string; flagged: string[] }[],
): { hazard: string; control: string }[] {
  const rows: { hazard: string; control: string }[] = []
  for (const d of decisions) {
    const step = steps.get(d.stepId)
    if (step?.riskEntry) rows.push({ hazard: step.riskEntry.hazard, control: `Your response: ${chosenText(d, steps)}` })
  }
  const huntSteps = findSteps<HazardHuntStep>(scenario, 'hazardHunt')
  for (const h of hunts) {
    const step = huntSteps.find((s) => s.id === h.stepId)
    for (const id of h.flagged) {
      const o = step?.observations.find((x) => x.id === id)
      if (o) rows.push({ hazard: `Walk-round: ${o.text}`, control: 'Flagged for action on the walk-round.' })
    }
  }
  return rows
}

/** Side panels: the brief, the plan as it builds, the registers and the incident log. */
export default function PanelsDrawer() {
  const { state, scenario, tutor } = useGame()
  const [tab, setTab] = useState<Tab>(() => (state.decisions.length === 0 ? 'brief' : 'cpp'))
  const uid = useId()
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  if (!scenario) return null
  const sealed = DIFFICULTIES[state.game.difficulty].deferFeedback && !state.completed

  const steps = new Map(allDecisionSteps(scenario).map((s) => [s.id, s] as const))
  const cpp = sealed
    ? neutralCpp(scenario, state.decisions, steps, state.huntAnswers, state.sequenceAnswers)
    : state.cpp
  const twItems = findSteps<TwRegisterStep>(scenario, 'twRegister').flatMap((s) => s.items)
  const ramsDecisions = state.decisions.filter((d) => RAMS_TOPIC.test(d.topic))
  const ramsPhase = scenario.phases.find((p) => /rams/i.test(p.title))?.number
  const team = state.team

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next].id)
    tabRefs.current[TABS[next].id]?.focus()
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60">
      <h2 className="px-3 pt-2.5 text-sm font-bold text-slate-100">Project records</h2>
      <div
        role="tablist"
        aria-label="Project records"
        onKeyDown={onTabKey}
        className="mt-2 grid grid-cols-3 gap-1 border-b border-slate-700 px-2 pb-2"
      >
        {TABS.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[t.id] = el }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${uid}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`min-h-11 rounded-md border px-1 text-sm leading-tight ${
                on
                  ? 'border-amber-400 bg-slate-700 font-bold text-white underline decoration-amber-400 decoration-2 underline-offset-4'
                  : 'border-slate-600 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${tab}`}
        tabIndex={0}
        className="space-y-2 p-3 text-sm lg:max-h-[min(26rem,55vh)] lg:overflow-y-auto"
      >
        {tab === 'brief' && (
          <>
            <PanelTitle>Project brief</PanelTitle>
            <p className="font-semibold text-slate-100">{scenario.title}</p>
            <dl className="space-y-1 text-slate-300">
              <BriefLine name="Client">{scenario.brief.client}</BriefLine>
              <BriefLine name="Location">{scenario.brief.location}</BriefLine>
              <BriefLine name="Programme">{scenario.brief.duration}</BriefLine>
              <BriefLine name="Value">{scenario.brief.value}</BriefLine>
            </dl>
            <BriefList title="Constraints" items={scenario.brief.constraints} />
            <BriefList title="Key risks" items={scenario.brief.keyRisks} />
            {team && (
              <div>
                <h4 className="font-semibold text-slate-100">Your team{team.name ? `: ${team.name}` : ''}</h4>
                {Object.keys(team.roles).length > 0 ? (
                  <ul className="mt-0.5 space-y-0.5 text-slate-300">
                    {Object.entries(team.roles).map(([roleId, member]) => (
                      <li key={roleId}>
                        <b className="font-semibold text-slate-200">{scenario.caseStudy?.groupRoles.find((r) => r.id === roleId)?.title ?? roleId}:</b> {member}
                      </li>
                    ))}
                  </ul>
                ) : team.members.length > 0 ? (
                  <p className="mt-0.5 text-slate-300">{team.members.join(', ')}</p>
                ) : null}
              </div>
            )}
          </>
        )}

        {tab === 'cpp' && (
          <>
            <PanelTitle>Construction Phase Plan (<Abbr term="CPP" />)</PanelTitle>
            <p className="text-slate-300">
              Your plan builds as you make decisions.
              {sealed && ' On Expert it records what you decided. It is marked at handover.'}
            </p>
            <ul className="space-y-1.5">
              {CPP_SECTIONS.map((s) => {
                const entries = s.id === 'projectDescription'
                  ? [scenario.cppProjectDescription, ...(cpp[s.id] ?? [])]
                  : cpp[s.id] ?? []
                const started = entries.length > 0
                return (
                  <li key={s.id}>
                    <div className={`font-semibold ${started ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span aria-hidden="true">{started ? '●' : '○'} </span>
                      {s.title}
                      {!started && <span className="font-normal"> (not started)</span>}
                    </div>
                    {entries.map((e, i) => (
                      <p key={i} className="mt-0.5 pl-4 text-slate-300">{e}</p>
                    ))}
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {tab === 'risk' && (
          <>
            <PanelTitle>Risk register</PanelTitle>
            {sealed ? (
              <NeutralRisks rows={neutralRisks(scenario, state.decisions, steps, state.huntAnswers)} />
            ) : state.riskRegister.length === 0 ? (
              <p className="text-slate-300">Hazards you deal with will appear here with their controls.</p>
            ) : (
              <ul className="space-y-2">
                {state.riskRegister.map((r, i) => <RiskRow key={i} row={r} />)}
              </ul>
            )}
            {tutor.enabled && tutor.customHazards.length > 0 && (
              <div className="rounded border border-amber-700 bg-amber-950/40 p-2">
                <h4 className="font-semibold text-amber-300">Hazards added by your tutor to consider</h4>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-100">
                  {tutor.customHazards.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            )}
          </>
        )}

        {tab === 'tw' && (
          <>
            <PanelTitle>Temporary works register</PanelTitle>
            {twItems.length === 0 ? (
              <p className="text-slate-300">This project has no temporary works register step.</p>
            ) : (
              <ul className="space-y-2">
                {twItems.map((item) => {
                  const ans = state.twAnswers.find((a) => a.itemId === item.id)
                  return (
                    <li key={item.id} className="rounded border border-slate-700 p-2">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      {ans ? (
                        <dl className="mt-1 space-y-0.5 text-slate-300">
                          {TW_FIELDS.map((f) => (
                            <BriefLine key={f.key} name={f.label.replace('?', '')}>{twValue(ans[f.key])}</BriefLine>
                          ))}
                          <BriefLine name="Responsible">{ans.responsible ?? 'Not answered'}</BriefLine>
                        </dl>
                      ) : (
                        <div className="mt-0.5 text-slate-400">Not assessed yet</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'rams' && (
          <>
            <PanelTitle>RAMS decisions</PanelTitle>
            <p className="text-slate-300">
              <Abbr term="RAMS" /> are risk assessments and method statements. Your decisions about them so far:
            </p>
            {ramsDecisions.length === 0 ? (
              <p className="text-slate-400">None yet.{ramsPhase ? ` The RAMS review comes in phase ${ramsPhase}.` : ''}</p>
            ) : (
              <ul className="space-y-2">
                {ramsDecisions.map((d) => (
                  <li key={d.stepId} className="rounded border border-slate-700 p-2">
                    <div className="font-semibold text-slate-100">{d.topic}</div>
                    <div className="mt-0.5 text-slate-300">Your decision: {chosenText(d, steps)}</div>
                    {!sealed && <Chip chip={QUALITY_CHIP[d.quality]} />}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'incidents' && (
          <>
            <PanelTitle>Incident log</PanelTitle>
            {state.incidentLog.length === 0 && state.game.consequences.length === 0 && state.game.notices.length === 0 ? (
              <p className="text-slate-300">No incidents so far.</p>
            ) : (
              <ul className="space-y-2">
                {state.game.notices.map((n, i) => (
                  <li key={`n${i}`} className="rounded border border-red-700 bg-red-950/40 p-2">
                    <div className="font-bold text-red-200">
                      <span aria-hidden="true">🏛️ </span>Week {n.week}: HSE {n.kind === 'prohibition' ? 'Prohibition' : 'Improvement'} Notice
                    </div>
                    <div className="mt-0.5 text-slate-300">Cost {fmtMoney(n.cost)} and {n.days} days.</div>
                  </li>
                ))}
                {state.game.consequences.map((c) => (
                  <li key={c.hazardId} className={`rounded border p-2 ${c.severity === 'major' ? 'border-red-700 bg-red-950/30' : 'border-orange-700 bg-orange-950/30'}`}>
                    <div className={`font-bold ${c.severity === 'major' ? 'text-red-200' : 'text-orange-200'}`}>
                      <span aria-hidden="true">{c.severity === 'major' ? '🚑 ' : '⚠️ '}</span>Week {c.week}: {c.title}
                    </div>
                    <div className="mt-0.5 text-slate-300">{c.narrative}</div>
                  </li>
                ))}
                {state.incidentLog.map((r, i) => (
                  <li key={`e${i}`} className="rounded border border-slate-700 p-2">
                    <div className="text-slate-100">{r.prompt.replace(/^EVENT:\s*/, '')}</div>
                    <div className="mt-0.5 text-slate-300">Your response: {r.response}</div>
                    {!sealed && <Chip chip={HANDLED_CHIP[r.outcomeQuality]} />}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PanelTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-slate-100">{children}</h3>
}

function BriefLine({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-semibold text-slate-200">{name}: </dt>
      <dd className="m-0 inline">{children}</dd>
    </div>
  )
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className="font-semibold text-slate-100">{title}</h4>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-slate-300">
        {items.map((c) => <li key={c}>{c}</li>)}
      </ul>
    </div>
  )
}

function Chip({ chip }: { chip: { icon: string; word: string; cls: string } }) {
  return (
    <div className={`mt-1 text-xs font-bold ${chip.cls}`}>
      <span aria-hidden="true">{chip.icon} </span>{chip.word}
    </div>
  )
}

function RiskRow({ row }: { row: RiskRegisterRow }) {
  const missed = /^NOT IDENTIFIED on the walk-round\.\s*/.test(row.control)
  const control = row.control
    .replace(/^NOT IDENTIFIED on the walk-round\.\s*/, '')
    .replace(/^Chosen response:\s*/, 'Your response: ')
  const chip = missed
    ? { icon: '✕', word: 'Missed on the walk-round', cls: 'text-red-300' }
    : row.adequate
      ? { icon: '✓', word: 'Control adequate', cls: 'text-emerald-400' }
      : { icon: '!', word: 'Control needs review', cls: 'text-amber-300' }
  return (
    <li className="rounded border border-slate-700 p-2">
      <div className="font-semibold text-slate-100">{row.hazard}</div>
      <div className="mt-0.5 text-slate-300">{control}</div>
      <Chip chip={chip} />
    </li>
  )
}

function NeutralRisks({ rows }: { rows: { hazard: string; control: string }[] }) {
  return (
    <>
      <p className="text-slate-300">On Expert the register records what you did. It is marked at handover.</p>
      {rows.length === 0 ? (
        <p className="text-slate-400">Nothing recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="rounded border border-slate-700 p-2">
              <div className="font-semibold text-slate-100">{r.hazard}</div>
              <div className="mt-0.5 text-slate-300">{r.control}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
