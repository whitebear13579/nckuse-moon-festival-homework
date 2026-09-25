import { authenticated, apiError, isUuid, json, parseMutation, rpcError } from '@/lib/api'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const { id } = await params
  if (!isUuid(id)) return apiError('attempt_missing', 404)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  if (parsed.value === null || typeof parsed.value !== 'object' || Object.keys(parsed.value).length !== 0) {
    return apiError('move_invalid', 422)
  }
  const { data, error } = await client.rpc('restart_attempt', { p_attempt_id: id })
  return error ? rpcError(error) : json(data, 201)
}
