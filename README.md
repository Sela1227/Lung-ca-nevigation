# Cancer Navigation V3.3.1 — 彰濱秀傳癌症中心

## V3.3.1 — 2026-07-02
**修民眾版「返回有時整頁跳走」— 接 History API**

### 診斷過程

Sela 回報民眾版「導航/返回有時整個跳到不知道哪頁」。

先建**導航模擬 harness** 窮舉:4/5/6 頁三型態 × 前進到底 × 返回到底 × 中途改期別 × 載入紀錄 × 開關 overlay → **頁內 JS 導航邏輯全部正確**(goNext/goPrev/loadRecord 的 stepIdx 與顯示頁完全同步,返回鏈都是前進鏈的反向)。

**模擬測不出 bug,反而是最強線索**:既然頁內邏輯對,「整頁跳走」就不在 JS 導航這層,而在瀏覽器層級。

### 真兇

民眾版是單頁 SPA(JS 切 .page),但**沒接 History API**。使用者按手機/瀏覽器的「返回鍵、返回手勢」→ 瀏覽器直接離開 patient.html 回 portal,使用者以為按的是「上一題」→ 不預期整頁跳走。這解釋了「有時」(用頁面按鈕沒事、用系統返回就跳走)。

### 修法

`initBackButton`:`history.pushState` 墊一筆 + `popstate` 攔截:
- 紀錄 overlay / QR 彈窗開著 → 先關(不離開)
- Q2-Q5 / 總覽 → 轉成 goPrev(等同「上一題」)
- 只有 Q1(入口)→ 放行離開回 portal

每次攔截後補 pushState,形成「持續攔截直到 Q1」。

### 兩條教訓(BUG-52)

1. **模擬測不出 bug 本身是強線索** — 代表問題不在你測的那層。頁內導航窮舉全過,反而證明在更上層(瀏覽器 history)。排除法跟找到一樣有價值。
2. **任何用 JS 切畫面的 SPA,第一天就該接 History API** — 畫面會切換 + URL 不變 = 返回鍵預期會落空。

### 模組版號

lung **V1.13.0 → V1.13.1**,系統版 V3.3.0 → V3.3.1。

⚠️ **實機驗證重點**:History API 攔返回鍵只有真機/真返回鍵測得準 — Q 流程中按手機返回=上一題、Q1 返回才離開、overlay 開著返回先關。

---

## V3.3.0 — 2026-07-02
**民眾版紀錄可「載入 → 修改 → 再次儲存」**（個管師用）

之前(V3.2.0)紀錄只能看不能改。這版讓個管師能把存過的查詢叫回來、改一改、再存回同一筆。

### 三塊工程

1. **紀錄卡片可點** → `loadRecord(id)`:把該筆填回 S + `restoreAllUI()` 回填所有 Q 頁 UI → 進總覽頁看載入結果
2. **`pdbEditId` 綁定正在編輯哪筆**:`saveQuery` 有 editId 就更新(非新增),總覽頁按鈕文字對應變「更新這筆紀錄」
3. **restart 清 pdbEditId**:重新查詢 = 新的一筆

### 先踩到的坑:saveQuery 沒存 t/n/m

V3.2.0 的 saveQuery 只存 stage/stageCat(算出來的結果),沒存 t/n/m(原始選擇)。載入時 TNM 按鈕無從回填 → 先補存 t/n/m。

**教訓:存檔要存「能還原 UI 的最小完整集」,不是只存「算出來的結果」**。stage 是 t/n/m 算出來的,只存 stage 能顯示不能還原選擇。

### restoreAllUI 的難點

- **Q1 三組都用 `.age-btn`**(age/hbv/catastrophic)且 hbv/catastrophic 都有 yes/no → 用 `[onclick^="pickHbv"]` 屬性選擇器精準定位,不靠 data-val(會混)
- **Q3 TNM** 要判斷值在簡易組還進階組(找不到簡易組就 tnmAdv=true 切進階顯示),再複用 applyQ2Mode / applyPostOpVisuals / recomputeStage 讓衍生 UI 同步

### 驗證

fake-indexeddb 測完整循環:存(綁 id)→ 載入改 mut/stage 再存(**仍 1 筆＝更新**)→ 清 editId 存新(2 筆＝新增)。全綠。

### 三條教訓(BUG-51)

1. **存檔要存「能還原 UI 的最小完整集」** — 不是只存算出來的結果。
2. **回填 UI 是清空 UI 的鏡像** — restart↔restoreAllUI 要對稱維護(同 BUG-46「兩處要同步」家族)。
3. **onclick 屬性選擇器 `[onclick^="fnName"]` 是「同 class 不同用途按鈕」的精準定位法**。

### 模組版號

lung **V1.12.1 → V1.13.0**(新功能進位),系統版 V3.2.1 → V3.3.0。

⚠️ **實機驗證重點**:點紀錄 → 總覽顯示對 → 退 Q 頁看 TNM/mut/年齡回填對(尤其 TNM 進階值)→ 改後按「更新這筆紀錄」→ 確認是更新同一筆不是多一筆。

---

## V3.2.1 — 2026-07-02
**紀錄頁改全屏獨立 overlay**（修 V3.2.0 紀錄頁跟查詢流程混在一起）

### 問題

Sela 截圖回報 V3.2.0 紀錄頁「跟病人流程混在一起」— 底部殘留「上一題/下一題」actbar、頂部殘留查詢進度點。

### 原因

V3.2.0 把紀錄頁做成 `.page` 塞在查詢流程的 main 容器裡。但 actbar(上一題/下一題)和 topbar 進度點是**全域元件、不隨 page 切換隱藏**,所以紀錄頁「寄生」在查詢框架中,兩個查詢專用元件殘留。

### 修法

紀錄頁改「全屏獨立 overlay」:
- `#p-records{position:fixed;inset:0;z-index:200}` 蓋過 topbar+actbar,比照既有 qr-modal 作法
- 拿掉 `class="page"` 脫離 page 機制
- openRecords 加 `.open` + 鎖背景捲動
- closeRecords 只關 overlay,**不再 showPage(0) 硬回 Q1** — 底下查詢流程原封不動,關掉回到開啟前的頁面

### 兩條教訓(BUG-50)

1. **「獨立頁面」的正解是 fixed overlay 蓋一切,不是 .page 塞進流程容器** — 新頁面若不該有主框架的東西(actbar/進度點),就別共用主容器。
2. **同類問題會分層出現,一次要挖到底** — BUG-49 修了 body class(第一層),V3.2.0 上線才發現 actbar/進度點也殘留(第二層)。加新頁面時把「主框架有哪些全域元件、這頁要不要」一次列清楚。

### 模組版號

lung **V1.12.0 → V1.12.1**,系統版 V3.2.0 → V3.2.1。

---

## V3.2.0 — 2026-07-02
**民眾版加查詢紀錄 + 統計**（Sela 拍板已久的 Q2 實作）

方向:主要給病人看自己的查詢歷史,個管師可統計「給哪些病人看過、做過哪些資料」。

### 從無狀態到有紀錄

民眾版原本是無狀態查詢工具(填 → 看路徑 → 走完就沒)。V3.2.0 加 IndexedDB:

- **總覽頁**加「儲存這次查詢」按鈕
- **topbar** 加「紀錄」入口 → `p-records` 頁

### p-records 頁三段

1. **統計卡(個管師參考)**:總查詢數 + 肺癌類型分布長條 + 分期分布長條 + 有填識別筆數
2. **歷次查詢卡片(病人看自己的)**:識別 / 型態 / 期別 / 時間
3. **清除本機紀錄**:公用裝置隱私保護

### 關鍵設計

- **dbName `'LungNavPatient'` 刻意不同於醫護版 `'LungNav'`** — 兩者在 GitHub Pages 同 origin 不同路徑,IndexedDB 是 origin 級共享,同名會讓病人查詢混進醫護版病歷庫
- **識別複用 Q1 既有的選填 code/name** — 不新增輸入欄位
- **隱私**:明寫「紀錄只存這台裝置不上傳」+ 清除鈕。民眾版可能是院內公用平板或病人手機,兩種都是「本機紀錄」語意,清除鈕讓公用裝置保護前一位隱私

### 兩條教訓(BUG-49)

