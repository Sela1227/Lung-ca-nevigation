# Cancer Navigation V2.11.0 — 彰濱秀傳癌症中心

## V2.11.0 — 2026-05-08
**民眾版加 Q5 治療進度 + 總覽頁三區呈現（已完成 / 下一步 / 之後）**

修了 V2.10.0 個管師驗收測出的兩個合理性問題：
1. **postOp EARLY 跨期別不細分** — pIA1/pIA2/pIB/pIIB 全推同一組化療。但 IA 期復發風險低、多數情況觀察即可，warns 寫「IA 期通常觀察即可」放在 pIIB 病人總覽會造成矛盾
2. **看不出目前位置** — 同一張總覽頁給「剛開完刀」與「已做完化療等鞏固」病人看，所有 step 同等亮度，無法回答「我下一步該做什麼」

### Q5 治療進度頁（postOp 才出現）
6 顆 prog-btn 對應 6 種治療時序位置：

| 進度 | 對應 phase 進「下一步」區 |
|------|---------------------------|
| 剛開完刀 (just_op) | adjuvant_chemo |
| 正在做術後化療 (chemo) | adjuvant_chemo |
| 化療做完，等決定鞏固藥 (awaiting_consol) | consolidation |
| 正在用鞏固藥 (consol) | consolidation |
| 治療都完成，定期追蹤 (followup) | followup |
| 發現復發或惡化 (recurrence) | recurrence（走 META 邏輯）|

`S.txProgress` 存進度值，q4Needed 改成 postOp 一律 true（術後一定要 mut/brain 才能決定鞏固藥），流程改 6 頁、6 個 progress dots。

### 三區呈現（postOp + txProgress）

每個 step 加 `phase` 標記（surgery/adjuvant_chemo/consolidation/followup/recurrence）。`splitStepsByProgress(steps, txProgress)` 依 PROGRESS_DONE_PHASES + PROGRESS_NEXT_PHASE 分到三區：

- **✓ 已完成**（淡色 + 劃線 + ✓ 取代序號）
- **➜ 下一步**（青底 + box-shadow 醒目）
- **⋯ 之後的選擇**（虛線邊框 + 淡色）

### IA 期細分

`isIA = /^IA/.test(stage)` → 走觀察為主分支（不推化療、標靶非主流）；IB+/II 走原本「化療 + 標靶/免疫鞏固」分支。warns 也跟著分流：IA 強調「依時程回診追蹤」，IB+/II 強調「請務必完成 4 個療程術後輔助化療」。

### 復發路徑

`buildRecurrencePath`：暫存 stageCat→META 跑 `buildPathRawCore()`、加開頭「之前治療已完成」surgery done step、所有後續 step 標 phase=recurrence、結尾加 followup step。三區呈現時 done=[前次治療]、next=[META 全部 step]、future=[追蹤]。

### edu-patient 同步

`buildPostOpPathFromData(t, st, m, brain, stage)` 加 stage 參數（從 d.s 拿）；`buildPathRawFromData` 加 recurrence 分流；`buildPathRawCoreFromData` 拆出；加 PROGRESS_LABEL/splitStepsByProgress/renderTreatmentSteps3Section；hero meta 加「進度：剛開完刀/化療中/...」。掃 QR 看到的內容跟 patient.html 總覽頁一致。

### 測試

9 個情境模擬全綠：

| 情境 | done / next / future |
|------|----------------------|
| A1 pIA1 just_op | surgery / IA 規律追蹤 / 標靶非主流, 規律追蹤 |
| A2 pIA1 EGFR(+) awaiting_consol | surgery, IA 觀察 / 標靶非主流 / 規律追蹤 |
| A3 pIIB EGFR(+) consol | surgery, 化療 / Osi+ALK+Atezo 鞏固 / 規律追蹤 |
| A4 pIIIA EGFR(+) recurrence | 前次治療 / META EGFR 4 step + followup |
| A5 pIIB followup | 全部 5 step / 規律追蹤 / — |
| A6 SCLC pLimited chemo | surgery / Cisplatin+Etoposide / 縱膈放療, PCI, 追蹤 |
| A7 cIIIA 對照組 | 平鋪 4 step（無三區）|
| A8 pIVA 寡轉移 just_op | surgery / 全身性治療 / 依基因, 影像追蹤 |
| A9 NSCLC-SQ pIIB chemo | surgery / 鱗狀化療 / Atezo, 規律追蹤（鱗狀無 EGFR/ALK）|

