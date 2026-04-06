# CLAUDE.md — AI 開發交接文件
> 這個檔案專門給 Claude 讀。讀完即可繼續開發，不需要問問題。

---

## ⚠ 頭等重要規則（Claude 必讀）

### 雙軌版本系統（V2.2.0 起）
- **SYSTEM_VERSION**：Cancer Navigation 整個系統的版號，所有下載檔案命名用這個
- **MODULE_VERSION**：每個癌別模組自己的版號，獨立演進
- 任何模組改動 → 系統版 bump（依變更幅度 +0.01 / +0.1 / +1.0.0）
- 該模組自己的版號也同步 bump（獨立計算）
- 其他沒改動的模組版號維持不變

**例子：**
- V2.2.0 發布時：lung 模組 V1.0, breast 還沒開發
- V2.2.1 修了 lung 的 bug：系統變 V2.2.1, lung 變 V1.0.1, breast 還是沒有
- V2.3.0 新增 breast：系統變 V2.3.0, lung 維持 V1.0.1, breast 首發 V1.0
- V2.3.1 修了 lung 的另一個 bug：系統變 V2.3.1, lung 變 V1.0.2, breast 維持 V1.0

### 每次打包前必須做的事
1. **更新版本常數**：
   - 該模組 HTML 頂部的 `MODULE_VERSION` 常數
   - 該模組 HTML 頂部的 `SYSTEM_VERSION` 常數
   - Portal `index.html` footer 的系統版本
2. **更新 CLAUDE.md**（本檔）：
   - 「系統版本歷史」加一筆（系統版）
   - 該模組的「模組版本歷史」加一筆（只有改到的模組要加）
   - 「已知 Bug 與修法」編號化
3. **更新 README.md** 加一筆版本紀錄（系統版）
4. **日期要精確到 YYYY-MM-DD**，絕對不寫「最近」「上週」

### 命名規則（V2.3.3 起確立的通用標準）
- **Zip 檔**：`Cancer Navigation V{系統版}.zip`（例：`Cancer Navigation V2.3.3.zip`）
- **結構**：用外層資料夾包裝
  ```
  Cancer Navigation V2.3.3.zip
  └── Cancer Navigation V2.3.3/
      ├── index.html
      ├── CLAUDE.md
      ├── README.md
      └── lung/
          ├── index.html
          └── edu.html
  ```
- **打包指令**：`cd {staging 的上層目錄} && zip -r outfile.zip "Cancer Navigation V{版本}" -x ...排除項目`
- **解壓後**：得到單一 `Cancer Navigation V{版本}/` 資料夾（zip 內的 wrapper 就是最終解壓資料夾）
- **注意**：V2.1.1 曾經改成平鋪結構（無 wrapper），但 V2.3.3 起改回有 wrapper 的標準結構，以符合跨專案通用打包規則

### 打包排除清單（V2.3.3 起確立）
以下檔案/目錄絕對不可進入 zip：
```
.git/            .gitignore       .env             venv/
__pycache__/     node_modules/    .vscode/         .idea/
*.log            .DS_Store        Thumbs.db        *.pyc
.pytest_cache/   .coverage        *.swp            *.bak
```
Cancer Navigation 專案目前是純 HTML 無依賴，staging 目錄本來就乾淨，但打包指令仍須加 `-x` 排除參數作為通用標準。

### 版號規則
- `+0.01` → 小修：bug fix、文字修正、CSS 微調、打包結構調整
- `+0.1` → 新功能：新 UI 元件、新檢查項目、新路徑模板、視覺大改
- `+1.0.0` → 大重構：架構變更、新增癌別首發、重大 UX 改版

### UI 顯示規則（V2.2.0 起）
- **Topbar**：`肺癌臨床路徑 V{模組版} · System V{系統版}`
- **Summary header**：同上
- **Title**：只顯示模組版（browser tab 空間有限）
- **Portal footer**：只顯示系統版
- **病人手冊 edu.html**：不顯示版本（病人不需要知道）

---

## 一、系統是什麼

**Cancer Navigation — 彰濱秀傳癌症中心癌症臨床路徑導航系統**

- 台灣彰濱秀傳醫院癌症中心使用
- 癌症個案管理師決策支援工具
- 依據 **本院指引 v12 (2026)** + **AJCC 9th**
- 純前端單一 HTML（無後端、無建置流程），GitHub Pages 直接部署
- 主要使用者：癌症個管師、主治醫師

**部署網址：** `https://sela1227.github.io/Lung-ca-nevigation/`

---

## 二、技術棧

```
純原生 HTML/CSS/JavaScript（無框架、無建置工具）
IndexedDB（病人資料 / 草稿 / 設定，本地儲存）
Chart.js 4.4（統計圖表）
qrcode.js 1.0（QR 碼產生）
Font Awesome 6.5.1（圖標，不使用 emoji）
Noto Sans TC（中文字體）
```

