# Cancer Navigation V2.7.0 — 彰濱秀傳癌症中心

## V2.7.0 — 2026-04-29
**民眾版重寫 + 健保藥物整合 + 效能修復**
- **patient.html 全面重寫**：一問一頁、大按鈕選取（不下拉）、選完自動跳下一步
  - 4 階段流程：Q1 類型 → Q2 分期 → Q3 基因/PD-L1（NSCLC + 局晚/轉移才問）→ 總覽
  - 姓名/ID 選填，填了會產 QR
  - 全 inline SVG，不載 FA CSS（首屏更快）
  - 青綠配色 `--teal:#0d9488` 與醫護版區隔
- **健保藥物資料庫整合**：依《健保第 9 章》與《附件 2 修訂對照表》整理 14 組標靶/免疫/化療方案，含中英文藥名、健保/自費 badge、線數標記、規範注意事項
- **lung.html 卡頓修復**：
  - 修 Chart.js `font.family` 字串語法錯誤（兩字串連寫，會拋 SyntaxError，可能就是「部分字消失」元凶）
  - `A.go()` 重渲染包進 `requestAnimationFrame`
  - 快取 `_panels`/`_navs` NodeList，省掉每次 querySelectorAll
  - `dots` 改成靜態 7 點 + class toggle，不再 innerHTML 重建
  - `renderPW` → `renderTxExec/renderConsult` 延後一個 frame
  - `renderSummary` → `renderKPI` 延後一個 frame
  - 4 處 `setTimeout(renderMolPanel, 50)` 改 `requestAnimationFrame`
- **模組**：lung V1.4.1 → V1.5.0；系統 V2.6.1 → V2.7.0

## V2.6.1 — 2026-04-07
**computeAJCC 修正（AJCC 9th 對齊 NCCN v3.2026）**
- N2a 和 N2b 分期不同：T1+N2a→IIB（之前錯算 IIIA）、T2+N2b→IIIB（之前錯算 IIIA）、T3+N2a→IIIA（之前錯算 IIIB）
- 醫護版 + 民眾版同步修正
- 民眾版 N dropdown 新增 N2a/N2b 選項
- **模組**：lung V1.4.0 → V1.4.1
