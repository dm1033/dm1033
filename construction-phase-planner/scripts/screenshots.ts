// Captures key screens for QA evidence. Requires `npm run preview` on :4173.
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173'
const OUT = 'docs/screenshots'

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.screenshot({ path: `${OUT}/01-home.png` })

  await page.getByRole('button', { name: /Start as Delegate/ }).click()
  await page.screenshot({ path: `${OUT}/02-scenario-select.png` })

  await page.getByPlaceholder('Your name').fill('A. Delegate')
  await page.locator('button:has-text("Scenario ")').first().click()
  await page.getByRole('button', { name: 'Start Project' }).click()
  await page.screenshot({ path: `${OUT}/03-project-brief.png` })

  // Play forward until the site planner appears, then screenshot it
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole('button', { name: 'Confirm Site Set-Up' }).isVisible().catch(() => false)) break
    const cont = page.getByRole('button', { name: 'Continue →' })
    if (await cont.isVisible().catch(() => false)) { await cont.click({ timeout: 2000 }).catch(() => {}); continue }
    const opt = page.locator('button:has(span.font-bold)').filter({ hasText: /^C\./ }).first()
    if (await opt.isVisible().catch(() => false)) { await opt.click({ timeout: 2000 }).catch(() => {}); continue }
    await page.waitForTimeout(200)
  }

  // Place a few items to show the planner in action
  const items = ['Hoarding / Fencing', 'Welfare Cabin', 'Bunded Fuel Storage']
  const cells = page.locator('.grid.gap-px > div')
  const targets = [14, 40, 90]
  for (let i = 0; i < items.length; i++) {
    await page.locator(`button:has-text("${items[i]}")`).first().click()
    await cells.nth(targets[i]).click()
  }
  await page.screenshot({ path: `${OUT}/04-site-planner.png` })
  await browser.close()
  console.log('Screenshots captured to', OUT)
}

main().catch((e) => { console.error(e); process.exit(1) })