---

## 三、設計系統 — Nordic Misty Blue（必須遵守）

### 視覺原則
- **Nordic 風格**：極簡、單色為主、留白充足、低彩度
- **絕對不使用 emoji**（⭐🔹⚠🎯🚨 等）→ 改用 Font Awesome icons 或 SVG
- Unicode 符號（✓ ✗ ✚ ➜ ①②③）可以使用，它們是單色字符

### Portal 配色（`index.html` 根目錄）
```css
--primary:#5B8FB9            /* 霧藍主色 */
--primary-hover:#4A7A9E      /* hover 深霧藍 */
--primary-light:rgba(91,143,185,0.10)
--sidebar-bg:#37516b         /* 深藍灰側欄 */
--bg:#F7F9FB                 /* 霧白背景 */
--bg-card:#FFFFFF
--bg-hover:#F1F4F8
--border:#E2E8F0
--border-light:#EDF1F5
--text:#2C3E50
--text-secondary:#5A6B7C
--text-hint:#8A9BAA
```

**Header 漸層：** `linear-gradient(135deg,#37516b 0%,#4A7A9E 55%,#5B8FB9 100%)`

### 肺癌頁面配色（`lung/index.html`）
**V2.1.0 起統一使用 Nordic misty blue（與 Portal 一致）：**
```css
--primary:#5B8FB9
--primary-dark:#4A7A9E
--primary-light:#EAF1F7
--bg:#F7F9FB
--surface:#fff
--surface2:#F1F4F8
--border:#E2E8F0
--border2:#CBD5DF
--text:#2C3E50
--text2:#5A6B7C
--text3:#8A9BAA
--sidebar:#37516b
--sidebar-text:#9ca3af
--sidebar-active:#5B8FB9
```

狀態色（保留原樣，全主題通用）：
```css
--accent:#2563eb; --accent-light:#eff4ff    /* 藍色 info */
--amber:#d97706; --amber-light:#fef9ee       /* 琥珀 warning */
--rose:#dc2626;  --rose-light:#fef2f2        /* 紅色 danger */
--indigo:#4f46e5; --indigo-light:#eef2ff     /* 紫 secondary */
```

### 元件樣式規範
```
.card              → 卡片容器（padding:28px, border-radius:16px）
.btn-nav.next      → 主動作按鈕
.btn-nav.back      → 次要動作按鈕
.ptnm-btn          → toggle 按鈕（用於 TNM 子分期選擇）
.drv-btn           → 驅動基因按鈕
.tx-exec-item      → 治療執行項目（互斥用圓形 / 非互斥用方形）
.tx-box.green      → 主要推薦框（V2.1.0 起改為 misty blue 色調）
.tx-box.blue       → 次要選項框
.tx-box.amber      → 注意事項框
.tx-box.rose       → 警告/替代方案框
```

### 禁忌
- ❌ 不引入 React/Vue/Svelte 等框架
- ❌ 不引入 Tailwind（全部用 CSS 變數和 class）
- ❌ 不拆多檔案（每個癌別必須是單一 HTML + edu.html）
- ❌ 不在路由邏輯使用 Stage 字串，必須用 TNM 原始欄位判斷
- ❌ 不使用 emoji（⭐🔹⚠🏥🎯🚨💰🔬✅❌👉 等）→ 一律改 Font Awesome

### Nordic 自製 SVG 圖示系統（V2.3.0 起）

對於**核心業務元素**（組織型態、治療階段、疾病類別等），優先使用自製 Nordic SVG 而非 Font Awesome。FA 圖示只用於**通用 UI 小圖示**（按鈕、標籤、導航列）。

**設計規則：**
```
viewBox: 0 0 24 24
stroke: currentColor（繼承父元素色）
stroke-width: 1.75
stroke-linecap: round
stroke-linejoin: round
fill: none（特殊情況才用 currentColor，如 SCLC 的密集點）
```

**位置：** `lung/index.html` 第 1180 行附近的 `NORDIC_ICONS` 物件

**結構：**
```javascript
const NORDIC_ICONS = {
  // Cancer types
  nsclc_ns: '<svg>...</svg>',   // 非鱗 NSCLC - 腺體細胞簇
  nsclc_sq: '<svg>...</svg>',   // 鱗狀 NSCLC - 重疊方塊
  sclc:     '<svg>...</svg>',   // 小細胞 - 密集點陣
  // Treatment phases
  neoadj:  '<svg>...</svg>',    // ① 前導 - 箭頭指向圓圈
  surgery: '<svg>...</svg>',    // ② 手術 - 手術刀
  drug:    '<svg>...</svg>',    // ③ 系統性藥物 - 膠囊
  rt:      '<svg>...</svg>',    // ④ 放療 - 放射狀
  adj:     '<svg>...</svg>',    // ⑤ 輔助 - 圓圈後箭頭
  maint:   '<svg>...</svg>',    // ⑥ 維持 - 循環
  later:   '<svg>...</svg>',    // ⑦ 後線 - 遞增橫線
  bsc:     '<svg>...</svg>',    // ⑧ 姑息 - 心形
};

function nIcon(key, size) {
  size = size || 20;
  var svg = NORDIC_ICONS[key] || '';
  return svg.replace('<svg', '<svg width="'+size+'" height="'+size+'"');
}
```