---

## V2.10.0 — 2026-05-08
**民眾版加病理期別模式（已手術切換）**

解了 Sela 兩個關聯 bug：
1. 有病理期別後民眾版仍要求填臨床期別 — 其實是「沒地方填病理期別」，民眾只能勉強用 cTNM 欄位
2. 有病理期別代表已開過刀，可是路徑還是停在「建議手術切除」步驟

### Q3 加 stage-mode toggle
Q3 分期頁頂端加兩顆切換按鈕：
- **影像 / 切片**（尚未手術）— 預設選項，行為跟 V2.9.5 一致
- **病理報告**（已手術）— 切下去 `S.postOp=true`

兩種模式共用同一組 TNM 欄位但意義切換。視覺上：
- cd-step 顏色變 teal-d（病理模式暗示）
- TNM 標籤從「TNM」變「病理 TNM」、底部從「推算分期」變「病理分期 (pStage)」
- stageDisplay 加 p 前綴：`pIIB` / `p侷限型` / `pIVA`

### 新增 `buildPostOpPath()` 術後路徑引擎
buildPathRaw 開頭分流：postOp=true 且 stageCat 在 EARLY/LOCAL/META 時呼叫術後分支：

| 情境 | pwTxt | 主要 steps |
|------|-------|-----------|
| NSCLC EARLY postOp | 術後輔助治療 + 規律追蹤 | 術後輔助化療 → EGFR Osimertinib (3yr) → ALK Alectinib (2yr) → Atezolizumab (PD-L1≥1%) → 規律追蹤 q3-6m CT |
| NSCLC LOCAL postOp | 術後輔助化療 + 標靶/免疫鞏固 + 密集追蹤 | 術後輔助化療 → 切緣 (+) 加術後放療 → EGFR/ALK/Atezo 鞏固 → 規律追蹤 q3m CT |
| NSCLC META postOp | 已切除原發/寡轉移，仍以全身性治療為主 | 寡轉移認證 → 依基因/PD-L1 一線 → q2-3m 影像追蹤 |
| SCLC postOp | 術後輔助化療 + 鞏固 + 規律追蹤 | Cisplatin/Etoposide → N(+) 縱膈放療 → PCI/MRI 監測 → 規律追蹤 |

**規律追蹤 step 明確列頻率**：「前 2 年每 3-6 個月 CT、3-5 年每 6 個月、5 年後每年」(EARLY)、「前 2 年每 3 個月」(LOCAL/SCLC)。給民眾具體時間軸概念。

### edu-patient 同步
- schema 加 `po` 欄位（0/1）
- `buildPathRawFromData` 開頭同樣分流到 `buildPostOpPathFromData`
- hero 「分期」標籤改「病理分期」、stage 加 p 前綴

### 測試
跑 7 個情境（NSCLC_NS/SQ × EARLY/LOCAL/META × postOp + SCLC postOp），對照組 cTNM EARLY 維持原「手術切除為主」全綠：

| 情境 | stageDisplay | pwTxt | 第 1 步 |
|------|--------------|-------|--------|
| cTNM IA1 EARLY | IA1 | 手術切除為主 | 手術根除：肺葉切除 |
| pTNM IA1 EARLY | pIA1 | 術後輔助治療 + 規律追蹤 | 術後輔助化療 |
| pTNM IIIA LOCAL | pIIIA | 術後輔助化療 + 標靶/免疫鞏固 + 密集追蹤 | 術後輔助化療 |
| pTNM IVA META | pIVA | 已切除原發/寡轉移，仍以全身性治療為主 | 寡轉移切除後仍須全身性治療 |
| SCLC pTNM 侷限 | p侷限型 | 術後輔助化療 + 鞏固 + 規律追蹤 | Cisplatin + Etoposide |

- **模組**：lung V1.7.5 → V1.8.0；系統 V2.9.5 → V2.10.0
- **BUG-30** 完整記錄於 CLAUDE.md

