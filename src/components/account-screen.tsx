'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from '@/components/site-shell'
import { ApiClientError, requestJson } from '@/lib/client-api'
import { formatTime } from '@/lib/game'
import { validateNickname } from '@/lib/nickname'

export function AccountScreen() {
  const router = useRouter()
  const { me, loading, profileError, preferences, preferencesError, refreshMe, refreshPreferences, savePreference, reduced } = useSession()
  const [draftNickname, setDraftNickname] = useState<string | null>(null)
  const [pendingName, setPendingName] = useState(false)
  const [pendingPreference, setPendingPreference] = useState(false)
  const [nameMessage, setNameMessage] = useState('')
  const [preferenceMessage, setPreferenceMessage] = useState('')
  const nickname = draftNickname ?? me?.nickname ?? ''

  async function saveName() {
    const checked = validateNickname(nickname)
    if (checked.error) { setNameMessage(checked.error === 'nickname_reserved' ? '這個名稱已保留。' : '請用 2–12 個中文字、英文字母、數字、- 或 _，並至少包含一個文字。'); return }
    setPendingName(true); setNameMessage('')
    try {
      await requestJson('/api/me/nickname', { method: 'PUT', body: JSON.stringify({ nickname: checked.nickname }) })
      if (!await refreshMe()) throw new Error('暱稱可能已儲存，但目前無法確認雲端資料；請重新連線。')
      setDraftNickname(null)
      setNameMessage('暱稱已更新，排行榜會在 15 秒內顯示新名稱。')
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === 'network_error') {
        const synced = await refreshMe()
        setNameMessage(synced ? '連線中斷，已重新讀取雲端資料；請確認目前名稱。' : '連線中斷，暫時無法確認暱稱是否已儲存；請重新連線。')
      } else setNameMessage(cause instanceof Error ? cause.message : '暱稱儲存失敗。')
    } finally { setPendingName(false) }
  }

  async function saveMotion(value: boolean) {
    setPendingPreference(true); setPreferenceMessage('')
    try {
      await savePreference(value)
      setPreferenceMessage('偏好已同步到雲端。')
    } catch (cause) {
      if (cause instanceof ApiClientError && (cause.code === 'preferences_conflict' || cause.code === 'network_error')) await refreshPreferences()
      setPreferenceMessage(cause instanceof Error ? cause.message : '偏好儲存失敗，請重試。')
    } finally { setPendingPreference(false) }
  }

  async function signOut() {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (!response.ok) throw new Error('登出失敗，請重試。')
      router.push('/')
      router.refresh()
      await refreshMe()
    } catch { setNameMessage('登出失敗，請重試。') }
  }

  if (loading || !me) return (
    <div className="page-shell"><div className="status-panel">
      {loading ? '正在讀取帳號…' : <><p>{profileError || '帳號資料無法載入。'}</p><button className="pixel-button secondary" onClick={() => void refreshMe()}>重新連線</button></>}
    </div></div>
  )

  return (
    <div className="page-shell account-page">
      <div className="page-heading"><div><p className="section-kicker">月兔的旅行手帳</p><h1>你的燈火，會一直在。</h1></div></div>
      {profileError && <p className="inline-error" role="status">{profileError} <button type="button" onClick={() => void refreshMe()}>重新同步</button></p>}
      <div className="account-layout">
        <section className="account-card">
          <div className="card-heading"><span className="pixel-diamond" aria-hidden="true" /><div><h2>公開暱稱</h2><p>排行榜會顯示這個名字。請勿使用真名或聯絡資訊。</p></div></div>
          <label htmlFor="nickname">暱稱</label>
          <div className="nickname-control">
            <input id="nickname" value={nickname} maxLength={24} aria-describedby="nickname-help" onChange={event => setDraftNickname(event.target.value)} />
            <button className="pixel-button primary" type="button" disabled={pendingName} onClick={() => void saveName()}>{pendingName ? '儲存中…' : '儲存暱稱'}</button>
          </div>
          <p id="nickname-help" className="form-help">2–12 字；可用中文字、英文字母、數字、- 和 _。改名後需等 30 秒。</p>
          {nameMessage && <p className={nameMessage.includes('已更新') ? 'inline-success' : 'inline-error'} role="status">{nameMessage}</p>}
          <button type="button" className="text-button" onClick={() => { setDraftNickname(null); setNameMessage('') }}>取消修改</button>
        </section>
        <section className="account-card">
          <div className="card-heading"><span className="pixel-diamond jade" aria-hidden="true" /><div><h2>動畫偏好</h2><p>這項設定存在雲端，其他裝置也會同步。</p></div></div>
          <label className="toggle-line"><span><strong>減少動畫</strong><small>將過場與格點動態改為立即呈現</small></span><input type="checkbox" checked={preferences?.reduceMotion ?? false} disabled={!preferences || pendingPreference} onChange={event => void saveMotion(event.target.checked)} /></label>
          {reduced && !preferences?.reduceMotion && <p className="form-help">目前已依裝置設定減少動畫。</p>}
          {preferenceMessage && <p className={preferenceMessage.includes('已同步') ? 'inline-success' : 'inline-error'} role="status">{preferenceMessage}</p>}
          {preferencesError && <p className="inline-error" role="status">{preferencesError} <button type="button" onClick={() => void refreshPreferences()}>重新同步</button></p>}
        </section>
        <section className="account-card record-card">
          <div className="card-heading"><span className="pixel-diamond gold" aria-hidden="true" /><div><h2>個人最佳</h2><p>每一關只保留你最快的一次。</p></div></div>
          <div className="record-list">{([1, 2, 3] as const).map(stage => {
            const best = me.bests.find(item => item.stage === stage)
            return <div key={stage}><span>第 {stage} 關</span><strong>{best ? formatTime(best.elapsedMs) : '尚未通關'}</strong><small>{best ? `第 ${best.rank} 名` : '等你來點亮'}</small></div>
          })}</div>
        </section>
      </div>
      <button className="text-button signout" type="button" onClick={() => void signOut()}>登出帳號 →</button>
    </div>
  )
}
