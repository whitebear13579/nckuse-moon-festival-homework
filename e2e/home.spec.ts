import { expect, test } from '@playwright/test'

test('首頁與正式遊戲分頁，未登入先進登入頁', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /替月亮點燈/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '點亮預覽燈籠' })).toBeVisible()
  await page.getByRole('button', { name: '點亮預覽燈籠' }).click()
  await expect(page.getByRole('button', { name: '熄滅預覽燈籠' })).toBeVisible()
  await page.goto('/game')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: /使用 Google 登入/ })).toBeVisible()
})

test('小螢幕首頁與排行榜不產生水平捲動，字體失敗仍可讀', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.route('https://font.emtech.cc/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /替月亮點燈/ })).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/font-ready/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goto('/leaderboard')
  await expect(page.getByRole('heading', { name: /最快點燈的人/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('emfont 逾時仍保留可讀後備字體與首頁操作', async ({ page }) => {
  await page.route('https://font.emtech.cc/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 2200))
    await route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /替月亮點燈/ })).toBeVisible()
  await page.waitForTimeout(1700)
  await expect(page.locator('html')).not.toHaveClass(/font-ready/)
  await expect(page.getByRole('button', { name: '點亮預覽燈籠' })).toBeEnabled()
})