## V2.9.5 — 2026-04-30
**藥物頁拆醫護版/民眾版 + 個人化推薦**
- **`drugs.html` 改名 `drugs-pro.html`（醫護版）+ 強化**：
  - 新增 4 個進階欄位：
    - **NCCN line 對應**：「NSCLC IV EGFR(+) Cat 1 一線首選」
    - **健保事審條文**：「9.5.1 / 9.5.2（事審）」（編號為估算，需 Sela 對照藥劑科確認）
    - **必試藥/限制**：「第二線需 T790M(+)」「限 EGFR L858R + 腦轉移」
    - **cross-reference**：「在以下情境會用到 (3)」+ chip tag 列出 stage（「NSCLC EARLY」「NSCLC IV EGFR」等）
  - 28 種藥物全套標註（含新增 Amivantamab）
- **新建 `drugs-patient.html`（民眾版）**：
  - 每藥 4 區塊：中英藥名 / 健保大 badge / **誰會用到** / **用途（一句話）** / **常見副作用**
  - 篩選 chips：給付（全部/健保/自費）+ 類型（NSCLC 非鱗/鱗狀/SCLC）
  - 青綠色系與 patient.html 一致
- **個人化推薦 ⭐**：使用者填完 patient.html 流程後，總覽頁底部出現「看適合您狀況的藥物」漸層按鈕，點擊帶 `?type=X&stage=Y&mut=Z` 到 drugs-patient.html
  - drugs-patient 偵測到 query 後顯示「已依您填寫的狀況優先顯示」banner
  - 符合的藥物排在最上面、有「符合您的狀況」標籤
  - matchKey 機制支援 `type:stage:mut` 完整匹配 + `type:stage:` fallback（化療通用藥）
- **portal 入口改成兩個**：醫護版（霧藍）+ 民眾版（青綠）並排
- **lung.html topbar / patient.html header** 各自連到對應版本
- **6 個情境模擬全 work**：NSCLC EGFR / PDL1_HIGH / PDL1_LOW / LOCAL / EARLY EGFR / SCLC 各 stage
- 1152/1152 回歸全綠
- **模組**：lung V1.7.4 → V1.7.5；系統 V2.9.4 → V2.9.5

## V2.9.4 — 2026-04-30
**手機版 Q-page 鎖屏 bug 大盤點與修復**
- Sela 回報：手機版 TNM 詳細模式（進階 9 欄）顯示不完全、無法拉動
- **根因**：所有 Q1-Q4 都鎖在 `100dvh` + `.cd { overflow:hidden }`，桌機 OK，手機內容超出時被切掉看不見也無法捲
- **盤點 + 修復 7 個手機 bug**：
  - **Bug A**：TNM 進階 T 軸 9 欄在 360px 手機按鈕擠到 23px 寬，文字「T1mi」「T2a」看不到 → 加 `@media(max-width:480px)`：`tnm-btns[data-cols="9"]` 與 `[data-cols="5"]` 改 4 欄自動 wrap；tnm-row 改 `flex-wrap:wrap` 讓 letter+meta 一排、按鈕另起一排
  - **Bug B**：手機所有 Q-page 內容超出時被 overflow:hidden 切掉 → 新增 `body.questioning` class，showPage 進 Q1-Q4 時加 / 進總覽時移除；CSS `@media(max-width:640px)` 下這個 class 解開 body / main / page / cd 的 overflow，actbar 改 sticky 貼底
  - **Bug C**：iOS Safari 對 input font-size <16px 自動 zoom（Q1 病歷號/姓名 input 點下去整個畫面爆） → 改 16px，桌機（≥481px）才壓回 13.5px
  - **Bug D**：viewport `maximum-scale=1` 阻止使用者放大頁面（accessibility 問題，視力不佳長者看不清字） → 移除
  - **Bug E**：actbar 沒處理 iOS safe-area-inset-bottom，iPhone 全螢幕底部會被 home indicator 蓋到 → 加 `padding-bottom: calc(8px + env(safe-area-inset-bottom))`，height 改 min-height 避免被推爆
  - **Bug F**：sclc-grid 用 `grid-template-rows: 1fr 1fr` 在解鎖（flex:none）模式變 0 高度 → 手機加 `grid-template-rows: auto auto`
  - **Bug G**：input 沒設 scroll-margin-bottom，手機點輸入框時鍵盤遮住底下 → 加 80px scroll-margin-bottom，input focus 時自動捲入視窗
- showPage 進 Q 頁也 `scrollTo({top:0})` 確保切頁不殘留前頁的捲動位置
- **桌機行為完全不變**（所有改動都包在 `@media(max-width:640px)` 或 `@media(max-width:480px)`）
- 1152/1152 回歸全綠 + 4/4 ajcc
- **模組**：lung V1.7.3 → V1.7.4；系統 V2.9.3 → V2.9.4

