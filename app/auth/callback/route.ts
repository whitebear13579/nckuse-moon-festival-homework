import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DESTINATIONS = new Set(['/game', '/account', '/leaderboard', '/'])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = process.env.APP_ORIGIN ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!origin) return new Response('Site origin is not configured.', { status: 503 })
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/game'
  const destination = DESTINATIONS.has(next) ? next : '/game'
  if (code) {
    const client = await createClient()
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destination, origin))
  }
  return NextResponse.redirect(new URL('/login?error=oauth', origin))
}
