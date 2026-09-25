import { authenticated, apiError, parseMutation, rpcError } from '@/lib/api'

export async function POST(request: Request) {
  const { client, userId } = await authenticated()
  if (!userId) return apiError('unauthorized', 401)
  const parsed = await parseMutation(request)
  if (parsed.response) return parsed.response
  const { error } = await client.auth.signOut()
  return error ? rpcError(error) : new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } })
}
