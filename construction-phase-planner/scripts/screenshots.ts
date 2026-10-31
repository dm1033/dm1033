// Captures key screens for QA evidence. Requires `npm run preview` on :4173.
// Usage: npx tsx scripts/screenshots.ts
import { chromium, type Page } from 'playwright'

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173'
const OUT = 'docs/screenshots'

async function visible(page: Page, name: RegExp | string) {
  return page.getByRole('button', { name }).first().isVisible().catch(() => false)
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.screenshot({ path: `${OUT}/01-home.png` })

  await page.getByRole('button', { name: /New project/ }).click()
  await page.getByPlaceholder('Your name').fill('A. Delegate')
  await page.locator('button:has-text("Scenario ")').first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/02-scenario-select.png`, fullPage: true })
  await page.getByRole('button', { name: /Mobilise site/ }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/03-project-brief.png` })

  const shots = new Set<string>()
  const snap = async (name: string, full = false) => {
    if (shots.has(name)) return
    shots.add(name)
    await page.waitForTimeout(450)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  }

  for (let i = 0; i < 400; i++) {
    if (await page.getByText('End of Game Reports').isVisible().catch(() => false)) break
    await page.waitForTimeout(80)
    if (await visible(page, /Back to site →|Read the investigation report →/)) {
      await snap('09-site-week')
      await page.getByRole('button', { name: /Back to site →|Read the investigation report →/ }).click()
      continue
    }
    if (await visible(page, /^Continue →/)) {
      await page.getByRole('button', { name: /^Continue →/ }).first().click().catch(() => {})
      continue
    }
    if (await visible(page, /Start the walk-round/)) {
      await snap('07-hazard-hunt-intro')
      await page.getByRole('button', { name: /Start the walk-round/ }).click().catch(() => {})
      const tiles = page.locator('button[aria-pressed]')
      for (const i2 of [0, 2, 5, 7, 9, 12]) await tiles.nth(i2).click().catch(() => {})
      await snap('08-hazard-hunt')
      await page.getByRole('button', { name: 'Finish walk-round' }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/08b-hazard-hunt-result.png`, fullPage: true })
      continue
    }
    if (await visible(page, /Lock in sequence/)) {
      await snap('06-sequence')
      await page.getByRole('button', { name: /^Move .* up$/ }).nth(3).click().catch(() => {})
      await page.getByRole('button', { name: /Lock in sequence/ }).click()
      continue
    }
    if (await visible(page, 'Confirm Site Set-Up')) { await page.getByRole('button', { name: 'Confirm Site Set-Up' }).click(); continue }
    if (await visible(page, 'Submit Register')) {
      for (const b of await page.locator('button:text-is("Yes")').all()) await b.click()
      for (const sel of await page.locator('select').all()) await sel.selectOption({ index: 1 })
      await page.getByRole('button', { name: 'Submit Register' }).click()
      continue
    }
    if (await visible(page, 'Confirm Permit Systems')) { await page.getByRole('button', { name: 'Confirm Permit Systems' }).click(); continue }
    const opts = page.locator('button[role="radio"]:not([disabled])')
    if ((await opts.count()) > 0) {
      await opts.nth(1).click().catch(() => {})
      await snap('04-decision')
      await page.getByRole('button', { name: /^Fairly sure/ }).click().catch(() => {})
      await snap('05-decision-feedback')
      continue
    }
    await page.waitForTimeout(200)
  }
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/10-project-outcome.png`, fullPage: true })
  await page.locator('button:has-text("Decision Review")').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/11-decision-review.png` })

  // Tablet layout
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.getByRole('button', { name: /New Scenario/ }).click()
  await page.locator('button:has-text("Scenario ")').nth(2).click()
  await page.getByRole('button', { name: /Mobilise site/ }).click()
  await page.getByRole('button', { name: /^Continue →/ }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/12-tablet-game.png` })

  await browser.close()
  console.log('Screenshots captured to', OUT)
}

main().catch((e) => { console.error(e); process.exit(1) })
