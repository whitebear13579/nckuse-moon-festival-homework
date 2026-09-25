# 月兔點燈｜產品與工程規格

> 狀態：**已確認；本機實作與自動化測試完成，託管環境待設定與驗收**
> 更新：2026-09-25
> 範圍：本文件為第一版交付與驗收依據；本機實作、測試與工程審計已完成。

## 1. 要做什麼

### 一句話概念

在中秋夜幫月兔點亮三幅像素燈陣：每按一盞燈，自己與上下左右的燈會切換；登入的玩家用伺服器計時的成績，挑戰各關最快通關榜。

產品名稱暫定 **「月兔點燈」**。目標使用者是想在中秋節透過手機或桌機玩 3–8 分鐘解謎，並與朋友比較各關通關時間的人。首頁介紹世界與玩法；登入後進入獨立遊戲頁。公開排行榜讓未登入訪客也能看見各關最快成績。

**核心迴圈**：觀察燈陣 → 點一格，看自身與正交鄰格翻轉、步數與計時器更新 → 逐步解到全亮 → 伺服器確認通關、回傳時間與個人最佳 → 看排行榜並挑戰下一關或重試。選這個構想，是因為規則容易理解但有推理空間；燈陣、月兔、月亮與山影很適合像素風；三關可完整做出動畫敘事；固定題目讓各玩家可比較同一關。

### 已固定需求與本版假設

- 固定：中秋節、Pixel Art、Next.js 16、Tailwind CSS、TypeScript、完整測試；本次增加後端帳號、伺服器存檔、計時器與各關排行榜。
- 路由：首頁 `/`、登入頁 `/login`、遊戲頁 `/game`、排行榜 `/leaderboard`、帳號頁 `/account`。首頁與排行榜公開；正式遊戲與帳號頁須登入。
- 帳號先支援 **Google 登入**（透過 Supabase Auth），一個 Google 帳號對應一位玩家；首登由伺服器產生預設暱稱，例如「月兔-7A3F9C2D」。使用者可在帳號頁自訂並再次修改暱稱；排行榜只顯示目前暱稱，不自動公開 Google 姓名或電子郵件。
- 三關對所有玩家使用相同、固定版本的盤面。玩家可不限次數重玩；每關每人只有一筆最佳時間列入榜單。更換題目要增加 `puzzle_version`，新舊榜單分開。
- 沒有暫停鍵。開始後計時在伺服器持續，關頁、切分頁、登出或斷網不暫停；單次嘗試最長 30 分鐘。伺服器收到合法最後一步才停止計時。
- 所有帳號偏好與遊戲資料均以後端為權威來源；網站不讀寫 `localStorage` 或 `sessionStorage`。Supabase Auth cookie 只用於登入 session。未登入訪客沒有可跨裝置保存的站內偏好，動畫依作業系統 `prefers-reduced-motion`。

## 2. 主要功能與優先順序

| 優先 | 功能 | 結果 |
| --- | --- | --- |
| P0 | 首頁與導覽 | `/` 有像素夜景、玩法三步、React Bits 點燈預覽與明確的登入／繼續遊戲入口。 |
| P0 | 帳號與暱稱 | Google OAuth 登入、可持續的 cookie session、可編輯的公開暱稱、登出、帳號頁個人成績；未登入者點開始先去 `/login`。 |
| P0 | 三關遊戲 | `/game` 的 3×3、4×4、5×5 固定燈陣；自己與上下左右切換；第 2／3 關依序解鎖，已解鎖關卡可從關卡選單單獨重試。 |
| P0 | 伺服器進度 | 每次有效點燈都經後端驗證並原子儲存；重新整理或換裝置可恢復當前盤面、步數及持續計時。 |
| P0 | 計時與排行 | 每關以資料庫開始／完成時間計算毫秒；`/leaderboard` 分關顯示目前題目版本的前 50 名。 |
| P0 | 回饋與重試 | 步數、亮燈數、計時器、過關面板、滿月終幕；可重來本關，最好的已驗證成績保留。 |
| P0 | 視覺與操作 | 全站像素風、Motion 頁面及元件轉場、emfont 俐方體、鍵盤／觸控操作、reduced-motion 降級。 |
| P0 | 雲端動畫偏好 | 登入者可在帳號頁選「減少動畫」；存入 Supabase 並在其他裝置同步。訪客依作業系統偏好。 |

### 畫面與文案

**首頁 `/`**：首屏是月兔、滿月與燈海；主 CTA 為「開始點燈」或登入後的「繼續點燈」。月下「試點一盞」用 React Bits `PixelSwap` 切換暗／亮燈插畫，不產生正式嘗試。往下是「點一盞 → 連動四周 → 全亮賞月」三步說明、個人最佳（登入後）與排行榜入口。首頁不是遊戲棋盤的縮小複製。

**登入 `/login`**：說明登入會保存進度並讓成績進入榜單；只有一個「使用 Google 登入」主要操作。驗證失敗、取消與逾時提供可重試訊息，不暴露技術錯誤。登入成功回到原本想開的站內頁。

**遊戲 `/game`**：關卡選單、`mm:ss.cc` 計時器、步數、亮燈數、燈陣與「重來本關」；頁首可去首頁、排行榜、帳號。初次進入有一句玩法提示。前兩關完成顯示時間與「下一關」，第三關為滿月終幕與「再玩一輪」；已解鎖關卡均可單獨重試。跨裝置或重新整理直接還原後端狀態；過期嘗試則顯示「本回合已逾時，重新開始」。

**排行榜 `/leaderboard`**：分頁籤切換第 1／2／3 關，顯示排名、目前公開暱稱、時間、步數；同時間以較少步數、再以較早完成者在前。登入者可見自己的最佳時間與目前名次（即使不在前 50）。改名後現有名次保留，榜單快取最晚 15 秒更新顯示名稱。空榜、讀取中與服務失敗有明確狀態。不公開電子郵件、OAuth 資訊或詳細操作紀錄。

**帳號 `/account`**：顯示目前暱稱、可編輯欄位、儲存／取消、規則與公開提示、雲端「減少動畫」開關、各關個人最佳及登出。首登可直接使用預設暱稱玩遊戲，也可先自行修改。儲存時顯示進度；重名、格式錯誤、改名冷卻與網路失敗各有欄位旁提示，失敗保留未送出的輸入。偏好儲存失敗亦顯示未同步及重試，不宣稱已套用雲端設定。改暱稱／偏好都不重設盤面、計時、解鎖或紀錄；不顯示 Google 電子郵件於公開頁面。

## 3. 規則、計時與系統行為

### 固定題目與操作

