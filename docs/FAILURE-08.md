## Incident

### 我想要什麼

讓本機登入後可以正常呼叫已部署到 Supabase 的遊戲 RPC。

### AI 做了什麼

應用程式本身已呼叫正確 RPC，但遠端 Supabase API 一度找不到對應 function / schema cache，回傳 `PGRST202`。

### 我怎麼發現

本機登入後 `/api/me` 持續回 503，server log 重複出現 `Supabase RPC failed { code: 'PGRST202' }`。

### 怎麼解決

用 Supabase CLI 檢查 linked project 與 migration 狀態，確認 migration 已同步；必要時 reload PostgREST schema cache，並補上更明確的 `PGRST202/PGRST205` 診斷訊息與部署說明。