1. **同 origin 不同路徑的兩個前端 app,IndexedDB/localStorage 會互撞,dbName 要刻意區隔**。
2. **加獨立頁面時,既有的「模式 class toggle」機制可能不涵蓋新頁** — showPage 只 toggle summary/questioning,records 頁要自己管 body class 的加與清。

### 驗證

用 fake-indexeddb 端到端測:存 3 筆(含選填識別)→ 讀出正確 → 統計聚合對 → 清除歸零。全綠。

### 模組版號

lung **V1.11.13 → V1.12.0**(新功能進位),系統版 V3.1.4 → V3.2.0。

⚠️ **實機驗證重點**:民眾版存查詢 → 開紀錄看到 + 統計數字對;**確認沒撞進醫護版病歷庫**(開醫護版紀錄分頁沒多出病人查詢)。

---

## V3.1.4 — 2026-07-02
**字體退回 JhengHei 優先**（修 V3.1.0 webfont 在 Windows 的解析度下降感）

### 問題確認

Sela 實機試用回報「電腦版民眾版解析度略下降」。確認是 V3.1.0 換的 Noto Sans TC webfont：

- **Microsoft JhengHei**（Windows 原生）有針對 ClearType 高度優化的中文 hinting，銳利硬朗
- **Noto Sans TC**（webfont）CJK hinting 跨平台通用，Windows 上筆畫較柔、邊緣較糊 → 主觀「解析度下降」
- 民眾版「大字給長者」，字越大柔邊越明顯，特別有感

### 修法

7 頁 font-family 退回：
```
'Microsoft JhengHei','微軟正黑體','Noto Sans TC',system-ui,...
```

**webfont link 保留不移除** — 這是關鍵:

| 平台 | 行為 |
|------|------|
| Windows（大宗）| 第一位命中 JhengHei，用原生銳利字體，**不下載 Noto** |
| Mac/iPhone | 沒 JhengHei，fallback 到 Noto webfont，仍跨平台一致 |

等於 Windows 銳利 + 非 Windows 有 Noto 兜底 + Windows 零字體下載成本。

### 不動的部分

A 級無障礙（focus 環、reduced-motion、觸控 44px）跟字體無關，完全保留。

### 教訓（BUG-48）

1. **跨平台一致 vs 原生銳利，要看實際受眾權衡** — 院內工具、台灣受眾、Windows 大宗、大字給長者，銳利易讀 > 跨平台一致。webfont 一致性對「公開多平台產品」有意義，對「特定環境內部工具」是負收益。
2. **font-family fallback 鏈能同時兼顧原生銳利+跨平台兜底** — 第一位系統原生、最後 webfont，不是二選一。
3. **webfont 視覺代價只有實機看得出來** — 呼應 BUG-44，當時只想到「連不到要 fallback」，沒想到「連得到但渲染不如原生」也是代價。

### 模組版號

lung **V1.11.12 → V1.11.13**，系統版 V3.1.3 → V3.1.4。

---

## V3.1.3 — 2026-07-01
**個管師摩擦報告第二批：時效管理 #4+#5+#6**（同組需求一起設計）

醫護版從「病人建檔工具」升級成「個管師管理工具」的關鍵。三項圍繞「個管師管時效」，共用一個計算核心。

### 核心：calcTimeliness(d) 單一真相

輸入一筆病人記錄，回傳確診/首治/MDT 三個 KPI 的狀態（pass/warn/fail/na）+ alerts。#4/#5/#6 全掛在這一個函式上，不各算一套（呼應 BUG-46 教訓）。

時效門檻（改門檻只動這一處）：

| KPI | 達標 | 快到期預警 |
|-----|------|-----------|
| 收案→確診 | ≤14 天 | 收案 ≥12 天未確診 → 黃 |
| 收案→首治 | ≤42 天 | 收案 ≥35 天未首治 → 黃 |
| MDT | 須 ≤ 首治日 | 接近首治期限未排 → 黃 |

### #4 紀錄清單 KPI 色點

每列加三個色點（綠達標/黃快到期/紅逾期/灰未到），hover 顯示天數。不用點進病人就看到誰快超期。

### #5 主動預警（關鍵差異）

原本 KPI 是「事後檢核」— 確診了才算超沒超。新增「主動預警」— **收案 13 天還沒確診就亮黃燈**，不必等超期。這讓個管師「今天該追誰」一目了然。

### #6 待辦分頁

sidebar 新增「待辦」，`collectAllAlerts()` 彙整所有病人的逾期/快到期，分「已逾期（紅）」「即將到期（黃）」兩區，點任一筆直接開該病人。nav 帶未處理數 badge。

### 兩條教訓（BUG-47）

1. **一組相關需求先找共用計算核心再分頭做 UI** — #4/#5/#6 本質都是「病人時效狀態」的不同呈現，先寫 `calcTimeliness` 一個真相源，三個 UI 掛上去。
2. **「事後檢核」和「主動預警」是兩種 KPI 思維** — 前者看已發生的、後者看快到期的，後者才讓工具從「紀錄本」變「管理助手」。

### 驗證

7 情境全綠：剛收案不預警、13 天快到期黃、20 天逾期紅、達標綠、首治快到期+MDT該排、首治前沒MDT紅、全達標無 alert。

### 模組版號

lung **V1.11.11 → V1.11.12**，系統版 V3.1.2 → V3.1.3。

⚠️ **實機驗證重點**：建幾個不同收案日的病人（收案 13 天沒確診、首治超 42 天等），確認清單色點顏色對、待辦分頁列出逾期/快到期、nav badge 數字對、點待辦直接開病人。

---

## V3.1.2 — 2026-07-01
**個管師操作摩擦報告 → 資料安全三修**（Sela 挑第一批 1+2+3）

以個管師日常流程（建檔→逐步填→印手冊→回頭管舊病人）走一遍醫護版，產出摩擦報告分三類 10 項。Sela 挑「資料安全」第一批動手。

### #1 編輯舊病人基本資料切分頁漏存（root cause 比表面深兩層）

**症狀**：載入舊病人 → 在「病人」分頁改 ECOG/日期 → 直接切「總覽」或按列印或關瀏覽器（沒經過 basicck/checklist/decision/pathway、也沒按儲存）→ 改動只在記憶體沒寫入。

**root cause**：
1. `autoUpdateRecord` 觸發條件窄（`go()` 裡只認四個分頁）
2. **更隱蔽**：`autoUpdateRecord` 的 `Object.assign` 欄位本身就不完整 — 缺 type/tstage/nstage/mstage/stage/mutation/pdl1/drivers/pstage 等分期欄位，跟 `save()` 的 rec 欄位集各寫一份。就算放寬觸發，欄位不補齊還是漏存分期。

**修法**：抽共用函式 `collectStateFields()`（完整欄位集），`save()` 與 `autoUpdateRecord()` 都用它 — 永不分叉；`go()` 放寬成 `if(editId){ autoUpdateRecord(); }`（所有分頁）。

### #2 無未儲存離開提醒

`_dirty` 旗標：boot 用捕獲階段 `input` 委派 + click 委派（big-btn/gender/ecog）設 true，`save`/`autoUpdateRecord`/`saveDraft` 清 false，`load`/`newPatient` 後清 false（剛載入乾淨態）；`window.beforeunload` 在 `_dirty` 時攔截。防「當前分頁改了沒切走就關」（此時 readForm 還沒跑、draft/record 都沒存 → 全丟）。

### #3 刪除確認帶病人識別

「確定刪除？」→「確定刪除『A0012 王小明』的紀錄？」，管幾百病人不刪錯。

### 兩條教訓（BUG-46）

1. **「兩處各寫一份欄位清單」是隱性遺失的溫床** — autoUpdate 和 save 各列欄位，加新分期欄位只改 save 沒改 autoUpdate，就「手動存有、自動存漏」。抽單一函式共用是根治。
2. **autosave 要精確定義「存到哪」** — draft（切分頁）/ record（手動）/ autoUpdate 三軌觸發點不同，個管師看不到差別但行為不同。dirty flag + beforeunload 是接住邊角情況的最後一道網。

### 摩擦報告其餘（Sela 之後決定）

- **第二批時效管理**：#4 清單 KPI 色點 + #5 快到期主動預警 + #6 待辦儀表板（同組需求一起設計，醫護版從建檔工具升級成管理工具的關鍵）
- **順手**：#7 病人分頁就地儲存 + #9 MDM 欄位版面
- **低優先**：#8 未發生日期收合 + #10 清單排序