- `stage` 為 1、2、3；邊長依序 3、4、5。每格 bit 以列優先、從 0 編號；1 表示亮，0 表示暗。
- 題目版本 `puzzle_version = 1`，由全亮盤面依序切換固定格子產生：第 1 關 `[0,4]`、第 2 關 `[0,3,5,10]`、第 3 關 `[0,4,6,12,18,24]`。對應初始 `board_mask` 為 `334`、`45906`、`16510374`。這些擾動步驟就是至少一組可驗證解法；正式版題目以資料庫 migration 固定，客戶端不能選 seed。
- 點格 `i` 只翻轉自身與盤內上、下、左、右，不環繞。完成條件是所有格子全亮。
- 單次嘗試最多 999 步；第 999 步若未解，停止收新點擊並提示重來。第 999 步若解出，仍可完成。
- 第 1 關對登入者開放；第 2 關需同一帳號、本題目版本的第 1 關已驗證通關；第 3 關需第 2 關通關。重玩第 1 關不清除後續解鎖與歷史最佳。

### 計時與公平性

- `start_attempt` 在資料庫交易內寫入 `started_at = clock_timestamp()`；`apply_move` 在合法最後一步的交易內寫入 `completed_at = clock_timestamp()`。`elapsed_ms = max(1, floor((completed_at - started_at) × 1000))`。僅資料庫時間與盤面決定榜單，瀏覽器提供的時間、盤面、步數、完成旗標一律不採信。
- 開始、重來與每一步都需由已驗證帳號呼叫後端；每帳號在當前題目版本最多一個 `active` 嘗試。選擇其他已解鎖關卡時，交易內先把舊嘗試標為 `abandoned`，再建立新關嘗試；選同關則恢復原嘗試。`revision` 與 `requestId` 讓跨裝置、連點與逾時重送不會重複記步。
- 前端用伺服器回傳的 `started_at` 與 `server_now` 校準可見計時器，前景約每 50 ms 更新顯示；背景頁籤恢復、網路恢復時重新讀取權威狀態。計時器只供回饋；過關卡片與排行以伺服器回傳的 `elapsed_ms` 為準。
- 伺服器收到開始時間滿 30 分鐘後的點燈時，將嘗試標為 `expired`，不授分。此限制用於控制長期活躍資料與操作；不宣稱可杜絕自動解題。網路往返延遲會進入正式成績；排行榜定位為休閒競賽，非具獎金的防作弊競技。

### 公開暱稱規則

- 首次登入會得到唯一的「月兔-」加 8 位十六進位字元的預設暱稱；使用者可在 `/account` 改名。暱稱會出現在公開排行榜與個人榜資訊，介面明示「請勿使用真名或聯絡資訊」。
- API 先去掉首尾空白並做 Unicode NFC 正規化；正式暱稱需有 **2–12 個 Unicode code point**，只允許基本漢字 U+4E00–U+9FFF、漢字擴展 A U+3400–U+4DBF、英文字母 A–Z／a–z、數字 0–9、連字號 `-` 與底線 `_`，且至少含一個漢字或英文字母。不接受中間空白、換行、emoji、HTML／網址符號。資料庫函式獨立做相同正規化與驗證，防止直接呼叫 RPC 繞過 API；JS 與 SQL 以相同 code point 規則測試。
- 暱稱全站唯一，英文字母大小寫視為相同，NFC 等價寫法視為相同；資料庫唯一索引作最終裁決，並發搶同一暱稱僅一人成功。保留 `admin`、`system`、`official`、`support`、「官方」、「管理員」、「客服」等易混淆身分的名稱；同名或保留名稱會提供具體可修正提示。暱稱以純文字呈現並由 React 跳脫，不能當 HTML 注入。
- 第一次改名可立即進行；成功改名後 **30 秒內**不能再次改成不同名稱，重複儲存相同名稱視為無操作且不重設冷卻。改名只更新 `profiles`，榜單依 `user_id` 連到目前暱稱，歷史成績、名次與進行中的計時皆不變；公開榜單快取至多 15 秒後更新。登出不會清除暱稱。

### 狀態機

| 目前狀態 | 事件 | 下一狀態／副作用 |
| --- | --- | --- |
| `signedOut` | 點正式開始 | `/login`，OAuth 成功後再進遊戲。 |
| `loading` | 取得帳號、解鎖及目前嘗試 | `ready`／`playing`／`cleared`／`finished`／`expired`；失敗顯示可重試錯誤。 |
| `ready` | 開始已解鎖關卡 | 後端建立 `active` 嘗試，回傳伺服器時間與初始盤面，進入 `playing`。 |
| `playing` | 合法點格 | 樂觀呈現一次；後端核准後更新盤面、步數、`revision`；資料不符則還原並重新取得權威狀態。 |
| `playing` | 合法最後一步全亮 | 後端原子完成、計算時間並更新個人最佳；第 1／2 關進 `cleared`，第 3 關進 `finished`。 |
| `playing` | 重來本關 | 原嘗試標 `abandoned`、新嘗試從資料庫時間重新開始；最佳紀錄不變。 |
| `cleared` | 下一關 | 先檢查解鎖，再建立／恢復下一關嘗試。 |
| `playing`／`cleared`／`finished` | 選已解鎖關卡 | 若有其他 active 嘗試先放棄，再開始所選關卡；歷史最佳不變。 |
| `finished` | 再玩一輪 | 建立／恢復第 1 關新嘗試，保留歷史最佳。 |
| `playing` | 已超過 30 分鐘 | `expired`；不再接受點格，可建立新嘗試。 |
| 任意 | 非法事件、錯誤帳號、過期 revision、完成後再點 | 不寫入新成績；回明確錯誤碼或目前權威狀態。 |

畫面另有 `pendingMove`／`syncError`，與遊戲 phase 分離。同時只送一個點格請求；按壓可立刻顯示動畫與暫時燈光，但完成與成績只等伺服器核准。請求逾時時用**同一** `requestId` 查詢或重送，或讀取伺服器狀態；不能用新的 ID 猜測上一步是否成功。離線時停用新的正式點擊、保留最後已確認盤面並顯示重試；伺服器計時仍繼續。登出不停止活躍嘗試。跨裝置更新造成 `revision` 衝突時重新同步，不覆蓋另一裝置的進度。

### 雲端偏好與瀏覽器儲存邊界

**網站不讀寫 `localStorage` 或 `sessionStorage`，也不匯入舊鍵 `moon-rabbit.ui`／`moon-rabbit-lights.save`。** 盤面、步數、時間、解鎖、成績與帳號偏好全由 Supabase Postgres 保存。Supabase Auth 的 Next.js SSR 整合使用 cookie 儲存登入 session；cookie 不保存遊戲或偏好。React 記憶體狀態只用來顯示目前頁面，重整後重新向後端取得。

新帳號的雲端 `reduce_motion` 預設 `false`。登入者的有效減少動畫條件為作業系統 `prefers-reduced-motion` **或** 雲端 `reduce_motion = true`；作業系統要求減少動畫時，站內設 `false` 也不可強行播放動畫。未登入者只依作業系統，站內偏好開關需登入才可使用。登入後取得偏好前先以無移動過場呈現，避免初始動畫閃爍；載入失敗保留系統安全預設、顯示重試，不能把預設值誤寫回雲端。偏好更新只有後端確認後才顯示「已同步」，不能影響計時或排行榜。

