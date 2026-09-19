# CLAUDE.md — Cancer Navigation
> Sela 的專案。讀完直接動手，不要問問題。

> **⚠ 給同時拿到 SELA-Starter-Kit 的 Claude：**
> 這是**已對齊 Kit V1.21.0 的成熟專案**（首次對齊 Kit V1.9.0：V3.0.0, 2026-06-01；升 Kit V1.21.0：V3.0.2, 2026-06-29），不是新專案。
>
> **衝突仲裁規則：**
> 1. **以本專案 CLAUDE.md 為主、Kit 為輔**
> 2. 本專案刻意不對齊 Kit 的部分（V3.0.0 對齊時明寫，V3.0.2 升 Kit 時重新確認）：
>    - **品牌歸彰濱秀傳，不換 SELA logo** — 已準備正式以醫院名義發布，Kit V1.8.2 規則：正式機構發布豁免「必含 SELA logo」鐵律。同此原則 V1.13.0 App Logo 主動詢問規則不適用（醫院系統不另做 app logo）
>    - **配色保留 `#5B8FB9`（Nordic 霧藍變體）**，不換 Kit 預設 `#5A7A8B` — 已被個管師驗收使用數月。Kit `colors.md` §3 V1.8.1 補強規則明寫「既有專案首次對齊預設維持原設定色，除非 SELA 主動說『我想改』」，我們完全符合此規則（這條從 Patient Follow `#5B8FB9` 反饋來，剛好跟我們專案同色票）
>    - **CLAUDE.md 章節結構保留 V2.10.0 → V2.13.0 累積章法**，不依 Kit `CLAUDE-MD-章法.md` 重排 — 重排會洗掉 BUG-1 ~ BUG-35 連續編號的演進脈絡（Kit 對齊既有專案 SOP 鐵律：不要為對齊 Kit 改既有設計）
> 3. **本專案符合 Kit 規範、不算「刻意不對齊」的項目**（V3.0.2 升 Kit 時對焦發現）：
>    - **「No emoji anywhere」與 Kit `sela-philosophy.md`「不大量使用 emoji 是核心美學原則」一致** — V3.0.0 時誤標為「更嚴」，V3.0.2 修正：是符合不是更嚴
>    - **V3.0.1 民眾版 UX「鞏固→追加治療」改法符合 Kit 坑 #61** — 只改 UI 顯示文字（step.title / line / pwTxt），程式 phase 變數 `consolidation` 不動
>    - **V3.0.1 用 Python `c.replace(old, new)` + assert 編輯 HTML 符合 Kit 坑 #63（V1.21.0 從 OncoPA 反饋）** — 不用 `re.sub` 避免 repl 解讀跳脫字元
> 4. **本專案反饋已被 Kit 採納**（驗證雙向回流通道有效）：
>    - **Kit 坑 #50「opt 不算未完成進度」** ← 本專案 BUG-32（V2.12.0）+ V3.0.0 SELA-handoff
>    - **Kit 坑 #51「NCCN Cat 1 ≠ 健保給付要雙軌標示」** ← 本專案 BUG-33（V2.13.0）+ V3.0.0 SELA-handoff
>    - **Kit 坑 #52「健保條文每季可能修訂，工具須條文版本日期 + 定期 review」** ← 本專案 V2.13.0 教訓 + V3.0.0 SELA-handoff
> 5. **不要為對齊 Kit 而動既有設計** — 已驗證的就是事實標準
> 6. **版號規則照 Kit**（V3.0.0 重置 b、嚴格三位數逢十進位；V2.13.0 之前為對齊前歷史）
> 7. **下次完成版本時記得評估 SELA-handoff.md**（鐵律 #0 — 完整見 Kit master CLAUDE.md）

Cancer Navigation 是彰濱秀傳癌症中心的**臨床路徑導航工具**。純前端單一 HTML，GitHub Pages 部署。本院指引 v12 (2026) + AJCC 9th。目前只有肺癌模組上線。

**部署：** `https://sela1227.github.io/Lung-ca-nevigation/`
**技術：** 原生 HTML/CSS/JS、IndexedDB、Chart.js 4.4、qrcode.js、Font Awesome 6.5.1（醫護版）、Nordic SVG（民眾版）、微軟正黑體

---

## 一、打包規則(每次都要照做)

### 版號
雙軌制：`SYSTEM_VERSION`（整個系統 release）+ `MODULE_VERSION`（各癌別獨立演進）。
- `+0.01` 小修 / `+0.1` 新功能 / `+1.0.0` 大重構
- 任何模組改動 → 系統版跟著 bump，其他沒動的模組版號不變

### 打包指令
```bash
VERSION="2.9.5"
NAME="Cancer Navigation V${VERSION}"
WORK="/home/claude/work"

rm -rf "${WORK}" && mkdir -p "${WORK}/${NAME}/lung"
cp portal.html "${WORK}/${NAME}/index.html"
cp lung.html "${WORK}/${NAME}/lung/index.html"
cp edu-pro.html "${WORK}/${NAME}/lung/edu-pro.html"
cp edu-patient.html "${WORK}/${NAME}/lung/edu-patient.html"
cp patient.html "${WORK}/${NAME}/lung/patient.html"
cp drugs-pro.html "${WORK}/${NAME}/lung/drugs-pro.html"
cp drugs-patient.html "${WORK}/${NAME}/lung/drugs-patient.html"
cp README.md CLAUDE.md "${WORK}/${NAME}/"

cd "${WORK}"
zip -r "/mnt/user-data/outputs/${NAME}.zip" "${NAME}" \
  -x '*.git/*' '*.env' '*venv/*' '*__pycache__/*' '*node_modules/*' \
     '*.vscode/*' '*.idea/*' '*.log' '*.DS_Store' '*.pyc' '*.bak'
```

### 每次打包的 checklist
```
[ ] 模組 HTML 頂部的 MODULE_VERSION / SYSTEM_VERSION 常數有更新
[ ] Portal footer 的系統版本有更新
[ ] CLAUDE.md 版本歷史有加新條目（系統版 + 改到的模組版）
[ ] CLAUDE.md Bug list 有加新坑（如果踩了新坑）
[ ] README.md 有加版本紀錄
[ ] 日期寫到 YYYY-MM-DD
```

### UI 顯示位置
- Topbar：`肺癌臨床路徑 V{模組版} · System V{系統版}`
- Title：只顯示模組版
- Portal footer：只顯示系統版
- edu.html：不顯示版本
- **patient.html：V2.8.1 起不顯示版本**（footer 移除以節省版面，版號由 portal 負責）

### 民眾版流程（V2.9.0+）
五頁流程：Q1 基本資料 → Q2 類型 → Q3 分期 → Q4 基因/腦 → 總覽
- Q1 全選填（姓名 / 病歷號 / 年齡 / ECOG），跳過也可
- Q2/Q3/Q4 必選（Q4 依 q4Needed() 條件性出現：早期 NSCLC 不問 Q4）
- 進度 dots 4 或 5 點（依 q4Needed）

### JS 語法驗證（每次必跑）
```bash
# 括號平衡
python3 -c "
s=open('lung.html').read(); js=s[s.find('<script>')+8:s.rfind('</script>')]
print(js.count('{')-js.count('}'), js.count('(')-js.count(')'), js.count('[')-js.count(']'))
"
# 輸出 0 0 0 才是對的

# 真正 parse（V2.7.0 起，因為踩過坑 #14 — 括號平衡並不能抓到字串連寫錯誤）
python3 -c "
import re;s=open('lung.html').read()
parts=re.findall(r'<script>([\s\S]*?)</script>',s)
open('/tmp/j.js','w').write(parts[-1])
"
node --check /tmp/j.js
```

---

## 二、設計規則

**Nordic misty blue 風格，全系統統一。**

```
醫護版（lung.html）：
--primary:#5B8FB9  --primary-hover:#4A7A9E  --primary-light:#EAF1F7
--sidebar-bg:#37516b  --bg:#F7F9FB  --bg-card:#FFFFFF  --border:#E2E8F0
--text:#2C3E50  --text-secondary:#5A6B7C  --text-hint:#8A9BAA

民眾版（patient.html）：
--teal:#0d9488  --teal2:#0f766e  --teal-d:#115e59
--teal-bg:rgba(13,148,136,.08)  --teal-soft:#e6f5f3
--bg:#F4F8F8  --tx:#1e3a3a
```

狀態色保留：accent(藍)、amber(琥珀)、rose(紅)、indigo(紫)。

**禁忌清單：**
- ❌ emoji（⭐🔹⚠🏥🎯🚨💰🔬✅❌👉）→ 用 Font Awesome 或 Nordic SVG
- ❌ 框架（React/Vue/Tailwind）→ 原生 CSS 變數
- ❌ 拆多檔案 → 每個癌別就是一支 HTML + edu.html + patient.html
- ❌ 路由用 Stage 字串 → 一律用 TNM 原始欄位判斷
- ✅ Unicode 單色符號可以用：✓ ✗ ✚ ➜ ①②③ ⊕ ⊖

**Nordic SVG 圖示系統（lung.html）：**
`NORDIC_ICONS` 物件在 lung.html 約第 1180 行。viewBox 0 0 24 24、stroke currentColor、stroke-width 1.75、round 端點。`nIcon(key, size)` 輔助函式。11 個 key：3 組織型態（nsclc_ns/nsclc_sq/sclc）+ 8 治療階段（neoadj/surgery/drug/rt/adj/maint/later/bsc）。

**民眾版（patient.html）SVG：**
全部 inline 寫死在 button 裡，不引用 NORDIC_ICONS（民眾版獨立、不載 FA CSS）。

---

## 三、改功能要動哪些檔案

| 我要改... | 動這些 |
|----------|-------|
| 癌別選擇 / 主色 / 團隊 | `lung.html` 第 1171 行 `CFG` 物件 |
| TNM 定義 / 分期計算 | `computeAJCC()` |
| 路由（TNM→哪條路徑） | `txGroup()` |
| 12 條治療路徑模板 | `PW` 物件（約第 2170 行） |
| 術後輔助治療建議 | `getAdjuvantHTML()` / `getAdjuvantSummary()` |
| 基礎/進階檢查清單 | `CK_BASIC` / `CK_ADV` 陣列（約第 1235 行） |
| 8 段治療時間軸 | `TX_PHASES` 陣列 |
| 分子檢測面板 | `renderMolPanel()` |
| STAGE_GOALS 方案卡 | `STAGE_GOALS` 物件 |
| QR 碼 base URL | 約第 2898 行 `EDU_BASE_URL` |
| QR 掃碼頁 | `lung/edu.html` |
| Portal 角色選擇+癌別列表 | `portal.html` 的 `CANCERS` 陣列 + `selectRole()` |
| Portal 8 癌別 SVG 圖示（V2.8.4+） | `portal.html` 的 `CANCERS` 內每個 `svg` 欄位（inline path） |
| 民眾版健保藥物清單 | `patient.html` 的 `DRUGS` 物件 |
| 健保藥物總整理頁（V2.9.5+） | `lung/drugs-pro.html`（醫護版）的 `ALL_DRUGS` — 加 NCCN/nhi_ref/prereq/appearsIn 欄位；`lung/drugs-patient.html`（民眾版）的 `ALL_DRUGS` — 加 target/purpose/sideEff/matchKey 欄位 |
| 民眾版治療路徑邏輯 | `patient.html` 的 `buildPath()` 函式 |
| 民眾版 TNM 計算（V2.8.0+） | `patient.html` 的 `computeAJCC()` 與 `stageToCategory()` |
| 民眾版基本資料頁（V2.9.0+） | `patient.html` 的 `#p-q1` 區塊（姓名/病歷號/年齡/ECOG）+ `pickAge()` / `pickEcog()` |
| 民眾版年齡與 ECOG 影響建議（V2.9.0+） | `patient.html` 的 `applyAgeEcog()` 函式（buildPath 內呼叫，依 age/ecog 對 steps 與 warns 動態注入）|
| 民眾版 TNM 簡化/進階按鈕組 | `patient.html` 第 250 行 `#p-q2` 區塊 + `pickTNM()` / `toggleTNMMode()` |
| 民眾版 SCLC 兩段式選項（V2.8.5+） | `patient.html` 的 `#sclc-wrap` 區塊 + `pickSCLC()` / `setQ2Mode()` / `applyQ2Mode()` |
| 民眾版 SCLC 腦/脊髓轉移選項（V2.8.5+） | `patient.html` 的 `#opt-brain` 區塊 + `pickBrain()` / `applyQ3Mode()` |
| 民眾版病理期別模式（V2.10.0+） | `patient.html` 的 `#stage-mode-row` + `pickStageMode()` / `applyPostOpVisuals()` / `refreshStageDisplayText()`；`S.postOp` boolean；`buildPostOpPath()` 是術後分支引擎；edu-patient 的 `buildPostOpPathFromData()` 同步 |
| 民眾版 Q5 治療進度 + 三區呈現（V2.11.0+） | `patient.html` 的 `#p-q5` 頁 + `pickProgress()` + `S.txProgress`；`PROGRESS_DONE_PHASES` / `PROGRESS_NEXT_PHASE` 常數；`splitStepsByProgress()` + `renderTreatmentSteps3Section()`；buildPostOpPath 每個 step 加 `phase` 標記；`buildRecurrencePath()` 處理復發；edu-patient 同套對映 |
| 醫護版化療前 B/C 肝篩檢（V2.12.0+） | `lung/index.html` 的 CK config 加 c40 (`req:'chemo'`) + c41 (`req:'opt'`)；`isItemRequired` 加 `chemo` 條件（SCLC 全期 + NSCLC IB+ 必要）|
| 醫護版總覽未完成清單只列必要（V2.12.0+） | `lung/index.html` 渲染 `sum-checklist` 處 `basicReq = CK_BASIC.filter(c=>c.req!=='opt')`、`allReq = [...basicReq, ...advReq]`；basic 頁面 `updateBasicCKBar()` 與 `renderBasicCK()` tab 計數也只算必要 |
| 健保條文對齊（V2.13.0+） | 民眾版 `patient.html` / `edu-patient.html`：buildPostOpPath EARLY/LOCAL 分支 Osimertinib/Alectinib/Atezolizumab 鞏固 `nhi:'SELF'` + warns 加自費提醒；DRUGS.KRAS note「健保未給付」；DRUGS.BRAF/CONSOLIDATION/EGFR_BRAIN 補完整條件。醫護版 `drugs-pro.html` ALL_DRUGS 對齊條文編號（9.80/9.60/9.59/9.81/9.82/9.50/9.91/9.126）+ 新增 Nivolumab (115/6/1)。`drugs-patient.html` 同步 |
| Kit 對齊（V3.0.0+） | `.gitignore`（Kit gitignore-template 起手）+ CLAUDE.md 頂端「Kit 衝突仲裁開頭區塊」+ `SELA-handoff.md`（給 Kit Claude 升 Kit 用）。版號重置 b 為 0（V2.13.0 → V3.0.0 符合 Kit 嚴格三位數逢十進位）。模組版號 lung 保留 V1.11.0（模組本身未變動）|
| 民眾版 UX 大修（V3.0.1+） | `lung/patient.html` + `lung/edu-patient.html` 兩份同步全改。DRUGS 區塊 5 個 entry 改寫 note 為病人語言（拔 9.XX 條文編號 / NCCN Cat）。buildPathRaw EARLY 加 `isIA = stage.startsWith('IA')` IA 過濾邏輯。buildPostOpPath EARLY/LOCAL 把 3 個鞏固藥合併成「擇一」step。buildRecurrencePath 用 regex 替換 step.title「第一線：」→「復發後接續治療（第一順位）：」、stageTxt 改「術後復發 — 接續全身性治療」。applyAgeEcog 翻譯 PS 2/PCI/序貫/Carboplatin → 體力中等/預防性腦部照射/分開做/碳鉑。ECOG 按鈕 UI + footer 體力標籤同步翻譯。SCLC 分支 PCI → 預防性腦部照射、鞏固 → 追加治療 |
| 民眾版藥物視覺樣式（V2.8.0+） | `patient.html` CSS 的 `.tx-drugs-box` / `.tx-drug-en` / `.tx-drug-zh` |
| 民眾版照護團隊名單（V2.8.2+） | `patient.html` 的 `TEAM` 物件（從 `lung.html` `CFG.team.depts` 手動同步）|
| 民眾版 QR 內容（V2.8.6+） | `patient.html` 的 `buildEduPayload()` / `buildEduURL()` — 抄 lung.html 同款 schema，QR 是 URL 不是中文 |
| 醫護版 QR 落地頁（V2.8.7+） | `lung/edu-pro.html`（原 edu.html）— 詳細 getDrugDetail，含 SCLC + brainMet |
| 民眾版 QR 落地頁（V2.8.7+） | `lung/edu-patient.html` — 完整 DRUGS + buildPathFromData，跟 patient.html 總覽頁內容一致 |
| 民眾版 modal 中文摘要 | `patient.html` 的 `buildHumanReadableSummary()`（QR 圖片下方文字，不是 QR 內容）|
| 藥物入口連結（V2.9.5+） | lung.html topbar 連 `drugs-pro.html`、patient.html header 連 `drugs-patient.html`；patient 總覽頁底部「看適合您狀況的藥物」按鈕帶 query 連 `drugs-patient.html?type=X&stage=Y&mut=Z` |
| 民眾版警示文字 | `buildPath()` 各分支的 `warns` 陣列 |
| 列印手冊版型 | CSS 的 `body.print-edu` 區塊 |
| Nordic SVG 圖示 | `NORDIC_ICONS` 物件 |

---

## 四、肺癌核心架構

### AJCC 9th
```
T: Tis, T1mi, T1a, T1b, T1c, T2a, T2b, T3, T4
N: N0, N1, N2a, N2b, N3
M: M0, M1a, M1b, M1c1, M1c2
```

### 路由（txGroup）
```
NSCLC M0：N3→T4?T4N2N3:N3 / N2→T4?T4N2N3:N2 / T4→resect_adv / T3+N1→resect_adv / N0+T1/Tis→I_periph / 其他→surgical
NSCLC M1：M1a/M1b/M1c（鱗/非鱗分流 _M1c_NS/_M1c_SQ）
SCLC：M1→extensive / T1-2N0→ls_surg / 其他→ls_chemoRT
```

### 12 條路徑模板
I_periph / surgical / resect_adv / N2 / N3 / T4N2N3 / M1a / M1b / M1c(NS/SQ) / ls_surg / ls_chemoRT / extensive

### 8 段治療執行（TX_PHASES）
①前導(excl) → ②手術(→pTNM) → ③系統性藥物(化療excl/免疫excl/標靶excl) → ④放療(excl) → ⑤輔助 → ⑥維持 → ⑦後線 → ⑧姑息

③ 免疫子組有三個選項：「免疫+化療」「免疫+化療+標靶」「免疫單藥」。

### 分子檢測（Step 5，所有 NSCLC）
驅動基因多選 ⊕/⊖：EGFR/ALK/ROS1/BRAF/MET/RET/NTRK/HER2/KRAS。PD-L1 獨立。快速選項：等報告/未驗。`deriveMutation()` 做路由。

### 民眾版藥物資料庫（patient.html）
`DRUGS` 物件 14 組：EGFR、EGFR_BRAIN、ALK、ROS1、BRAF、MET、KRAS、NS_PDL1H、NS_PDL1L、SQ_PDL1H、SQ_PDL1L、CONSOLIDATION、SCLC_ES、SCLC_LS_CCRT、SCLC_2L。每組欄位：line（線數）、nhi（NHI/SELF）、list（[{n:英文名, z:中文名}]）、note（規範文字）。`buildPath()` 依 type+stage+mut 組合 step 列表。

### 註腳
| 註 | 內容 | 位置 |
|---|------|------|
| 1 | Tis/T1mi 可不做腦/骨 | STAGE_GOALS |
| 2 | IB 高風險因子 | getAdjuvantHTML |
| 3 | SBRT 健保條件 | I_periph |
| 4 | >70/PS>1 改 Sequential | `_N4`，所有 CCRT 模板 |
| 5 | 先 EGFR/PD-L1→陰性加驗 NGS | STAGE_GOALS footer |

---

## 五、版本歷史（最近 6 版）

完整歷史在 README.md。

