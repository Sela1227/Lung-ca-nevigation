# Cancer Navigation V2.8.1 — 彰濱秀傳癌症中心

## V2.8.1 — 2026-04-29
**民眾版整體 UI 重構成「真一頁式」**
- Sela 反映 V2.8.0 仍要滑動，這版徹底翻修：
  - `body` 改用 `100dvh` + `overflow:hidden`，整個 app 鎖在視窗內
  - `.main` `flex:1`，每頁`flex:1` 填滿可用區（hdr 60-72px + bar 56-60px 之外全給內容）
  - **Q1**：4 顆類型按鈕改 2×2 grid（手機 1 欄但更扁），姓名/病歷號折成單行
  - **Q2**：T/N/M 三組水平 row（letter ▸ meta ▸ 按鈕組），預估高度從 ~400px 砍到 ~290px；stage 預覽嵌進底部一條
  - **Q3**：基因 9 顆改 3 欄 grid（手機 2 欄），高度減半；按鈕用 mut-tag/title/sub 三層
  - **總覽**：3 區塊 = hero 帶 + 藥物清單(唯一允許捲動) + 底部團隊+警示 strip(2 欄)
  - 進度點移進 header 右側（節省一行）
- Header 改成左 home + 標題 / 右進度點，行高 60-72px（之前 ~120px）
- 所有 SVG 改成 `currentColor` 確保配色一致；type-grid icon 改更小更乾淨
- **無功能性改動**：14/14 ajcc 測試保持綠
- 移除 patient footer 文字（擠版面），版號顯示由 portal/lung 負責
- **模組**：lung V1.6.0 → V1.6.1（僅版號 bump）；系統 V2.8.0 → V2.8.1

## V2.8.0 — 2026-04-29
**民眾版 TNM 輸入 + 藥物可見性大幅強化**
- **patient.html Q2 改為 TNM 輸入頁**：
  - T / N / M 三組按鈕橫排，每組獨立顯示腫瘤特徵提示
  - **預設簡化模式**：T1/T2/T3/T4 × N0/N1/N2/N3 × M0/M1（民眾常用）
  - **「進階模式」可切換**：T1mi/T1a-c/T2a-b × N2a/N2b × M1a/M1b/M1c（醫護或熟悉病情者）
  - 即時計算分期並預覽（`Stage IIIA` 之類）
  - 完整搬移 lung.html 的 `computeAJCC` 含 BUG-13 N2a/N2b 修正
  - 「我不知道 TNM」fallback 退回一般原則
- **藥物可見性升級**（這版的真正主角）：
  - 每個治療 step 的藥物清單獨立成 box，淺青底 + 邊框
  - 藥名升級成主角：英文名 14.5px 深青加粗，中文名 12.5px 灰色獨立行
  - box 上方加「適用藥物」標籤
  - 早期/局晚/SCLC 三大分支補上 `line` 屬性（線數標記）
- **lung.html / portal**：版號 bump，無功能改動
- **模組**：lung V1.5.0 → V1.6.0；系統 V2.7.0 → V2.8.0

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