### 模組版號

lung **V1.11.10 → V1.11.11**，系統版 V3.1.1 → V3.1.2。

⚠️ **實機驗證重點**：載入舊病人→改基本資料→切分頁→再開確認有存；編輯到一半關分頁跳未儲存提醒；刪除跳帶病人代號姓名的確認。

---

## V3.1.1 — 2026-07-01
**設計審核 C 級（設計系統一致性）+ D 級（逐頁視覺）**

### C 級 — radius 收斂

民眾版原本 **13 種散落 radius 值**（4/5/6/7/8/9/10/11/12/13/14/16/99px）。判斷標準是「同類元件是否用不同值」— 分析發現 6/7、9/10/11 重疊（同類按鈕用不同值），確實該收斂。

建立 6 級語意 token：
```
--r-xs:5px    tag/label
--r-sm:7px    小元件/segment/note
--r-md:10px   按鈕/輸入框
--r-lg:12px   卡片
--r-xl:14px   hero/大卡片
--r-pill:999px
```
民眾版 50 處 + portal 8 處完整替換（每值最多 ±2px，肉眼無感）；醫護版補 token 定義供漸進採用（80+ 處不全面替換，個管師工具次要）。

### C 級 — text 命名重新評估後「不改」

V3.1.0 審核列為問題，V3.1.1 動手前**重新評估判定現狀正確**：醫護版藍灰（#5A6B7C）vs 民眾版綠灰（#5A6B6B）本就該用不同色票呼應各自主色，強行統一命名反而混淆兩人口的視覺區隔。且每頁 CSS 獨立，跨頁命名不同不影響任何使用者。這是「純工程整潔、使用者無感、改了負收益」。

### D 級 — portal hero thesis

副標「CANCER NAVIGATION SYSTEM」是 templated（任何系統都能叫、英文對長者不友善、沒 thesis）→ 中文功能定位「**癌症臨床路徑導航 · 從分期到治療的每一步**」。

### D 級 — 總覽頁視覺主從

原本決策框（治療方向，灰邊扁平）跟團隊/注意/基因卡片同級，而 gene-card 有 teal 邊反而比決策框突出 — **層次是反的**。修正成：

| 層級 | 元件 | 視覺 |
|------|------|------|
| 1 最強 | 分期 hero | 實心 teal 漸層 |
| 2 主角 | **治療方向決策框** | teal 邊 + 陰影 + teal header |
| 3 配角 | 團隊/注意/基因卡 | 灰邊扁平 |

一升（決策框）一降（gene-card teal→灰邊），對比出層次。

### 三條教訓（BUG-45）

1. **審核列的「問題」動手前要再驗是不是真問題** — text 命名就是假問題，改了反而糟。
2. **radius 一致性看「同類是否一致」不是「全站同值」** — tag/按鈕/卡片本就該不同圓角，那是層級。
3. **視覺主從靠「一升一降的對比」不是「每個都加強」**（設計 skill：spend boldness in one place）。

### 設計審核收尾

至此 A（無障礙）/ B（字體）/ C（設計系統）/ D（逐頁視覺）四級全數處理完畢。

### 模組版號

lung **V1.11.9 → V1.11.10**，系統版 V3.1.0 → V3.1.1。

---

## V3.1.0 — 2026-07-01
**設計師視角 UI 審核 → A 級無障礙 + B 級字體升級（全 7 頁）**

Sela 要求「用美學設計師角度嚴格審核每頁 UI」。審核分四級，Sela 選 A+B 動手。

### A 級 — 無障礙加固（全 7 頁）

**1. 鍵盤 focus 環**（原本 portal/edu-patient 0 條、patient 僅 2 條）
每頁加 `:focus-visible`（醫護 --primary 藍 / 民眾 --teal）。**用 `:focus-visible` 不用 `:focus`** — 只在鍵盤導航時顯示，滑鼠點擊不干擾既有視覺。這是「無障礙不犧牲視覺」的正解。

**2. `prefers-reduced-motion`**（原本全站 0 條）
每頁加，動暈症/前庭功能障礙病人的動態降到 0.01ms。

**3. 民眾版觸控目標保底**（WCAG AAA 44px）
age-btn 48px（V3.0.8 拿掉 `<i>` 後只剩一行變矮）、mut-btn·tnm-btn 44px。

### B 級 — 字體升級（全 7 頁）

**4. Noto Sans TC 取代系統預設正黑體**
原本 `Microsoft JhengHei` 是 Windows 專屬，Mac/iPhone 病人看到不同 fallback。改成：
```
font-family:'Noto Sans TC','Microsoft JhengHei','微軟正黑體',system-ui,...
```
**漸進增強策略**：連得到 Google Fonts → Noto（跨平台一致）；醫院內網連不到 → 自動退回 JhengHei，**不會比現況差**。webfont 用 `display=swap`，只載 400/500/700/900 四字重。

**5. 民眾版病人要讀的小字放大 + 提對比**
mut-ss（基因說明）10px→11.5px、tx3→tx2；tnm-btn i（TNM 說明）9.5→10.5px、tx3→tx2。原本 #8A9595 對比僅 2.8:1 不足 WCAG AA。

### 三條教訓（BUG-44）

1. **focus 環用 `:focus-visible` 不用 `:focus`** — 後者連滑鼠點也顯示外框（干擾視覺、常被拿掉→鍵盤族沒焦點）。
2. **webfont 對醫院環境要漸進增強不硬相依** — fallback 鏈第一位 webfont、第二位系統字體，載入失敗自動退回。
3. **改按鈕觸控目標前先確認現有高度怎麼撐的** — age-btn 因 V3.0.8 拿掉 i 變矮，改一處 UI 可能讓另一處隱含假設失效。

### 審核未做（Sela 挑 A+B，C/D 留下版）

- **C 級**設計系統一致性：radius 三套值、text 色票三套命名
- **D 級**逐頁視覺：portal hero 是模板答案、總覽頁資訊塊無視覺主從

### 模組版號

lung **V1.11.8 → V1.11.9**，系統版 V3.0.9 → V3.1.0（全 7 頁系統級升級）。

⚠️ **實機驗證重點**：webfont 是外部相依，上線要確認 Noto 有載入 + 醫院內網 fallback 到 JhengHei 正常（把 fonts.googleapis.com 擋掉測）+ focus 環鍵盤 Tab 可見 + 觸控目標手指好按。

---

## V3.0.9 — 2026-07-01
**電腦版 Q 頁修版面 + 294 情境大規模模擬掃 bug**（Sela 交辦 2 事）

### Q1 電腦版 Q 問答頁卡片撐爆

**症狀**：電腦版第 2 步「肺癌類型」四個卡片被撐到滿視窗高度（每個超大、內容置中一堆留白）。

**root cause**：跟 V3.0.7 總覽頁**完全同源** — 桌面版 `body.questioning` 解鎖規則只寫在 `@media(max-width:640px)`，桌面版 `.page`→`.cd`→`.type-grid` 一路 `flex:1` 把卡片撐滿視窗。V3.0.7 修了 summary 頁，忘了 questioning 頁也有同款規則。

**修法**：`body.questioning` 解鎖提升為全尺寸（卡片自然高度堆疊）+ 桌面版 `.type-grid .btn-type{min-height:130px}`。

### Q2 294 情境大規模模擬

建 harness 覆蓋：**全型態（非鱗/鱗狀/SCLC）× 全期別（IA1/IB/IIB/IIIA/IIIB/IIIC/IVA/IVB + SCLC Limited/Extensive）× 開刀/不開刀 × 9 種基因 × 復發**。

**7 大類自動檢查全綠**：
- steps 非空、stageTxt/pwTxt 非空
- IIIB/IIIC 不出現「可切除型 IIIA」（BUG-38 回歸測試）
- IA 初診不出現術後鞏固
- SCLC 不出現基因檢測建議
- 無醫令碼/試驗代號/健保條文編號/T790M 殘留
- 基因卡片帶期別

**人工細看 9 情境臨床合理性**（harness 抓不到的），抓到一個可強化點：

> LOCAL 分支（III 期）對驅動基因陽性者（EGFR/ALK/ROS1）仍照顯示「同步化放療後免疫維持治療」step，但免疫維持（PACIFIC/Durvalumab）本就排除驅動基因陽性者。