同帳號其他裝置在登入、換頁、重新取得焦點／回到前景時重新讀偏好；持續在前景的頁面每 30 秒同步一次。已連線且在前景時，最晚 30 秒取得另一裝置的已儲存設定；離線時沿用最後已確認的記憶體值並提示未同步，連線恢復後重新讀取。並發修改以 `preferences_revision` 做樂觀鎖，過期版本回 409，顯示最新雲端值並讓使用者選擇再次儲存；不默默覆蓋另一裝置。

## 4. 技術選型與後端決策紀錄

### ADR-01：Supabase + Next.js 伺服器執行環境

**結論**：採用託管 **Supabase Auth + Postgres** 保存帳號、逐步進度與排行榜；Next.js 16 App Router 的 Route Handlers 提供應用 API，部署於 **Vercel** 的 Node.js 執行環境。首頁可靜態化，遊戲與帳號資料動態讀取；移除 `output: 'export'` 與舊的 Cloudflare Pages 靜態輸出方案。

決策只以「開發到部署／CI/CD 的可維護性」與「可擴展性」評估。Supabase 的關聯式資料、唯一鍵、交易及索引適合「每人每關最佳」和有序排行；Auth、資料庫 migration 與本機測試可放同一 repo。Vercel 直接支援 Next.js Route Handlers 與 PR preview。用資料庫交易處理點格與計時，伺服器可隨流量水平擴充，讀榜可快取、熱點可另加快取層。

| 方案 | 開發到部署／CI/CD 的可維護性 | 可擴展性 | 決議 |
| --- | --- | --- | --- |
| 託管 Supabase Auth + Postgres + Next.js Route Handlers | Auth 與資料庫 migration 同一流程；SQL 交易、索引與 RLS 有明確測試邊界 | 排行讀取可索引、分頁與快取；伺服器函式可水平擴充 | **採用**。 |
| Firebase Auth + Firestore | Auth 與交易成熟，但排行與關卡關聯需設計複合索引、文件彙總及對應安全規則 | 可自動擴充；跨集合排行與版本化較多應用層資料維護 | 可行，本版取捨較多。 |
| 自架 Next.js + Postgres + Auth | 全部可控制，但要維護 Auth、資料庫、備份、遷移及伺服器發版 | 可擴充，但要自行管理池化與高可用 | 本版沒有選擇自架。 |
| 靜態站 + `localStorage` | 發版簡單，但無可信跨裝置進度、伺服器計時與共享排行 | 僅靜態流量可擴展 | 已不符合修訂需求。 |

本版不需使用者自行架設後端主機；需要建立 Supabase 與 Vercel 託管專案，設定 Google OAuth、環境變數與資料庫 migration，詳見第 11 節。

偏好與帳號資料一起存於 `profiles`，避免為單一布林設定增加服務。跨裝置採前景每 30 秒與焦點恢復時重新讀取，免去 Realtime 訂閱、授權與部署管理；此處「同步」定義為已連線前景裝置在 30 秒內收到已儲存值，不保證離線或背景頁即時更新。

### ADR-02：依賴與架構

| 技術／套件 | 決定 | 理由 |
| --- | --- | --- |
| Next.js 16 + React + TypeScript strict | 採用 | App Router、Server Components、Route Handlers、`proxy.ts` session 更新及 SSR。 |
| Tailwind CSS 4 + `@tailwindcss/postcss` | 採用 | 響應式、色票 token；像素圖由 CSS／SVG 繪製。 |
| `@supabase/ssr` + `@supabase/supabase-js` | 採用並鎖定版本 | Cookie-based PKCE Auth、Server／Browser client；官方 SSR 套件仍屬 beta，升級須做回歸驗證。 |
| Supabase CLI + pgTAP | 僅開發／CI | 版本化 migration、本機 Auth／Postgres、RLS 與資料庫函式整合測試。 |
| Motion for React（`motion`，原 Framer Motion） | 採用 | 全站頁面、元件、棋盤狀態與互動過渡；`MotionConfig` 與 `useReducedMotion`。 |
| React Bits `PixelSwap` | 採用單一 TS/Tailwind 元件原始碼 | 首頁點燈預覽；固定來源版本、改用本站色票、保留授權聲明與 reduced-motion 分支。 |
| emfont `Cubic11`／俐方體11號 | 採用服務 | 遠端 CSS／字型，無本地託管；失效時系統繁中字體立即接手。 |
| Vitest、React Testing Library、Playwright | 僅開發／CI | 純函式、UI、API 整合與真實瀏覽器測試。 |
| GSAP、morphicons、Three.js、Unsplash | 不採用 | Motion 已統一轉場；描邊 morphing 與填色方格像素不符；無 3D／照片需求。 |
| transitions.dev | 設計參考，不加執行時套件 | 參考過渡節奏與 reduced-motion 配方，由 Motion 實作。 |

遊戲規則有一份 TypeScript 純函式供 UI 預覽、輸入驗證與測試；**資料庫函式是正式狀態轉換與計時的權威**。測試逐格比較 TypeScript 與 SQL 的翻轉結果，避免規則分叉。Next.js Route Handler 在每次請求以 `getClaims()` 驗證身分；`proxy.ts` 只負責 session 更新和頁面體驗，不能代替 API 授權。伺服器以使用者 cookie 與 Supabase publishable key 呼叫資料庫函式；不在瀏覽器放 service-role／secret key。

## 5. 資料模型、授權與 API

### Postgres 模型（`supabase/migrations` 管理）

| 表／約束 | 主要欄位 | 用途 |
| --- | --- | --- |
| `profiles` | `user_id uuid PK → auth.users`、`nickname text not null`、`nickname_updated_at nullable`、`reduce_motion boolean not null default false`、`preferences_revision integer not null default 0`、`preferences_updated_at nullable`、`created_at`；`lower(nickname)` 唯一索引 | 首登產生唯一預設暱稱及雲端動畫偏好，之後可修改；不複製 email／Google 名稱。 |
| `puzzles` | `(puzzle_version, stage) PK`、`size`、`initial_board_mask`、`enabled` | 固定三關版本；只由 migration 改動。 |
| `attempts` | `id uuid PK`、`user_id`、`puzzle_version`、`stage`、`board_mask`、`moves`、`revision`、`status`、`started_at`、`completed_at nullable`、`elapsed_ms nullable` | 權威進度與時間。`status` 限 `active/completed/abandoned/expired`；部分唯一索引保證每人每版最多一個 active。 |
| `move_receipts` | `(attempt_id, request_id) PK`、`revision_after`、`response_snapshot` | 重送相同 requestId 回同結果，不會多記一步；隨 attempt 清理。 |
| `stage_bests` | `(user_id, puzzle_version, stage) PK`、`attempt_id unique`、`elapsed_ms`、`moves`、`completed_at` | 每人每關最佳；排行索引 `(puzzle_version, stage, elapsed_ms, moves, completed_at, user_id)`。 |