**使用：**
```javascript
// JS 模板中
h += `<span style="color:var(--primary)">${nIcon('neoadj', 18)}</span>`;

// 靜態 HTML 中（複製 NORDIC_ICONS 的 svg 原始碼直接 inline）
<div class="icon-circle"><svg width="26" height="26" ...>...</svg></div>
```

**新增癌別的圖示：**
1. 在 `NORDIC_ICONS` 加入對應 key（例如 breast 組織型態：`dcis`, `idc`, `ilc`）
2. 同樣的 key 用在治療階段會 override lung 的版本，所以不同癌別的階段 icon 可以共用或特化

---

## 四、設定配置（CONFIG）

### 換癌別改這裡（`lung/index.html`）
檔案約第 1169 行有 `// CONFIG — 換癌別改這裡` 區塊，包含：
```javascript
const CFG = {
  cancer: '肺癌',              // 癌別名
  hospital: '彰濱秀傳癌症中心',  // 醫院名
  team: {                     // 照護團隊科別
    depts: [
      {id:'ts',   dept:'胸腔外科',          fullDept:'胸腔外科'},
      {id:'chm',  dept:'胸腔內科／血液腫瘤科', fullDept:'胸腔內科／血液腫瘤科'},
      {id:'ro',   dept:'放射腫瘤科',        fullDept:'放射腫瘤科'},
    ],
    caseManager: {title:'個案管理師', name:'郭美伶'}
  }
};
```

### QR 碼 base URL（第 2898 行附近）
```javascript
// 設定掃碼頁面 base URL（部署後修改；路徑越短 QR 越好掃）
const EDU_BASE_URL = 'https://sela1227.github.io/Lung-ca-nevigation/lung/edu.html';
```

### 指引版本字串
```javascript
const GUIDELINE_VERSION = '本院指引 v12 (2026)';
```

---

## 五、系統版本歷史（Cancer Navigation System）

> 這個區塊記錄整個系統的 release。每次打包都要新增一筆。  
> 下方「六、模組版本歷史」會獨立記錄各癌別模組的演進。

### V2.3.3 — 2026-04-06
**確立通用打包標準（wrapper 結構 + 排除清單）**
- Zip 結構從平鋪改回有 wrapper 的外層資料夾結構（與通用跨專案打包規則一致）：
  ```
  Cancer Navigation V2.3.3.zip
  └── Cancer Navigation V2.3.3/
      ├── index.html
      ├── CLAUDE.md
      ├── README.md
      └── lung/
  ```