## V2.9.3 — 2026-04-30
**民眾版說明文字精簡：刪客套、瘦身**
- Sela 反映「劑量與療程由放射腫瘤科醫師依您病情決定」這類客套話可刪、其他說明也太囉唆
- **刪客套話**：`由放射腫瘤科醫師依您病情決定` / `由放射腫瘤科醫師與您討論` / `由主治醫師個別評估` / `需與主治醫師確認` / `需與醫師討論` 全砍
- **DRUGS note 瘦身**：
  - EGFR：`五藥擇一不互換。Dacomitinib 限無腦轉移者。` → `五藥擇一。Dacomitinib 限無腦轉移。`
  - CONSOLIDATION：`Stage III 同步化放療後無惡化、PD-L1≥1%，健保事審，至多 12 個月（PACIFIC 模式）` → `限 PD-L1 ≥1%，至多 12 個月。`
  - SCLC_LS_CCRT：刪除整段「同步化放療為主。治療反應佳者可與主治醫師討論預防性全腦照射」（PCI 已單獨成 step 不需重複）
- **試驗代號刪除**（民眾不認得）：`PACIFIC 模式` / `ADAURA 模式` / `ALINA 模式` / `KEYNOTE-024` / `MARIPOSA-2` / `Takahashi 2017` / `CheckMate-816` 全砍，行為條件保留
- **applyAgeEcog 也精簡**：
  - `您 ≥70 歲：化療建議改 Carboplatin（毒性較低）` → `≥70 歲：化療建議改 Carboplatin`
  - `您填寫 PS 2（常隱受症狀）：化療多以單藥優先；同步化放療可改序貫；免疫單藥需謹慎` → `PS 2：化療多以單藥；同步化放療可改序貫`
- **SCLC 擴散期 warns 也砍掉一條**：`PS 3-4 因癌症導致：化療±放療；非癌症導致：以支持性療法為主`（applyAgeEcog 已會處理 PS 3-4）
- 1152/1152 回歸 + 客套話殘餘 0 處
- **模組**：lung V1.7.2 → V1.7.3；系統 V2.9.2 → V2.9.3

## V2.9.2 — 2026-04-30
**portal.html UI 重構：清爽收斂**
- Sela 截圖反映 V2.9.1 portal 排版淩亂、太多大留白：header 太厚、role-card padding 過大、quick-tools 用分隔線斷得太兇、footer 浮在底部
- **header 收縮**：padding 從 `48px / 64px` 改 `24px / 16px`，logo icon 從 56px → 42px、字級從 26px → 22px、subtitle 從 12px → 10.5px
  - 桌機橫排（hospital name + subtitle 並排於 logo 右側）
  - 手機直排（圖案在上，文字置中）
- **role 卡片瘦身**：padding 從 `28px / 20px` 改 `16px / 14px`，icon 從 64px → 46px，role-sub 從 2 行改成 1 行（用「·」分隔）
  - 高度從 ~140px → ~90px
- **quick-tools 改成「同節奏」section**：移除虛線分隔 + `margin-top:32px`，改用跟 role-section / cancer-grid 同樣的 section-title 模式（左側 dot + 標題）
- **footer 緊貼+一行**：原本 `padding:24px`+ 兩行文字，改 `padding:14px` 用「·」分隔合成一行
- **設計原則**：每個區塊 16px gap、`.main` 用 flexbox+gap 統一節奏，視覺斷點更清楚
- **整體高度**：桌機從 ~600px → ~405px（壓縮 32%），不再有「上半部空白下半部擠」的失衡感
- 模組：lung V1.7.1 → V1.7.2；系統 V2.9.1 → V2.9.2

## V2.9.1 — 2026-04-29
**民眾版字樣全面平民化 + 隱藏放療劑量**
- Sela 反映民眾版有些字太醫學術語：
  - **「RT」 → 「放射線治療」**（藥物清單裡的 z 中文名與 step note 都換）
  - **「CCRT」 → 「同步化放療」**（titles、notes、warns、pwTxt 全換）
  - **「WBRT」「SRS」 → 「全腦放射線治療」「立體定位放射線治療」**
  - **「SBRT」保留**（旁邊已有全稱「立體定位放射線治療」，醫護常用縮寫）
