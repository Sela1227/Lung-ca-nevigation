# 臨床路徑 vs NCCN 差異比對

**比對版本**：Cancer Navigation V3.9.4 / lung V1.19.4
**NCCN 依據**：NSCLC **Version 8.2026**（2026/09/11）、SCLC **Version 1.2027**
**健保依據**：全民健康保險藥品給付規定 第 9 節（115/8/21）
**日期**：2026-09-17

> **先說一件事**：先前幾版我在 CLAUDE.md 與程式註解裡寫的是「NCCN 3.2026」。專案內的檔案實際是 **NSCLC 8.2026 / SCLC 1.2027**，中間有五個版次的更新（含多項新藥與新適應症）。以下差異即以最新版比對。

---

## 差異總表

| # | 區塊 | 嚴重度 | 差異摘要 |
|---|---|---|---|
| G-01 | 分子標記涵蓋範圍 | **高** | 系統缺 RET / NTRK / HER2(ERBB2)；醫護版**有收集但被映射成 EGFR_OTHER** |
| G-02 | EGFR classic 第一線 | **高** | 缺 NCCN 三個 category 1 preferred 之二（Osimertinib+化療、Lazertinib+Amivantamab） |
| G-03 | 少見型 EGFR（G719X/S768I/L861Q） | **高** | NCCN 有明確首選（afatinib 或 osimertinib），系統只寫「個別評估」 |
| G-04 | 術後輔助 — RET | 中 | NCCN 新增 Selpercatinib（IB–IIIA RET+，category 1），系統無 |
| G-05 | 術後輔助 — 免疫 | 中 | 系統只有 Atezolizumab；NCCN 另有 Pembrolizumab（category 1）及術前用藥的術後接續 |
| G-06 | 圍手術期（perioperative） | 中 | 系統只有「術前」單點，無「術前＋術後同一 ICI 接續」的概念 |
| G-07 | SCLC 後線 | **高** | NCCN 新列 Tarlatamab 為 category 1 preferred，系統只有 Topotecan |
| G-08 | 不可切除 II 期鞏固 | 低 | NCCN 的 Durvalumab 鞏固亦涵蓋不可切除**第二期**，系統只做第三期 |
| G-09 | ROS1 後線 | 低 | NCCN 8.2026 新增 Zidesamtinib，系統無 |
| G-10 | 鱗狀癌分子檢測 | 中 | NCCN 建議**所有**轉移性鱗狀癌都做分子檢測，系統的檢測建議偏向非鱗狀 |

---

## G-01　分子標記涵蓋範圍（最該優先處理）

### NCCN 怎麼說

> 廣泛分子檢測應涵蓋所有經典可用藥標記：**ALK、BRAF、EGFR、ERBB2(HER2)、KRAS、METex14 skipping、NTRK1/2/3、RET、ROS1**

並明確要求：第一線免疫治療前應先取得上述標記結果；若有可用藥的 driver，應優先用標靶而非免疫。

### 系統現況

| 標記 | 民眾版 | 醫護版收集 | 進入決策 |
|---|---|---|---|
| EGFR（ex19／L858R／ex20） | ✅ | ✅ | ✅ |
| ALK、ROS1、BRAF、MET、KRAS | ✅ | ✅ | ✅ |
| **RET** | ❌ | ✅ | ❌ |
| **NTRK** | ❌ | ✅ | ❌ |
| **HER2 (ERBB2)** | ❌ | ✅ | ❌ |

### 而且這不只是「少了選項」

醫護版的 `mutEnumForRules()` 只認 `ros1／braf／met／kras`，**RET、NTRK、HER2 陽性會落到 `return 'EGFR_OTHER'`** —— 也就是一位 RET 融合陽性的病人，在共用規則層裡會被當成「少見型 EGFR」處理。這是程式缺陷，不只是內容缺漏。

### 建議

1. 民眾版 Q4 補 RET／NTRK／HER2 三個選項
2. `mutEnumForRules()` 補對應（避免誤落 EGFR_OTHER）
3. 決策分支補三者的第一線用藥（需團隊核定藥名與健保狀態）

---

## G-02　EGFR classic 第一線

### NCCN 8.2026（preferred、category 1，三者並列）

1. **Osimertinib 單藥**
2. **Osimertinib ＋ (carboplatin 或 cisplatin)/pemetrexed**（限非鱗狀，FLAURA2）
3. **Lazertinib ＋ Amivantamab**（MARIPOSA）

其餘（afatinib、dacomitinib、erlotinib、gefitinib、lazertinib 單藥）屬「特定情況下有用」。

### 系統現況

六藥並列擇一：Osimertinib、Gefitinib、Erlotinib、Afatinib、Dacomitinib、Aumolertinib —— **沒有優先層級**，也**沒有 FLAURA2 與 MARIPOSA 兩個組合**。

