# Fuck My Shit Mountain Audit Report

**Project:** 月兔點燈 / moon-festival-homework  
**Audit mode:** full  
**Date:** 2026-09-25  
**Reviewer:** Codex (GPT-6)

---

## 1. Executive Summary

本專案以 Next.js 16 Route Handlers、Supabase Auth/Postgres 與資料庫函式構成清楚的信任邊界。盤面、計時、重送去重、關卡解鎖及排行榜均由資料庫裁決；瀏覽器只持有可重建的顯示狀態。隔離的本機 Supabase、pgTAP、Vitest、production build 與 Playwright 已由單一 `npm test` 指令通過，另有 lint、型別檢查及冷安裝驗證。

公開發布仍缺三項營運證據或能力：非最佳歷史回合與收據沒有清理期限；託管環境的 Google OAuth、字體與遷移權限只有人工 smoke check 計畫；後端錯誤沒有可查詢的請求關聯或告警。這些是局部風險，沒有證據顯示目前存在可偽造成績或跨帳號讀寫的缺陷。正式 Supabase、Vercel 和 Google 設定尚未接入，本報告不宣稱遠端環境已驗收。

### Score Dashboard

```text
Security        ████████░░  8.0  A   Auth、RLS、RPC 權限與輸入驗證有實測；遠端 OAuth 尚未驗證。
Stability       ███████░░░  7.0  A   交易與去重測試充分；服務故障缺可操作的告警訊號。
Performance     ███████░░░  7.0  A   榜單先限前 50 筆；歷史資料無保留期且缺正式 p95 數據。
Testing         ████████░░  8.0  A   真實 DB、API、瀏覽器路徑已測；託管整合仍待 smoke check。
Maintainability ████████░░  8.0  A   邊界、規格、測試及部署說明一致；資料保留尚未落地。
Design          ████████░░  8.0  A   狀態歸屬清楚，API 與資料庫雙層驗證；無系統性設計違例。
Release         ██████░░░░  6.0  B   CI 流程已寫，但外部憑證、遠端驗收與監測未完成。
─────────────────────────────────────
Overall         ███████░░░  7.4  A
```

### Finding Statistics

| Severity | Count | Confirmed | Suspected |
|----------|-------|-----------|-----------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 3 | 3 | 0 |
| Low | 0 | 0 | 0 |
| Info | 0 | 0 | 0 |
| **Total** | **3** | **3** | **0** |

## 2. Project Map

`app/` 提供首頁、登入、遊戲、榜單和帳號頁及 Route Handlers；`src/components/` 負責互動，`src/lib/` 放純遊戲邏輯、API 契約和 Supabase client。請求經 Next.js session/Origin/JSON 檢查進入 Postgres RPC；RPC 用 `auth.uid()`、鎖、唯一鍵和交易維護權威狀態。`profiles` 存暱稱與雲端偏好，`attempts` 存回合，`move_receipts` 去重，`stage_bests` 存排行榜。沒有 AI/model 呼叫，也沒有瀏覽器持久化遊戲資料。

發版路徑是 GitHub Actions 先驗證、再推 staging/production migration，最後 Vercel build/deploy。主要外部依賴是 Supabase、Google OAuth、Vercel 和 emfont；真正的發布風險位於這些服務的整合與營運訊號。

### Coverage Matrix

