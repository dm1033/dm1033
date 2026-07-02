// Validates scenario JSON files against the game schema.
// Run with: npm run validate:data
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_ITEMS } from '../src/data/siteItems'
import { CPP_SECTIONS, SCORE_KEYS, METER_KEYS } from '../src/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCENARIO_DIR = join(__dirname, '..', 'src', 'data', 'scenarios')

const VALID_ITEM_IDS = new Set(SITE_ITEMS.map((i) => i.id))
const VALID_CPP = new Set(CPP_SECTIONS.map((s) => s.id))
const VALID_IMPACT_KEYS = new Set<string>([...SCORE_KEYS, ...METER_KEYS])
const QUALITIES = new Set(['best', 'partial', 'poor', 'unsafe'])
const DESIGNS = new Set(['bespoke', 'standard-solution', 'none'])
const CATS = new Set(['cat0', 'cat1', 'cat2', 'cat3'])
const RESP = new Set(['TWC', 'TWS', 'PC', 'contractor', 'designer'])

let errors = 0
const err = (file: string, msg: string) => {
  errors++
  console.error(`  ✗ [${file}] ${msg}`)
}

function checkDecision(file: string, d: any, where: string) {
  if (!d.id) err(file, `${where}: decision missing id`)
  if (!d.prompt) err(file, `${where}: decision ${d.id} missing prompt`)
  if (!d.topic) err(file, `${where}: decision ${d.id} missing topic`)
  if (!d.learningNote) err(file, `${where}: decision ${d.id} missing learningNote`)
  if (!Array.isArray(d.options) || d.options.length < 2) {
    err(file, `${where}: decision ${d.id} needs at least 2 options`)
    return
  }
  const bestCount = d.options.filter((o: any) => o.quality === 'best').length
  if (bestCount !== 1) err(file, `${where}: decision ${d.id} must have exactly 1 'best' option (has ${bestCount})`)
  for (const o of d.options) {
    if (!QUALITIES.has(o.quality)) err(file, `${where}: decision ${d.id} option ${o.id} invalid quality '${o.quality}'`)
    if (!o.feedback) err(file, `${where}: decision ${d.id} option ${o.id} missing feedback`)
    if (o.impact) {
      for (const k of Object.keys(o.impact)) {
        if (!VALID_IMPACT_KEYS.has(k)) err(file, `${where}: decision ${d.id} option ${o.id} invalid impact key '${k}'`)
      }
    }
  }
  if (d.cppSection && !VALID_CPP.has(d.cppSection)) {
    err(file, `${where}: decision ${d.id} invalid cppSection '${d.cppSection}'`)
  }
}

