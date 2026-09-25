'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useState } from 'react'
import PixelSwap from '@/components/pixel-swap-source'
import { PixelScene } from '@/components/pixel-scene'
import { useSession } from '@/components/site-shell'

function LanternArt({ lit }: { lit: boolean }) {
  return (
    <div className={`preview-art ${lit ? 'preview-lit' : ''}`}>
      <span className="preview-hanger" />
      <span className="preview-lantern" />
      <span className="preview-reflection" />
    </div>
  )
}

export function HomeScreen() {
  const { me, reduced } = useSession()
  const [lit, setLit] = useState(false)
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="hero-overline">中秋限定 · 像素解謎</p>
          <motion.h1 initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>這個中秋，<br /><span>替月亮點燈。</span></motion.h1>
          <p className="hero-description">一盞燈，牽動四周。陪月兔解開三幅燈陣，讓夜空一格一格亮起來。</p>
          <div className="hero-actions">
            <Link className="pixel-button primary" href={me ? '/game' : '/login'}>{me ? '繼續點燈' : '開始點燈'}<span aria-hidden="true">→</span></Link>
            <Link className="text-link" href="/leaderboard">看看誰最快通關 <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="hero-caption">三道關卡 · 可隨時重玩 · 跨裝置接續</p>
        </div>
        <PixelScene />
      </section>
      <section className="preview-section" aria-labelledby="preview-heading">
        <div className="section-intro"><h2 id="preview-heading">先試點一盞</h2><p>這裡只是小小預覽，正式關卡在遊戲頁等你。</p></div>
        <div className="preview-layout">
          <button type="button" className="preview-button" onClick={() => setLit(value => !value)} aria-pressed={lit} aria-label={lit ? '熄滅預覽燈籠' : '點亮預覽燈籠'}>
            {reduced ? <LanternArt lit={lit} /> : <PixelSwap firstContent={<LanternArt lit={false} />} secondContent={<LanternArt lit />} active={lit} trigger="manual" pixelSize={26} duration={450} pixelDuration={180} pattern="center" aspectRatio="1 / 1" />}
          </button>
          <div className="preview-copy"><span className="little-star" aria-hidden="true">✦</span><h3>{lit ? '燈亮了，月兔也看見了。' : '點一下，讓夜色有了光。'}</h3><p>正式關卡中，每次點擊會一起切換自身與上下左右的燈。觀察、推理，把整片燈海點亮。</p><Link href="/game" className="text-link">前往遊戲 <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
      <section className="how-section" aria-labelledby="how-heading"><div className="section-intro"><h2 id="how-heading">三步，等月圓。</h2><p>規則簡單，亮起整片夜空需要一點巧思。</p></div><div className="how-grid"><div><strong>①</strong><h3>點一盞</h3><p>選一格燈，從這裡開始。</p></div><div><strong>②</strong><h3>連動四周</h3><p>上下左右也會一起明暗切換。</p></div><div><strong>③</strong><h3>全亮賞月</h3><p>每關全亮後，留下你的最快時間。</p></div></div></section>
    </>
  )
}
