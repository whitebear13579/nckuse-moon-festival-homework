import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url?.startsWith('http://127.0.0.1:')) throw new Error('Local Supabase required')
const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
const email = `smoke-${Date.now()}@example.test`
const { error: authError } = await client.auth.signUp({ email, password: 'SmokePassword123!' })
if (authError) throw authError
for (const [name, args] of [
  ['get_me', {}], ['get_preferences', {}], ['start_attempt', { p_stage: 1, p_restart: false }],
  ['get_leaderboard', { p_stage: 1 }],
]) {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(`${name}: ${error.message}`)
  if (!data) throw new Error(`${name}: empty response`)
  process.stdout.write(`${name}: ok\n`)
}
let { data: attempt, error: startError } = await client.rpc('start_attempt', { p_stage: 1, p_restart: false })
if (startError) throw startError
for (const cell of [0, 4]) {
  const result = await client.rpc('apply_move', {
    p_attempt_id: attempt.id,
    p_cell_index: cell,
    p_expected_revision: attempt.revision,
    p_request_id: crypto.randomUUID(),
  })
  if (result.error) throw new Error(`apply_move: ${result.error.message}`)
  attempt = result.data
}
if (attempt.status !== 'completed') throw new Error('Puzzle did not complete')
process.stdout.write('apply_move completion: ok\n')
const { data: best } = await client.rpc('get_me')
if (best.unlockedStage !== 2 || best.bests.length !== 1) throw new Error('Best/unlock missing')
process.stdout.write('best/unlock: ok\n')