資料庫 `ensure_profile` 在首登時產生不含個資的預設暱稱，若碰到唯一索引衝突則重抽。`set_nickname` 依 `auth.uid()` 鎖定本人 profile，在資料庫內去除首尾空白、做 NFC 正規化，再用 UTF-8 字元的 `char_length`／`ascii` 逐字驗證第 3 節的長度與允許碼點、保留名稱及 30 秒冷卻；`lower(nickname)` 唯一索引裁決重名。`set_ui_preferences` 亦鎖定本人 profile，驗證 `auth.uid()`、布林值與 `expectedRevision`；相同值不增加版本，不同值原子更新 `reduce_motion`、`preferences_revision` 及時間戳，過期版本回衝突。`start_attempt`／`restart_attempt`／`apply_move` 在單一交易內鎖定相關列，驗證 `auth.uid()`、關卡解鎖、題目版本、點格範圍、`revision`、上限、時限與每分鐘最多 10 次開始／重來；更新盤面與最佳紀錄。並發開始先由每人每版的部分唯一索引裁決，衝突時讀回已有 active 嘗試。`apply_move` 先查 requestId 收據，再處理新操作；相同 ID 且內容不同回衝突，不同 ID 與過期 revision 也回衝突。客戶端只套用不早於目前 revision 的回應，否則重新同步。`GET /api/me` 取得 active 嘗試；沒有 active 時回最近一次已完成嘗試，讓重整後仍可見過關／終幕。`get_leaderboard` 只回傳目前暱稱、時間、步數與完成時間；成績表不複製暱稱。`SECURITY DEFINER` 函式固定 `search_path`、所有物件用完整 schema 名稱；預設撤銷 function execute，僅授權需要的角色。表啟用 RLS，撤銷直接寫入權限：本人只可讀個人資料，匿名者與其他帳號不能讀 attempts／email；所有正式寫入都經驗證函式。**即使繞過 Next.js API 直接呼叫可執行的 Supabase RPC，也必須通過同一套身分、頻率與遊戲規則驗證。**公開榜單不直接曝露私有表。若切換題目版本，migration 先將舊版 active 嘗試標為 abandoned 並建立獨立新榜；舊版解鎖與成績不混入新版。

### API 契約

成功回應皆為 JSON；錯誤格式 `{error:{code:string,message:string}}`。變更請求須為同站 Origin 與 `application/json`；失敗不回傳內部 SQL／Auth token。Route Handlers 不快取個人資料與偏好；公開榜單可短暫快取（目標 ≤ 15 秒）並標記更新時間。

| 方法與路徑 | 輸入 | 成功／失敗 |
| --- | --- | --- |
| `GET /api/me` | 登入 cookie | `200`：目前暱稱、改名可用時間、`reduceMotion`、`preferencesRevision`、解鎖、各關最佳及本人名次、active 或最近完成嘗試、`server_now`；`401` 未登入，`503` 服務不可用。 |
| `PUT /api/me/nickname` | `{nickname:string}` | `200`：已儲存的目前暱稱與下次可修改時間；`401` 未登入、`409 nickname_taken`、`422 nickname_invalid/reserved`、`429 nickname_cooldown`、`503`。相同暱稱不變更資料。 |
| `GET /api/me/preferences` | 登入 cookie | `200`：`{reduceMotion:boolean,revision:number,updatedAt:string\|null}`；`401` 未登入、`503` 服務不可用。跨裝置同步使用此端點，`Cache-Control: no-store`。 |
| `PATCH /api/me/preferences` | `{reduceMotion:boolean,expectedRevision:number}` | `200`：已儲存的偏好與新 revision；`401` 未登入、`409 preferences_conflict` 並附最新偏好／revision、`422` 格式或型別錯誤、`503`。相同值不增加 revision；失敗不修改雲端值。 |
| `POST /api/attempts` | `{stage:1\|2\|3}` | `201` 建立（若其他關 active 則原子放棄舊關）、`200` 恢復同關 active；`401`、`403` 未解鎖、`422` 無效 stage、`503`。 |
| `POST /api/attempts/{id}/moves` | `{cellIndex:number,expectedRevision:number,requestId:uuid}` | `200`：權威盤面、步數、revision、server_now；完成時另含 elapsed_ms、是否個人最佳；`401/403/404/409/410/422/429/503`。 |
| `POST /api/attempts/{id}/restart` | 空物件 | `201` 新嘗試；舊嘗試 abandoned。逾時結果不明時先 `GET /api/me` 重新同步，不盲目再送。 |
| `GET /api/leaderboard?stage=1\|2\|3` | stage | `200`：當前 puzzle_version 的前 50 名及更新時間；`422` 無效 stage，`503`。已登入者自己的完整名次由 `GET /api/me` 的個人榜資訊取得。 |
| `GET /auth/callback` | Supabase PKCE `code`、站內 `next` | 驗證並交換 session；只允許站內固定目的地，失敗回登入頁可重試。 |
| `POST /api/auth/signout` | 登入 cookie | `204` 登出；不停止伺服器上的 active 計時。 |

`400/422` 是輸入錯誤；`401` 需登入；`403` 無權；`404` 找不到；`409` revision／重送、暱稱或偏好版本衝突；`410` 已完成或逾時；`429` 超過開始／操作頻率或改名冷卻；`503` 後端不可用。前端有 8 秒請求上限，但**逾時不是操作失敗的證明**：點燈以相同 requestId 重試或查 `/api/me`；改名逾時先查 `/api/me` 的目前暱稱，偏好逾時先查 `/api/me/preferences` 的 revision 與值，再決定是否重送。伺服器對同一帳號建立／重開嘗試設頻率上限（每分鐘最多 10 次）；對異常大量操作記錄非敏感審計資訊。Google OAuth 失敗不建立正式嘗試。

## 6. 像素風設計系統與動態

| token | 色值 | 用途 |
| --- | --- | --- |
| `night` | `#111827` | 夜空 |
| `deep-night` | `#0A1021` | 描邊與遠景 |
| `indigo` | `#27365A` | 暗燈與山影 |
| `slate` | `#526485` | 次要邊界 |
| `moon-cream` | `#FFF1C1` | 主要文字與月亮 |
| `lantern-gold` | `#FFC857` | 亮燈、主要操作 |
| `ember` | `#EA7563` | 警示 |
| `jade` | `#76C8A6` | 過關 |

元素使用硬邊與整數像素格；月兔、燈籠、山影用少量 CSS／SVG 繪製，SVG 設 `shape-rendering: crispEdges`，點陣素材採 `image-rendering: pixelated`。不使用柔焦照片、漸層玻璃卡或 emoji 圖示。燈格為至少 48×48 CSS px 的原生按鈕；320 px 視窗下 5×5 完整顯示、無橫向捲動。

字體由 emfont `https://font.emtech.cc/css/Cubic11/400` 提供；首次先用繁體系統字體顯示，掛載後非阻斷載入 CSS，確認 `document.fonts.load` 有實際 FontFace 後才切換 `font-ready`。1.5 秒未成功就保留後備字體；不使用 `next/font` 或本地字型檔。emfont 官方 React／Next.js 指南提供 JS 初始化，但其框架總覽通常建議 CSS，這也能覆蓋計時器及排行榜的動態文字。