| 系統版 | lung 模組 | 日期 | 重點 |
|--------|----------|------|------|
| V3.9.10 | V1.19.10 | 2026-09-19 | **內部審核 P1-5～P1-8（資安、部署、資料層）**：(P1-8) **`deploy.yml` 的 `path:'.'` 把整個 repo 公開到 Pages** — 含 `README.md`／`CLAUDE.md`（內有醫護密碼明碼）、`SELA-handoff.md`、`docs/`（未核定的臨床決策清單）、`test/`，且可被搜尋引擎索引。改為白名單組裝（只上傳 `index.html`／`lung`／`favicon`／`.nojekyll`），並把密碼從 README 與 CLAUDE.md 移除 (P1-7) 共用 JS 無版號 → 部署後可能「新 HTML + 舊快取 `_path.js`」；加 `?v=` 查詢字串與 `PATH_VERSION`／`STAGING_VERSION` 常數，四頁載入後比對，不符則在頁首顯示紅色警示（取代靜默降級） (P1-5) **醫護 QR 仍用標準 base64**（V3.8.1 只修了民眾版）→ 改 `b64uEnc`／`b64uDec`；QR 150→260px、容錯 L→M (P1-6) **IndexedDB 包裝只處理成功路徑**，寫入失敗時 Promise 永不結束、畫面卡住無訊息 → 加 `onerror`／`onabort`；草稿 id 改用 `put()` 回傳的 key（原本用 `getAll()` 取最後一筆，連點會產生重複草稿）並加單飛鎖；`autoUpdateRecord` 的空白 catch 改為明確提示；加 `navigator.storage.persist()`（iOS Safari 7 天未互動會清除儲存）BUG-94 |
| V3.9.9 | V1.19.9 | 2026-09-19 | **內部審核 P1-1／P1-2／P1-10**：(P1-2) **逐字核對健保 9.80 後發現我們標錯** — 9.80 的給付只有「第一線：EGFR ex19del/L858R 的 **IIIB／IIIC／第Ⅳ期肺腺癌**」與「第二線：T790M」，**條文中沒有「化放療後維持（LAURA）」這個適應症**，IIIA 也不在期別範圍；我們卻把 Osimertinib 維持標成 `nhi:'NHI'`。改為不標健保、如實說明條文現況（專案 BUG-33 其實早記載過 9.80 無術後鞏固適應症） (P1-1) **民眾版專業術語全面回流** — V3.9.0 起規則層直接回傳醫護語氣的 label/note，民眾版原封不動呈現。新增 `test/patient_wording.test.js`（1,440 組矩陣掃描病人可見文字比對禁字表），**首次執行抓到 9 類近千次**：鞏固 738、原生型 102、CCRT 78、健保條號 24、MDT 21、LAURA 12、TKI/G2032R/ERBB2 各 8。逐項改寫後 **22 項全部乾淨**；另修 `ruleEsSclcImmune()` 的打字錯誤（`化療合併免疫treatment`） (P1-10) 醫護列印手冊的緊急指引未套用 V3.7.1 的急診原則（仍寫「→ 請聯繫個管師」）→ 改為「立即至急診就醫」。四支測試 184+54+7+22 全綠 BUG-93 |
| V3.9.8 | V1.19.8 | 2026-09-19 | **內部審核 V3.9.7 的三項 P0**（審核方刻意不沿用專案自己的驗證框架，改成**實際執行頁面**而非比對原始碼字串）：(P0-1) **`edu-pro.html` 第四期分子分流全面失效** — V3.9.3 修 N-16 時把 payload 的 `m` 改成次型 enum，但 edu-pro 第四期仍比對舊值（`m==='EGFR'`、`m==='PDL1_HIGH'`）→ 永遠不成立 → **所有第四期病人都掉到「先做 NGS、等報告期間可先含鉑化療」**。EGFR 陽性的第四期（台灣肺腺癌最常見族群）拿到的列印手冊 QR 因此寫「可先做含鉑化療」，而這張手冊是發給病人的。改走 `ruleMetaSystemic` + 藥名取自 `DRUGS`，並補 `_eduProMut` 的 RET／NTRK／HER2 與 `pdl1Band()`（醫護版 pd 可能是數值） (P0-2) edu-pro 其餘未收斂處：C4 措辭（「免疫不適用」兩處）、術後 Osimertinib 無自費標示 (P0-3) **「整庫取代」還原後 `editId`／`draftId` 未重置** → 下一次切頁的自動儲存會用已刪除的舊 id 寫入，**把前一位病人的表單寫進另一位病人的紀錄**。**審核方提供的 `edu_pro_exec.test.js` 修前 0/7、修後 7/7**，已納入隨包測試 BUG-92 |
| V3.9.7 | V1.19.7 | 2026-09-19 | **NCCN 差異 G-08～G-10 完成，G-01～G-10 十項全數處理完畢**：(G-08) **新增「醫師評估是否可以手術切除」欄位** — NCCN 的 Durvalumab 鞏固涵蓋不可切除的第二期，健保條文限第三期；不可切除時整條路徑改走同步化放療 + 鞏固（依 driver 分流：EGFR→Osimertinib、其餘→Durvalumab 並標「健保第二期不符給付」），且術前輔助不再顯示（目的是利於手術） (G-09) ROS1 抗藥後加 Zidesamtinib（NCCN 8.2026 新增，腦部病灶為 preferred），標自費 (G-10) 鱗狀癌分子檢測提高建議強度 — NCCN 明訂**所有**轉移性鱗狀癌都應考慮檢測，措辭從「由醫師評估是否需要」改為「指引建議都考慮」，並保留費用差異（PD-L1 健保、ROS1 材料費、EGFR/ALK 自費）。**用輸入矩陣驗證**（組織型態 × 可切除 × driver 共 12 格）。跨引擎測試 159→184 項 BUG-91 |
| V3.9.6 | V1.19.6 | 2026-09-19 | **NCCN 差異 G-02～G-07（Sela 逐項核定後實作）**：(G-02) EGFR 一線加一行說明國際指引另有 Osimertinib+化療／Lazertinib+Amivantamab 兩個同級首選，**標健保未給付、不列入藥單** (G-03) 少見型 EGFR 改列 Afatinib／Osimertinib 為首選，並說明健保條文的次型差異（afatinib/gefitinib/erlotinib 未限次型；osimertinib/dacomitinib/aumolertinib 限 ex19/L858R）(G-04) 術後 RET → Selpercatinib，標自費 (G-05) 術後免疫加 Pembrolizumab 與 Atezolizumab 並列擇一，**註明 PD-L1<1% 效益未明** (G-06) **新增 Q5「術前用過哪一種免疫藥」欄位**，術後追加治療接續同一種（NCCN 明訂圍手術期 ICI 為單一療程、不建議換藥）；driver 陽性時仍以標靶優先 (G-07) SCLC 後線加 Tarlatamab，標自費 + CRS 56% 風險與院所條件。跨引擎測試 132→159 項 BUG-90 |
| V3.9.5 | V1.19.5 | 2026-09-17 | **NCCN 差異比對 G-01：補 RET／NTRK／HER2**（Sela 提供最新 NCCN，比對後產出 10 項差異，此項為唯一的純程式缺陷、不需臨床決定）。NCCN 的可用藥標記清單是 ALK/BRAF/EGFR/**ERBB2(HER2)**/KRAS/METex14/**NTRK**/**RET**/ROS1，系統缺三項；更嚴重的是**醫護版其實有收集這三項**，但 `mutEnumForRules()` 只認 `ros1/braf/met/kras`，**RET／NTRK／HER2 陽性會落到 `return 'EGFR_OTHER'`** → 一位 RET 融合病人在規則層被當成「少見型 EGFR」。修：`NON_EGFR_DRIVERS` 補三者、映射補三者、民眾版 Q4 補三個選項、drugs 頁對映補齊、新增三個治療分支。**健保狀態逐條核實**：RET（selpercatinib／pralsetinib）第 9 章查無肺癌條文→標示自費；NTRK（9.95 larotrectinib）有給付但條文要求「沒有合適的替代治療選項」；HER2（trastuzumab deruxtecan）給付限乳癌與胃癌、查無肺癌→標示自費。跨引擎測試 109→132 項 BUG-89 |
| V3.9.4 | V1.19.4 | 2026-09-14 | **術前（前導）輔助治療依健保 115/6/1 條文建立**（Sela 提出條文問「我們有沒有這條路徑」）。查核結果：**有一句、但過時且會誤導** — 原本只寫「部分 II 期可切除者：術前可先做化療或加免疫」，註記是「**術前免疫合併化療目前健保尚未給付，需自費或臨床試驗**」，而條文 115/6/1 起已給付 nivolumab，等於**叫病人去自費一個健保已經給付的治療**；且完全沒有資格條件判斷。新增 `ruleNeoadjuvant(state, isSquamous)` 依條文逐項判定：可切除（標示需外科／MDT 判定）、**腫瘤 ≥4 公分或 N1／N2（明文排除 N3）**、M0、**不具 EGFR 或 ALK**、至多 3 療程；處方依組織型態（非鱗 Nivolumab+Pemetrexed+鉑類／鱗狀 Nivolumab+鉑類）。EARLY 與可切除 IIIA 兩處都接上；EGFR/ALK 陽性不顯示、未檢測導向先確認。drugs-patient 補 Nivolumab。跨引擎測試 96→109 項 BUG-88 |
| V3.9.3 | V1.19.3 | 2026-09-14 | **內部綜合複審剩餘可修項目**：(N-09/N-10) **復發會讓個管的用藥勾選全部失效** — `drugOff` 的 key 由 `stepKeyOf()` 產生，多數步驟既無 `id` 也無 `phase` → key 就是 title，而 `buildRecurrencePath` 會改寫 title（「第一線：」→「復發後接續治療（第一順位）：」）→ key 不匹配。V3.8.0 的 P0-3 只替 EGFR 第一線加了 id，**其餘 19 個含藥步驟都沒有**。全部補上顯式 id，並讓 `stepKeyOf` 不再 fallback 到 phase/title（缺 id 就回空並 console.warn）— **這個 warn 當場又抓到 2 個我漏補的** (N-08) **EGFR_OTHER 三處三種語意** — III 期被排除在 classic 外、IV 期卻與 classic 同分支拿到含 Osimertinib 的五藥清單、drugs 頁又映射成一般 EGFR。健保一線條文限 exon19/L858R，uncommon 不在其中 → IV 期改為獨立分支「用藥需個別評估」，三處語意一致（uncommon 的實際用藥待肺癌團隊核定，列為 C5）(N-15) `getAdjuvantHTML()` 缺 `'IA'` 分支且比對不到時**靜默回空字串**（整塊卡片消失、無任何提示）→ 補分支 + 明確提示 (N-16) **醫護版 QR payload 沒有 `b`（腦轉移）→ `edu-pro.html` 那段正確的 SCLC 分流永遠不會執行**，所有擴散期病人都走「無腦轉移」分支；補 `b`/`pd`/原始 TNM/`po`，且 `m` 改送次型 enum。跨引擎測試 85→96 項 BUG-87 |
| V3.9.2 | V1.19.2 | 2026-09-14 | **內部「臨床路徑綜合複審」的引擎自身錯誤**（該報告針對 V3.8.3，但逐條驗證後這些在 V3.9.1 仍在）。它的核心警告是：**外部審核把 `_path.js` 當成「正確的那一版」建議全系統向它收斂，但 `_path.js` 自己有臨床錯誤** — 我 V3.9.0 正是這樣做的，等於把錯誤同步擴散。(N-02) **鱗狀癌 + 任一驅動基因會拿到 Pemetrexed**（META 六個分支各自寫死 backbone，BRAF 分支當初有做對、其餘漏了）→ 抽 `chemoBackbone(isNS)` 全部引用；exon20 的健保組合含 Pemetrexed，鱗狀改標示需個別評估（不臆測替代組合）(N-03) **非 EGFR 病人勾 T790M 會被建議換 Osimertinib** — V3.8.0 加了 `_alreadyOsi`/`_undecided` 兩個守衛卻漏了最基本的 `_isEgfr`，非 EGFR 一律落到 else；引擎入口加守衛，UI 也只在 EGFR classic 時顯示 T790M 並在切走時清空 (N-04) **術後追加治療完全不用 driver 資料**，把三種藥並列要病人自己對號入座 → 依 driver 只呈現對應的那一個 (N-05) **SCLC 侷限期 + 已知腦轉移仍走侷限期路徑含 Durvalumab 鞏固** → 改為提示分期不一致、不給侷限期專屬建議 (N-06) **第三期基因未驗即取得 Durvalumab 鞏固** — 健保要求「原生型」需檢測報告佐證 → 改導向先完成分子檢測 (N-13) 移除已被 `durvaExcludedFor` 取代的死常數 `DURVA_EXCLUDED`。跨引擎測試 57→85 項 BUG-86 |
| V3.9.1 | V1.19.1 | 2026-09-14 | **依 Sela 提供的健保第 9 章 115/8/21 版逐字核定**（等了好幾版的正式 PDF 終於到位，解掉待辦與 C2/C4）：(1) **C2 逐字核對抓到我們弄錯的地方** — 條文是「非鱗狀癌者需為 EGFR/ALK/**ROS-1** 腫瘤基因原生型、**鱗狀癌者需為 EGFR/ALK** 腫瘤基因原生型」，**排除集合依組織型態不同**；我們原本兩種都排除 ROS1 → 鱗狀 ROS1(+) 病人被多擋掉一個健保有給付的選項。新增 `durvaExcludedFor(isSquamous)`，三處呼叫端都傳組織型態 (2) **新增 9.138 Aumolertinib（普米維，115/8/1）** — 一線 EGFR ex19del/L858R 肺腺癌、二線 T790M，與 gefitinib/erlotinib/afatinib/dacomitinib/osimertinib 擇一不得互換；加入 EGFR 一線清單（五藥→六藥）、T790M 二線清單、兩個藥物庫 (3) **C4 找到逐字依據** — 免疫檢查點抑制劑用於擴散期 SCLC 明訂限「無腦部或無脊髓轉移」→ 確認是給付條件而非醫學禁忌，V3.9.0 的兩行陳述方向正確，補上條文出處 (4) Bevacizumab+erlotinib 限「L858R + 腦轉移 + 非鱗狀 + IV 期」與 Dacomitinib 限「無腦轉移」均與現行條文相符，無需更動。跨引擎測試增至 57 項 BUG-85 |
| V2.10.0 | V1.8.0 | 2026-05-08 | 民眾版加病理期別模式（已手術切換）— Q3 加 stage-mode toggle、`S.postOp` 路由 `buildPostOpPath()`，跳過手術建議走「術後輔助 + 標靶/免疫鞏固 + 規律追蹤」+ stageDisplay 加 p 前綴 + edu-patient 同步 BUG-30 |

---

## 六、踩過的坑（BUG-01 ~ BUG-30）

### #1 (v41)：N2 兩欄同時顯示
- 症狀：T2aN2 看到 IIIA+IIIB
- 做法：`displayBoxes = goals.boxes.filter((_,i)=> isT3 ? i===1 : i===0)`

### #2 (v38)：resect_adv 缺 CCRT
- 做法：所有 resect_adv 顯示不手術區塊

### #3 (v42)：取消手術不清 pTNM
- 做法：`toggleTxExec('surgery')` unchecked 時清空 p* 欄位

### #4 (v43)：側欄顯示 NOT_TESTED
- 做法：加 `mutLabel` 映射表

### #5 (v39)：BIO panel 與決策頁重複
- 做法：移除 BIO panel

### #6 (v40)：基礎檢查 3 項重複
- 做法：15→12→11 項

### #7 (v42)：互斥組用 checkbox
- 做法：`excl:true` + `clearExclSiblings()` + radio 樣式

### #8 (v40)：CCRT 缺健保 badge
- 做法：加 `<span class="badge nhi">健保</span>`

### #9 (v44)：CCRT 缺註4
- 做法：`_N4` 常數套用所有 CCRT 模板

### #10 (v45)：互斥/非互斥無視覺差異
- 做法：`[data-excl]` → `border-radius:50%`

### #11 (lung V1.1.1)：列印 edu header 深灰 + QR 被擠
- 原因：print CSS 寫死 `#333`；flex min-width 問題
- 做法：header 改 `#5B8FB9`；qr-wrap 改 Grid 3 欄 + `display:contents`
- 技巧：`display:contents` 攤平 nested wrapper 進 grid

### #12 (lung V1.1.2)：分子檢測無法補填
- 原因：`dtJump(5)` 用 `step<=5` 清資料；`restoreDT()` 落 Step 1
- 做法：改 `step<=4`；加 `renderMolPanel()` 重繪；restoreDT 改 `dtShowCard('done')`

### #13 (lung V1.4.1)：computeAJCC N2a vs N2b 分期錯誤
- 症狀：T1+N2a 算出 IIIA，NCCN v3.2026 (AJCC 9th) 應為 IIB
- 原因：`computeAJCC` 把 N2a 和 N2b 當同一級處理（`isN2` regex 吃掉 sub-type）
- 做法：拆成三段 `n==='N2a'` / `n==='N2b'` / fallback `isN2`
- AJCC 9th 完整 N2 對照表：
  ```
  T1+N2a→IIB  T1+N2b→IIIA
  T2+N2a→IIIA T2+N2b→IIIB
  T3+N2a→IIIA T3+N2b→IIIB
  T4+N2→IIIB
  ```

### #14 (lung V1.5.0 / V2.7.0)：Chart.js font.family 字串連寫導致整個 chart 無法初始化
- 症狀：Sela 回報「畫面卡頓 + 部分字消失」。實測進到統計頁時 chart 全壞
- 原因：兩處 `font:{size:11,family:'Microsoft JhengHei','微軟正黑體'}` — 兩個獨立字串連寫沒有逗號運算子也沒有陣列，是語法錯。瀏覽器 parse 整個 inline script 失敗、後續所有函式都未定義。括號計數平衡因為字串成對並不會觸發
- 做法：`family:"Microsoft JhengHei,微軟正黑體"`（字型 fallback 寫成單一字串，Chart.js 內部會用逗號斷字型）
- 教訓：**括號平衡通過不等於 JS 語法正確**。CLAUDE.md 第一節打包驗證從 V2.7.0 起新增 `node --check` 強制 parse 確認

### #15 (lung V1.5.0 / V2.7.0)：page transition 連帶觸發 6+ innerHTML 重渲染
- 症狀：`A.go('pathway')` 點下去到第一幀畫面更新延遲 200-400ms
- 原因：`A.go` 同步呼叫 `renderPW`，`renderPW` 內 5 個 innerHTML，結尾再同步呼 `renderTxExec` 和 `renderConsult`（各 1 個 innerHTML），全擠在 click handler 裡
- 做法（V2.7.0 完整套）：
  1. `A.go` 內所有重渲染包進 `requestAnimationFrame`，先讓 panel transition 的 class flip 渲染完
  2. `renderPW` 結尾的 `renderTxExec + renderConsult + updatePWNav` 再包一層 rAF
  3. `renderSummary` 結尾的 `renderKPI` 包 rAF
  4. 4 處 `setTimeout(renderMolPanel, 50)` 改 `requestAnimationFrame(renderMolPanel)`（更精準）
  5. `_panels` / `_navs` NodeList 快取（避免每次切換 panel 都做 querySelectorAll）
  6. `dots` 改靜態 7 點 + class toggle，不再每次 innerHTML 重建
- 教訓：**單檔 250KB+ 純前端，重渲染必須跨 frame 拆**。下次新癌別模組拷貝肺癌時要保留這個模式

### #16 (lung V1.6.0 / V2.8.0)：藥物視覺被當配角，民眾以為「沒有藥物清單」
- 症狀：Sela 看 V2.7.0 民眾版總覽頁，回報「沒有看到藥物」。實測 `DRUGS` 物件、`buildPath()`、`renderTreatmentSteps()` 全都有跑、`#sum-tx` 也有 innerHTML
- 原因：藥物 12.5px 灰色，跟「治療方向」14px 黑色擺一起，視覺上像附註不像主角；早期/局晚分支沒給 `s.line`，視覺斷裂
- 做法（V2.8.0 完整套）：
  1. 藥物獨立成 `.tx-drugs-box` 卡（淺青底 + 邊框 + 「適用藥物」標籤）
  2. 英文名 14.5px 深青加粗、中文名獨立行 12.5px 灰
  3. 早期/局晚/SCLC 三大分支補 `line` 屬性（線數標記）
  4. 健保 badge 加粗放在 step title 開頭（從尾巴搬到前面）
- 教訓：**民眾版的視覺層級跟醫護版不一樣**。醫護看到 12.5px 藥名是「正常的細節」，民眾看到 12.5px 是「不重要的附註」。對民眾，藥物清單必須是視覺主角、不能跟說明文字混在一起。下次再加任何「健保 / 自費 / 藥名」資訊到民眾版，都要套 `.tx-drugs-box` 模式

### #17 (lung V1.6.1 / V2.8.1)：民眾版「一問一頁」其實還在滑
- 症狀：Sela 反映 V2.8.0 桌機/手機都還要滑滾輪。每頁高度都不一樣，視覺很跳
- 原因：之前 `body` 沒鎖視窗高度、`.main` 沒 flex:1、`.cd` 用 padding 撐高，內容多就溢出。加上 header 太厚（~120px）、actbar 加進來，可用內容區只剩 ~400px，但 Q3 的 9 顆按鈕垂直排已經破 700px
- 做法（V2.8.1 完整套）：
  1. `body` 用 `100dvh` + `overflow:hidden` 鎖在視窗內
  2. `.main` `flex:1; min-height:0`，每個 `.page` 也 `flex:1; min-height:0; flex-direction:column`
  3. `.cd` 改 `flex:1; overflow:hidden`，內部用 grid/flex 自動分配
  4. Q1 4 顆按鈕改 2×2 grid（手機 1 欄但壓扁高度）
  5. Q2 TNM 三組改水平 row（letter ▸ meta ▸ buttons），總覽帶 + skip-link 嵌底
  6. Q3 mut 9 顆改 3 欄 grid（手機 2 欄）
  7. 總覽：3 區（hero + 唯一允許捲動的藥物清單 + 底部 strip）
  8. 進度點移進 header 右側
  9. 移除 patient footer（佔版面又多餘）
- 教訓：**「一問一頁」不等於「一屏放得下」**。要鎖屏，必須 (a) `100dvh` + `overflow:hidden` (b) 每層都 `flex:1+min-height:0`（少了 min-height:0，flex child 會被內容撐爆） (c) 唯一允許 scroll 的地方要刻意設計（這版只有藥物清單）。下次新癌別模組複製時，這個「鎖屏 layout」要保留

### #18 (lung V1.6.2 / V2.8.2)：V2.8.1 重構時把醫師選擇與 QR 砍掉
- 症狀：Sela 反映「民眾版的照護團隊沒地方可以選」「應該要生 QR」
- 原因：V2.8.1 只想著「鎖屏不要滾」就砍了功能，忘了原本 V2.7.0 有 QR 區塊（雖然視覺位置不對）；醫師選擇從來沒做過
- 做法：
  1. 同步 `lung.html` 的 `CFG.team.depts` 到 `patient.html` 的 `TEAM` 常數（手動，無外部依賴）
  2. 團隊改成「漸進式揭露」— 三科各一個 dept-head，預設只展開第一科。選了之後 row 收合並顯示醫師名
  3. QR 不增高總覽頁：放成 hero 右上的小按鈕 → modal 全屏顯示
  4. QR payload 帶完整資訊（Stage/TNM/突變/治療方向/各科主治），沒選的欄位自動省略
  5. 選醫師為「選填」— 民眾不一定回診過，不該強制
- 教訓：**鎖屏 layout 不能藉口砍功能**。漸進式揭露（accordion / modal）是兼顧「畫面緊湊」與「資訊完整」的標準做法。下次再做類似重構，先列「不能砍」的功能清單再開始

### #19 (lung V1.6.3 / V2.8.3)：QR 中文超出長度時 fail
- 症狀：Sela 截圖顯示 QR modal 出現「QR 產生失敗」字樣，payload 是中英混合 ~73 字元
- 原因：原本用 `qrcodejs@1.0.0`（davidshimjs/qrcodejs），這 lib 對多位元組字元（中文每字 3 byte）處理不完整，超過某長度時 silent fail 然後我們的 try/catch 顯示「QR 產生失敗」
- 做法：
  1. CDN 換成 `qrcode-generator@2.0.4`（kazuhikoarase）— 廣泛使用且穩定，315 dependents
  2. API 改：`const qr = qrcode(0, 'M'); qr.addData(utf8, 'Byte'); qr.make(); el.innerHTML = qr.createImgTag(5, 8);`
  3. **關鍵**：中文要先 `unescape(encodeURIComponent(text))` 轉成 UTF-8 byte string，再用 `'Byte'` mode 指定。否則中文會被當成 Latin-1 編碼出亂碼或 fail
  4. 用 `createImgTag()` 直接產 `<img>` element（base64 GIF）而非 canvas — 兼容性更好，列印也能保留
- QR 容量：Version 15 (77x77) M-level 容量 535 bytes；115 byte 的 payload 完全不是問題（先前 fail 是 lib bug 不是容量問題）
- 教訓：**選 JS lib 看 dependents 數，不是 npm 名稱看起來像哪個**。`qrcodejs` (davidshimjs) 跟 `qrcode-generator` (kazuhikoarase) 名字相似但維護完全不同。下次選 cdn lib 先 web_search 看現代版本與下載量

### #20 (lung V1.6.4 / V2.8.4)：使用者改前面題目時下游 state 殘留
- 症狀：跑遍 200 個 (type × stageCat × mut) 組合「自動化測試」時意外發現的，民眾不會看到 — 但 QR payload 會帶錯資訊
- 場景：使用者選 NSCLC_NS → 走到 META → 選 EGFR → 返回到 Q1 改成 SCLC，或返回到 Q2 改 TNM 變 EARLY。雖然 buildPath 走 SCLC/EARLY 分支不看 mut，但 `S.mut='EGFR'` 還在 state，QR payload 會印「肺癌路徑 | SCLC 擴散期 | EGFR(+)」這種矛盾訊息
- 三個獨立 bug：
  1. `pickType`：改 type 不重置下游（mut/TNM/stage/stageCat）
  2. `recomputeStage`：TNM 改變導致 stageCat 變動（特別是 META→EARLY），不檢查 mutNeeded() 因此不清 mut
  3. `setStageUnknown`：fallback 走 EARLY 不清 mut；且程式碼有 hack（先 recomputeStage 再覆寫 stageCat）
- 做法：
  1. `pickType`：偵測 type 真的改變才清下游；同 type 不重置（避免使用者重複點同一顆按鈕被清掉）
  2. `recomputeStage`：oldCat !== newCat 且 !mutNeeded() → 清 S.mut + 清 selected class
  3. `setStageUnknown`：直接清乾淨（不再走 recomputeStage hack），明確 set stageCat='EARLY'
- 教訓：**state 跨 step 流動時，往回改前面題目的 reset 邏輯永遠是漏網之魚**。寫多步驟流程時要列出 state dependency graph：改 X 應該清哪些下游欄位？這個版本之前我沒系統性思考過這件事。下次新癌別模組要照樣寫 reset 規則
- **測試方法**：寫了個 mock-DOM 測試 harness，在 node 跑 200 組合（types × stageCats × muts），confirm `buildPath()` 對每組都能產 valid result（有 stageTxt/pwTxt/steps/warns），再加 4 個專門的 state-residue 案例。這個 harness 程式碼放在 V2.8.4 開發過程，下版若再改 state 邏輯應該重跑

### #21 (V2.8.4)：portal 還掛著 Font Awesome CSS 但 90% 圖示是 SVG
- 症狀：FA CSS 約 90KB，但 portal 只用 4 個 icon（hospital + 2 role + 1 badge）
- 做法：把這 4 個 + 8 個癌別圖示全改 inline SVG，刪掉 FA 引用。portal 完全脫離 FA，首屏快很多
- 順帶**重新設計 8 個癌別 SVG**：用器官解剖意象取代 FA 的類比物（ribbon、bacteria、utensils、mars 等不直觀的）
- 教訓：**FA 用一個 icon 拉整個 90KB CSS 不划算**。lung.html 因為用了 ~30+ 個 FA icon 留著合理；portal/patient/drugs 都該避免

### #22 (lung V1.6.5 / V2.8.5)：SCLC 民眾版概念錯位
- 症狀：V2.8.4 之前 SCLC 強迫走 NSCLC 的 TNM 分期，stageDisplay 顯示「Stage IIA」之類 NSCLC 標籤但 buildPath 走 SCLC 分支；Q3 還問 EGFR/PD-L1 對 SCLC 也沒用
- 原因：原始設計把所有 type 都套在同一個流程上。但 SCLC 臨床上分 Limited/Extensive，不分 I-III 期；Q3 對 SCLC 應該問腦/脊髓轉移（影響 PCI 與免疫使用）而非基因
- 做法（V2.8.5 完整套）：
  1. **state 加 `q2Mode`**：'tnm' (NSCLC) / 'sclc' (SCLC 兩段式)，選 SCLC 自動切 sclc 模式
  2. **Q2 加 sclc-wrap**：兩個大按鈕「侷限型 / 擴散型」，並提供切換到 TNM 模式的連結（雙向都可）
  3. **state 加 `S.brainMet`**：'no' / 'yes' / 'unknown'
  4. **Q3 加 brain-grid**：依 isSCLC() 切換顯示 mut-grid 或 brain-grid
  5. **buildPath SCLC 分支重寫**：依 brainMet 動態調整 — yes 時不推 PCI、不可加免疫、提示腦放療；no 時走標準化療+免疫；unknown 時提示完成腦 MRI
  6. **stageDisplay**：SCLC 顯示「侷限型 / 擴散型」而非 stage 標籤
  7. **q3Needed()** 取代 mutNeeded()：SCLC 也算「需要 Q3」（問 brainMet）；mutNeeded 變 alias
  8. 所有 reset 函式都清 brainMet（`pickType` / `recomputeStage` / `setStageUnknown` / `restart`）
- 教訓：**不同癌別的臨床分期邏輯不一定一致**。NSCLC 用 TNM/AJCC、SCLC 用 Limited/Extensive、其他癌別還會更不同（如食道用 Siewert 分型、肝癌用 BCLC）。下次新癌別模組複製時要認真考慮 stage axis 是不是適用，而不是套 NSCLC 模板就上
- **測試新增 brainMet 維度**：原 200 組合擴成 800（加 5 個 brainMet 值），仍全綠

### #23 (lung V1.6.6 / V2.8.6)：V2.8.3 換 QR lib 換到不可達 CDN
- 症狀：Sela 截圖回報「QR 產生失敗：qrcode is not defined」`ReferenceError`，devtools 看到 patient.html:1209 拋錯
- 根因：V2.8.3 為了修中文 fail（BUG-19）把 lib 從 `qrcodejs@1.0.0` 換到 `qrcode-generator@2.0.4`，但 CDN 從 `cdnjs.cloudflare.com` 換到 `cdn.jsdelivr.net`。**新 CDN 在 Sela 的網路環境沒載入到** — 可能被擋、超時或單純 DNS 失敗
- 同時間 lung.html 的 QR 一直是 work 的，因為它從來沒換 CDN，且**用 URL（純 ASCII）做 payload 避開了 qrcodejs 中文問題**
- 做法（抄 lung.html 模板）：
  1. lib 換回 `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0`（已驗證可達）
  2. **QR 內容改成 URL** `EDU_BASE_URL + '#' + base64(JSON)`，純 ASCII
  3. 民眾版 modal 下方仍顯示中文摘要（`buildHumanReadableSummary()`），但那是給人看的，不是 QR 內容
  4. **edu.html 同步加 SCLC + brainMet 處理**：解 base64 還原時依 type=='SC' 走 SCLC 顯示邏輯（侷限/擴散 + brainMet 影響 PCI/免疫）
  5. schema 新增 `b` (brainMet) / `co` (病歷號) 欄位
- 結果：URL 220-240 bytes（QR Version 11~13 容量 380~535 綽綽有餘），純 ASCII，不會中文 fail，CDN 可達
- 教訓：**修一個 bug 不要引入兩個新依賴**。V2.8.3 同時換了 lib 名稱跟 CDN host，遇到問題就難判斷哪個是元凶。應該先驗證新 CDN 在目標環境可達；或更好的做法是抄已驗證可用的同款模板（這次抄 lung 才一發中）
- 教訓：**同一個 repo 內已驗證 work 的方案，是最先該抄的**。lung.html 的 QR 一直 work、Sela 從沒抱怨過，我為了民眾版「便利性」自己另創一套，反而走了 V2.8.3→V2.8.6 三個版本才繞回來

### #24 (lung V1.6.7 / V2.8.7)：民眾版掃 QR 看到「醫護版簡化內容」對不上總覽頁
- 症狀：Sela 回報 V2.8.6 民眾版掃 QR 進去，治療內容跟 patient.html 總覽頁完全不一樣 — 一個是粗略一行（"化放療 ± 手術 ± 免疫/標靶"），一個是完整藥物清單
- 原因：V2.8.6 為了避中文 fail bug 抄 lung.html 的 QR 模板（URL→base64→edu.html），但**忘了 edu.html 內部用的是醫護版簡化邏輯**（getGoal/getTx 都是粗略字串），跟 patient.html 的 buildPath 完整 DRUGS 結構是兩套東西
- 做法（拆檔 + 同步邏輯）：
  1. **edu.html 改名 edu-pro.html**（醫護版），加 `getDrugDetail()` 顯示完整藥名 + 健保事審條件，每個 step 卡片化
  2. **新建 edu-patient.html**（民眾版），把 patient.html 的整套 `DRUGS` 物件 + 改名為 `buildPathFromData(d)` 的 buildPath 邏輯複製進去
  3. **lung.html → edu-pro.html、patient.html → edu-patient.html**：兩邊各自的 EDU_BASE_URL 指對應檔
  4. **base64 schema 不變**（n/t/s/m/b/tm/c/d/co），edu-patient 用 `TYPE_CODE_TO_FULL` + `deriveStageCat()` 把 schema 還原成 patient 的 S 型再呼叫 buildPathFromData
  5. CSS 風格：edu-pro 沿用霧藍，edu-patient 改青綠（呼應 patient.html 的 teal 主題）
- 教訓：**「邏輯複用」不等於「UI 複用」**。lung.html 跟 patient.html 的目標使用者不同（醫護 vs 民眾），雖然底層都是同個 buildPath 邏輯，但呈現詳細度應該對齊各自應用本身的詳細度。下次新增「掃描碼落地頁」這種延伸頁時，記得先問：是要「跟發送者一致」還是「跟新類型受眾一致」
- 教訓：**重複資料源跨檔同步是個維護坑**。現在 patient.html 跟 edu-patient.html 兩處有同樣的 DRUGS 物件，未來改 DRUGS 要兩邊改。CLAUDE.md 第三節改功能對映表已標註，下次改 DRUGS 要記得跟。長期可考慮把 DRUGS 抽成 `lung/_drugs.js` 共用 — 但那會破壞「單檔 HTML」原則，先不做

### #25 (lung V1.6.10 / V2.8.10)：民眾版藥物按鈕「太不明顯」
- 症狀：Sela 回報 V2.8.9 patient.html header 右上的藥物 icon「超小超不明顯」
- 原因：V2.8.9 沿用 `.home-btn` 樣式（30×30px、半透明灰底 `rgba(255,255,255,.16)`、icon 14px）— 在 home 按鈕情境下合理（低調避免誤點），但藥物入口需要被看到才能用，沿用 home 樣式變成「沒人發現的 icon」
- 做法：新建 `.drug-btn` 樣式區隔：白底 (#fff) + 青文字 (var(--teal-d) #115e59) + box-shadow 浮起 + 文字「藥物查詢」+ icon
- 視覺對比：白底 vs header 深綠漸層（#115e59→#0d9488），對比度極高，民眾一眼就看到
- 教訓：**並列按鈕不該全用同一個樣式**。home 是「逃生口」（誤觸不影響但合理低調）；藥物是「主功能延伸」（需要被發現）。同一個 header 內的不同按鈕應依重要性分配視覺權重。下次設計新按鈕前，先想：「這是誤點不要緊的逃生口，還是希望使用者主動發現的功能？」

### #26 (lung V1.6.11 / V2.8.11)：手機版總覽頁強制鎖屏導致內容擠成一坨
- 症狀：Sela 反映手機看總覽頁，hero+drugs+strip 被擠在一個視窗高度內，藥物清單 step 看不全
- 原因：BUG-17 修「一問一頁」鎖屏時連帶把總覽頁也鎖死。Q1/Q2/Q3 鎖屏正確（內容是按鈕網格、本來就該一屏顯示完），但**總覽頁本來就是「閱讀型內容」**，藥物清單長度因 type/stage/mut 變動，硬塞一屏只能用內捲縮小空間
- 做法（V2.8.11 完整套）：
  1. CSS：`@media(max-width:640px)` 下 `body.summary { overflow:auto; min-height:100dvh }`，`.sum-wrap { overflow:visible }`，`.sum-drugs-body { overflow:visible; max-height:none }`
  2. JS：showPage 進總覽時 `body.classList.add('summary')`，離開時 remove
  3. actbar 改 `position:sticky; bottom:0`，「重新查詢」按鈕一直在底部
  4. 桌機（>640px）保留原本鎖屏行為（桌機螢幕夠大不會擠）
- 教訓：**「一頁式」是 question 階段的設計，不是 reading 階段**。問答頁需要鎖屏（避免使用者誤以為要捲）；閱讀頁需要解鎖（內容長度可變）。下次新癌別模組複製時，注意這個區別

### #27 (lung V1.6.11 / V2.8.11)：「返回」一詞模糊，使用者搞不清是退一題還是退一層
- 症狀：問答間「下一題」自動跳，但反向用「返回」這個詞 — 使用者直覺以為「返回首頁」而非「上一題」
- 做法：
  - Q2/Q3 顯示「← 上一題」（同層退一題，跟「下一題」對稱）
  - 總覽頁顯示「← 返回」（跨層回到問答流程）
  - JS 在 `updateActBar()` 內依 `stepIdx` 動態切換按鈕文字，actbar HTML 預設不寫文字
- 教訓：**多步驟流程的「同層導覽」與「跨層返回」要用不同詞彙**。「上一題」明確指同層；「返回」隱含「離開這個區段」。混用會讓使用者卡住

### #28 (lung V1.7.0 / V2.9.0)：治療建議「應該依年齡/體能調整」但原本只在 warns 裡說
- 症狀：原本 V2.8.11 之前 buildPath 對所有人都返回同樣的 steps，年齡/PS 調整僅是 warns 裡一句話「年齡 ≥70 或 PS≥2：化療劑量需調整或改 Carboplatin」— 民眾看不出對「自己」有什麼具體差異
- 做法：
  1. 新增 Q1 基本資料頁，加「年齡」（<70 / ≥70 兩選）+「ECOG」（PS 0-1 / 2 / 3-4 三選），全選填
  2. ECOG 改成民眾化詞彙：「沒什麼影響 / 常隱受症狀 / 安床休息為主」+ 對應 SVG 圖示
  3. buildPath 改成 `buildPath() = applyAgeEcog(buildPathRaw())` 模式，applyAgeEcog 在 step.note 動態追加「【依您狀況】」標記，例如「您 ≥70 歲：化療建議改 Carboplatin（毒性較低）」
  4. PS 3-4 + 局晚/轉移 → 整個 pwTxt 改成「以症狀控制與支持性療法為主」
  5. warns 開頭新增「您填寫的狀況」提示句
  6. edu schema 加 `a` `e` 欄位，掃 QR 落地 edu-patient.html 也會看到個人化建議
- 流程改 5 頁：Q1 基本 → Q2 類型 → Q3 分期 → Q4 基因/腦 → 總覽
- 教訓：**個人化建議不該只在 warns 提一句，要直接套到 step 內容上**。民眾不會細讀 warns；他們看 step 卡片，那才是主要視覺焦點。年齡/PS 既然影響具體用藥，就要在 step 旁邊直接顯示「對您而言：改 Carboplatin」這種具體訊息

### #29 (lung V1.7.4 / V2.9.4)：手機版 Q-page 鎖屏導致 7 個 bug
- 症狀：Sela 回報手機版 Q3 進階 TNM 顯示不全、無法拉動。實測同源問題還有 6 個
- 根因：BUG-17 修「一問一頁」鎖屏時，所有 Q 頁設定 `body { overflow:hidden }` + `.cd { overflow:hidden }` + 各 grid 用 `flex:1; min-height:0`。桌機 OK 因為內容寬鬆夠裝；手機 360px 寬一旦超出 → 切掉看不見也不能捲
- 7 個盤點到的 bug：
  1. **TNM 進階 T 軸 9 欄擠扁**：360px 手機按鈕只有 23px 寬，「T1mi」「T2a」字看不清，按下去還按不到。修：手機 `[data-cols="9"]` 與 `[data-cols="5"]` 改 4 欄 wrap，`tnm-row` 加 `flex-wrap:wrap` 讓按鈕另起一行
  2. **Q-page 內容無法捲**：新 `body.questioning` class 配合 `@media(max-width:640px)` 解開 body / main / page / cd 的 overflow
  3. **iOS Safari 對 input font-size <16px 自動 zoom**：Q1 病歷號/姓名 input 點下去整個頁面爆。改 16px（桌機 ≥481px 才壓回 13.5px）
  4. **viewport maximum-scale=1**：阻止使用者放大頁面是 accessibility 問題（視力不佳長者看不清）。移除
  5. **actbar 沒處理 safe-area**：iPhone 全螢幕底部 home indicator 會蓋到。`padding-bottom: calc(8px + env(safe-area-inset-bottom))`，height 改 min-height
  6. **sclc-grid `grid-template-rows: 1fr 1fr` 在 flex:none 解鎖模式變 0 高度**：手機加 `auto auto`
  7. **input 沒 scroll-margin-bottom**：手機點輸入框鍵盤遮 actbar。加 80px scroll-margin
- 教訓：**「鎖屏為桌機設計，但手機需要解鎖」是個重複的 anti-pattern**。BUG-17（V2.8.1）只解總覽頁、BUG-26（V2.8.11）也只解總覽頁、BUG-29（V2.9.4）才解所有 Q 頁。下次新癌別的 patient.html 一開始就應該預設「桌機鎖屏 + 手機解鎖」雙模式，而不是先做鎖屏再一個個 bug 解
- 教訓：**iOS Safari 的 input zoom-on-focus 是個普遍坑**。任何 input、textarea、select 在手機 ≤16px font-size 都會 trigger，從現在起所有新 input 預設 `font-size: 16px`，桌機才透過 media query 壓小

### #30 (lung V1.8.0 / V2.10.0)：民眾版沒有「已手術」概念，病理期別填了還推薦開刀
- 症狀：Sela 回報兩個關聯 bug：
  1. 有病理期別後系統卻仍要求填臨床期別（其實是「沒地方填病理期別」，民眾只能勉強用 cTNM 欄位填）
  2. 有病理期別代表已開過刀，可是路徑還是停在「建議手術切除」步驟
- 根因：patient.html 從 V2.8.0 開始只有 cTNM (`S.t/n/m/stage/stageCat`)，從來沒有 pTNM 概念。`buildPath()` 只看 `stageCat`，不知道使用者已手術，所以早期 (EARLY) 一定推「手術根除 + SBRT 替代 + 術前免疫 + 術後輔助」全部 6 步，把「手術根除」放第 1 步
- 做法（V2.10.0 完整套）：
  1. **state 加 `S.postOp`**（boolean）— 預設 false（cTNM）；切到 pTNM 模式 → true
  2. **Q3 加 `#stage-mode-row`**：兩顆切換按鈕「影像/切片」（尚未手術）vs「病理報告」（已手術），共用同一組 TNM 欄位但意義不同
  3. **`pickStageMode()`**：切換 S.postOp，呼叫 `applyQ2Mode()` 重繪標籤；不清 TNM 值（讓使用者可以從 cTNM 切到 pTNM 直接看路徑差異）
  4. **`applyPostOpVisuals()`**：cd-step 加 post-op class（teal-d 顏色暗示）、tnm-foot 換「病理分期 (pStage)」標籤、tnm-stage 顯示 `pIIB` 而非 `Stage IIB`
  5. **`buildPostOpPath(t, st, m, brain)`**：是術後路徑引擎，跟 buildPathRaw 同層。NSCLC EARLY → 術後輔助化療 + EGFR/ALK 鞏固 + Atezolizumab + 規律追蹤；NSCLC LOCAL → 加切緣評估與密集追蹤；NSCLC META → 寡轉移切除特殊處理；SCLC → Cisplatin/Etoposide + N(+) 縱膈放療 + PCI/MRI + 規律追蹤
  6. **buildPathRaw 開頭分流**：`if(postOp && st 在 EARLY/LOCAL/META) return buildPostOpPath(...)`，不污染原 cTNM 邏輯
  7. **規律追蹤 step 明確列頻率**：「前 2 年每 3-6 個月 CT、3-5 年每 6 個月、5 年後每年」(EARLY)、「前 2 年每 3 個月」(LOCAL/SCLC)。給民眾具體時間軸概念
  8. **`stageDisplay()` 加 p 前綴**：postOp=true 時返回 `pIIB`/`p侷限型`/`pIVA`，hero 與 QR 摘要都會看到
  9. **edu-patient 同步**：schema 加 `po` 欄位（0/1）、`buildPathRawFromData` 開頭同樣分流到 `buildPostOpPathFromData`、hero 「分期」標籤改「病理分期」
  10. **reset 邏輯**：`pickType` / `restart` 都清 S.postOp。注意：`recomputeStage` 不清（同一組 TNM 切換意義時值要保留）
- 測試：跑 7 個情境（NSCLC_NS/SQ × EARLY/LOCAL/META × postOp + SCLC postOp），對照組 cTNM EARLY 維持原「手術切除為主」全綠
- 教訓：**民眾版預設用「臨床期別」沒問題，但病理期別不是 edge case**。肺癌個案至少 1/3 是已手術後才來查（因為手術前資訊都從醫護版來、查詢工具是回家後給家屬看的）。下次新癌別模組設計時，stage axis 設計要從一開始就分 c/p 兩階段，不要等 V1.8 才補上
- 教訓：**toggle 切換「同欄位但意義不同」是合理的 UX**。民眾不需要分開填 cTNM 跟 pTNM 兩組（會以為要填兩次）。讓他們用 toggle 切換意義 + 視覺暗示（顏色/前綴/標籤）就夠了。下次類似決策（例如術前/術後分子檢測）也走這個 pattern

### #31 (lung V1.9.0 / V2.11.0)：postOp 路徑全列同等亮度，民眾看不出「現在該做什麼」+ IA 期跟 IB+/II 推同一組化療
- 症狀：V2.10.0 個管師驗收測 18 情境後回報 2 個臨床合理性問題：
  1. **postOp EARLY 跨期別不細分** — pIA1/pIA2/pIB/pIIB 全推「術後輔助化療 + EGFR/ALK/Atezo 鞏固」。但 IA 期復發風險低、多數情況觀察即可，warns 寫「IA 期通常觀察即可」放在 pIIB 病人總覽會造成矛盾
  2. **看不出目前位置** — 同一張總覽頁給「剛開完刀」與「已做完化療等鞏固」病人看，5 個 step 同等亮度，無法回答「我下一步該做什麼」
- 根因：buildPostOpPath 把所有 stage 跟所有時序壓進一張平面 list；UI 沒有 phase / progress 概念
- 做法（V2.11.0 完整套）：
  1. **state 加 `S.txProgress`**（''/just_op/chemo/awaiting_consol/consol/followup/recurrence）— 表示治療時序位置
  2. **Q5 治療進度頁**（`#p-q5`）：6 顆 prog-btn，僅 postOp=true 時顯示。q4Needed 改成 postOp 一律 true（術後一定要 mut/brain 才能決定鞏固藥）
  3. **流程改 6 頁**：`PAGES = ['p-q1','p-q2','p-q3','p-q4','p-q5','p-sum']`、6 個 progress dots、stepIdx 0-5、updateActBar 加 stepIdx===4 條件
  4. **每個 step 加 `phase` 標記**：'surgery' | 'adjuvant_chemo' | 'consolidation' | 'followup' | 'recurrence'。buildPostOpPath 全面改寫，所有 step 都有 phase
  5. **開頭虛擬 surgery step**：`{title:'已完成：手術切除', phase:'surgery'}` 放最前面，給三區呈現的「已完成」區一個錨點
  6. **IA 期細分**：`isIA = /^IA/.test(stage)` → 走觀察為主分支（不推化療、標靶非主流）；IB+/II 走原本「化療 + 標靶/免疫鞏固」分支
  7. **`splitStepsByProgress(steps, txProgress)`**：依 PROGRESS_DONE_PHASES / PROGRESS_NEXT_PHASE 把 step 分到 done/next/future 三陣列。just_op→adjuvant_chemo 是 next；awaiting_consol→consolidation 是 next；followup→followup 是 next
  8. **`renderTreatmentSteps3Section`**：總覽頁 postOp+txProgress 時走三區呈現，否則平鋪。三區用 .tx-done（劃線+0.62 opacity）/.tx-next（青底+box-shadow 醒目）/.tx-future（虛線邊框+0.78 opacity）
  9. **`buildRecurrencePath`**：暫存 stageCat→META 跑 `buildPathRawCore()`、加開頭「之前治療已完成」surgery done step、所有後續 step 標 phase=recurrence、結尾加 followup step（沒這個的話 recurrence 沒影像追蹤建議）
  10. **META postOp phase 重分配**：「寡轉移切除後仍須全身性治療」step phase 從 consolidation 改 adjuvant_chemo（語意：剛開完刀後第一步主治療）— 不然 just_op 時「下一步」區會空白
  11. **edu-patient 同步**：buildPostOpPathFromData 加 stage 參數（從 d.s 拿）、buildPathRawFromData 加 recurrence 分流、buildPathRawCoreFromData 拆出、加 PROGRESS_LABEL/splitStepsByProgress/renderTreatmentSteps3Section、hero meta 加「進度：剛開完刀/化療中/...」
  12. **「不做 PCI」標題改「改用治療性放療（針對病灶）」**：V2.10.0 個管師發現對民眾不直觀，順便改
- 測試：9 個情境模擬全綠（A1 pIA1 just_op→done:[surgery]/next:[IA 規律追蹤]/future:[標靶非主流,規律追蹤]、A4 pIIIA recurrence→done:[手術+輔助]/next:[META EGFR 4 step]+followup、A8 pIVA META 寡轉移 just_op→next:[全身性治療]而非空白）
- 教訓：**clinical 工具的「下一步」概念不能用步驟列表表達**。病人關心的是「現在我在哪？接下來該做什麼？」不是「這個診斷的所有可能治療」。同一份治療路徑對「剛開完刀」vs「鞏固中」vs「追蹤中」的人意義完全不同。下次新癌別模組設計術後路徑時，phase 標記要從一開始就放 step 結構，不要等到要做進度區呈現時才補
- 教訓：**phase 設計要對齊 progress UX，不是對齊治療類型**。「全身性治療」如果對應的 progress 是 just_op 應該在 next 區，那 phase 要設 adjuvant_chemo 而不是 consolidation（即使治療性質是「鞏固」）。phase 是 UX 維度，不是醫學分類維度

### #32 (lung V1.10.0 / V2.12.0)：化療前漏 B/C 肝篩檢 + 總覽未完成清單把 opt 也列進去
- 症狀：Sela 個管師驗收測 V2.11.0 後回報兩個問題：
  1. **化療前需必加 B/C 肝病毒篩檢** — 化療會誘發 B 肝再活化，台灣 B 肝盛行率高，化療前 HBsAg/anti-HBc/anti-HCV 篩檢是基本款。B 肝陽性者需轉腸胃科開預防性 NA 藥物（Entecavir / Tenofovir），這項在 CK config 完全沒有
  2. **「依需要」項目誤列入未完成** — 基礎檢查的 c7 支氣管鏡、c9 縱膈腔鏡、c36 心臟超音波三項本來就是 opt（依需要勾選），但總覽頁「尚有 N 項未完成」紅 X 清單把它們也列進去，導致個管師永遠看到「未完成」狀態
- 根因（問題 2）：line 3217 `basicTotal = CK_BASIC.length` 用了全部 (含 opt)；line 3235 `allReq = [...CK_BASIC, ...advReq]` 直接把所有 basic 倒進去未完成清單。實際上同檔案 line 2921 KPI 計算用的 `basicReq = CK_BASIC.filter(c=>c.req!=='opt')` 是對的 — 顯然當初寫 KPI 時想到了，渲染總覽時忘了
- 做法（V2.12.0）：
  1. **CK config 加兩項**：`c40 B/C 肝病毒篩檢 req:'chemo'` + `c41 B 肝陽性轉腸胃科 NA req:'opt'`。c40 必要、c41 依需要（因為要先驗 c40 結果為陽性才用得到）
  2. **`isItemRequired` 加 `'chemo'` 條件**：SCLC 一律 true、NSCLC stage≥IB true（IA 期通常觀察不化療所以不需要 B 肝篩檢）
  3. **修總覽 ckRemain 計算**：`basicTotal = basicReq.length`（過濾 opt）、`basicDone = basicReq.filter(it=>ck[it.id]).length`、`allReq = [...basicReq, ...advReq]` 都用 basicReq
  4. **修 basic 頁面 progress bar**：`updateBasicCKBar()` 也只算必要項目，opt 勾不勾不影響進度
  5. **修 basic 頁面 tab 計數**：`renderBasicCK()` tab 顯示「8/8」而非「8/11」(11 = 含 3 opt)
  6. **opt bonus 顯示**：basic 與 adv 的 opt 完成數都納入「✚ 另完成 N 項選擇性檢查」
- 測試：10 個情境（NSCLC_NS/SQ + SCLC × IA1-IVB）全綠 — c40 在 NSCLC IA1/IA2 不必要、IB+ 必要、SCLC 全期必要；c41 永遠 opt；basic opt 3 項永遠不算必要；勾 5 個 opt 後 ckRemain 不變
- 教訓：**檔案內有兩處在做類似計算時要交叉驗證**。lung/index.html 同一份檔案，line 2921 KPI 用 `filter(c=>c.req!=='opt')`、line 3217 總覽直接用 `CK_BASIC.length`，兩處邏輯不一致是 bug 溫床。下次新增類似計算時，先 grep 看其他地方怎麼算，對齊
- 教訓：**「opt 不影響進度」是 checklist 工具的核心 UX 原則**。如果勾 opt 會減少未完成計數、不勾 opt 會增加未完成數，那 opt 跟 required 就沒區別了。所有 progress/remaining 計算都要過濾 opt — basic 頁面 bar、tab 計數、總覽 ckRemain、KPI 都要一致

### #33 (lung V1.11.0 / V2.13.0)：術後鞏固藥健保標示錯誤（一路標 NHI，但 ADAURA/ALINA/IMpower010 都是自費）
- 症狀：Sela 上傳健保條文後對照發現，V2.10.0/V2.11.0 寫的 buildPostOpPath 把術後鞏固藥（Osimertinib EGFR / Alectinib ALK / Atezolizumab PD-L1≥1%）全標 `nhi:'NHI'`，但實際上：
  1. Osimertinib (9.80) 健保**只給第一線 IIIB/IIIC/IV 期肺腺癌 + 第二線 T790M(+)**，**沒有術後鞏固（ADAURA）適應症** — 病人問到「我健保有給嗎」會被誤導
  2. Alectinib (9.60) 同樣只給「ALK 陽性晚期 NSCLC 第一線」，**沒有術後鞏固（ALINA）適應症**
  3. Atezolizumab IMpower010 (PD-L1≥1% II-IIIA 切除後) 健保完全沒給付 — 9.69 鞏固只給 durvalumab 用於 CCRT 後
  4. Sotorasib (KRAS G12C) — 健保條文 1150522 與 115/5/1 修訂對照表完全沒列入，**健保未給付**（之前標 SELF 是對的，但 note 寫「健保事審」會讓人誤以為是事審就有）
  5. Amivantamab (9.126) 健保只給「EGFR exon 20 insertion 第一線併用 carboplatin + pemetrexed」，**不是 Osimertinib 失敗後的後線**
- 根因：V2.10.0 寫 buildPostOpPath 時直接從 NCCN/ADAURA/ALINA/IMpower010 試驗依據複製治療路徑，**沒對照健保第 9 章條文**。NCCN Cat 1 ≠ 健保給付，這在台灣是常識，但工具裡反覆出現了
- 做法（V2.13.0 完整對齊條文）：
  1. **民眾版 patient.html / edu-patient.html buildPathRaw + buildPostOpPath**：所有「術後鞏固」的 Osimertinib/Alectinib/Atezolizumab → `nhi:'SELF'` + note 加註「健保未給付，需自費」+ warns 加「ADAURA/ALINA/IMpower010：健保未給付」
  2. **DRUGS 區塊**：KRAS note 改「健保未給付，自費；NCCN Cat 2A 後線推薦」、BRAF note 加註「健保僅給第二線」、CONSOLIDATION note 補完整條件（III 期不可切除 + CCRT 後 + PD-L1≥1% + EGFR/ALK/ROS-1 原生型 + 12 個月）、EGFR_BRAIN note 加健保條文編號
  3. **EGFR 後線 Amivantamab** title 改 `'Osimertinib 失敗後：化療 ± 免疫'`（不再放 Amivantamab 在 title）+ drugs list 改「Amivantamab + 化療（限 EGFR exon 20 ins）」+ note 加 9.126 條件
  4. **drugs-pro.html ALL_DRUGS**：Osimertinib/Alectinib indi/line/nhi_ref/prereq/rule + appearsIn 全面對齊條文（9.80/9.60）、Lorlatinib/Ceritinib/Brigatinib/Crizotinib nhi_ref 改正確編號（9.81/9.59/9.82/9.50）、Dabrafenib+Trametinib nhi_ref 改 9.91-4 加註「NCCN 一線推薦但健保僅給第二線」、Sotorasib nhi_ref 改「健保未給付（自費）」、Amivantamab 全段改寫對齊 9.126
  5. **drugs-pro.html 新增 Nivolumab** entry — 115/6/1 條文新增 NSCLC 術前輔助（CheckMate 816）健保給付：可切除（≥4cm 或 N1/N2 排除 N3、M0）、不具 EGFR/ALK、至多 3 個療程
  6. **Durvalumab 條件補完整**：9.69-(2)-I.「III 期不可切除 + CCRT 後無 PD + PD-L1≥1% + 非鱗狀 EGFR/ALK/ROS-1 原生型 / 鱗狀 EGFR/ALK 原生型 + 至多 12 個月」全寫進 rule
  7. **drugs-patient.html**：Sotorasib purpose 改自費明確；Amivantamab target 改「EGFR exon 20 ins 第一線（合併化療）」+ purpose 加 9.126 條件
- 測試：5 個 postOp 情境（NSCLC_NS pIB/pIIB EGFR、pIIB ALK、pIIIA EGFR、pIIIA NONE）所有 3 個鞏固藥（Osimertinib/Alectinib/Atezolizumab）→ nhi=SELF ✓；DRUGS.KRAS.nhi=SELF ✓；CONSOLIDATION note 5 項條件全含 ✓；KRAS+postOp warns 含自費 ✓
- 教訓：**NCCN Cat 1 / Cat 2A 推薦 ≠ 健保給付**。在台灣的臨床決策工具，「NCCN 推薦」與「健保給付」是兩個獨立維度，UI 要明確區分。Osimertinib 在 NCCN 是 IB-IIIA 術後鞏固 Cat 1，但健保只給 IIIB-IV 期第一線跟 T790M 第二線 — 病人問到「我健保有給嗎」會發現完全不一樣
- 教訓：**健保條文要看「修訂對照表」找最新異動**。9.69 ICI 規範改了 25 次以上（108/4/1 → 115/5/1），跨 7 年。臨床路徑工具一年至少對一次條文，特別是「鞏固治療」「術前輔助」這種新增類別容易漏。本院應建立每季條文 review 機制
- 教訓：**藥物標示要五個欄位都對齊條文：indi / line / prereq / rule / appearsIn**。nhi:'NHI' 只是一個 boolean，但「健保限什麼條件」要落在 prereq + rule。例如 Osimertinib nhi:'NHI' 是對的（第一線/第二線有給付），但「術後鞏固」要在 prereq 寫「術後 ADAURA 鞏固自費」、line 寫「術後 ADAURA 自費」、appearsIn 寫「術後鞏固，自費」— 三處交叉提示，民眾才不會誤解

### #34 (lung V1.11.0 / V3.0.0)：首次對齊 SELA-Starter-Kit V1.9.0（重大里程碑）
- 症狀：Sela 上傳 SELA-Starter-Kit V1.9.0，本專案累積 V2.13.0 / 33 條 BUG 的成熟專案首次接 Kit 規範。Kit 的鐵律最小對齊清單發現本專案：(a) 沒有 `.gitignore` (b) 沒有 SELA logo + favicon (c) 沒有 SELA-handoff.md (d) 版號 `b=13` 已破 Kit 嚴格三位數逢十進位規則 (e) 配色 `#5B8FB9` 與 Kit 預設 `#5A7A8B` 不同 (f) CLAUDE.md 章節結構跟 Kit `CLAUDE-MD-章法.md` 不完全一致
- 根因：本專案 V0.1.0 起手在 SELA-Starter-Kit 出現前，所有規範由 Sela + Claude 從實戰沉澱而來，跟 Kit 的沉澱路徑平行
- 做法（V3.0.0 完整對齊）：
  1. **走坑 #40 SOP**：用「🔴 必做 / 🟡 建議 / 🟢 順便 / ✗ 不做」四級分類法做選擇性對齊，不是全做
  2. **🔴 必做**：(a) 加 `.gitignore` 從 Kit `gitignore-template` 起手 + 專案特定規則（`_pack/`、`*.zip`、`*.bak` 等）(b) CLAUDE.md 最前面加「Kit 衝突仲裁開頭區塊」明寫 4 項刻意不對齊與理由 (c) 產出 `SELA-handoff.md` 給 Kit Claude 升 Kit 用 (d) 版號 V2.13.0 → V3.0.0 重置 b（Kit 嚴格逢十進位）
  3. **🟡 跟 Sela 對焦的兩個關鍵問題**：(a) 「SELA logo 要加上去嗎？」Sela 答「不加，已準備正式以彰濱秀傳名義發布」→ Kit V1.8.2 規則「正式機構發布豁免必含 SELA logo 鐵律」(b) 「版號用 V3.0.0 還是 V2.14.0？」Sela 答「V3.0.0（重置 b + 對齊里程碑，最乾淨）」
  4. **✗ 不做（明寫理由保留）**：(a) 不掛 SELA logo（品牌歸彰濱秀傳）(b) 不換配色 `#5B8FB9` → `#5A7A8B`（已被個管師驗收使用數月，已驗證的色票就是事實標準，Kit `colors.md` §3 補強規則）(c) 不依 Kit `CLAUDE-MD-章法.md` 重排 CLAUDE.md 章節（會洗掉 BUG-1 ~ BUG-33 連續編號的演進脈絡）(d) 保留「No emoji anywhere」更嚴政策（本專案 Nordic SVG 風格已成立，不放寬到 Kit `coding-style` 允許範圍）
  5. **lung 模組版號保留 V1.11.0**：模組本身在 V2.13.0 → V3.0.0 沒變動，只是系統層的 Kit 對齊。topbar 顯示「V1.11.0 · System V3.0.0」
- 教訓：**既有專案首次對齊 Kit 不是「重做」，是「補齊鐵律 + 明寫差異」**。Kit 規範清楚「不要為對齊 Kit 而動既有設計」— 已被驗證的就是事實標準。對齊的核心輸出是 (a) 補齊缺漏的鐵律檔案（.gitignore、handoff）(b) 明寫衝突仲裁區塊讓未來 Claude 看到 (c) 不破壞既有設計
- 教訓：**「正式以機構名義發布」是 Kit V1.8.2 品牌歸屬規則的關鍵判準**。Cancer Navigation 是「個人專案演化為機構系統」的典型情境，Sela 拍板「不掛 SELA logo」啟動了 Kit 豁免路徑。未來其他正式機構發布專案可比照
- 教訓：**Kit 對齊本身就是一條坑**。本專案累積 33 條 BUG 才接 Kit，跟 MDT V4.7 / Patient Follow V6.9.4 一樣，是「Kit 出來前的成熟專案」。對齊算 a+1 重大里程碑而非 b+1（雖然 Kit 規則動 5+ 檔 = b+1），因為 (a) 版號 b 已破 10 必須重置 (b) Kit 對齊是「**整個專案規範管理模式的切換**」屬於主流程改動 — Sela 拍板支持這個判斷

### #35 (lung V1.11.1 / V3.0.1)：民眾版從病人視角審查發現 7 類 UX 缺失大修
- 症狀：Sela 提議「從病人角度試點，找奇怪的地方」。Claude 跑了 10 個情境（IA1 初診 / pIB EGFR+ 已手術 / IIIA EGFR+ 初診 / IIIB 鱗 PS2 / IVA EGFR+ 腦轉 / IVA KRAS / SCLC 侷限 / SCLC 擴散 / pIIIA EGFR+ 復發 / pIIB ALK+ 鞏固中），從病人實際讀到的文字角度審查，找出 7 類問題：
  - **A. 試驗代號 / 條文編號 / 英文藥名沒翻譯**（最大破口）— V2.13.0 健保條文對齊時把 ADAURA / ALINA / IMpower010 / 9.50 / 9.59 / 9.60 / 9.69 / 9.80 / 9.81 / 9.82 / 9.91 / 9.126 / 9.5.1 / 9.5.7 / T790M / carboplatin/pemetrexed / NCCN Cat 2A 等專業字塞回民眾版 note
  - **B. 自費標示讓病人焦慮 + 缺「擇一」說明** — pIB EGFR+ 病人連續看到 3 個自費術後鞏固藥（Osimertinib / Alectinib / Atezolizumab），但實際上一個病人只用一個基因型對應的藥
  - **C. 邏輯不一致 — IA1 初診出現「術後鞏固」** — buildPathRaw EARLY 分支不論 postOp 都列 EGFR/ALK 鞏固，病人沒手術就看到「術後鞏固」會困惑；IA1 病人也看到 「II-IIIA 術前輔助」資訊跟他無關
  - **D. 復發用「第一線」措辭錯** — buildRecurrencePath 整個複製 IVA EGFR 流程，stageTxt「pIIIA 轉移期 (IV)（術後復發/惡化）」p 跟 IV 混在一起，病人困惑「我是 IIIA 還是 IV？」；step「第一線：EGFR TKI 標靶」對復發病人措辭錯（第一線是給沒治療過的人）
  - **E. 詞句不順 + 醫護用語殘留** — 「同步化放療為主，再加免疫鞏固」「依基因 / PD-L1 個人化治療」「鞏固」/「序貫」/「PS 2」/「PCI」/「CCRT」
  - **F. 重複資訊 — 同件事說 4 遍** — 3 個 step note + 1 個 warns 都說「健保未給付，需自費」
  - **G. 條文編號不該給民眾看** — DRUGS 區塊 BRAF / KRAS / CONSOLIDATION / EGFR_BRAIN note 殘留條文編號
- 根因：歷次升版時關注醫護版的精準度，民眾版資料源 DRUGS / buildPath / buildPostOpPath / buildRecurrencePath 用同一套底層資料，但民眾版需要「翻譯層」沒做透
- 做法（V3.0.1 完整重寫）：
  1. **DRUGS 區塊清條文編號**：EGFR_BRAIN / BRAF / MET / KRAS / CONSOLIDATION 五個 entry 的 note 全寫成病人語言（「健保有給付，需事前審查」/「健保未給付，需自費」/「健保第二線給付」），完整條件用平民話講「限第三期無法手術切除、同步化放療後病情穩定」而非「III 期不可切除、CCRT 後無 PD」
  2. **EARLY 分支大改加 IA 過濾**：`isIA = stage.startsWith('IA')`，IA 不顯示「II-IIIA 術前輔助」step、IA 不顯示「術後輔助化療」step、IA 不顯示「術後追加治療」step；IB+ 把 EGFR/ALK 兩個鞏固藥合併進一個「術後追加治療：依基因檢測結果擇一」step
  3. **LOCAL 分支同改**：pwTxt「同步化放療為主，再加免疫鞏固」→「以同步化放療為主，治療結束後再用免疫維持治療」；warns 4 條全重寫拿掉專業字
  4. **META 分支翻譯**：EGFR 的「惡化後：抗藥機制檢測」→「病情惡化時：做抗藥基因檢測」+ note 解釋「若第一線用的不是 Osimertinib，且檢測發現抗藥基因」（不是 T790M(+)）；KRAS「PD-L1 偏高，免疫反應佳」→「免疫指標多偏高，對免疫治療反應通常較佳」；BRAF / MET / ROS1 都把「TKI 標靶」改「口服標靶藥」；「含鉑化療 + 免疫」→「含鉑化療搭配免疫治療」
  5. **buildPostOpPath EARLY / LOCAL 同樣處理**：3 個鞏固藥合併成「擇一」step、明示「一個病人通常只會用一種，依檢測結果決定」、warns 3 條精簡（同件事不重複說）
  6. **buildRecurrencePath 大改**：stageTxt「pIIIA 轉移期 (IV)（術後復發/惡化）」→「非小細胞肺癌（非鱗狀） 術後復發 — 接續全身性治療」；step.title 走 regex 替換「第一線：」→「復發後接續治療（第一順位）：」、「第二線：」→「復發後接續治療（第二順位）：」
  7. **SCLC 翻譯**：PCI → 「預防性腦部照射」；侷限型 / 擴散型 stage 顯示拿掉英文 (Limited)/(Extensive)；「鞏固」全改「追加治療」
  8. **applyAgeEcog 翻譯**：「PS 2」→「您體力狀況中等」、「PS 3-4」→「您體力狀況較差」、「序貫」→「分開做（先化療再放療）」、「Carboplatin」→「副作用較輕的碳鉑」
  9. **ECOG 按鈕標籤 + footer 體力標籤**：「PS 2」「PS 3-4」病人實際在 UI 看到的也改成「體力中等」「體力較差」
  10. **edu-patient.html 同步全部 1~9**：patient.html 與 edu-patient.html 兩份完整對齊
- 教訓：**民眾版需要獨立的「翻譯層」設計，不能跟醫護版共用 note**。健保條文對齊（V2.13.0 BUG-33）關注精準度，但精準的醫護用語（9.126 / ADAURA / CCRT 後無 PD / PS 2）對病人就是雜訊。下版考慮把 DRUGS 拆成 `DRUGS_PRO`（醫護版用，含條文編號 / 試驗代號 / NCCN 分級）+ `DRUGS_PATIENT`（民眾版用，純病人語言），維持兩個檔案的同步成本，但避免雙視角誤用同一筆 note
- 教訓：**寫民眾版內容時的禁字清單**：條文編號（9.XX）/ 試驗代號（ADAURA / ALINA / IMpower010 等）/ NCCN 分級（Cat 1 / Cat 2A）/ 醫護縮寫（PS / ECOG / CCRT / PCI / TKI / NGS / IMRT / SBRT 等英文縮寫，後三個視情況保留 + 中文括號）/ 抗藥機制專名（T790M / EGFR exon 20 ins 等，改用「抗藥基因」「特殊 EGFR 突變」泛稱）/ 健保事審術語（事審 / 給付規定 / 通則十二）/ 「鞏固」「序貫」這類醫護常用詞。本院日後寫民眾版內容應有此禁字清單參考
- 教訓：**「擇一」概念對病人決策非常關鍵**。pIB EGFR+ 病人看到 3 個自費術後鞏固藥連續列出來會誤以為「我要花 3 倍錢」，加「依基因檢測結果擇一」明示後焦慮感大幅降低。其他多藥情境（轉移期 EGFR 五藥擇一、ALK 標靶 4 藥擇一）也應該套同樣的「擇一」框架
- 教訓：**「復發」病人讀到「第一線」會困惑**。「第一線」是「最先用的藥」對沒治療過的人是對的，但對復發病人來說已經做過治療，措辭應該是「復發後接續治療（第一順位）」明示「這是復發後重新開始的順位」。未來 buildRecurrencePath 加新分支時記得套用 regex 替換

### #36 (lung V1.11.1 / V3.0.2)：升 Kit V1.9.0 → V1.21.0（升版對齊，非首次對齊）
- 症狀：Sela 上傳 Kit V1.21.0（從 V1.9.0 跨 12 個 b 版本：V1.10.0 → V1.11.0 → ... → V1.21.0）。本專案 V3.0.1 已對齊 V1.9.0，需評估升 Kit 版本帶來的新規範該怎麼接
- 根因：Kit 是滾動更新的（每個 SELA 專案的反饋都會回流），跨 12 個 b 版本累積：
  - V1.10.0 新增坑 #46~#52（含本專案反饋進的 #50/#51/#52）
  - V1.12.0 新增鐵律 §10.5 英文名稱化
  - V1.13.0 新增 App Logo 主動詢問規則
  - V1.15.0 ~ V1.16.0 新增坑 #53~#58
  - **V1.17.0 新增「優化體檢」鐵律**（必做）
  - V1.19.0 新增坑 #59~#62 + optimizations.md
  - **V1.20.0 新增鐵律 §10.6 UI 版本號顯示**
  - **V1.21.0 新增坑 #63 Python re.sub → str.replace**
- 做法（V3.0.2 完整對齊）：
  1. **走 V1.21.0 templates/claude-init.md 第二章升版對齊 SOP**：四級分類選擇性對齊，不重新打 V3.0.0 已決定的事
  2. **🔴 必做**：
     - 衝突仲裁區塊版本號 V1.9.0 → V1.21.0
     - 執行優化體檢（V1.17.0 鐵律）：對照 optimizations.md 4 條 OPT 找適用項
     - 加 BUG-36 + SELA-handoff.md 更新
  3. **🟡 建議（Sela 拍板「全部都對」）**：
     - 衝突仲裁區塊「No emoji anywhere 更嚴」移除 — V3.0.0 時誤標。V1.21.0 sela-philosophy.md 明寫「不大量使用 emoji 是核心美學原則」，我們是符合不是更嚴
     - 加註雙向關係：本專案 V3.0.0 SELA-handoff 提的 3 條反饋（NCCN ≠ 健保 / 健保條文季度 review / opt 不算未完成）已被 Kit V1.10.0 採納為坑 #51/#52/#50
  4. **🟢 順便**：加註 V3.0.1 改法符合 Kit 坑 #61（UI 改名只動顯示文字，phase 變數 `consolidation` 不動）+ V3.0.1 Python 編輯用 `c.replace` + assert 符合 V1.21.0 新坑 #63
  5. **✗ 不做（V3.0.0 已決定的事不重新打開）**：SELA logo 仍不加（醫院品牌）/ 配色 `#5B8FB9` 保留（Kit colors.md §3 V1.8.1 規則就是「不主動換」） / CLAUDE.md 章節結構保留 BUG 編號累積
  6. **優化體檢結果**：對照 optimizations.md 4 條 OPT：
     - OPT-1（cron → threading.Timer）：純前端 HTML 無排程需求，不適用
     - OPT-2（散落初始化 → master JSON）：無 DB，不適用
     - OPT-3（外部請求 → outbox queue）：無後端，不適用
     - OPT-4（一次生成大量產出 → 配驗證迴圈）：V3.0.1 民眾版 UX 大修最後一步「跑 10 個情境模擬驗證」就是 OPT-4 應用，已自然在做
     - **結論：0 條需動手改**（純前端 HTML 專案目前的優化庫適用度低）
- 教訓：**升 Kit 對齊版本 ≠ 首次對齊**。Kit 規則的「四級分類法」對首次對齊是「全面選擇」，對升版對齊是「只挑 Kit 新增的部分」— V3.0.0 已決定的事（SELA logo / 配色 / 章節結構）不重新打開。動手前先 grep CLAUDE.md 衝突仲裁區塊看「上次決定了什麼」，只動 Kit 新規範跟我們的差異
- 教訓：**「優化體檢」結果可以是「0 條需改」並不算失敗**。優化庫的目的是「讓對齊變好」而不是「強迫升級」— 體檢精神是「對照看有沒有用得上的」。Kit V1.17.0 的 optimizations.md 4 條 OPT 目前都是後端/DB/排程相關，純前端 HTML 中 0 條合理。下次優化庫加入「前端」類 OPT 時再重新體檢
- 教訓：**雙向回流通道有效是 Kit 規範的核心驗證**。本專案 V3.0.0 SELA-handoff 提的 3 條跨專案通用坑（#46-上、#47-上、#48-上）在 V1.10.0 全被採納為 Kit 坑 #50/#51/#52。這證實 SELA-handoff 機制不只是「給下次 Kit Claude 看」，是真實的雙向通道。下次寫 handoff 時記得這點 — 你的反饋會被認真採納
- 教訓：**工作環境重置時走坑 #48 流程**（V1.10.0 新增）：從 /mnt/user-data/outputs 解壓最新 zip 重建工作目錄。本次升版開始時環境重置（/home/claude 為空），直接 unzip V3.0.1 zip 1 秒回到工作狀態。Kit 規範化過的流程比每次重新摸索快

### #37 (lung V1.11.2 / V3.0.3)：個管師視角審查找到的「個人化提示永遠不觸發」隱性 bug
- 症狀：Sela 提議「對稱於 V3.0.1 病人視角審查，用個管師視角試用」。Claude 跑了 4 個個管師情境模擬（晨間新病人 / KPI 即將超標 / 跨院轉診 pTNM / 完整流程 MDT 不合規），發現 9 類問題，其中 2 條是**隱性 bug**（功能存在但實質沒在跑）：
  - **隱性 bug #1：QR payload 漏帶 age + ecog**
    - 醫護版 `buildEduPayload` 只傳 `{n, t, s, m, tm, c, d}`，**沒帶 age 跟 ecog**
    - 但 edu-patient.html 的 `applyAgeEcogFromData(r, d)` 期待 `d.a` 跟 `d.e`
    - 結果：個管師印 QR 給病人掃，**V2.9.0 加的「依您狀況」個人化提示永遠不觸發**（高齡用碳鉑 / 體力中等改分開做 / 體力差支持性療法 — 三條全失效）
    - **這個 bug 從 V2.9.0 (2026-04-29) 存在至今 ~9 個月**，期間還跑過 V2.10/V2.11/V2.12/V2.13/V3.0.0/V3.0.1/V3.0.2 7 次升版都沒抓到
  - **隱性 bug #2：ECOG 值醫護版 vs 民眾版不對齊**
    - 醫護版按鈕存 `'0' / '1' / '2' / '3' / '4'`（5 級）
    - 民眾版判斷用 `'01' / '2' / '34'`（3 組）
    - 即使修了 #1 把 ecog 傳過去，沒做值映射還是不會 match
- 根因：**雙人口設計的「資料傳遞層」沒有端到端驗證**。V2.9.0 民眾版加 ECOG 個人化邏輯時是「民眾自己填 ECOG」設計，後來支援「醫護版掃 QR 帶入」沒同步檢查 payload 完整性。**單元測試只測各模組內部，沒測「醫護→QR→民眾版」整條 pipeline**
- 做法（V3.0.3 完整修正）：
  1. **`buildEduPayload` 加 a/e 兩個欄位**（lung/index.html line 2997-3010）
  2. **加值映射函式**：
     ```js
     // 醫護版 5 級 ECOG → 民眾版 3 組
     const ecogMap = {'0':'01','1':'01','2':'2','3':'34','4':'34'};
     const eMapped = ecogMap[S.ecog] || '';
     // 從 birthday + caseDate 算實際年齡 → 民眾版 2 組
     const actualAge = calcAgeFromDates(S.birthday, S.caseDate || todayStr());
     const aMapped = (actualAge !== null) ? (actualAge >= 70 ? 'ge70' : 'lt70') : '';
     ```
  3. **跑 3 情境端到端驗證**：78 歲 PS 2 → 兩條提示觸發 ✓；55 歲 PS 0 → 無提示 ✓；63 歲 PS 3 → ps34 提示觸發 ✓
- 教訓：**雙人口資料源分離設計**（V3.0.1 BUG-35 教訓延伸）**還要加端到端 pipeline 測試**。本案發現的 bug 本質上是「資料傳遞層」的問題 — 即使民眾版邏輯對、醫護版資料對，中間 QR payload 漏欄位整個鏈就斷。下版考慮加 `lung/_qr_payload.test.js` 跑 5-10 個典型情境，確認「醫護版輸入 → payload → 民眾版渲染」每個欄位都能正確映射
- 教訓：**「對稱視角審查」是找隱性 bug 的有效手段**。V3.0.1 病人視角審查找到 7 類問題（全是顯性 UX），V3.0.3 個管師視角審查找到 9 類問題（其中 2 條是隱性 bug、隱藏 9 個月沒人發現）。**寫工具時可以對每個使用者群跑一次「角色扮演」式審查 — 找的不只是 UX，是「該角色看得到、但開發時沒想到」的盲區**
- 教訓：**「功能加上去 ≠ 功能在跑」**。V2.9.0 加的「依您狀況」個人化提示，patient.html 自己填 ECOG 走 buildPath 路徑可以觸發（沒問題），但 edu-patient.html 掃 QR 進來的路徑斷掉。**單一功能會有多個進入點，每個進入點都要驗證**。下版考慮在 patient.html / edu-patient.html 加 debug mode（URL 加 `?debug=1` 顯示 d.a / d.e 等 payload 欄位），方便個管師上線驗證

### 個管師視角審查發現但未在本版修的問題（V3.1.0+ 候選，按優先序）

**🟡 設計缺口（影響日常工作流）**：

1. **跨院轉診病人 pTNM 無法獨立輸入** — 現況 pTNM 區塊內嵌在 `actualTx.surgery=true` 條件下，個管師被迫勾「手術」才能輸入外院做的 pTNM，產生假執行紀錄。建議：pTNM 區塊獨立 + 加 checkbox「外院手術已完成」獨立觸發
2. **紀錄列表頁 KPI 視角缺失** — 列表只顯示 ck 完成數，看不到 3 個 KPI（收案→確診 / 收案→首治 / MDT 治療前）狀態。建議：每筆紀錄加 3 個小色點
3. **沒有「我的待辦」/「即將超期」清單** — 個管師工作核心是跨病人時序管理，目前必須一個一個打開才看到 KPI。建議：新增「待辦」分頁，自動列「明天超 14 天」「7 天內超 42 天」「MDT 未排+首治已排」case
4. **「實際治療 actualTx」語意混亂** — 同時兼三個職責：已執行 / 規劃中 / 觸發策略 KPI。建議拆 `plannedTx`（規劃）+ `actualTx`（執行）
5. **「實際治療」勾選沒治療日期欄位** — 勾「手術」沒手術日期、勾「化療」沒開始日期，timeline 只有 4 個粗框

**🟢 期待但缺**：

6. **副作用 / 不良反應追蹤系統** — 現況只在「衛教」項目（c24/c25 checklist），勾完算「衛教過了」；缺每次回診的副作用記錄（CTCAE 分級 / 處置 / 是否影響治療）
7. **個管師名字寫死** — `lung/index.html` line 1232 `caseManager: {name:'郭美伶', ...}`，換人要改程式。出現在衛教手冊、QR payload、總覽、CSV 匯出 4 處。建議加「設定」分頁讓個管師自己填或「病人」頁加下拉

### #38 (lung V1.11.3 / V3.0.4)：IIIB/IIIC 病人被塞 IIIA 建議（stageCat 顆粒度不夠）
- 症狀：Sela 上傳 IIIB (T4 N2a M0) 病人畫面截圖，總覽頁跑出「可切除型 IIIA:先手術 + 術後輔助治療」+「IIIA 開刀切除後依基因檢測結果擇一」兩個 step — 但這位病人不是 IIIA
- 原因：LOCAL 分支對 IIIA/IIIB/IIIC 一視同仁。IIIA 部分可切除（N1 或單站 N2），IIIB/IIIC 因 T4 或多站 N3 通常不可切除。step 3、4 的 title 直接寫死「IIIA」但沒判定 stage — V3.0.1 民眾版 UX 大修時漏了這條 stage 細分
- 做法：`isIIIA = stage === 'IIIA'`，step 3、4 包在 `if(isIIIA)` 內；非 IIIA 補 `warns.unshift` 開頭警語「${stage} 期腫瘤範圍較廣，一般不建議先手術」。patient + edu-patient 兩份同步
- 教訓：**「LOCAL/EARLY/META 三分類是 buildPath 的 stageCat 顆粒度，但 UX 上還需要更細**」。V3.0.1 修 EARLY 時已學到（加 `isIA` 過濾 IA/IB+），這次 LOCAL 又踩到 — 沒把教訓推廣。**下版寫新分支時預設檢查：這個 stageCat 內有沒有 stage 級的差異該過濾？**
- 教訓：**病人視角情境模擬要涵蓋每個 stage 而非每個 stageCat**。V3.0.1 病人視角審查跑的 10 個情境包含 IIIA 但沒 IIIB/IIIC（都併在 LOCAL），漏了這個 bug。下次審查每個 stageCat 內至少各期跑一次

### #39 (lung V1.11.4 / V3.0.5)：民眾版電腦版 actbar 拉滿寬 + Q1 加 B/C 肝與重大傷病兩欄
- 症狀：Sela 反饋「電腦版畫面太寬，底下按鍵很怪」— `.main` 已 `max-width:600px` 但 `.actbar` 沒限制寬度，電腦版底部按鈕拉滿整螢幕不對齊
- 原因：patient.html 只在 `.main` 加了 max-width，忘記 sticky 底部 actbar；hdr 有漸層背景故意全寬（設計特色）不動
- 做法：`@media(min-width:601px){.actbar{max-width:600px;margin:0 auto;width:100%}}`。手機版（≤600px）保持滿寬
- 症狀 2：Sela 交辦民眾版 Q1 加兩欄 — B/C 肝帶原（有/無/不知）+ 重大傷病申請狀態（是/否），要串入個人化提醒
- 做法：`S.hbv` + `S.catastrophic` 兩欄；HTML 用 `.age-grid` 樣式加兩個 `.info-block`（B/C 肝 3 顆按鈕、重大傷病 2 顆）；`pickHbv` / `pickCatastrophic` 用 `btn.closest('.info-block').querySelectorAll('.age-btn')` 定位範圍（**避免跟原本用同樣 class 的年齡按鈕互相干擾** — 這是隱藏的坑）；`applyHbvCatastrophic` 串在 `buildPath` 收尾，判斷 `r.steps` 是否含化療關鍵字才觸發 B/C 肝提醒（IA 觀察病人不會多看到不必要提醒）
- 4 情境驗證：IIIA + 有肝炎 + 沒申請 → 兩條提醒都跳 ✓；IIIA + 不知 → 建議先驗 ✓；IIIA + 沒肝炎 → 不提醒（Sela 明確要求）✓；IA1 + 有肝炎 → 沒化療所以不觸發 ✓
- 教訓：**共用 CSS class 加新元素要當心 selector 汙染**。`pickAge` 原本用 `document.querySelectorAll('#p-q1 .age-btn')` 全域抓，加了新的 `.age-btn`（B/C 肝、重大傷病也用同 class）後，點年齡會誤影響新按鈕的 selected 狀態。修法是三個 pick 函式都改用 `btn.closest('.info-block').querySelectorAll(...)` 定位範圍
- 教訓：**hasChemo 判斷邏輯要抽出來共用**。`applyAgeEcog` 跟 `applyHbvCatastrophic` 都需要判斷「這條路徑有沒有化療」— 目前各自寫 regex，未來多一個類似需求（例如提醒糖尿病患者化療前先看新陳代謝科）就會出現第三份重複邏輯。下版考慮抽 `pathHasChemo(r)` 共用函式

### #40 (lung V1.11.5 / V3.0.6)：基因檢測建議融入民眾版（可共同決策，不出現醫令碼）
- 需求：Sela 交辦 5 題的第 5 題，拍板「可共同決策但不要出現醫療碼」。目的是讓病人（尤其未驗基因的）知道該跟醫師討論驗什麼、大概費用結構，達到「共同決策」
- 資料源：本院「肺癌基因檢測開單速查表」（Sela 上傳圖）三分類：非鱗+復發/轉移或 IIIB 以上 → 5 項一起開；鱗狀+IIIB 以上 → PD-L1 先；IIIB 以前 → PD-L1 分子 + 視需要
- 做法：`buildGeneTestAdvice()` 回傳 `{title, subtitle, items:[{tag, self, name, why}], foot}`；`renderSummary` 在「注意事項」卡片下渲染 `#gene-card`。**關鍵：拿掉所有醫令碼（30101B / 30103B / L09017A / L09021 / L09010A 等），只保留「健保 / 材料費 / 自費 / 視需要」費用 tag + 病人語言的「為什麼要驗」**。醫令碼是醫護版 drugs-pro 的事，民眾版純決策參考
- 三分類邏輯：`isEarly = !/^(IIIB|IIIC|IVA|IVB)/.test(stage)`；`advanced = !isEarly || isRecurrence`；`isSquamous = type==='NSCLC_SQ'`。已驗過（mut!=='NONE'）改 subtitle「供參考是否補齊」。SCLC 直接 return null（不做驅動基因檢測）
- 6 情境驗證：非鱗 IVA/IIIB → 5 項 ✓；鱗狀 IIIB → PD-L1 先 ✓；早期 IA1 → PD-L1 + 視需要 ✓；已驗 EGFR → subtitle 改供參考 ✓；SCLC → 無建議 ✓；醫令碼殘留檢查 0 筆 ✓
- 決策：**edu-patient.html（掃 QR 版）不加基因檢測卡片**。理由：掃 QR 是「已看完醫師拿到衛教單」階段，多數已驗完基因，此時顯示「建議驗什麼」時機不對。基因檢測建議的正確時機是 patient.html 主流程（初診決定階段）
- 教訓：**同一份臨床資料，醫護版與民眾版要抽不同欄位呈現**（BUG-35 教訓的具體應用）。速查表的醫令碼 / 精確費用（自費 10,000 元）對醫護是「開單依據」，對民眾是「決策雜訊甚至造成價格焦慮」。民眾版只給「健保/材料費/自費」的相對概念 + 「為什麼要驗」，不給精確金額與醫令碼
- 教訓：**功能要放對「病人旅程的時機」**。同一個「基因檢測建議」功能，放 patient.html 主流程（初診）有用、放 edu-patient（已看完醫師）就是雜訊。加功能前先問：病人在這個畫面時，處於旅程哪個階段？這個資訊此時對他有用嗎？

### #41 (lung V1.11.6 / V3.0.7)：民眾版總覽頁 4 修（決策框壓縮 / 高劍虹漏同步 / warns 冗長 / 基因推銷語氣）
- 症狀：Sela 上傳 IIB postOp 總覽頁截圖，交辦 4 個問題
- 問題 2「高劍虹沒出現」root cause：**民眾版 patient.html 有獨立 `TEAM` 常數（line 1330-1334），V3.0.5 只改了醫護版 `lung/index.html` 的 `CFG.team` 沒同步民眾版**。這是雙人口資料源要兩邊改的坑（BUG-35 教訓）又踩一次 — 醫師名單同時存在兩個檔案，改一個會漏另一個
- 問題 3「決策框被壓縮」root cause：桌面版 `body.summary` 的解鎖捲動規則只寫在 `@media(max-width:640px)`，桌面版 `.sum-wrap overflow:hidden` 硬塞一屏，`.sum-drugs`（治療決策框 flex:1）被 hero + team/warns 雙卡 + 基因卡片擠到只剩一條。修法：把解鎖規則提升為全尺寸（移出 media query）+ 桌面版 `.sum-drugs-body` 給 `min-height:220px`
- 做法：(1) warns 精簡 — B/C 肝 3 句→1 句、重大傷病 2 句→1 句、砍 EARLY/postOp 兩處跟基因卡片重複的「建議做基因檢測」warn (2) 民眾版 TEAM medicine 加高劍虹 (3) 桌面版解鎖捲動 (4) `buildGeneTestAdvice` 文案中性化：標題「建議做的基因檢測」→「基因檢測參考」、副標「一次開齊省時間」→「可與醫師討論」、foot 拿掉「省去等待與重複抽血」改「由您與醫師討論後決定」
- 教訓：**醫師名單這種「兩個檔案各有一份」的資料，改一次要 grep 全專案確認同步**。醫護版 `CFG.team.depts` 與民眾版 `TEAM.depts` 是各自獨立的常數（不是共用），V3.0.5 加高劍虹只改醫護版，V3.0.7 才補民眾版。**下版考慮把醫師名單抽成 `lung/_team.js` 共用**，或至少在 CLAUDE.md 功能對映表標「改醫師名單 = 改 index.html CFG.team + patient.html TEAM 兩處」
- 教訓：**「解鎖捲動」這類 responsive 規則寫進 media query 前，先想清楚是「只有小螢幕要」還是「所有尺寸都要」**。原本以為只有手機版會擠，結果桌面版塞了 hero + 決策框 + 雙卡 + 基因卡片後一樣爆版。凡是「內容會隨資料長度變動」的頁面，預設就該全尺寸可捲動，不要假設桌面版一定塞得下

### #42 (lung V1.11.7 / V3.0.8)：問診頁提前解釋「為什麼」+ 基因檢測結合期別 + 高劍虹排序
- 症狀：Sela 交辦 3 修 —（1）高劍虹放張竣期後面（2）基因檢測結合期別跟病人說健保給付（3）問診頁前面別說明「為什麼」，決策頁才建議
- 問題 3 是個資訊架構原則：**問診頁（Q1 基本資料）只該問「有沒有 / 是什麼狀態」，不該提前解釋「所以會怎樣」或給建議**。V3.0.5 加 B/C 肝、重大傷病時在按鈕塞了「需看腸胃科」「建議先驗」「建議盡快申請」，年齡塞了「建議改 Carboplatin」— 這些是「決策建議」不該出現在問診階段，病人還沒填完就先被結論轟炸
- 做法：(1) 兩檔醫師名單 `張竣期` 後插 `高劍虹`（醫護 CFG.team + 民眾 TEAM）(2) `buildGeneTestAdvice` 的 subtitle/foot 帶入實際期別（`(S.postOp?'p':'')+stage+' 期'`）+ 明確講健保：非鱗晚期「EGFR/ALK/PD-L1 健保有給付」、鱗狀晚期「PD-L1 健保、EGFR/ALK 自費」、早期「健保多不給付」(3) 問診頁年齡/ B/C 肝/重大傷病三欄的按鈕 `<i>` 提示 + `info-block-hint` 全拿掉，只留純標籤（有/沒有/不知道）；建議一律留到決策頁 warns（applyHbvCatastrophic 已有）
- 保留判斷：ECOG 的狀態描述（「有症狀但白天大半時間仍能起身活動」）保留 — 那是**描述這個選項是什麼狀態**（病人需要對照自己選），不是「所以會怎樣」的建議。區別：描述狀態 vs 給結論建議
- 教訓：**問診 vs 決策要分階段，資訊各歸各位**。問診頁堆建議 = 病人還沒答完就被結論淹沒，而且同樣的建議決策頁又出現一次（重複）。原則：問診頁「收集」、決策頁「輸出」，建議只在決策頁講一次。健保給付狀況這種「決策資訊」也是同理 — 放在基因檢測卡片（決策頁）而非問診頁
- 教訓：**「健保給付與否」與期別強相關，值得明講**。同一個基因檢測（如 EGFR），晚期非鱗健保給付、鱗狀自費上萬、早期不給付。病人最在意「這要花多少錢」，把健保狀況結合他的實際期別講清楚，比只標一個「健保/自費」tag 更有決策價值

### #43 (lung V1.11.8 / V3.0.9)：電腦版 Q 頁卡片撐爆 + 建大規模模擬 harness 抓臨床合理性
- 症狀 1：Sela 上傳 Q2（肺癌類型）截圖，電腦版四個類型卡片被撐到滿視窗高度（每個卡片超大、圖示文字置中一堆留白，違和）
- 原因 1：跟 V3.0.7 總覽頁完全同源 — 桌面版 `body.questioning` 解鎖規則只寫在 `@media(max-width:640px)`，桌面版 `.page`→`.cd`→`.type-grid` 一路 `flex:1` 把卡片撐滿視窗高度。**V3.0.7 修了 summary 頁忘了 questioning 頁也有同款規則**
- 做法 1：`body.questioning` 解鎖規則提升為全尺寸（移出 media query）+ 桌面版 `.type-grid .btn-type{min-height:130px}` 避免卡片過扁。跟 V3.0.7 summary 頁一模一樣的修法
- 症狀 2：Sela 要「個管師 + 民眾雙視角，早中晚期 × 開刀不開刀，都跑一輪看有沒有 bug 或分期建議錯誤」
- 做法 2：建 294 情境模擬 harness（`/tmp/mega_sim.js`）— 全型態（NS/SQ/SCLC）× 全期別（IA1/IB/IIB/IIIA/IIIB/IIIC/IVA/IVB + SCLC Limited/Extensive）× 開刀/不開刀 × 9 種基因 × 復發。7 大類自動檢查：steps 非空 / stageTxt 非空 / IIIB-IIIC 不出現「可切除型 IIIA」（BUG-38 回歸測試）/ IA 初診不出現術後鞏固 / SCLC 不出現基因檢測 / 無醫令碼試驗代號條文編號殘留 / 基因卡片帶期別。**全綠**
- 發現（人工細看 9 情境臨床合理性，harness 抓不到的）：LOCAL 分支對驅動基因陽性者（EGFR/ALK/ROS1）仍照顯示「同步化放療後免疫維持治療」step，但免疫維持（PACIFIC/Durvalumab）本就排除驅動基因陽性者（note 有列此排除條件但沒針對「這個病人有驅動基因」給替代方向）。補一條 warn：驅動基因陽性 → 提示免疫維持通常不適用 + 可與醫師討論標靶維持治療。patient + edu-patient 同步
- ⚠️ 待 Sela 確認：CCRT 後標靶維持（LAURA trial osimertinib，2024 陽性結果）的台灣健保給付現況。本版只加「提示方向」不動健保 tag，確認給付後可補正式 step
- 教訓：**自動化 harness 抓「結構性 bug」，人工細看抓「臨床合理性」，兩者不能互相取代**。294 情境自動檢查全綠（沒有結構性錯誤），但驅動基因 vs 免疫維持這種「臨床上對這個病人不精準」的問題，只有人把 steps 一條條讀出來、對照臨床知識才抓得到。**大規模模擬要「自動掃結構 + 抽樣人工看語意」雙軌**
- 教訓：**同款 CSS 佈局 bug 會在不同頁面重複出現，修一頁要 grep 全專案同款規則**。V3.0.7 修 summary 頁的「桌面版沒解鎖捲動」，questioning 頁其實有一模一樣的規則沒一起修，拖到 V3.0.9 才補。修 responsive bug 時 grep `body.summary` / `body.questioning` 等所有「模式 class + media query」組合，一次修完

### #44 (lung V1.11.9 / V3.1.0)：設計師視角 UI 審核 + A 級無障礙 / B 級字體升級
- 背景：Sela 要「用美學設計師角度嚴格審核每頁 UI」。審完分四級（A 無障礙硬傷 / B typography 根本 / C 設計系統一致性 / D 逐頁視覺），Sela 選「A+B」動手
- A 級做法（全 7 頁）：(1) `:focus-visible` 鍵盤 focus 環 — 用 `:focus-visible` 不用 `:focus`（滑鼠點不顯示、只鍵盤操作時顯示，不干擾既有視覺）。醫護頁用 `var(--primary)` 藍、民眾頁用 `var(--teal)` (2) `@media(prefers-reduced-motion:reduce)` 全域把 animation/transition 降到 0.01ms (3) 民眾版觸控目標保底：age-btn 48px（V3.0.8 拿掉 `<i>` 後只剩一行變矮）、mut-btn·tnm-btn 44px（WCAG AAA 觸控標準）
- B 級做法：(1) 全站 font-family `'Noto Sans TC'` 優先、JhengHei 降 fallback。**關鍵是漸進增強策略**：`'Noto Sans TC','Microsoft JhengHei','微軟正黑體',system-ui` — 連得到 Google Fonts → Noto（跨平台一致）；醫院內網連不到 → 自動退回 JhengHei（Windows）或 system-ui，**不會比現況差**。webfont 用 `display=swap` 避免 FOIT，只載 400/500/700/900 四字重 (2) 民眾版病人要讀的小字放大 + 提對比：mut-ss（基因說明）10px tx3→11.5px tx2、tnm-btn i（TNM 說明）9.5→10.5px tx2
- 教訓：**焦點環用 `:focus-visible` 不用 `:focus`**。`:focus` 連滑鼠點擊也會顯示外框（干擾既有 hover/active 視覺、被嫌醜所以常被拿掉 → 鍵盤族沒焦點可見）。`:focus-visible` 只在鍵盤導航時顯示，兩全其美。這是「無障礙不犧牲視覺」的正解
- 教訓：**webfont 對可能連不到外網的醫院環境，要設計成漸進增強不是硬相依**。font-family fallback 鏈第一位放 webfont、第二位放系統字體（JhengHei/system-ui），webfont 載入失敗自動退回，最差等於現況。絕不能只寫 `font-family:'Noto Sans TC'` 沒 fallback（醫院內網會變 serif 預設醜爆）
- 教訓：**改按鈕觸控目標前先確認現有高度怎麼撐的**。age-btn 原本靠內容（兩行 b+i）自然撐高，V3.0.8 拿掉 i（Q3 問診頁不提前解釋）後只剩一行變矮，觸控目標縮水沒人發現 — 加 min-height:48px + justify-content:center 補回。改一處 UI 可能讓另一處的隱含假設失效
- 未做（Sela 審核挑 A+B，C/D 留著）：C 級設計系統一致性（radius 三套值 portal 14/醫護 10/民眾散落、text 色票三套命名 --text-secondary/--text2/--tx2）、D 級逐頁視覺（portal hero 是模板答案沒 thesis、民眾版總覽頁資訊塊視覺權重無主從）

### #45 (lung V1.11.10 / V3.1.1)：設計審核 C 級（設計系統一致性）+ D 級（逐頁視覺）
- 背景：Sela 選 C+D 動手。動手前重新評估每項的「性價比」（使用者可見度 vs 工程量 vs 風險），發現 C 級兩項評估不同
- C 級 radius：民眾版原本 13 種散落值（4/5/6/7/8/9/10/11/12/13/14/16/99）— **判斷標準是「同類元件是否用不同值」不是「全站是否同值」**（tag 小圓角、卡片中圓角、pill 全圓本就該不同）。分析後發現 6/7、9/10/11 重疊（同類按鈕用不同值），真的該收斂。做法：`--r-xs/sm/md/lg/xl/pill` 6 級語意 token，Python 批次替換（值收斂映射，每值最多 ±2px 肉眼無感）。民眾版 50 處 + portal 8 處完整 token 化；醫護版 80+ 處只補 token 定義供漸進採用（個管師工具次要，全面替換性價比低）
- C 級 text 命名：**V3.1.0 審核列為「問題」，V3.1.1 動手前重新評估判定「現狀正確、不該改」**。理由：醫護版藍灰（#5A6B7C）vs 民眾版綠灰（#5A6B6B）本就該用不同色票呼應各自主色（醫護 Nordic 藍 / 民眾 teal），強行統一命名反而混淆兩人口的視覺區隔；且每頁 CSS 獨立，跨頁命名不同不影響任何使用者。這是「純工程整潔度、使用者無感、改了是負收益」
- D 級 portal hero：副標「CANCER NAVIGATION SYSTEM」是 templated（任何系統都能叫這名、英文對長者不友善、沒 thesis）→ 中文功能定位「癌症臨床路徑導航 · 從分期到治療的每一步」+ 調 letter-spacing（英文的 2px 對中文太寬）
- D 級 總覽頁視覺主從：原本決策框（sum-drugs 灰邊扁平）跟團隊/注意/基因卡片同級，而 gene-card 有 teal 邊反而比決策框突出，**層次是反的**。修正成 hero（實心 teal）> 決策框（teal 邊 + 陰影 + teal header，主角）> 團隊/注意/基因（灰邊扁平，配角）。gene-card 從 teal 邊降為灰邊
- 教訓：**審核列的「問題」動手前要再驗一次是不是真問題**。V3.1.0 把 text 命名列 C 級問題，V3.1.1 動手前發現「不同人口用不同色票命名」其實是對的設計，改了反而糟。審核時的直覺判斷，落實前要用「使用者可見度 + 是否負收益」再過濾一遍
- 教訓：**radius/spacing 一致性看「同類元件是否一致」，不是「全站同值」**。tag 4px、按鈕 10px、卡片 12px、hero 14px 本來就該不同 — 那是層級。真正的問題是「同樣是按鈕卻有 6/7/10 三種值」。token 化的價值是「讓同類強制用同一個 token」，順便讓未來能一處調全站
- 教訓：**視覺主從靠「對比」不是「每個都加強」**。決策框要突出，做法不是把它加超大加超重，而是讓它有 teal 邊+陰影、同時把旁邊的 gene-card 降為灰邊 — 一升一降，對比出來層次就清楚（設計 skill：spend boldness in one place）

### #46 (lung V1.11.11 / V3.1.2)：個管師操作醫護版摩擦報告 → 資料安全三修
- 背景：Sela 要「個管師視角操作醫護版找不順的地方，讓她決定改不改」。走完日常流程（建檔→逐步填→印手冊→回頭管舊病人）產出摩擦報告分三類 10 項，Sela 挑第一批「資料安全 1+2+3」動手
- #1 症狀：編輯舊病人時，在「病人」分頁改基本資料（ECOG/日期）→ 直接切「總覽」或按列印或關瀏覽器（沒經過 basicck/checklist/decision/pathway、也沒按儲存）→ 改動只在記憶體沒寫入 record
- #1 root cause **比表面深兩層**：(a) `autoUpdateRecord` 觸發條件窄（`go()` 裡 `editId && cur∈四分頁` 才呼叫）(b) 更隱蔽的是 `autoUpdateRecord` 的 `Object.assign` 欄位本身就不完整（只有 ck/notes/基本資料/consult，**缺 type/tstage/nstage/mstage/stage/mutation/pdl1/drivers/pstage 等分期欄位**），跟 `save()` 的 rec 欄位集各寫一份。就算放寬觸發，欄位不補齊還是漏存分期
- #1 做法：抽共用函式 `collectStateFields()`（回傳完整欄位集），`save()` 用 `{...collectStateFields(), created, savedAt}`、`autoUpdateRecord()` 用 `Object.assign(existing, collectStateFields())` — 兩處欄位**永遠一致不再分叉**；`go()` 放寬成 `if(editId){ autoUpdateRecord(); }`（所有分頁）
- #2 做法：`let _dirty` 旗標 — boot 用捕獲階段 `document.addEventListener('input',…,true)` + click 委派（big-btn/gender/ecog）設 true，`save`/`autoUpdateRecord`/`saveDraft` 成功後清 false，`load`/`newPatient` 後清 false（剛載入乾淨態）；`window.beforeunload` 在 `_dirty` 時攔截。防「當前分頁改了沒切走就關」（此時 readForm 還沒跑、draft/record 都沒存 → 全丟）
- #3 做法：`A.del` 從 `allRecordItems` 找該筆的 code/name，確認訊息「確定刪除『A0012 王小明』的紀錄？」帶識別
- 教訓：**「兩處各寫一份欄位清單」是隱性遺失的溫床**。autoUpdateRecord 和 save 各自列欄位，加新分期欄位時只改了 save 沒改 autoUpdate，就造成「手動存有、自動存漏」。凡是「同一份資料在多處被組裝」的，抽成單一函式讓它們共用，是根治不是治標
- 教訓：**autosave 的「存了」要精確定義存到哪**。這系統有 draft（切分頁存）+ record（手動存）雙軌，autoUpdate 是編輯 record 的自動存。三者觸發點不同，個管師看不到差別但行為不同 → 隱性風險。dirty flag + beforeunload 是「最後一道網」，接住所有沒被 autosave 覆蓋的邊角情況
- 摩擦報告其餘（Sela 之後決定）：第二批時效管理 #4/#5/#6 **已於 V3.1.3 完成**；剩順手項（#7 病人分頁就地儲存 + #9 MDM 欄位版面）、低優先（#8 未發生日期收合 + #10 清單排序）

### #47 (lung V1.11.12 / V3.1.3)：摩擦報告第二批時效管理 #4+#5+#6（清單色點 / 主動預警 / 待辦分頁）
- 背景：個管師摩擦報告第二批。這三項是「同一組需求」— 都圍繞「個管師管時效」，一起設計才不會各做各的
- 核心設計：抽共用函式 `calcTimeliness(d)` 當「時效狀態單一真相」。輸入一筆病人記錄，回傳 `{diag,tx,mdt}` 各自的 `{st:'pass'|'warn'|'fail'|'na',txt}` + `alerts[]`。#4 用 st 渲染色點、#5 的預警邏輯內建在函式裡、#6 用 alerts 聚合 — 三個功能一個真相源（呼應 BUG-46：不要三處各算一套時效）
- 時效門檻（改門檻只動 calcTimeliness 一處）：收案→確診 ≤14 天（快到期 12）、收案→首治 ≤42 天（快到期 35）、MDT 須 ≤ 首治日
- #4 做法：`renderRecordList` 每列加三色點（TL_COLOR：pass 綠 /warn 黃 /fail 紅 /na 灰），hover title 顯示天數。只在「有時效資料或已收案 ≥12 天」時顯示，避免剛建檔的病人一排灰點
- #5 做法（**這是關鍵差異**）：原本 `checkKPI` 是「事後檢核」— dateDiag 填了才算收案到確診幾天、超沒超。新增「**主動預警**」：dateDiag 未填時，用 today−caseDate 算已過幾天，≥12 天黃、>14 天紅。個管師不必等確診就看到「這個病人快超期了」
- #6 做法：新增「待辦」分頁（sidebar `.spacer` 後、紀錄前）。`collectAllAlerts()` 遍歷所有病人的 alerts，fail 逾期在前、warn 快到期在後，分兩區呈現，點任一筆 `APP.load` 直接開病人。nav 帶未處理數 badge（有 fail 紅、只 warn 黃），`loadList` 時 `updateTodoBadge()` 隨資料更新
- 動到的地方（改時效功能看這裡）：`calcTimeliness`+`TL_COLOR`（核心）、`collectAllAlerts`/`renderTodo`/`updateTodoBadge`、sidebar nav todo 按鈕、`panel-todo`、`PANELS` 陣列、`go()` todo 分派、`loadList` badge、`.todo-badge` CSS
- 教訓：**「一組相關需求」要先找出共用的計算核心再分頭做 UI**。#4/#5/#6 看似三個功能，本質都是「病人時效狀態」的不同呈現（清單色點/預警判斷/聚合清單）。先寫 `calcTimeliness` 一個真相源，三個 UI 都掛上去 — 而不是清單算一套、待辦算一套、預警又一套。這正是 BUG-46「兩處各寫一份是隱性遺失溫床」的正面應用
- 教訓：**「事後檢核」和「主動預警」是兩種不同的 KPI 思維**。原本 KPI 只在資料填了之後算「達標沒」（被動）。個管師真正的工作是「今天該追誰」（主動）。同樣的門檻（14/42 天），事後檢核看「已發生的」、主動預警看「還沒發生但快到期的」，後者才讓工具從「紀錄本」變「管理助手」

### #48 (lung V1.11.13 / V3.1.4)：Noto Sans TC webfont 在 Windows 不如原生 JhengHei 銳利
- 症狀：Sela 實機試用回報「電腦版民眾版解析度略下降」。時間點在 V3.1.0（B 級字體升級換 Noto）之後
- 原因：**系統原生 CJK 字體 vs Google webfont CJK 的 hinting 差距**。Windows 的 `Microsoft JhengHei` 有針對 ClearType 次像素渲染高度優化的中文 hinting，小到中字級銳利硬朗；`Noto Sans TC` 透過 webfont 載入，CJK hinting 是跨平台通用的，在 Windows 上筆畫較柔、邊緣較糊 → 主觀「解析度下降」。民眾版是「大字給長者」，字越大柔邊越明顯，所以特別有感（醫護版字小、專業使用者，較無感）
- 做法：7 頁 font-family 退回 `'Microsoft JhengHei','微軟正黑體','Noto Sans TC'`（JhengHei 優先、Noto 降 fallback）。**webfont link 保留不移除** — 因為 Windows 第一位命中 JhengHei 就用原生字體、**不會下載 Noto**（font-family 命中即停，不 fallback），而 Mac/iPhone 沒 JhengHei 才 fallback 到 Noto webfont。等於 Windows 銳利 + 非 Windows 有 Noto 兜底 + Windows 零字體下載成本
- 教訓：**跨平台一致 vs 原生銳利度，要看實際受眾權衡，別預設「webfont 一致」就是對的**。V3.1.0 做 B 級升級時我重「跨平台一致」，但這是「院內工具、台灣受眾、Windows 大宗、大字給長者」的情境 — 銳利易讀的價值遠高於「Mac 也看到同款字」。webfont 的一致性對「多平台公開產品」有意義，對「特定環境的內部工具」是負收益
- 教訓：**font-family fallback 鏈可以「同時」兼顧原生銳利與跨平台兜底**。第一位放系統原生字體（有的平台用原生、銳利）、最後放 webfont（沒原生字體的平台 fallback）— 不是二選一。且 webfont link 保留不影響有原生字體的平台（命中即停不下載）。這比「全站 webfont」或「全站系統字體」都好
- 教訓：**webfont 這種視覺代價只有實機看得出來**。本地 harness、語法檢查都驗不出「字體渲染柔了」。呼應 BUG-44「webfont 要漸進增強」— 當時只想到「連不到 Google 要 fallback」，沒想到「連得到但渲染不如原生」也是代價。這正是下版候選 #1「實機驗證」的價值

### #49 (lung V1.12.0 / V3.2.0)：民眾版加查詢紀錄 + 統計（IndexedDB）
- 背景：Sela 拍板已久的「Q2 民眾版統計」終於實作。方向：主要給病人看自己的查詢歷史，個管師可統計「給哪些病人看過、做過哪些資料」
- 做法：民眾版原本無狀態（S 物件走完就沒），加 IndexedDB 層 `PDB`（pdbOpen/pdbAdd/pdbAll/pdbClear）。**dbName `'LungNavPatient'` 刻意不同於醫護版 `'LungNav'`** — 兩者同 origin（sela1227.github.io）不同路徑，IndexedDB 是 origin 級共享，同名會撞資料。總覽頁加「儲存這次查詢」`saveQuery()`（存 code/name/type/stage/mut/age/ecog/hbv/catastrophic/postOp/txProgress/savedAt）；topbar 加「紀錄」→ `openRecords()` 顯示 `p-records` 頁
- p-records 頁三段：(1) 統計卡 `renderRecordsStats`（總查詢數 + 型態分布長條 + 分期分布長條 + 有識別筆數，個管師參考）(2) 歷次查詢卡片 `renderRecordsList`（病人看自己的，顯示識別/型態/期別/時間）(3) 「清除本機紀錄」`clearRecords`（公用裝置隱私，帶確認）
- 識別來源：Q1 既有的選填 `code`（病歷號）+ `name`（姓名，存時 slice 8 字隱私）。不新增輸入欄位，複用現有
- 隱私設計：明寫「紀錄只存這台裝置不上傳」+ 清除鈕。因為民眾版可能是院內公用平板（多病人共用一台）也可能病人自己手機，兩種場景都是「本機紀錄」語意，清除鈕讓公用裝置能保護前一位隱私
- 頁面切換：p-records 用 `body.records` class（比照 summary/questioning 的解鎖捲動）。**坑：`showPage` 用 `classList.toggle` 只管 summary/questioning，不會清 records class** → `closeRecords` 要手動 `classList.remove('records')` 再 showPage(0)。同理 saveQuery 按鈕的「已儲存」態要在每次進總覽頁 reset（否則上次存過殘留）
- 驗證：用 `fake-indexeddb` 端到端測（存 3 筆含選填識別 → 讀出正確 → 統計聚合對 → 清除歸零）。這是第一次用 fake-indexeddb 測 IndexedDB 邏輯，比只驗語法紮實
- 教訓：**同 origin 不同路徑的兩個前端 app，IndexedDB / localStorage 會互撞，dbName 要刻意區隔**。醫護版 `LungNav` 和民眾版 `LungNavPatient` 在 GitHub Pages 是同 origin，若同名 dbName 會共用同一個 DB，病人查詢會混進個管師的病歷庫。這類「同站多 app」的本機儲存，命名空間要從一開始就分開
- 教訓：**加獨立頁面時，既有的「模式 class 切換」機制可能不涵蓋新頁**。showPage 的 toggle 只認 summary/questioning 兩種，新增 records 頁得自己管 body class 的加與清。凡是「n 選一的狀態 class」用 toggle 硬編兩種時，加第三種要檢查所有進出點

### #50 (lung V1.12.1 / V3.2.1)：紀錄頁「寄生在查詢流程」→ 改全屏獨立 overlay
- 症狀：Sela 截圖回報 V3.2.0 紀錄頁跟病人查詢流程混在一起 — 底部殘留「上一題/下一題」actbar、頂部殘留查詢進度點
- 原因：V3.2.0 把紀錄頁做成 `.page`（`class="page" id="p-records"`），塞在查詢流程的 main 容器裡。但 `.actbar`（上一題/下一題）和 topbar 進度點是**全域元件、不隨 page 切換隱藏**，所以紀錄頁「寄生」在查詢框架中，兩個查詢專用元件殘留。這是 BUG-49 教訓的延伸 — 當時只解決了 body class，沒解決「actbar/進度點是全域的」這層
- 做法：紀錄頁從「.page 寄生」改成「全屏獨立 overlay」— `#p-records{position:fixed;inset:0;z-index:200}` 蓋過 topbar+actbar(z:50)+qr-modal(z:100)，比照既有 qr-modal 的 fixed overlay 作法。拿掉 `class="page"` 脫離 page 機制；openRecords 加 `.open` + `body.style.overflow='hidden'` 鎖背景；closeRecords 只移除 `.open` + 恢復 overflow，**不再 `showPage(0)` 硬回 Q1**（overlay 蓋著，底下查詢流程原封不動，關掉就回到開啟前的頁面）
- 教訓：**「獨立頁面」的正解是 fixed overlay 蓋一切，不是 .page 塞進流程容器**。判斷準則：新頁面如果不該有主框架的東西（這裡是 actbar/進度點），就別讓它共用主容器 — 用 fixed overlay 從視覺層級完全脫離。塞進 .page 機制只換來「內容區對了、周邊元件全殘留」
- 教訓：**同類問題會分層出現，一次要挖到底**。BUG-49 修了 body class（第一層），V3.2.0 上線才發現 actbar/進度點也殘留（第二層）。當初做 p-records 時若直接問「這頁該不該有 actbar/進度點」就會一次用 overlay 解決。加新頁面時，把「主框架有哪些全域元件、這頁要不要」一次列清楚

### #51 (lung V1.13.0 / V3.3.0)：民眾版紀錄「載入 → 修改 → 再次儲存」
- 背景：Sela 要個管師能把之前存的查詢紀錄叫回來、改一改、再存回去（不是每次都新增一筆）
- 三塊工程：(1) 紀錄卡片可點 → `loadRecord(id)`：填 S + `restoreAllUI()` 把 S 值回填到所有 Q 頁 UI → 進總覽頁 (2) `pdbEditId` 綁定正在編輯哪筆，`saveQuery` 有 editId 就 `pdbPut` 更新（keyPath id 存在即 update），總覽頁按鈕文字變「更新這筆紀錄」 (3) restart 清 pdbEditId
- **先踩到的坑：saveQuery 原本沒存 t/n/m**（V3.2.0 只存 stage/stageCat/type）。載入時 TNM 按鈕無從回填 → 先補 saveQuery 存 t/n/m 才能做回填。教訓：**存檔要存「能還原 UI 的最小完整集」，不是只存「算出來的結果」**。stage 是 t/n/m 算出來的，只存 stage 能顯示不能還原選擇
- restoreAllUI 的難點是 Q1 三組都用 `.age-btn`（age/hbv/catastrophic）+ hbv/catastrophic 都有 yes/no → 用 `[onclick^="pickHbv"]` 屬性選擇器精準定位，不靠 data-val（會混）。Q3 TNM 要判斷值在簡易組還進階組（`.tnm-simple[data-axis] .tnm-btn[data-val]` 找不到就 tnmAdv=true）決定顯示哪組，再複用 applyQ2Mode / applyPostOpVisuals / recomputeStage 讓衍生 UI 同步
- 驗證：fake-indexeddb 測完整循環 — 存（綁 id）→ 載入改 mut/stage 再存（仍 1 筆＝更新）→ 清 editId 存新（2 筆＝新增）。全綠
- 教訓：**「回填 UI」是「清空 UI」的鏡像，有 restart 就照著寫 restoreAllUI**。restart 清哪些 class/input，restoreAllUI 就依 S 把那些設回去。兩個函式要對稱維護 — 之後加 Q6 欄位，restart 跟 restoreAllUI 都要記得加（又一個「兩處要同步」，同 BUG-46 家族）
- 教訓：**onclick 屬性選擇器 `[onclick^="fnName"]` 是「同 class 不同用途按鈕」的精準定位法**。當多組按鈕共用同一 class（省 CSS）又要分別操作時，比起硬加 id / data 屬性，用既有的 onclick 綁定來選最省事

### #52 (lung V1.13.1 / V3.3.1)：SPA 沒接 History API → 系統返回鍵整頁跳走
- 症狀：Sela 回報民眾版「導航/返回有時整個跳到不知道哪頁」
- 診斷過程（值得記）：先建導航模擬 harness 窮舉「4/5/6 頁三型態 × 前進到底 × 返回到底 × 中途改期別 × 載入紀錄 × 開關 overlay」→ **頁內 JS 導航邏輯全部正確**（goNext/goPrev/loadRecord 的 stepIdx 與 activePage 完全同步，返回鏈都是前進鏈的反向）。模擬測不出 bug，反而是最有用的線索：既然頁內邏輯對，「整頁跳走」就不是 JS 導航問題，而是**瀏覽器層級**的
- 真兇：民眾版是單頁 SPA（JS 切 .page），但沒接 History API。使用者按手機/瀏覽器的「返回鍵、返回手勢」→ 瀏覽器直接離開 patient.html 回 portal（或前一站），使用者以為是「上一題」→ 不預期整頁跳走。這解釋「有時」（用頁面按鈕沒事、用系統返回就跳走）
- 做法：`initBackButton` — `history.pushState` 墊一筆，`popstate` 攔截：overlay/QR 開著先關 → Q2-Q5/總覽 轉 goPrev → 只有 Q1 放行 `history.back()` 離開。每次攔截後補 pushState，形成「持續攔截直到 Q1」
- 教訓：**模擬測不出 bug，本身就是強線索 — 代表 bug 不在你測的那層**。頁內導航邏輯窮舉全過，反而證明問題在更上層（瀏覽器 history）。與其反覆看 JS，不如問「哪一層我還沒驗」。debug 時「排除法」跟「找到」一樣有價值
- 教訓：**任何用 JS 切畫面的 SPA，第一天就該接 History API**。只要頁面看起來會「切換」但 URL 沒變，使用者的系統返回鍵預期就會落空。這類 file-based 單頁工具最容易漏 — 因為「看起來像多頁」但瀏覽器只有一個 entry。判準：畫面會切換 + URL 不變 = 要嘛接 history、要嘛接受返回鍵離開
- ⚠️ 待實機確認：History API 攔返回鍵的行為（尤其 Q1 放行離開、overlay 開著返回先關）只有真機/真返回鍵測得準，本地語法檢查驗不到 popstate 實際行為

### #53 (lung V1.13.2 / V3.3.2)：民眾版存檔又漏一個欄位 — 團隊醫師選擇 consult
- 症狀：Sela 回報「團隊狀態沒有儲存」。民眾版總覽頁選的照護團隊醫師（S.consult = {surgery:名, medicine:名, radonc:名}）在存查詢/載入時沒被保存
- 原因：`saveQuery` 的 rec **完全沒列 consult**；更糟的是 `loadRecord` 還把 `consult:{}` 寫死清空。所以存了讀不回、載入還被清掉
- 做法：saveQuery 加 `consult:{...S.consult}`（深拷貝避免共用參照）、loadRecord 改 `consult:{...(rec.consult||{})}`。載入後 showPage(5) → renderSummary → renderTeam 依 S.consult 重繪選中醫師，不必在 restoreAllUI 特別處理（consult 是總覽頁的東西，不是 Q 頁）
- 教訓：**這是 BUG-51「存檔要存能還原的最小完整集」的直接復發**。V3.3.0 補 t/n/m 時，只想到「TNM 按鈕要回填」，沒把總覽頁的 consult 一起盤點進去。存檔漏欄位這個坑，在同一個 saveQuery 上踩了兩次（先 t/n/m、再 consult）— 印證 BUG-46「欄位集散落多處是隱性遺失溫床」。**下次動 saveQuery/loadRecord，先把 S 物件所有欄位列一遍逐一問「這個要不要存」，而不是想到哪個補哪個**
- 一勞永逸的方向（記給下版）：民眾版也該學醫護版 BUG-46 抽一個 `collectQueryFields()` 單一真相，saveQuery 存它、loadRecord 還原它、restart 清它 — 三處共用一份欄位清單，就不會再漏。目前欄位還少（~17 個）手動列可接受，但已經漏兩次了，該抽

### #54 (lung V1.14.0 / V3.4.0)：醫護版進入密碼 + 民眾版基因/免疫檢測併存
- 任務 1（密碼）：醫護版加全屏 `#auth-gate` overlay（z:9999，蓋一切），輸入 `（密碼見院內交接，不寫入文件）` 存 `sessionStorage('lungnav_auth')`（同 session 免再輸）。`initAuthGate` IIFE 在 boot 前檢查 sessionStorage，已驗證就 `.hidden`。密碼明碼在 `AUTH_PASS` 常數 — 純前端擋非醫護人員，**不是高強度安全**（能看原始碼就能繞過），Sela 認知這點
- 任務 2（基因/免疫併存）：原本 Q4 把驅動基因（EGFR/ALK/ROS1/BRAF/MET/KRAS）跟 PD-L1（PDL1_HIGH/LOW）**擠在同一組 mut 單選**，互斥。但臨床上驅動基因（標靶 biomarker）跟 PD-L1（免疫 biomarker）是兩種不同檢測，可併存（病人可 EGFR+ 且 PD-L1 60%）
- 做法：Q4 拆兩區 — `#opt-mut`（驅動基因，S.mut，必選，去掉 PDL1_*，NONE 改「無/未驗」）+ `#opt-pdl1`（PD-L1，S.pdl1 新欄位 HIGH/LOW/UNKNOWN，選填）。pickMut 拿掉自動 goNext（要讓使用者續填 PD-L1），加 pickPdl1
- buildPath META 改「**driver 優先，無 driver 才看 pdl1**」：有驅動基因→走標靶（原邏輯）；無驅動基因（NONE）→ 依 S.pdl1：HIGH→免疫單藥、LOW→化療+免疫、未驗→先完整檢測。**臨床安全把關**：driver+ 且 PD-L1 高時加 warn「PD-L1 高但驅動基因陽性仍標靶優先（免疫對 driver+ 效果差）」— 避免病人誤以為 PD-L1 高就該免疫
- **記取 BUG-53 教訓**：這次加 S.pdl1 新欄位，一次盤點所有存取點 — saveQuery / loadRecord / restoreAllUI / restart（4 個清空點）全部同步加 pdl1，沒有再漏。這就是 BUG-53 說的「先把 S 所有欄位列一遍」的正面實踐
- 驗證：buildPath 6 組合分流全綠（EGFR+/PD-L1未填→標靶、EGFR+/PD-L1高→標靶+提醒、無驅動/高→免疫單藥、無驅動/低→化療免疫、無驅動/未驗→先檢測、ALK+/高→標靶+提醒）
- 教訓：**「兩種不同檢測擠在同一組單選」是資料模型錯誤，不是 UI 問題**。驅動基因跟 PD-L1 是正交的兩個維度（一個決定標靶、一個決定免疫），從一開始就不該共用一個 S.mut。發現「使用者要能同時選 A 和 B」時，先問「A 和 B 是不是同一維度」— 不是就拆欄位，而不是想辦法讓單選能多選
- ⚠️ 待辦：edu-patient QR 衛教頁的 buildPathFromData 還是舊的 PDL1_HIGH/LOW 單維邏輯 + QR payload 沒帶 pdl1。要同步（雙人口資料源，BUG-41 家族）— 但 QR payload 格式改動要考慮相容性，列為緊接的待辦

### #55 (lung V1.14.1 / V3.4.1)：V3.4.0 密碼機制四個問題一次修
- 背景：Sela 回報 V3.4.0 醫護版密碼 4 問題 — (1) 輸對密碼進不去 (2) 密碼該在 portal 點醫護版時確認、非進 lung 才確認 (3) 明碼不遮蔽 (4) 密碼 （密碼見院內交接，不寫入文件）
- 問題 1 推斷：原本 lung 密碼用 `<input type="password">`，很可能觸發瀏覽器/密碼管理員的自動填，把 value 蓋成記住的其他密碼，導致 `value !== '（密碼見院內交接，不寫入文件）'` 判斷失敗。改 `type=text` 明碼（正好符合需求 3）+ `submitProAuth` 用 `.trim()` 比對，兩個一起避開
- 架構調整（需求 2）：**整個密碼機制從 lung/index.html 搬到 portal(index.html)**。原本做在 lung 是「進到頁面才擋」，Sela 要的是「點醫護版當下就擋」。做法：portal 的 pro 癌別卡片 onclick 前包 `requireProAuth(cb)` → 明碼 modal → 對 → `sessionStorage('pro_auth')='1'` + 執行 cb（跳轉）。lung/index.html 移除 auth-gate，改 `proGuard` IIFE：沒 `pro_auth` flag（直接輸網址未經 portal）→ `location.replace('../')` 踢回 portal
- sessionStorage 同 origin 共享：portal（`/Lung-ca-nevigation/`）設的 flag，lung（`/Lung-ca-nevigation/lung/`）讀得到，所以 portal 驗證 → lung 守衛放行。同 session 再點醫護版免重輸
- 驗證：node 模擬 4 情境（點醫護版彈框、輸錯擋+錯誤訊息、輸對 （密碼見院內交接，不寫入文件） 進入+存 flag、同 session 免重輸）全綠
- 教訓：**純前端密碼別用 `type=password`**。password input 會招來瀏覽器密碼管理員自動填，反而干擾一個「單一固定密碼」的簡單驗證。這種「不是真帳密、只是一道門」的場景，用 `type=text` 明碼更穩（且通常也希望使用者看得到自己打什麼）
- 教訓：**「在哪一層擋」要順著使用者的心智流**。Sela 說「點醫護版就確認」— 攔截點該在「做出選擇的那個動作」（portal 點卡片），不是「到達目的地之後」（lung 載入）。安全閘門放在決策點比放在目的地更符合直覺，也少一次「都進來了才被擋」的困惑
- 註：純前端密碼 + sessionStorage 守衛擋得住「不小心點進來的人」，擋不住「會看原始碼或直接改 sessionStorage 的人」。Sela 認知這是「一道門」不是「保險箱」

### #56 (lung V1.14.2 / V3.4.2)：edu-patient QR 衛教頁同步 PD-L1（了結 V3.4.0 待辦）
- 背景：V3.4.0 把 patient.html 的 Q4 拆成驅動基因 / PD-L1 兩維度，但 edu-patient（掃 QR 的唯讀衛教頁）沒同步 — 還是舊的 PDL1_HIGH/LOW 單維邏輯，且 QR payload 沒帶 pdl1。掃 QR 看到的路徑會跟查詢工具不一致
- 做法：兩處對齊 —（送）patient.html `buildEduPayload` 加 `pd:S.pdl1`；（收）edu-patient `buildPathRawCoreFromData` 讀 `d.pd`，META 的 PDL1_HIGH/LOW 舊分支改成「無 driver 看 pdl1 的 HIGH/LOW/未驗」+ driver+PD-L1高的標靶優先 warn，mutDisplay 拿掉 PDL1_* 改用 pdl1Display，meta 顯示加 PD-L1
- **舊 QR 相容**：payload 缺 `pd` 時（V3.4.2 前印的 QR）→ `d.pd||''` 為空 → 走「未驗」分支（NONE→先檢測、有 driver 仍走標靶）。不會壞舊 QR，只是看不到 PD-L1 那段（本來舊 QR 也沒這資訊）
- 驗證：edu 6 組合分流 + 2 個舊 QR 相容情境，全部與 patient.html 一致
- 教訓：**雙人口資料源（patient / edu-patient）改一邊，另一邊是「已知的待辦」不是「忘記的 bug」**。BUG-41 就踩過醫護版 / 民眾版醫師名單不同步。這次 V3.4.0 動 patient.html 時就當場把 edu 同步列進下版 #1，V3.4.2 補上 — 有意識地延後 + 記錄，比默默漏掉好。但根本解仍是下版候選的「抽 lung/_path.js 共用」（patient / edu 兩份 buildPath 平行維護的負擔，改一次要動兩處臨床邏輯，風險高）
- 教訓：**payload 加欄位天然要考慮舊資料相容**。QR 碼印出去就固定了，新增欄位一定要「缺省時有合理行為」。這裡 `d.pd||''`→未驗 是安全缺省。任何「已經發出去、收不回來」的資料格式（QR、URL、存檔），加欄位都要問「舊的沒這欄位會怎樣」

### #57 (lung V1.14.3 / V3.4.3)：app logo 整合（走 SELA Kit §17 + §10.2 工作流）
- **App logo 來源記錄（Kit §10.2 step5 要求）：** app logo = 白色蜿蜒路徑 + 節點 + 右上箭頭（呼應臨床路徑導航「從分期到治療每一步」）；設計來源 = SELA 用 Gemini 生成 + Claude 依 §10.2 優化轉檔；**本專案不使用 SELA 主 logo（SELA 決定），只有 app 子 logo**，故無 SELA 品牌歸屬微標
- 流程：先依 Kit §17 自動工作流產 `SELA-logo-prompt.md`（範本 B 醫療專業型、壁虎不繼承依 §13.2 明列、底色 #5B8FB9 因「配色不改」用專案主色）→ SELA 用 Gemini 生圖 → Claude 走 §10.2 四步優化
- §10.2 優化做法（這次的具體處理）：Gemini 給 1024² RGB 白底圖，實際底色是 #4780AD（比目標 #5B8FB9 深）+ 右下角有 Gemini 浮水印。用「floodfill 四角外圍白 → 抽白色主體 mask（min RGB>200）→ 用純 #5B8FB9 底重新合成」一套到位：同時完成白底轉滿版、底色校正 #4780AD→#5B8FB9、抹除浮水印（浮水印非主體白 → 併入底色）、邊緣羽化。母圖滿版不做圓角（§10.2 圓角交顯示端）
- 套組（§10.4）：Pillow 從母圖生 16~1024 多解析度 + favicon.ico（16/32/48 內嵌）+ apple-touch-icon 180 + android-chrome 192/512 + site.webmanifest（客製 name「癌症臨床路徑導航」+ theme_color #5B8FB9）。放專案根目錄 `favicon/`，7 個 HTML `<head>` 加引用
- **路徑相容坑**：GitHub Pages 子路徑部署，favicon 用相對路徑 — portal（根目錄）`favicon/`、lung/ 底下 `../favicon/`。絕對路徑 `/favicon/` 在 `sela1227.github.io/Lung-ca-nevigation/` 子路徑會 404（呼應 Kit 坑 #39）
- 各頁既有 `theme-color`（portal #37516b、民眾版 #0d9488）**不動** — 那是各頁介面色（§4.1.1「品牌色 vs 介面色」兩概念），webmanifest theme_color 才用 logo 主題色 #5B8FB9
- 教訓：**生圖 AI 給的底色會偏、要校回專案色票**。Gemini 給 #4780AD、prompt 明明指定 #5B8FB9 — 擴散模型對精確 hex 不可靠。「配色不改」的專案，logo 底色一定要在後製校正回 UI 用的那個 hex，否則 favicon 跟介面主色對不齊，並排看得出色差

### #58 (lung V1.14.4 / V3.4.4)：民眾版儲存查詢加識別防呆
- 需求：Sela 交辦 — 民眾版存查詢時若病歷號、姓名都沒填 → 跳提醒，至少填一項才能存
- 做法：`saveQuery` 開頭 `if(!(S.code||'').trim() && !(S.name||'').trim()){ alert(...); return; }`。trim 避免只打空白也算填
- 為什麼合理：民眾版紀錄的兩個用途都靠識別 — V3.2.0 統計「給哪些病人看過」、V3.3.0 個管師「載入某筆修改」。無識別的紀錄在列表顯示「（未填識別）」、統計歸不了人、載入也認不出是誰。存檔前強制至少一項，是資料品質的源頭防呆
- 教訓：**有下游會用到的識別欄位，在「產生資料的那一刻」就該擋，不是等下游發現空的才處理**。民眾版 code/name 一路選填到 V3.4.3，直到統計/載入功能成熟才發現「沒識別的紀錄是雜訊」。防呆放在 saveQuery（入口）比放在 renderRecordsStats / loadRecord（出口各處）省事且一致 — 一個入口擋掉，所有下游都乾淨。未來擴充其他癌別的民眾版紀錄，沿用這個入口防呆

### #59 (V3.4.5)：GitHub Pages 部署 "Deployment failed, try again later." 卡住
- 症狀：push 後 Actions 的 `deploy` job 失敗，log 只有 `Getting Pages deployment status... Error: Deployment failed, try again later.`。build job 是綠的、artifact 成功產生（截圖 github-pages 412KB）。跨多次 push、換 commit、隔時間都持續失敗
- **關鍵診斷：build 綠 + artifact 產生 = 檔案沒問題**。GitHub Pages 部署分三 job（build→report→deploy），檔案問題會卡在 build 變紅；卡在 deploy 的「Getting deployment status」是 GitHub 把 artifact 推上線的階段失敗，純服務端。**Sela 一度懷疑是 V3.4.2→V3.4.3 加 favicon 造成 — 排查後確認無關**（favicon 184KB、webmanifest JSON 合法、ico 合法、所有 md 無 Liquid 語法，且 build 綠已證明）
- 原因：這是 GitHub Pages 端的已知問題（actions/deploy-pages issue #418「總在第一次成功部署後開始失敗」，查證時仍 Open 無解）。最可能是**密集 push（V3.4.0→4.4 短時間多版）觸發部署 pipeline 卡住、鎖沒釋放**，後續全部排隊/失敗（曾出現 Queued 15 分鐘）
- 解法（兩條，V3.4.5 採第二條當根治）：
  - **A 最快、不改檔**：Settings → Pages → Source 切換一下（改成別的再改回）強制 GitHub 重建部署 pipeline；或 Settings → Environments → github-pages 取消卡住的 pending deployment + Actions 頁取消多餘排隊 run
  - **B 根治**：加 `.github/workflows/deploy.yml` 自訂部署（upload-pages-artifact + deploy-pages）+ **`concurrency: {group: pages, cancel-in-progress: true}`** — 密集 push 時新部署自動取消排隊中的舊部署，不再堆積卡死。要 Settings → Pages → Source 改成「GitHub Actions」才生效。同時加 `.nojekyll`（純靜態跳過 Jekyll，部署更快）
- 教訓：**CI 三階段卡在哪一階段，就決定了是誰的問題**。build（檔案→artifact）綠 = 你的檔案 OK；deploy（artifact→上線）紅 = 平台端。別在檔案裡瞎找一個不存在的原因（Sela 三輪都在懷疑程式碼，實際 build 早就綠了）。看 job 卡在哪比看 error 訊息更快定位
- 教訓：**密集 push 的專案，部署要有 concurrency 護欄**。dynamic（Deploy from a branch）自動 workflow 沒有 concurrency，短時間多次 push 容易互卡。自訂 workflow 加 `cancel-in-progress: true` 是根治

### #60 (V3.4.6)：醫護版治療決策用 tstage 代替實際 stage → IIIA 誤標 IIIB（臨床安全）
- 背景：Sela 交辦逐條檢查醫護版每條路徑抉擇，防「stage IIIA 卻做 IIIB 建議」這類分期↔治療錯配（腫瘤科嚴重問題：IIIA 多可手術、IIIB 多不可切，路徑完全不同）
- 症狀：醫護版治療決策 `_NSCLC` 物件的 `'N2'` 分支，用 `const isT3N2 = s.tstage==='T3'` 分「路線A/B（可手術評估）vs 新輔助（標題寫死 Stage IIIB）」，**完全沒看 N2a/N2b**
- 原因：AJCC 9th 把 N2 拆 N2a（單站）/N2b（多站），同一個 T 期會落在不同 stage — T3N2a=IIIA、T2N2b=IIIB。只用 tstage===T3 當分界 → **T3N2a（實際 IIIA）被標「Stage IIIB 新輔助」、T2N2b（實際 IIIB）被走 IIIA 路線 A/B**。兩個方向都錯配
- 做法：改用 `const isIIIB = s.stage==='IIIB'` 分路（`s.stage` 是 `computeAJCC(t,n,m)` 算好的實際分期、決策物件本來就帶著、標題列 `_hdr` 早就在用），標題從寫死「Stage IIIB (T3,N2)」改成動態 `Stage ${s.stage}（${s.tstage}${s.nstage}）`。同步修 N2 教學卡：標題拿掉誤導的「(T1-2,N2)=IIIA /(T3,N2)=IIIB」T 綁定、footer 註明「IIIA/IIIB 依 N2a/N2b 判定非依 T 期，如 T3N2a=IIIA、T2N2b=IIIB」
- 其他路徑逐條查過**沒問題**：TNM→stage 推算（computeAJCC）核對 AJCC 9th 全對；`resect_adv`/`N3`/`T4N2N3` 標題用 `_hdr` 動態顯示 `s.stage`；`getAdjuvantHTML/Summary` 用實際 pstage 逐一對應；checklist 的 surgery（非IV且<IIIB）/rt（IIIB/IIIC）條件用實際 stage。錯配只在 `'N2'` 這一處
- 教訓：**臨床決策分支一律用「算好的最終分期」判斷，絕不用 T/N 單軸去猜 stage**。TNM→stage 有 computeAJCC 這個單一真相（呼應 BUG-46），決策端就該直接讀它的輸出，任何在決策端「用 tstage==='T3' 推 IIIB」的重算都是繞過真相、遲早跟真相分叉。凡看到治療分支在讀 `tstage`/`nstage` 而非 `stage`，就是可疑點
- 教訓：**分期系統改版（8th→9th）最大的坑是「同 TNM 不同 stage」的新拆分**。N2a/N2b 是 9th 新增，任何 8th 時代寫死「T3N2=IIIB」的邏輯在 9th 都可能錯。之後若院內指引再升版，優先重查所有「硬編 TNM→治療」的地方

### #61 (V3.4.7)：M1b 分期用詞錯誤 — 轉移期寫成「局部晚期」（接 BUG-60 臨床安全審查）
- 背景：Sela 交辦續查其他期別，尤其 T4、M1a/b/c。逐條核對 T4 與 M1 的 stage 推算 + 路由 + 治療分支性質
- 查核結果 — **T4 與 M1 路由全部相符無錯配**：T4N0/N1=IIIA→`resect_adv`(可切評估)、T4N2/N3=IIIB/C→`T4N2N3`(CCRT 不可切)、M1a/M1b→IVA、M1c1/M1c2→IVB。各分支標題用 `_hdr` 動態顯示實際 stage，沒有 BUG-60 那種硬編錯標
- 發現的問題（用詞層級，非路由錯配）：`'M1b'` 分支內文寫「**局部晚期** — 腦部轉移 / 其他部位」。但 M1b = 單一胸腔外轉移 = **IVA 轉移期（寡轉移 oligometastatic）**，「局部晚期」(locally advanced) 是 stage III 的稱呼 — 跟 `_hdr` 同時顯示的「Stage IVA」自相矛盾。且 M1b 依定義是單一轉移，內文卻列「多處轉移」（那是 M1c）
- 做法：M1b「局部晚期」改「寡轉移/單一轉移」、移除「多處轉移」條、加 M1b 定義 box（單一胸腔外轉移、IVA、可局部根治+全身、預後優於 M1c）。M1a 順手補完整：原本只講肋膜/心包積液，但 M1a 也含「對側肺葉結節」→ 加定義 box 標明涵蓋範圍 + IVA，與 M1b 對稱
- 教訓：**分期↔治療審查要同時查「路由對不對」和「用詞對不對」**。BUG-60 是路由錯配（IIIA 走 IIIB 路線，會給錯治療）；這條是路由對但用詞錯（M1b 治療內容對，但講成「局部晚期」會讓醫護/病人誤解分期）。臨床工具的分期術語錯誤即使不改治療方向，也會誤導判讀 — locally advanced(III) 和 metastatic(IV) 是完全不同的預後與治療哲學，不能混用
- 教訓：**內文的分期描述要跟動態 stage 標題對齊**。`_hdr` 已顯示正確 Stage IVA，內文若還沿用舊的「局部晚期」措辭就會打架。凡標題用變數顯示 stage、內文卻寫死分期形容詞的，都要檢查一致性

### #62 (V3.4.8)：基因/免疫檢測建議 + 對應藥物 — 藥名對齊 drugs-pro 單一真相
- 需求：Sela 交辦補「基因檢測/免疫檢測的檢查建議項目 + 相對應藥物」。醫護版 M1c 轉移期原本給藥是泛稱（「依 EGFR 突變類型選擇對應標靶藥物」、「BRAF(+) 雙標靶藥物」— 沒具體藥名）
- 做法：建 `_BIOMARKER_TABLE`（7 項：EGFR/ALK/ROS1/BRAF/MET/KRAS/PD-L1 → 對應藥物 + 健保 tag）+ `_biomarkerHTML()` 生成對照卡，插在 `_M1c_NS`/`_M1c_SQ` 結尾。各 mutation 泛稱補具體藥名
- **關鍵：藥名與健保狀態全部對齊 `drugs-pro.html` 藥物庫（31 藥、對齊健保第 9 章）當單一真相**，不在決策頁自己編。從藥物庫提取：EGFR→Osimertinib 泰格莎/Afatinib 妥復克…、ALK→Alectinib 安立適…、ROS1→Entrectinib 羅思克、BRAF V600E→Dabrafenib+Trametinib 泰伏樂+麥欣寧(NHI二線)、MET ex14→Tepotinib 特癌適(NHI不分線)、**KRAS G12C→Sotorasib 魯瑪克拉斯(自費 SELF)**、PD-L1→Pembrolizumab 吉舒達 等
- 教訓：**藥名/健保給付是「業務對映單一真相」（章法二），決策頁引用不自編**。drugs-pro 是對齊健保第 9 章 + 附件 2 的權威來源，決策頁若自己寫「BRAF 雙標靶」而不對齊，健保線數/自費與否遲早跟藥物庫分叉。做法：先從 drugs-pro 提取 en/zh/nhi/line，決策頁的對照表照抄。日後健保給付調整，改 drugs-pro 一處、決策頁對照跟著對（未來可考慮真的抽成共用資料，現在手動對齊可接受）
- 待辦：對照卡目前只放 M1c（轉移期，基因指引用藥的核心）。stage III 不可切轉系統治療時（N2/N3/T4N2N3 的「基因檢測後系統治療」box）也需基因指引，若 Sela 要可再加 `_biomarkerHTML()`；但 III 期主軸是 CCRT，暫不強加避免決策頁過長

### #63 (V3.4.9)：民眾版檢測組套建議做進醫護版 + 醫令碼 toggle
- 需求：Sela 交辦 (1) 確認民眾版的「基因檢測組套建議」也做進醫護版 (2) 醫護版加按鈕叫出醫令碼（平常隱藏，醫令碼醜不礙眼）
- 釐清兩個「基因」東西不同：民眾版 `buildGeneTestAdvice` = 依分期建議「該開哪些檢測 + 健保給付」（檢測端）；V3.4.8 的 `_BIOMARKER_TABLE` = 檢測陽性「對應哪些藥」（治療端）。醫護版原本只有後者 + checklist 一項 NGS，缺前者的動態組套建議
- 做法 (1)：`_genePanelHTML(s)` 對應民眾版依分期邏輯（非鱗晚期 EGFR/ALK/PD-L1 健保+ROS1 材料費、鱗狀晚期 PD-L1 健保+EGFR/ALK 自費、早期多自費），醫護版更完整（晚期非鱗列 10 項含 BRAF/MET/KRAS/RET/NTRK/HER2 走 NGS）。決策頁 `pw-content` 的 `result.tx` 後 append，SCLC 回空字串不顯示（不做驅動基因）
- 做法 (2)：每項掛醫令碼 span、CSS `.gp-code{display:none}` 預設隱藏，標題列「顯示/隱藏醫令碼」按鈕 `toggleOrderCodes` 切換 `.tx-box.show-codes`。符合 Sela「平常隱藏醜醜的醫令碼」
- **⚠️ 醫令碼 Claude 不捏造**：醫令碼是彰濱秀傳醫院系統的真實檢驗代碼，編錯會讓醫護照著開錯單 = 臨床安全風險。`ORDER_CODES` 各欄留空字串、UI 顯示「（待院方填入）」，架構+按鈕都到位，等 Sela 填真實碼即顯示
- 教訓：**遇到「醫院/機構特定的真實代碼」（醫令碼、健保申報碼、病歷號規則），建架構不填內容**。這類代碼錯了有實際後果（開錯單、申報錯），不是 Claude 能推測的。正確做法：把欄位、UI、toggle 都做好，值留空 + 明確標「待院方填入」，讓有權威來源的人填。跟 BUG-57 logo「不捏造 SELA 主 logo」同精神 — 沒有權威來源的內容不編

### #64 (V3.5.0)：真實醫令碼填入 — 發現「同一檢測依分期/組織型態碼不同」
- 背景：BUG-63 建好架構 + 標「待院方填入」，Sela 隨後提供彰濱秀傳「肺癌基因檢測開單速查表 2025/06」— 正是權威來源。V3.5.0 填入真實資料
- **關鍵發現（V3.4.9 架構沒料到的）：醫令碼與費用「依分期/組織型態不同」**，不是每個檢測一個固定碼：
  - EGFR：非鱗晚期 `30101B`（健保 0）／ 鱗狀或早期 `L09010A`（自費 10,000）
  - ALK：非鱗晚期 `30105B`（健保 0）／ 其他 `30105B 勾選自費`（自費 9,482）
  - PD-L1：晚期 `30103B + L09017A`（IHC+分子綁定，健保+材料 300）／ 早期只 `L09017A`（材料 300）
  - ROS1：全組 `L09021`（材料 300）
- 做法：V3.4.9 的單一 `ORDER_CODES = {egfr:'',...}` 架構不夠 → 重構成 `GENE_PANEL_DATA` 三組（`ns_adv` / `sq_adv` / `early`），每組各自列真實醫令碼 + 費用。`_genePanelHTML` 依 type+stage 選組別。費用當 badge 平常可見、醫令碼 toggle 隱藏（沿用 BUG-63 的 toggleOrderCodes）。加頂部「一次開齊 PD-L1 綁定」提醒（速查表的重點）
- 教訓：**建 placeholder 架構時，先想「這值是不是 context-dependent」**。V3.4.9 假設「一個檢測一個醫令碼」，拿到真實資料才發現同一檢測在不同分期是不同碼 + 不同費用。若當初架構設計成 `{檢測:{組別:碼}}` 巢狀，填資料就不用重構。教訓：業務代碼常隨情境變化（分期、給付身份、院區），placeholder 架構寧可先做成「情境 × 項目」二維，不要假設一維
- 教訓：**速查表這類「已經是表格的院內資料」直接照搬結構最安全**。原始速查表就是「三組 × 檢測項目 × (醫令碼,費用)」，程式資料結構 `GENE_PANEL_DATA` 一比一對應，之後 Sela 拿新版速查表比對時，一眼看得出哪格改了。不要自作聰明重新分類

### #65 (V3.5.1)：拿真實速查表反向驗證民眾版，抓到 ROS1 費用標錯
- 背景：V3.5.0 拿到真實速查表填了醫護版，Sela 要求也驗民眾版對不對（民眾版 = 醫護版簡化、無醫令碼、引導接受不推銷）
- 做法：把速查表當真相，逐項對照民眾版 `buildGeneTestAdvice` 三組（非鱗晚期/鱗狀晚期/早期）的健保/自費/材料費標示
- 抓到：**早期組 ROS1 標錯**。原本 `EGFR / ALK / ROS1` 三個綁一起標「自費」，但速查表 ROS1 **全部組別都是材料費 300**（`L09021`），從不是萬元自費。EGFR/ALK 才是自費（L09010A 一萬 / 勾選自費 9482）
- **為什麼這個錯特別該修**：民眾版定位是「引導接受檢測、不推銷」。ROS1 誤標「自費」會讓病人以為跟 EGFR/ALK 一樣要上萬元而卻步 → 正好擋掉了本來只要 300 就能做的檢測，跟「引導接受」背道而馳。標對成「材料費」反而降低接受門檻
- 修：早期 ROS1 從綁定拆出、改材料費；順手把便宜的（PD-L1/ROS1 材料費）排前面、貴的（EGFR/ALK 自費）排後面 — 病人先看到低門檻項目。①②組本就對齊速查表
- 教訓：**「簡化版」可以少講細節，但不能講錯方向**。民眾版簡化醫護版是對的（不列醫令碼、不列精確金額），但「自費 vs 材料費」是數量級差異（萬元 vs 數百），簡化時把 ROS1 併進「自費」就從「省略細節」變成「給錯資訊」。簡化的界線：可以模糊金額，不能把材料費說成自費
- 教訓：**拿到權威資料時，順手回頭驗所有「當初靠推測填的地方」**。民眾版費用標示是早期（V3.0.6）憑一般認知填的，直到 V3.5.0 拿到速查表才有真相可校。有新權威來源時，主動掃一遍所有相關的舊推測值，別只改當下那處

### #66 (V3.5.2)：醫護版桌面 sidebar 太小
- 症狀：Sela 截圖回報醫護版電腦版左側導航列圖示/文字在寬螢幕上太小、難點
- 原因：桌面版 sidebar 沿用偏手機的小尺寸 — 寬 72px、圖示 17px、**文字 9px**（9px 在大螢幕明顯過小）
- 做法：桌面版放大 sidebar 92→96px / logo 50 / nav-item 74×64 / 圖示 22px / 文字 12px。手機版 bottom bar（`@media`）不動。`.app` flex 自適應無 hardcode 寬度，主內容自動縮
- 教訓：**桌面 UI 不要沿用手機的小字級**。同一份 CSS 桌面/手機共用時，字級容易被壓到手機尺寸（9px 在手機底部欄可接受、桌面側欄就太小）。桌面元件字級至少 11-12px 起跳

### #67 (V3.5.3)：QR 掃出來跟畫面不一樣 — payload 沒帶 stageCat、edu 反推失敗
- 症狀：個管師反應民眾版產的 QR 掃出來（edu-patient 衛教頁）跟 patient 畫面原本內容不一樣
- 原因：雙人口資料源（patient buildPath / edu buildPathFromData 平行維護，BUG-56 家族）。QR payload 只送 `s`（stage 字串）不送 stageCat，edu 用 `deriveStageCat(d.s)` 從 stage **反推** stageCat（IV→META、III→LOCAL、0/I/II→EARLY）。但 **NSCLC 簡易模式**（病人只點早期/局部/轉移、沒填 TNM）時 `S.stage` 是空字串 → payload `s=''` → `deriveStageCat('')` 回空 → edu 的 `st=''`，所有 `st==='LOCAL'` 分支全 false → 走不到正確治療路徑。而 patient 畫面直接用 `S.stageCat`（病人選的），所以畫面對、掃 QR 錯
- 做法：payload 加 `sc:S.stageCat` 直接帶過去；edu `d._stageCat = d.sc || deriveStageCat(d)`（有 sc 用 sc、舊 QR 無 sc 才反推，相容）
- 驗證：寫 vm 對照 harness 同時載入兩個檔案，同一組 S 跑 patient `buildPathRaw` vs edu `buildPathRawCoreFromData(payload)`，比首步治療。8 組（簡易 EARLY/LOCAL/META + 進階 IVA + 鱗狀 IIIB + SCLC limited/extensive + driver/pdl1 各種）修復後全一致。harness 也直接印出「簡易模式 s= 空」證實病根
- 教訓：**雙人口資料源，接收端不要「反推」發送端已經有的東西**。`deriveStageCat` 是 edu 在猜 patient 早就知道的 stageCat — 猜錯就分叉。直接把 stageCat 塞進 payload 讓 edu 照用，比反推可靠。呼應 BUG-53「存檔要帶足以重建的最小完整集」的 QR 版：payload 要帶的不只是「顯示用的 stage 字串」，還要帶「決定路徑分支的 stageCat」
- 教訓：**「從顯示值反推狀態」的邏輯，死角是「顯示值可能為空」的輸入**。簡易模式只有 stageCat 沒有 stage，正好讓「從 stage 反推」踩空。任何反推邏輯都要問：有沒有一種合法輸入讓被反推的來源是空的/不完整的
- 教訓：**跨檔案一致性用 vm 對照 harness**：`vm.createContext` 各自隔離載入兩個 HTML 的 script（init 錯誤 catch 掉、用第二段 runInContext 抓 export），同輸入比兩邊輸出。這是驗證雙人口資料源沒分叉最直接的方法，比人工比對兩份程式碼可靠。下次動 patient/edu 任一邊的路徑邏輯，跑這個 harness

### #68 (V3.6.0)：抽共用 engine（純抽取）— 機械替換誤傷 + 重構分版原則
- 背景：外部審稿指出 patient/edu 又分叉（edu 還留著 patient 已移除的術後基因檢測提醒），加上 Sela 確認**下一個癌別是大腸直腸癌**，決定先抽共用再修臨床
- 產出：`lung/_staging.js`（AJCC 9 查表，三頁共用）+ `lung/_path.js`（民眾版路徑引擎，patient/edu 共用）。介面吃顯式 `state` 物件不依賴全域 S；edu 用 `stateFromPayload(d)` 轉接（唯一轉接點）
- **量化分叉嚴重性**：edu 收斂到 patient 後，3,240 組測試中 **600 組（18.5%）內容改變** — 也就是抽取前每 5 次掃 QR 就有近 1 次跟畫面不同。這數字說明「平行維護兩份臨床邏輯」不是理論風險
- **踩到的坑（重要）**：把 `S.` 全域字串替換成 `state.` 時，**`DRUGS.EGFR` 被誤傷成 `DRUGstate.EGFR`**（"DRUGS." 裡含 "S."）。`node --check` **完全抓不到**（`DRUGstate.EGFR` 語法合法，執行才 ReferenceError），是 124,416 組窮舉 harness 抓出來的
- 教訓：**大規模機械替換一定要用字界 `\bS\.`，而且語法檢查不等於行為正確**。`node --check` 只驗語法；識別碼被替換污染是「語法合法、執行才炸」的類型。凡是跨檔搬移/大量 sed/replace，必須有**行為等價測試**護航，不能只靠 `node --check`（這條補強了 BUG-14 的「語法驗證是必要不是充分」）
- 教訓：**重構與改行為要分版**。V3.6.0 抽取時**刻意保留已知錯誤**（T1N1 應為 IIA、現為 IIB），先證明 124,416 組完全等價，臨床修正留 V3.6.1 單獨改那一格 — diff 只有一行、可審、出事可定位。若混在一起，harness 對出差異時分不清是抽壞了還是修對了
- 教訓：**分期改查表，為多癌別鋪路**。T1N1 這種錯的成因就是 if/else 折疊區間（`isT1||isT2` 把兩格併一格）。查表可逐格對 NCCN Table 2、不可能漏格；換癌別（CRC）= 換一張表、引擎不動；換 AJCC 版本 = 換一張表。呼應 BUG-64「院內已是表格的資料照搬結構最安全」
- 多癌別下一步（CRC 進來時再做，現在不預先抽象）：`_staging.js` 的查表引擎可提升到 `/shared/`，各癌別只留自己的表；**健保規則是跨癌別共用的**（第 9 章一份文件管全部癌別，以藥名為 key），未來 8 個癌別要一起跟健保更新，這層最該共用

### #69 (V3.6.1)：外部審稿 P0 五項臨床修正 — state model 錯誤比計算錯誤更危險
- 背景：外部審稿逐條檢查 V3.5.3 民眾版，列 5 個 release blocker。V3.6.0 抽完 engine 後，這版每項只需改一處
- (a) **T1N1 = IIA**：`_staging.js` 查表改一格。**這格是我 V3.4.6 宣稱「computeAJCC 核對 AJCC 9th 全對」時漏掉的** — 因為當時的驗證 harness 是把程式邏輯複製一份進測試再跑，那是自我確認不是驗證。這次是拿專案內 NCCN nscl.pdf 的 AJCC Prognostic Groups 表逐格對出來的
- (b) **UNKNOWN 分期**：原 `setStageUnknown` 設 `stageCat = isSCLC() ? 'LOCAL' : 'EARLY'` — 病人按「不知道 TNM」直接被當早期給手術建議。更糟的是 `stage=''` 又讓 `buildGeneTestAdvice` 的 `advanced` 判成 true，**同一畫面出現「早期治療路徑」+「晚期基因檢測建議」自相矛盾**。修法：新增第四種 stageCat `UNKNOWN`，走 `buildUnknownStagePath` 只給「先完成分期檢查」不給任何治療建議
- (c) **簡易模式假精確**：簡易按鈕只有 T1/T2/T3/T4、N0-N3、M0/M1，但 computeAJCC 硬給唯一分期（T2N0 固定 IB 但可能 IIA、N2 固定 IIIA 但 N2b 是 IIIB、M1 固定 IVB 但 M1a/b 是 IVA）。修法：`resolveStage()` 展開所有可能組合 → 唯一解才給正式分期、否則顯示範圍；**可能值跨治療分類時（T1+N2 → IIB 早期 或 IIIA 局晚）標 UNKNOWN**
- (d) **未驗 vs 陰性確認**：`NONE` 一個值同時代表「已測、無驅動基因」和「還沒測」，後端只看 `m==='NONE'` → **未驗病人 + PD-L1 ≥50% 直接被導向免疫單藥**。拆成 `NEG`（才進 PD-L1 決策）/ `PENDING`（一律先完成檢測）。舊 QR 的 'NONE' 語意模糊，edu 保守映射 PENDING
- (e) 紀錄頁 `who = code + name` 直接進 innerHTML → 加 escapeHtml
- 教訓：**state model 錯誤比計算錯誤更危險**。(a) T1N1 算錯一格是「數值錯」，影響單一分期；(b)(d) 是「狀態少一種」— 把「不知道」壓進「早期」、把「未驗」壓進「陰性」，會讓整條治療路徑走錯，而且畫面看起來完全正常不會報錯。**設計選項時要問：有沒有第三種狀態叫「不知道」？** 二元選項（有/無、早期/晚期）幾乎都缺這一種
- 教訓：**「簡化輸入」不可以產生「精確輸出」**。民眾版簡化 TNM 是對的，但簡化後仍回報精確 AJCC 分期就是假精確。正確做法是輸出也跟著降精度（給範圍），並在範圍跨越治療分類時明確要求補資料
- 教訓（回頭看 BUG-60/61 的驗證）：**驗臨床規則要對照原始表格，不能把程式邏輯複製進測試**。V3.4.6/V3.4.7 我用複製邏輯的 harness 驗過 N2a/N2b 和 T4/M1（那些剛好都對），但 T1N1 從沒被真正檢查過。專案內既然有 NCCN PDF，就該用 `project_knowledge_search` 拉原表逐格對

### #70 (V3.6.2)：第二批臨床更新 — 「warning 補丁」不等於「真正分流」
- 背景：外部審稿 P1 四項，都是會給錯藥的等級。全部拿專案內 NCCN 3.2026 / SCLC 2.2026 / 健保第 9 章原文核實才動手（不憑印象、不用外部連結）
- (a) **Stage III 鞏固分流**：原本所有 LOCAL 一律列 Durvalumab，只在 driver+ 時 `warns.unshift` 補一句「免疫維持通常不適用」。但 NCCN NSCL-F 寫得很白：Durvalumab 鞏固 `except tumors positive for EGFR exon 19 deletion or L858R`，而該類病人是 **Osimertinib（stage III category 1）**；健保 9.69 也限 durvalumab 鞏固為 EGFR/ALK/ROS-1 原生型 — 等於**臨床和健保雙重不符**。改成三條真分流（EGFR classic → Osimertinib / 其他 driver → 個別評估 / driver 陰性 → Durvalumab）
- **同時修掉自相矛盾**：`pwTxt`（畫面最上方的主結論）原本一律寫「治療結束後再用免疫維持治療」，跟下面的 EGFR 警語打架（審稿點名）。改成隨分流變化。驗證時我的 harness 也是先漏掉這點（只檢查 steps/warns 沒檢查 pwTxt），是 ALK 那組測失敗才回頭抓到
- (b) **EGFR 拆 classic / exon20 insertion**：exon20 的第一線是 Amivantamab + carboplatin/pemetrexed（健保 114/10/1 已給付），跟 classic 的口服 TKI 完全不同藥。原本全塞一顆「EGFR(+)」→ 第一線就給錯。Q4 拆兩顆按鈕。**舊值 'EGFR' 仍走 classic 路徑**（舊 QR / 舊紀錄相容）
- (c) **LS-SCLC 補 Durvalumab 鞏固**：NCCN 依 ADRIATIC 列 category 1、最長 24 個月，且 PCI 若要做應排在鞏固之前（故 step 順序 PCI → 鞏固）。台灣健保尚未給付此適應症 → **明確標示「需自費或申請藥廠資源」，而不是因為健保沒給就整項消失**
- (d) **術後 Atezolizumab 條件化**：適應症是切除 + 完成含鉑化療後的 II–IIIA 且 PD-L1≥1%，**IB 不在內**；原本對所有非 IA 一律列，IB 病人會以為自己能用
- 教訓：**「加一句 warning」不是分流，是補丁**。原本 EGFR+ 病人看到的仍是「CCRT → Durvalumab」的完整步驟卡，只是下面多一行小字說可能不適用 — 病人（甚至醫護）第一眼讀到的是**步驟**不是警語。真正的修法是把不適用的選項從步驟裡拿掉、換成正確的那個。**凡是發現「主要內容錯、用 warning 補救」的地方，都該改成真分流**
- 教訓：**主結論（pwTxt / 摘要句）也要跟著分流**。細節分流了但最上面那句沒改，等於留一個最顯眼的矛盾。驗證 harness 要把摘要句一起比對，不能只比 steps/warns
- 教訓：**健保沒給付 ≠ 不該顯示**。LS-SCLC 的 durvalumab 台灣未給付，但那是臨床上有 category 1 證據的治療。正確做法是「臨床建議 + 健保狀態」分開標示，讓病人知道有這個選項、也知道要自費 — 隱藏會讓病人失去和醫師討論的機會

### #71 (V3.6.3)：修飾層也要收斂 — 「共用了核心」不等於「沒有分叉」
- (a) **B 肝 / C 肝混為一談**：Q1 問「B 型/C 型肝炎帶原」，按有就提示化療前拿預防性抗病毒藥。但治療前預防性抗病毒的規範是針對 **HBV**（查 HBsAg / anti-HBc / anti-HBs），C 肝的處理完全不同，不能一起套。改成 B 肝專屬題，「不知道」時直接指名要驗哪三項
- (b) **age/ECOG 從硬決策改回 modifier**：原本 `if(ps34 && /局部晚期|擴散|轉移/) r.pwTxt = '以症狀控制與支持性療法為主'` — 直接覆寫主結論。**driver+ 的 PS 3-4 病人因此下面列標靶、最上面卻寫支持療法**，自相矛盾（跟 BUG-70 的 pwTxt 問題同一種）。改成只加註 + 警語，且 driver+ 時明確講「口服標靶通常仍可考慮」。年齡的碳鉑也從「首選碳鉑」改成「由醫師依腎功能等條件決定」
- (c) **修飾層抽進 `_path.js`**：V3.6.0 只抽了核心決策，**修飾層還是兩份** — patient 有 age/ecog + B肝 + 重大傷病 4 項，edu 只有 age/ecog 2 項 → 掃 QR 的人少收到 B 肝與重大傷病提醒（而且沒人會發現，因為畫面看起來正常）。抽出 `applyModifiers(r, state)` 共用，QR payload 補 `hb`/`ct`
- 教訓：**抽共用時要盤點「整條管線」，不能只抽最顯眼的那段**。V3.6.0 抽了核心 buildPathCore（最大最明顯的重複），就以為單一真相達成了 — 但 patient 的完整輸出是「核心 + 修飾層」，修飾層沒抽就還是兩份。**檢查方法：從呼叫端最外層的函式往下追，每一層都問「另一邊有沒有對應的一份」**，而不是只看哪段程式碼最長
- 教訓：**覆寫主結論的邏輯是矛盾溫床**。這版跟 BUG-70 抓到的是同一類：pwTxt / 摘要句被某個側面因素（PS、健保、年齡）直接改寫，就會跟主體內容打架。原則：**摘要句只能由主決策軸（分期 × 基因）決定，其他因素一律用加註**

### #72 (V3.6.4)：加了新 state 層，卻沒定 contract — 下游 parse 字串全面誤判
- 背景：外部第二輪審稿（只審 V3.6.3 的運行與 state flow），判定**不可上線**。窮舉 3,474 組沒有 crash，問題全是「畫面能跑、結果走錯」
- **根因一句話：V3.6.1 引進 `stage`(唯一解才有值)/`stageLabel`/`stageCat` 三層狀態，但沒有同時定義 contract，下游各自繼續 parse 分期字串**
- (P0-1) `_path.js` 仍寫 `stage.startsWith('IA')`、`stage !== 'IB'`、`stage === 'IIIA'`。簡易模式 T1N0M0 的 `stage=''`（label 是 IA1–IA3）→ `isIA=false` → **確定是 IA 的病人被列出「部分 II 期術前化療 + 術後輔助化療 + 術後追加 Osimertinib/Alectinib」**；pT2N0M0(IB–IIA) 因 `'' !== 'IB'` 錯配 Atezolizumab；`buildGeneTestAdvice` 的 `stage && !/IIIB.../` 讓 EARLY 病人拿到晚期基因建議（**V3.6.1 剛修掉的矛盾，換一種形式復發**）
- 修法（照審稿建議，不做零散 patch）：`resolveStage` 正式回傳 `possible[]`，加 `definitelyStage(state,re)` / `possiblyStage(state,re)`，下游一律用 helper。語意也講清楚：**要套用某分期的建議 → definitely；要保守排除 → possibly**（Atezolizumab 用「有可能是 IB 就不列」）
- (P0-2) **QR 對簡易模式整個壞掉**：edu 的 `if(!data.t || !data.s) showError('資料不完整')`，但範圍分期的 `s` 本來就是空字串 → 病人頁顯示「約 Stage IA1–IA3」、掃出來卻是「資料不完整」。payload 補 `sl`（顯示字串）+ `ps`（possibleStages），edu 驗證改成「有 t 且 (s 或 sc 或 sl)」，`stageDisplay` 支援確定/範圍/未定三態
- (P0-3) transition 舊 state 殘留：臨床↔病理切換**完全沒清 TNM** → 直接把 cTNM 貼上 p 當病理分期；SCLC 從詳細 TNM 切回侷限/擴散沒清 stageCat → UI 沒選任何答案卻能按下一題。修法：建 `resetStageState / resetMolecularState / resetProgressState / resetPersonalState`，restart / pickType / setStageUnknown / setQ2Mode / pickStageMode **全部走同一組**
- 教訓：**新增狀態層時，必須同時定義「下游怎麼問這個狀態」的 contract**。我 V3.6.1 加了三層 state 就以為做完了 — 但只要下游還能直接讀 `state.stage` 做字串判斷，就一定有人漏改。正確順序是：**先出 helper（definitelyStage/possiblyStage）、把舊的字串判斷全部改掉、再讓新狀態上線**。凡是「某欄位在某些情況會是空字串」的設計，都要問「所有讀這個欄位的地方，遇到空字串會怎樣」
- 教訓：**收斂測試比對兩邊 buildPath 不等於端到端驗證**。V3.6.3 的「1,296 組完全收斂」是真的，但它只證明「兩邊共用 engine 後核心決策相同」，**完全沒驗 payload 能不能被 edu 接受** — 所以出現「核心 100% 收斂，但 QR 掃出去是『資料不完整』」的盲點。改成真正的 round-trip：`patient state → buildEduPayload → edu 驗證 → stateFromPayload → 渲染`，每一關都檢查
- 教訓：**分散的 reset 邏輯必然漏**。restart/pickType/setStageUnknown/setQ2Mode/pickStageMode 各自手動清一部分欄位，每次加新欄位（stageLabel、possibleStages、hbv…）就有 5 個地方要記得改 → 必漏。統一 reset 函式後，加欄位只改一處
- 教訓：**抽共用檔要連相依一起檢查**。改用 `definitelyStage`（定義在 `_staging.js`）後，edu-patient.html 只載了 `_path.js` → 執行才 ReferenceError。跨檔函式相依沒有編譯期檢查，只能靠端到端測試抓

### #73 (V3.6.5)：同一個狀態值有兩種來源 — 修 bug 時新造的 bug
- 背景：外部第三輪審稿確認 V3.6.4 已修好前一輪的 blocker，但抓到 4 項（3 個 P1、2 個 P2），其中最有意思的是我**在修 UNKNOWN 時新造的**
- (1) **UNKNOWN 有兩種來源**：① 病人按「不知道 TNM」→ 真的沒有 T/N/M ② 病人**有填 TNM**，但簡易資料跨治療分類（T1N2M0 → IIB–IIIA，可能是早期也可能是局晚）→ V3.6.1 設計成也標 UNKNOWN。V3.6.4 我用 `if(stageCat==='UNKNOWN')` 決定「不要重算」，第二種載入後 possibleStages/stageLabel/stageNeed 全丟，「還需確認 N2a/N2b」的資訊消失。**判斷依據錯了**：該看的是「有沒有 T/N/M」而不是「stageCat 是不是 UNKNOWN」
- 教訓：**一個狀態值如果有兩種來源，就不能用它本身當分支條件**。`UNKNOWN` 同時表示「沒資料」和「資料不足以定案」，用它判斷「要不要重算」必然錯一種。正確做法是用**產生該狀態的原始輸入**（有沒有 TNM）當條件。設計 enum 時要問：**這個值會不會由多條路徑產生？如果會，下游需要區分嗎？**
- (2) QR round-trip 仍差 stageNeed：payload 有 sl/ps 卻沒有「還需確認什麼」。照審稿建議補**原始 `tt/nn/mm`**，讓 edu 自己 `resolveStage` 重建 — 比把中文說明塞進 QR 乾淨，也自動跟著 staging 規則更新
- (3) **age/ECOG 全域警語沒 gate**：step note 早就寫對（`if(elderly && hasChemo)`），但全域 warns 是無條件 unshift → IA 只做手術的病人看到「化療用藥可能調整」、UNKNOWN 病人一邊被告知「不提供治療建議」一邊看到「同步化放療可以分開做」。教訓：**同一個條件在兩個地方實作，一定要用同一個判斷**（note 用 hasChemo、warns 也要用 hasChemo）；`unknownStage` 這種「不給建議」的路徑要一律跳過所有修飾層
- (4) 三處沒吃新 contract：LOCAL 警語 range 時 `stage=''` 造成開頭破字「 期腫瘤範圍較廣」、總覽 `stageDisplay()` 把「約 IA1–IA3」退化成「I-II」、UNKNOWN 顯示「?」、SCLC+UNKNOWN payload 偷送 `s='Limited'`（畫面剛好沒錯是因為 edu 優先看 sc，但 payload 自身矛盾）。教訓：**改 contract 要全域搜尋所有讀舊欄位的地方**，包括「剛好還能動」的（payload 矛盾遲早被別的消費端踩到）

### #74 (V3.7.0)：健保規則比「基因陽性」細 — 拆選項不只是記錄精度
- 背景：Sela 依個管實務提出六項。最有份量的是 (6)「ex19del 與 L858R 應該拆開，因為有藥只有 L858R 才能申請」
- **查證結果（專案內健保第 9 章）**：Bevacizumab 肺癌適應症是「與 erlotinib 併用，作為**無法手術切除的轉移性(第Ⅳ期)**且帶有 **EGFR Exon 21 L858R** 活化性突變之**腦轉移**非鱗狀 NSCLC 病患的**第一線**治療」— 六個條件同時成立，**ex19del 不符合**。對照 9.80 Osimertinib / 9.83 Dacomitinib 則寫「Ex19Del **或** L858R」綁一起 → 健保在不同藥上對 EGFR 次型的認定不同
- 教訓：**「同一個基因陽性」不等於「同一組可用藥」**。ex19del 與 L858R 合成一顆按鈕，不只是統計不精確 — 是**讓 L858R 病人看不到一個他專屬、健保有給付的選項**。凡健保規定裡出現次型（exon 位置、點突變名稱），選項就該拆到那個粒度
- **T790M 必須可疊加**：它是用過一/二代 TKI 後的抗藥性突變，幾乎一定疊在 ex19del/L858R 上。健保 9.80 二線 Osimertinib 需「T790M + 曾用 gefitinib/erlotinib/afatinib/dacomitinib 失敗 + 已惡化」。Q4 因此拆兩軸：主要驅動突變（單選）+ 抗藥性突變（獨立勾選）。教訓：**問診式選項要先分清「互斥軸」與「疊加軸」**，把疊加的塞進單選會讓病人無法表達真實狀況
- Bevacizumab 規則綁腦轉移，但民眾版原本只有 SCLC 問腦轉移 → 補 NSCLC 腦轉移題，**只在「晚期非鱗 + L858R」時顯示**。教訓：**條件式問題按需顯示**，不要為少數規則讓所有人多答一題
- **自費項目的提醒要節制**（Sela 回饋）：驅動基因檢測自費，選「沒驗」後反覆催促會變推銷，個管與病人都困擾。做法：保留一次正向說明（第一步：先完成基因檢測），移除下方所有重複催促；但保留「未驗 + PD-L1 高」的單次安全提醒（那是真的會用錯藥的組合）。教訓：**「該提醒」和「該重複提醒」是兩件事** — 安全資訊講一次夠，講三次變壓力
- 個管編輯層：科別加「本次不需要」第三態（原本只有有醫師/待安排二元）、藥物勾選預設全選（`S.drugOff` 只記取消的 → 日後新增藥物自動是勾選狀態，不會因舊紀錄沒勾而靜默消失）。教訓：**預設值要選「新增項目不會被靜默隱藏」的那一邊**

### #75 (V3.7.1)：又是「語法合法、執行才炸」— 索引變數名沒對上
- (0) **V3.7.0 的 regression**：Sela 回報「選了暫不檢測後，治療方向整個空白」。查出是我加藥物勾選時寫 `drugKey(si, d)`，但 `renderTreatmentSteps` 的迴圈參數叫 `i` 不叫 `si` → `renderSummary()` 拋 `si is not defined`，整段治療方向沒渲染。edu 端的 `_si` 同一個錯
- **跟 BUG-68（`DRUGS.` 被替換成 `DRUGstate.`）是同一類**：`node --check` 完全抓不到（語法合法、執行才 ReferenceError）。差別是 BUG-68 有窮舉 harness 護航當場抓到，這次我**只驗了引擎層（buildPath）沒驗渲染層（renderSummary）**，所以漏掉
- 教訓：**驗證要涵蓋「使用者真正看到的那一層」**。我的 harness 一直在測 `buildPath` / `buildPathFromData` 的輸出對不對，但病人看到的是 `renderSummary()` 渲染的結果 — 引擎對、渲染炸，畫面一樣是空白。**新增 UI 層改動時，harness 要把 render 函式也呼叫一次**（這次補上後立刻抓到）
- (1) **病理高風險因子改成個管手動勾選**（LVI／VPI／腫瘤≥4cm／低分化／切緣陽性／淋巴結廓清不完整，複選）。原本引擎只能講空話「除非病理發現高風險因子…」，因為系統沒有這個資料。勾選後改寫實：「您的病理報告顯示：淋巴管／血管侵犯、臟層肋膜侵犯 → 與主治討論是否加術後化療」。**教訓：系統講「若有 X 就…」的空泛語句，通常代表缺一個該收集的欄位** — 與其讓病人自己判斷有沒有 X，不如讓有資料的人（個管看病理報告）填進來
- (2) **緊急狀況不要叫病人先聯繫個管師**：原本寫「請立即聯繫個案管理師或回診」，但緊急時個管可能聯繫不上（下班、休假、忙線）→ 延誤就醫。改成「請立即至急診就醫，不需等待門診時間」。**教訓：緊急指引的第一動作要是「一定找得到的管道」**（急診 24 小時），不能是「特定某個人」

### #76 (V3.7.3)：個管的「決定」要往下游傳，不只是過濾顯示
- (1) **視覺衝突**：edu 的 `.hdr`（手冊抬頭）和 `.hero`（分期區）是兩個幾乎同色的綠漸層方塊上下疊著 → 兩個色塊互相打架。V3.7.0 我只把抬頭字級縮小，沒動底色，所以問題還在。改成 `.hdr` 無底色細標題列 + 下方細線，`.hero` 成為唯一主色塊
- (2) **勾選用藥後仍自相矛盾**（Sela 回報）：個管第一線只留 Osimertinib，但下一步仍寫「若第一線用的不是 Osimertinib，且檢測發現抗藥基因，可換成 Osimertinib」— 病人讀到會困惑
- 原因：V3.7.0 的藥物勾選**只做了「過濾要顯示哪些藥」**，沒有讓引擎知道「個管已經決定用哪一個」。那些條件敘述是在引擎裡寫死的，不隨選擇變化
- 做法：`drugChoice(state, stepIdx, drugs)` 回傳 `{on, narrowed, has(name)}`，EGFR 分支依三種情境給不同敘述（已選 Osimertinib／已縮小但選別的／未縮小）；另加通用後處理 `markDroppedSteps`：整步藥物全被取消 → 標 `dropped`，衛教頁整步不顯示
- **補修（round-trip 抓到）**：edu 的 `stateFromPayload` 原本沒把 `dx` 接進 `state.drugOff` — `dx` 只進了 `window.__drugOff`（renderer 用）**沒進 state（引擎用）**，所以 edu 端引擎判斷不到個管選擇，6 組不一致
- 教訓：**使用者的「決定」要往下游傳遞，不能只做顯示層過濾**。勾選用藥不只該隱藏未選的藥，還要讓後續步驟裡「假設你用的是別種藥」的條件敘述跟著改 — 否則病人拿到的是一份自相矛盾的手冊
- 教訓：**跨頁傳資料要確認「有沒有真的進到引擎」，而不只是進到 renderer**。`dx` 進了 renderer 用的全域變數就以為做完了，引擎那邊完全不知道。凡是新增 payload 欄位，要同時檢查 renderer 和 engine 兩條路徑

### #77 (V3.7.4)：兩邊「一致地錯」— round-trip 全綠也抓不到
- 背景：Sela 直接貼 QR 衛教頁的實際畫面截圖，一眼看出兩處矛盾。**我的 96 組 round-trip 當時全綠** — 因為 patient 和 edu 用同一個引擎，兩邊會「一致地錯」，比對兩邊相不相同永遠測不出來
- (1) 藥物清單只剩 Osimertinib，但同一張卡的說明仍寫「**五藥擇一。Dacomitinib 限無腦轉移。**」→ 提到畫面上根本沒有的藥。V3.7.3 我只改了「後續步驟」的敘述，**漏了藥物清單自己的 note**
- (2) **臨床錯誤**：第一線已是 Osimertinib，第 4 步仍列「已驗出 T790M：**可換 Osimertinib**」。但健保 9.80 二線 Osimertinib 限「先前用過 Gefitinib／Erlotinib／Afatinib／Dacomitinib」— **用過 Osimertinib 的病人不適用**，這樣寫會讓病人以為還有藥可換。改成「已驗出 T790M：後續方向需醫師評估」並說明為何不適用
- 教訓：**「依使用者選擇改寫」要涵蓋整個步驟卡，不只是被選的那個清單**。同一張卡上的標題、藥物、說明、健保條件都可能假設了某個未被選中的選項
- 教訓：**藥物的後線資格常綁「前一線用了什麼」**。凡是「可換成 X」「若之前不是 X」這類敘述，都要問一句「**如果第一線就是 X 呢？**」— 這類條件在健保規定裡很常見（9.80 二線 Osimertinib 就是典型）
- 教訓：**一致性測試測不出「一致地錯」**。patient/edu 共用引擎後，round-trip 只能保證兩邊相同，不能保證內容正確。內容正確要靠：臨床規則對照原始文件（健保/NCCN）、以及**真人看實際畫面**。Sela 貼截圖抓到的兩處，都是我所有自動化測試看不見的

### #78 (V3.8.0)：新增 enum 後，舊的 includes() 清單沒人通知它要更新
- 背景：內部 + 外部兩份審核。內部那份用 18,432 組窮舉跑出 4 類臨床斷言失敗，**全部同一形狀**
- **內部 P0-1（我 V3.7.0 造成的 regression，最嚴重）**：V3.7.0 把 EGFR 拆成 `EGFR_EX19`/`EGFR_L858R` 後，UI 已經不再產生 `EGFR`/`EGFR_CLASSIC` 這兩個值，但 LOCAL 分支仍寫 `const isEgfrClassic = (m==='EGFR'||m==='EGFR_CLASSIC')` → **永遠 false，V3.6.2 特地寫的 Osimertinib 鞏固分支變成死碼**，第三期 EGFR 病人又落到 else 拿到 Durvalumab。同一畫面還同時出現「您帶有 EGFR ex19del」與「限無 EGFR 驅動基因者的 Durvalumab」
- **根因**：驅動基因清單散在 **5 個地方各寫一份**（LOCAL 分支、driverPositive、PD-L1 警語、T790M 判斷、drugs 頁）。新增 enum 時沒有任何機制通知這些清單要更新，而漏掉的值**不會報錯**，只是靜悄悄走進 else
- 修法：抽 `EGFR_CLASSIC_SET / EGFR_ALL_SET / NON_EGFR_DRIVERS / ALL_DRIVERS / DURVA_EXCLUDED` 共用常數（KRAS 特別**不**放進 Durvalumab 排除名單 — 審核提醒它臨床上仍可用免疫維持），五處全部改引用
- 教訓（審核提供、我認為最有價值）：**不要驗「某個值走對分支」，要驗「沒有任何值掉出分類」**。新增回歸斷言：把 UI 上每一個可選的 mut 值抓出來，確認每個都落入 `EGFR_CLASSIC_SET / EX20 / OTHER / NON_EGFR_DRIVERS / NON_POSITIVE_MUT` 其中之一。這條可以 **100% 攔截**這整個家族的錯誤，而 code review 很難每次抓到
- **內部 P0-2（資料永久遺失）**：SCLC 用侷限/擴散直接設 stageCat、沒有 TNM。載入紀錄時 `recomputeStage()` 對空 TNM 算出 `cat=''` → `stageCat` 變空 → 連帶觸發 `if(oldCat!==S.stageCat && !q3Needed())` 把 mut/pdl1/brainMet 一起清掉 → **此時按「更新這筆紀錄」就永久覆寫**。修：SCLC 無 TNM 時 `recomputeStage` early-return；並在更新時若分期由有變空先跳確認
- **P0-3 + 外部 P1-1（同一根因：拿位置/候選當語意）**：`drugOff` 用位置索引當 key，但步驟會 splice 插入、復發路徑會 unshift、三區呈現各自從 0 起算 → key 漂移到別的藥；而 `_fl.has('Osimertinib')` 把「仍顯示的候選」當成「已選定的治療」→ 保留 Osimertinib + Gefitinib 時同頁自相矛盾。修：語意 key（`step.id`）+ 三態區分（單一候選=已選定／多候選=未定／整步取消=不可推論）
- **外部 P0-1（靜默覆寫病人資料）**：還原直接 `put()` 且保留備份裡的 id，IndexedDB 的 put 遇同 key 是覆寫不是新增 → A 電腦既有 id 1~80 被 B 電腦的資料逐筆換掉，畫面只說「還原完成」。修：明確二選一（整庫取代／合併匯入時刪除來源 id 重新配號）+ 單一 readwrite transaction（任一筆失敗整批 rollback）+ dry-run 驗證 + 完成時回報筆數
- **外部 P0-2（儲存型 XSS）**：醫護版**完全沒有 escape 工具**（民眾版有 `escapeHtml`，醫護版沒有），統計表把 `r.code`/`r.name`/`r.mutation` 直接塞 innerHTML；`edu-pro.html` 更是把 URL fragment 解出的 JSON 直接寫進 innerHTML。**入口不只是「駭客輸入」— 備份檔、同仁轉傳的 QR 都是**。修：加 `esc()` 並套用到所有病人／匯入／payload 輸出點
- 教訓：**同一個專案裡「A 檔案有防護、B 檔案沒有」是常見盲點**。民眾版 V3.6.1 就補了 escapeHtml，醫護版卻一直沒有 — 因為兩邊是不同時間寫的，而我從沒把「安全措施」當成需要跨檔案盤點的項目。下次加任何防護，要問「這個防護在所有同類檔案都有嗎」

### #79 (V3.8.1)：QR payload 一版一版加欄位，沒人回頭量
- 背景：Sela 回報「QR 圖形好複雜」；外部審核 P2-15 也量出已達 856 字元
- **`buildEduPayload` 的註解寫著「只送必要欄位（base64 後 < 200 字元）」，實測最壞情境 614 字元** — 註解停在第一版，欄位卻從 V3.4.2 的 pd、V3.5.3 的 sc、V3.6.4 的 sl/ps、V3.6.5 的 tt/nn/mm、V3.7.0 的 t9/dx、V3.7.1 的 rf 一路加上去
- 四類優化：(1) 有完整 TNM 時 `s`/`sl`/`ps` 不送，edu 用 `resolveStage(tt,nn,mm)` 重算 (2) 空值不入 JSON（原本每個欄位都帶 `''`）(3) 固定值短碼表 `QR_CODES` 放 `_path.js` 兩端共用 (4) `dx` 從「步驟鍵\|藥名」×N（79 bytes）壓成「egfr-1l:1,2,3,4」（~15），edu 兩段式還原
- 另修：`btoa` 改 **base64url**（`+` `/` `=` 在 URL fragment 會被部分 App 二次編碼 → `atob` 失敗、edu 顯示「資料解析失敗」）；**QR canvas 200→300px**（模組密度才是掃描成功率的關鍵，比省 byte 更直接）
- 成果：最壞情境 **614 → 338 字元，縮減 51%**
- 教訓：**payload 這種「一版加一個欄位」的東西要定期量測**。每一版加的都只有 10-20 bytes，沒有任何一版看起來過分，但累積六版就翻了三倍。註解裡的「< 200 字元」變成純粹的歷史文物
- 教訓：**可由其他欄位重算的資料不要進 payload**。`s`/`sl`/`ps` 全部是 `tt/nn/mm` 的衍生值，送過去只是讓兩邊有機會不一致（V3.5.3 的 QR 不同步就是這樣來的）
- 教訓：**短碼表要放共用檔，解碼採「查不到就原樣回傳」** — 這樣舊 QR（送長字串）跟新 QR（送短碼）用同一段解碼程式就都能吃，不需要版本旗標

### #80 (V3.8.2)：移除欄位時，讀它的地方不只一處
- 症狀：Sela 實機掃 QR，分期大字顯示「**p?**」（實際是 pT2a pN0 pM0 = IB）
- 原因：V3.8.1 瘦身時讓「有完整 TNM 就不送 `s`/`sl`/`ps`」，我改了 `stateFromPayload`（引擎用）走 `_eduStageInfo` 重算，**但 `stageDisplay`（顯示用）還在直接讀 `d.s` / `d.sl`** → 兩者皆空 → `return '?'`
- 附帶：`_eduStageInfo` 當時只回 `possible` 沒回 `stage`，所以補上之後 pT2a N0 M0 一度顯示「約 IB」（其實是唯一解，不該有「約」）
- 教訓：**移除/停送一個欄位時，要 grep 全專案所有讀它的地方**，不能只改「我記得會用到它」的那一處。這跟 BUG-76 是同一家族的鏡像 — 那次是資料進了 renderer 沒進 engine，這次是 engine 改了 renderer 沒跟
- 教訓：**「衍生值改由接收端重算」要一次做完整**：算出來的東西要涵蓋原本送過去的所有欄位（exact stage、label、possible、need），少一個就會有某個消費端拿到空值

### #81 (V3.8.3)：壓縮格式只還原了「引擎那條路」，畫面那條路全破
- 症狀：個管回報「**主治也會變成 ?**」。Sela 要求全面查類似問題 — 結果不只主治，一共 **5 處**
- 根因：V3.8.1 為了縮 QR 改了資料格式（固定值→短碼、`tm` 陣列→`"0:姓名,1:姓名"` 字串、日期→`YYMMDD`）。我在 `stateFromPayload` 用 `qrDec` 還原了**引擎要的欄位**，但畫面另有一條路徑直接讀 `d.X`：

| 顯示點 | 壞掉的樣子 |
|---|---|
| 主治醫師 `d.tm[i]` | 字串取 index → 拿到單一字元 `0` `:` |
| 驅動基因 `mutDisplay(d.m)` | 收到 `e8`，查表無 → 回空字串，**整段消失** |
| PD-L1 `pdl1Display(d.pd)` | 收到 `h` → 同上 |
| SCLC 腦轉移 | lookup key 是 `yes/no/unknown`，收到 `y` → **整行消失** |
| 產生日期 | 顯示 `260914` |

- **注意其中三項是「靜默消失」不是報錯** — 沒有 `?` 也沒有例外，只是那段資訊不見了。如果個管只回報「主治變 ?」，另外幾項可能長期沒人發現
- 修法：**在解碼入口一次 `normalizeQR(d)` 還原成長格式**，而不是逐個顯示點補 `qrDec`。好處：(1) 下游所有消費端（含我沒想到的）自動正確 (2) 舊 QR 送長格式時 qrDec 原樣回傳 → 同一段程式吃兩種格式 (3) 之後再加顯示點不必記得解碼
- 教訓：**改變資料格式時，要在「最靠近入口的地方」還原，不要散在各消費端**。我 V3.8.1 在 `stateFromPayload` 還原，那是「其中一個消費端」而不是入口 — 於是每多一個消費端就多一個破口
- 教訓：**「靜默消失」比「顯示成問號」更危險**。問號會被回報，消失不會。凡是 `map[key] || ''` 這種查表回退空字串的寫法，格式一變就是靜默失敗 — 這類地方應該在查不到時保留原值或留下痕跡
- 同場加映：這是連續第三版（V3.8.1→V3.8.2→V3.8.3）修同一次瘦身的後遺症。**壓縮/重構這種「橫跨多個消費端」的改動，應該先列出所有消費端清單再動手**（這次我是被回報一個、修一個）

### #82 (V3.8.4)：同步化放療處方沒分組織型態
- 背景：個管說「怎麼都有點怪怪的」，並貼出比對 — 非鱗狀 NSCLC 的 IIIA 同步化放療頁面只列 Cisplatin+Etoposide 與 Carboplatin+Paclitaxel，沒有 Pemetrexed 組合
- 查證（專案內 NCCN 3.2026 NSCL-F）：**Preferred (nonsquamous)** 依序是 `Carboplatin+Pemetrexed`、`Cisplatin+Pemetrexed`、`Carboplatin+Paclitaxel`、`Cisplatin+Etoposide`；**Preferred (squamous)** 只有後兩種。NCCN 討論段也明講「pemetrexed plus either carboplatin or cisplatin **for nonsquamous NSCLC only**」，且 PROCLAIM 試驗顯示 cisplatin+pemetrexed 與 cisplatin+etoposide 存活相當但嗜中性球低下與 G3-4 不良事件明顯較少
- 影響：**非鱗狀病人（約 60% 的 NSCLC）看不到自己的首選處方**，而看到的是共用處方 — 不是給錯藥，但少了副作用較輕的選項
- 修法：CCRT 步驟的 drugs 依 `isNS` 分流（非鱗 4 種、Pemetrexed 組合排前；鱗狀 2 種），note 也分開寫明「鱗狀不使用愛寧達」
- 順手全面稽核其他化療處方的組織型態分流：術後輔助（非鱗多 Cisplatin+Pemetrexed）、META 第一線（非鱗 Pemetrexed vs 鱗狀 Paclitaxel）本來就正確；**鱗狀路徑上沒有任何一處出現 Pemetrexed**
- 教訓：**「所有組織型態共用一組處方」本身就是可疑訊號**。肺癌的鱗狀/非鱗狀在用藥上差異很大（Pemetrexed、Bevacizumab 都限非鱗狀），凡是治療步驟沒有依 `isNS` 分岔的地方，都該回頭對一次指引 — 這次是 LOCAL，早期與 META 剛好當初就分了
- 教訓：**個管說「怪怪的」但講不出所以然時，通常是「少了什麼」而不是「多了什麼」**。多出來的錯誤顯眼、少掉的不顯眼 — 這次就是漏了兩個處方選項，畫面完全正常、不會報錯（同 BUG-81「靜默消失比顯示問號危險」）

### #83 (V3.8.5)：用「資料外觀」猜格式，遲早猜錯
- (P1-01) **舊 QR 單一 risk factor 被拆壞**：V3.8.3 的 `rf` 正規化用 `indexOf(',') < 0` 判斷「這是新短碼串還是舊長碼」。但舊格式**只有一項時本來就沒有逗號** → `LVI` 被逐字拆成 `L`,`V`,`I` → 解成 `LVI,VPI,I`。六個舊值全中，`MARGIN` 甚至變成 `MARGIN,A,R,G,I,NX`
- **臨床後果**：病人拿舊 QR（已印出、已發給病人的）掃出來，會看到**病理報告上沒有的高風險因子** — 而高風險因子正是 V3.7.1 加來決定「IA 要不要討論術後化療」的依據
- 修法：先比對完整舊 enum 清單 → 再看逗號 → 再看是否為合法短碼字元集 → 都不是就丟棄（不產生未知 factor）。並依審核建議 payload 加 **`v:2` schema 版本**，之後解碼依版本走明確 parser
- 教訓：**不要用「資料長什麼樣子」推斷它是哪個版本的格式**。`有沒有逗號`、`是不是全大寫`、`長度幾個字` 這類啟發式在多數情況會過，然後在邊界（單項、空值、剛好符合另一種格式）悄悄錯掉。**格式版本要明寫在資料裡**
- 教訓（更根本）：**每一次「為了省空間改變編碼」都要同時定義「怎麼分辨新舊」**。V3.8.1 改了五種欄位編碼，我全部靠外觀判斷 → V3.8.2、V3.8.3、V3.8.5 連三版在修同一批後遺症
- (P1-02) `handleImport` 逐筆 `await put()`：第 N 筆失敗時前 N-1 筆已永久寫入，畫面卻只說「格式錯誤」→ 使用者再匯入一次就重複。改成與整庫還原同一原則（dry-run → 單一 transaction → 全成或全不成），並複製物件後再 `delete id`（原本直接改到解析後的來源物件）
- (P2-01) README 被 shell `ps` 輸出污染 50 行：打包腳本用 `python3 -c "..."` 包住含反引號的 Markdown，反引號被 shell 當命令替換執行。**教訓：寫含反引號/`$` 的文件內容一律用 heredoc 或獨立 .py 檔，不要塞進 shell 的雙引號字串**
- (P2-02) **測試隨包**：`test/qr_payload.test.js`，54 項斷言涵蓋 risk factor 新舊格式邊界、真實編碼往返（中文/罕用字/emoji）、14 欄位顯示稽核、新舊 QR、448 組 round-trip、驅動基因分類完整性、臨床斷言、渲染層。審核說得對 —— 我宣稱「舊 QR 相容全綠」但矩陣沒涵蓋單項邊界，**測試不隨包，外部就只能相信我的宣稱**。而且這支測試寫完當場就抓到我 V3.8.4 的一個測試盲點

### #84 (V3.9.0)：三套平行臨床路徑 — 「共用引擎」只共用了民眾版
- 背景：外部「路徑漂移複審」專門查「歷次修正後路徑有沒有分叉」，結論是 **P0：至少三套會對使用者呈現治療方向的邏輯同時存在**
  1. `_path.js` — 民眾版 patient / edu-patient（V3.6.0 抽出，我以為這就是單一真相）
  2. `lung/index.html` — 醫護版 `PW` / `PW_SUMMARY` / `STAGE_GOALS` **三份**
  3. `lung/edu-pro.html` — 醫護 QR 又自有 `getGoal()` / `getTx()` / `getDrugDetail()`
- **我的盲點**：`_path.js` 檔頭寫「由 patient.html 與 edu-patient.html 共用」— 我抽出來時就只想著民眾版的兩頁分叉（BUG-67 家族），**從沒盤點過醫護版也在做同一件事**。於是 V3.6.2（III 期 EGFR → Osimertinib）、V3.7.x、V3.8.x 的臨床修正**全部只進了民眾版**
- 實際後果（複審逐條驗證）：同一個病人 —
  - III 期 EGFR ex19：民眾版走 Osimertinib，**醫護 QR 仍給 Durvalumab**（正好相反）
  - 醫護主畫面把鞏固寫成 CCRT 的**並列選項**「合併化放療 或標靶 或免疫」，沒有「先完成 CCRT、未惡化、再依 driver 決定」的順序
  - LS-SCLC 的 Durvalumab 鞏固**只有民眾版有** → 醫護從主畫面列印或掃 QR 看到的是舊路徑，病人自己查反而是新的
  - ES-SCLC 腦轉移：醫護主卡暗示可加免疫、QR 說不適用
- 教訓：**「抽出共用引擎」要先盤點「有幾個地方在做同一件事」，不是「我現在手上這兩個」**。我 V3.6.0 解決的是當時被回報的那一組分叉，卻沒問「還有誰也在決定治療方向」。BUG-71 我學到「要盤點整條管線」，這次是同一個教訓的更大尺度版本 — **要盤點整個系統的同類職責**
- 教訓：**README 的「96 組 round-trip 全綠」是被誤用的指標**。複審直接指出：那只證明「民眾查詢頁與民眾 QR 一致」，不能證明醫護版正確，更不能證明全系統一致。我拿它當品質保證講了好幾版
- 這版的處置（過渡，非最終解）：把「會分叉的臨床判斷」抽成 `_path.js` 的**共用規則層**（`ruleConsolidationIII` / `ruleLsSclcConsolidation` / `ruleEsSclcImmune` / `ruleMetaSystemic`），四個頁面都載入並呼叫同一個函式。新增 `test/cross_engine.test.js` 驗證三頁採用同一來源、且關鍵臨床欄位一致
- **最終解仍未做（V4.0 等級）**：複審建議的 canonical clinical pathway model（engine 產生結構化結果 `{intent, prerequisites, primaryTreatment, consolidation, subsequentTreatment, reimbursementNotes, evidenceVersion}`，各頁只當 renderer，刪除 `PW_SUMMARY` / `STAGE_GOALS` / `edu-pro getTx` 的決策功能）。那需要先凍結功能 + MDT 建立 12–20 個 golden cases 並核定每個 case 的 canonical output
- 教訓：**同一份資料有幾個「決策者」，就有幾倍的分叉機會**。renderer 多沒關係（語氣可以不同），但**決策點只能有一個**。判斷方法：問「這段程式碼在決定『要給什麼治療』還是在決定『怎麼呈現』」— 前者只能有一份

### #85 (V3.9.1)：拿到正式條文才發現「排除集合依組織型態不同」
- 背景：健保第 9 章 115/8/21 版 PDF 終於拿到（從 V3.5.0 就列在待辦，我一直拒絕用外部連結或印象改健保內容）
- **C2 逐字核對的收穫**：Durvalumab 鞏固的條文是
  「非鱗狀癌者需為 EGFR/ALK/**ROS-1** 腫瘤基因原生型、**鱗狀癌者需為 EGFR/ALK** 腫瘤基因原生型」
  → **排除集合依組織型態不同**。我們原本兩種組織型態都排除 ROS1，等於**鱗狀 ROS1(+) 病人被多擋掉一個健保有給付的選項**
- 教訓：**「同一個藥、同一個適應症」的給付條件仍可能依組織型態分岔**。我 V3.8.4 才學到「所有組織型態共用一組處方是可疑訊號」（BUG-82），這次是同一個模式出現在**給付條件**而不是處方 — 凡是 rule 裡出現組織型態以外的條件清單，都要問「這份清單對鱗狀/非鱗狀一樣嗎」
- 新增 **9.138 Aumolertinib（普米維，115/8/1）**：一線 EGFR ex19del/L858R 肺腺癌、二線 T790M(+)。與 gefitinib/erlotinib/afatinib/dacomitinib/**osimertinib** 擇一不得互換 → EGFR 一線從五藥變六藥，T790M 二線從單藥變兩藥擇一
- **C4 找到逐字依據**：免疫檢查點抑制劑用於擴散期 SCLC，條文明訂限「無腦部或無脊髓轉移」→ 證實這是**給付條件**而非醫學禁忌，V3.9.0 改成「臨床可用／健保給付」兩行陳述的方向正確，這版補上條文出處
- 核對後**不需更動**的：Bevacizumab+erlotinib 限「L858R + 腦轉移 + 非鱗狀 + 第Ⅳ期」（與 V3.7.0 實作一致）、Dacomitinib 限「無腦轉移」（與現行 note 一致）
- 教訓：**堅持等正式文件是對的**。從 V3.5.0 到現在，我在健保內容上擋掉了好幾次「用外部連結或印象先改」的誘惑；這次逐字核對就抓到一個連審核方也沒發現的組織型態差異 — 如果當初憑印象寫「EGFR/ALK/ROS-1 原生型」，錯誤會一直留著

### #86 (V3.9.2)：被當成 canonical 的那一版，自己也是錯的
- 背景：內部「臨床路徑綜合複審」針對 V3.8.3，但逐條實測後**六項在 V3.9.1 仍然存在**
- **它最重要的一句**：外部審核把 `_path.js` 當成「較新、較正確的那一版」建議其他頁向它收斂，但 `_path.js` **自己有三項會導致錯誤用藥的缺陷**；若直接以現況當 canonical engine，等於**把這三個錯誤同步擴散到醫護版**。我 V3.9.0 正是這樣做的
- 教訓（最該記住的）：**收斂之前要先確認「收斂目標本身是對的」**。我把「消除分叉」當成目的，卻沒問「那唯一的那一份是不是正確」。統一到一個錯誤答案，比保留兩個互相矛盾的答案更危險 — 因為矛盾至少會被發現
- (N-02) **鱗狀癌 + 任一 driver 拿到 Pemetrexed**：META 六個分支各自寫死化療 backbone。反證這是疏漏而非設計 — 同一個檔案的 BRAF 分支當初就寫了「鱗狀者改用紫杉醇 + 鉑類」，其餘五個漏了。抽 `chemoBackbone(isNS)` 統一引用
- **我的測試盲點**：V3.8.4 我加過「鱗狀路徑不得出現 Pemetrexed」的斷言，**但只測了 `mut:'NEG'`** → 一路綠燈。測試矩陣少一個維度，就等於沒測
- (N-03) **非 EGFR 勾 T790M 會被建議換 Osimertinib**：V3.8.0 為了處理「第一線已用 Osimertinib」加了 `_alreadyOsi` / `_undecided` 兩個守衛，**卻沒補最基本的 `_isEgfr`** → 非 EGFR 時兩個守衛都 false，落到 else 給出換藥建議。教訓：**加新守衛時要先確認「最基本的那個前提」有沒有被檢查** — 我當時在處理精細情境，反而跳過了粗略情境
- (N-04) 術後追加治療把三種藥並列要病人「對號入座」，完全沒用已經問到的 driver。教訓：**系統已經知道的事，不該再要求使用者自己判斷**
- (N-05) SCLC 侷限期 + 已知腦轉移仍輸出侷限期鞏固（ADRIATIC 收的是侷限期病人）→ 改提示分期不一致。**兩個互斥的輸入同時成立時，要質疑輸入而不是硬算**
- (N-06) 第三期基因未驗即給 Durvalumab 鞏固 — 健保的「原生型」是需要檢測報告佐證的條件，未驗無法證明符合。教訓：**「條件未知」不等於「條件成立」**（同 BUG-69 的 state model 家族）
- (N-13) `DURVA_EXCLUDED` 在 V3.9.1 被 `durvaExcludedFor(isSquamous)` 取代後成為死常數，留著會讓人以為那是唯一事實來源 → 移除。**取代一個「唯一事實來源」時，舊的必須刪掉，否則會有兩個都自稱唯一**

### #87 (V3.9.3)：兩邊各自都對，合起來是錯的
- (N-16) **最值得記的一項**：`edu-pro.html` 有依 `d.b`（腦轉移）做 SCLC 分流，**邏輯完全正確**；但醫護版的 `buildEduPayload()` 從來沒送過 `b` → `d.b` 永遠 `undefined` → 那段分流**實務上永遠不會執行**，所有擴散期病人都走「無腦轉移」分支
- 教訓：**「解碼端寫對了、編碼端沒送資料」兩端都不會報錯**。這跟 BUG-76（dx 進了 renderer 沒進 engine）、BUG-80（欄位停送但顯示端還在讀）是同一家族 — **契約的兩端要一起看，只看單邊都會覺得「我這邊沒問題」**。往後新增 payload 欄位，要同時確認「有沒有送」「有沒有讀」「送的格式跟讀的格式一樣嗎」
- (N-09) **復發讓個管的用藥勾選全部失效**：`drugOff` 的 key 來自 `stepKeyOf()`，多數步驟既無 `id` 也無 `phase` → 就是 title；而 `buildRecurrencePath` 會改寫 title → key 全部對不上。**V3.8.0 的 P0-3 我以為解決了 key 漂移，其實只替 EGFR 第一線加了 id，其餘 19 個含藥步驟都沒有**
- 教訓：**修「識別碼不穩定」這類問題時，要把同類物件全部盤一遍，不能只修被回報的那一個**（同 BUG-84 的盤點教訓，這次是物件層級）。順手把 `stepKeyOf` 的 fallback 拿掉並加 `console.warn` — **那個 warn 當場又抓到 2 個我剛漏補的步驟**，證明「讓錯誤大聲一點」比「安靜地退回預設值」有價值
- (N-08) **同一個 enum 在兩個分期有兩種分類**：`EGFR_OTHER` 在 III 期被當成非 classic（排除在 Osimertinib 鞏固外），在 IV 期卻與 classic 併為同一分支拿到含 Osimertinib 的五藥清單，而程式碼裡沒有任何註解說明為何不同。統一為「用藥需個別評估」
- 教訓：**enum 的成員資格判斷分散在多個分支時，遲早會不一致**。判斷方法：同一個值在不同分支被 `includes()` 到不同集合裡，就是警訊
- (N-15) `getAdjuvantHTML()` 比對不到分期時 `return ''` → **整塊病理分期卡片消失，沒有錯誤也沒有提示**。改成明確的「此分期無對應建議，請確認分期輸入」。同 BUG-81「靜默消失比顯示問號危險」
- **未處理（需肺癌團隊或 V4.0）**：N-07 PD-L1 資料模型只有 50% 一刀、無法表達 Durvalumab/Atezolizumab 需要的 ≥1% 門檻（需與 C2 一併核定）、N-11/N-12 醫護版 `txGroup()` 完全不讀分子與治療進度（canonical engine 的範圍）

### #88 (V3.9.4)：過時的「健保未給付」比沒寫還糟
- 背景：Sela 直接貼健保條文問「我們有沒有這條路徑」（非小細胞肺癌術前輔助治療，115/6/1）
- 查核結果：**有一句，但過時且會誤導**。原本寫「部分 II 期可切除者：術前可先做化療或加免疫」，註記是「**術前免疫合併化療目前健保尚未給付，需自費或臨床試驗**」
- **這比漏掉更糟**：條文 115/6/1 起已給付 nivolumab 術前輔助，我們等於**叫病人去自費一個健保已經給付的治療**，或讓他以為只能參加臨床試驗。病人可能因此放棄一個該做的治療
- 教訓：**「健保未給付」這類敘述有保存期限，要標註條文版本與日期**。治療有沒有、藥名對不對，臨床人員看得出來；但「健保給不給付」寫錯，病人與個管通常不會質疑 — 這種敘述的錯誤特別隱蔽。往後所有給付狀態的敘述都要帶條文日期（V3.9.1 起已開始這樣做）
- 新增 `ruleNeoadjuvant(state, isSquamous)` 依條文逐項判定：**腫瘤 ≥4 公分或 N1／N2（明文排除 N3）**、M0、**不具 EGFR 或 ALK**、至多 3 療程；處方依組織型態（非鱗 Nivolumab + Pemetrexed + 鉑類／鱗狀 Nivolumab + 鉑類）
- 三個設計決定：(1)「可切除」無法由 TNM 自動判定 → 明確標示需胸腔外科／MDT 判定，不自行推論 (2) EGFR/ALK **未檢測**時不顯示此選項，改導向先確認 —— 條文要求「不具 EGFR 或 ALK」是需要報告佐證的條件（同 BUG-86 的 N-06「條件未知 ≠ 條件成立」）(3) 條文含 N1/N2 → 適用範圍橫跨 EARLY 與可切除 IIIA 兩個分支，兩處都要接

### #89 (V3.9.5)：收集了資料，卻沒有人接
- 背景：Sela 提供最新 NCCN（**NSCLC 8.2026 / SCLC 1.2027**，我先前註解一直寫 3.2026，版本引用從頭就錯），比對後列出 10 項差異
- **G-01 是唯一的純程式缺陷**：NCCN 的可用藥標記是 ALK/BRAF/EGFR/ERBB2(HER2)/KRAS/METex14/NTRK/RET/ROS1，系統缺 RET／NTRK／HER2。但真正的問題是 —— **醫護版的 `DRIVER_GENES` 其實一直有收集這三項**，個管也一直在填，只是 `mutEnumForRules()` 只認 `ros1/braf/met/kras`，其餘落到 `return 'EGFR_OTHER'`
- 也就是說：**一位 RET 融合陽性的病人，資料有被輸入、有被儲存、也有被帶進 QR，但在決策引擎裡被當成「少見型 EGFR」** — 從頭到尾沒有任何錯誤訊息
- 教訓：**「有欄位可填」不等於「有人會用」**。輸入端與決策端是兩套程式，中間的映射是唯一的橋；映射漏一個值，那個欄位就變成純粹的資料墳場。**新增輸入欄位時，要同時確認決策端接得到；新增決策分支時，要確認輸入端送得出來** — 這是 BUG-87（N-16 編碼端沒送、解碼端寫對）的鏡像版：這次是**送了、但接收端不認得**
- 教訓：**BUG-78 的斷言「沒有任何值掉出分類」救不了這一種**。那條斷言檢查的是「民眾版 UI 能選的值」，而 RET/NTRK/HER2 只有醫護版能選 — **斷言的取樣來源決定了它的覆蓋範圍**。這次補的新斷言改成直接檢查映射函式的內容
- 健保狀態逐條核實後如實標示（不臆測）：RET 與 HER2 的肺癌適應症在第 9 章查無條文 → 明確標示自費；NTRK 的 larotrectinib（9.95）有給付但條文要求「沒有合適的替代治療選項」→ 標示需醫師評估能否申請
- **其餘 9 項差異未做**，因為需要臨床決定（Tarlatamab 的 CRS 處置條件、EGFR 第一線是否呈現 NCCN 的兩個組合、少見型 EGFR 的用藥、圍手術期 ICI 接續規則等），已列入待核定文件

### #90 (V3.9.6)：兩次「整批腳本中途失敗」的教訓
- 背景：Sela 逐項核定 NCCN 差異，一次三項，本版實作 G-02～G-07
- **工程上的教訓（值得記）**：我用一支 Python 腳本一次改六處，第五處的 `assert` 失敗 →
  **`open(p,'w').write(c)` 在最後一行，所以前四處的修改全部沒寫入**。但我沒察覺，
  接著跑第二支腳本補最後一處，於是產生「用到 `pembroDrug`／`NEO_IO` 但它們從未被宣告」
  的狀態 — **`node --check` 完全通過**（語法合法），要執行到才會 ReferenceError
- 這是 BUG-68（`DRUGS.` 被誤傷成 `DRUGstate.`）、BUG-75（`si` 打錯）的第三次同型：
  **語法合法、執行才炸**。教訓：**批次修改腳本要嘛每處獨立寫檔、要嘛失敗時明確報告哪些沒套用**；
  並且**改完一定要跑會實際執行到那段程式的測試**，不能只看 `node --check`
- 第二次類似狀況：G-05/G-06 的術後分支我只改了「鱗狀」那條，**非鱗狀 + driver 陰性走的是另一條 `else if(isNS)`**，
  所以驗證時鱗狀正確、非鱗狀沒生效。教訓：**同一個決策有幾條分支，就要確認每條都改到** — 
  用「輸入矩陣」驗證（鱗狀／非鱗狀 × driver 有無 × 術前 ICI 有無）比逐條讀程式碼可靠
- 臨床內容的處置原則（Sela 核定）：**NCCN 有但健保沒有的，一律「呈現 + 標示自費／未給付」**，

### #91 (V3.9.7)：同名函式在兩個地方，插錯了不會報錯
- 背景：G-08 需要在早期路徑加「不可切除 → 改走化放療」的分支
- **`if(st==='EARLY'){` 在 `_path.js` 裡有兩處**：`buildPathCore`（未手術的決策）與 `buildPostOpPath`（術後路徑）。
  我用字串比對插入，**插進了 `buildPostOpPath`** → 語法完全合法、`node --check` 通過、
  但「不可切除」永遠不生效（術後路徑不會有「要不要開刀」的問題）
- 抓到的方式：**輸入矩陣**（組織型態 × 可切除 × driver，12 格）一次全紅 —— 若只測一組「非鱗狀 + 不可切除」，
  我可能會以為是資料沒傳進去而往別的方向查
- 教訓：**用字串比對插入程式碼前，先確認那個字串在檔案裡是唯一的**。
  這是 BUG-68（`S.` 替換誤傷 `DRUGS.`）的變形 —— 那次是「替換到不該替換的」，這次是「插到不該插的地方」，
  共同點都是**沒有先確認比對目標的唯一性**
- 教訓（承 BUG-90）：**輸入矩陣驗證是這類「分支很多」的改動唯一可靠的檢查方式**。
  上一版我因為只改一條分支而漏掉非鱗狀，這一版因為插錯函式而全部沒生效 —— 
  兩次都是矩陣抓到，兩次都不是讀程式碼讀出來的
- G-08 的附帶收穫：有了「是否可切除」欄位後，**術前輔助治療的資格判斷也更準確了** —— 

### #92 (V3.9.8)：我的測試在比對原始碼，不是在執行程式
- 背景：內部審核 V3.9.7，**刻意不沿用專案自己的驗證框架**（README 自述、隨包測試的綠燈），
  改用「以 `vm` 實際載入 `edu-pro.html` 全部 inline script，餵入醫護版 `buildEduPayload()` 真正送出的格式」
- **結果：我的 184 + 54 項測試全綠，而 edu-pro 的第四期分流 100% 失效**
- 根因：V3.9.3 修 N-16 時把 payload 的 `m` 從粗分類改成次型 enum（`EGFR_EX19`／`NEG`／`RET`…），
  但 `edu-pro.html` 第四期仍寫 `if(m==='EGFR')`、`if(m==='PDL1_HIGH')` → **永遠不成立** →
  所有第四期病人都掉到 else：「建議先做 NGS」「等報告期間：可先含鉑化療」
- **臨床影響**：已知 EGFR 陽性的第四期病人（台灣肺腺癌最常見族群），拿到的列印手冊掃 QR 後
  寫著「可先做含鉑化療」。那張手冊是發給病人的
- **這是我修 BUG-87（契約兩端要一起看）時引入的**：我改了編碼端（醫護版 payload 送次型 enum），
  也檢查了 `edu-patient`，**但 edu-pro 有兩個消費點，我只改了第三期那個**
- 教訓（最重要）：**比對原始碼字串的測試不是測試**。我 V3.9.0 起寫的 `cross_engine.test.js`
  有大量 `ok(read('lung/edu-pro.html').includes('ruleConsolidationIII'), ...)` 這種斷言 ——
  它只證明「某段字串存在」，不證明「那段程式會被執行到、且執行結果正確」。
  審核方只用 7 個斷言、實際執行頁面，就抓到我 238 個斷言沒抓到的事
- 教訓：**驗證要從「使用者真正走的入口」進去**。正確的做法是：餵入上游真正送出的 payload 格式
  → 執行整個頁面 → 檢查渲染出來的文字。中間任何一層的假設都可能是錯的
- (P0-3) 整庫取代後 `editId` 未重置：下一次切頁的自動儲存會用已刪除的舊 id 寫入 →

### #93 (V3.9.9)：把醫護的話直接拿給病人看
- (P1-1) **民眾版術語全面回流**：V3.0.1／BUG-35 訂過民眾版禁字（CCRT、鞏固、PCI、TKI、試驗代號、條文編號）。
  但 V3.9.0 起我把「會分叉的臨床判斷」抽成共用規則層時，**讓 `rule*()` 直接回傳寫好的 label/note**，
  而那些文字是我用醫護語氣寫的 —— 民眾版原封不動呈現 → 禁字大量回流
- 審核方以 10,800 組矩陣掃描抓到；我照做了一支 1,440 組的版本，**首次執行 9 類近千次**：
  「鞏固」738、「原生型」102、「CCRT」78、健保條號 24、「MDT」21、「LAURA」12
- 教訓：**共用層要共用「決策」，不要共用「措辭」**。同一個結論給醫護與病人看，用字必須不同；
  我把兩件事合在一起，等於讓「收斂」順便把醫護語氣灌進病人端。正確做法是規則層只回
  `kind`／`drugIds`／`nhi`，文字交給各頁的字典（審核方建議，本版先以逐項改寫達成同樣效果）
- 教訓：**禁字這種規範要有自動掃描才守得住**。BUG-35 訂了規則、靠人工遵守，撐了 30 幾版就破功，
  而且破功點不是「有人手滑」，是「架構改變後規則沒跟著搬家」。現在 `patient_wording.test.js`
  會在每次改動後掃 1,440 組病人可見文字
- (P1-2) **健保標示錯誤**：逐字核對 9.80 後確認，它的給付只有「第一線 IIIB／IIIC／IV 肺腺癌」
  與「第二線 T790M」，**沒有化放療後維持（LAURA）的適應症**，IIIA 也不在期別範圍內。
  我卻標成 `nhi:'NHI'` —— 而**專案自己的 BUG-33 早就記載過「9.80 無術後鞏固適應症」**
- 教訓：**自己記過的東西要會回頭查**。CLAUDE.md 累積 90 多條坑就是為了這個，但我加新功能時
  沒有去檢索既有紀錄。凡是要標「健保有給付」，都該先搜一次專案內是否已有相反的紀錄
- (P1-10) 醫護列印手冊仍寫「持續發燒…→ 請聯繫個管師」，**V3.7.1 已訂下「緊急狀況第一動作要是

### #94 (V3.9.10)：把整個 repo 上線，包含寫著密碼的交接文件
- (P1-8) `deploy.yml` 的 `path: '.'` 會把 **repo 全部內容**上傳到 GitHub Pages：
  `README.md`／`CLAUDE.md`（**內有醫護版密碼明碼**，我自己寫進去的）、`SELA-handoff.md`、
  `docs/肺癌臨床路徑_待核定事項.md`（**尚未核定的臨床決策清單**）、`test/`。
  而且 Pages 是公開網站、可被搜尋引擎索引
- 教訓：**「純靜態不需 build」不等於「整個 repo 都該對外」**。我當初寫 `path:'.'` 時的註解是
  「純靜態，整個 repo 直接上傳，不需 build」— 那句話把「不需要編譯」誤推成「不需要挑選」。
  部署設定要用**白名單**，不是「全部上傳然後希望沒有敏感檔案」
- 教訓：**寫進文件的密碼會跟著文件走**。我在 README 記錄密碼是為了交接方便，但這份 README
  被打包進每一版 zip、也被上傳到公開網站。憑證類資訊不該出現在任何會被散布的文件裡
- (P1-7) 共用 JS 沒有版號：GitHub Pages 預設快取 10 分鐘、院內代理可能更久 →
  部署後可能出現「新 HTML + 舊 `_path.js`」。加 `?v=` 與版號常數比對，不符時**頁首顯示紅色警示**。
  這同時修掉我一直在用的 `typeof X === 'function' ? X(...) : 舊值` 守衛 —— 那等於把
  BUG-81「靜默消失」制度化：新函式沒載入時不報錯、改用舊邏輯
- (P1-6) **IndexedDB 包裝只處理成功路徑**：沒有 `onerror`／`onabort` → 寫入失敗時
  Promise 永遠不會 resolve，呼叫端 `await` 卡住，**畫面沒反應也沒有任何訊息**。
  另外草稿的新 id 是用 `getAll()` 取最後一筆而非 `put()` 的回傳值 → 快速換頁會產生重複草稿
- 教訓：**只寫 happy path 的非同步包裝，失敗時不是報錯而是「永遠不回來」**。
  這比拋例外更難查，因為完全沒有訊號。凡是把事件型 API 包成 Promise，
  三種結局（complete／error／abort）都要接

  24 小時找得到的管道」的原則，但只套用在民眾版** → 同 BUG-78「A 檔有防護、B 檔沒有」的家族

  **把前一位病人的表單內容寫進另一位病人的紀錄**。教訓：**清空資料庫時要一併清空「指向資料庫的游標」**
  （editId、draftId、dirty 旗標），否則 UI 還握著已經不存在的 id

  原本只能標示「可切除需由 MDT 判定」，現在不可切除時直接不顯示該選項（NCCN 與健保的術前輔助都限可切除者）

  不隱藏也不混入健保藥單。G-02 更進一步：只作說明、**不列入藥單**，避免病人以為是可選項目














---

## 七、擴充新癌別

1. 複製 `lung/` → `{新癌別}/`（含 patient.html）
2. 改 `CFG`，拿本院指引 PDF → 改 `PW` / `STAGE_GOALS` / `CHECKLIST`
3. 改 patient.html 的 `DRUGS` 和 `buildPath()` 對應該癌別
4. 測試所有路徑 → Portal `CANCERS` 加 `active:true` → 系統版 +0.1

建議順序：頭頸/食道 → 大腸直腸/乳癌 → 攝護腺/膀胱/肝癌

---

## 八、下版候選工作

按優先序：

0. **【外部審稿待辦清單，2026-07 收到】** Sela 找外部審稿逐條檢查 V3.5.3 民眾版，已核對確認屬實的項目（詳見 BUG-68）。**Sela 已拍板的處置**：
   - ❌ 民眾版 IndexedDB 紀錄 PHI（審稿建議移除）→ **不動**（V3.2.0~V3.3.2 四版做的個管師工作流，維持現狀）
   - ❌ QR 去識別化（審稿建議拿掉姓名/病歷號）→ **先不動**（QR 個人化辨識是設計目的，V3.4.4 才加識別防呆）
   - ⏸ **健保 115/8/1 新增 Aumolertinib（Pulmivex）等給付更新 → 待辦、先不動**。專案內健保文件是 `chap9_1150522.pdf`（115/5/22）+ 附件2（115/5/1 生效），查無 aumolertinib。**要 Sela 提供 115/8/1 正式給付規定 PDF 才改** — 健保內容會被拿去對申報，不用外部連結當來源（同 BUG-63 不捏造醫令碼原則）
   - ✅ 架構（拆檔）→ 要**同時考慮未來擴充不同癌別**，見下方第 1 項

1. **完整實機驗證 V3.0.1~V3.6.2** — **累積十多版沒完整上真機，而且 V3.6.0~V3.6.2 動的正是分期引擎與治療分流（最核心的臨床邏輯）**。個管師務必拿真實病人核對：(a) 簡易模式選 T2/N0 顯示「約 Stage IB–IIA」而非硬給 IB (b) 按「不知道 TNM」只出現「先完成分期檢查」、沒有任何治療建議、基因建議卡也不再給晚期建議 (c) 驅動基因選「尚未檢測」+ PD-L1 高 → 導向先完成檢測（不是免疫單藥）(d) **III 期 EGFR ex19/L858R 病人看到的是口服標靶維持、不是 Durvalumab**，且最上方主結論也一致 (e) exon20 插入突變看到 Amivantamab + 化療 (f) SCLC 侷限期看到免疫鞏固且標明健保未給付 (g) IB 術後不再出現 Atezolizumab (h) 掃 QR 跟畫面完全一致（含簡易模式）(i) T1N1 顯示 IIA
2. **完整實機驗證 V3.0.1~V3.5.2** — **累積多版沒完整上真機**。(a) V3.4.8 M1c 藥物對照：轉移期決策頁顯示「基因/免疫檢測→對應藥物」對照卡、各 mutation 顯示具體藥名(EGFR→泰格莎等、KRAS→魯瑪克拉斯自費)、藥名跟 drugs-pro 一致 (b) V3.4.7 T4/M1 期別：拿 M1b(單一轉移) 病人確認顯示「寡轉移/IVA」非「局部晚期」、M1a 對側肺結節病人顯示涵蓋範圍、T4N0/N1 走可切評估 vs T4N2/N3 走 CCRT (b) V3.4.6 N2 分期分路：拿真實 N2a/N2b 病人（尤其 T3N2a=IIIA、T2N2b=IIIB）核對治療建議標的 stage 跟決策路線是否相符、不再出現 IIIA 標 IIIB (b) V3.4.4 儲存防呆：民眾版走完查詢、病歷號跟姓名都不填 → 按儲存跳提醒且沒存進紀錄；填任一項 → 存得進去 (b) V3.4.3 favicon：各頁分頁圖示顯示新 app logo（藍底白路徑）、portal 跟 lung/ 子頁都對、手機加到主畫面圖示對 (b) V3.4.2 QR 掃描：民眾版存查詢→產生 QR→手機掃→衛教頁 PD-L1 顯示且治療分流跟查詢工具一致；舊 QR（V3.4.2 前）掃描不會壞 (b) V3.4.1 密碼：portal 點「醫護版」某癌別 → 彈明碼密碼框、輸 （密碼見院內交接，不寫入文件） 進入、同分頁再點免重輸；**直接輸 lung/ 網址（未經 portal）→ 踢回 portal**；明碼看得到打的字 (c) V3.4.0 Q4 兩區：驅動基因選 EGFR + PD-L1 選≥50% 能同時選、總覽顯示兩者、EGFR+PD-L1高顯示標靶優先提醒 (c) V3.3.2 團隊還原 (d) V3.3.1 返回鍵 (e) V3.3.0 載入修改 TNM 回填 (f) V3.2.x 紀錄不撞醫護版庫 (g) V3.1.4 字體 (h) V3.1.3 時效 (i) V3.1.2 資料安全 (j) V3.0.9 Q 頁不撐爆 (k) 個管師找 3-5 個真實病人試用
3. **摩擦報告順手項（#7 + #9，成本低可夾帶）** — (#7) 病人分頁沒有就地「儲存」按鈕，填完基本資料想先存再離開得走到手冊/總覽才有 → 病人分頁底部加「儲存」(#9) 「多專科會議日期」欄位獨占一行右邊空 div、版面浪費 → 跟別的欄位併排。兩項都是小改，順手做
4. **民眾版抽 `collectQueryFields()` 單一真相**（BUG-53 指向的根治）— saveQuery 已經漏存兩次（t/n/m、consult），欄位散在 saveQuery/loadRecord/restart 三處手動列。學醫護版 BUG-46 的 collectStateFields 作法，抽一個回傳完整欄位物件的函式，三處共用一份清單，之後加欄位不會再漏。目前 ~17 欄手動列還能忍，但已漏兩次，該做
5. **個管師視角審查發現的 7 條設計缺口排程動手**（V3.0.3 BUG-37 末段詳列）：
   - 🟡 #1 跨院轉診 pTNM 獨立輸入（30 分）
   - 🟡 #2 紀錄列表頁加 3 個 KPI 色點（30 分）
   - 🟡 #3「我的待辦 / 即將超期」清單分頁（2 小時，大功能）
   - 🟡 #4 actualTx 拆 plannedTx + actualTx（1 小時）
   - 🟡 #5「實際治療」勾選加治療日期欄位（1 小時）
   - 🟢 #6 副作用追蹤系統 CTCAE 分級（半天起跳）
   - 🟢 #7 個管師名字改設定（15 分）
6. **GitHub Pages 部署實機驗證 V3.0.0 + V3.0.2 對齊狀態** — Kit 對齊里程碑後上線必跑：(a) 整個檔案結構含 `.gitignore` (b) 版號顯示「lung V1.11.2 · System V3.0.3」 (c) zip 命名「Cancer Navigation V3.0.3.zip」三位版本號 + 空格 (d) 確認沒被誤加 SELA logo 殘留（品牌歸彰濱秀傳）(e) 配色 `#5B8FB9` 沒被誤改成 Kit 預設 `#5A7A8B`
7. **Sela 比對院內指引術後輔助章節** — V2.10.0/V2.11.0 新加的術後路徑（IA 期細分、IB 高風險判定、ADAURA Osimertinib 3 年、ALINA Alectinib 2 年、IMpower010 Atezolizumab 條件、SCLC 術後 PCI 是否仍建議、復發後重做基因檢測時機）需對照本院指引 v12 (2026)
8. **Sela 確認健保事審現況**：(a) Sotorasib (KRAS G12C) (b) Alectinib 術後鞏固 ALINA (c) Amivantamab 健保適應症 (d) Atezolizumab adjuvant IMpower010
9. **Sela 逐條 review drugs.html 的 ALL_DRUGS** — 28 種藥物資料
10. **mut-based filter for postOp consolidation steps** — 目前 postOp EARLY 三個鞏固 step（EGFR/ALK/Atezo）一律全列。如果 user 已填 mut=EGFR，可考慮只顯示 Osimertinib 並標「您符合此鞏固條件」，反之只列 Atezo（PD-L1 條件視確認）
11. **DRUGS 拆 PRO/PATIENT 兩份**（V3.0.1 + V3.0.3 教訓延伸）：patient.html / edu-patient.html / drugs-patient.html 三處共用同套 DRUGS，醫護版需要的條文編號 / 試驗代號 / NCCN 分級對民眾就是雜訊。下版考慮拆 `lung/_drugs_pro.js`（醫護版用）+ `lung/_drugs_patient.js`（民眾版用），徹底分離雙人口資料源 + 加 `lung/_qr_payload.test.js` 端到端 pipeline 測試（V3.0.3 教訓）
12. 新增第二個癌別（頭頸或食道）— 模板已穩定。**注意**：依 BUG-22 教訓分期邏輯不同；BUG-24 教訓拆 edu-pro/edu-patient；BUG-25 教訓並列按鈕分配視覺權重；BUG-26 教訓問答鎖屏 vs 閱讀解鎖；BUG-28 教訓個人化建議要套到 step 內容；BUG-30 教訓 stage axis 從一開始就要分 c/p 兩階段；BUG-31 教訓 phase 標記要從一開始就放 step；BUG-35 教訓民眾版要獨立翻譯層不能跟醫護版共用 note；BUG-37 教訓雙人口資料傳遞 pipeline 要端到端測試
13. 醫護版列印手冊樣板審視（自從 BUG-11 後沒再大改）
14. **DRUGS / buildPath 共用機制觀察**：patient.html 跟 edu-patient.html 兩處有同樣的 DRUGS、buildPath、buildPostOpPath、splitStepsByProgress、buildRecurrencePath。五個地方要同步改的負擔越來越重（V3.0.1 大修同步耗時 1/3）；下版前考慮抽 `lung/_drugs.js` + `lung/_path.js` + `lung/_progress.js` 共用

---

## 九、一句話總結

V3.9.10 內部審核 P1-5～P1-8：(P1-8) **deploy.yml 的 `path:'.'` 把整個 repo 公開到 Pages**（含 README/CLAUDE.md 內的醫護密碼明碼、未核定的臨床決策清單、test/），改白名單組裝並把密碼移出文件 (P1-7) 共用 JS 加 `?v=` 與版號常數比對，不符時頁首紅色警示（取代 typeof 靜默降級）(P1-5) 醫護 QR 改 base64url、150→260px、容錯 L→M (P1-6) IndexedDB 包裝補 onerror/onabort（原本失敗時 Promise 永不結束、畫面卡住無訊息）、草稿 id 改用 put() 回傳值並加單飛鎖、補 navigator.storage.persist()。BUG-94 教訓：**「純靜態不需 build」不等於「整個 repo 都該對外」**（部署要用白名單，不是全部上傳然後希望沒有敏感檔）、**寫進文件的密碼會跟著文件走**（README 被打包進每一版 zip 也被上傳到公開網站）、**只寫 happy path 的非同步包裝，失敗時不是報錯而是「永遠不回來」**（比拋例外更難查，因為完全沒有訊號）。V3.9.9 內部審核 P1-1／P1-2／P1-10：(P1-2) 逐字核對健保 9.80 發現**我們把 Osimertinib 維持標錯成健保給付** —— 9.80 只有「第一線 IIIB/IIIC/IV 肺腺癌」與「第二線 T790M」，沒有化放療後維持（LAURA）的適應症，IIIA 也不在期別範圍；而專案自己的 BUG-33 早就記載過這件事 (P1-1) 民眾版專業術語全面回流（V3.9.0 起規則層直接回傳醫護語氣文字），新增 patient_wording.test.js 掃 1,440 組病人可見文字，首次執行抓到 9 類近千次，逐項改寫後 22 項全淨 (P1-10) 醫護手冊緊急指引未套用 V3.7.1 的急診原則。BUG-93 教訓：**共用層要共用「決策」不要共用「措辭」**（同一結論給醫護與病人看用字必須不同）、**禁字規範要有自動掃描才守得住**（BUG-35 訂了規則靠人工遵守，撐 30 幾版後因架構改變而破功）、**自己記過的東西要會回頭查**（累積 90 多條坑就是為此，但加新功能時沒檢索既有紀錄）。V3.9.8 內部審核 V3.9.7 三項 P0（審核方**實際執行頁面**而非比對原始碼字串）：(P0-1) edu-pro 第四期分子分流因 V3.9.3 改 payload enum 而全面失效 → 所有第四期病人（含 EGFR 陽性）都拿到「先做 NGS、等報告可先含鉑化療」，而那張列印手冊是發給病人的；改走 ruleMetaSystemic + DRUGS，補 _eduProMut 的 RET/NTRK/HER2 與 pdl1Band (P0-2) edu-pro 的 C4 措辭與術後自費標示 (P0-3) 整庫取代後 editId 未重置 → 自動儲存把前一位病人的表單寫進另一位病人的紀錄。審核方的 edu_pro_exec.test.js 修前 0/7、修後 7/7，已納入隨包測試。BUG-92 教訓（最重要）：**比對原始碼字串的測試不是測試** — 我的 238 個斷言全綠，審核方用 7 個「實際執行頁面」的斷言就抓到 edu-pro 第四期 100% 失效；`ok(read(檔案).includes('函式名'))` 只證明字串存在，不證明那段會被執行到且結果正確。**驗證要從使用者真正走的入口進去**（餵上游真正送出的 payload → 執行整頁 → 檢查渲染文字）。另：清空資料庫時要一併清空指向資料庫的游標（editId/draftId/dirty）。V3.9.7 NCCN 差異 G-08～G-10 完成，**G-01～G-10 十項全數處理完畢**：新增「是否可切除」欄位（不可切除的早期改走化放療+鞏固，依 driver 分流並標健保第二期不符；術前輔助不再顯示）、ROS1 抗藥後加 Zidesamtinib 標自費、鱗狀癌檢測提高建議強度為「指引建議都考慮」。測試 159→184 項。BUG-91 教訓：**`if(st==='EARLY')` 在檔案裡有兩處**（buildPathCore 與 buildPostOpPath），字串比對插入時插錯地方 → 語法合法、node --check 通過、功能永遠不生效；**用字串比對插入前要先確認目標唯一**（BUG-68「替換到不該替換的」的變形）。**輸入矩陣驗證是分支多的改動唯一可靠的檢查**（連兩版都是矩陣抓到，都不是讀程式碼讀出來的）。V3.9.6 NCCN 差異 G-02～G-07（Sela 逐項核定後實作）：EGFR 一線加國際指引兩組合的說明但不列藥單（標健保未給付）、少見型 EGFR 改列 Afatinib/Osimertinib 並說明健保次型差異、術後 RET→Selpercatinib 標自費、術後免疫加 Pembrolizumab 並註明 PD-L1<1% 效益未明、**新增 Q5「術前用過哪種免疫藥」欄位**使術後接續同一 ICI、SCLC 後線加 Tarlatamab 標自費+CRS 風險。測試 132→159 項。BUG-90 教訓：**批次修改腳本中途 assert 失敗會讓前面的修改全部沒寫入**（我沒察覺就接著補後半，造成「用到未宣告的常數」；node --check 完全通過、執行才炸 — 這是 BUG-68/75 的第三次同型）、**同一決策有幾條分支就要確認每條都改到**（G-05/06 我只改了鱗狀那條，非鱗狀走另一個 else if）、用輸入矩陣驗證比逐條讀程式碼可靠。Sela 核定的處置原則：**NCCN 有但健保沒有的一律「呈現 + 標示自費」**，不隱藏也不混入健保藥單。V3.9.5 NCCN 差異比對 G-01：補 RET／NTRK／HER2（Sela 提供最新 NCCN **8.2026/1.2027**，我先前註解一直寫 3.2026、版本引用從頭就錯；比對後列出 10 項差異，此為唯一純程式缺陷）。**醫護版其實一直有收集這三項**，但 mutEnumForRules 只認 ros1/braf/met/kras → RET/NTRK/HER2 陽性落到 EGFR_OTHER，被當成少見型 EGFR 且不報錯。修：常數、映射、民眾版 Q4、drugs 頁對映、三個治療分支；健保狀態逐條核實（RET/HER2 查無肺癌條文→自費，NTRK 9.95 有給付但要求無合適替代）。測試 109→132 項。BUG-89 教訓：**「有欄位可填」不等於「有人會用」**（輸入端與決策端是兩套程式，映射漏一個值那欄位就成資料墳場；是 BUG-87 的鏡像版 — 這次是送了但接收端不認得）、**斷言的取樣來源決定覆蓋範圍**（BUG-78 的「沒有值掉出分類」只取樣民眾版 UI，救不了只有醫護版能選的值）。NCCN 差異其餘 9 項需臨床決定（Tarlatamab CRS 條件、EGFR 一線是否呈現 FLAURA2/MARIPOSA、少見型 EGFR 用藥、圍手術期 ICI 接續、術後 Pembrolizumab/Selpercatinib、不可切除 II 期鞏固、ROS1 後線 Zidesamtinib、鱗狀癌檢測建議強度），已列入待核定文件。V3.9.4 依健保 115/6/1 條文建立術前（前導）輔助治療路徑（Sela 貼條文問「我們有沒有這條」）。查核：**有一句但過時且會誤導** — 原註記寫「術前免疫合併化療目前健保尚未給付，需自費或臨床試驗」，但 115/6/1 起已給付 nivolumab → 等於叫病人自費一個健保已給付的治療。新增 ruleNeoadjuvant 依條文逐項判定（腫瘤≥4cm 或 N1/N2、排除 N3、M0、不具 EGFR/ALK、至多 3 療程），處方依組織型態，EARLY 與可切除 IIIA 兩處都接，未檢測導向先確認。測試 96→109 項。BUG-88 教訓：**「健保未給付」這類敘述有保存期限，要標註條文版本與日期** — 治療內容與藥名錯了臨床人員看得出來，但給付狀態寫錯病人與個管通常不會質疑，錯誤特別隱蔽。V3.9.3 內部綜合複審剩餘可修項目：(N-09/N-10) 復發改寫 title 會讓個管用藥勾選全部失效（V3.8.0 的 P0-3 只替 EGFR 第一線加了 id，其餘 19 個含藥步驟都沒有）→ 全部補顯式 id、stepKeyOf 不再 fallback 並加 warn（當場又抓到 2 個漏補）(N-08) EGFR_OTHER 三處三種語意 → 統一為「用藥需個別評估」(N-15) getAdjuvantHTML 缺 IA 分支且靜默回空字串 → 補分支 + 明確提示 (N-16) **醫護版 payload 沒送 b，使 edu-pro 正確的腦轉移分流永遠不執行** → 補 b/pd/TNM/po 且 m 改送次型 enum。測試 85→96 項。BUG-87 教訓：**「解碼端寫對、編碼端沒送」兩端都不會報錯**（契約兩端要一起看，新增 payload 欄位要同時確認有沒有送、有沒有讀、格式一不一樣）、**修識別碼問題要把同類物件全部盤一遍**、**讓錯誤大聲一點比安靜退回預設值有價值**（新加的 warn 當場抓到漏網）、**enum 成員資格分散在多分支遲早不一致**。仍待肺癌團隊或 V4.0：N-07 PD-L1 只有 50% 一刀、無法表達 ≥1% 門檻（需與 C2 一併核定）、N-11/N-12 醫護版 txGroup 不讀分子與治療進度（canonical engine 範圍）、C5 uncommon EGFR 的實際用藥。V3.9.2 內部「臨床路徑綜合複審」的引擎自身錯誤（報告針對 V3.8.3，逐條實測後六項在 V3.9.1 仍在）。核心警告：外部審核把 `_path.js` 當成正確的那一版建議全系統向它收斂，但它自己有臨床錯誤 —— 我 V3.9.0 正是這樣做的，等於把錯誤同步擴散。修：(N-02) 鱗狀+任一 driver 拿到 Pemetrexed（六分支各自寫死 backbone，BRAF 當初有做對其餘漏了）→ 抽 chemoBackbone(isNS) (N-03) 非 EGFR 勾 T790M 被建議換 Osimertinib（V3.8.0 加了兩個精細守衛卻漏了 _isEgfr）→ 引擎與 UI 都擋 (N-04) 術後追加治療不用 driver 資料 → 依 driver 分流 (N-05) SCLC 侷限期+腦轉移仍給侷限期鞏固 → 改提示分期不一致 (N-06) 第三期基因未驗即給 Durvalumab → 改導向先完成檢測 (N-13) 移除死常數 DURVA_EXCLUDED。測試 57→85 項。BUG-86 教訓：**收斂之前要先確認收斂目標本身是對的**（統一到錯誤答案比保留兩個矛盾答案更危險，因為矛盾至少會被發現）、**測試矩陣少一個維度等於沒測**（V3.8.4 的鱗狀斷言只測了 NEG）、**加新守衛時要先確認最基本的前提有沒有被檢查**、**「條件未知」不等於「條件成立」**、**取代唯一事實來源時舊的必須刪掉**。尚未處理（報告其餘項目）：N-07 PD-L1 資料模型無法表達 ≥1% 門檻、N-08 EGFR_OTHER 三處三種語意、N-09 復發路徑使藥物勾選失效、N-11/N-12 醫護版 txGroup 不讀分子與治療進度、N-15/N-16 醫護版 getAdjuvant 與 QR payload 缺欄位。V3.9.1 依 Sela 提供的健保第 9 章 115/8/21 逐字核定（等了好幾版的正式 PDF 到位）：(1) **C2 抓到我們弄錯的地方** — 條文的 Durvalumab 鞏固排除集合依組織型態不同（非鱗狀需 EGFR/ALK/ROS-1 原生型、鱗狀只需 EGFR/ALK 原生型），我們原本兩者都排除 ROS1 → 鱗狀 ROS1(+) 病人被多擋掉一個有給付的選項；新增 durvaExcludedFor(isSquamous)，三處呼叫端傳組織型態 (2) 新增 9.138 Aumolertinib（普米維，115/8/1）於 EGFR 一線（五藥→六藥）與 T790M 二線（單藥→兩藥擇一）及兩個藥物庫 (3) C4 找到逐字依據：ICI 用於擴散期 SCLC 明訂限「無腦部或無脊髓轉移」，證實是給付條件非醫學禁忌 (4) Bevacizumab（L858R+腦轉移+非鱗狀+IV）與 Dacomitinib（無腦轉移）與現行實作相符。跨引擎測試 57 項全綠。BUG-85 教訓：**同一個藥同一個適應症的給付條件仍可能依組織型態分岔**（BUG-82 學到處方會分，這次是給付條件也會分）、**堅持等正式文件是對的**（從 V3.5.0 擋掉多次憑印象改健保的誘惑，這次逐字核對抓到連審核方也沒發現的差異）。下版第一優先仍是 **canonical clinical pathway model（V4.0）**；V3.9.0 收斂三套平行臨床路徑（外部「路徑漂移複審」判 P0）：`_path.js` 只服務民眾版兩頁，醫護版 PW/PW_SUMMARY/STAGE_GOALS 與 edu-pro 各自決策 → V3.6.0 後的臨床修正只進民眾版，同一病人在不同頁面拿到不同治療順序（III 期 EGFR 民眾版走 Osimertinib、醫護 QR 仍給 Durvalumab；LS-SCLC 鞏固只有民眾版有；ES-SCLC 腦轉移主卡與 QR 互相矛盾）。過渡做法：建共用臨床規則層（ruleConsolidationIII / ruleLsSclcConsolidation / ruleEsSclcImmune / ruleMetaSystemic），四頁全部載入 _path.js 呼叫同一函式；另修醫護版把鞏固寫成 CCRT 並列選項、edu-pro 無條件 Durvalumab、醫護版 EGFR 壓成單一粗分類不參與決策、EGFR 後線 title 與藥單不同步。新增 test/cross_engine.test.js（53 項）。BUG-84 教訓：**抽共用引擎要先盤點「有幾個地方在做同一件事」**（我 V3.6.0 只解決當時被回報的那一組，從沒問過醫護版是不是也在決定治療）、**「96 組 round-trip 全綠」是被誤用的指標**（只證明民眾版兩頁一致）、**renderer 可以多份、決策點只能有一個**。下版第一優先：**canonical clinical pathway model（V4.0）** — 複審建議 engine 產生結構化結果、各頁只當 renderer、刪除 PW_SUMMARY/STAGE_GOALS/edu-pro 的決策功能；需先凍結功能並由 MDT 建立 12–20 個 golden cases 核定 canonical output。**待肺癌團隊核定（不由工程端自行決定）**：C1 IA 期高風險因子是否提示術後化療、C2 Durvalumab 的 driver 排除集合需以現行健保第 9 章逐字核定、C3 EGFR 標靶失效後是否／何時呈現 ICI、C4 健保限制與臨床禁忌的措辭分層（已先改成兩行陳述）。另：健保 115/8/1 更新仍待 Sela 提供正式 PDF；第二癌別（大腸直腸癌）待 canonical engine 完成後再開。V3.8.5 外部審核 V3.8.3 四項：(P1-01) 舊 QR 單一高風險因子被逐字拆開（`rf` 用有無逗號判斷格式，舊格式單項本來就沒逗號 → `LVI`→`LVI,VPI,I`，六個舊值全中）— 病人拿舊 QR 會看到病理報告上沒有的高風險因子；改成先辨識完整舊 enum 並加 `v:2` schema 版本 (P1-02) handleImport 改 dry-run + 單一 transaction（原本逐筆 put，失敗時已寫入部分卻顯示格式錯誤 → 重複匯入）(P2-01) 清除 README 被 shell ps 輸出污染的 50 行 (P2-02) **測試隨包** `test/qr_payload.test.js` 54 項斷言可重跑。BUG-83 教訓：**不要用資料外觀推斷格式版本**（啟發式在邊界會悄悄錯，版本要明寫在資料裡）、每次為省空間改編碼都要同時定義怎麼分辨新舊（V3.8.1 改五種編碼全靠外觀判斷 → 連三版在修後遺症）、含反引號的文件內容不要塞進 shell 雙引號字串、**測試不隨包外部就只能相信宣稱**。前一版 V3.8.4 同步化放療處方依組織型態分流（個管覺得怪怪的→查證屬實）：NCCN 3.2026 NSCL-F 明列非鱗狀 preferred 是 Carboplatin/Cisplatin+Pemetrexed（PROCLAIM：存活相當、副作用較少），鱗狀不適用 Pemetrexed；原本兩種組織型態共用同一組（只有 Paclitaxel/Etoposide 那兩種）→ 非鱗狀病人看不到自己的首選處方。另全面稽核其他化療處方，鱗狀路徑無任何 Pemetrexed。BUG-82 教訓：**「所有組織型態共用一組處方」本身就是可疑訊號**（肺癌鱗狀/非鱗狀用藥差異大，Pemetrexed、Bevacizumab 都限非鱗狀）、**個管說「怪怪的」但講不出所以然時，通常是「少了什麼」而不是「多了什麼」**（少掉的選項畫面完全正常、不會報錯，同 BUG-81 的靜默失敗家族）。前一版 V3.8.3 全面修 V3.8.1 短碼造成的顯示破口（個管回報主治變 ?，Sela 要求全面查 → 實際壞 5 處：主治、驅動基因、PD-L1、SCLC 腦轉移、日期，其中三項是**靜默消失**不是報錯）。修法是在解碼入口加 `normalizeQR(d)` 一次還原成長格式，而非逐點補。新增 14 欄位顯示稽核測試。BUG-81 教訓：**改資料格式要在最靠近入口處還原、不要散在各消費端**（V3.8.1 我在 stateFromPayload 還原，那只是其中一個消費端）、**「靜默消失」比「顯示問號」更危險**（問號會被回報、消失不會；`map[key]||''` 這種查表回退空字串的寫法一變格式就靜默失敗）、壓縮這種橫跨多消費端的改動要先列消費端清單再動手。前一版 V3.8.2 修 V3.8.1 的 regression（Sela 實機截圖）：QR 衛教頁分期顯示「p?」。瘦身時讓「有 TNM 就不送 s/sl/ps」，`stateFromPayload` 已改走重算、但顯示用的 `stageDisplay` 仍直接讀 `d.s`/`d.sl` → 皆空 → '?'；並補 `_eduStageInfo` 回傳 exact stage（否則唯一解會顯示成「約 IB」）。BUG-80 教訓：**移除/停送欄位時要 grep 全專案所有讀它的地方**（與 BUG-76 同家族的鏡像：那次資料進了 renderer 沒進 engine，這次 engine 改了 renderer 沒跟）、衍生值改由接收端重算要涵蓋原本送的所有欄位。前一版 V3.8.1 QR 瘦身（Sela 回報圖形太複雜、長輩掃不到；審核 P2-15 同列）：有 TNM 時 s/sl/ps 不送（edu 重算）、空值不送、固定值用兩端共用短碼表（舊 QR 查不到就原樣回傳、相容）、dx 從「步驟鍵|藥名」壓成「步驟鍵:索引」（79→15 bytes，edu 兩段式還原）、btoa 改 base64url、QR canvas 200→300px。實測最壞情境 614→338 字元、**縮減 51%**。BUG-79 教訓：QR payload 要定期量測（註解寫「<200 字元」但實際已 614，欄位是一版一版加上去的、沒人回頭量）；**可由其他欄位重算的資料不要進 payload**；短碼表要放共用檔且解碼採「查不到就原樣回傳」才能相容舊 QR。前一版 V3.8.0 內部+外部兩份審核的上線閘門項目。最嚴重是內部 P0-1（**我 V3.7.0 造成的 regression**）：拆 EGFR 子型後 `isEgfrClassic` 判斷式仍比對舊 enum → 永遠 false、Osimertinib 鞏固分支變死碼 → 第三期 EGFR 病人又拿到 Durvalumab。根因是驅動基因清單散在 5 處各寫一份 → 抽共用常數一次解掉 P0-1+P1-4+P1-5+P1-6。另修：SCLC 載入毀損並可能永久覆寫（P0-2）、drugOff 位置索引漂移 + 候選集合被當成已選定治療（P0-3/外部P1-1，五態矩陣全綠）、還原靜默覆寫本機病人紀錄（外部P0-1，改整庫取代/合併匯入+單一transaction）、醫護版完全沒有 escape 工具的儲存型 XSS（外部P0-2）、CSV 跳脫與公式注入（外部P1-2）、查表漏 T1a／Tis 回空白／need 漏 T1c／mutDisplay 漏 DECLINED／版號紀律。BUG-78 教訓：**不要驗「某個值走對分支」，要驗「沒有任何值掉出分類」**（新增 enum 後舊的 includes 清單不會報錯，只會靜悄悄走進 else；窮舉 enum×分類完整性可 100% 攔截）、拿位置索引或候選集合當語意遲早漂移、**同專案「A 檔有防護 B 檔沒有」是常見盲點**（民眾版有 escapeHtml、醫護版一直沒有）。下版第一優先：**審核方複審 + 真實瀏覽器回歸** — 兩份審核都指出本輪未能做像素級與實機驗證（無可執行 Chromium）；第 2 是未處理的 P2/P3（民眾版紀錄個資曝險 P2-11 Sela 已決定不動、QR payload 膨脹至 856 字元與 base64url、CDN 無 SRI、醫護版 History API、字級無障礙）；第 3 是健保 115/8/1 更新與第二癌別（大腸直腸癌）。V3.7.3 Sela 回報兩項：(1) edu 抬頭與分期區是兩個同色漸層方塊疊著造成視覺衝突 → hdr 改無底色細標題列、hero 為唯一主色塊 (2) 個管勾選用藥後仍出現矛盾敘述（已選 Osimertinib 卻還寫「若第一線不是 Osimertinib…」）→ 加 drugChoice 依實際勾選改寫後續敘述、markDroppedSteps 讓整步被取消的藥步驟在衛教頁不顯示；補修 edu 沒把 dx 接進 state.drugOff（round-trip 抓到）。96 組 round-trip + renderSummary 全綠。BUG-76 教訓：**個管的「決定」要往下游傳遞，不只是過濾顯示** — 勾選用藥不只該隱藏未選的藥，還要讓後續步驟裡「假設你用的是別種藥」的條件敘述跟著改，否則病人會讀到自相矛盾的手冊；跨頁功能要檢查「資料有沒有真的進到引擎」而不只是進到 renderer（dx 進了 window.__drugOff 卻沒進 state）。V3.7.2 藥名譯名統一：Carboplatin 碳鉑→卡鉑（5 處），Cisplatin 順鉑原本正確。前一版 V3.7.1 Sela 回報三項：(0) 修 V3.7.0 regression — 選「暫不檢測」治療方向整個空白，原因是藥物勾選寫 `drugKey(si,d)` 但迴圈索引叫 `i`，renderSummary 拋 ReferenceError（edu 的 `_si` 同錯）；`node --check` 抓不到，跟 BUG-68 同類 (1) 病理高風險因子改個管手動勾選（LVI/VPI/≥4cm/低分化/切緣陽性/Nx，複選），引擎從空話「除非病理發現…」改成寫實列出實際因子 (2) 緊急回診改「立即至急診就醫」，不再叫病人先聯繫個管師（緊急時聯繫不上會延誤）。72 組 round-trip 全一致。BUG-75 教訓：**驗證要涵蓋使用者真正看到的那一層**（我一直只測 buildPath 引擎輸出，沒測 renderSummary 渲染 → 引擎對、渲染炸，畫面一樣空白；UI 層改動要把 render 函式也呼叫一次）、系統講「若有 X 就…」的空泛語句通常代表缺一個該收集的欄位、緊急指引第一動作要是 24 小時找得到的管道不能是特定某個人。下版第一優先：**完整實機驗證 + 審稿方的完整操作情境 regression** — V3.7.0/V3.7.1 連動 Q4/Q5 結構、QR payload、總覽編輯層與渲染層，且這次的空白 bug 證明我的 harness 對渲染層覆蓋不足；第 2 是健保 115/8/1 更新（等 Sela 提供正式 PDF）；第 3 是第二癌別（大腸直腸癌）。
