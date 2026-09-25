# 月兔點燈

中秋像素風燈陣解謎遊戲。玩家登入後依序挑戰三關；伺服器保存每一步、計時與各關最佳成績，公開排行榜顯示玩家自行設定的暱稱。首頁提供試點預覽，遊戲、排行榜與帳號各有獨立頁面。

詳細規則、資料模型與可驗收條件見 [產品與工程規格](docs/SPEC.md)。工程檢查與待處理的託管環境風險見 [審計報告](audit-report-moon-festival-homework-2026-09-25.md)。第三方元件的授權見 [THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md)。

## 本機啟動

需要 Node.js 22、Docker Desktop 或相容 Docker 執行環境、npm。第一次安裝：

```powershell
npm ci
npx supabase start
npx supabase status -o json
```

將 `.env.example` 複製成 `.env.local`，填入上一步輸出的 `API_URL` 和 `PUBLISHABLE_KEY`。本機 `APP_ORIGIN` 保持 `http://127.0.0.1:3000`。不要將 `.env.local` 或 Supabase 的 secret/service-role key 提交至 Git。接著執行：

```powershell
npm run dev
```

開啟 `http://127.0.0.1:3000`。正式玩家登入採 Google OAuth；本機若要測 Google 登入，需依 [Supabase Google Auth 文件](https://supabase.com/docs/guides/auth/social-login/auth-google) 在 Google Cloud 與本機 Supabase Auth 設定 OAuth Client、允許的 redirect URL。測試會在隔離的本機 Supabase stack 建立測試帳號，無須 Google 憑證。

## 驗證

第一次執行瀏覽器測試前：

```powershell
npx playwright install chromium
```

單一指令會建立獨立的本機 Supabase 測試 stack、套用 migration、跑 pgTAP、Vitest、Next.js production build，以及 Playwright 對頁面與真實 Route Handlers 的整合測試，結束後清理測試 stack。它不會 reset 開發資料庫，也不會連結遠端 Supabase 專案。

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

若只需快速檢查純邏輯，可用 `npm run test:unit`。`npm run test:db` 則針對目前本機 Supabase stack 執行 pgTAP。

## 託管環境

正式與預覽環境分別建立 Supabase 專案，並在各專案啟用 Google provider。將 Google Cloud OAuth Client 的 redirect URI 設為 Supabase Dashboard 提供的 callback，並將站點的 `/auth/callback` 加進 Supabase Auth Redirect URLs。預覽環境需允許對應的 Vercel 預覽網域；正式環境使用固定網域。兩環境資料、Google Client Secret 和 DB 密碼分離。

Vercel 專案使用 Next.js、Node.js 22。將 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 分別填入 Preview 與 Production 環境。Production 另外設定 `APP_ORIGIN=https://<正式網域>`；Preview 留空，使用 Vercel 提供的 `VERCEL_URL`。不要在 Vercel 設定 Supabase secret/service-role key。`vercel.json` 關閉 Git 自動部署，以便 CI 先套用 migration 再部署應用。

GitHub Actions 所需設定：

| 位置 | 名稱 | 用途 |
| --- | --- | --- |
| Repository secrets | `SUPABASE_ACCESS_TOKEN`、`SUPABASE_DB_PASSWORD_STAGING`、`SUPABASE_DB_PASSWORD_PRODUCTION` | Supabase CLI 遷移 |
| Repository variables | `SUPABASE_PROJECT_ID_STAGING`、`SUPABASE_PROJECT_ID_PRODUCTION` | 兩個不同的 Supabase project ref |
| Repository secrets | `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` | Vercel CLI 發佈 |
| GitHub environment | `production` | 建議設定核准與 branch 限制 |

PR 與 `main` 的 CI 都會跑單一測試指令、lint、typecheck、build。來自本 repo 的 PR 經 CI 成功後，部署工作以序列化鎖先更新 staging schema，再建立 Vercel Preview；`main` 通過後同樣先更新 production schema 再發佈正式版。共用 staging 不適合同時驗收互不相容的 schema PR；此時請使用各 PR 專屬 Supabase preview branch。首次啟用 CI 前，需在 Vercel Dashboard 關閉自動 Git 部署並填妥環境變數、在 Supabase Dashboard 設定 redirect allow list。部署後仍需真人走一次 Google OAuth、跨裝置續玩／偏好、三關與排行榜的 smoke check。

## 技術邊界

遊戲與偏好資料只存在 Supabase Postgres；網站不使用 `localStorage` 或 `sessionStorage`。瀏覽器計時器僅負責顯示，最終成績以資料庫時間及經驗證的盤面為準。公開榜單只顯示暱稱、時間、步數與名次。緩存最多 15 秒，改名後可能稍晚出現在榜單。
