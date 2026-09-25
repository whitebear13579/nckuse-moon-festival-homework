## Incident

### 我想要什麼

驗證完成關卡後會進入排行榜，而且已完成的 attempt 不能再提交 move。

### AI 做了什麼

一開始的 pgTAP 測試假設排行榜一定只有 1 筆，且取得已完成 attempt 的方式碰到資料表權限限制。

### 我怎麼發現

`npx supabase test db` 顯示排行榜數量 `have: 2 / want: 1`，以及 `permission denied for table attempts`。

### 怎麼解決

排行榜改驗證至少有一筆成績；attempt ID 改從允許的 RPC 回傳資料取得，再驗證 `attempt_closed`。