**修法**：補一條 warn，驅動基因陽性 → 提示免疫維持通常不適用 + 可與醫師討論標靶維持治療。patient + edu-patient 同步。

⚠️ **待確認**：CCRT 後標靶維持（LAURA trial osimertinib，2024 陽性）的台灣健保給付現況。本版只加「提示方向」不動健保 tag，確認給付後可補正式 step。

### 兩條教訓（BUG-43）

1. **自動 harness 抓「結構 bug」，人工抽樣抓「臨床合理性」，兩者不能互相取代**。294 情境結構全綠，但「驅動基因 vs 免疫維持」這種語意問題只有人讀 steps 對照臨床知識才抓得到。
2. **同款 CSS 佈局 bug 會跨頁重複，修一頁要 grep 全專案同款規則**。V3.0.7 修 summary 忘了 questioning 頁，拖到 V3.0.9 才補。

### 模組版號

lung **V1.11.7 → V1.11.8**（修了 `patient.html` + `edu-patient.html`），系統版 V3.0.8 → V3.0.9。

---

## V3.0.8 — 2026-07-01
**問診頁不提前解釋 + 基因檢測結合期別講健保 + 高劍虹排序**（Sela 交辦 3 修）

### Q1 高劍虹移到張竣期後面

胸內科醫師順序：張竣期 → **高劍虹** → 張正雄 → 吳敬炫 → 劉大智。醫護版 `CFG.team` + 民眾版 `TEAM` 兩處都改。

### Q2 基因檢測結合期別 + 明確說明健保

基因檢測卡片的 subtitle/foot 帶入病人**實際期別**，並依期別型態明講健保給付狀況（健保給付與否正是取決於期別）：

| 病人分期 | 副標 | 健保說明 |
|---------|------|---------|
| 非鱗晚期（IVA 等）| 以您的分期（IVA 期、非鱗狀），以下多數健保有給付 | EGFR、ALK、PD-L1 **健保給付**，ROS1 材料費 |
| 鱗狀晚期（IIIB 等）| 以您的分期（IIIB 期、鱗狀），PD-L1 健保給付 | PD-L1 **健保**；EGFR、ALK **自費** |
| 早期（IB 等）| 以您的分期（IB 期、早期），基因檢測多為自費 | **健保多不給付**（PD-L1 材料費，其他自費）|

已手術病人期別帶 `p` 前綴（如「pIIB 期」）。

### Q3 問診頁不提前解釋「為什麼」

**原則**：問診頁（Q1 基本資料）只問「有沒有 / 是什麼狀態」，不提前解釋「所以會怎樣」或給建議。建議一律留到決策頁（總覽頁 warns）。

拿掉的提前建議：
- 年齡：「建議改 Carboplatin」「標準劑量」
- B/C 肝：「需看腸胃科」「建議先驗」+ hint「影響化療前是否需預防性抗病毒藥」
- 重大傷病：「建議盡快申請」+ hint「可減免部分負擔與看護費」

保留的：ECOG 的狀態描述（「有症狀但白天大半時間仍能起身活動」）— 那是**描述選項是什麼狀態**（病人要對照自己選），不是給建議。

### 核心教訓（BUG-42）

**問診 vs 決策要分階段**：問診頁「收集」、決策頁「輸出」，建議只在決策頁講一次。問診頁堆建議 = 病人還沒答完就被結論淹沒，且同樣建議決策頁又出現一次（重複）。

### 模組版號

lung **V1.11.6 → V1.11.7**（修了 `patient.html` + `lung/index.html`），系統版 V3.0.7 → V3.0.8。

---

## V3.0.7 — 2026-07-01
**民眾版總覽頁 4 修**（Sela 上傳 IIB 截圖交辦）

### Q1 精簡冗長注意事項

- B/C 肝：3 句 → 1 句（「您有 B/C 型肝炎：化療前先看腸胃科拿預防性抗病毒藥（避免化療期間病毒活躍傷肝）」）
- 重大傷病：2 句 → 1 句（「肺癌可申請重大傷病證明，減免部分醫療費用，請儘早向醫院申請」）
- 砍掉 EARLY/postOp 兩處跟新基因卡片重複的「建議做 EGFR、ALK 基因檢測」warn

### Q2 高劍虹沒出現（root cause + 修）

**root cause**：民眾版 patient.html 有**獨立的 `TEAM` 常數**，V3.0.5 只改了醫護版 `lung/index.html` 的 `CFG.team`，沒同步民眾版。醫師名單同時存在兩個檔案，改一個漏另一個。

**修法**：民眾版 `TEAM.depts` medicine 加高劍虹。已 grep 確認 edu-patient / edu-pro / drugs-patient 無獨立醫師名單，只 patient.html + index.html 兩處。

### Q3 決策框被壓縮（root cause + 修）

**root cause**：桌面版 `body.summary` 的解鎖捲動規則只寫在 `@media(max-width:640px)`。桌面版 `.sum-wrap overflow:hidden` 硬塞一屏，「治療方向與藥物」決策框（`.sum-drugs` flex:1）被 hero + 照護團隊/注意事項雙卡 + 基因卡片擠到只剩一條。

**修法**：把解鎖規則提升為全尺寸（移出 media query），決策框完整展開、其他卡片往下排、整頁自然捲動。桌面版 `.sum-drugs-body` 加 `min-height:220px`。

### Q4 基因檢測語氣中性化

| | V3.0.6（推銷感）| V3.0.7（中性）|
|-|----------------|--------------|
| 標題 | 建議做的基因檢測 | 基因檢測參考 |
| 副標 | 跟醫師確認，一次開齊省時間 | 以下項目可與醫師討論是否檢測 |
| foot | ...一次驗完省去等待與重複抽血 | ...由您與醫師討論後決定 |
| item why | 找到就有標靶藥可用、效果好 | 若為陽性有對應的標靶藥 |

### 兩條教訓（記在 BUG-41）

1. **醫師名單這種「兩檔各一份」的資料，改一次要 grep 全專案確認同步**。下版考慮抽 `lung/_team.js` 共用。
2. **「解鎖捲動」這類 responsive 規則寫進 media query 前，先想清楚是「只有小螢幕要」還是「所有尺寸都要」**。內容會隨資料長度變動的頁面，預設就該全尺寸可捲動。

### 截圖情境驗證（IIB postOp 非鱗 · 有 B/C 肝 · 沒申請重大傷病）

注意事項 5 條精簡版 ✓、基因卡片中性化 ✓、高劍虹在名單 ✓、桌面版決策框完整展開 ✓。

### 模組版號

lung **V1.11.5 → V1.11.6**（修了 `patient.html` + `lung/index.html`），系統版 V3.0.6 → V3.0.7。

---

## V3.0.6 — 2026-07-01
**基因檢測建議融入民眾版（可共同決策，不出現醫令碼）**

Sela 5 題交辦的最後一題。拍板「可共同決策但不要出現醫療碼」。

### 目的

讓病人（尤其還沒驗基因的）知道該跟醫師討論驗什麼、大概的費用結構，達到「醫病共同決策」。資料源是本院「肺癌基因檢測開單速查表」，但**拿掉所有醫令碼**（30101B / L09017A 等只留醫護版）。

### 三分類邏輯（源自速查表）

| 病人情境 | 建議 |
|---------|------|
| 非鱗 + 復發/轉移 或 IIIB 以上 | EGFR、ALK、PD-L1、ROS1 **5 項一起開**（3 項健保 + ROS1 材料費）|
| 鱗狀 + IIIB 以上 | **PD-L1 先驗**，EGFR/ALK 視需要（自費較高）|
| IIIB 以前（早期）| **PD-L1 先驗**，其他視需要 |
| SCLC | 不顯示（小細胞肺癌不做驅動基因檢測）|

### 民眾版拿到 vs 醫護版拿到

| 欄位 | 醫護版 drugs-pro | 民眾版（本版）|
|------|----------------|-------------|
| 醫令碼（30101B 等）| ✓ 開單需要 | ✗ 拿掉 |
| 精確費用（自費 10,000 元）| ✓ | ✗ 只給「健保/材料費/自費/視需要」相對概念 |
| 為什麼要驗 | — | ✓ 病人語言（「東方人常見，找到就有口服標靶藥可用」）|