Motion for React 管理頁面與元件動畫，登入且雲端偏好為 `true` 時 `MotionConfig reducedMotion="always"`，其餘使用 `"user"` 尊重系統偏好；首頁 PixelSwap 也遵守同一個有效減少動畫狀態。登入後尚未取得偏好時不播放進場位移；取得後再開始後續互動動畫。動畫優先 `transform`／`opacity`，格點輪廓及移動盡量對齊整數像素；色彩可用短 CSS transition。

| 畫面／元件 | 一般動態 | 減少動畫 |
| --- | --- | --- |
| 首頁月兔、標題、CTA、玩法卡 | 依閱讀順序短距進場；按鈕有 hover／press 回饋 | 同步顯示，保留焦點輪廓 |
| PixelSwap 點燈預覽 | 暗／亮格點替換 | 立即切圖 |
| `/`、`/login`、`/game`、`/leaderboard`、`/account` 導覽 | 共用像素月幕遮蓋與揭幕，路由載入超時 2 秒揭幕 | 直接切頁，不等待遮幕 |
| 登入與登出回饋 | 按鈕 pending、成功／失敗訊息進出 | 訊息立即可讀 |
| 帳號頁雲端動畫偏好 | 開關切換有按壓回饋；儲存中、已同步、失敗與版本衝突有明確訊息 | 開關與訊息即時呈現，不以動畫表示儲存成功 |
| 遊戲計時、步數、亮燈數、棋盤 | 計時數字穩定更新；格子按下縮放回彈，鄰格最多 30 ms 錯位；伺服器拒絕則柔和回復 | 立即更新／回復，無縮放與逐格延遲 |
| 同步、離線、過關、終幕 | 小面板淡入；過關上移 12 px；月亮上升 24 px，終幕 ≤ 900 ms | 靜態圖形與文案立即顯示 |
| 排行頁籤、名次列、個人成績 | 切關交錯淡入；新最佳或暱稱更新只局部強調 | 列表直接替換 |
| 帳號暱稱欄、儲存狀態與錯誤 | 編輯欄展開、儲存中指示、成功／錯誤訊息淡入；焦點留在欄位 | 欄位與訊息立即呈現，保留焦點 |

按壓／數字過渡目標 120–240 ms，過關與頁面切換 350–500 ms；動畫可中斷、不累積。`aria-live` 在資料狀態變化時播報，不等待動畫。站內連結保留修飾鍵與新分頁語意；導覽後焦點移至主內容。裝飾性背景不強制循環運動。

## 7. Acceptance Criteria

`T-U` 單元、`T-I` 元件與 API 整合、`T-DB` 資料庫整合、`T-E` 真實瀏覽器 E2E、`T-CI` 發版門檻。每條均須有自動化驗證；視覺品質另做人工驗收。

| ID | Given / When / Then | 測試 |
| --- | --- | --- |
| AC-01 | Given 未登入，When 開 `/`，Then 顯示獨立首頁、三步玩法、PixelSwap 預覽與登入入口；不顯示正式棋盤。 | T-I01、T-E01 |
| AC-02 | Given 未登入，When 開 `/game` 或正式開始，Then 前往 `/login`；OAuth callback 收到可交換的有效 code 後建立 session 並回遊戲，無效／取消可重試。外部 Google 畫面另在部署後 smoke check。 | T-I02、T-E02 |
| AC-03 | Given 登入，When 讀 `/api/me` 或登出，Then 只取得自己的目前暱稱／進度；登出後私有 API 回 401，其他帳號資料不可讀。 | T-I03、T-DB01、T-E02 |
| AC-04 | Given 任一關盤面，When 點中心／邊／角，Then 只有自身與存在的正交鄰格翻轉；TS 預覽與資料庫函式一致。 | T-U01、T-DB02 |
| AC-05 | Given 固定題目版本 1，When 開始每關，Then盤面為指定 mask、未全亮且可由規定擾動解回全亮；所有帳號同關同圖。 | T-U02、T-DB02 |
| AC-06 | Given 遊玩中，When 合法點格，Then 伺服器盤面、步數與 revision 恰更新一次；刷新或另一裝置可還原。 | T-I04、T-DB03、T-E03 |
| AC-07 | Given 重複 requestId／舊 revision／另一使用者 attempt，When 送點格，Then 不重複計步、不越權改盤；回同結果或 409／403。 | T-I05、T-DB03 |
| AC-08 | Given 最後一步全亮，When 伺服器核准，Then只完成一次、回資料庫 elapsed_ms；第 1／2 關解鎖下一關，第 3 關顯示終幕。 | T-I06、T-DB04、T-E04 |
| AC-09 | Given 同一人重玩同關，When完成更快／更慢／同時間，Then只在更快或同時間較少步時更新一筆個人最佳；原成績仍可追溯。 | T-DB04、T-I06 |
| AC-10 | Given 任何帳號，When 查三關榜單，Then各關只顯示當前題目版本前 50 名及目前公開暱稱，按時間、步數、完成時刻排序；本人名次正確。 | T-I07、T-DB05、T-E05 |
| AC-11 | Given 嘗試開始，When 計時器運行、切背景頁／重整／換裝置，Then顯示依伺服器時間校準；正式成績不採用客戶端時間。 | T-U03、T-I08、T-E03 |
| AC-12 | Given 30 分鐘界線、999 步界線、每分鐘 10 次開始／重來或未解鎖關卡，When 再送操作，Then 依規格回 410／429／403、提供重試／解鎖指引，且榜單不變。 | T-U04、T-DB06、T-I09 |
| AC-13 | Given 活躍嘗試，When 重來、登出、短暫斷網，Then重來建新嘗試且保留最佳；登出／斷網不暫停時間，斷網不接受未驗證的新步。 | T-I10、T-DB07、T-E06 |
| AC-14 | Given API 正常、401／403、503、逾時或回應格式錯誤，When讀取或提交，Then顯示對應狀態，逾時以同 requestId 重試／同步，不產生雙重點擊。 | T-I11、T-E06 |
| AC-15 | Given 合法／非法／邊界輸入，When 呼叫各 API，Then拒絕無效 stage、cellIndex、revision、UUID、Origin、Content-Type、未知 attempt；不回內部錯誤細節。 | T-I12、T-DB08 |
| AC-16 | Given 首次登入或已有雲端偏好，When 讀 `/api/me`／`/api/me/preferences` 並在帳號頁儲存布林設定，Then 首登初值為 `false`，已有值正確讀回，成功儲存持久化並更新 revision；重新整理與另一裝置登入取得相同值，遊戲計時及成績不變。 | T-U05、T-DB10、T-I18、T-E13 |
| AC-17 | Given 未登入、系統要求減少動畫、舊本機鍵存在、瀏覽器儲存不可用、偏好 API 401／409／422／503／逾時或畸形回應，When 載入或儲存偏好，Then 不讀寫本機儲存；訪客依系統偏好，已登入者顯示載入／同步錯誤與重試，衝突顯示最新雲端值，逾時先重讀確認，不能把未確認的值標為已同步。 | T-U05、T-DB10、T-I18、T-E13 |
| AC-18 | Given鍵盤、觸控或輔助科技，When操作燈格、登入、重來、換關及榜單，Then原生控制可用，每格有位置與亮暗標籤，計時與過關資訊可讀。 | T-I14、T-E07 |
| AC-19 | Given系統或已同步的雲端偏好減少動畫，When首頁預覽、換頁、點燈、過關或切榜，Then無移動／逐格等待，內容與操作立即可用。 | T-I15、T-E08、T-E13 |
| AC-20 | Given 320／390／768／1440 px 視窗，When顯示兩頁與 5×5 棋盤／排行榜，Then無橫向捲動、控制 ≥44×44 px、文字不重疊。 | T-E09 |
| AC-21 | Given emfont 正常、失敗、逾時或無效資源，When載入全站，Then正常情況才加 `font-ready`；其餘情況保持可讀後備字體，登入、遊戲與排行不阻塞。 | T-E10 |
| AC-22 | Given一般動態偏好，When各頁進出、按鈕／棋盤操作、計時與榜單更新，Then第 6 節列出的元件有可見過渡；連點與慢導覽不會卡在幕簾。 | T-I16、T-E11 |
| AC-23 | Given無前 50 名資料或 Supabase 暫時不可用，When開榜單，Then空榜或錯誤與重試入口明確；不能把快取／錯誤資料當新成績。 | T-I07、T-E05 |
| AC-24 | Given全新 clone、Node 22、Docker 與 Chromium，When執行 `npm ci`、`npm test`、`npm run lint`、`npm run typecheck`、`npm run build`，Then全部通過；Next 產物含五個路由與 API，資料庫 migration 可重放。 | T-CI01 |
| AC-25 | Given 已解鎖多關且某關 active，When 選其他已解鎖關卡，Then 交易內放棄原嘗試並開始新關；每人每版始終最多一個 active，原關最佳不變。 | T-DB07、T-I10、T-E04 |
| AC-26 | Given 首登取得預設暱稱且已有成績，When 在 `/account` 儲存合法的新暱稱，Then `/api/me` 顯示新名稱，榜單最晚 15 秒內顯示新名稱；原名次、最佳時間、解鎖、進行中計時不變；重登仍保留。相同名稱再送一次不重設 30 秒冷卻。 | T-U06、T-DB09、T-I17、T-E12 |
| AC-27 | Given 未登入、無效或超出長度邊界的暱稱、保留名稱、大小寫或 NFC 等價重名、同時搶名、30 秒冷卻、逾時／服務失敗，When 儲存暱稱，Then 回對應 401／422／409／429／503 或先同步確認；不改舊名與成績，表單保留輸入並提示修正。 | T-U06、T-DB09、T-I17、T-E12 |
| AC-28 | Given 同一帳號於兩裝置開啟，When 裝置 A 修改「減少動畫」，Then 裝置 B 於換頁、回到前景或持續前景最晚 30 秒讀到新值並套用；若 B 以舊 revision 同時送出相反值，回 409 且不覆寫 A 的設定。 | T-DB10、T-I18、T-E13 |

