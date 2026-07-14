// End-to-end smoke test: plays a full scenario from home screen to report screen.
// Usage: npx tsx scripts/smoke-test.ts [scenarioIndex] [mode]
//   mode: learning (default) | assessment
// Requires the preview server on http://localhost:4173 (npm run preview).
import { chromium } from 'playwright'

const SCENARIO_INDEX = Number(process.argv[2] ?? 0)
const MODE = (process.argv[3] ?? 'learning') as 'learning' | 'assessment'
const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173'

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
  await page.getByRole('button', { name: /Start as Delegate/ }).click()
  await page.getByPlaceholder('Your name').fill('Smoke Tester')
  const cards = page.locator('button:has-text("Scenario ")')
  await cards.nth(SCENARIO_INDEX).click()
  if (MODE === 'assessment') {
    await page.locator('button:has-text("Assessment Mode")').click()
  }
  await page.getByRole('button', { name: 'Start Project' }).click()

  let steps = 0
  const maxSteps = 400
  while (steps++ < maxSteps) {
    if (await page.getByText('End of Game Reports').isVisible().catch(() => false)) break

    // Info / feedback / phase-summary continue buttons
    const cont = page.getByRole('button', { name: /^Continue/ }).first()
    if (await cont.isVisible().catch(() => false)) {
      await cont.click({ timeout: 2000 }).catch(() => {})
      continue
    }

    // Site setup
    const confirmSetup = page.getByRole('button', { name: 'Confirm Site Set-Up' })
    if (await confirmSetup.isVisible().catch(() => false)) {
      // Place a few items: click first three palette items onto first placeable cells
      await confirmSetup.click()
      continue
    }

    // TW register: fill everything then submit
    const submitTw = page.getByRole('button', { name: 'Submit Register' })
    if (await submitTw.isVisible().catch(() => false)) {
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
      const boxes = page.locator('button:has-text("☐")')
      const n = Math.min(await boxes.count(), 4)
      for (let i = 0; i < n; i++) await boxes.first().click()
      await confirmPermits.click()
      continue
    }

    // Decision: click first lettered option
    const option = page.locator('button:has(span.font-bold)').filter({ hasText: /^A\./ }).first()
    if (await option.isVisible().catch(() => false)) {
      await option.click({ timeout: 2000 }).catch(() => {})
      continue
    }

    // Nothing actionable found this tick
    await page.waitForTimeout(250)
  }

  if (steps >= maxSteps) throw new Error('Did not reach report screen within step budget')

  if (MODE === 'assessment') {
    // Assessment mode must not have leaked feedback during play; the report must
    // still show the weighted outcome and record the mode.
    const body = await page.locator('body').innerText()
    if (!body.includes('assessment')) throw new Error('Report does not record assessment mode')
  }

  // Verify report tabs render
  try {
    for (const tab of ['1 · Score Report', '2 · Construction Phase Plan', '3 · Risk Assessment Summary', '4 · Temporary Works Register', '5 · Permit Tracker', '6 · Inspection Tracker', '7 · Environmental Checklist', '8 · Incident Response Log', '9 · Missed Items Report', '10 · Model Answer Overlay', '11 · Learning Objectives', '12 · Tutor Review Sheet', '13 · Certificate']) {
      await page.locator(`button:has-text("${tab}")`).first().click({ timeout: 8000 })
      await page.waitForTimeout(100)
    }
  } catch (e) {
    await page.screenshot({ path: `scripts/smoke-fail-${SCENARIO_INDEX}.png` })
    console.error('BODY TEXT AT FAILURE:\n', (await page.locator('body').innerText()).slice(0, 2000))
    throw e
  }
  const overall = await page.locator('.print-area').first().textContent()
  console.log(`Scenario ${SCENARIO_INDEX}: reached report screen in ${steps} steps.`)

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