### 呈現

總覽頁「注意事項」卡片下方加「建議做的基因檢測」卡片。每項顯示費用 tag（健保青色 / 自費黃色）+ 檢測名稱 + 為什麼要驗。底部一句「建議一次開齊」說明。

已驗過基因的病人（Q4 選了具體基因）→ 標題改「供參考是否補齊」。

### 6 情境驗證全綠

非鱗 IVA/IIIB → 5 項 ✓；鱗狀 IIIB → PD-L1 先 ✓；早期 IA1 → PD-L1 + 視需要 ✓；已驗 EGFR → 供參考 ✓；SCLC → 無建議 ✓；醫令碼殘留 0 筆 ✓。

### 為什麼 edu-patient（掃 QR 版）不加

掃 QR 是「已看完醫師、拿到衛教單」階段，多數病人已驗完基因。此時顯示「建議驗什麼」時機不對。基因檢測建議的正確時機是 patient.html 主流程（初診決定階段）。

### Sela 5 題完成度

| 題 | 內容 | 狀態 |
|----|------|------|
| Q1 | 電腦版窄化 | ✓ V3.0.5 |
| Q3 | B/C 肝 + 重大傷病 | ✓ V3.0.5 |
| Q4 | 高劍虹加入胸內 | ✓ V3.0.5 |
| Q5 | 基因檢測融入 | ✓ V3.0.6 |
| Q2 | 個管師看民眾版統計 | 拍板「參考醫護版 IndexedDB 作法」，下版實作 |

### 模組版號

lung **V1.11.4 → V1.11.5**（修了 `patient.html`），系統版 V3.0.5 → V3.0.6。

---

## V3.0.5 — 2026-07-01
**Sela 一次交辦 5 題，本版做 3 題**（電腦版窄化 / Q1 加 B/C 肝與重大傷病 / 高劍虹加入胸內）

剩兩題（個管師看民眾版統計、基因檢測資料融入民眾版）是設計題，先給方案不動手。

### Q1 電腦版窄版化

**症狀**：`.main` 已 `max-width:600px` 但 `.actbar` 沒限制，電腦版底部「下一題」按鈕拉滿整螢幕，跟中間卡片沒對齊。

**修法**：
```css
@media(min-width:601px){
  .actbar{max-width:600px;margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box}
}
```

`.hdr`（頂部漸層 header）保持全寬 — 那是設計特色（漸層背景橫貫螢幕）。

### Q3 Q1 加 B/C 肝 + 重大傷病兩欄

**新欄位**：`S.hbv`（yes/no/unknown）+ `S.catastrophic`（yes/no）

**串入 buildPath 收尾邏輯**（`applyHbvCatastrophic`）：
- `hbv='yes'` + 路徑含化療 → 「請先看腸胃科拿預防性抗病毒藥」
- `hbv='unknown'` + 路徑含化療 → 「建議先驗，若為帶原者需先看腸胃科」
- `hbv='no'` → 不提醒（Sela 明確要求）
- `catastrophic='no'` → 「請盡快申請重大傷病證明」

**4 情境驗證全綠**：
| 情境 | B/C 肝提醒 | 重大傷病提醒 |
|------|---------|---------|
| IIIA + 有肝炎 + 沒申請 | ✓ 提醒看腸胃科 | ✓ 提醒申請 |
| IIIA + 不知肝炎 + 已申請 | ✓ 建議先驗 | 無 |
| IIIA + 沒肝炎 + 沒申請 | 無 | ✓ 提醒申請 |
| IA1 觀察 + 有肝炎 + 已申請 | 無（沒化療不觸發）| 無 |

**隱藏坑修法**：`pickAge` 原本用 `document.querySelectorAll('#p-q1 .age-btn')` 全域抓，加了新的 `.age-btn`（B/C 肝、重大傷病也用同 class）後會誤影響年齡按鈕的 selected 狀態。三個 pick 函式都改用 `btn.closest('.info-block').querySelectorAll(...)` 定位範圍。

### Q4 高劍虹加入胸腔內科

`CFG.team.depts` 醫師名單加入。

### 設計題方案（Q2 個管師看民眾版統計 + Q5 基因檢測融入）— 給 Sela 拍板

見 CLAUDE.md 下版候選工作 + 訊息末尾摘要。

### 模組版號

lung **V1.11.3 → V1.11.4**（修了 `patient.html` + `lung/index.html`），系統版 V3.0.4 → V3.0.5。

---

## V3.0.4 — 2026-07-01
**IIIB/IIIC 病人被塞 IIIA 建議的 bug 修正（Sela 上傳截圖抓到）**

### 症狀

Sela 上傳一個 IIIB (T4 N2a M0) 病人的畫面截圖，總覽頁跑出：
- Step 3：「可切除型 IIIA：先手術 + 術後輔助治療」
- Step 4：「IIIA 開刀切除後依基因檢測結果擇一」

但這位病人不是 IIIA。

### 原因

LOCAL 分支對 IIIA/IIIB/IIIC 一視同仁。臨床上：
- **IIIA** 部分可切除（N1 或單站 N2）
- **IIIB** 因 T4 通常不可切除
- **IIIC** 因 N3 不可切除

V3.0.1 民眾版 UX 大修時把 EARLY 分支加了 `isIA` 過濾（IA 期不列術後鞏固），但 LOCAL 沒同樣加 `isIIIA` 過濾。

### 修法

`patient.html` + `edu-patient.html` LOCAL 分支：
- 加 `isIIIA = stage === 'IIIA'`
- Step 3、4 用 `if(isIIIA)` 包起來
- 非 IIIA 補 `warns.unshift(stage + ' 期腫瘤範圍較廣（涉及 T4 或多處淋巴轉移），一般不建議先手術，以同步化放療 + 免疫維持治療為主')`

### 驗證（3 情境全綠）

| 期別 | Step 數 | 顯示替代方案 | 開頭警語 |
|------|--------|------------|---------|
| IIIA T2b N2 M0 | 4 個 | ✓ 可切除型 + 術後追加 | 無 |
| IIIB T4 N2a M0（畫面案例）| 2 個 | ✗ | ✓「IIIB 期腫瘤範圍較廣...」|
| IIIC T4 N3 M0 | 2 個 | ✗ | ✓「IIIC 期腫瘤範圍較廣...」|

### 元教訓

V3.0.1 修 EARLY 時已學到 `isIA` 過濾（BUG-35），這次 LOCAL 又踩同類 bug 沒推廣 → CLAUDE.md BUG-38 記下：「**下版寫新分支時預設檢查：這個 stageCat 內有沒有 stage 級的差異該過濾？**」

同時發現 V3.0.1 病人視角審查 10 個情境包含 IIIA 但沒 IIIB/IIIC（都併在 LOCAL），漏了這個 bug → 下次審查每個 stageCat 內至少各期跑一次。

### 模組版號

lung **V1.11.2 → V1.11.3**（修了 `patient.html` + `edu-patient.html`），系統版 V3.0.3 → V3.0.4。

---

## V3.0.3 — 2026-06-29
**個管師視角審查找到的「個人化提示永遠不觸發」隱性 bug 修正（隱藏 9 個月）**

對稱於 V3.0.1 病人視角審查，本版走「個管師（case manager）視角」試用整套系統，跑 4 個情境模擬（晨間新病人 / KPI 即將超標 / 跨院轉診 pTNM / 完整流程 MDT 不合規），發現 9 類問題，其中 2 條是**隱性 bug**（功能存在但實質沒在跑）。

### 修了什麼

**隱性 bug #1：QR payload 漏帶 age + ecog**
- 醫護版 `buildEduPayload` 只傳 `{n, t, s, m, tm, c, d}`，**沒帶 age 跟 ecog**
- 但 edu-patient.html 的 `applyAgeEcogFromData(r, d)` 期待 `d.a` 跟 `d.e`
- 結果：個管師印 QR 給病人掃，**V2.9.0 加的「依您狀況」個人化提示永遠不觸發**
- 影響三條提示全失效：
  - 高齡（≥70）→ 化療鉑類首選副作用較輕的碳鉑
  - 體力中等（PS 2）→ 同步化放療可改成分開做
  - 體力較差（PS 3-4）→ 以症狀控制與支持性療法為主
