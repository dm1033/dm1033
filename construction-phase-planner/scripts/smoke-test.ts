// End-to-end smoke test: plays a full scenario from home screen to report screen.
// Usage: npx tsx scripts/smoke-test.ts [scenarioIndex 0|1|2] [learner|standard|expert] [random|first]
// Requires the preview server on http://localhost:4173 (npm run preview).
import { chromium } from 'playwright'

const SCENARIO_INDEX = Number(process.argv[2] ?? 0)
const DIFFICULTY = (process.argv[3] ?? 'standard') as 'learner' | 'standard' | 'expert'
const STRATEGY = (process.argv[4] ?? 'random') as 'random' | 'first'
const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173'
const DIFF_LABEL = { learner: 'Learning', standard: 'Standard', expert: 'Expert' }[DIFFICULTY]

// Small deterministic PRNG so failures are reproducible.
let seed = 12345 + SCENARIO_INDEX * 101
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  // Home → scenario select
  await page.getByRole('button', { name: /New project/ }).click()
  await page.getByPlaceholder('Your name').fill(`Smoke ${DIFF_LABEL}`)
  await page.locator('button:has-text("Scenario ")').nth(SCENARIO_INDEX).click()
  await page.locator('button', { hasText: DIFF_LABEL }).filter({ hasText: 'Play as' }).first().click()
  await page.getByRole('button', { name: /Mobilise site/ }).click()

  const seen = { weeks: 0, decisions: 0, hunts: 0, sequences: 0, timedOut: 0 }
  let steps = 0
  const maxSteps = 600
  while (steps++ < maxSteps) {
    if (await page.getByText('End of Game Reports').isVisible().catch(() => false)) break
    // Let React commit (e.g. the weekly-report modal can mount over the next step).
    await page.waitForTimeout(80)

    // Weekly site report modal
    const weekBtn = page.getByRole('button', { name: /Back to site →|Read the investigation report →/ })
    if (await weekBtn.isVisible().catch(() => false)) {
      seen.weeks++
      // Occasionally close out a risk to exercise the review.
      const closeOut = page.getByRole('button', { name: /^Close out/ }).first()
      if (rand() < 0.4 && await closeOut.isVisible().catch(() => false)) await closeOut.click()
      const audit = page.getByRole('button', { name: /Commission site audit/ })
      if (rand() < 0.3 && await audit.isVisible().catch(() => false)) await audit.click()
      await weekBtn.click()
      continue
    }

    // Info / feedback continue button
    const cont = page.getByRole('button', { name: /^Continue →/ })
    if (await cont.isVisible().catch(() => false)) {
      await cont.click({ timeout: 2000 }).catch(() => {})
      continue
    }

    // Hazard hunt
    const startHunt = page.getByRole('button', { name: /Start the walk-round/ })
    if (await startHunt.isVisible().catch(() => false)) {
      if (!(await startHunt.click({ timeout: 3000 }).then(() => true).catch(() => false))) continue
      const tiles = page.locator('button[aria-pressed]')
      const n = await tiles.count()
      for (let i = 0; i < n; i++) if (rand() < 0.5) await tiles.nth(i).click()
      await page.getByRole('button', { name: 'Finish walk-round' }).click()
      seen.hunts++
      continue
    }

    // Sequence
    const lock = page.getByRole('button', { name: /Lock in sequence/ })
    if (await lock.isVisible().catch(() => false)) {
      if (await page.getByRole('dialog').isVisible().catch(() => false)) continue
      for (let i = 0; i < 4; i++) {
        const ups = page.getByRole('button', { name: /^Move .* up$/ })
        const count = await ups.count()
        const idx = Math.floor(rand() * count)
        if (await ups.nth(idx).isEnabled().catch(() => false)) await ups.nth(idx).click()
      }
      await lock.click()
      seen.sequences++
      continue
    }

    // Site setup
    const confirmSetup = page.getByRole('button', { name: 'Confirm Site Set-Up' })
    if (await confirmSetup.isVisible().catch(() => false)) {
      if (!(await confirmSetup.click({ timeout: 3000 }).then(() => true).catch(() => false))) continue
      continue
    }

    // TW register: fill everything then submit
    const submitTw = page.getByRole('button', { name: 'Submit Register' })
    if (await submitTw.isVisible().catch(() => false)) {
      if (await page.getByRole('dialog').isVisible().catch(() => false)) continue
      const yesButtons = page.locator('button:text-is("Yes")')
      const n = await yesButtons.count()
      for (let i = 0; i < n; i++) await yesButtons.nth(i).click()
      for (const sel of await page.locator('select').all()) {
        const opts = await sel.locator('option:not([disabled])').all()
        if (opts.length > 0) await sel.selectOption({ index: 1 })
      }
      if (await submitTw.isEnabled()) { await submitTw.click() } else {
        throw new Error('TW submit still disabled after filling fields')
      }
      continue
    }

    // Permits
    const confirmPermits = page.getByRole('button', { name: 'Confirm Permit Systems' })
    if (await confirmPermits.isVisible().catch(() => false)) {
      if (await page.getByRole('dialog').isVisible().catch(() => false)) continue
      const boxes = page.locator('button:has-text("☐")')
      const n = Math.min(await boxes.count(), 4)
      for (let i = 0; i < n; i++) await boxes.first().click()
      await confirmPermits.click()
      continue
    }

    // Decision: select an option, then commit with a confidence level
    const options = page.locator('button[role="radio"]:not([disabled])')
    const optCount = await options.count().catch(() => 0)
    if (optCount > 0) {
      const pick = STRATEGY === 'first' ? 0 : Math.floor(rand() * optCount)
      await options.nth(pick).click({ timeout: 2000 }).catch(() => {})
      if (rand() < 0.1) {
        const help = page.getByRole('button', { name: /Call the H&S Adviser/ })
        if (await help.isEnabled().catch(() => false)) await help.click()
        await page.locator('button[role="radio"]:not([disabled])').first().click({ timeout: 2000 }).catch(() => {})
      }
      const conf = ['Certain', 'Fairly sure', 'Unsure'][Math.floor(rand() * 3)]
      await page.getByRole('button', { name: new RegExp(`^${conf}`) }).click({ timeout: 2000 }).catch(() => {})
      seen.decisions++
      continue
    }

    // Nothing actionable found this tick
    await page.waitForTimeout(250)
  }

  if (steps >= maxSteps) {
    await page.screenshot({ path: `scripts/smoke-fail-${SCENARIO_INDEX}.png` })
    console.error('BODY TEXT AT FAILURE:\n', (await page.locator('body').innerText()).slice(0, 2000))
    throw new Error('Did not reach report screen within step budget')
  }

  // Verify report tabs render
  try {
    await page.getByText('Game points').first().waitFor({ timeout: 5000 })
    for (const tab of ['1 · Score Report', 'Decision Review', '2 · Construction Phase Plan', '3 · Risk Assessment Summary', '4 · Temporary Works Register', '5 · Permit Tracker', '6 · Inspection Tracker', '7 · Environmental Checklist', '8 · Incident Response Log', '9 · Missed Items Report', '10 · Model Answer Overlay', '11 · Tutor Review Sheet', '12 · Certificate', 'Project Outcome']) {
      await page.locator(`button:has-text("${tab}")`).first().click({ timeout: 8000 })
      await page.waitForTimeout(100)
    }
  } catch (e) {
    await page.screenshot({ path: `scripts/smoke-fail-${SCENARIO_INDEX}.png` })
    console.error('BODY TEXT AT FAILURE:\n', (await page.locator('body').innerText()).slice(0, 2000))
    throw e
  }
  const points = await page.locator('.text-5xl').first().textContent()
  console.log(`Scenario ${SCENARIO_INDEX} (${DIFFICULTY}, ${STRATEGY}): reached report in ${steps} ticks · ${seen.decisions} decisions · ${seen.weeks} site weeks · ${seen.hunts} hunts · ${seen.sequences} sequences · points ${points}`)

  // Leaderboard should now contain the run.
  const board = await page.evaluate(() => JSON.parse(localStorage.getItem('cpp-leaderboard-v1') ?? '[]').length)
  if (board !== 1) throw new Error(`Expected 1 leaderboard entry, found ${board}`)

  await page.screenshot({ path: `scripts/smoke-scenario-${SCENARIO_INDEX}.png`, fullPage: false })

  const fatal = errors.filter((e) => !e.includes('favicon'))
  if (fatal.length) {
    console.error('Errors captured:\n' + fatal.join('\n'))
    process.exit(1)
  }
  console.log('No console/page errors. Smoke test PASSED.')
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
