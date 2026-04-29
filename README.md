# Cancer Navigation V2.8.9 — 彰濱秀傳癌症中心

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
