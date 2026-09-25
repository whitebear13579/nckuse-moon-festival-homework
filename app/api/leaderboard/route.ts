import { apiError, json, rpcError } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { isStage } from '@/lib/game'

export async function GET(request: Request) {
  const stage = Number(new URL(request.url).searchParams.get('stage'))
  if (!isStage(stage)) return apiError('stage_invalid', 422)
  const client = await createClient()
  const { data, error } = await client.rpc('get_leaderboard', { p_stage: stage })
  return error ? rpcError(error) : json(data, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=15' })
}