- **這個 bug 從 V2.9.0（2026-04-29）存在至今 ~9 個月**，期間還跑過 V2.10/V2.11/V2.12/V2.13/V3.0.0/V3.0.1/V3.0.2 7 次升版都沒抓到

**隱性 bug #2：ECOG 值醫護版 vs 民眾版不對齊**
- 醫護版按鈕存 `'0' / '1' / '2' / '3' / '4'`（5 級）
- 民眾版判斷用 `'01' / '2' / '34'`（3 組）
- 即使修了 #1 把 ecog 傳過去，沒做值映射還是不會 match

### 修法

`lung/index.html` `buildEduPayload()` 加 `a / e` 兩個欄位，含值映射：

```javascript
// 醫護版 5 級 ECOG → 民眾版 3 組
const ecogMap = {'0':'01','1':'01','2':'2','3':'34','4':'34'};
const eMapped = ecogMap[S.ecog] || '';
// 從 birthday + caseDate 算實際年齡 → 民眾版 2 組
const actualAge = calcAgeFromDates(S.birthday, S.caseDate || todayStr());
const aMapped = (actualAge !== null) ? (actualAge >= 70 ? 'ge70' : 'lt70') : '';
```

### 端到端驗證（3 情境全綠）

| 情境 | 醫護版輸入 | payload | 觸發提示 |
|------|---------|---------|---------|
| 78 歲 PS 2 高齡+體力中等 | birthday=1948-03-10 ecog=2 | a=ge70 e=2 | ✓ 高齡 + ✓ 體力中等（兩條全觸發）|
| 55 歲 PS 0 中年體力佳 | birthday=1971-01-01 ecog=0 | a=lt70 e=01 | （無提示 — 正常）|
| 63 歲 PS 3 中年體力差 | birthday=1963-05-15 ecog=3 | a=lt70 e=34 | ✓ 體力較差 |

### 個管師視角審查發現但未在本版修的 7 條設計缺口（V3.1.0+ 候選）

**🟡 設計缺口（影響日常工作流）**：
1. **跨院轉診病人 pTNM 無法獨立輸入** — 現況綁 `actualTx.surgery=true` 才顯示，個管師被迫勾「手術」產生假執行紀錄
2. **紀錄列表頁 KPI 視角缺失** — 列表只顯示 ck 完成數，看不到 3 個 KPI 狀態
3. **沒有「我的待辦」/「即將超期」清單** — 個管師工作核心是跨病人時序管理，目前必須一個一個打開才看到 KPI
4. **「實際治療 actualTx」語意混亂** — 同時兼三個職責：已執行 / 規劃中 / 觸發策略 KPI
5. **「實際治療」勾選沒治療日期欄位** — 細粒度時序紀錄缺失

**🟢 期待但缺**：
6. **副作用 / 不良反應追蹤系統** — 現況只在「衛教」項目（c24/c25 checklist），勾完算「衛教過了」；缺每次回診的副作用記錄（CTCAE 分級 / 處置）
7. **個管師名字寫死在程式裡** — `lung/index.html` line 1232 `caseManager: {name:'郭美伶', ...}`，換人要改程式

### 教訓總結

- **雙人口資料源分離設計**（V3.0.1 教訓延伸）**還要加端到端 pipeline 測試**：本案 bug 本質上是「資料傳遞層」問題 — 即使民眾版邏輯對、醫護版資料對，中間 QR payload 漏欄位整個鏈就斷
- **「對稱視角審查」是找隱性 bug 的有效手段**：V3.0.1 病人視角找 7 類顯性 UX，V3.0.3 個管師視角找 9 類，其中 2 條是隱藏 9 個月的隱性 bug
- **「功能加上去 ≠ 功能在跑」**：V2.9.0 加的「依您狀況」個人化提示，patient.html 自填路徑可觸發，edu-patient.html 掃 QR 路徑斷掉。下版考慮在 patient.html / edu-patient.html 加 debug mode（URL 加 `?debug=1`）方便個管師驗證

### 模組版號

lung **V1.11.1 → V1.11.2**（修了 `lung/index.html`），系統版 V3.0.2 → V3.0.3。

---

## V3.0.2 — 2026-06-29
**升 Kit V1.9.0 → V1.21.0（升版對齊，非首次對齊）**

Sela 上傳 Kit V1.21.0，距 V3.0.0 首次對齊跨 12 個 b 版本。走 V1.21.0 `templates/claude-init.md` 第二章升版對齊 SOP，不重新打 V3.0.0 已決定的事。

### 本專案 V3.0.0 反饋已被 Kit 採納（驗證雙向回流通道有效）

| 我們提的 | Kit 採納為 | Kit 採納版本 |
|---------|---------|------------|
| NCCN Cat 1 推薦 ≠ 健保給付要雙軌標示 | **坑 #51** | V1.10.0 |
| 健保條文每季可能修訂，工具須條文版本日期 + 定期 review | **坑 #52** | V1.10.0 |
| opt（依需要）項目不應算入未完成進度 | **坑 #50** | V1.10.0 |

**意義**：SELA-handoff 機制是真實的雙向通道。下次寫 handoff 時記得這點。

### 🔴 V3.0.2 對齊執行清單

1. **衝突仲裁區塊版本號 V1.9.0 → V1.21.0** + 移除「No emoji 更嚴」誤標（V1.21.0 sela-philosophy 確認本就是 Kit 規範）
2. **執行 V1.17.0 新鐵律「優化體檢」** — 對照 optimizations.md 4 條 OPT 找適用項
3. **加註雙向回流關係** — 我們 V3.0.0 提的 3 條反饋已採納為 Kit 坑 #50/#51/#52
4. **加 BUG-36** 記錄升 Kit 過程 + **更新 SELA-handoff.md** 標註已採納 + 加 V3.0.1 新發現的 2 條反饋

### 優化體檢結果（V1.17.0 新鐵律首次跑）

| OPT | 標題 | 適用 | 已採用 |
|-----|------|------|------|
| OPT-1 | 系統 cron → threading.Timer | ✗ 純前端 HTML 無排程 | N/A |
| OPT-2 | 散落初始化 → master JSON | ✗ 無 DB | N/A |
| OPT-3 | 外部請求 → outbox queue | ✗ 無後端 | N/A |
| OPT-4 | 一次生成大量產出 → 配驗證迴圈 | ✓ 適用 | ✓ V3.0.1 民眾版 UX 大修末段「跑 10 個情境模擬驗證」就是 OPT-4 應用 |

**結論**：0 條需動手改。回饋給 Kit：當前 4 條 OPT 中 3 條偏後端/DB 場景，建議未來加「前端」類 OPT。

### V1.21.0 新規範對本專案的影響

| Kit 新規範 | 我們狀態 |
|---------|---------|
| **V1.12.0** §10.5 英文名稱化（鐵律）| ✓ 「Cancer Navigation」已英文 |
| **V1.13.0** App Logo 主動詢問 | ✗ 醫院系統不另做（同 V3.0.0 品牌歸屬決策）|
| **V1.17.0** 優化體檢（鐵律）| ✓ 已執行，0 條需動手改 |
| **V1.20.0** §10.6 UI 版本號顯示（鐵律）| ✓ topbar「lung V1.11.1 · System V3.0.2」已符合 |
| **V1.21.0** 坑 #63 Python re.sub → str.replace | ✓ V3.0.1 民眾版 UX 大修已用 `c.replace + assert` |
| **V1.19.0** 坑 #61 UI 改名只改顯示文字 | ✓ V3.0.1「鞏固→追加治療」phase 變數 `consolidation` 沒動 |

### ✗ V3.0.0 已決定的事不重新打開（仍維持原狀）

- **SELA logo 不加** — 品牌歸彰濱秀傳醫院（V1.8.2 規則：正式機構發布豁免）。同此 V1.13.0 App Logo 主動詢問也不適用
- **配色 `#5B8FB9` 保留** — 個管師驗收使用數月，Kit `colors.md` §3 V1.8.1 規則本身就是「不主動換」，我們完全符合
- **CLAUDE.md 章節結構保留** — BUG-1 ~ BUG-36 連續編號的演進脈絡

### 模組版號

lung **V1.11.1 不動**（升 Kit 沒動程式碼），系統版 V3.0.1 → V3.0.2。

---

## V3.0.1 — 2026-06-01
**民眾版（patient.html / edu-patient.html）UX 大修 — 病人視角審查 + 全面平民化**

