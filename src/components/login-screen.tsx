'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PixelScene } from '@/components/pixel-scene'
import { createClient } from '@/lib/supabase/client'

export function LoginScreen() {
  const search = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(search.get('error') ? '登入未完成，請再試一次。' : '')
  const allowed = new Set(['/game', '/account', '/leaderboard', '/'])
  const next = allowed.has(search.get('next') ?? '') ? search.get('next')! : '/game'

  async function signIn() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setError('尚未設定 Supabase 連線，請先完成部署設定。')
      return
    }
    setPending(true); setError('')
    try {
      const client = createClient()
      const { error: authError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (authError) throw authError
    } catch {
      setError('Google 登入暫時無法使用，請重試。')
      setPending(false)
    }
  }

  return <div className="page-shell login-layout"><div className="login-copy"><p className="section-kicker">你的燈火，會一直在這裡</p><h1>登入，今晚一起賞月。</h1><p>用 Google 登入後，燈陣進度、最快成績和偏好設定都會安全保存在雲端，換裝置也能繼續。</p><button className="pixel-button primary" type="button" disabled={pending} onClick={() => void signIn()}>{pending ? '正在前往 Google…' : '使用 Google 登入 →'}</button>{error && <p className="inline-error" role="alert">{error}</p>}<Link className="text-link" href="/">先回首頁看看</Link></div><PixelScene compact /></div>
}