- **放療劑量全隱藏**（由主治跟病人溝通就好）：
  - 移除「2 Gy」「60-66 Gy」「25-30 Gy」「25 Gy」等劑量描述
  - 改成「劑量與療程由放射腫瘤科醫師依您病情決定」「由放射腫瘤科醫師與您討論」
- **patient.html + edu-patient.html 同步**（buildPathRaw / DRUGS / applyAgeEcog 整段更新）
- **醫護版 lung.html 與 edu-pro.html 不動**（醫護需要看細節）
- 1536/1536 殘餘掃描全綠（沒有任何 CCRT/Gy/RT 漏網）+ 9600/9600 組合 + 14/14 ajcc
- **模組**：lung V1.7.0 → V1.7.1；系統 V2.9.0 → V2.9.1

## V2.9.0 — 2026-04-29
**民眾版加 Q1「基本資料」頁（年齡 + ECOG）+ buildPath 依 age/ecog 動態調整**
- **新增 Q1 基本資料頁**：原本散在各頁的姓名/病歷號收歸到此，加入年齡（<70 / ≥70）與 ECOG（PS 0-1 / 2 / 3-4 三選），全部選填
- **流程改 5 頁**：Q1 基本 → Q2 類型 → Q3 分期 → Q4 基因/腦 → 總覽（progress dots 從 4 點改 5 點）
- **ECOG 民眾化定義**：
  - PS 0-1：「沒什麼影響」（完全或大部分時間能照常活動）
  - PS 2：「常隱受症狀」（有症狀但白天大半時間仍能起身活動）
  - PS 3-4：「安床休息為主」（大部分時間躺床或需人照顧）
- **buildPath 依 age/ecog 動態調整**：
  - 高齡（≥70）：含化療的 step 自動加註「您 ≥70 歲：化療建議改 Carboplatin（毒性較低）」
  - PS 2：含 CCRT 的 step 加註「PS 2：CCRT 毒性風險高，改序貫」
  - PS 3-4 + LOCAL/META：pwTxt 整個改成「以症狀控制與支持性療法為主」
  - 各情境 warns 開頭新增「您填寫的狀況」提示
- **Q1 永遠可進**（全部選填，使用者連跳兩下也能跑完流程）
- **edu schema 加 a/e 欄位**，民眾掃 QR 落地 edu-patient.html 也會看到 age/ecog 個人化建議
- **9600/9600 回歸全綠**（多了 age × ecog 維度 = 5×4×10×4×3×4 = 9600 組合）+ 14/14 ajcc
- 模組：lung V1.6.11 → V1.7.0；系統 V2.8.11 → V2.9.0

## V2.8.11 — 2026-04-29
**手機版總覽頁解鎖捲動 + 治療路徑全面 review + 返回按鈕語意精準化**
- **手機版總覽頁解鎖**：原本 patient.html `body.summary { overflow:auto }`，hero+drugs+strip 不再被擠成一坨。Q1/Q2/Q3 仍鎖屏第一屏。actbar 改成 `position:sticky; bottom:0` 讓「重新查詢」按鈕一直在底部
- **返回按鈕語意精準化**：
  - Q2/Q3 顯示「上一題」（同層退一題）
  - 總覽頁顯示「返回」（跨層回到問答流程）
  - 配合 V2.7.0 起的「選完自動跳下一題」更直觀
- **治療路徑逐條 review（NSCLC + SCLC 全分支）**：
  - **NSCLC 早期**：+ 術前化療免疫（CheckMate-816 模式）、+ ALK 術後鞏固（ALINA, Alectinib 2 年）、warns 從 2 條擴成 3 條（高風險因子、化療調整、術後基因檢測）
  - **NSCLC 局晚**：+ 可切除 IIIA 描述更精準、+ IIIA 切除術後 EGFR/ALK 標靶鞏固、warns 強調基因檢測影響鞏固選擇
  - **NSCLC META EGFR**：+ Amivantamab + 化療（MARIPOSA-2 後線）、二線改寫成「抗藥機制檢測」更實際
  - **NSCLC META PDL1_HIGH**：+ Pembrolizumab 單藥首選（KEYNOTE-024，PD-L1 ≥50% 可不加化療）；合併化療列為「腫瘤負荷大時」次選
  - **NSCLC META KRAS**：警示改成「健保給付狀態請確認最新事審條件」（健保條件變動快），+ Adagrasib 提及但台灣未上市
  - **SCLC Extensive (no brain)**：PCI 改「MRI 監測 或 PCI」（Takahashi 2017 證據後 PCI 證據已弱化）
  - **SCLC Extensive (brain+)**：腦轉移處理改「依症狀決定放療時機」（無症狀小病灶可先化療同時 MRI 監測）
