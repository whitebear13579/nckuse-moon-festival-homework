import { authenticated, apiError, json, parseMutation, rpcError } from '@/lib/api'
import { isPreferenceUpdate } from '@/lib/cloud-preferences'

export async function GET() {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const { data, error } = await client.rpc('get_preferences')
  return error ? rpcError(error) : json(data)
}

export async function PATCH(request: Request) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  if (!isPreferenceUpdate(parsed.value)) return apiError('preferences_invalid', 422)
  const { data, error } = await client.rpc('set_ui_preferences', {
    p_reduce_motion: parsed.value.reduceMotion,
    p_expected_revision: parsed.value.expectedRevision,
  })
  if (error?.message === 'preferences_conflict') {
    const latest = await client.rpc('get_preferences')
    return apiError('preferences_conflict', 409, latest.error ? undefined : { current: latest.data })
  }
  return error ? rpcError(error) : json(data)
}
