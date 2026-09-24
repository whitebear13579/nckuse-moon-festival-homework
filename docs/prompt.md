你現在是一名資深的全端開發工程師，你的目標是開發一個以"中秋節"為主題的互動式網頁應用程式。
題材不限，例如可以是：
- 中秋賀卡
- 月餅 Clicker
- 烤肉模擬器
- 月相模擬
- 互動故事
- 任何你覺得有趣的東西
應用程式的主題與內容由你自由發揮，越有趣越有創意越好
整體 tech stack 我想使用 Nextjs 16 + Tailwind +  TypeScipt 來建構
由你自身來評估你的構想是否需要後端服務。若需要後端服務，你可以使用 supabase / firebase 等現成的後端服務，亦可以要求我使用自己的實例主機來搭建後端服務，你只需要考慮從開發到後續部屬、CI/CD 的可維護性與可擴展性，不需要考慮我額外付出的人工成本或操作成本，由你自身評估與 trade-off 後決定適合的後端方案。

對於這份專案，我會希望其動畫效果與整體 UI / UX 都要盡可能地做到美觀與流暢，並以像素設計為主題。
如果你可能會用到圖片之類的素材，你可以在 [Unsplash](https://unsplash.com/) 中尋找。不過，由於圖片相較其他元素的大小與體積過大，可能會拖慢整體網頁載入速度。

在此工作區中，你可以使用以下 SKILL 做為參考資源：
- ui-ux-pro-max-skill: An AI skill that provides design intelligence for building professional UI/UX across multiple platforms and frameworks.
- ponytail: improve your code quality and maintainability by providing suggestions and best practices for writing clean, efficient, and scalable code.
- fuck my shit mountain: an uncompromising engineering audit framework. The name is self-deprecating, but the report is deadly serious. It instructs the agent to map the repository first, trace execution paths, and produce an evidence-backed, prioritized audit report with concrete failure scenarios, minimal fixes, and regression test proposals.
- impeccable: Design guidance for AI coding agents. 1 skill, 24 commands, live browser iteration, and 61 deterministic detector rules for AI-generated frontend design.
- threejs-skills: a curated collection of Three.js skill files that provide Claude Code with foundational knowledge for creating 3D elements and interactive experiences.

以及一個 MCP Server - Context7，你可以用它來瀏覽各種 package、library、framework、API....的最新文件

除上述我指定的 tech-stack 外，其餘的技術選型、架構選擇與 library 使用都由你自行評估與決定。

我這邊還有幾個推薦的資源或套件，你可以自行決定是否使用：
- GSAP / Framer Motion：網頁動畫效果的強大工具，能夠幫助我們實現流暢的動畫過渡和互動效果，你可以自行決定要使用哪一個，或者是混用也沒問題。
- [react-bits](https://github.com/DavidHDev/react-bits): The largest & most creative library of animated React components.
Stand out with 200+ free, customizable animations for text, backgrounds, UI, and micro interactions.
- [morphicons](https://github.com/guillermolg00/morphicons): Any icon morphs into any other — universal morphing for stroke-based icons with spring physics. Zero dependencies, ~7 KB gzip.
- [transitions.dev](https://github.com/Jakubantalik/transitions.dev): Collection of the most essential transitions for web apps, skill for agents and Refine tool for agents
- [emfont](https://font.emtech.cc/docs): 免費的中文 Webfont 服務

除此之外，你還需要規劃撰寫測試流程，來進行項目的單元測試、整合測試等，來確保專案上線前所有功能都會被系統正確的測試。你的測試應該至少會有以下幾個內容
- 狀態轉換
- localStorage
- API
- validation
- 等等
不要寫沒有實際意義的測試來湊數。

你需要為此專案做一個詳盡的技術設計與實作規畫工程，並在 `docs/` 資料夾中撰寫一份完整的 `SPEC.md` 文件。
在 `SPEC.md` 文件中，你至少需要包含以下內容：
- 要做什麼
- 主要功能
- 系統行為
- Acceptance Criteria
- Non-goals
- ......and any other 