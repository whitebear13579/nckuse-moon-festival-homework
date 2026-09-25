import { authenticated, apiError, isUuid, json, parseMutation, rpcError } from '@/lib/api'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const { id } = await params
  if (!isUuid(id)) return apiError('attempt_missing', 404)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  const value = parsed.value as { cellIndex?: unknown; expectedRevision?: unknown; requestId?: unknown } | null
  if (!Number.isSafeInteger(value?.cellIndex) || !Number.isSafeInteger(value?.expectedRevision) ||
    Number(value?.expectedRevision) < 0 || !isUuid(value?.requestId)) return apiError('move_invalid', 422)
  const { data, error } = await client.rpc('apply_move', {
    p_attempt_id: id,
    p_cell_index: value!.cellIndex as number,
    p_expected_revision: value!.expectedRevision as number,
    p_request_id: value!.requestId as string,
  })
  if (error) return rpcError(error)
  if (data?.error === 'attempt_expired') return apiError('attempt_expired', 410)
  return json(data)
}