function validateScenario(file: string, s: any) {
  for (const field of ['id', 'title', 'subtitle', 'brief', 'cppProjectDescription', 'phases', 'eventPool', 'eventDraw', 'modelAnswerNotes']) {
    if (s[field] === undefined) err(file, `missing top-level field '${field}'`)
  }
  if (!Array.isArray(s.phases)) return
  if (s.phases.length !== 15) err(file, `expected 15 phases, found ${s.phases.length}`)
  const numbers = s.phases.map((p: any) => p.number)
  for (let n = 1; n <= 15; n++) {
    if (!numbers.includes(n)) err(file, `missing phase number ${n}`)
  }
  const seenIds = new Set<string>()
  let siteSetups = 0, twSteps = 0, permitSteps = 0, decisions = 0

  for (const phase of s.phases) {
    if (!phase.id || !phase.title || !phase.intro) err(file, `phase ${phase.number} missing id/title/intro`)
    if (!Array.isArray(phase.steps) || phase.steps.length === 0) {
      err(file, `phase ${phase.number} has no steps`)
      continue
    }
    for (const step of phase.steps) {
      if (seenIds.has(step.id)) err(file, `duplicate step id '${step.id}'`)
      seenIds.add(step.id)
      switch (step.type) {
        case 'info':
          if (!step.title || !Array.isArray(step.body)) err(file, `info ${step.id} missing title/body`)
          break
        case 'decision':
          decisions++
          checkDecision(file, step, `phase ${phase.number}`)
          break
        case 'siteSetup': {
          siteSetups++
          if (!step.grid?.cols || !step.grid?.rows) err(file, `siteSetup ${step.id} missing grid`)
          const zoneIds = new Set((step.zones ?? []).map((z: any) => z.id))
          for (const z of step.zones ?? []) {
            if (z.x1 > z.x2 || z.y1 > z.y2) err(file, `siteSetup ${step.id} zone ${z.id} has inverted rect`)
            if (z.x2 >= step.grid.cols || z.y2 >= step.grid.rows) err(file, `siteSetup ${step.id} zone ${z.id} exceeds grid`)
          }
          for (const r of step.rules ?? []) {
            if (!VALID_ITEM_IDS.has(r.itemId)) err(file, `siteSetup ${step.id} unknown itemId '${r.itemId}'`)
            for (const z of [...(r.goodZones ?? []), ...(r.badZones ?? [])]) {
              if (!zoneIds.has(z)) err(file, `siteSetup ${step.id} rule ${r.itemId} references unknown zone '${z}'`)
            }
          }
          const placeable = (step.zones ?? []).some((z: any) => !z.blocked)
          if (!placeable) err(file, `siteSetup ${step.id} has no placeable zones`)
          break
        }
        case 'twRegister':
          twSteps++
          for (const item of step.items ?? []) {
            const c = item.correct ?? {}
            if (typeof c.register !== 'boolean') err(file, `tw ${item.id} correct.register must be boolean`)
            if (!DESIGNS.has(c.design)) err(file, `tw ${item.id} invalid design '${c.design}'`)
            if (!CATS.has(c.catCheck)) err(file, `tw ${item.id} invalid catCheck '${c.catCheck}'`)
            if (!RESP.has(c.responsible)) err(file, `tw ${item.id} invalid responsible '${c.responsible}'`)
            if (!item.explanation) err(file, `tw ${item.id} missing explanation`)
          }
          if ((step.items ?? []).length < 5) err(file, `twRegister ${step.id} should have at least 5 items`)
          break
        case 'permits': {
          permitSteps++
          const optIds = new Set((step.options ?? []).map((o: any) => o.id))
          for (const req of step.required ?? []) {
            if (!optIds.has(req)) err(file, `permits ${step.id} required '${req}' not in options`)
          }
          if (!step.explanation) err(file, `permits ${step.id} missing explanation`)
          break
        }
        default:
          err(file, `unknown step type '${step.type}' (${step.id})`)
      }
    }
  }

  for (const ev of s.eventPool ?? []) {
    if (ev.type !== 'decision' || !ev.isEvent) err(file, `eventPool entry ${ev.id} must be a decision with isEvent=true`)
    if (seenIds.has(ev.id)) err(file, `eventPool id '${ev.id}' duplicates a phase step id`)
    checkDecision(file, ev, 'eventPool')
  }
  if ((s.eventPool ?? []).length < s.eventDraw) err(file, `eventDraw (${s.eventDraw}) exceeds pool size (${(s.eventPool ?? []).length})`)
  if ((s.eventPool ?? []).length < 5) err(file, `eventPool should have at least 5 events`)

  if (siteSetups < 1) err(file, 'needs at least one siteSetup step')
  if (twSteps < 1) err(file, 'needs at least one twRegister step')
  if (permitSteps < 1) err(file, 'needs at least one permits step')
  if (decisions < 12) err(file, `needs at least 12 decisions (found ${decisions})`)

  console.log(`  ${file}: ${s.phases.length} phases, ${decisions} decisions, ${(s.eventPool ?? []).length} pool events, ${siteSetups} site setup, ${twSteps} TW step(s), ${permitSteps} permit step(s)`)
}

console.log('Validating scenario data...')
const files = readdirSync(SCENARIO_DIR).filter((f: string) => f.endsWith('.json'))
if (files.length === 0) {
  console.error('No scenario JSON files found')
  process.exit(1)
}
for (const f of files) {
  let parsed: any
  try {
    parsed = JSON.parse(readFileSync(join(SCENARIO_DIR, f), 'utf-8'))
  } catch (e) {
    err(f, `invalid JSON: ${(e as Error).message}`)
    continue
  }
  validateScenario(f, parsed)
}

if (errors > 0) {
  console.error(`\n${errors} error(s) found.`)
  process.exit(1)
}
console.log(`\nAll ${files.length} scenario file(s) valid.`)