- 814/814 回歸全綠
- **模組**：lung V1.6.10 → V1.6.11；系統 V2.8.10 → V2.8.11

## V2.8.10 — 2026-04-29
**民眾版藥物按鈕改成白底青字「藥物查詢」（明顯）**
- Sela 反映 V2.8.9 的藥物 icon「超小超不明顯」— 因為沿用 `.home-btn` 半透明灰底+14px icon，民眾在深綠 header 上看不出那是按鈕
- 改用新 `.drug-btn` 樣式：
  - 白底 + 青色文字（`var(--teal-d)` #115e59）跳出 header 深綠背景
  - `box-shadow: 0 2px 6px rgba(0,0,0,.12)` 給輕微浮起感
  - 文字「藥物查詢」+ icon
  - hover 時 `translateY(-1px)` + 加深陰影
  - 小手機（<380px）只顯示 icon 省空間
- **設計原則**：藥物入口比 home 更該被看到（民眾版核心延伸功能），所以做得跳出背景；而 home-btn 維持低調（萬一誤點會跳走）
- 模組：lung V1.6.9 → V1.6.10；系統 V2.8.9 → V2.8.10
- 814/814 回歸全綠

## V2.8.9 — 2026-04-29
**藥物入口從底部 banner 改到 header 按鈕**
- Sela 反映 V2.8.8 的底部 banner 多佔一排空間（破壞鎖屏設計），改到 header 比較順眼
- **lung.html**：topbar 加 `<a class="topbar-btn outline" href="drugs.html">藥物</a>` 按鈕，跟「列印」「新病人」並列；移除底部 tools-bar；`.app` 復原為 `height:100dvh` 鎖屏
- **patient.html**：hdr 右側拆出 `.hdr-r` 容器，內含「藥物」icon 按鈕（樣式同 `.home-btn`，做在 progress dots 旁邊）；移除底部 tools-bar 與 `.shell` 包覆；body 復原為 `height:100dvh + overflow:hidden` 鎖屏
- **設計原則**：
  - header icon 按鈕不佔額外空間，跟 home 按鈕視覺對稱
  - 列印時跟其他按鈕一起被 `.no-print` 隱藏（lung）/ 不會列印到（patient print rule 已包含 `.home-btn`）
  - 連結同層 `drugs.html`
- 814/814 回歸全綠
- **模組**：lung V1.6.8 → V1.6.9；系統 V2.8.8 → V2.8.9

## V2.8.8 — 2026-04-29
**lung.html / patient.html 底部加快速工具 banner 連到 drugs.html**
- Sela 要把 portal 的「快速工具」入口也放到醫護版與民眾版底下
- **lung.html**：底部加 `.tools-bar` banner，霧藍漸層配色（呼應 sidebar），位於 `.app` 之後，需向下捲一點才看到（避免擾亂操作流程）。`.app` 改 `min-height:100dvh; height:auto`
- **patient.html**：把 hdr+main+actbar 包進新 `.shell` 容器（仍是 `100dvh + overflow:hidden` 鎖屏第一屏），`.shell` 之後加 `.tools-bar`（青綠漸層配色，呼應 patient 主題）。需向下捲到第二屏才看到
- **設計原則**：
  - 不擾亂主流程（鎖屏行為保留）
  - 只在第二屏顯示，需要的人會找到，不需要的人不被打擾
  - 列印時隱藏（`@media print { .tools-bar{display:none} }`）
  - 連結直接同層 `drugs.html`（lung/ 目錄下）
- 814/814 回歸全綠
- **模組**：lung V1.6.7 → V1.6.8；系統 V2.8.7 → V2.8.8

## V2.8.7 — 2026-04-29
**edu 拆成醫/民兩檔，民眾版掃 QR 看到的內容跟 patient.html 一致**
- Sela 回報：民眾版掃 QR 進去看到「化放療 ± 手術 ± 免疫/標靶」這種粗略一行，跟 patient.html 總覽頁的詳細藥物清單對不上 — 因為兩邊都用同一個 edu.html，但 edu.html 是醫護版簡化邏輯
- **拆成兩個獨立檔**：
  - `lung/edu-pro.html`（原 edu.html 改名）：醫護版，加詳細 `getDrugDetail()`，每個 step 顯示完整藥名 + 健保事審條件 + note；含 SCLC + brainMet 處理
  - `lung/edu-patient.html`（新建）：**民眾版完整 buildPath**，把 patient.html 的 `DRUGS` + `buildPathFromData()` 整套搬進去，所以掃 QR 看到的內容跟 patient 總覽頁一模一樣
