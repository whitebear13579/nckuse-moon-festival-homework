## Incident

### 我想要什麼

讓 Playwright 在自動化測試中穩定啟動 Next.js 並操作遊戲頁面。

### AI 做了什麼

初版 E2E 執行方式使用 dev server，測試網址與 HMR origin 不一致。

### 我怎麼發現

Next.js 顯示 cross-origin `/_next/hmr` 被阻擋，之後 Playwright 等不到遊戲按鈕而 timeout。

### 怎麼解決

測試 runner 改成先 `next build`，再用 `next start -H 127.0.0.1`，並統一 `APP_ORIGIN` 與 Playwright base URL。