## 8. 測試計畫

**單一指令 `npm test`**：測試腳本在獨立的暫存目錄複製 Supabase migration，以獨立 project id／ports 啟動**測試專用**本機 Supabase（Docker）、重建該測試資料庫並注入本機測試環境；先跑 `supabase test db` 與 `vitest run`，再建置並啟動指向測試資料庫的 Next 伺服器，讓 `playwright test` 透過 HTTP 驗證真正的 Route Handlers 與頁面。結束時清理伺服器與測試 stack。一般開發用的本機資料庫不被 reset。首次需 `npx playwright install chromium`；CI 用 `npx playwright install --with-deps chromium`。腳本拒絕 linked／remote 目標，並將測試資料與任何 staging／production 金鑰隔離。

| 檔案／案例 | 主要風險 | AC |
| --- | --- | --- |
| `src/tests/game.test.ts`：T-U01～04 | 中心／邊角切換、固定解法、顯示時間的伺服器基準與格式、非法格點。 | 04、05、11、15 |
| `src/tests/cloud-preferences.test.ts`：T-U05 | 系統與雲端偏好組合、載入前降級、輸入型別及 revision 邊界。 | 16、17、19 |
| `src/tests/nickname.test.ts`：T-U06 | 去空白、2／12 字元邊界、允許碼點及保留名稱。 | 26、27 |
| `src/tests/client-api.test.ts`：T-I11 | 成功與錯誤回應、畸形 JSON、abort；逾時測試使用 fake timers 與可注入的 AbortSignal。 | 14、17、23、27 |
| `supabase/tests/database/game.sql`、`boundaries.sql`、`bests.sql`：T-DB01～08 | table grant、固定盤面、逐步原子更新、重送、跨帳號、解鎖、30 分鐘與 999 步、開始頻率、重玩更快／更慢的最佳更新；每例 rollback。 | 03～09、12、13、15、25 |
| `supabase/tests/database/ranking.sql`：T-DB05 | 52 名 fixture 驗證前 50、每關隔離、個人第 52 名、同時間步數／完成時間排序及改名後顯示；rollback 不改既有開發成績。 | 10、23、26 |
| `supabase/tests/database/preferences.sql`：T-DB09～10 | 預設偏好、讀寫與 revision 衝突、同值無操作、暱稱格式／保留／重名／冷卻。 | 16、17、26～28 |
| `e2e/api.spec.ts`：T-I02～12、T-I17～18 | 真實 Route Handlers + 本機 Auth/Postgres：401、403、409、422、429、Origin 與 Content-Type、點擊重送、登出後登入續玩、暱稱和雲端偏好。 | 02、03、06、07、12～16、25～27 |
| `e2e/home.spec.ts`、`accessibility-motion.spec.ts`：T-E01～02、T-E07～11 | 首頁／登入／榜單、鍵盤、reduced motion、無本機儲存、API 503／畸形回應與重試、字體失敗／逾時、四種寬度。 | 01、02、14、17～23 |
| `e2e/auth-game.spec.ts`：T-E03～06、T-E12～13 | 三關終幕、320px 的 5×5 操作、重玩保留成績、改名後榜單、同帳號兩裝置的焦點與 30 秒輪詢同步。 | 06、08、10、11、16、20、25、26、28 |
| CI：T-CI01 | 冷安裝、migration replay、單一測試指令、lint、型別與 Next 伺服器建置。 | 24 |

**確定性**：DB 邊界測試在 rollback 交易中設置 `started_at` fixture；正式函式仍用資料庫 `clock_timestamp()`。API abort 用 fake timers；跨裝置 30 秒同步用 Playwright clock，錯誤用 request routing。正式盤面固定，無 `Math.random()` 成績來源；只用密碼學亂數建立 UUID／預設暱稱。E2E 在本機 Auth 建兩個測試帳號驗證跨帳號隔離。外部 Google OAuth、真實部署的 emfont 成功載入及 Vercel／Supabase migration 權限仍需部署後 smoke check；它們不在本機 CI 的可重現環境內。

