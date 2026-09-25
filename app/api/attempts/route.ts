import { authenticated, apiError, json, parseMutation, rpcError } from '@/lib/api'
import { isStage } from '@/lib/game'

export async function POST(request: Request) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  const stage = (parsed.value as { stage?: unknown } | null)?.stage
  if (!isStage(stage)) return apiError('stage_invalid', 422)
  const { data, error } = await client.rpc('start_attempt', { p_stage: stage, p_restart: false })
  return error ? rpcError(error) : json(data, data?.created ? 201 : 200)
}
