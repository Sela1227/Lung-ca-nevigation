# 彰濱秀傳癌症中心 — 肺癌臨床路徑

單一 HTML 檔案的肺癌臨床路徑管理工具，支援 NSCLC（非鱗/鱗狀）及 SCLC。

## 部署

1. 將 `index.html` 上傳至 GitHub Pages
2. 將 `edu.html` 放在同一目錄（QR 掃碼用）
3. 修改 `index.html` 中的 `EDU_BASE_URL` 為實際部署網址

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `index.html` | 主程式（病人收案、決策、路徑、總覽、統計） |
| `edu.html` | QR 掃碼目標頁（病人端衛教手冊） |

## 版本歷程

### v14 (2026-03-24)
- **QR 碼大幅修正**：payload 從 600+ 字元縮減至 ~150 字元（僅帶代碼，edu.html 自行查表還原）
- QR 改純黑 #000、150px、CorrectLevel.L、移除 border-radius
- edu.html 重寫：內建查表邏輯，從 type+stage 代碼還原治療目標與方案
- 新增 README 版本歷程記錄

### v12 (2026-03-24)
- **路徑系統全面改寫**：從 NCCN 三大組改為本院指引 version 12 的 12 條細分路徑
- 路由對齊本院指引 p.2-p.10（NSCLC 9 條）+ p.19（SCLC 3 條）
- NSCLC_NS 與 NSCLC_SQ 共享 I_periph～M1b 路徑，M1c 分流
- 嵌入全部 5 則院內臨床註記（>70歲CCRT改sequential、SBRT給付、高風險因子、基因檢測流程）
- 藥物維持通稱（免疫藥物、標靶藥物、鉑類化療）
- 衛教手冊附註改為「本院診療指引」
- 標題加上「彰濱秀傳癌症中心」+ 版本號

### v11 (2026-03-03)
- 基礎檢查分頁籤（與進階相同 tab 介面）
- 臨床路徑分四頁籤（治療方案/執行策略/照護團隊/費用概估）
- 衛教手冊壓縮為 A4 一頁（雙欄排版）
- 病人頁新增「載入舊病人」按鈕
- 刪除所有試驗名稱與具體藥名（安全警告除外）
- QR 碼系統初版（URL fragment 方案）
- edu.html 掃碼 viewer 初版

### v9 (2026-03-02)
- 兩階段檢查清單（基礎 12 項 + 進階 14 項）
- 決策面板置於兩階段之間
- 紅色 badge 完全移除
- 六步流程：病人→基礎檢查→決策→進階檢查→路徑→總覽

### v7 及更早
- MDT KPI 驗證系統
- 22 種治療選項
- 列印系統重寫
- Stage-aware checklist (26 項)
- 照護團隊會診系統（胸外/胸內/放腫 + 個管師）
- IndexedDB 本地儲存、CSV/JSON 匯出、備份還原

## 技術架構

- 單一 HTML 檔案，內嵌 CSS + JavaScript
- 外部 CDN：Font Awesome 6.5、Chart.js 4.4、qrcode.js 1.0
- 本地儲存：IndexedDB
- 部署：GitHub Pages（靜態，無後端）
- 隱私：QR 資料以 URL fragment 傳遞（不經 server），姓名自動遮罩

### v14 更新補充 (2026-03-24 #2)
- 修正 `updateTitle()` 覆蓋 topbar 問題：醫院名稱+版本號現在永久顯示，病人代號/姓名附加在後方
- edu.html 配色從藍色 (#1a5276) 改為綠色 (#0d9b6a)，與主程式一致
- EDU_BASE_URL 已設定為 https://sela1227.github.io/Lung-ca-nevigation/edu.html

### v15 (2026-03-26)
- 病人頁、基礎檢查、進階檢查三頁加上 max-width:800px 居中，視覺風格對齊決策頁的卡片式佈局
- 大螢幕不再撐滿全寬，填表更集中