- **lung.html → edu-pro.html、patient.html → edu-patient.html**：兩邊各自的 EDU_BASE_URL 指對應檔
- **base64 schema 兼容**：兩邊 schema 一致（n/t/s/m/b/tm/c/d/co），edu-patient.html 內部 `TYPE_CODE_TO_FULL` + `deriveStageCat()` 把 schema 轉成 patient state 後呼叫 `buildPathFromData()`
- **6 個 round-trip 情境驗證**全 work：NSCLC IV EGFR / SCLC Limited no-brain / SCLC Extensive brain+ / SCLC Extensive no-brain / NSCLC IIIA / NSCLC IB
- **回歸測試 814/814 全綠**
- **模組**：lung V1.6.6 → V1.6.7；系統 V2.8.6 → V2.8.7

## V2.8.6 — 2026-04-29
**民眾版 QR 改成 lung.html 同款模板（URL + base64）**
- **Sela 截圖回報**：V2.8.5 民眾版 QR 又出現「QR 產生失敗：qrcode is not defined」— `cdn.jsdelivr.net/npm/qrcode-generator` 在使用者環境沒載入到（CDN 不可達或被擋）
- **核心修復**：抄醫護版 lung.html 的 QR 模板：
  - lib 換回 `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0`（lung.html 已驗證可達）
  - QR 內容改成 URL（`edu.html#base64_json`），不再塞中文純文字
  - **payload 純 ASCII** → qrcodejs 中文 fail bug 自動避開（V2.8.3 BUG-19 那條坑用第二種方式繞過）
- **edu.html 加 SCLC + brainMet 處理**：民眾掃 QR 落在 edu.html，會依 type/stage/brainMet 顯示對應內容
  - SCLC 顯示「侷限型 / 擴散型」而非 NSCLC stage
  - brainMet 影響 PCI 與免疫使用建議（與 patient.html 邏輯一致）
- **schema 新增**：`b` (brainMet) / `co` (病歷號)
- **modal 顯示**：QR 圖片用 URL，下方 `qr-meta` 仍顯示中文摘要給使用者看
- **817/817 自動化測試全綠**：800 組合 + 14 ajcc + 3 個 QR URL 純 ASCII 驗證
- **6 個 QR 掃描情境模擬**全部產生臨床上正確的內容差異（NSCLC IIIA EGFR / SCLC 4 種 brainMet 組合）
- **模組**：lung V1.6.5 → V1.6.6；系統 V2.8.5 → V2.8.6

## V2.8.5 — 2026-04-29
**民眾版 SCLC 改照常用的局限/擴散二段式設計**
- **Q2 加 SCLC 兩段式**：選 SCLC 後，Q2 預設顯示「侷限型 (Limited) / 擴散型 (Extensive)」兩個大按鈕；下方有「改用詳細 TNM 輸入」連結，可切回完整 TNM 流程
- **Q3 SCLC 變成腦/脊髓轉移問題**：基因/PD-L1 對 SCLC 沒意義，改成「無腦/脊髓轉移 / 有腦/脊髓轉移 / 不確定」三選
- **brainMet 影響治療建議**：
  - **侷限型 + 有腦轉移** → 不再做預防性全腦照射 (PCI)，改治療性放療；warns 補上「屬於擴散期，治療策略要修正」
  - **擴散型 + 無腦轉移** → 化療 + 免疫（健保 ICI 9.69 規範可用）
  - **擴散型 + 有腦轉移** → 化療為主，免疫不適用（健保限「無腦/脊髓轉移」），加上腦放療步驟
  - **擴散型 + 不確定** → 提示完成腦 MRI 後再決定免疫
- **保留 TNM 模式 fallback**：SCLC 也可改用 TNM 詳細輸入（M0→侷限、M1→擴散），對熟悉 TNM 的使用者方便
- **stageDisplay**：SCLC 直接顯示「侷限型 / 擴散型」而非 NSCLC 的 stage 標籤
- **827/827 自動化測試全綠**（含 800 個組合 × brainMet 維度 + 5 個 SCLC 行為情境 + 4 個 SCLC 導覽）
- **模組**：lung V1.6.4 → V1.6.5；系統 V2.8.4 → V2.8.5

