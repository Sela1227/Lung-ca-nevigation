# 彰濱秀傳癌症中心 — 癌症臨床路徑導航系統 v25

多癌別臨床路徑管理系統。單一入口，每個癌別獨立目錄。

## 目錄結構

```
index.html          ← 入口（八癌別選單）
lung/index.html     ← 肺癌臨床路徑 v25
lung/edu.html       ← 肺癌 QR 掃碼頁
breast/             ← 乳癌（建構中）
crc/                ← 大腸直腸癌（建構中）
esoph/              ← 食道癌（建構中）
hn/                 ← 頭頸癌（建構中）
liver/              ← 肝癌（建構中）
prost/              ← 攝護腺癌（建構中）
bladder/            ← 膀胱癌（建構中）
```

## 部署

上傳至 GitHub Pages：`https://sela1227.github.io/Lung-ca-nevigation/`

## 版本歷程

| 版本 | 日期 | 重點 |
|------|------|------|
| v25 | 2026-03-28 | 多癌別入口頁（八癌別卡片選單）；肺癌移至 lung/ 子目錄；EDU_BASE_URL 更新 |
| v24 | 2026-03-27 | 完整 AJCC 9th TNM（Tis/T1mi/T1a-c/T2a-b, N2a/N2b, M1c1/M1c2）；Stage 0/IA1-3 |
| v23 | 2026-03-27 | 加 Tis + Stage 0；基礎檢查對齊本院指引（初步評估 + 治療前評估） |
| v22 | 2026-03-26 | 修正進階檢查 tab selector scope bug |
| v21 | 2026-03-26 | flex scroll 修正；決策頁隱藏全域導航 |
| v20 | 2026-03-26 | 儲存→查看手冊；衛教顯示實際治療；內部導航頁隱藏全域 bar |
| v19 | 2026-03-26 | 衛教手冊獨立頁籤；路徑 tab prev/next；居中佈局 |
| v14-v18 | 2026-03-24~26 | QR 優化、導航 UX、語法修正 |
| v12 | 2026-03-24 | 本院指引 v12（12 條路徑） |
| ≤v11 | — | 檢查/路徑分頁籤、A4 手冊、QR、KPI、IndexedDB |
