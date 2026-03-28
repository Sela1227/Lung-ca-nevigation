# 彰濱秀傳癌症中心 — 癌症臨床路徑導航系統

## 目錄結構

```
index.html          ← 入口頁 (portal v1)
lung/index.html     ← 肺癌 v34
lung/edu.html       ← 肺癌 QR 掃碼頁
```

**部署網址：** `https://sela1227.github.io/Lung-ca-nevigation/`

## 肺癌 (lung)

| 版本 | 日期 | 重點 |
|------|------|------|
| v34 | 2026-03-28 | 路徑模板 TNM 感知：surgical 依 N stage 只顯示對應的不手術方案（N0→放療/N1→CCRT）；resect_adv 只有 T4 才顯示 unresectable 區塊 |
| v33 | 2026-03-28 | 新增再手術/術後放療/單獨放療；輔助建議依實際勾選過濾 |
| v32 | 2026-03-28 | pTNM 內嵌手術下方；T1mi 僅病理；切緣選擇 |
| v28-v31 | 2026-03-28 | pTNM 系統；雙分期顯示；pStage 輔助建議 |
| v24-v27 | 2026-03-27~28 | AJCC 9th；Tis 感知；多癌別入口 |
| ≤v23 | — | 本院指引 v12 路徑；檢查清單；QR；導航 UX |