## V2.8.4 — 2026-04-29
**portal SVG 重設計 + 全組合 state 殘留修復**
- **portal 8 個癌別圖示全改 inline SVG**：每個都是器官解剖意象（24×24, currentColor stroke 1.6, round caps）
  - 肺癌：兩瓣肺 + 氣管分支 / 乳癌：圓形 + 乳腺管 / 大腸：彎曲腸道 / 食道：垂直管狀
  - 頭頸：側面頭頸輪廓 / 肝：不對稱兩葉 / 攝護腺：倒三角 / 膀胱：球囊
  - 風格與 lung.html 的 NORDIC_ICONS 一致
- **portal 完全脫離 Font Awesome**：hospital / role / cancer / badge 圖示全 inline SVG，刪掉 FA CSS 引用，首屏載入更快
- **跑遍 200 個組合（type × stageCat × mut）找 bug**：結構性 0 bug；找到 4 個 state 殘留問題：
  - **Bug A**：`setStageUnknown` 內部雙重 set stageCat（recomputeStage 後再覆寫）— 重構乾淨
  - **Bug B**：改 type 沒清下游（mut/TNM 殘留汙染 QR payload）— 加 reset
  - **Bug C**：改 TNM 從 META → EARLY 時 `S.mut` 殘留（雖然 buildPath 不用，但 QR 會帶錯資訊）— `recomputeStage` 加 mutNeeded 檢查
  - **Bug D（追加）**：`setStageUnknown` 走 EARLY fallback 沒清 mut — 補上
- **218/218 自動化測試全綠**：200 組合 + 14 ajcc + 4 state-residue
- **模組**：lung V1.6.3 → V1.6.4；系統 V2.8.3 → V2.8.4

## V2.8.3 — 2026-04-29
**QR 修復 + 健保藥物總整理頁**
- **QR 產生失敗修復**：之前用 `qrcodejs@1.0.0`（davidshimjs），中文超過某長度就「QR 產生失敗」（lib 內部沒處理多位元組）
  - 換成 `qrcode-generator@2.0.4`（kazuhikoarase）
  - 中文先 `unescape(encodeURIComponent(text))` 轉 UTF-8 byte string，再用 Byte mode 編碼
  - 改用 `createImgTag()` 而非 canvas（更兼容）
- **新增 `lung/drugs.html`**：健保肺癌藥物總整理頁
  - 28 種藥物全收（標靶 / 免疫 / 化療 / 其他）
  - 即時搜尋（中英文藥名 + 適應症 + 規範文字）
  - 篩選 chips：類別 / 健保 vs 自費
  - 每張卡顯示：英中文名 / 標籤 badge / 適應症 / 線數 / 健保規範摘要
  - 資料來源：健保第 9 章 + 附件 2 修訂對照表 + lung.html 既有 DRUGS 物件
- **portal 加「快速工具」入口**：在角色選擇下方新增區塊，連到 drugs.html
- **模組**：lung V1.6.2 → V1.6.3；系統 V2.8.2 → V2.8.3

## V2.8.2 — 2026-04-29
**民眾版補回照護團隊選擇 + QR 識別碼**
- **照護團隊改可選**：3 科（外科 / 胸內或血腫擇一 / 放腫）整合 lung.html 的 `CFG.team.depts` 同步醫師名單。預設第 1 科展開讓使用者引導動作，選了之後該行收合並顯示「胸腔外科：李佳穎」
- **QR 識別碼補回**：改成 hero 右上的小按鈕，點開全屏 modal 顯示 QR + 內容明細
- QR payload 帶完整資訊：`肺癌路徑 | 病歷號 | 姓名 | Stage | TNM | 突變 | 治療方向 | 各科主治`（哪科有選哪科入列）
- QR 預設「無條件可生」（民眾不一定回診過、不該強制選醫師才能用 QR）
- **不增高總覽頁**：策略是「漸進揭露」— 醫師選擇用同一行展開 / 摺疊；QR 用 modal
- 選醫師為**選填**：不選不影響其他功能，QR 也照樣能生（payload 會省略醫師欄）
- **模組**：lung V1.6.1 → V1.6.2（僅版號）；系統 V2.8.1 → V2.8.2

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
