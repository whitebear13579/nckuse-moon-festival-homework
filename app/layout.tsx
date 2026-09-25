import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell'
import { FontLoader } from '@/components/font-loader'
import './globals.css'

export const metadata: Metadata = {
  title: '月兔點燈｜中秋像素解謎',
  description: '和月兔一起點亮中秋燈陣，挑戰三關最快通關榜。',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">跳到主要內容</a>
        <FontLoader />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