| Dimension | Coverage | Evidence inspected | Exclusions / limits |
|-----------|----------|--------------------|---------------------|
| Architecture | High | `app/`, `src/`, migration, SPEC | 無遠端流量資料 |
| Security | High | Auth、API validation、RLS/grants、pgTAP、`npm audit` | 未做滲透測試 |
| Stability | High | RPC 鎖與錯誤路徑、單元/整合/E2E | 未做故障注入的託管壓測 |
| Performance | Medium | SQL 索引/limit、CSS/資產、build | 無正式 LCP、p95 |
| Testing | High | `npm test`、測試檔、CI | Google 外部頁面未自動化 |
| Maintainability | High | TS/SQL 結構、README、SPEC | 無長期變更歷史 |
| Design | High | 模組邊界、API 契約、狀態歸屬 | 無團隊演化數據 |
| Release | Medium | workflow、Vercel 設定、README | 無託管憑證或部署執行 |
| Documentation | High | SPEC、README、第三方授權 | 遠端設定未實證 |
| Configuration | High | `.env.example`、workflow、Origin 判定 | 未讀取遠端 secret store |
| Observability | Medium | `rpcError`、workflow、README | 無遠端日誌/監控平台 |
| Data Integrity | High | migration、pgTAP、並發 E2E | 未做正式備份還原演練 |
| Privacy | Medium | 資料表/RLS、公開回應 | 未檢查託管服務保留政策 |
| Accessibility | High | 語意/焦點/CSS、Playwright、視覺檢查 | 無真人輔具測試 |
| Supply Chain | Medium | lockfile、`npm ci`、audit、授權 | 未產出 SBOM/簽章 |
| Cost | Medium | 表增長、API 頻率限制 | 無正式資費/用量 |
| AI / LLM Safety | Not assessed | 程式碼無 AI/model 呼叫 | 此版本沒有此表面 |
| Fallback | High | 字體逾時、API 錯誤/重試、reduced motion | 未測真實 CDN 故障 |
| Testing Authenticity | High | pgTAP 真 DB、production E2E、fixture | 無遠端 OAuth 自動化 |
| Type Safety | High | `tsc`、輸入與回應 guard | Supabase RPC JSON 仍為動態邊界 |
| Frontend State | High | SiteShell、GameScreen、AccountScreen | 未長時間 soak test |
| Backend API | High | Route Handlers、SQL 函式、API E2E | 無公開部署流量 |
| Dependency Weight | Medium | package/lockfile、建置 | 未測正式每路由傳輸量 |
| Code Consistency | High | TS/SQL 目錄與錯誤格式、lint | 無多人貢獻歷史 |
| Comment Coverage | High | 複雜鎖序、SPEC、README | 無既有維運回饋 |

## 3. Top Risks

1. **歷史回合與收據無保留期限（Medium）**：每次重玩及點擊都永久新增資料，流量累積後拖慢查詢與增加儲存成本。
2. **部署後整合驗收尚未自動形成發布門檻（Medium）**：CI 只能驗證本機 OAuth 替身及本機資料庫，遠端設定錯誤可在部署成功後才暴露。
3. **服務故障缺請求關聯與告警（Medium）**：503 只記錄錯誤碼，值班者難以知道受影響人數或定位哪個端點失敗。

## 4. Detailed Findings

### Finding: 歷史回合與去重收據持續增長

- Severity: Medium
- Confidence: High
- Category: Performance
- Status: Confirmed
- Affected area: Supabase `attempts`、`move_receipts`、排行榜資料庫
- Evidence:
  - File: `supabase/migrations/20260924000100_initial.sql:23-60,203-208,304-307`
  - Function / Module: `start_attempt`, `apply_move`
  - Relevant behavior: 每次新回合插入 `attempts`，每個有效點擊插入 `move_receipts`；migration 沒有保留期限或清理工作。
- Problem: 兩張歷史表的筆數隨遊玩次數單調增長；頻率限制只約束短時間寫入，並不限制總量。
- Why it matters: 長期儲存和索引體積上升，`start_attempt`/`apply_move` 的近期計數與歷史查詢成本會逐漸增加。
- Realistic failure scenario: 公開站累積大量重玩後，收據索引和回合歷史膨脹，資料庫費用增加，熱門時段點燈延遲升高。
- Minimal fix: 排程分批刪除過期非最佳回合及其收據；保留 `stage_bests.attempt_id` 指向的回合，先用 dry-run 計數核對。
- Better long-term fix: 定義可觀測的保留政策與分區/封存策略，依實際資料量和 p95 決定清理週期。
- Regression test suggestion: 建立舊非最佳、舊最佳及近期 active 回合 fixture，執行清理後證明只有前者消失、排行榜及去重窗口正常。
- Estimated effort: 0.5–1 day

