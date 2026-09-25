import { expect, test } from '@playwright/test'
import { createPlayer } from './helpers'

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const headers = { origin }

test('Route Handlers enforce auth, validation, revision and idempotency', async ({ browser }) => {
  const guest = await browser.newContext()
  const guestResponse = await guest.request.get('/api/me')
  expect(guestResponse.status()).toBe(401)
  const player = await browser.newContext()
  await createPlayer(player)
  const meResponse = await player.request.get('/api/me')
  expect(meResponse.status()).toBe(200)
  const me = await meResponse.json()
  expect(me.unlockedStage).toBe(1)
  expect(typeof me.nickname).toBe('string')

  expect((await player.request.post('/api/attempts', { headers: { origin: 'https://evil.example' }, data: { stage: 1 } })).status()).toBe(403)
  expect((await player.request.post('/api/attempts', { data: { stage: 1 } })).status()).toBe(403)
  expect((await player.request.post('/api/attempts', { headers: { ...headers, 'content-type': 'text/plain' }, data: '{"stage":1}' })).status()).toBe(400)
  expect((await player.request.post('/api/attempts', { headers, data: { stage: 4 } })).status()).toBe(422)
  expect((await player.request.post('/api/attempts', { headers, data: { stage: 2 } })).status()).toBe(403)
  const started = await player.request.post('/api/attempts', { headers, data: { stage: 1 } })
  expect(started.status()).toBe(201)
  const attempt = await started.json()
  expect(attempt.board_mask).toBe(334)
  expect((await player.request.post('/api/attempts', { headers, data: { stage: 1 } })).status()).toBe(200)

  const requestId = crypto.randomUUID()
  const moveBody = { cellIndex: 0, expectedRevision: 0, requestId }
  const first = await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: moveBody })
  expect(first.status()).toBe(200)
  expect((await first.json()).revision).toBe(1)
  const repeated = await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: moveBody })
  expect((await repeated.json()).revision).toBe(1)
  expect((await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { ...moveBody, cellIndex: 4 } })).status()).toBe(409)
  expect((await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: 4, expectedRevision: 0, requestId: crypto.randomUUID() } })).status()).toBe(409)
  expect((await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: -1, expectedRevision: 1, requestId: crypto.randomUUID() } })).status()).toBe(422)

  const other = await browser.newContext()
  await createPlayer(other)
  expect((await other.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: 4, expectedRevision: 1, requestId: crypto.randomUUID() } })).status()).toBe(403)

  const completed = await player.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: 4, expectedRevision: 1, requestId: crypto.randomUUID() } })
  expect((await completed.json()).status).toBe('completed')
  expect((await player.request.get('/api/me').then(response => response.json())).unlockedStage).toBe(2)
  const publicBoard = await guest.request.get('/api/leaderboard?stage=1').then(response => response.json())
  expect(publicBoard.entries[0]).toHaveProperty('nickname')
  expect(publicBoard.entries[0]).not.toHaveProperty('completedAt')
  await guest.close(); await player.close(); await other.close()
})

test('OAuth callback rejects an external next destination on error', async ({ request }) => {
  const response = await request.get('/auth/callback?next=https://evil.example', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toBe(`${origin}/login?error=oauth`)
})

test('nickname and cloud preference API handle conflicts and invalid values', async ({ browser }) => {
  const context = await browser.newContext()
  await createPlayer(context)
  const prefs = await context.request.get('/api/me/preferences')
  expect(prefs.status()).toBe(200)
  expect((await prefs.json()).revision).toBe(0)
  expect((await context.request.patch('/api/me/preferences', { headers, data: { reduceMotion: 'yes', expectedRevision: 0 } })).status()).toBe(422)
  const saved = await context.request.patch('/api/me/preferences', { headers, data: { reduceMotion: true, expectedRevision: 0 } })
  expect((await saved.json()).revision).toBe(1)
  const conflict = await context.request.patch('/api/me/preferences', { headers, data: { reduceMotion: false, expectedRevision: 0 } })
  expect(conflict.status()).toBe(409)
  expect((await conflict.json()).error.current.reduceMotion).toBe(true)
  expect((await context.request.put('/api/me/nickname', { headers, data: { nickname: '<bad>' } })).status()).toBe(422)
  expect((await context.request.put('/api/me/nickname', { headers, data: { nickname: 'admin' } })).status()).toBe(422)
  const newName = `Moon${crypto.randomUUID().slice(0, 8)}`
  const renamed = await context.request.put('/api/me/nickname', { headers, data: { nickname: newName } })
  expect(renamed.status()).toBe(200)
  expect((await renamed.json()).nickname).toBe(newName)
  expect((await context.request.put('/api/me/nickname', { headers, data: { nickname: '再改一次' } })).status()).toBe(429)
  const other = await browser.newContext()
  await createPlayer(other)
  expect((await other.request.put('/api/me/nickname', { headers, data: { nickname: newName.toLowerCase() } })).status()).toBe(409)
  await other.close()
  await context.close()
})

test('signout removes private access and signing back in restores the same active attempt', async ({ browser }) => {
  const context = await browser.newContext()
  const { email } = await createPlayer(context)
  const started = await context.request.post('/api/attempts', { headers, data: { stage: 1 } })
  expect(started.status()).toBe(201)
  const attempt = await started.json()
  expect((await context.request.post('/api/auth/signout', { headers, data: {} })).status()).toBe(204)
  expect((await context.request.get('/api/me')).status()).toBe(401)
  await createPlayer(context, email)
  const resumed = await context.request.get('/api/me').then(response => response.json())
  expect(resumed.attempt.id).toBe(attempt.id)
  expect(resumed.attempt.status).toBe('active')
  expect(Date.parse(resumed.serverNow)).toBeGreaterThan(Date.parse(attempt.started_at))
  await context.close()
})

test('two devices cannot both commit a move against the same revision', async ({ browser }) => {
  const first = await browser.newContext()
  const second = await browser.newContext()
  const { email } = await createPlayer(first)
  await createPlayer(second, email)
  const started = await first.request.post('/api/attempts', { headers, data: { stage: 1 } })
  const attempt = await started.json()
  const [resultA, resultB] = await Promise.all([
    first.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: 0, expectedRevision: 0, requestId: crypto.randomUUID() } }),
    second.request.post(`/api/attempts/${attempt.id}/moves`, { headers, data: { cellIndex: 4, expectedRevision: 0, requestId: crypto.randomUUID() } }),
  ])
  expect([resultA.status(), resultB.status()].sort()).toEqual([200, 409])
  const current = await first.request.get('/api/me').then(response => response.json())
  expect(current.attempt.moves).toBe(1)
  expect(current.attempt.revision).toBe(1)
  await first.close()
  await second.close()
})
