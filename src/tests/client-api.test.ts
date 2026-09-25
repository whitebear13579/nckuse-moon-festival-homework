import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, isMe, isTimedAttempt, requestJson } from '@/lib/client-api'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('API client boundary', () => {
  it('returns a successful JSON object and sends mutations without caching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestJson('/api/example', { method: 'POST', body: '{"x":1}' })).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/example', expect.objectContaining({ cache: 'no-store', headers: { 'Content-Type': 'application/json' } }))
  })

  it('preserves structured HTTP errors for revision conflict handling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'preferences_conflict', message: '另一裝置已更新設定。', current: { revision: 2 } } }), { status: 409 })))
    await expect(requestJson('/api/me/preferences')).rejects.toMatchObject({ code: 'preferences_conflict', status: 409, current: { revision: 2 } })
  })

  it('rejects malformed JSON and non-object success responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('<html>', { status: 200 })).mockResolvedValueOnce(new Response('42', { status: 200 })))
    await expect(requestJson('/api/example')).rejects.toMatchObject({ code: 'invalid_response' })
    await expect(requestJson('/api/example')).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('reports aborted requests as retryable network errors with fake time', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_path: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = requestJson('/api/example', { signal: controller.signal })
    const assertion = expect(pending).rejects.toBeInstanceOf(ApiClientError)
    setTimeout(() => controller.abort(), 50)
    await vi.advanceTimersByTimeAsync(50)
    await assertion
  })

  it('rejects malformed profile and attempt data before account or game render', () => {
    const attempt = { id: 'sample', stage: 1, board_mask: 334, moves: 0, revision: 0,
      status: 'active', started_at: '2026-09-24T00:00:00Z', server_now: '2026-09-24T00:00:01Z' }
    const me = { nickname: '月兔', reduceMotion: false, preferencesRevision: 0,
      unlockedStage: 1, bests: [], attempt, serverNow: attempt.server_now }
    expect(isTimedAttempt(attempt)).toBe(true)
    expect(isMe(me)).toBe(true)
    expect(isTimedAttempt({ ...attempt, stage: 4 })).toBe(false)
    expect(isTimedAttempt({ ...attempt, board_mask: -1 })).toBe(false)
    expect(isTimedAttempt({ ...attempt, server_now: undefined })).toBe(false)
    expect(isMe({ ...me, bests: null })).toBe(false)
    expect(isMe({ ...me, attempt: { ...attempt, status: 'completed', elapsed_ms: null } })).toBe(false)
  })
})