### Finding: 遠端整合驗收仍是人工步驟

- Severity: Medium
- Confidence: High
- Category: Release
- Status: Confirmed
- Affected area: GitHub Actions 預覽/正式部署與 Google OAuth
- Evidence:
  - File: `.github/workflows/ci.yml:1-104`, `README.md:49-59`
  - Function / Module: `verify`, `preview`, `production` jobs
  - Relevant behavior: workflow 會跑本機測試與部署，但部署後沒有對 Vercel URL、Google 登入或實際 Supabase 專案的 smoke gate；README 要求人工檢查。
- Problem: migration/build 成功不代表 OAuth redirect、環境變數、emfont 或真實排行榜可用。
- Why it matters: 最重要的外部整合只在託管環境存在，現有 CI 成功訊號不足以代表可公開使用。
- Realistic failure scenario: Google redirect allow list 漏加正式網域，production deploy 成功，使用者卻無法登入遊戲。
- Minimal fix: 在 Preview/Production deploy 後以部署 URL 執行匿名頁/API smoke，並將 Google 登入及跨裝置檢查列為發布清單的實際簽核記錄。
- Better long-term fix: 具備隔離測試身分的 staging OAuth 冒煙測試與發布健康門檻；production 保留安全的人工 OAuth 驗收。
- Regression test suggestion: 用故意錯誤的 Preview Origin/redirect 設定測試發布門檻會失敗，正常設定可過。
- Estimated effort: 0.5–2 days（取決於託管憑證）

### Finding: RPC 故障缺可追蹤的營運訊號

- Severity: Medium
- Confidence: High
- Category: Stability
- Status: Confirmed
- Affected area: Route Handlers 與部署監控
- Evidence:
  - File: `src/lib/api.ts:28-34`, `.github/workflows/ci.yml:1-104`
  - Function / Module: `rpcError`, deploy jobs
  - Relevant behavior: 未知 Supabase 錯誤只輸出一個安全的資料庫錯誤碼；沒有 request ID、端點、延遲或告警規則。
- Problem: 正式服務可持續回 503，而現有程式與 workflow 沒有故障比例或可用性訊號。
- Why it matters: 不易區分單次網路錯誤與全站資料庫故障，也不易把使用者回報與伺服器日誌對應。
- Realistic failure scenario: Supabase 暫時不可用，遊戲操作與榜單開始失敗，但團隊直到使用者回報才發現。
- Minimal fix: 為 API 回應與結構化日誌加入非敏感 request ID、路由及錯誤類別，並對 5xx 比率設託管平台告警。
- Better long-term fix: 加入經驗證的健康探測、延遲分位數與操作手冊，追蹤資料庫依賴及發版版本。
- Regression test suggestion: 注入 RPC 503，驗證安全的 correlation ID 同時出現在回應 header 與日誌，且不洩漏 DB message 或個資。
- Estimated effort: 0.5–1 day

## 5. Architecture Concerns

- Coverage: High
- Inspected evidence: `app/`、`src/`、migration、SPEC 的資料流及模組邊界。
- Exclusions / limits: 無遠端流量或多版本遷移演練。
- 無額外結構性 finding。React 顯示狀態由頁面擁有，資料庫擁有正式進度與時間。

## 6. Security Concerns

- Coverage: High
- Inspected evidence: `src/lib/api.ts`、Route Handlers、Auth callback、RLS/grants、pgTAP 及 dependency audit。
- Exclusions / limits: 未做正式環境滲透測試或 Google provider 設定稽核。
- 無已確認高風險 finding；發布前仍需完成遠端 OAuth 驗收。

## 7. Stability Concerns

- Coverage: High
- Inspected evidence: RPC 交易、重送收據、timeout、錯誤回應與故障 E2E。
- Exclusions / limits: 未做真實託管故障注入。
- 對應 finding 3：服務故障缺可操作訊號。

