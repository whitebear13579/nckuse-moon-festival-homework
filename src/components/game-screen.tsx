'use client'
/* eslint-disable react-hooks/purity -- Wall-clock reads happen in timer and request callbacks. */

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/components/site-shell'
import { isMe, isTimedAttempt, requestJson, type Attempt, type Me } from '@/lib/client-api'
import { formatTime, isLit, litCount, PUZZLES, toggleCell, type Stage } from '@/lib/game'
import { visibleElapsed } from '@/lib/timer'

const LABELS = ['初月', '望月', '滿月']

export function GameScreen() {
  const { reduced } = useSession()
  const [me, setMe] = useState<Me | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [serverNow, setServerNow] = useState('')
  const [receivedAt, setReceivedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [pending, setPending] = useState(false)
  const [previewMask, setPreviewMask] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const next = await requestJson<Me>('/api/me')
      if (!isMe(next)) throw new Error('進度資料格式不正確。')
      setMe(next)
      setAttempt(next.attempt)
      setServerNow(next.serverNow)
      setReceivedAt(Date.now())
      setPreviewMask(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '進度載入失敗，請重試。')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (attempt?.status !== 'active') return
    const timer = window.setInterval(() => setNow(Date.now()), 50)
    return () => window.clearInterval(timer)
  }, [attempt?.status])
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') void load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus) }
  }, [load])

  async function selectStage(stage: Stage) {
    if (pending || !me || stage > me.unlockedStage) return
    setPending(true); setError('')
    try {
      const next = await requestJson<Attempt>('/api/attempts', { method: 'POST', body: JSON.stringify({ stage }) })
      if (!isTimedAttempt(next)) throw new Error('關卡資料格式不正確，請重新同步。')
      setAttempt(next); setServerNow(next.server_now); setReceivedAt(Date.now())
      setPreviewMask(null)
    } catch (cause) {
      await load()
      setError(cause instanceof Error ? cause.message : '無法開啟關卡。')
    } finally { setPending(false) }
  }

  async function restart() {
    if (!attempt || pending) return
    setPending(true); setError('')
    try {
      const next = await requestJson<Attempt>(`/api/attempts/${attempt.id}/restart`, { method: 'POST', body: '{}' })
      if (!isTimedAttempt(next)) throw new Error('關卡資料格式不正確，請重新同步。')
      setAttempt(next); setServerNow(next.server_now); setReceivedAt(Date.now())
      setPreviewMask(null)
    } catch (cause) {
      await load()
      setError(cause instanceof Error ? cause.message : '無法重來本關。')
    } finally { setPending(false) }
  }

  async function move(cellIndex: number) {
    if (!attempt || attempt.status !== 'active' || pending) return
    const size = PUZZLES[attempt.stage as Stage].size
    const requestId = crypto.randomUUID()
    const body = JSON.stringify({ cellIndex, expectedRevision: attempt.revision, requestId })
    setPending(true); setError('')
    setPreviewMask(toggleCell(attempt.board_mask, size, cellIndex))
    try {
      let next: Attempt
      try {
        next = await requestJson<Attempt>(`/api/attempts/${attempt.id}/moves`, { method: 'POST', body })
      } catch (cause) {
        if (!(cause instanceof Error) || !('code' in cause) || cause.code !== 'network_error') throw cause
        next = await requestJson<Attempt>(`/api/attempts/${attempt.id}/moves`, { method: 'POST', body })
      }
      if (!isTimedAttempt(next)) throw new Error('點燈回應格式不正確，請重新同步。')
      if (next.revision < attempt.revision) throw new Error('伺服器進度較舊，請重新同步。')
      setAttempt(next); setServerNow(next.server_now); setReceivedAt(Date.now())
      setPreviewMask(null)
      if (next.status === 'completed') void load()
    } catch (cause) {
      setPreviewMask(null)
      await load()
      setError(cause instanceof Error ? cause.message : '操作失敗，請重新同步。')
    } finally { setPending(false) }
  }

  const stage = (attempt?.stage ?? 1) as Stage
  const size = PUZZLES[stage].size
  const mask = previewMask ?? attempt?.board_mask ?? PUZZLES[stage].initialMask
  const elapsed = attempt?.status === 'active'
    ? visibleElapsed(attempt.started_at, serverNow, receivedAt, now)
    : attempt?.elapsed_ms ?? 0
  const expiredByClock = attempt?.status === 'active' && elapsed >= 30 * 60_000

  return (
    <div className="page-shell game-page">
      <div className="page-heading"><div><p className="section-kicker">月兔的燈陣</p><h1>讓每一盞燈，<br />都找到月亮。</h1></div><Link href="/leaderboard" className="text-link">查看排行榜 ↗</Link></div>
      {loading ? <div className="status-panel" role="status">正在找回你的燈陣…</div> : !me ? <div className="status-panel"><p>{error || '無法載入進度。'}</p><button className="pixel-button secondary" onClick={() => void load()}>重新連線</button></div> : (
        <>
          <div className="stage-selector" aria-label="選擇關卡">{([1, 2, 3] as const).map(number => <button key={number} type="button" className={stage === number && attempt ? 'stage-tab selected' : 'stage-tab'} disabled={pending || Boolean(error) || number > me.unlockedStage} onClick={() => void selectStage(number)} aria-current={stage === number && attempt ? 'step' : undefined}><span>第 {number} 關</span><strong>{LABELS[number - 1]}</strong><small>{number > me.unlockedStage ? '尚未解鎖' : me.bests.find(best => best.stage === number) ? formatTime(me.bests.find(best => best.stage === number)!.elapsedMs) : '等待挑戰'}</small></button>)}</div>
          <div className="game-layout">
            <div className="board-panel">
              <div className="board-topline"><span>STAGE {String(stage).padStart(2, '0')} · {LABELS[stage - 1]}</span><span>{size} × {size}</span></div>
              {!attempt ? <div className="board-empty"><p>先選一關，點亮今夜第一盞燈。</p><button className="pixel-button primary" disabled={pending} onClick={() => void selectStage(1)}>開始第 1 關</button></div> : <div className="lantern-board" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} aria-label={`第 ${stage} 關燈陣`}>{Array.from({ length: size * size }, (_, cell) => <motion.button key={`${attempt.id}-${cell}`} type="button" className={`lantern-cell ${isLit(mask, cell) ? 'lit' : 'dim'}`} aria-label={`第 ${Math.floor(cell / size) + 1} 列第 ${cell % size + 1} 行，${isLit(mask, cell) ? '亮' : '暗'}`} aria-pressed={isLit(mask, cell)} disabled={pending || Boolean(error) || attempt.status !== 'active' || expiredByClock} onClick={() => void move(cell)} whileTap={reduced ? undefined : { scale: 0.88 }} animate={reduced ? undefined : { scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}><span className="cell-glow" /><span className="cell-body" /><span className="cell-tassel" /></motion.button>)}</div>}
              <div className="board-bottomline">點一格，自己與四周會一起切換。</div>
            </div>
            <aside className="game-sidebar">
              <div className="timer-card"><span className="metric-label">本回合時間</span><strong className="timer-display" aria-live="off">{formatTime(elapsed)}</strong><span className="metric-note">伺服器計時 · 不因離開頁面暫停</span></div>
              <div className="stat-row"><div><span className="metric-label">步數</span><strong>{attempt?.moves ?? 0}<small> / 999</small></strong></div><div><span className="metric-label">亮燈</span><strong>{litCount(mask, size)}<small> / {size * size}</small></strong></div></div>
              <AnimatePresence mode="wait"><motion.div key={attempt?.status ?? 'ready'} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} className="game-message" aria-live="polite">{attempt?.status === 'completed' ? <><h2>{stage === 3 ? '滿月，亮起來了。' : '這一關，亮起來了。'}</h2><p>通關時間 {formatTime(attempt.elapsed_ms ?? elapsed)}。月兔記住了你的光。</p>{stage < 3 ? <button className="pixel-button primary" disabled={pending} onClick={() => void selectStage((stage + 1) as Stage)}>挑戰下一關 →</button> : <button className="pixel-button primary" disabled={pending} onClick={() => void selectStage(1)}>再玩一輪 →</button>}</> : expiredByClock || attempt?.status === 'expired' ? <><h2>燈火暫歇。</h2><p>本回合已逾時，重新開始即可再挑戰。</p></> : <><h2>觀察燈影，慢慢點亮。</h2><p>每一步都會即時保存。全亮後，時間會登上你的個人成績。</p></>}</motion.div></AnimatePresence>
              {attempt && <button className="pixel-button secondary" type="button" disabled={pending || Boolean(error)} onClick={() => void restart()}>重來本關</button>}
              {error && <p className="inline-error" role="alert">{error} <button type="button" onClick={() => void load()}>重新同步</button></p>}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
