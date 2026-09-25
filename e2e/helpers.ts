import { createServerClient } from '@supabase/ssr'
import type { BrowserContext } from '@playwright/test'

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export async function createPlayer(context: BrowserContext, email?: string) {
  if (!url?.startsWith('http://127.0.0.1:')) throw new Error('E2E tests require local Supabase')
  const cookies = new Map<string, { name: string; value: string }>()
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => Array.from(cookies.values()),
      setAll(items) { for (const item of items) cookies.set(item.name, { name: item.name, value: item.value }) },
    },
  })
  const address = email ?? `player-${crypto.randomUUID()}@example.test`
  const { error } = email
    ? await client.auth.signInWithPassword({ email: address, password: 'TestPassword123!' })
    : await client.auth.signUp({ email: address, password: 'TestPassword123!' })
  if (error) throw error
  await context.addCookies(Array.from(cookies.values()).map(cookie => ({ ...cookie, url: origin, sameSite: 'Lax' as const })))
  return { email: address, client }
}