## 8. Performance Concerns

- Coverage: Medium
- Inspected evidence: 榜單 SQL、索引、歷史寫入量、頁面資產及 production build。
- Exclusions / limits: 沒有真實 LCP、p95 或大規模資料集壓測。
- 對應 finding 1：歷史表增長尚未有保留政策。

## 9. Testing Gaps

- Coverage: High
- Inspected evidence: pgTAP、Vitest、Playwright、`scripts/test.mjs`、CI workflow。
- Exclusions / limits: 本機無法驗證 Google 和 Vercel 實際設定。
- 對應 finding 2；本機測試連真正的 Route Handlers 與 Postgres，並非只測 mock。

## 10. Maintainability Concerns

- Coverage: High
- Inspected evidence: 目錄結構、主要模組、lint/typecheck、README/SPEC。
- Exclusions / limits: 尚無長期多人維護資料。
- 無額外 finding；保留期應以獨立 migration 加入。

## 11. Design / Principles Concerns

- Coverage: High
- Inspected evidence: RPC/Route Handler 責任、純邏輯、前端狀態、錯誤格式。
- Exclusions / limits: 無未來功能變更樣本。
- 無系統性 SRP/DRY/YAGNI 問題；實際風險見 findings 1–3。

## 12. Release Concerns

- Coverage: Medium
- Inspected evidence: `.github/workflows/ci.yml`、`vercel.json`、README 部署步驟。
- Exclusions / limits: 沒有遠端 secrets，故不能執行 Preview/Production job。
- 對應 finding 2；migration 先於應用部署的順序已明確設定。

## 13. Documentation Analysis

- Coverage: High
- Inspected evidence: `docs/SPEC.md`、README、第三方授權、環境變數範例。
- Exclusions / limits: 遠端設定步驟尚未由真實部署驗證。
- 文件已揭露外部 smoke check 和資料增長風險，未發現與本機行為相反的關鍵說明。

## 14. Observability / Operability Analysis

- Coverage: Medium
- Inspected evidence: `rpcError`、Route Handlers、workflow、README。
- Exclusions / limits: 無遠端日誌或告警平台存取。
- 對應 finding 3：日誌只有錯誤碼，缺請求關聯、延遲及 5xx 告警。

## 15. Configuration Safety Analysis

- Coverage: High
- Inspected evidence: `.env.example`、`sameOrigin`、Auth callback、CI 環境分隔檢查。
- Exclusions / limits: 未檢查託管環境的實際值。
- 缺 Origin 時寫入拒絕、callback 回 503；沒有把 service-role key 放進應用設定。

## 16. Data Integrity Analysis

- Coverage: High
- Inspected evidence: migration、最佳成績唯一鍵、鎖序、去重收據、pgTAP/並發 E2E。
- Exclusions / limits: 未做正式備份還原演練。
- 最佳成績參照回合，所以 finding 1 的清理必須保護被參照資料。

## 17. Privacy / Data Governance Analysis

- Coverage: Medium
- Inspected evidence: profiles/attempts RLS、公開榜單欄位、Auth cookie 邊界。
- Exclusions / limits: 未查託管 Auth 日誌與供應商保留政策。
- 榜單僅顯示自選暱稱和成績；finding 1 同時影響歷史資料保留。

## 18. Accessibility / UX Correctness Analysis

- Coverage: High
- Inspected evidence: 原生按鈕/連結、焦點、320px 棋盤、reduced motion E2E、視覺檢查。
- Exclusions / limits: 無真人螢幕閱讀器測試。
- 沒有可重現的阻斷性問題；上線後宜收集實際輔具回饋。

## 19. Supply Chain / Reproducibility Analysis

- Coverage: Medium
- Inspected evidence: `package-lock.json`、`npm ci`、`npm audit --omit=dev --audit-level=high`、授權 notices。
- Exclusions / limits: 未驗證遠端建置產物簽章或 SBOM。
- 冷安裝及依賴稽核通過；無已確認的供應鏈 finding。