Sela 提議「從病人角度試點病人版，模擬不同期別找出奇怪的地方」。跑了 10 個情境模擬（IA1 初診 / pIB EGFR+ 已手術 / IIIA EGFR+ 初診 / IIIB 鱗 PS2 / IVA EGFR+ 腦轉 / IVA KRAS / SCLC 侷限 / SCLC 擴散 / pIIIA EGFR+ 復發 / pIIB ALK+ 鞏固中），從病人實際讀到的文字角度審查，找出 7 類問題並全修。

### 7 類問題與修正

#### A. 試驗代號 / 條文編號 / 英文藥名沒翻譯成民眾語言

V2.13.0 健保條文對齊時把專業字塞回民眾版 note。V3.0.1 全部拔掉：

| 之前病人看到 | 之後病人看到 |
|------------|------------|
| 「ADAURA 適應症」「ALINA 適應症」「IMpower010 術後鞏固需自費」 | 「目前健保未給付術後追加治療，需自費或申請藥廠資源」 |
| 「健保條文 9.69」「CCRT 後無 PD」「EGFR/ALK/ROS-1 原生型」 | 「限第三期無法手術切除、同步化放療後病情穩定、未帶有 EGFR/ALK/ROS-1 等驅動基因者」 |
| 「Erlotinib 健保事審 9.5.1；Bevacizumab 健保事審 9.5.7」 | 「健保有給付，需事前審查」 |
| 「KRAS G12C 病人多 PD-L1 偏高，免疫反應佳」 | 「KRAS G12C 病人的免疫指標多偏高，對免疫治療反應通常較佳」 |
| 「若一線非 Osimertinib 且 T790M(+)」 | 「若第一線用的不是 Osimertinib，且檢測發現抗藥基因」 |
| 「Amivantamab 健保限 EGFR exon 20 ins 第一線併用 carboplatin/pemetrexed (9.126)」 | 「少數帶有特殊 EGFR exon 20 突變的病人，第一線可用 Amivantamab 合併化療」 |
| 「PS 2」「PCI」「序貫」 | 「體力中等」「預防性腦部照射」「分開做（先化療再放療）」 |
| 「NCCN Cat 2A 後線推薦」 | 拿掉，民眾不需要看 |

#### B. 自費標示讓病人焦慮 — 3 個藥合併成「擇一」

pIB EGFR+ 病人之前看到 3 個自費術後鞏固藥（Osimertinib / Alectinib / Atezolizumab）連續列出，會誤以為要花 3 倍錢。

```
✕ 之前：
3. [自費] EGFR 陽性：Osimertinib 鞏固至多 3 年
4. [自費] ALK 陽性：Alectinib 鞏固至多 2 年
5. [自費] PD-L1 ≥1% 可考慮：Atezolizumab 免疫鞏固

✓ 之後（合併「擇一」）：
3. [自費] 術後追加治療：依基因檢測結果擇一
       藥: 泰格莎 / 安立適 / 癌自禦
       ✎ 一個病人通常只會用一種，依檢測結果決定。
```

#### C. 邏輯不一致 — IA1 初診不再出現「術後鞏固」

之前 buildPathRaw EARLY 分支不論 postOp 都列 EGFR/ALK 鞏固，IA1 初診病人會看到「術後鞏固」與「II-IIIA 術前輔助」資訊跟他無關。

V3.0.1 加 `isIA = stage.startsWith('IA')` 過濾：
- IA 不顯示「II-IIIA 術前輔助」step
- IA 不顯示「術後輔助化療」step
- IA 不顯示「術後追加治療」step
- pwTxt 分 IA / IB+ 兩種版本（IA「以手術切除為主，術後規律追蹤」/ IB+「手術切除為主，視期別決定是否加術後化療與追加治療」）

#### D. 復發路徑「第一線」措辭錯

「第一線」是「最先用的藥」對沒治療過的人對，但對復發病人來說已經做過治療。stageTxt「pIIIA 轉移期 (IV)（術後復發/惡化）」p 跟 IV 混在一起。

```
✕ 之前：
stageTxt: 非小細胞肺癌（非鱗狀） 轉移期 (IV)（術後復發/惡化）
step 2. [健保] 第一線：EGFR TKI 標靶

✓ 之後：
stageTxt: 非小細胞肺癌（非鱗狀） 術後復發 — 接續全身性治療
step 2. [健保] 復發後接續治療（第一順位）：口服 EGFR 標靶藥
```

buildRecurrencePath 加 regex 替換 step.title 措辭。

#### E. 詞句不順 + 醫護用語殘留

| pwTxt 之前 | pwTxt 之後 |
|------------|----------|
| 同步化放療為主，再加免疫鞏固 | 以同步化放療為主，治療結束後再用免疫維持治療 |
| 依基因 / PD-L1 個人化治療 | 依基因檢測結果與免疫指標選擇個人化治療 |

#### F. 重複資訊 — 同件事不再說 4 遍

pIB EGFR+ 之前看到「健保未給付，需自費」連續出現 4 次（3 個 step note + 1 個 warns）。V3.0.1 精簡為 1 次（合併「擇一」step 的 note 內 + warns 統合一條）。

#### G. DRUGS 區塊 5 個 entry 全清條文編號

EGFR_BRAIN / BRAF / MET / KRAS / CONSOLIDATION 五個 entry 的 note 全寫成病人語言。

### 同步檔案

- `lung/patient.html` 與 `lung/edu-patient.html` 兩份完整對齊
- ECOG 按鈕 UI + footer 體力標籤同步翻譯（「PS 2 / PS 3-4」→「體力中等 / 體力較差」）
- SCLC 兩種期別分支 PCI / 鞏固 → 預防性腦部照射 / 追加治療

### 模組版號

lung **V1.11.0 → V1.11.1**（c+1 小修），系統版 V3.0.0 → V3.0.1。

### 下版考慮的設計優化

把 DRUGS 拆成 `DRUGS_PRO`（醫護版用，含條文編號 / 試驗代號 / NCCN 分級）+ `DRUGS_PATIENT`（民眾版用，純病人語言），避免雙視角誤用同一筆 note。維持兩個檔案的同步成本，但根本解雙人口資料源混用問題。

---

## V3.0.0 — 2026-06-01
**首次對齊 SELA-Starter-Kit V1.9.0（重大里程碑）**

走 Kit「對齊既有專案 SOP」（坑 #40）四級分類法做選擇性對齊。本專案累積 V0.1.0 → V2.13.0 / 33 條 BUG 編號 / 雙視覺雙語版本後首次接 Kit 規範。

### 🔴 必做（已執行）

| 項目 | 動作 |
|------|------|
| `.gitignore` | 新增（從 Kit `gitignore-template` 起手 + 專案特定規則：`_pack/`、`*.zip`、`*.bak` 等）|
| CLAUDE.md 衝突仲裁區塊 | 在最頂端加段，明寫 4 項刻意不對齊與理由 |
| `SELA-handoff.md` | 首次對齊 = 重大里程碑必產（給 Kit Claude 升 Kit 用）|
| 版號重置 b | V2.13.0 → V3.0.0（Kit 嚴格三位數逢十進位）|

### 🟡 跟 Sela 對焦的兩個關鍵問題

1. **「SELA logo + favicon 要加上去嗎？」** → Sela 答「不加，已準備正式以彰濱秀傳名義發布」→ 走 Kit V1.8.2「正式機構發布豁免」路徑
2. **「對齊算哪種升版？」** → Sela 答「V3.0.0（重置 b 修正版號 + 對齊里程碑，最乾淨）」

### ✗ 明寫不對齊的 4 項

| 項目 | 理由 |
|------|------|
| **SELA logo + favicon 不加** | 品牌歸彰濱秀傳醫院，已準備正式以醫院名義發布。Kit V1.8.2 規則：正式機構發布豁免「必含 SELA logo」鐵律 |
| **配色 `#5B8FB9` 保留**（不換 Kit 預設 `#5A7A8B`）| 已被個管師驗收使用數月，已驗證的色票就是事實標準（Kit `colors.md` §3 補強規則：既有專案首次對齊預設維持原設定色）|
| **CLAUDE.md 章節結構保留** | V2.10.0 → V2.13.0 累積章法，重排會洗掉 BUG-1 ~ BUG-33 連續編號的演進脈絡。Kit 對齊既有專案 SOP 鐵律：「不要為對齊 Kit 改既有設計」|
| **「No emoji anywhere」更嚴** | 本專案 Nordic SVG 風格已成立，不放寬到 Kit `coding-style` 的允許範圍 |

