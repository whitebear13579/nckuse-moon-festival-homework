import { expect, test } from '@playwright/test'
import { createPlayer } from './helpers'

test('減少動畫與禁用本機儲存下，首頁和榜單仍可操作', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('local storage disabled') }
    Storage.prototype.setItem = () => { throw new Error('local storage disabled') }
  })
  await page.goto('/')
  const preview = page.getByRole('button', { name: '點亮預覽燈籠' })
  await preview.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '熄滅預覽燈籠' })).toBeVisible()
  await page.goto('/leaderboard')
  await expect(page.getByRole('tab', { name: /第 2 關/ })).toBeVisible()
  await page.getByRole('tab', { name: /第 2 關/ }).click()
  await expect(page.getByRole('tab', { name: /第 2 關/ })).toHaveAttribute('aria-selected', 'true')
})

test('棋盤鍵盤操作與狀態標籤', async ({ page, context }) => {
  await createPlayer(context)
  await page.goto('/game')
  await page.getByRole('button', { name: /開始第 1 關/ }).click()
  const first = page.getByRole('button', { name: /第 1 列第 1 行/ })
  await expect(first).toHaveAttribute('aria-pressed', /true|false/)
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('1 / 999')).toBeVisible()
})

test('榜單在服務失敗與畸形回應時提供恢復入口', async ({ page }) => {
  await page.route('**/api/leaderboard?stage=1', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.goto('/leaderboard')
  await expect(page.getByText('榜單資料格式不正確。')).toBeVisible()
  await page.unrouteAll()
  await page.getByRole('button', { name: '再試一次' }).click()
  await expect(page.getByRole('tab', { name: /第 1 關/ })).toHaveAttribute('aria-selected', 'true')
})

test('雲端偏好讀取失敗可重試，儲存失敗不宣稱同步', async ({ page, context }) => {
  await createPlayer(context)
  await page.route('**/api/me/preferences', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"service_unavailable","message":"服務暫時不可用，請稍後重試。"}}' }))
  await page.goto('/account')
  await expect(page.getByText(/偏好同步中斷/)).toBeVisible()
  await page.unrouteAll()
  await page.getByRole('button', { name: '重新同步' }).click()
  await expect(page.getByText(/偏好同步中斷/)).toHaveCount(0)
  await page.route('**/api/me/preferences', route => route.request().method() === 'PATCH'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"service_unavailable","message":"服務暫時不可用，請稍後重試。"}}' })
    : route.continue())
  const toggle = page.getByRole('checkbox', { name: /減少動畫/ })
  await toggle.click()
  await expect(page.getByText('服務暫時不可用，請稍後重試。')).toBeVisible()
  await expect(toggle).not.toBeChecked()
})

test('畸形帳號回應顯示重試入口，不使帳號頁崩潰', async ({ page, context }) => {
  await createPlayer(context)
  await page.route('**/api/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"nickname":"月兔","bests":null}' }))
  await page.goto('/account')
  await expect(page.getByText('帳號資料同步中斷；請重新連線。')).toBeVisible()
  await page.unrouteAll()
  await page.getByRole('button', { name: '重新連線' }).click()
  await expect(page.getByRole('textbox', { name: '暱稱' })).toBeVisible()
})

test('四種視窗寬度的主要頁面無水平捲動', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    for (const path of ['/', '/leaderboard', '/login']) {
      await page.goto(path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} at ${width}px`).toBe(true)
    }
  }
})

test('一般動態偏好下切頁月幕會結束，頁面保持可操作', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.site-wrap')).toHaveAttribute('data-reduced', 'false')
  await page.getByRole('navigation', { name: '主選單' }).getByRole('link', { name: '排行榜' }).click()
  await expect(page.getByRole('heading', { name: /最快點燈的人/ })).toBeVisible()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.moon-wipe')!).clipPath.includes('100%'))
  await page.getByRole('tab', { name: /第 2 關/ }).click()
  await expect(page.getByRole('tab', { name: /第 2 關/ })).toHaveAttribute('aria-selected', 'true')
})