## 9. 效能、無障礙與安全邊界

- 目標瀏覽器：Chrome／Edge 111+、Firefox 128+、Safari 16.4+。首頁 LCP 目標 ≤2.5 s、CLS ≤0.1；真實環境量測。遊戲點格有即時按壓回饋，最終以後端回應確定狀態。
- 各路由自有互動 JS 加 Motion／PixelSwap gzip 目標 ≤100 KB（不含 Next／React）；自繪 SVG／CSS 素材 ≤50 KB。emfont 實測 CSS／WOFF2 請求與傳輸大小，載入失敗不遮文字。榜單伺服器查詢目標 p95 ≤500 ms（正常託管環境，正式版觀測）。
- 文字對比 ≥4.5:1、非文字控制界線 ≥3:1；燈格至少 48×48 CSS px、控制至少 44×44 px、格間距 ≥8 px。原生 button／link、可見焦點、狀態文案與適量 `aria-live`；支援 200% 放大，不靠色彩單獨表示狀態。
- 網站不使用 `localStorage`／`sessionStorage`；正式資料與偏好由資料庫保存。Supabase session 使用 cookie；XSS 防護仍須靠輸出跳脫與限制外部腳本，不能把 cookie 誤稱為完全不可被攻擊。Route Handlers 每次驗證 claims、Origin 與內容型別；資料庫 RLS、函式 grant、帳號 ownership 再做第二道檢查。公開榜單只曝露使用者自選的公開暱稱與成績，不回傳 email、Google 姓名或私人偏好。Vercel 環境變數僅有 publishable key，**不需 service-role key**。
- 此模型防止修改本機儲存或直接提交虛構完成時間；不保證防止腳本自動操作、多人共用帳號或網路延遲造成的時間差。若將來有獎品，必須另做防機器人、風控與規則審計。

## 10. 專案目錄（實作）

```text
app/
  layout.tsx
  page.tsx                     # 首頁
  login/page.tsx
  game/page.tsx
  leaderboard/page.tsx
  account/page.tsx
  auth/callback/route.ts
  api/me/route.ts
  api/me/nickname/route.ts
  api/me/preferences/route.ts
  api/attempts/route.ts
  api/attempts/[id]/moves/route.ts
  api/attempts/[id]/restart/route.ts
  api/leaderboard/route.ts
  api/auth/signout/route.ts
  globals.css
proxy.ts                       # Next.js 16 session 更新
src/
  components/
    font-loader.tsx
    site-shell.tsx
    pixel-scene.tsx
    home-screen.tsx
    pixel-swap-source.tsx
    login-screen.tsx
    game-screen.tsx
    leaderboard-screen.tsx
    account-screen.tsx
  lib/
    game.ts                    # 純函式，UI 預覽與契約測試
    timer.ts
    cloud-preferences.ts       # 有效動畫偏好及同步狀態，不碰瀏覽器儲存
    nickname.ts                # 正規化與前端表單檢查；DB 再驗證
    supabase/client.ts
    supabase/server.ts
    api.ts
    client-api.ts
  tests/
    game.test.ts
    cloud-preferences.test.ts
    nickname.test.ts
    client-api.test.ts
e2e/
  home.spec.ts
  auth-game.spec.ts
  api.spec.ts
  accessibility-motion.spec.ts
supabase/
  config.toml
  migrations/
  tests/database/
scripts/
  test.mjs
  smoke-db.mjs
  capture.mjs
docs/
  SPEC.md
  THIRD_PARTY_NOTICES.md
.env.example
vercel.json                   # 禁止 Git 自動部署，交由 CI 依序發佈
next.config.ts
postcss.config.mjs
vitest.config.ts
playwright.config.ts
package.json
package-lock.json
.github/workflows/ci.yml
```

## 11. 部署、設定與 CI/CD

### 所需外部設定

1. 建立 **Supabase staging 與 production 兩個託管專案**；在兩者的 Auth 設定啟用 Google provider。建立 Google Cloud OAuth Web Client，把 Supabase Dashboard 提供的 callback URL 加入 Google authorized redirect URI；把站點的 `/auth/callback` 加到 Supabase Redirect URLs。設 Site URL 與允許的本機／預覽／正式來源。Google Client ID／Secret 存在 Supabase Auth 設定，不放前端 repo。
2. 建立 **Vercel 專案**連 GitHub repo；Framework 為 Next.js，Node 22，**不設靜態 export**，並確認「Automatically expose System Environment Variables」已啟用。Preview 指向 staging Supabase，Production 指向 production Supabase。為保證 migration 先於新程式上線，`vercel.json` 設 `git.deploymentEnabled: false`，由 GitHub Actions 依序發佈資料庫與 Vercel 預覽／正式版。正式站用固定網域；預覽的來源由該次 Vercel 部署 URL 精確取得，伺服器只接受與部署自身相同的 Origin。預覽 callback 需加入 staging Supabase 的限定範圍 Redirect URLs；Production 只允許正式網域。Google provider callback 隨各 Supabase 專案分別設定。
3. 在 Vercel Preview／Production 設定下表環境變數；在本機使用 `.env.local`（不提交）。Supabase 本機開發由 CLI 啟動，`.env.example` 列出欄位但不含真值。

| 名稱 | 作用／放置位置 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 對應環境的 Supabase URL；可公開。 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 對應環境的 publishable key；可公開，但資料庫權限必須受 RLS／grant 限制。 |
| `APP_ORIGIN` | 本機與正式環境的確切站點來源，用於 callback、Origin 驗證與同站重導；Preview 以 Vercel 系統提供的當次 `VERCEL_URL` 組成確切來源。 |
| `SUPABASE_ACCESS_TOKEN` | 只在 migration 發佈 GitHub Actions secret；不可進 Vercel 客戶端。 |
| `SUPABASE_DB_PASSWORD` | 只在 migration 發佈 GitHub Actions secret。 |
| `SUPABASE_PROJECT_ID` | 只在 migration 發佈 GitHub Actions 設定；分 staging／production。 |
| `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` | 只在 GitHub Actions 使用，以 Vercel CLI 於 migration 成功後部署。 |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | 只在本機 Supabase CLI 啟用 Google 測試時使用；正式值在 Supabase Dashboard provider 設定。 |

