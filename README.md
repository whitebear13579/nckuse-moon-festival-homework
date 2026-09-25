# 月兔點燈

中秋像素風燈陣解謎遊戲。   
玩家登入後依序挑戰三關；伺服器會儲存每一步、計時與各關最佳成績，公開排行榜顯示玩家自行設定的暱稱。首頁提供試點預覽，遊戲、排行榜與帳號各有獨立頁面。

## Demo
   
https://moon.coolyeah.eu.org

## Development
node.js >= 22、Docker Desktop 或相容 Docker 執行環境、npm。   
對於第一次安裝：
```bash
npm install
npm ci
npx supabase start
npx supabase status -o json
```
將根目錄下的 `.env.example` 複製成 `.env.local`，填入上一步輸出的 `API_URL` 和 `PUBLISHABLE_KEY`。   
本機 `APP_ORIGIN` 保持 `http://127.0.0.1:3000`。    
   
接著執行：   
```bash
npm run dev
```
或者你也可以：   
```
npm run build
npm start
```
此網頁應用程式會在 `http://127.0.0.1:3000` 執行。   
本專案採用 Google OAuth 進行登入。在本機環境若要進行登入，請參照 [supabase 官方文檔](https://supabase.com/docs/guides/auth/social-login/auth-google)配置 Google OAuth。

## Verify and Test
若您想在本地端進行 E2E 測試，請遵循以下步驟操作。   
對於第一次執行測試，請先執行：   
```bash
npx playwright install chromium
```

單一指令會建立獨立的本機 Supabase 測試 stack、套用 migration、跑 pgTAP、Vitest、Next.js production build，以及 Playwright 對頁面與真實 Route Handlers 的整合測試，結束後清理測試 stack。    
它不會重置開發資料庫，也不會連結遠端 Supabase 專案。   
```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## AI Tools
此專案使用 Codex（GPT-6 Sol / 極高）完成。

- 使用 [Ponytail](https://github.com/dietrichgebert/ponytail) SKILL 確保程式碼生成品質，不讓 AI 多考慮不合理的需求。   
- 使用 [Fuck My Shit Mountain](https://github.com/XiNian-dada/Fuck_My_Shit_Mountain) SKILL 來審計整個 Codebase 的工程品質與安全性。審計報告請查閱 [docs/audit-report.md](docs/audit-report.md)。
- 使用 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)、[impeccable](https://github.com/pbakaus/impeccable) SKILL 讓 AI 在進行 UI / UX 給予指引，減少整個 APP 的 AI 感。
- 使用 [Context 7](https://context7.com/) MCP Server 提供 Agents 能查閱所有套件的最新文檔。
   
另提供了 [Transitions.dev](https://github.com/Jakubantalik/transitions.dev)、[morphicons](https://github.com/guillermolg00/morphicons)、[React Bits](https://github.com/DavidHDev/react-bits) 提供給 Agents 做元件選擇與 UI / UX 參考，由 Agents 自行選擇是否使用。

## AI Failures

- [FAILURE-01](docs/FAILURE-01.md) - React 狀態管理問題
- [FAILURE-02](docs/FAILURE-02.md) - 排行榜與資料庫的權限問題
- [FAILURE-03](docs/FAILURE-03.md) - 帳號頁的部分欄位雲端同步不完整
- [FAILURE-04](docs/FAILURE-04.md) - 排行榜 API 異常時需有可理解的錯誤訊息
- [FAILURE-05](docs/FAILURE-05.md) - 測試時啟動隔離 Supabase 
- [FAILURE-06](docs/FAILURE-06.md) - dev 時受 test 環境的資料影響
- [FAILURE-07](docs/FAILURE-07.md) - E2E 測試時 Next.js dev server 與 HMR origin 不一致
- [FAILURE-08](docs/FAILURE-08.md) - supabase 上 Postgres 沒 migration ~~（這其實應該算我的鍋）~~

## Docs 
- [prompt](docs/prompt.md) - 詠唱咒語
- [prompt.optimized](docs/prompt.optimized.md) - 一樣是詠唱咒語，只不過這是經過 Gemini 優化後的版本。最後是拿這個版本去餵給 Codex 生成的
- [SPEC](docs/SPEC.md) - 產品與工程規格，由 Codex 生成
- [RETROSPECTIVE](docs/RETROSPECTIVE.md) - AI Collaboration Retrospective
- [FAILURE-XX] - AI Failure
- [audit-report.md](docs/audit-report.md) - 由 Fuck My Shit Mountain SKILL 生成的審計報告