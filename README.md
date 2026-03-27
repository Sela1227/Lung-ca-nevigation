# 彰濱秀傳癌症中心 — 肺癌臨床路徑 v23

單一 HTML 檔案的肺癌臨床路徑管理工具。支援非鱗 NSCLC、鱗狀 NSCLC、SCLC，路徑對齊本院診療指引 version 12 (2026)，AJCC 9th TNM 分期。

## 檔案與部署

| 檔案 | 用途 |
|------|------|
| `index.html` | 主程式（收案→檢查→決策→路徑→總覽→手冊） |
| `edu.html` | QR 掃碼目標頁（病人端個人化照護手冊） |

**部署網址：** `https://sela1227.github.io/Lung-ca-nevigation/`

## 技術架構

- 單一 HTML + 內嵌 CSS/JS，無框架
- CDN：Font Awesome 6.5、Chart.js 4.4、qrcode.js 1.0、Noto Sans TC
- 儲存：IndexedDB、CSV/JSON 匯出、備份還原
- 列印：A4 總覽報告 + A4 衛教手冊（雙欄）
- QR：URL fragment，病人姓名遮罩，團隊全名帶入
- 路由：`txGroup(S)` 依 TNM 分流至 12 條路徑（NSCLC 9 + SCLC 3）

## 版本歷程

| 版本 | 日期 | 重點 |
|------|------|------|
| v23 | 2026-03-27 | T 分期加 Tis（原位癌）+ Stage 0；基礎檢查重構對齊本院指引 v12（初步評估 7 項 + 治療前評估 8 項） |
| v22 | 2026-03-26 | 修正進階檢查 tab 切換 bug（selector 未限定範圍）；tab nav 按鈕顯示目的地名稱 |
| v21 | 2026-03-26 | flex scroll 修正（min-height:0）；決策頁隱藏底部全域導航 |
| v20 | 2026-03-26 | 儲存後加「查看手冊」；衛教手冊顯示實際已執行治療；內部導航頁隱藏全域 bar |
| v19 | 2026-03-26 | 總覽移除緊急警訊；衛教手冊獨立「手冊」頁籤；路徑四 tab prev/next；居中佈局 |
| v14-v18 | 2026-03-24~26 | QR 優化、導航 UX、版本號系統、語法修正 |
| v12 | 2026-03-24 | NCCN→本院指引 v12（12 條路徑） |
| ≤v11 | — | 檢查/路徑分頁籤、A4 手冊、QR、KPI、IndexedDB |
