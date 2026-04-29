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
VERSION="2.8.4"
NAME="Cancer Navigation V${VERSION}"
WORK="/home/claude/work"

rm -rf "${WORK}" && mkdir -p "${WORK}/${NAME}/lung"
cp portal.html "${WORK}/${NAME}/index.html"
cp lung.html "${WORK}/${NAME}/lung/index.html"
cp edu.html "${WORK}/${NAME}/lung/edu.html"
cp patient.html "${WORK}/${NAME}/lung/patient.html"
cp drugs.html "${WORK}/${NAME}/lung/drugs.html"
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
| 健保藥物總整理頁（V2.8.3+） | `lung/drugs.html` 的 `ALL_DRUGS` 陣列 |
| 民眾版治療路徑邏輯 | `patient.html` 的 `buildPath()` 函式 |
| 民眾版 TNM 計算（V2.8.0+） | `patient.html` 的 `computeAJCC()` 與 `stageToCategory()` |
| 民眾版 TNM 簡化/進階按鈕組 | `patient.html` 第 250 行 `#p-q2` 區塊 + `pickTNM()` / `toggleTNMMode()` |
| 民眾版藥物視覺樣式（V2.8.0+） | `patient.html` CSS 的 `.tx-drugs-box` / `.tx-drug-en` / `.tx-drug-zh` |
| 民眾版照護團隊名單（V2.8.2+） | `patient.html` 的 `TEAM` 物件（從 `lung.html` `CFG.team.depts` 手動同步）|
| 民眾版 QR 內容 | `patient.html` 的 `buildQRPayload()` 函式 |
| QR 編碼方式（V2.8.3+） | `patient.html` 的 `openQR()` 函式（用 qrcode-generator + UTF-8 byte mode）|
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
| V2.8.4 | V1.6.4 | 2026-04-29 | Portal 8 癌別圖示全改 inline SVG（脫離 FA）+ 跑遍 200 組合找出並修 4 個 state 殘留 bug BUG-20、BUG-21 |
| V2.8.3 | V1.6.3 | 2026-04-29 | QR 中文 fail 修復（換 qrcode-generator + UTF-8 byte mode）+ drugs.html 健保藥物總整理頁 BUG-19 |
| V2.8.2 | V1.6.2 | 2026-04-29 | 民眾版補回照護團隊可選（同步 CFG.team.depts）+ QR modal（hero 按鈕觸發）BUG-18 |
| V2.8.1 | V1.6.1 | 2026-04-29 | 民眾版徹底改成真一頁式（100dvh + flex 鎖屏）；header/Q1/Q2/Q3/總覽全面重構排版 BUG-17 |
| V2.8.0 | V1.6.0 | 2026-04-29 | 民眾版 Q2 改 TNM 輸入(簡化+進階) + 藥物視覺從附註升級為主角 BUG-16 |
| V2.7.0 | V1.5.0 | 2026-04-29 | 民眾版重寫(一問一頁) + 健保藥物資料庫整合 + Chart.js 語法錯修復 + rAF 卡頓優化 BUG-14、BUG-15 |

---

## 六、踩過的坑（BUG-01 ~ BUG-21）

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

1. **GitHub Pages 部署實機驗證** — V2.8.4 動了 portal SVG + state reset 邏輯。Sela 應在手機 + iPad + 桌機都試一輪：(a) portal 8 個新 SVG 看起來合理嗎 (b) 民眾流程「往回改」場景：選 NSCLC META EGFR → 返回改 SCLC → QR payload 是不是乾淨的（不該有 EGFR）
2. **Sela 逐條 review drugs.html 的 ALL_DRUGS** — 28 種藥物的中英文藥名、適應症、線數、規範文字
3. 新增第二個癌別（頭頸或食道）— 模板已穩定，可開始；新模組要記得套 V2.8.4 的「改 type 重置下游」reset 規則
4. SCLC 在 patient.html 的 Q2 應該特殊處理 — 民眾選了 SCLC 後 TNM 其實不該照 NSCLC 的方式算（SCLC 用 limited/extensive 二分法）。目前 SCLC 的 EARLY 跟 LOCAL 都會走 `SCLC 侷限期`，UI 上沒問題但概念上 stage 標籤不一致
5. 醫護版列印手冊樣板審視（自從 BUG-11 後沒再大改）

---

## 九、一句話總結

V2.8.4 兩件事：portal 8 癌別圖示改 inline SVG（脫離 FA，重新設計成器官解剖意象）；跑遍 200 個 (type × stageCat × mut) 組合自動化測試找出 4 個 state 殘留 bug 全修。218/218 全綠。下版第一優先還是實機驗收 V2.8.4 + Sela review drugs.html 資料。
