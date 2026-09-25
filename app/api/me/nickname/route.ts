import { authenticated, apiError, json, parseMutation, rpcError } from '@/lib/api'
import { validateNickname } from '@/lib/nickname'

export async function PUT(request: Request) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  const { nickname, error: validationError } = validateNickname((parsed.value as { nickname?: unknown } | null)?.nickname)
  if (validationError) return apiError(validationError, 422)
  const { data, error } = await client.rpc('set_nickname', { p_nickname: nickname })
  return error ? rpcError(error) : json(data)
}
