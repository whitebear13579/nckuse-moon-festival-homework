import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type RpcClient = Awaited<ReturnType<typeof createClient>>

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

export function apiError(code: string, status: number, extra?: Record<string, unknown>) {
  const messages: Record<string, string> = {
    unauthorized: '請先登入。', forbidden: '無法操作其他玩家的回合。',
    stage_invalid: '關卡無效。', stage_missing: '找不到此關卡。', stage_locked: '請先完成前一關。',
    move_invalid: '點燈位置或資料無效。', attempt_missing: '找不到這個回合。', attempt_closed: '本回合已結束。',
    attempt_expired: '本回合已逾時，請重新開始。', revision_conflict: '進度已更新，請重新同步。',
    request_conflict: '此操作編號已有不同內容。', rate_limited: '操作太頻繁，請稍後再試。',
    nickname_invalid: '暱稱需為 2–12 字，且符合允許字元。', nickname_reserved: '這個暱稱已保留，請換一個。',
    nickname_taken: '暱稱已被使用，請換一個。', nickname_cooldown: '改名後請等 30 秒再試。',
    preferences_invalid: '偏好設定格式不正確。', preferences_conflict: '另一裝置已更新設定，請重新確認。',
    invalid_origin: '請從本站送出操作。', invalid_json: '請送出正確的 JSON 資料。', service_unavailable: '服務暫時不可用，請稍後重試。',
  }
  return json({ error: { code, message: messages[code] ?? messages.service_unavailable, ...extra } }, status)
}

const STATUSES: Record<string, number> = {
  unauthorized: 401, forbidden: 403, stage_invalid: 422, stage_missing: 404, stage_locked: 403,
  move_invalid: 422, attempt_missing: 404, attempt_closed: 410, attempt_expired: 410,
  revision_conflict: 409, request_conflict: 409, rate_limited: 429,
  nickname_invalid: 422, nickname_reserved: 422, nickname_taken: 409, nickname_cooldown: 429,
  preferences_invalid: 422, preferences_conflict: 409,
}

export function rpcError(error: { message: string; code?: string } | null) {
  const code = error?.message?.trim() ?? 'service_unavailable'
  if (error?.code === 'PGRST202' || error?.code === 'PGRST205') {
    console.error('Supabase schema is missing or stale; check migrations and PostgREST schema cache.', { code: error.code })
  } else if (!(code in STATUSES)) console.error('Supabase RPC failed', { code: error?.code ?? 'unknown' })
  return apiError(code in STATUSES ? code : 'service_unavailable', STATUSES[code] ?? 503)
}

export async function authenticated() {
  const client = await createClient()
  const { data, error } = await client.auth.getClaims()
  return { client, userId: error ? null : data?.claims?.sub ?? null }
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const ownOrigin = process.env.APP_ORIGIN ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  return Boolean(origin && ownOrigin && origin === ownOrigin)
}

export async function parseMutation(request: Request): Promise<{ value?: unknown; response?: NextResponse }> {
  if (!sameOrigin(request)) return { response: apiError('invalid_origin', 403) }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return { response: apiError('invalid_json', 400) }
  try {
    const body = await request.text()
    if (body.length > 4096) return { response: apiError('invalid_json', 400) }
    return { value: JSON.parse(body) }
  } catch {
    return { response: apiError('invalid_json', 400) }
  }
}

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value)