### 落差性質

- 系統的六藥清單是依**健保給付**建立的（健保第一線這六藥擇一、不得互換），這在台灣是正確的
- 但 NCCN 把 osimertinib 單藥與另外兩個組合列為同級首選，而系統完全沒提到那兩個組合的存在

### 建議

保留健保六藥為主體，另加一行「國際指引另有 Osimertinib＋化療、Lazertinib＋Amivantamab 兩種組合（台灣健保目前未給付此組合用法）」。**是否呈現、如何措辭，建議團隊決定。**

---

## G-03　少見型 EGFR（G719X／S768I／L861Q）

### NCCN 8.2026

> Panel 建議 **afatinib 或 osimertinib 為首選第一線**；dacomitinib、erlotinib、gefitinib 為其他建議選項。適用 PS 0–4。

並指出：afatinib 對某些位點（如 G719X）可能更有效，osimertinib 對 L861Q 這類「classical-like」較適合。

### 系統現況

顯示「第一線：用藥需個別評估」，**不列任何藥名**（V3.9.3 為了解決語意不一致而改）。

### 落差

NCCN 其實給了明確首選，系統卻什麼都不給。**但健保條文的措辭不一致**（見下），因此這是「指引有、給付未必有」的典型情況：

| 藥品 | 健保條文的基因條件 |
|---|---|
| Gefitinib（9.24）、Erlotinib（9.29）、Afatinib（9.45） | 具有 **EGFR-TK 基因突變**（未限次型） |
| Dacomitinib（9.83）、Osimertinib（9.80）、Aumolertinib（9.138） | 限 **Exon 19 Del 或 L858R** |

### 建議

依 NCCN 呈現 afatinib／osimertinib 為首選，但標註「健保條文中 afatinib 未限次型、osimertinib 限 ex19／L858R」。**此項與待核定文件的 C5 為同一件事，一併決定。**

---

## G-04　術後輔助 — RET（NCCN 新增）

### NCCN 8.2026（NSCL-E，Version 6.2026 新增）

> **Selpercatinib**（用於 stage IB–IIIA、RET 融合陽性之已切除 NSCLC）（**category 1**）

### 系統現況

術後追加治療只有 Osimertinib（EGFR）、Alectinib（ALK）、Atezolizumab（免疫）。**無 RET 分支**（且如 G-01，系統根本接不到 RET）。

---

## G-05　術後輔助 — 免疫

### NCCN 8.2026

| 藥品 | 條件 |
|---|---|
| Atezolizumab | ≥4cm 或 node-positive，IB–IIIA／IIIB(T2–T3,N2b;T4,N2)，**曾接受術後化療**，PD-L1 ≥1%，無 EGFR／ALK（category 1） |
| **Pembrolizumab** | 同上分期條件、曾接受術後化療、無 EGFR／ALK（category 1）；**PD-L1 <1% 的效益未明** |
| Pembrolizumab（39 週） | 曾接受術前化療＋Pembrolizumab（category 1） |
| Durvalumab | 曾接受術前化療＋Durvalumab（category 1） |
| Nivolumab | 曾接受術前化療＋Nivolumab（category 1） |

### 系統現況

只有 Atezolizumab，且條件寫「II 期以上、PD-L1 ≥1%、已完成含鉑化療」。

### 落差

1. 缺 Pembrolizumab 這個 category 1 選項
2. 缺「**術前用了哪個 ICI，術後就接續同一個**」的規則 —— NCCN 明訂 *perioperative ICI 應視為同一療程、不建議中途換藥*

---

## G-06　圍手術期（perioperative）的概念

### NCCN 8.2026（NSCL-E 一般原則）

> 圍手術期 ICI 治療原則上應**視為單一療程**，**不建議更換 ICI 藥物**。

系統 V3.9.4 已建立術前輔助（依健保 nivolumab），但**術前與術後是兩段各自獨立的呈現**，沒有「術前用了 A，術後就該接 A」的連動。

### 建議

在治療進度（Q5）增加「術前已做過免疫合併化療」的選項，術後追加治療即據此呈現同一藥的接續。

---

## G-07　SCLC 後線（差距最大的一項）

### NCCN SCLC 1.2027

> Panel 建議 **Tarlatamab-dlle（10 mg）為 category 1、preferred 的後線治療**

第三期試驗：tarlatamab 相較化療顯著延長存活（中位 OS **13.6 vs 8.3 個月**），且 Grade ≥3 不良事件較低（54% vs 80%），但**細胞激素釋放症候群達 56%**，需要特殊處置流程。

其他後線選項：Irinotecan（preferred）、Lurbinectedin、Topotecan、含鉑再挑戰等。

### 系統現況

