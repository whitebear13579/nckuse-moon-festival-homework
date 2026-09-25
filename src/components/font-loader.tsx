'use client'

import { useEffect } from 'react'

export function FontLoader() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://font.emtech.cc/css/Cubic11/400'
    let settled = false
    const timer = window.setTimeout(() => { if (!settled) { settled = true; link.remove() } }, 1500)
    link.onload = async () => {
      try {
        const faces = await document.fonts.load('16px Cubic11', '中秋月兔點燈')
        if (!settled && faces.length) {
          settled = true
          window.clearTimeout(timer)
          document.documentElement.classList.add('font-ready')
        }
      } catch { /* System font stays visible. */ }
    }
    link.onerror = () => { settled = true; window.clearTimeout(timer); link.remove() }
    document.head.appendChild(link)
    return () => { window.clearTimeout(timer); link.remove() }
  }, [])
  return null
}