4. 本機裝 Node 22、Docker-compatible runtime，執行 `npm ci`、`npx supabase start`、`npx supabase db reset`、`npm run dev`。首次 E2E 前執行 `npx playwright install chromium`。`npm test` 自動準備與重建**本機**測試 stack；不可指向 production。
5. GitHub Actions 對 PR 跑本機 migration replay、`npm test`、lint、typecheck、`npm run build`；staging 發佈工作以 concurrency 鎖序列化，先套 staging migration，再執行 `vercel pull --environment=preview`、`vercel build`、`vercel deploy --prebuilt`，取得可驗收 URL。正式環境在 `main` 經 CI 通過後先 `supabase db push --dry-run`，核對 production project ref，再 `supabase db push`；成功後才執行 `vercel pull --environment=production`、`vercel build --prod`、`vercel deploy --prebuilt --prod`。schema 變更以可向後相容為原則：先加欄位／函式，前後端切換後再移除舊結構。Production migration 與 Vercel deploy 都需可追溯版本；staging 同時有多個互不相容 PR 時，改用各 PR 獨立 Supabase preview branch，不把 migration 混到共用專案。
6. 發佈後走 Google 真實登入、帳號改名與榜單顯示、兩裝置雲端偏好同步、跨裝置續玩、三關通關、排行、emfont 載入／回退、reduced motion、手機畫面。Vercel 版本可回滾；若 DB migration 不能安全回滾，需以前向修正並保留相容窗口。

本版使用託管 Supabase，**沒有自架後端主機步驟**。若未來改為自架，需重新寫 Auth、Postgres、備份、TLS、migration 與環境變數部署手冊，不能直接沿用本節。

## 12. 實作里程碑

| 階段 | 任務 | 完成判準 |
| --- | --- | --- |
| M0：規格確認 | 完成並由使用者確認本文件 | 此階段只修改 `docs/SPEC.md`。 |
| M1：骨架與資料 | Next.js 16／Tailwind／TS、Supabase local、migration、固定題目、暱稱、雲端偏好及授權函式 | T-U01～06、T-DB01～10 通過。 |
| M2：帳號與 API | Google OAuth、SSR cookie、Route Handlers、暱稱與偏好 API、錯誤與同步處理 | T-I02～12、T-I17～18 通過。 |
| M3：雙頁與排行 | 首頁、登入、遊戲、排行榜、帳號及改名／偏好表單；Motion、React Bits、emfont、無障礙 | T-I01、T-I13～16、T-E01～13 通過。 |
| M4：上線門檻 | 冷安裝、單一指令測試、CI、staging／production migration、效能與視覺驗收 | T-CI01、部署 smoke check 通過。 |
| M5：工程審計 | 用 `fuck-my-shit-mountain` 審計，修高優先級問題並補回歸 | 高優先級缺陷關閉、全套測試再次通過。 |

## 13. Non-goals

- 匿名正式成績、未驗證的離線計分、客戶端自行上傳完成時間、舊本機資料匯入官方成績或偏好。
- 未登入訪客的站內偏好持久化；訪客依作業系統動態偏好，登入後使用雲端偏好。
- 多人同場、即時對戰、全球獎金賽、反機器人保證、賽季系統或無限關卡。
- 其他 OAuth 供應商、電子郵件密碼登入；本版帳號使用 Google。
- 音效、背景音樂、3D、照片背景、PWA 離線開啟、多語系。
- 自架 Auth／資料庫主機。

## 14. 風險與未決事項

| 風險 | 處理 |
| --- | --- |
| 網路延遲進入正式計時，地區間成績有差 | 明示為休閒榜；伺服器計時一致且可審計，不接受客戶端校正值。 |
| 自動解題或多人共用帳號 | 伺服器逐步驗證與限流；不承諾完全防機器人，異常監測留待託管環境加上。 |
| 自選暱稱冒充他人、含個資或不當文字 | 保留管理身分名稱、限制字元與長度、公開前提示勿用真名／聯絡資訊；全站唯一不等於真實身分驗證。本版不承諾自動判斷所有冒充或不當語意，收到檢舉時由站方依帳號處理。 |
| Supabase SSR 套件仍為 beta | 鎖版本，Context7／官方文件核對升級；Auth、cookie 更新與 Route Handler 回歸測試。 |
| OAuth／Vercel 預覽 redirect 設錯 | staging 與 production 分環境，設固定 Origin、allow list，部署 smoke check。 |
| 資料庫函式 `SECURITY DEFINER` 錯誤繞過 RLS | 固定 search_path、最小 grant、完整 schema 限定與跨帳號 pgTAP 測試。 |
| API 結果不明時重送導致兩次點格 | 相同 requestId 收據、revision、單一 in-flight 操作，逾時先同步。 |
| emfont 慢或失效 | 非阻斷載入、1.5 秒後維持系統字體；CI 模擬失敗與逾時，部署後實測正常載入。 |
| 服務中斷或使用者清除 cookie | 可重登取回資料庫進度；中斷時不接受離線正式操作。 |
| 雲端偏好請求延遲或兩裝置同時修改 | 載入前不播放位移、失敗顯示未同步；前景 30 秒同步與 revision 衝突提示，避免默默覆寫。離線時無跨裝置即時同步。 |
| 題目版本調整影響榜單可比性 | 固定 version 1；改題只新增版本並分榜，不覆蓋歷史紀錄。 |
| 嘗試與 requestId 收據持續增長 | 先用複合索引與每帳號建立頻率限制；觀察資料量及查詢 p95，必要時以 migration 加入歷史非最佳嘗試與收據的保留期，最佳嘗試及榜單參照不可誤刪。 |

規格已獲使用者確認並據此實作。託管 Supabase、Google OAuth、Vercel 及 GitHub Actions 憑證由專案擁有者設定後，依第 11 節執行部署 smoke check。

## 15. 文件核對紀錄

2026-09-24 使用 [Context7 Search API](https://context7.com/docs/search-api) 查 Next.js 16 `proxy.ts`／Route Handlers、Supabase SSR Auth／資料庫函式／CLI、Motion for React；Next.js 索引含 `/vercel/next.js/v16.2.9`，Supabase 索引含 `/websites/supabase`。再核對官方文件：[Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)、[Supabase SSR](https://supabase.com/docs/guides/auth/server-side)、[Next.js Supabase client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)、[Supabase Google 登入](https://supabase.com/docs/guides/auth/social-login/auth-google)、[資料庫函式安全](https://supabase.com/docs/guides/database/functions)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[CLI migration](https://supabase.com/docs/guides/local-development/cli-workflows)、[pgTAP 測試](https://supabase.com/docs/guides/database/testing)、[PostgreSQL 字串函式／NFC](https://www.postgresql.org/docs/19/functions-string.html)、[PostgreSQL expression index](https://www.postgresql.org/docs/17/indexes-expressional.html)、[Firebase Auth](https://firebase.google.com/docs/auth/web/start)、[Firestore 排序查詢](https://firebase.google.com/docs/firestore/query-data/order-limit-data)、[Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[Vercel Git 自動部署設定](https://vercel.com/docs/project-configuration/git-configuration)、[Vercel GitHub Actions 發佈](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)、[Vercel 系統環境變數](https://vercel.com/docs/environment-variables/system-environment-variables)、[Motion](https://motion.dev/docs/react)、[emfont React／Next.js](https://font.emtech.cc/docs/framework/react)及[CSS](https://font.emtech.cc/docs/css)、[React Bits](https://github.com/DavidHDev/react-bits)、[morphicons](https://github.com/guillermolg00/morphicons)、[transitions.dev](https://github.com/Jakubantalik/transitions.dev)。安裝套件與部署前再次核對版本、Auth 設定與 migration 行為。

