# 彰濱秀傳癌症中心 — 肺癌臨床路徑 v18

單一 HTML 檔案的肺癌臨床路徑管理工具。支援非鱗 NSCLC、鱗狀 NSCLC、SCLC，路徑對齊本院診療指引 version 12 (2026)。

## 檔案與部署

| 檔案 | 用途 |
|------|------|
| `index.html` | 主程式（收案→檢查→決策→路徑→總覽→統計） |
| `edu.html` | QR 掃碼目標頁（病人端個人化照護手冊） |

部署至 GitHub Pages 後，修改 `index.html` 中 `EDU_BASE_URL` 即可啟用 QR。

**部署網址：** `https://sela1227.github.io/Lung-ca-nevigation/`

## 技術架構

- 單一 HTML + 內嵌 CSS/JS，無框架
- CDN：Font Awesome 6.5、Chart.js 4.4、qrcode.js 1.0、Noto Sans TC
- 儲存：IndexedDB（病人紀錄/草稿/設定）、CSV/JSON 匯出、備份還原
- 列印：A4 總覽報告 + A4 衛教手冊（雙欄）
- QR：URL fragment（資料不經 server），病人姓名自動遮罩，團隊全名帶入
- 路由：`txGroup(S)` 依 TNM 分流至 12 條路徑（NSCLC 9 + SCLC 3）

## 版本歷程

| 版本 | 日期 | 重點 |
|------|------|------|
| v18 | 2026-03-26 | 修正 v17 語法錯誤（移除 alert 時懸空 `+` 導致卡死）；重寫 README |
| v17 | 2026-03-26 | 移除路徑頁重複臨床註記 alert；路徑頁 960px 居中 |
| v16 | 2026-03-26 | QR 帶團隊全名；導航 UX（tab 尾→下一頁、底部按鈕顯示目的地、病人頁入口按鈕） |
| v15 | 2026-03-26 | 病人/檢查頁 800px 居中 |
| v14 | 2026-03-24 | QR 600→150 字元；純黑 QR；edu.html 綠色配色；updateTitle 保留醫院名 |
| v12 | 2026-03-24 | NCCN→本院指引 v12（12 條路徑）；5 則院內註記；標題加醫院名+版號 |
| v11 | 2026-03-03 | 檢查/路徑分頁籤；A4 衛教手冊；QR+edu.html 初版；移除藥名 |
| v9 | 2026-03-02 | 兩階段檢查；決策居中；六步流程 |
| ≤v7 | — | KPI 驗證、22 治療選項、列印、團隊會診、IndexedDB |
