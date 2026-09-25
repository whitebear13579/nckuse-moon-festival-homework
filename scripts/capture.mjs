import { chromium } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
import { mkdir } from 'node:fs/promises'

process.loadEnvFile('.env.local')
const origin = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
await mkdir('.impeccable/review', { recursive: true })
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1700)
  await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true })
  await page.close()
}
const cookies = new Map()
const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: {
    getAll: () => [...cookies.values()],
    setAll: items => items.forEach(item => cookies.set(item.name, { name: item.name, value: item.value })),
  },
})
const { error } = await client.auth.signUp({ email: `review-${crypto.randomUUID()}@example.test`, password: 'TestPassword123!' })
if (error) throw error
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await context.addCookies([...cookies.values()].map(cookie => ({ ...cookie, url: origin, sameSite: 'Lax' })))
const page = await context.newPage()
await page.goto(`${origin}/game`)
await page.getByRole('button', { name: /開始第 1 關/ }).click()
await page.locator('.lantern-board').waitFor()
await page.screenshot({ path: '.impeccable/review/game-desktop.png', fullPage: true })
await page.setViewportSize({ width: 390, height: 844 })
await page.screenshot({ path: '.impeccable/review/game-mobile.png', fullPage: true })
await page.goto(`${origin}/account`)
await page.getByRole('checkbox', { name: /減少動畫/ }).waitFor()
await page.screenshot({ path: '.impeccable/review/account-mobile.png', fullPage: true })
await page.goto(`${origin}/leaderboard`)
await page.getByRole('tab', { name: /第 1 關/ }).waitFor()
await page.getByRole('link', { name: '我的帳號' }).waitFor()
await page.getByText('正在讀取月光紀錄…').waitFor({ state: 'hidden' })
await page.screenshot({ path: '.impeccable/review/leaderboard-mobile.png', fullPage: true })
await context.close()
await browser.close()
