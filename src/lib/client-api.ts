export class ApiClientError extends Error {
  constructor(public code: string, public status: number, message: string, public current?: unknown) {
    super(message)
  }
}

export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      cache: 'no-store',
      signal: options.signal ?? AbortSignal.timeout(8000),
    })
  } catch {
    throw new ApiClientError('network_error', 0, '連線逾時或中斷，請重新同步。')
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiClientError('invalid_response', response.status, '伺服器回應無法讀取，請重試。')
  }
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string; current?: unknown } })?.error
    throw new ApiClientError(error?.code ?? 'service_unavailable', response.status,
      error?.message ?? '服務暫時不可用，請稍後重試。', error?.current)
  }
  if (!body || typeof body !== 'object') throw new ApiClientError('invalid_response', response.status, '伺服器回應格式不正確。')
  return body as T
}

export interface Attempt {
  id: string
  stage: number
  board_mask: number
  moves: number
  revision: number
  status: 'active' | 'completed' | 'abandoned' | 'expired'
  started_at: string
  elapsed_ms?: number | null
  server_now?: string
  created?: boolean
  is_personal_best?: boolean
}

export interface Best {
  stage: number
  elapsedMs: number
  moves: number
  rank: number
}

export interface Me {
  nickname: string
  nicknameNextChangeAt: string | null
  reduceMotion: boolean
  preferencesRevision: number
  unlockedStage: number
  bests: Best[]
  attempt: Attempt | null
  serverNow: string
}

export interface Preferences {
  reduceMotion: boolean
  revision: number
  updatedAt: string | null
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const nonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0

export function isAttempt(value: unknown): value is Attempt {
  if (!record(value)) return false
  const stage = value.stage
  const size = stage === 1 ? 3 : stage === 2 ? 4 : stage === 3 ? 5 : 0
  return typeof value.id === 'string' && size > 0 && nonNegativeInteger(value.board_mask)
    && Number(value.board_mask) < 2 ** (size * size)
    && nonNegativeInteger(value.moves) && Number(value.moves) <= 999
    && nonNegativeInteger(value.revision)
    && ['active', 'completed', 'abandoned', 'expired'].includes(String(value.status))
    && typeof value.started_at === 'string' && Number.isFinite(Date.parse(value.started_at))
    && (value.status !== 'completed' || nonNegativeInteger(value.elapsed_ms))
}

export function isMe(value: unknown): value is Me {
  if (!record(value)) return false
  return typeof value.nickname === 'string' && typeof value.reduceMotion === 'boolean'
    && nonNegativeInteger(value.preferencesRevision)
    && [1, 2, 3].includes(Number(value.unlockedStage))
    && Array.isArray(value.bests) && value.bests.every(best => record(best)
      && [1, 2, 3].includes(Number(best.stage)) && nonNegativeInteger(best.elapsedMs)
      && nonNegativeInteger(best.moves) && nonNegativeInteger(best.rank))
    && (value.attempt === null || isAttempt(value.attempt))
    && typeof value.serverNow === 'string' && Number.isFinite(Date.parse(value.serverNow))
}

export function isTimedAttempt(value: unknown): value is Attempt & { server_now: string } {
  return isAttempt(value) && typeof value.server_now === 'string' && Number.isFinite(Date.parse(value.server_now))
}