### 模組版號

lung 模組保留 **V1.11.0** — 模組本身在 V2.13.0 → V3.0.0 沒變動，只是系統層的 Kit 對齊。topbar 顯示「V1.11.0 · System V3.0.0」。

### 對齊輸出檔案

```
Cancer Navigation V3.0.0/
├── .gitignore              ← 新增（Kit 鐵律必含）
├── CLAUDE.md               ← 頂端加 Kit 衝突仲裁區塊
├── README.md               ← 加本 V3.0.0 章節
├── SELA-handoff.md         ← 新增（給 Kit Claude 升 Kit 用）
├── index.html              ← 版號 V3.0.0
└── lung/
    ├── index.html          ← SYSTEM_VERSION V3.0.0、MODULE_VERSION V1.11.0
    ├── patient.html
    ├── edu-pro.html
    ├── edu-patient.html
    ├── drugs-pro.html
    └── drugs-patient.html
```

---

## V2.13.0 — 2026-06-01
**健保條文大對齊（依《健保第 9 章 1150522 版》+《附件 2 修訂對照表 115/5/1 生效》）**

Sela 上傳健保條文檔案後對照發現一連串「NCCN Cat 1 ≠ 健保給付」的誤標。修了 V2.10.0/V2.11.0 把術後鞏固藥當作健保給付的 bug。

### 三大關鍵修正

**1. 術後鞏固藥（Osimertinib / Alectinib / Atezolizumab）標示由 NHI → SELF**

| 藥物 | 之前標示 | 修正後 | 健保條文依據 |
|------|---------|--------|------------|
| Osimertinib 術後鞏固（ADAURA, IB-IIIA EGFR+） | NHI | SELF | 9.80：只給第一線 IIIB/IIIC/IV + 第二線 T790M，**無術後鞏固** |
| Alectinib 術後鞏固（ALINA, IB-IIIA ALK+） | NHI | SELF | 9.60：只給 ALK 陽性晚期 NSCLC 第一線，**無術後鞏固** |
| Atezolizumab IMpower010 鞏固（II-IIIA PD-L1≥1%） | NHI（未標） | SELF | 9.69：鞏固限 durvalumab 用於 CCRT 後，**無 IMpower010** |

**2. KRAS G12C 標靶（Sotorasib）— 確認健保完全未給付**

條文 1150522 第 9 章 + 115/5/1 修訂對照表完全沒列 Sotorasib。之前 note 寫「健保事審」會讓人誤以為事審就有，改成「健保未給付，自費；NCCN Cat 2A 後線推薦」。

**3. Amivantamab 對齊 9.126 — 限 EGFR exon 20 ins 第一線併用化療**

條文 9.126：「與 carboplatin 及 pemetrexed 併用，適用於罹患帶有 EGFR exon 20 插入突變之局部晚期或轉移性 NSCLC 的成人病人，作為第一線治療」。之前寫「Osimertinib 失敗後可用」是錯的 — MARIPOSA-2 後線健保未給付。

### Durvalumab 鞏固條件補完整

依 9.69-(2)-I.（115/2/1 條文）：

| 條件 | 之前 | 修正後 |
|------|------|--------|
| III 期不可切除 | 未列 | ✓ 加入 |
| CCRT 後無 PD | ✓ | ✓ |
| PD-L1 ≥1% | ✓ | ✓ |
| EGFR/ALK/ROS-1 原生型（非鱗）/ EGFR/ALK 原生型（鱗狀）| 未列 | ✓ 加入 |
| 至多 12 個月 | ✓ | ✓ |

### 新增 Nivolumab entry — 115/6/1 NSCLC 術前輔助（CheckMate 816 健保新增）

條文 9.69-1-(2)-I（115/6/1 條文新增）：
- 限可切除（腫瘤 ≥4cm 或 N1/N2 排除 N3、M0）、不具 EGFR/ALK
- 非鱗：與 pemetrexed + 含鉑化療併用
- 鱗狀：與含鉑化療併用
- 至多 3 個療程

### 條文編號對齊（多項修正）

| 藥物 | 之前 nhi_ref | 修正後 |
|------|--------------|--------|
| Osimertinib | 9.5.1 / 9.5.2 | 9.80 |
| Alectinib | 9.5.3 | 9.60 |
| Ceritinib | 9.5.3 | 9.59 |
| Lorlatinib | 9.5.3 | 9.81 |
| Brigatinib | 9.5.3 | 9.82 |
| Crizotinib | 9.5.3 / 9.5.4 | 9.50（113/9/1 後 ALK 新案改用其他 ALK TKI）|
| Entrectinib | 9.5.4 | 9.50（與 Crizotinib 擇一）|
| Dabrafenib + Trametinib | 9.5.5 | 9.91-4 |
| Afatinib | 9.5.1 | 9.45 |
| Sotorasib | 健保給付狀態變動快 | 健保未給付（自費）|
| Amivantamab | 部分適應症給付 | 9.126（健保事審；限 EGFR exon 20 ins 第一線併用化療）|

### 測試

5 個 postOp 情境（NSCLC_NS pIB/pIIB EGFR、pIIB ALK、pIIIA EGFR、pIIIA NONE）所有 3 個鞏固藥 → nhi=SELF ✓；DRUGS.KRAS.nhi=SELF ✓；CONSOLIDATION note 5 項條件齊全 ✓；KRAS warns 含自費 ✓；postOp EARLY warns 含術後鞏固自費提醒 ✓。

---

## V2.12.0 — 2026-06-01
**醫護版加化療前 B/C 肝篩檢 + 修總覽未完成清單把「依需要」誤列入未完成的 bug**

Sela 個管師驗收測 V2.11.0 後回報兩個問題：
1. 化療前需必加 B/C 肝病毒篩檢（化療會誘發 B 肝再活化），B 肝陽性者需轉腸胃科開預防性 NA 藥物
2. 「依需要」項目（支氣管鏡、縱膈腔鏡、心臟超音波）誤列入總覽「尚有 N 項未完成」紅 X 清單，個管師永遠看到「未完成」狀態

### CK 加兩項

| ID | 項目 | req | 觸發條件 |
|----|------|-----|----------|
| c40 | B/C 肝病毒篩檢（HBsAg、anti-HBc、anti-HCV） | `chemo` | SCLC 全期 + NSCLC IB+ |
| c41 | B 肝陽性者轉腸胃科預防性藥物（Entecavir / Tenofovir） | `opt` | 依需要勾選（c40 結果陽性才用得到）|

`isItemRequired` 加 `'chemo'` 條件：SCLC 一律 true、NSCLC stage≥IB true（IA 期通常觀察不化療）。NSCLC_NS IA1 病人不會出現 c40，IIB 之後會。

### 修總覽未完成清單

**Bug**：line 3217 `basicTotal = CK_BASIC.length` 用全部（含 opt）、line 3235 `allReq = [...CK_BASIC, ...advReq]` 把所有 basic 倒進去未完成清單。

**修法**：
- 渲染總覽：`basicReq = CK_BASIC.filter(c=>c.req!=='opt')`、`allReq = [...basicReq, ...advReq]`
- basic 頁面 progress bar (`updateBasicCKBar`)：只算必要項目
- basic 頁面 tab 計數 (`renderBasicCK`)：顯示「8/8」而非「8/11」
- opt 完成 bonus：basic 與 adv 的 opt 完成都納入「✚ 另完成 N 項選擇性檢查」

### 測試

10 情境（NSCLC_NS/SQ + SCLC × IA1-IVB）全綠：

| 情境 | c40 必要？ |
|------|-----------|
| NSCLC_NS IA1 / IA2 | false（IA 期不化療）|
| NSCLC_NS IB / IIA / IIB / IIIA / IVA | true |
| NSCLC_SQ IIA | true |
| SCLC IA1 / IIIB / IVA | true（SCLC 全期）|

「依需要」basic 項目（c7 支氣管鏡、c9 縱膈腔鏡、c36 心臟超音波）永遠 `isItemRequired=false`；勾 5 個 opt 後 ckRemain 不變。

---

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
