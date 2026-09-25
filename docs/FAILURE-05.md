## Incident

### 我想要什麼

讓 `npm test` 自動啟動隔離的 Supabase，取得連線資訊後繼續跑完整測試。

### AI 做了什麼

一開始直接把 `supabase status -o json` 的整段輸出交給 `JSON.parse()`。

### 我怎麼發現

測試 runner 報錯：`Unexpected token 'S', "Stopped se"... is not valid JSON`。

### 怎麼解決

先找到輸出中的第一個 `{`，只截取真正的 JSON payload 再解析。