SCLC 二線只有 **Topotecan** 一項。

### 建議

補 Tarlatamab 與 Lurbinectedin，並標註健保狀態（健保第 9 章未見 tarlatamab，**需確認**）。CRS 風險與處置需求，建議在醫護版標示。

---

## G-08　不可切除第二期的 Durvalumab 鞏固

### NCCN 8.2026

> NCCN Panel 亦建議 Durvalumab 作為**不可切除第二期** NSCLC（PS 0–1、definitive CCRT 後未惡化）的鞏固免疫治療選項。

### 系統現況

鞏固治療只掛在 `stageCat === 'LOCAL'`（第三期）；**不可切除的第二期不會顯示**。

### 附帶：健保條文寫的是「第三期局部晚期」

因此這是「NCCN 有、健保沒有」的情況，建議標示為臨床可考慮但健保不符。

---

## G-09　ROS1 後線（NCCN 8.2026 新增）

Version 7.2026 起，ROS1 後線新增 **Zidesamtinib**（腦部病灶為 preferred）；並註明 repotrectinib／taletrectinib／zidesamtinib 可用於 G2032R 等抗藥突變。

系統的 ROS1 路徑為「第一線口服 ROS1 標靶 → 抗藥或多線失敗後接續化療」，**無抗藥後的標靶選項**。

---

## G-10　鱗狀癌的分子檢測建議

### NCCN 8.2026

> Panel 建議**所有**轉移性鱗狀細胞癌病人都可考慮分子檢測，不限於「不吸菸、小切片、混合組織型」這些特定族群。

### 系統現況

檢測建議（`buildGeneTestAdvice`）的鱗狀晚期組確實有列 EGFR／ALK／ROS1，方向正確；但費用標示為自費，且措辭偏向「由醫師評估是否需要」，未傳達 NCCN 的「建議所有人都考慮」。

---

## 沒有差異的部分（確認相符）

| 項目 | 確認 |
|---|---|
| III 期 EGFR ex19／L858R → CRT 後 Osimertinib 鞏固 | ✅ 相符（V3.6.2 建立） |
| III 期 driver 陰性 → CRT 後 Durvalumab（不受 PD-L1 限制為 NCCN 立場；健保另有 ≥1% 要求） | ✅ 相符，且系統標示了健保條件 |
| 同步化放療處方依組織型態（非鱗含 Pemetrexed、鱗狀不含） | ✅ 相符（V3.8.4 修正） |
| LS-SCLC CCRT 後 Durvalumab 鞏固、最長 24 個月、**PCI 應在鞏固之前** | ✅ 相符（V3.6.2 建立，時序正確） |
| ES-SCLC 腦轉移的處理時序（依症狀決定先放療或先化療） | ✅ 相符 |
| EGFR 第一線已用 Osimertinib 者，T790M 不得再建議換 Osimertinib | ✅ 相符（V3.7.4 修正） |
| EGFR exon20 → Amivantamab＋化療 | ✅ 相符 |
| 術前輔助的資格條件 | ✅ 依健保 115/6/1 實作（NCCN 另有 pembrolizumab／durvalumab 圍手術期方案，見 G-06） |

---

## 建議處理順序

| 順序 | 項目 | 理由 |
|---|---|---|
| 1 | **G-01** 分子標記涵蓋（含 mutEnumForRules 的映射缺陷） | 這是程式缺陷不只是內容缺漏；RET 病人目前會被當成少見型 EGFR |
| 2 | **G-07** SCLC 後線 Tarlatamab | category 1 preferred，且 OS 差距顯著（13.6 vs 8.3 個月） |
| 3 | **G-03／G-02** EGFR 少見型與 classic 第一線的呈現 | 與待核定 C5 同一件事，可一併決定 |
| 4 | **G-05／G-06** 術後免疫與圍手術期連動 | 需先增加「術前用過哪個 ICI」的輸入 |
| 5 | G-04、G-08、G-09、G-10 | 內容補充，影響人數較少 |

---

## 兩點提醒

**一、NCCN 與健保是兩套標準，本系統同時服務兩者。**
上述多項（G-02、G-04、G-07、G-08、G-09）是「NCCN 有、台灣健保未必給付」。系統目前的做法是**臨床建議與健保狀態分兩行陳述**（V3.9.0 起），建議新增內容時延續此原則，不要因為健保沒給付就整項隱藏 —— 那會讓病人失去與醫師討論的機會。

**二、藥名與適應症需團隊核定後才實作。**
本報告只做「有／沒有」的比對，不自行決定要不要加、怎麼寫。特別是 tarlatamab（CRS 56%，需特殊處置流程）與圍手術期 ICI 接續規則，涉及院內是否具備條件。

---

**填表人**：_______________　**日期**：_______________