- 新增打包排除清單（.git/.env/venv/__pycache__/node_modules/.vscode/.idea/*.log/.DS_Store 等），即使 Cancer Navigation 純 HTML 無依賴，也固定用 `-x` 參數作為通用標準
- 打包指令改為 `cd work && zip -r outfile.zip "Cancer Navigation V${VERSION}" -x '.git/*' ...`
- 取代 V2.1.1 的平鋪結構決策
- **模組變動**：lung 內容無變更，僅 SYSTEM_VERSION 常數從 V2.3.2 更新為 V2.3.3（MODULE_VERSION 維持 V1.1.2）

### V2.3.2 — 2026-04-06
**修正分子檢測無法直接補填的不直覺操作**
- `dtJump(5)` 原本會清掉 drivers/pdl1Val/mutation，使用者點頂部第 5 顆點或 pathway 側欄的「⑤ 分子標記」編輯列，都會看到空白面板，被迫從頭重填 → 修正為跳到 Step 5 時**保留**既有分子檢測資料，並主動呼叫 `renderMolPanel()` 讓按鈕正確亮起
- `restoreDT()` 載入完整紀錄時落在 Step 1 而不是「分期完成」卡 → 修正為 `dtShowCard('done')`
- **模組變動**：lung V1.1.1 → V1.1.2

### V2.3.1 — 2026-04-06
**修正列印衛教手冊版型**
- 列印頁面 header 背景從 `#333`（深灰）改為 `#5B8FB9`（霧藍），與螢幕版一致
- 修正 QR code 被擠壓到頁面邊緣的問題：`.edu-qr-wrap` 從 flex 改為 CSS Grid（3 欄：1fr 1fr 160px），`.edu-2col` 用 `display:contents` 攤平讓內部 team/goal 兩欄成為 grid 的直接子元素
- 同步列印版的顏色配套：info 列、emergency box、borders 全部改為 Nordic misty blue 配色
- QR canvas 加 `max-width:140px` 防止溢出
- `.edu-qr-label` 加 `white-space:nowrap` 防止「電子版」被斷行
- **模組變動**：lung V1.1 → V1.1.1

### V2.3.0 — 2026-04-06
**Nordic 簡潔 SVG 圖示系統**
- 新增 `NORDIC_ICONS` 物件與 `nIcon(key, size)` 輔助函式
- 3 個肺癌組織型態圖示從 Font Awesome 改為自製 Nordic SVG：
  - NSCLC_NS（非鱗）→ 腺體細胞簇（5 個圓圈聚合）
  - NSCLC_SQ（鱗狀）→ 重疊方塊（表示鱗片層疊）
  - SCLC（小細胞）→ 3×3 密集圓點陣列（表示小細胞）
- 8 個治療執行策略圖示改為自製 Nordic SVG：
  - ① 前導 → 箭頭指向圓圈
  - ② 手術 → 手術刀
  - ③ 系統性藥物 → 膠囊
  - ④ 放療 → 放射狀射線
  - ⑤ 輔助 → 圓圈後箭頭
  - ⑥ 維持 → 循環箭頭
  - ⑦ 後線 → 遞增長度三橫線
  - ⑧ 姑息 → 心形
- 所有 SVG 使用 `stroke="currentColor"` 繼承文字顏色，stroke-width 1.75，圓角端點
- **模組變動**：lung V1.0 → V1.1

### V2.2.0 — 2026-04-06
**雙軌版本系統導入**
- 建立 `MODULE_VERSION` + `SYSTEM_VERSION` 雙軌版本機制
- 肺癌模組從 V2.1.1 重新起算為 V1.0（Nordic 大改版後首個穩定版）
- 原 v9-v45 舊版歷史保留於「肺癌模組歷史」作為 pre-V1.0 開發紀錄
- Topbar / Summary header 顯示雙版本：`肺癌臨床路徑 V1.0 · System V2.2.0`
- Title 只顯示模組版；Portal footer 只顯示系統版
- **模組變動**：lung V2.1.1 → V1.0（版號重構）

### V2.1.1 — 2026-04-06
**打包結構修正**
- Zip 解壓後減少一層無謂資料夾（從雙層變單層）
- 打包指令改為 `cd staging && zip -r outfile .`（從目錄內部打包）
- **模組變動**：lung 內容無變更（僅檔案結構）

### V2.1.0 — 2026-04-06
**視覺大改：肺癌頁面統一 Nordic misty blue + 移除所有 emoji**
- 肺癌頁面 CSS 變數從綠色改為 misty blue（與 Portal 一致）
  - `--primary: #0d9b6a → #5B8FB9`
  - `--primary-dark: #087a54 → #4A7A9E`
  - `--primary-light: #e8f7f1 → #EAF1F7`
  - `--sidebar: #111827 → #37516b`
  - `--sidebar-active: #10b981 → #5B8FB9`
  - 背景 `#f0f2f5 → #F7F9FB`，邊框 `#e3e6ec → #E2E8F0`
- edu.html 同步改色
- 移除所有 emoji 共 67 處：⭐×20 / 🔹×23 / ⚠×8 / 🎯×4 / ✅×11 / 💰×2 / 🏥×1 / 🔬×1 / ❌×2 / 🚨×2 / 👉×1
- Unicode 單色符號保留：✓ ✗ ✚ ➜ ①②③④⑤⑥⑦⑧ ⊕ ⊖
- **模組變動**：lung pre-V1.0 視覺改版

### V2.0.0 — 2026-04-06
**專案重命名為 Cancer Navigation + 標準化**
- 原「Lung-ca-nevigation」專案改名為 Cancer Navigation
- Portal 改 Nordic misty blue 風格
- 版號規則標準化
- 檔案命名標準化：`Cancer Navigation V{版本}.zip`
- 新增 CLAUDE.md 開發交接文件

---

## 六、模組版本歷史

> 每個癌別模組的獨立演進紀錄。模組版號獨立於系統版號。

### lung（肺癌）模組

#### V1.1.2 — 2026-04-06（System V2.3.2）
**修正分子檢測補填流程**
- `dtJump(5)` 保留既有分子檢測資料（之前會清空）
- `restoreDT()` 載入完整紀錄時顯示「分期完成」卡（之前落在 Step 1）

#### V1.1.1 — 2026-04-06（System V2.3.1）
**修正列印衛教手冊版型**
- Print header 從深灰改回霧藍（與螢幕版一致）
- QR code 位置修正（改用 CSS Grid 3 欄佈局）

#### V1.1 — 2026-04-06（System V2.3.0）
**Nordic 自製 SVG 圖示**
- 3 個組織型態圖示（NSCLC_NS / NSCLC_SQ / SCLC）從 Font Awesome 改為自製 Nordic SVG
- 8 個治療執行策略圖示改為自製 Nordic SVG
- 新增 `NORDIC_ICONS` 物件與 `nIcon(key, size)` 輔助函式供未來擴充
- 其他 FA 圖示（topbar、portal、小 inline icons）保留

#### V1.0 — 2026-04-06（System V2.2.0）
**首個穩定版**
- Nordic misty blue 視覺
- 所有 emoji 移除
- 雙軌版本系統
- AJCC 9th 完整子分期
- pTNM 病理分期 + 切緣
- 8 段治療時間軸（互斥/非互斥區分）
- 分子檢測多選驅動基因 + 獨立 PD-L1
- 12 條路徑模板對齊本院指引 v12 (2026)
- QR 碼個人化手冊

#### Pre-V1.0 開發歷史（舊版命名 v9-v45）

| 舊版本 | 日期 | 重點 |
|------|------|------|
| v45 | 2026-03-28 | 手冊團隊表格優化；執行策略視覺優化 |
| v44 | 2026-03-28 | 所有 CCRT 加註 4 Sequential；「決策」→「分期」 |
| v43 | 2026-03-28 | N2 路徑對齊指引；分子標記友善標籤 |
| v42 | 2026-03-28 | 取消手術清 pTNM；互斥單選 |
| v41 | 2026-03-28 | N2 STAGE_GOALS 依 T stage 過濾 |
| v40 | 2026-03-28 | 基礎檢查去重；⊕/⊖ 按鈕；CCRT 健保 badge |
| v39 | 2026-03-28 | 分子檢測大改版（多選驅動基因 + 獨立 PD-L1） |
| v38 | 2026-03-28 | resect_adv CCRT 修正；所有 NSCLC 問分子標記 |
| v37 | 2026-03-28 | 系統性藥物治療排序；pStage 黑色字 |
| v36 | 2026-03-28 | 總覽 pTNM 獨立行；三條手術路徑 pStage 精準顯示 |
| v35 | 2026-03-28 | 8 段治療時間軸重構 |
| v32-v34 | 2026-03-28 | pTNM+切緣+TNM 感知路徑 |
| v28-v31 | 2026-03-28 | pTNM 病理分期系統 |
| v24-v27 | 2026-03-27~28 | AJCC 9th 完整子分期；多癌別入口 portal |
| v9-v23 | 2026-03-27 | 本院指引 v12 路徑；檢查清單；QR 碼；UX 重整 |

### 其他癌別（尚未開發）

- **breast（乳癌）** — 尚未開始
- **crc（大腸直腸癌）** — 尚未開始
- **esoph（食道癌）** — 尚未開始
- **hn（頭頸癌）** — 尚未開始
- **liver（肝癌）** — 尚未開始
- **prost（攝護腺癌）** — 尚未開始
- **bladder（膀胱癌）** — 尚未開始

---

## 七、肺癌核心架構（快速參考）

### AJCC 9th TNM
```
T: Tis, T1mi, T1a, T1b, T1c, T2a, T2b, T3, T4
N: N0, N1, N2a, N2b, N3
M: M0, M1a, M1b, M1c1, M1c2
Stage: 0, IA1, IA2, IA3, IB, IIA, IIB, IIIA, IIIB, IIIC, IVA, IVB
```

### 路由邏輯（`txGroup` 函式）
```
NSCLC M0：
  N3     → T4?'T4N2N3':'N3'
  N2     → T4?'T4N2N3':'N2'
  T4     → 'resect_adv'
  T3+N1  → 'resect_adv'
  N0+T1/Tis → 'I_periph'
  其他    → 'surgical'

NSCLC M1：M1a/M1b/M1c → 對應模板（鱗/非鱗分流）
SCLC：M1→extensive, T1-2N0→ls_surg, 其他→ls_chemoRT
```

### 12 條路徑模板
`I_periph` / `surgical` / `resect_adv` / `N2` / `N3` / `T4N2N3` / `M1a` / `M1b` / `M1c` (NS/SQ 分流) / `ls_surg` / `ls_chemoRT` / `extensive`

### pTNM 病理分期
- 只在 **「② 手術 → 外科根除手術」勾選後**顯示
- `pstage` / `pmargin` / `ppending` 獨立於 cTNM
- 取消手術勾選時自動清除所有 pTNM 欄位

### 8 段治療執行時間軸
```
① 前導治療（互斥 excl:true）
② 手術（→ 勾選後顯示 pTNM）
③ 系統性藥物治療（化療/免疫/標靶 三子組，各組互斥）
④ 放射治療（互斥）
⑤ 輔助治療
⑥ 維持治療
⑦ 後線治療
⑧ 姑息/支持照護
```

### 分子檢測（所有 NSCLC）
```
A. 驅動基因（多選 ⊕/⊖）：
   EGFR / ALK / ROS1 / BRAF / MET / RET / NTRK / HER2 / KRAS
B. PD-L1（獨立填寫）：
   ≥50% / 1-49% / <1% / 未驗
快速選項：等報告中 / 未驗跳過
```

`deriveMutation()` 從 `S.drivers` + `S.pdl1Val` 推導出 `S.mutation` 做路由。

### 註腳對應
| 註 | 內容 | 實作位置 |
|---|------|---------|
| 註1 | Tis/T1mi 可不做腦/骨 | STAGE_GOALS |
| 註2 | IB 高風險因子 | getAdjuvantHTML |
| 註3 | SBRT 健保條件 | I_periph |
| 註4 | >70歲/PS>1 CCRT 可改 Sequential | `_N4` const，套用所有 CCRT 模板 |
| 註5 | 先 EGFR/PD-L1→陰性加驗 NGS | STAGE_GOALS footer |

---

## 八、關鍵檔案結構

```
Cancer Navigation V{版本}/
├── index.html              ← Portal 入口頁（Nordic misty blue）
├── README.md               ← 版本歷史
├── CLAUDE.md               ← 本檔案
└── lung/
    ├── index.html          ← 肺癌路徑主程式
    └── edu.html            ← QR 掃描目標頁
```

---

## 九、已知 Bug 與修法（踩過的坑）

### BUG-01：N2 STAGE_GOALS 同時顯示兩欄（v41 修復）
**症狀：** T2aN2 病人同時看到 IIIA 和 IIIB 兩張方案卡
**原因：** renderPW 的 STAGE_GOALS 區塊沒有依 T stage 過濾 boxes
**修法：** 在 renderPW 加入過濾邏輯
```javascript
if(grp==='N2'){
  const isT3 = S.tstage==='T3';
  displayBoxes = goals.boxes.filter((_,i)=> isT3 ? i===1 : i===0);
}
```

### BUG-02：resect_adv 缺不手術選項（v38 修復）
**症狀：** T3N1 病人沒有 CCRT 選項
**原因：** resect_adv 模板只在 T4 時顯示「不適合手術 → CCRT」
**修法：** 所有 resect_adv 都顯示不手術選項，T4 加註 unresectable

### BUG-03：取消手術勾選不清 pTNM（v42 修復）
**症狀：** 勾了手術填 pTNM 後取消，系統仍認為有開刀
**原因：** `toggleTxExec('surgery')` unchecked 時沒清空 p* 欄位
**修法：**
```javascript
if(id==='surgery'){
  A.S.ptstage=''; A.S.pnstage=''; A.S.pmstage='';
  A.S.pstage=''; A.S.pmargin=''; A.S.ppending=false;
}
```

### BUG-04：分子標記原始碼外露（v43 修復）
**症狀：** 側欄顯示「NOT_TESTED」而非「未驗」
**原因：** 側欄直接顯示 `S.mutation` 原始值
**修法：** 加 `mutLabel` 映射表
```javascript
const mutLabel = {
  'EGFR':'EGFR','ALK':'ALK','OTHER_TKI':'其他標靶',
  'PDL1_HIGH':'PD-L1≥50%','PDL1_LOW':'PD-L1 1-49%','PDL1_NEG':'PD-L1<1%',
  'PENDING':'等報告','NOT_TESTED':'未驗','N/A':'—'
}[S.mutation] || S.mutation || '—';
```

### BUG-05：BIO_MARKERS 與決策頁重複（v39 修復）
**症狀：** 進階檢查 BIO panel 和決策頁 Step 5 都在問分子標記
**修法：** 移除 BIO_MARKERS panel，進階檢查只留「是否已驗 NGS」checklist

### BUG-06：基礎檢查 3 項重複（v40 修復）
**症狀：** 腦部 CT/MRI、骨掃、胸部 CT 在 01 初步評估和 02 治療前評估都列
**修法：** 刪除 01 的腦部/骨掃（02 已有必要檢查），刪除 02 的重複胸部 CT（01 已有），15→12 項

### BUG-07：互斥組仍用 checkbox（v42 修復）
**症狀：** 使用者可同時勾「前導化療」和「前導 CCRT」
**修法：** 加 `excl:true` 標記 + radio 樣式 + `clearExclSiblings()` 函式
```javascript
function clearExclSiblings(id){
  const tx = A.S.actualTx;
  TX_PHASES.forEach(phase=>{
    if(phase.items && phase.excl){
      const ids = phase.items.map(it=>it.id);
      if(ids.includes(id)) ids.forEach(sid=>{ if(sid!==id) delete tx[sid]; });
    }
  });
}
```

### BUG-08：CCRT 缺健保 badge（v40 修復）
**症狀：** 自費誤解
**修法：** 所有 CCRT 模板加 `<span class="badge nhi">健保</span>`

### BUG-09：CCRT 缺註 4（v44 修復）
**症狀：** 各 CCRT 模板沒有提示「>70 歲/PS>1 可改 Sequential」
**修法：** 建立 `_N4` 常數，所有 CCRT 模板後面加上小字提示

### BUG-10：子分組互斥的視覺沒有差別（v45 修復）
**症狀：** 互斥項和非互斥項都用方形 checkbox
**修法：** `.tx-exec-item[data-excl]` → `border-radius:50%` 改圓形

### BUG-11：列印衛教手冊版型不一致（lung V1.1.1 修復）
**症狀：**
- 螢幕版 edu.html 是霧藍 header，列印版卻是深灰 `#333`
- QR code 在列印版被擠壓到頁面邊緣，「電子版」label 被斷行成「電/子/版」

**原因：**
- Print CSS 寫死 `background:#333` 取代 `var(--primary)`
- `.edu-qr-wrap` 使用 flex 佈局，裡面包著 `.edu-2col`（內部 grid 2 欄）+ `.edu-qr-card`（170px）。flex:1 給 .edu-2col，但 grid 內部內容的 intrinsic min-width 超過 flex 配額，把 .edu-qr-card 擠出可視範圍。

**修法：**
```css
/* 1. Header 改回霧藍 */
body.print-edu .edu-hdr{background:#5B8FB9!important;...}

/* 2. QR wrap 改為 CSS Grid 3 欄 */
body.print-edu .edu-qr-wrap{
  display:grid!important;
  grid-template-columns:1fr 1fr 160px!important;
  gap:22px!important;
}
/* 3. 攤平 .edu-2col 讓內部 .edu-col 變成 grid 直接子元素 */
body.print-edu .edu-qr-wrap .edu-2col{display:contents!important}
body.print-edu .edu-qr-wrap .edu-col{min-width:0}
/* 4. QR 元素防溢出 */
body.print-edu .edu-qr-card canvas{max-width:140px!important}
body.print-edu .edu-qr-label{white-space:nowrap!important}
```

**技巧：** `display:contents` 讓元素從 layout tree 消失但保留子元素，非常適合把多層 wrapper 攤平成同一個 grid 的子項。現代瀏覽器皆支援。

### BUG-12：分子檢測結果無法直接補填（lung V1.1.2 修復）
**症狀：**
- 病人建立時分子檢測選「等報告中」，儲存後等報告回來要補填
- 使用者點「分期」頁頂部第 5 顆點，或點 pathway 側欄的「⑤ 分子標記」編輯列
- 結果看到空白的 driver/PD-L1 面板，原本填的資料全不見，被迫從 Step 1 重走整個分期流程

**原因（兩個連鎖 bug）：**

1. `A.dtJump(5)` 第 1715 行的清除邏輯：
```javascript
if(step <= 5){ A.S.drivers={}; A.S.pdl1Val=''; A.S.mutation=''; }
```
原意是「跳到 Step N 清掉 N 以後的資料強迫重填」，但 Step 5 是最後一步，跳到 Step 5 的意圖就是編輯它，不該清空。另外 dtJump 沒有主動呼叫 `renderMolPanel()`，即使資料在，按鈕狀態也不會更新。

2. `restoreDT()` 第 1900 行：載入完整紀錄時呼叫 `dtShowCard(1)` 而不是 `dtShowCard('done')`。應該顯示「分期完成」總覽卡讓使用者看到完整結果再選擇要編輯哪一步，而不是倒回 Step 1。

**修法：**
```javascript
// 1. dtJump：step 5 不清資料，並主動 re-render
if(step <= 4){ A.S.drivers={}; A.S.pdl1Val=''; A.S.mutation=''; }  // 從 <=5 改為 <=4
dtShowCard(step);
if(step === 5) setTimeout(renderMolPanel, 50);  // 新增：讓 UI 同步既有選擇

// 2. restoreDT：完整紀錄顯示 done 卡
dtShowCard('done');  // 原本是 dtShowCard(1)
```

**修後流程：** 載入舊病人 → 點「分期」→ 看到「分期完成」卡 → 點頂部第 5 顆點 → 直接看到既有 driver/PD-L1 選擇 → 補填或修改 → 完成。

---

## 十、打包 SOP（每次必做）

### Step 1: 決定版號
依變更內容決定：
- 改了哪個模組？→ 該模組的 `MODULE_VERSION` bump
- 系統 release 編號 → `SYSTEM_VERSION` bump
- 兩者都依 `+0.01 / +0.1 / +1.0.0` 規則

**例子：** 修了 lung 的一個小 bug
- `lung` 模組：`V1.0 → V1.0.1`
- 系統：`V2.2.0 → V2.2.1`
- Zip：`Cancer Navigation V2.2.1.zip`

### Step 2: 更新版本常數（3 處）
```bash
# 1) 該模組 HTML 頂部的雙版本常數
#    lung/index.html 第 1171 行附近
sed -i "s/MODULE_VERSION = 'V[0-9.]*'/MODULE_VERSION = 'V1.0.1'/" lung.html
sed -i "s/SYSTEM_VERSION = 'V[0-9.]*'/SYSTEM_VERSION = 'V2.2.1'/" lung.html

# 2) Portal footer（只有系統版）
sed -i "s/Cancer Navigation V[0-9.]*/Cancer Navigation V2.2.1/" portal.html

# 3) 該模組 HTML 的靜態版本字串（初始 topbar / summary / title / 註解）
# 注意：這些是靜態文字，JS 執行後會被 refreshTopbar 動態覆蓋
# 但仍需保持一致
sed -i "s/V1\.0/V1.0.1/g" lung.html  # 小心：只改模組版，別誤改 V2
```

### Step 3: 更新 CLAUDE.md（本檔）
**必做：**
1. 在「五、系統版本歷史」最上方加一段新系統版本，包含：
   - 系統版號（例：V2.2.1）
   - 精確日期（YYYY-MM-DD）
   - 變更摘要
   - **「模組變動」一行**：列出這次改了哪些模組、從什麼版本到什麼版本
2. 在「六、模組版本歷史」對應模組區塊加一段新模組版本
3. 如有 bug fix，加到「九、已知 Bug 與修法」並編號

### Step 4: 更新 README.md
加一段新版本紀錄（系統版 + 改了哪些模組）

### Step 5: 打包（V2.3.3 起使用 wrapper 結構 + 排除清單）
```bash
VERSION="2.3.3"   # 系統版
NAME="Cancer Navigation V${VERSION}"
WORK="/home/claude/work"

# 1. 準備 wrapper 目錄（直接用最終要呈現的資料夾名）
rm -rf "${WORK}" && mkdir -p "${WORK}/${NAME}/lung"

cp portal.html "${WORK}/${NAME}/index.html"
cp lung.html "${WORK}/${NAME}/lung/index.html"
cp edu.html "${WORK}/${NAME}/lung/edu.html"
cp README.md "${WORK}/${NAME}/"
cp CLAUDE.md "${WORK}/${NAME}/"

# 2. 從 work 目錄打包 wrapper（zip 內會有一層 "${NAME}/"）
cd "${WORK}"
rm -f "/mnt/user-data/outputs/${NAME}.zip"
zip -r "/mnt/user-data/outputs/${NAME}.zip" "${NAME}" \
  -x '*.git/*' '*.gitignore' '*.env' '*venv/*' '*__pycache__/*' \
     '*node_modules/*' '*.vscode/*' '*.idea/*' '*.log' '*.DS_Store' \
     '*Thumbs.db' '*.pyc' '*.pytest_cache/*' '*.coverage' '*.swp' '*.bak'
```

**解壓結果：** `Cancer Navigation V2.3.3/` 單一資料夾，裡面直接是 `index.html` / `lung/` / `CLAUDE.md` / `README.md`。

### Step 6: 驗證 JS 語法
```bash
python3 -c "
s = open('lung.html').read()
start = s.find('<script>')
end = s.rfind('</script>')
js = s[start+8:end]
bc = js.count('{') - js.count('}')
pc = js.count('(') - js.count(')')
sq = js.count('[') - js.count(']')
print(f'Braces:{bc} Parens:{pc} Brackets:{sq}')
print('OK' if bc==0 and pc==0 and sq==0 else 'ISSUE')
"
```

### Step 7: 驗證版本常數一致
```bash
grep "MODULE_VERSION\|SYSTEM_VERSION" lung.html | head -3
grep "Cancer Navigation V" portal.html
```

### Step 6: 驗證
```bash
# JS 語法檢查
python3 -c "
s = open('lung.html').read()
start = s.find('<script>')
end = s.rfind('</script>')
js = s[start+8:end]
bc = js.count('{') - js.count('}')
pc = js.count('(') - js.count(')')
sq = js.count('[') - js.count(']')
print(f'Braces:{bc} Parens:{pc} Brackets:{sq}')
print('OK' if bc==0 and pc==0 and sq==0 else 'ISSUE')
"
```

---

## 十一、擴充新癌別 SOP

1. 複製 `lung/` 為 `{新癌別}/`
2. 改 `CFG.cancer` / `CFG.team` / `CFG.hospital`
3. 取得該癌別本院指引 PDF，確認 AJCC 版本
4. 對照指引改寫 `PW` 物件（治療模板）
5. 對照指引改寫 `STAGE_GOALS`（方案卡）
6. 改寫 `CHECKLIST`（基礎+進階）
7. 測試所有路徑 + pTNM + 分子標記
8. 更新 `index.html` 的 `CANCERS` 陣列 `active:true`
9. 版本號 `+0.1`（新增癌別屬於新功能）

**建議順序：** 頭頸 / 食道（最接近肺癌結構）→ 大腸直腸 / 乳癌 → 攝護腺 / 膀胱 / 肝癌