## 20. Cost / Resource Economics Analysis

- Coverage: Medium
- Inspected evidence: 表結構、寫入頻率限制、榜單 limit/快取。
- Exclusions / limits: 無實際 Supabase 配額和用量。
- 對應 finding 1；每次遊戲寫入及長期儲存是主要可變成本。

## 21. AI / LLM Safety Analysis

- Coverage: Not assessed
- Inspected evidence: 原始碼依賴與入口檔未見 AI/model 呼叫。
- Exclusions / limits: 此版本沒有 prompt、RAG 或工具呼叫表面。
- 無適用 finding。

## 22. Fallback / Defensive Code Analysis

- Coverage: High
- Inspected evidence: 字體失效回退、API 逾時/格式錯誤、GameScreen 重新同步。
- Exclusions / limits: 未模擬真實 CDN 長時間中斷。
- 回退保持遊戲資料由伺服器裁決，不把本地預覽當成正式成功。

## 23. Testing Authenticity Analysis

- Coverage: High
- Inspected evidence: SQL rollback fixture、本機真 Supabase、production Next 伺服器、Playwright 雙帳號。
- Exclusions / limits: 外部 Google/Vercel 不在可重現本機套件中。
- 有價值的測試涵蓋重送、越權、並發、前 50 排行與雲端偏好；finding 2 是主要外部信心缺口。

## 24. Type Safety Analysis

- Coverage: High
- Inspected evidence: `tsc --noEmit`、`isMe`/`isAttempt`、API validation。
- Exclusions / limits: RPC JSON 本質為執行時邊界，未產生資料庫型別碼。
- 關鍵前端回應有 runtime guard；未找到可重現的型別錯用。

## 25. Frontend State Analysis

- Coverage: High
- Inspected evidence: SiteShell、GameScreen、AccountScreen、錯誤及同步狀態。
- Exclusions / limits: 無長時間跨多裝置 soak test。
- 雲端 preference revision 避免舊回應覆寫較新值；遊戲操作失敗後會重新同步。

## 26. Backend API Analysis

- Coverage: High
- Inspected evidence: 全部 Route Handlers、`src/lib/api.ts`、RPC、API E2E。
- Exclusions / limits: 無正式環境流量及 p95。
- Origin、Content-Type、UUID、角色與資料庫 ownership 有測試；finding 3 影響故障定位。

## 27. Dependency Weight Analysis

- Coverage: Medium
- Inspected evidence: package/lockfile、build、React Bits 單一來源檔與 notices。
- Exclusions / limits: 未測正式路由的網路傳輸 gzip 大小。
- Motion 用於全站轉場，React Bits 只帶入一個元件；未找到明顯未用 runtime 依賴。

## 28. Code Consistency Analysis

- Coverage: High
- Inspected evidence: TS/SQL 目錄、API error mapping、lint、測試命名。
- Exclusions / limits: 無多人 PR 歷史。
- 無會導致誤用或維護事故的格式分裂。

## 29. Comment Coverage Analysis

- Coverage: High
- Inspected evidence: 複雜鎖序註解、函式命名、SPEC/README/API 契約。
- Exclusions / limits: 無長期維運回饋。
- 關鍵不直觀的 DB 鎖序有註解；沒有以註解掩蓋缺失的程式邏輯。

---

## 30. Principles Compliance

### Principles Violated

| Principle | Violations | Severity | Affected Areas |
|-----------|------------|----------|----------------|
| Bounded resource use / lifecycle ownership | 1 | Medium | 歷史 `attempts`、`move_receipts`（finding 1） |
| Observable failures / fail-fast operations | 1 | Medium | API 5xx 監測（finding 3） |

### Principles Respected

資料庫持有權威狀態，React 只顯示；SQL 函式集中原子規則，API 層做輸入與來源檢查；測試依可驗證行為而非 snapshot 編寫。沒有足以支持「大規模重寫」的證據。

## 31. Architecture Analysis

### Architecture Summary

