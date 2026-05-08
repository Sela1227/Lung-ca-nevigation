# CLAUDE.md — Cancer Navigation
> Sela 的專案。讀完直接動手，不要問問題。

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
| V2.10.0 | V1.8.0 | 2026-05-08 | 民眾版加病理期別模式（已手術切換）— Q3 加 stage-mode toggle、`S.postOp` 路由 `buildPostOpPath()`，跳過手術建議走「術後輔助 + 標靶/免疫鞏固 + 規律追蹤」+ stageDisplay 加 p 前綴 + edu-patient 同步 BUG-30 |
| V2.9.5 | V1.7.5 | 2026-04-30 | 藥物頁拆兩版（drugs-pro 加 NCCN/事審/必試/cross-ref；drugs-patient 加副作用、用途）+ 個人化推薦（總覽頁帶 query 跳 drugs-patient）|
| V2.9.4 | V1.7.4 | 2026-04-30 | 手機版 Q-page 鎖屏 bug 修復（TNM 進階 9 欄擠扁、iOS 自動 zoom、safe-area、grid-rows 失效）BUG-29 |
| V2.9.3 | V1.7.3 | 2026-04-30 | 民眾版說明精簡（刪「醫師討論」客套話、刪試驗代號、note 瘦身）|
| V2.9.2 | V1.7.2 | 2026-04-30 | portal.html UI 重構（清爽收斂、header 收縮、role 卡瘦身、quick-tools 改同節奏 section）|
| V2.9.1 | V1.7.1 | 2026-04-29 | 民眾版字樣全面平民化（CCRT→同步化放療、RT→放射線治療）+ 隱藏放療劑量（由主治溝通）|
| V2.9.0 | V1.7.0 | 2026-04-29 | 民眾版加 Q1 基本資料頁(年齡+ECOG)、流程改 5 頁、buildPath 依 age/ecog 動態調整建議 BUG-28 |
| V2.8.11 | V1.6.11 | 2026-04-29 | 手機版總覽頁解鎖捲動 + 返回按鈕語意精準（上一題 vs 返回）+ 治療路徑全面 review（NSCLC EARLY/LOCAL/META 多分支 + SCLC PCI 證據更新）BUG-26、27 |
| V2.8.10 | V1.6.10 | 2026-04-29 | 民眾版藥物按鈕改白底青字「藥物查詢」（跳出 header 背景明顯）BUG-25 |
| V2.8.9 | V1.6.9 | 2026-04-29 | 藥物入口從底部 banner 改到 header 按鈕（不再多佔一排）|
| V2.8.8 | V1.6.8 | 2026-04-29 | lung.html / patient.html 底部加快速工具 banner 連到 drugs.html（已被 V2.8.9 取代）|
| V2.8.7 | V1.6.7 | 2026-04-29 | edu 拆兩檔（edu-pro.html / edu-patient.html）民眾版掃 QR 看到的內容跟 patient.html 總覽頁一致 BUG-24 |

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

1. **GitHub Pages 部署實機驗證 V2.10.0** — 上線前必跑：(a) Q3 切「病理報告」按鈕，TNM 標籤變「病理 T/N/M」、底部變「病理分期 (pStage)」 (b) 同一組 TNM 值切 cTNM ↔ pTNM，總覽頁 stage 顯示在 `IIB` 與 `pIIB` 之間切換、treatment steps 也跟著變 (c) postOp + EARLY 不再出現「手術根除」步驟 (d) postOp + LOCAL 出現「切緣評估」「密集追蹤」 (e) QR 掃描 → edu-patient 顯示「病理分期 pIIB」+ 同款術後路徑
2. **Sela 比對院內指引術後輔助章節** — V2.10.0 新加的術後路徑（IB 高風險判定、ADAURA Osimertinib 3 年、ALINA Alectinib 2 年、IMpower010 Atezolizumab 條件、SCLC 術後 PCI 是否仍建議）需對照本院指引 v12 (2026)
3. **Sela 確認健保事審現況**：(a) Sotorasib (KRAS G12C) (b) Alectinib 術後鞏固 ALINA (c) Amivantamab 健保適應症 (d) Atezolizumab adjuvant IMpower010
4. **Sela 比對 V2.8.11+V2.9.0 兩版改的多分支治療路徑** — NSCLC EARLY 加術前免疫與 ALK 鞏固、META PDL1_HIGH 加 Pembrolizumab 單藥、SCLC PCI 改 MRI 監測、age/ecog 動態調整
5. **Sela 逐條 review drugs.html 的 ALL_DRUGS** — 28 種藥物資料
6. 新增第二個癌別（頭頸或食道）— 模板已穩定。**注意**：依 BUG-22 教訓分期邏輯不同；BUG-24 教訓拆 edu-pro/edu-patient；BUG-25 教訓並列按鈕分配視覺權重；BUG-26 教訓問答鎖屏 vs 閱讀解鎖；BUG-28 教訓個人化建議要套到 step 內容；BUG-30 教訓 stage axis 從一開始就要分 c/p 兩階段
7. 醫護版列印手冊樣板審視（自從 BUG-11 後沒再大改）
8. **DRUGS / buildPath 共用機制觀察**：patient.html 跟 edu-patient.html 兩處有同樣的 DRUGS、buildPath、且現在又加了 buildPostOpPath。三個地方要同步改的負擔越來越重；考慮抽 `lung/_drugs.js` + `lung/_path.js` 共用

---

## 九、一句話總結

V2.10.0 民眾版加病理期別模式（已手術切換）。Q3 加 stage-mode toggle 兩顆按鈕「影像/切片 vs 病理報告」，共用同一組 TNM 欄位但意義切換。`S.postOp=true` 時 buildPathRaw 分流到 `buildPostOpPath()`：跳過手術建議，直接走「術後輔助化療 + EGFR/ALK/Atezolizumab 鞏固 + 規律追蹤（前 2 年 q3-6m CT）」。stageDisplay 加 p 前綴（pIIB/p侷限型/pIVA），edu-patient 同步加 `po` schema 與 `buildPostOpPathFromData`。7 情境模擬全綠 + 對照組維持原行為。連續解了 Sela 兩個關聯 bug：(a) 病理期別填了還推臨床期別 (b) 已手術了還推手術。下版第一優先：上線實機驗證。
