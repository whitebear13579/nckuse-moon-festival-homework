import { authenticated, apiError, json, rpcError } from '@/lib/api'

export async function GET() {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const { data, error } = await client.rpc('get_me')
  return error ? rpcError(error) : json(data)
}