| Subtype | Count | Affected Areas | Recommended Action |
|---------|-------|----------------|-------------------|
| ModuleBoundary | 0 | — | 保持分層 |
| DependencyDirection | 0 | — | 保持資料庫權威 |
| StateOwnership | 0 | — | 保持雲端唯一正式來源 |
| BoundaryContract | 0 | — | 維持 runtime guards |
| EvolutionRisk | 1 | 遠端整合發布 | 加入 smoke gate（finding 2） |

## 32. Documentation Analysis Summary

| Subtype | Count | Affected Docs | Recommended Action |
|---------|-------|---------------|-------------------|
| UserDocs | 0 | README | 無 |
| OperatorDocs | 1 | README 發布清單 | 實際記錄遠端 smoke 結果 |
| DeveloperDocs | 0 | SPEC/README | 無 |
| ApiDocs | 0 | SPEC | 無 |
| DecisionRecord | 0 | SPEC | 無 |
| StaleDocs | 0 | — | 無 |

## 33. Privacy / Data Governance Analysis Summary

| Subtype | Count | Affected Data | Recommended Action |
|---------|-------|---------------|-------------------|
| DataInventory | 0 | profiles/attempts/bests | 已在 SPEC 描述 |
| Minimization | 0 | 公開榜單 | 僅公開暱稱及成績 |
| AccessBoundary | 0 | RLS/RPC | 繼續以 pgTAP 驗證 |
| Retention | 1 | 歷史回合/收據 | 對應 finding 1 |
| Deletion | 0 | — | 本版本未設帳號刪除流程 |
| Export | 0 | — | 本版本未設匯出流程 |
| TelemetryPrivacy | 0 | RPC 日誌 | 加訊號時不得記錄 token/個資 |

## 34. Accessibility / UX Correctness Analysis Summary

| Subtype | Count | Affected Workflows | Recommended Action |
|---------|-------|-------------------|
| SemanticStructure | 0 | 遊戲/表單/榜單 | 維持原生控制 |
| KeyboardFocus | 0 | 導覽/點燈 | 維持 E2E |
| ResponsiveVisual | 0 | 320px 5×5 棋盤 | 維持視覺驗收 |
| ErrorState | 0 | API 故障 | 維持重試入口 |
| LoadingState | 0 | 帳號/遊戲 | 維持 pending disable |
| UXStateCorrectness | 0 | 跨裝置同步 | 維持 revision 檢查 |

## 35. Supply Chain / Reproducibility Analysis Summary

| Subtype | Count | Affected Surface | Recommended Action |
|---------|-------|------------------|-------------------|
| DependencyProvenance | 0 | npm lockfile/授權 | 維持鎖檔與 notices |
| Reproducibility | 0 | `npm ci` | CI 繼續冷安裝 |
| CIIntegrity | 0 | GitHub Actions | 環境 secret 保持分隔 |
| ArtifactProvenance | 0 | Vercel | 遠端部署後再審 |
| RegistryHygiene | 0 | npm | 本專案為 private app |

## 36. Cost / Resource Economics Analysis Summary

| Subtype | Count | Cost Driver | Recommended Action |
|---------|-------|-------------|-------------------|
| UnboundedWork | 1 | DB 歷史儲存 | finding 1 |
| ExternalApiCost | 0 | Supabase/Auth | 上線後量測 |
| LLMCost | 0 | 無 | 不適用 |
| InfrastructureSizing | 0 | Postgres | 上線後量測 |
| ObservabilityCost | 0 | 尚無監測 | 加入時設定保留期限 |
| CostVisibility | 0 | Supabase | 上線後設用量告警 |

## 37. AI / LLM Safety Analysis Summary

無模型、工具、RAG 或生成輸出表面；此維度不適用。

## 38. Observability / Operability Analysis Summary

