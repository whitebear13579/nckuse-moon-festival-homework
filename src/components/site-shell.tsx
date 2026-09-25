'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { isMe, requestJson, type Me, type Preferences } from '@/lib/client-api'
import { shouldReduceMotion } from '@/lib/cloud-preferences'

interface SessionContextValue {
  me: Me | null
  loading: boolean
  profileError: string
  reduced: boolean
  preferences: Preferences | null
  preferencesError: string
  refreshMe: () => Promise<boolean>
  refreshPreferences: () => Promise<void>
  savePreference: (value: boolean) => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('SessionProvider missing')
  return context
}

function useSystemReduced() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const systemReduced = useSystemReduced()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [preferencesError, setPreferencesError] = useState('')

  const refreshMe = useCallback(async () => {
    try {
      const next = await requestJson<Me>('/api/me')
      if (!isMe(next)) throw new Error('帳號資料格式不正確。')
      setMe(next)
      setProfileError('')
      setPreferences(current => current && current.revision > next.preferencesRevision
        ? current : { reduceMotion: next.reduceMotion, revision: next.preferencesRevision, updatedAt: null })
      setPreferencesError('')
      return true
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        setMe(null)
        setPreferences(null)
        setProfileError('')
      } else setProfileError('帳號資料同步中斷；請重新連線。')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPreferences = useCallback(async () => {
    if (!me) return
    try {
      const next = await requestJson<Preferences>('/api/me/preferences')
      if (typeof next.reduceMotion !== 'boolean' || !Number.isInteger(next.revision)) throw new Error('Invalid preference')
      setPreferences(current => current && current.revision > next.revision ? current : next)
      setPreferencesError('')
    } catch {
      setPreferencesError('偏好同步中斷；目前顯示最後確認的設定。')
    }
  }, [me])

  const savePreference = useCallback(async (value: boolean) => {
    if (!preferences) throw new Error('偏好尚未載入。')
    const next = await requestJson<Preferences>('/api/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ reduceMotion: value, expectedRevision: preferences.revision }),
    })
    if (typeof next.reduceMotion !== 'boolean' || !Number.isInteger(next.revision)) throw new Error('偏好回應格式不正確。')
    setPreferences(current => current && current.revision > next.revision ? current : next)
    setPreferencesError('')
  }, [preferences])

  useEffect(() => { void refreshMe() }, [pathname, refreshMe])
  useEffect(() => { if (me) void refreshPreferences() }, [pathname, me, refreshPreferences])
  useEffect(() => {
    if (!me) return
    const onFocus = () => { if (document.visibilityState === 'visible') void refreshPreferences() }
    const timer = window.setInterval(onFocus, 30_000)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [me, refreshPreferences])

  const reduced = shouldReduceMotion(systemReduced, preferences?.reduceMotion ?? (me || loading ? null : false))
  return (
    <SessionContext.Provider value={{ me, loading, profileError, reduced, preferences, preferencesError, refreshMe, refreshPreferences, savePreference }}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
        <div className="site-wrap" data-reduced={reduced}>
          <header className="site-header">
            <Link href="/" className="wordmark" aria-label="月兔點燈首頁"><span className="wordmark-mark" aria-hidden="true">▦</span> 月兔點燈</Link>
            <nav aria-label="主選單" className="site-nav">
              <Link className={pathname === '/' ? 'current' : ''} href="/">首頁</Link>
              <Link className={pathname === '/game' ? 'current' : ''} href="/game">遊戲</Link>
              <Link className={pathname === '/leaderboard' ? 'current' : ''} href="/leaderboard">排行榜</Link>
              <Link className={pathname === '/account' ? 'current' : ''} href={me ? '/account' : '/login'}>{me ? '我的帳號' : '登入'}</Link>
            </nav>
          </header>
          <motion.div key={`moon-wipe-${pathname}`} className="moon-wipe" aria-hidden="true"
            initial={reduced ? false : { clipPath: 'inset(0 0 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 100%)' }}
            transition={{ duration: reduced ? 0 : 0.46, ease: 'easeOut' }} />
          <AnimatePresence mode="wait">
            <motion.main key={pathname} id="main-content" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduced ? 0 : 0.28, ease: 'easeOut' }}>
              {children}
            </motion.main>
          </AnimatePresence>
          <footer className="site-footer"><span>中秋夜，點一盞燈。</span><span>月兔點燈 · Pixel Moon Festival</span></footer>
        </div>
      </MotionConfig>
    </SessionContext.Provider>
  )
}
