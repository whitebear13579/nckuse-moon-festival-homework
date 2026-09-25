## Incident

### 我想要什麼

暱稱與偏好設定儲存在雲端，並能在另一個裝置同步讀回。

### AI 做了什麼

一開始的帳號頁的受控欄位與雲端狀態同步不完整，checkbox 有時不會保持勾選，另一裝置也不一定立即取得最新偏好。

### 我怎麼發現

Playwright 測試出現 `Clicking the checkbox did not change its state`、`Expected: checked / Received: unchecked`，暱稱成功訊息也曾找不到。

### 怎麼解決

儲存後等待後端確認並重新抓取帳號資料；偏好在 focus、頁面切換、visibility change 與定時輪詢時重新同步。