| Subtype | Count | Critical Signals Missing | Recommended Action |
|---------|-------|--------------------------|-------------------|
| Logging | 1 | request ID/路由 | finding 3 |
| Metrics | 1 | 5xx 比率、延遲 | finding 3 |
| Tracing | 0 | — | 有流量後再評估 |
| HealthCheck | 1 | 部署後健康驗收 | finding 2 |
| Alerting | 1 | 5xx 告警 | finding 3 |
| Runbook | 0 | README 提供部署步驟 | 補事故處理步驟可後續做 |
| Debuggability | 1 | 回報與日誌對應 | finding 3 |

## 39. Configuration Safety Analysis Summary

Origin 缺失會拒絕寫入；Preview 與 Production DB project ref 分隔並在 workflow 檢查。實際託管值未驗證，屬 finding 2 的發布驗收範圍。

## 40. Data Integrity Analysis Summary

RPC 以單交易更新盤面與最佳成績，收據使相同 request ID 冪等；每人每版一個 active 受唯一索引約束。沒有正式備份還原實證，不能把本機 pgTAP 視為備份驗收。

## 41. Fallback / Defensive Code Analysis Summary

emfont 失敗時保留後備字體；網路逾時後用相同 request ID 重送並重新讀取權威進度。沒有把無回應默認為過關。

## 42. Testing Authenticity Analysis Summary

| Test Area | Real Confidence | Risk | Action |
|-----------|-----------------|------|--------|
| pgTAP SQL | High | 只在本機 Postgres | 保留 |
| Vitest 純函式 | High | 不代表外部服務 | 保留 |
| Playwright production server | High | 本機 Auth 測試帳號 | 保留 |
| Google/Vercel 實際整合 | None | 遠端設定錯誤 | finding 2 |

### Valuable Tests

重送去重、跨帳號拒絕、資料庫計時邊界、並發操作、排行榜 52 人前 50、跨裝置雲端偏好。

### Suspicious Tests

未見僅測 mock 本身或無意義 snapshot 的案例。

### Missing Tests

部署後真實 Google OAuth、預覽網域和遠端資料庫健康驗收。

## 43. Type Safety Analysis Summary

`isMe`、`isAttempt` 對伺服器 JSON 做執行時檢查；API 輸入也在 TS 與 SQL 兩層驗證。`requestJson<T>` 仍是泛型斷言，呼叫端必須維持 guards；目前主要遊戲/帳號路徑已補。

## 44. Frontend State Analysis Summary

首頁、遊戲、榜單、帳號分頁清楚；SiteShell 只保存 session/偏好顯示，GameScreen 重新同步後才接受正式進度。慢回應不應覆寫較高 preference revision。

## 45. Backend API Analysis Summary

API 使用一致的錯誤碼、Origin/JSON 檢查及 Supabase RPC；榜單公開且限前 50。未知 RPC 錯誤回安全 503，但要依 finding 3 補可操作的非敏感訊號。

## 46. Dependency Weight Analysis Summary

主要 runtime 依賴是 Next/React、Supabase SSR/JS、Motion；React Bits 僅複製 PixelSwap 來源與授權，避免整包引入。未測正式傳輸大小，因此效能分數有保留。

## 47. Recommended Fix Order

### Fix Immediately

沒有已確認的 Critical/High 問題。

### Fix Before Stable Release

執行 finding 2 的遠端驗收並留存結果；為 finding 3 建立最小 5xx 監測。兩者需要託管環境可用。

### Schedule Later

依流量落實 finding 1 的保留期，且測試最佳成績參照不受影響。

### Ignore for Now

沒有需要以大型重構處理的問題。

## 48. Quick Wins

1. 部署 job 輸出 Preview/Production URL 後立即 GET 首頁與榜單，失敗則標記 job 失敗。
2. 為 503 加 request ID 與結構化、去識別的路由錯誤日誌。
3. 用 SQL 查出各表過期筆數，建立資料增長基線，再制定清理門檻。

## 49. Long-term Refactor Plan

目前沒有支持全面重構的證據。資料量足夠後才決定歷史資料分區/封存；先用 migration 加保留任務並以 pgTAP 驗證參照完整性。
