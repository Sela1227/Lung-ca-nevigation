# Cancer Navigation — 彰濱秀傳癌症中心

```
index.html              ← Portal（醫護 vs 民眾）
lung/index.html         ← 肺癌醫護版 V1.4.0
lung/patient.html       ← 肺癌民眾版（下拉式路徑查詢）
lung/edu.html           ← QR 掃碼頁
```

## V2.6.0 — 2026-04-07
**民眾版重寫為下拉式路徑查詢器**
- 基線資料：年齡、ECOG、組織型態（下拉選單）
- TNM 分期：T/N/M 三欄下拉 → 自動計算 AJCC 9th 分期
- 基因/PD-L1 狀態：下拉選單（EGFR/ALK/ROS1/BRAF/KRAS/MET/PD-L1）
- 結果顯示：分期、主路徑、警示數 → 路徑藥物步驟（編號列表）→ 注意事項
- 涵蓋 NSCLC（6 路徑組合 × 9 基因狀態）+ SCLC（3 路徑）
- 年齡 ≥70 / ECOG 2-4 自動產生警示
- 全 SVG 圖示（無 Font Awesome 依賴）、正黑體
- **模組變動**：lung V1.3.1 → V1.4.0
