## Incident

### 我想要什麼

測試排行榜 API 回傳異常資料時，頁面會顯示可理解的錯誤訊息。

### AI 做了什麼

初版 E2E 測試使用過於寬泛的 `getByRole('alert')`。

### 我怎麼發現

Playwright strict mode 發現兩個 alert：應用程式錯誤訊息，以及 Next.js 的 `__next-route-announcer__`。

### 怎麼解決

把 selector 改成鎖定實際錯誤文字 `榜單資料格式不正確。`，避免和 Next.js route announcer 衝突。
