## Incident

### 我想要什麼

讓 React 頁面與互動元件通過 ESLint，並維持正常狀態更新。

### AI 做了什麼

一開始在 `useEffect` 內同步呼叫 `setState`、在 render 路徑讀取 `Date.now()`，部分元件也在 render 時修改 ref。

### 我怎麼發現

執行 `npm run lint` 時出現 `set-state-in-effect`、`react-hooks/purity` 與 ref during render 等錯誤。

### 怎麼解決

把可推導的狀態改成直接計算，時間讀取移到 timer / request callback，並重構 ref 更新位置，直到 lint 通過。
