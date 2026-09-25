'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/components/site-shell'
import { requestJson } from '@/lib/client-api'
import { formatTime, type Stage } from '@/lib/game'

interface Entry { rank: number; nickname: string; elapsedMs: number; moves: number }
interface Board { stage: number; entries: Entry[]; updatedAt: string }

function isBoard(value: unknown): value is Board {
  if (!value || typeof value !== 'object') return false
  const board = value as Partial<Board>
  return [1, 2, 3].includes(Number(board.stage)) && Array.isArray(board.entries)
    && board.entries.every(entry => entry && typeof entry.nickname === 'string'
      && Number.isSafeInteger(entry.rank) && entry.rank > 0
      && Number.isSafeInteger(entry.elapsedMs) && entry.elapsedMs > 0
      && Number.isSafeInteger(entry.moves) && entry.moves > 0)
    && typeof board.updatedAt === 'string' && Number.isFinite(Date.parse(board.updatedAt))
}

export function LeaderboardScreen() {
  const { me, reduced } = useSession()
  const [stage, setStage] = useState<Stage>(1)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await requestJson<Board>(`/api/leaderboard?stage=${stage}`)
      if (!isBoard(data) || data.stage !== stage) throw new Error('榜單資料格式不正確。')
      setBoard(data)
    } catch (cause) {
      setBoard(null)
      setError(cause instanceof Error ? cause.message : '排行榜無法載入。')
    } finally { setLoading(false) }
  }, [stage])
  useEffect(() => { void load() }, [load])
  const myBest = me?.bests.find(best => best.stage === stage)
  return <div className="page-shell leaderboard-page"><div className="page-heading"><div><p className="section-kicker">一起追上月光</p><h1>最快點燈的人，會被月亮記住。</h1><p>每一關只記錄玩家最好的已驗證成績。</p></div><div className="rank-decoration" aria-hidden="true">★</div></div><div className="leaderboard-layout"><section className="leaderboard-main" aria-label="各關排行榜"><div className="leaderboard-tabs" role="tablist" aria-label="選擇排行榜關卡">{([1, 2, 3] as const).map(number => <button key={number} type="button" role="tab" aria-selected={stage === number} className={stage === number ? 'selected' : ''} onClick={() => setStage(number)}>第 {number} 關<span>{['初月', '望月', '滿月'][number - 1]}</span></button>)}</div><div className="leaderboard-table"><div className="rank-head"><span>名次</span><span>玩家</span><span>時間</span><span>步數</span></div>{loading ? <div className="status-panel" role="status">正在讀取月光紀錄…</div> : error ? <div className="status-panel"><p role="alert">{error}</p><button className="pixel-button secondary" onClick={() => void load()}>再試一次</button></div> : board?.entries.length ? <AnimatePresence mode="wait"><motion.ol key={stage} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>{board.entries.map(entry => <li className={entry.rank <= 3 ? 'top-rank' : ''} key={entry.rank}><span className="rank-number">{String(entry.rank).padStart(2, '0')}</span><span className="rank-name">{entry.nickname}</span><strong>{formatTime(entry.elapsedMs)}</strong><span>{entry.moves}</span></li>)}</motion.ol></AnimatePresence> : <div className="status-panel">這一關還沒有通關紀錄。來成為第一位點亮的人！</div>}</div></section><aside className="personal-rank"><span className="metric-label">你的第 {stage} 關成績</span>{myBest ? <><strong className="personal-time">{formatTime(myBest.elapsedMs)}</strong><p>目前第 {myBest.rank} 名 · {myBest.moves} 步</p></> : <><strong>等待第一道光</strong><p>{me ? '完成這一關後，這裡會顯示你的最佳時間。' : '登入並完成關卡，就能和大家一起排行。'}</p></>}<a href="/game" className="pixel-button primary">前往挑戰 →</a></aside></div></div>
}
