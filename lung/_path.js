/* ═══════════════════════════════════════════════════════════════
   _path.js — 民眾版肺癌治療路徑決策引擎（V3.6.0 抽出共用）

   由 lung/patient.html（查詢工具）與 lung/edu-patient.html（掃 QR 衛教頁）
   共用同一份。此前兩邊各維護一份平行邏輯，已分叉三次：
     BUG-56 (PD-L1 未同步) / BUG-67 (QR stageCat) / 審稿發現的術後提醒殘留

   介面：所有函式吃顯式 state 物件（不依賴全域 S），欄位：
     { type, stageCat, stage, mut, pdl1, brainMet, postOp, txProgress }
   呼叫端各自把自己的資料轉成這個形狀：
     patient.html → S 本身
     edu-patient.html → QR payload 轉出來的物件

   ⚠️ V3.6.0 是「純抽取」：內容 1:1 來自 patient.html（canonical），
      行為不變；edu 端因此收斂到 patient（消除分叉）。臨床修正另版處理。
   ═══════════════════════════════════════════════════════════════ */

const DRUGS = {
  EGFR: {line:'一線標靶', nhi:'NHI', list:[
    {n:'Osimertinib',z:'泰格莎'},{n:'Gefitinib',z:'艾瑞莎'},
    {n:'Erlotinib',z:'得舒緩'},{n:'Afatinib',z:'妥復克'},
    {n:'Dacomitinib',z:'肺欣妥'}],
    note:'五藥擇一。Dacomitinib 限無腦轉移。'},
  EGFR_BRAIN: {line:'一線（合併）', nhi:'NHI', list:[{n:'Erlotinib + Bevacizumab',z:'得舒緩 + 癌思停'}],
    note:'限 EGFR L858R 突變且有腦轉移。健保有給付，需事前審查。'},
  ALK: {line:'一線標靶', nhi:'NHI', list:[
    {n:'Alectinib',z:'安立適'},{n:'Lorlatinib',z:'瘤利欣'},
    {n:'Ceritinib',z:'立克癌'},{n:'Brigatinib',z:'癌倍利'},
    {n:'Crizotinib',z:'截克瘤'}],
    note:'五藥擇一。'},
  ROS1: {line:'一線標靶', nhi:'NHI', list:[{n:'Crizotinib',z:'截克瘤'},{n:'Entrectinib',z:'羅思克'}],
    note:'擇一。'},
  BRAF: {line:'二線（含鉑後）', nhi:'NHI', list:[{n:'Dabrafenib + Trametinib',z:'泰伏樂 + 麥欣寧'}],
    note:'限 BRAF V600E 基因突變且第一線化療失敗後使用。健保第二線給付。'},
  MET: {line:'不分線', nhi:'NHI', list:[{n:'Tepotinib',z:'特癌適'}],
    note:'限 MET 基因 exon 14 跳躍突變。健保有給付，需事前審查。'},
  KRAS: {line:'二線', nhi:'SELF', list:[{n:'Sotorasib',z:'魯瑪克拉斯'}],
    note:'限 KRAS G12C 基因突變。健保未給付，需自費。'},
  NS_PDL1H: {line:'一線（免疫+化療）', nhi:'NHI', list:[
    {n:'Pembrolizumab + Pemetrexed + 鉑類',z:'吉舒達 + 愛寧達 + 鉑類'},
    {n:'Atezolizumab + Bevacizumab + Carboplatin + Paclitaxel',z:'癌自禦 + 癌思停 + 鉑類 + 紫杉醇'}],
    note:'非鱗狀，原生型，PD-L1 ≥ 50%。'},
  NS_PDL1L: {line:'一線（化療±免疫）', nhi:'NHI', list:[
    {n:'Pemetrexed + Carboplatin/Cisplatin',z:'愛寧達 + 鉑類雙藥'},
    {n:'± Pembrolizumab',z:'± 吉舒達'}],
    note:'非鱗狀原生型。'},
  SQ_PDL1H: {line:'一線（免疫+化療）', nhi:'NHI', list:[{n:'Pembrolizumab + Carboplatin + Paclitaxel',z:'吉舒達 + 鉑類 + 紫杉醇'}],
    note:'鱗狀，原生型，PD-L1 ≥ 50%。'},
  SQ_PDL1L: {line:'一線（化療±免疫）', nhi:'NHI', list:[
    {n:'Carboplatin + Paclitaxel',z:'鉑類 + 紫杉醇'},
    {n:'± Pembrolizumab',z:'± 吉舒達'}],
    note:'鱗狀原生型。'},
  // V3.6.2: III 期不可切除、CCRT 後的鞏固治療分兩條（NCCN 3.2026 NSCL-F）：
  //   EGFR ex19del/L858R → Osimertinib；其餘（driver 陰性）→ Durvalumab（明確排除 EGFR ex19del/L858R）
  CONSOLID_OSI: {line:'同步化放療後鞏固（EGFR 陽性）', nhi:'NHI', list:[{n:'Osimertinib',z:'泰格莎'}],
    note:'限 EGFR exon19 缺失或 L858R 突變、第三期無法手術切除、同步化放療後病情穩定者，口服至疾病惡化。'},
  CONSOLIDATION: {line:'同步化放療後鞏固', nhi:'NHI', list:[{n:'Durvalumab',z:'抑癌寧'}],
    note:'限第三期無法手術切除、同步化放療後病情穩定、且 PD-L1 表現 ≥1%、未帶有 EGFR/ALK/ROS-1 等驅動基因者，可用至 12 個月（健保條件）。'},
  SCLC_ES: {line:'一線', nhi:'NHI', list:[
    {n:'Atezolizumab + Carboplatin + Etoposide',z:'癌自禦 + 鉑類 + 滅必治'},
    {n:'Durvalumab + Etoposide + Cisplatin/Carboplatin',z:'抑癌寧 + 滅必治 + 鉑類'}],
    note:'限無腦/脊髓轉移，健保事審。'},
  SCLC_LS_CCRT: {line:'侷限期同步化放療', nhi:'NHI', list:[{n:'Cisplatin + Etoposide + 胸部放射線治療',z:'鉑類 + 滅必治 + 放射線治療'}],
    note:''},
  SCLC_2L: {line:'二線', nhi:'NHI', list:[{n:'Topotecan',z:'喜樹鹼'}],
    note:'含鉑治療後復發使用。'},
};

function mutDisplay(m){
  // V3.6.1: NEG=確認無驅動基因、PENDING=尚未檢測（皆不顯示為「陽性基因」）
  return ({EGFR:'EGFR(+)',EGFR_CLASSIC:'EGFR ex19/L858R(+)',EGFR_EX20:'EGFR exon20 ins(+)',ALK:'ALK(+)',ROS1:'ROS1(+)',BRAF:'BRAF(+)',MET:'MET(+)',KRAS:'KRAS G12C(+)',NONE:''}[m] || '');
}
function pdl1Display(v){ return ({HIGH:'PD-L1≥50%',LOW:'PD-L1<50%'}[v] || ''); }

function buildPathRaw(state){
  const t = state.type, st = state.stageCat, m = state.mut, brain = state.brainMet;
  const postOp = !!state.postOp;

  // V3.6.1: 分期未定 → 不猜早期、不猜侷限期，只導向「先完成分期檢查」
  //   （原本按「不知道 TNM」會被設成 EARLY，等於直接給早期治療建議；
  //     且 stage='' 又讓基因檢測建議判成晚期 → 同畫面自相矛盾）
  if(st === 'UNKNOWN') return buildUnknownStagePath(t, state);

  
  // V2.11.0: 復發 → 走 META 邏輯（不論原 stageCat）
  if(postOp && state.txProgress === 'recurrence'){
    return buildRecurrencePath(t, m, brain, state);
  }

  // V2.10.0: postOp 分支 — 已手術，跳過手術建議直接走術後輔助 + 鞏固 + 追蹤
  if(postOp && (st==='EARLY' || st==='LOCAL' || st==='META')){
    return buildPostOpPath(t, st, m, brain, state.stage, state);
  }

  return buildPathCore(state);
}

function buildPathCore(state){
  const t = state.type, st = state.stageCat, m = state.mut, brain = state.brainMet;
  // SCLC special
  if(t==='SCLC'){
    if(st==='META'){
      // 擴散型
      const steps = [];
      const warns = ['SCLC 進展快，建議盡早展開治療'];
      // 依腦/脊髓轉移調整第一線
      if(brain==='no'){
        steps.push({ title:'第一線：化療 + 免疫治療', line:DRUGS.SCLC_ES.line, nhi:'NHI', drugs: DRUGS.SCLC_ES.list, note: DRUGS.SCLC_ES.note });
      } else if(brain==='yes'){
        steps.push({ title:'第一線：化療（免疫不適用）', line:'一線', nhi:'NHI',
          drugs:[{n:'Cisplatin/Carboplatin + Etoposide',z:'鉑類 + 滅必治'}],
          note:'有腦/脊髓轉移者免疫不在健保給付範圍。' });
        steps.push({ title:'腦轉移處理：依症狀決定放療時機', line:'並行',
          note:'有症狀或大病灶：先放療再化療；無症狀小病灶：先化療同時 MRI 監測。' });
        warns.push('腦轉移使免疫治療不適用，預後相對較差');
      } else {
        // unknown
        steps.push({ title:'第一線：化療為基礎，是否加免疫須先確認腦影像', line:'一線', nhi:'NHI',
          drugs: DRUGS.SCLC_ES.list,
          note:'已排除腦/脊髓轉移可加免疫；否則先化療等影像。' });
        warns.push('建議先做腦 MRI 再決定是否加免疫');
      }
      // PCI 鞏固
      if(brain==='yes'){
        steps.push({ title:'已有腦轉移：不做預防性腦部照射', line:'追加治療', note:'已有腦轉移時，改為針對病灶的治療性放療。' });
      } else if(brain==='no'){
        steps.push({ title:'治療反應佳後：腦部 MRI 監測 或 預防性腦部照射', line:'追加治療', note:'擴散期預防性腦部照射對存活的助益不明確；多數醫院改用每 3 個月腦部 MRI 追蹤。' });
      } else {
        steps.push({ title:'治療反應佳後依腦影像決定追加治療', line:'追加治療', note:'先做腦部 MRI 確認沒有轉移；若陰性可選 MRI 監測 或 預防性腦部照射。' });
      }
      steps.push({ title:'治療失敗或復發後：接續化療（第二線）', line:DRUGS.SCLC_2L.line, nhi:'NHI', drugs: DRUGS.SCLC_2L.list, note: DRUGS.SCLC_2L.note });

      return {
        stageTxt:'小細胞肺癌 擴散型', pwTxt: brain==='yes' ? '以化療為主 + 放療控制腦病灶' : '全身性化療搭配免疫治療',
        steps, warns,
      };
    }
    if(st==='EARLY' || st==='LOCAL'){
      // 侷限型
      const steps = [
        { title:'同步化放療 — 主要治療', line:DRUGS.SCLC_LS_CCRT.line, nhi:'NHI', drugs: DRUGS.SCLC_LS_CCRT.list, note: DRUGS.SCLC_LS_CCRT.note },
        { title:'極早期（T1-2 N0）可考慮先手術切除', line:'替代方案', note:'肺葉切除 + 淋巴結廓清；術後追加化療。' },
      ];
      // PCI 依 brainMet
      if(brain==='yes'){
        steps.push({ title:'已有腦轉移：不做預防性腦部照射', line:'追加治療', note:'已有腦轉移時，改為針對病灶的治療性放療。' });
      } else if(brain==='no'){
        steps.push({ title:'治療反應佳者：預防性腦部照射', line:'追加治療', note:'可顯著降低腦轉移風險。' });
      } else {
        steps.push({ title:'治療反應佳者：可考慮預防性腦部照射', line:'追加治療', note:'評估前需先做腦部 MRI 確認沒有腦轉移。' });
      }
      // V3.6.2: 同步化放療後無惡化者，加免疫鞏固（NCCN 2.2026 依 ADRIATIC，category 1，至多 24 個月）
      //   PCI 若要做，應在鞏固治療之前 → 故此步排在 PCI 之後
      steps.push({ title:'同步化放療後病情未惡化者:免疫鞏固治療', line:'鞏固治療', nhi:'SELF',
        drugs:[{n:'Durvalumab',z:'抑癌寧'}],
        note:'同步化放療結束、病情沒有惡化時使用，可延長存活，最長 24 個月。若要做預防性腦部照射，一般安排在鞏固治療之前。' });
      const warns = ['若年紀較大或體力較差：同步化放療負擔重，可改成分開做（先化療再放療）'];
      warns.push('侷限期的免疫鞏固治療（Durvalumab）目前台灣健保尚未給付此適應症，需自費或申請藥廠資源，可與主治醫師討論');
      if(brain==='yes') warns.push('已有腦轉移：屬擴散期，治療策略需修正');
      return { stageTxt:'小細胞肺癌 侷限型', pwTxt:'以同步化放療為主，之後視情況加免疫鞏固', steps, warns };
    }
    return { stageTxt:'小細胞肺癌', pwTxt:'依分期決定方向',
      steps:[{ title:'請先完成完整影像檢查（CT、腦 MRI、骨掃描）', note:'分期確認後才能決定治療。' }],
      warns:['SCLC 進展較快，請盡早回診確認分期'] };
  }

  // NSCLC
  const isNS = (t==='NSCLC_NS');
  const typeLabel = isNS ? '非小細胞肺癌（非鱗狀）' : (t==='NSCLC_SQ' ? '非小細胞肺癌（鱗狀）' : '肺癌');

  if(st==='EARLY'){
    // V3.0.1: 細分 IA 與 IB+ 期別差異（病人語言）
    const stage = state.stage || '';
    // V3.6.4: 用「所有可能分期」判定，簡易模式 T1N0M0（IA1–IA3）也能正確走 IA 分支
    const isIA = definitelyStage(state, /^IA/);
    const steps = [
      { title:'手術切除是主要治療', line:'主要治療', note:'肺葉切除 + 縱膈淋巴結廓清。極早期 T1a/T1b 可考慮節段切除。' },
      { title:'不適合手術時：立體定位放射線治療 (SBRT)', line:'替代手術', note:'限早期、周邊型病灶。' },
    ];
    // II-IIIA 才看到術前輔助；IA 不顯示（資訊跟病人無關）
    if(!isIA){
      steps.push({ title:'部分 II 期可切除者：術前可先做化療或加免疫', line:'術前輔助', note:'術前免疫合併化療目前健保尚未給付，需自費或臨床試驗。' });
    }
    // 術後輔助化療：IA 期不需要（觀察為主），II 期或高風險 IB 才推
    if(!isIA){
      steps.push({ title:'術後輔助化療（II 期或高風險 IB）', line:'術後輔助', nhi:'NHI', drugs:[
          {n:'Cisplatin + Vinorelbine',z:'鉑類 + 溫諾平'},
          ...(isNS ? [{n:'Cisplatin + Pemetrexed（非鱗狀）',z:'鉑類 + 愛寧達'}] : []),
        ],
        note:'4 個療程。' });
    }
    // 術後鞏固藥：IA 期不推（ADAURA/ALINA 適用 IB-IIIA），IB+ 才列為「擇一」候選
    if(!isIA && isNS){
      steps.push({ title:'術後追加治療：依基因檢測結果擇一', line:'術後追加治療（擇一）', nhi:'SELF', drugs:[
          {n:'Osimertinib（EGFR 陽性者，至多 3 年）',z:'泰格莎'},
          {n:'Alectinib（ALK 陽性者，至多 2 年）',z:'安立適'},
        ],
        note:'手術後若做基因檢測發現 EGFR 或 ALK 陽性，可考慮口服標靶藥延長無復發時間。目前健保未給付術後追加治療，需自費或申請藥廠資源。' });
    }

    const warns = [];
    if(isIA){
      warns.push('IA 期復發風險低，多數情況觀察追蹤即可');
      warns.push('若病理發現高風險因子（淋巴血管/臟層肋膜侵犯），需與主治討論是否加術後化療');
    } else {
      warns.push('IB 期若有腫瘤 ≥4cm、血管侵犯、臟層肋膜侵犯等高風險因子，建議做術後化療');
      // V3.0.7: 「建議做基因檢測」已由總覽頁基因檢測卡片涵蓋，這裡不重複
    }
    return {
      stageTxt:`${typeLabel} 早期 (I-II)`,
      pwTxt: isIA ? '以手術切除為主，術後規律追蹤' : '手術切除為主，視期別決定是否加術後化療與追加治療',
      steps, warns,
    };
  }

  if(st==='LOCAL'){
    // V3.0.4 BUG-38: IIIA vs IIIB/IIIC 細分 — 只有 IIIA 部分可切除，IIIB/IIIC 通常不可切除
    const stage = state.stage || '';
    const isIIIA = definitelyStage(state, /^IIIA$/);   // V3.6.4: 確定是 IIIA 才提可切除選項
    const steps = [
      { title:'同步化放療 — 主要治療', line:'主要治療', nhi:'NHI', drugs:[
          {n:'Cisplatin + Etoposide + 胸部放射線治療',z:'鉑類 + 滅必治 + 放射線治療'},
          {n:'Carboplatin + Paclitaxel + 胸部放射線治療',z:'鉑類 + 紫杉醇 + 放射線治療'}],
        note:'化療與放射線治療同時進行 4-6 個療程。' },
    ];
    // V3.6.2: 鞏固治療依驅動基因真正分流（原本一律列 Durvalumab、只在 EGFR+ 時補一句警語）
    const isEgfrClassic = (m === 'EGFR' || m === 'EGFR_CLASSIC');
    const isOtherDriver = ['ALK','ROS1','BRAF','MET','EGFR_EX20'].includes(m);
    if(isEgfrClassic){
      steps.push({ title:'同步化放療結束後病情穩定者:口服標靶維持治療', line:DRUGS.CONSOLID_OSI.line, nhi:'NHI',
        drugs: DRUGS.CONSOLID_OSI.list, note: DRUGS.CONSOLID_OSI.note });
    } else if(isOtherDriver){
      steps.push({ title:'同步化放療結束後:維持治療需個別評估', line:'維持治療',
        note:'帶有驅動基因者，同步化放療後的免疫維持治療通常不適用；EGFR exon19/L858R 以外的驅動基因目前沒有標準的維持治療，請與主治醫師個別討論。' });
    } else {
      steps.push({ title:'同步化放療結束後病情穩定者:免疫維持治療', line:'維持治療', nhi:'NHI',
        drugs: DRUGS.CONSOLIDATION.list, note: DRUGS.CONSOLIDATION.note });
    }
    if(isIIIA){
      steps.push({ title:'可切除型 IIIA:先手術 + 術後輔助治療', line:'替代方案', note:'淋巴結轉移範圍小或腫瘤位置合適時可考慮先手術；多處淋巴轉移或大腫瘤通常先做同步化放療。' });
      if(isNS){
        steps.push({ title:'IIIA 開刀切除後依基因檢測結果擇一', line:'術後追加治療（擇一）', nhi:'SELF', drugs:[
          {n:'Osimertinib（EGFR 陽性者）',z:'泰格莎'},
          {n:'Alectinib（ALK 陽性者）',z:'安立適'},
        ], note:'若開刀後做基因檢測發現 EGFR 或 ALK 陽性，可考慮口服標靶藥延長無復發時間。目前健保未給付術後追加治療，需自費或申請藥廠資源。' });
      }
    }
    const warns = [
      '若年紀較大或體力較差:同步化放療負擔重，可改成分開做（先化療再放療）',
      (isEgfrClassic
        ? '您帶有 EGFR 突變:同步化放療後的維持治療用口服標靶藥（Osimertinib），不是免疫治療 — 免疫維持治療的條件明確排除 EGFR exon19/L858R'
        : '免疫維持治療有條件限制:需第三期無法手術切除、同步化放療後病情穩定、無 EGFR/ALK/ROS-1 等驅動基因、PD-L1 ≥1%，至多 12 個月'),
      '建議診斷時即做 EGFR、ALK、PD-L1 等基因與免疫指標檢測',
    ];
    // V3.6.2: EGFR classic 已在上面直接分流到 Osimertinib，這裡只提醒「其他驅動基因」
    if(isOtherDriver){
      warns.unshift('您帶有 ' + (mutDisplay(m) || '驅動基因') + '：同步化放療後的免疫維持治療通常不適用（此類藥物排除帶有驅動基因者），維持治療請與主治醫師個別討論');
    }
    if(!isIIIA){
      warns.unshift((state.stage || state.stageLabel || 'III') + ' 期腫瘤範圍較廣（涉及 T4 或多處淋巴轉移），一般不建議先手術，以同步化放療為主' + (isEgfrClassic ? '，之後接口服標靶維持' : isOtherDriver ? '，之後的維持治療需個別評估' : '，之後接免疫維持治療'));
    }
    return {
      stageTxt:`${typeLabel} 局部晚期 (III)`,
      // V3.6.2: 主結論隨鞏固分流變化（原本一律寫「免疫維持」，跟 EGFR 分流自相矛盾）
      pwTxt: isEgfrClassic ? '以同步化放療為主，治療結束後接口服標靶維持治療'
           : isOtherDriver ? '以同步化放療為主，治療結束後的維持治療需個別評估'
           : '以同步化放療為主，治療結束後再用免疫維持治療',
      steps, warns,
    };
  }

    if(st==='META'){
    let steps = [];
    let warns = [];
    if(m==='EGFR_EX20'){
      // V3.6.2: exon20 插入突變的第一線與 classic EGFR 完全不同（一般 EGFR TKI 反應率低）
      steps = [
        { title:'第一線：Amivantamab + 化療', line:'一線', nhi:'NHI',
          drugs:[{n:'Amivantamab + Carboplatin + Pemetrexed',z:'瑞普替 + 鉑類 + 愛寧達'}],
          note:'EGFR exon20 插入突變適用的第一線組合（健保 114/10/1 起給付，需事前審查）。' },
        { title:'病情惡化後：化療或臨床試驗', line:'接續治療', note:'exon20 插入突變的後線選擇較少，可與醫師討論臨床試驗機會。' },
      ];
      warns.push('EGFR exon20 插入突變:一般常用的 EGFR 口服標靶藥（如泰格莎、艾瑞莎）對這型效果不佳，第一線用的是不同的藥');
    } else if(m==='EGFR' || m==='EGFR_CLASSIC'){
      steps = [
        { title:'第一線：口服 EGFR 標靶藥', line:DRUGS.EGFR.line, nhi:'NHI', drugs: DRUGS.EGFR.list, note: DRUGS.EGFR.note },
        { title:'若是 L858R 突變且有腦轉移：可加 Bevacizumab 合併方案', line:DRUGS.EGFR_BRAIN.line, nhi:'NHI', drugs: DRUGS.EGFR_BRAIN.list, note: DRUGS.EGFR_BRAIN.note },
        { title:'病情惡化時：做抗藥基因檢測', line:'惡化後評估', note:'若第一線用的不是 Osimertinib，且檢測發現抗藥基因，可換成 Osimertinib 繼續治療。' },
        { title:'若 Osimertinib 也失效：接續化療搭配免疫治療', line:'接續治療', nhi:'NHI', drugs:[
            {n:'Pemetrexed + Carboplatin/Cisplatin',z:'愛寧達 + 鉑類'}],
          note:'非鱗狀標準接續方案。少數帶有特殊 EGFR exon 20 突變的病人，第一線可用 Amivantamab 合併化療（健保有給付）；其他情況使用 Amivantamab 通常需自費。' },
      ];
    } else if(m==='ALK'){
      steps = [
        { title:'第一線：口服 ALK 標靶藥', line:DRUGS.ALK.line, nhi:'NHI', drugs: DRUGS.ALK.list, note: DRUGS.ALK.note },
        { title:'若產生抗藥性：換接續 ALK 標靶藥', line:'接續治療', note:'Lorlatinib 可用於其他 ALK 標靶失敗後。' },
        { title:'多線標靶失敗後：接續化療', line:'接續治療', nhi:'NHI', drugs:[{n:'Pemetrexed + Carboplatin',z:'愛寧達 + 鉑類'}], note:'非鱗狀標準接續方案。' },
      ];
    } else if(m==='ROS1'){
      steps = [
        { title:'第一線：口服 ROS1 標靶藥', line:DRUGS.ROS1.line, nhi:'NHI', drugs: DRUGS.ROS1.list, note: DRUGS.ROS1.note },
        { title:'若產生抗藥性或多線失敗：接續化療', line:'接續治療', nhi:'NHI', drugs:[{n:'Pemetrexed + Carboplatin',z:'愛寧達 + 鉑類'}], note:'' },
      ];
    } else if(m==='BRAF'){
      steps = [
        { title:'第一線：含鉑類化療', line:'一線', nhi:'NHI', drugs:[{n:'Pemetrexed + Carboplatin（非鱗狀）',z:'愛寧達 + 鉑類'}], note:'鱗狀者改用紫杉醇 + 鉑類。' },
        { title:'第二線（化療失敗後）：口服 BRAF 雙標靶', line:DRUGS.BRAF.line, nhi:'NHI', drugs: DRUGS.BRAF.list, note: DRUGS.BRAF.note },
      ];
    } else if(m==='MET'){
      steps = [
        { title:'標靶：口服 MET 抑制劑', line:DRUGS.MET.line, nhi:'NHI', drugs: DRUGS.MET.list, note: DRUGS.MET.note },
        { title:'若無法用標靶：含鉑化療搭配免疫治療', line:'替代方案', nhi:'NHI', drugs:[{n:'Pemetrexed + Carboplatin ± Pembrolizumab',z:'愛寧達 + 鉑類 ± 吉舒達'}], note:'' },
      ];
    } else if(m==='KRAS'){
      steps = [
        { title:'第一線：含鉑化療搭配免疫治療', line:'一線', nhi:'NHI', drugs:[{n:'Pemetrexed + Carboplatin + Pembrolizumab',z:'愛寧達 + 鉑類 + 吉舒達'}], note:'KRAS G12C 病人的免疫指標多偏高，對免疫治療反應通常較佳。' },
        { title:'第二線：口服 KRAS G12C 標靶', line:DRUGS.KRAS.line, nhi:'SELF', drugs: DRUGS.KRAS.list, note: DRUGS.KRAS.note },
      ];
      warns.push('KRAS G12C 口服標靶藥（Sotorasib）目前健保未給付，需自費');
    } else if(m !== 'NEG'){
      // V3.6.1: 驅動基因「尚未檢測 / 等報告」(PENDING)、未填、或舊 QR 的 'NONE'
      //   → 一律先完成分子檢測，**不得**進入 driver-negative 的免疫決策。
      //   （原本 NONE 把「未驗」跟「確認陰性」當同一種，未驗 + PD-L1 高會直接被導向免疫單藥）
      steps = [
        { title:'第一步：先完成驅動基因檢測', line:'前置檢查', note:'EGFR、ALK、ROS1、BRAF、MET、KRAS 等（NGS 可一次涵蓋）+ PD-L1 免疫指標。' },
        { title:'等報告期間：可先用化療控制', line:'一線', nhi:'NHI', drugs: isNS ? [{n:'Pemetrexed + Carboplatin/Cisplatin',z:'愛寧達 + 鉑類'}] : [{n:'Carboplatin + Paclitaxel',z:'鉑類 + 紫杉醇'}], note:'體力狀況允許時，可先化療爭取時間。' },
        { title:'報告出來後：依結果決定個人化治療', line:'後續', note:'有驅動基因 → 用標靶；確認無驅動基因且 PD-L1 高 → 才考慮免疫治療。' },
      ];
      warns.push('驅動基因檢測尚未完成：治療方向要等報告才能決定，請盡快完成檢測');
      if(state.pdl1 === 'HIGH'){
        warns.push('您的 PD-L1 偏高，但在驅動基因報告出來前，先不宜直接決定用免疫治療 — 若同時帶有驅動基因，第一線仍以標靶藥為主');
      }
    } else {
      // V3.6.1: 已確認無驅動基因（NEG）→ 才依 PD-L1 免疫指標決定
      const pdl1 = state.pdl1;
      if(pdl1==='HIGH'){
        const k = isNS ? 'NS_PDL1H' : 'SQ_PDL1H';
        steps = [
          { title:'第一線（首選）：免疫治療單藥', line:'一線', nhi:'NHI', drugs:[{n:'Pembrolizumab',z:'吉舒達'}], note:'無驅動基因且免疫指標（PD-L1）≥50% 時，可不加化療。' },
          { title:'第一線（合併）：免疫治療 + 化療', line:DRUGS[k].line, nhi:'NHI', drugs: DRUGS[k].list, note:'腫瘤負擔較重或有症狀者可加化療快速控制。' },
          { title:'病情惡化後：化療接續治療或加做完整基因檢測', line:'接續治療', note:'透過完整基因檢測（NGS）找其他可治療的突變。' },
        ];
      } else if(pdl1==='LOW'){
        const k = isNS ? 'NS_PDL1L' : 'SQ_PDL1L';
        steps = [
          { title:'第一線：化療搭配免疫治療', line:DRUGS[k].line, nhi:'NHI', drugs: DRUGS[k].list, note: DRUGS[k].note },
          { title:'病情惡化後：接續化療或加做完整基因檢測', line:'接續治療', note:'透過完整基因檢測找其他可治療的突變。' },
        ];
      } else {
        // V3.6.1: 已確認無驅動基因，但 PD-L1 未驗 → 補驗 PD-L1 才能決定免疫
        steps = [
          { title:'建議補驗 PD-L1 免疫指標', line:'前置檢查', note:'已確認無驅動基因，PD-L1 高低會決定要不要加免疫治療。也可加做 NGS 找較少見的基因。' },
          { title:'等檢測報告期間：可先用化療', line:'一線', nhi:'NHI', drugs: isNS ? [{n:'Pemetrexed + Carboplatin/Cisplatin',z:'愛寧達 + 鉑類'}] : [{n:'Carboplatin + Paclitaxel',z:'鉑類 + 紫杉醇'}], note:'' },
          { title:'依檢測結果決定個人化治療', line:'後續', note:'有基因突變 → 用標靶；免疫指標高 → 用免疫治療搭配化療。' },
        ];
        warns.push('PD-L1 免疫指標會影響能不能用免疫治療，建議補驗');
      }
    }
    // V3.4.0: 驅動基因陽性 + PD-L1 也高 → 提醒仍以標靶優先（免疫對驅動基因陽性者效果較差）
    if(['EGFR','ALK','ROS1','BRAF','MET'].includes(m) && state.pdl1==='HIGH'){
      warns.push('您的 PD-L1 偏高，但因帶有 ' + mutDisplay(m) + ' 驅動基因，第一線仍以標靶藥為主（驅動基因陽性者用免疫治療效果通常較差）');
    }
    return { stageTxt:`${typeLabel} 轉移期 (IV)`, pwTxt:'依基因檢測結果與免疫指標選擇個人化治療', steps, warns };
  }

  return { stageTxt: typeLabel + '（分期待定）', pwTxt:'請先完成完整分期檢查',
    steps:[{ title:'與主治醫師討論完整分期計畫（CT、PET、腦 MRI）', note:'分期確認後才能個人化治療。' }],
    warns:['未明確分期前的建議僅供參考'] };
}

function buildPostOpPath(t, st, m, brain, stageIn, state){
  const isNS = (t==='NSCLC_NS');
  const isSQ = (t==='NSCLC_SQ');
  const isNSCLC = (isNS || isSQ);
  const isSC = (t==='SCLC');
  const typeLabel = isNS ? '非小細胞肺癌（非鱗狀）'
                  : isSQ ? '非小細胞肺癌（鱗狀）'
                  : isSC ? '小細胞肺癌' : '肺癌';
  const stage = stageIn || '';
  // V3.6.4: 病理簡易模式 pT1N0M0 也是確定 IA，用 contract 判定
  const isIA = definitelyStage(state, /^IA/);

  // 共用：開頭已完成手術 step
  const surgeryStep = { title:'已完成：手術切除', line:'已完成', phase:'surgery',
    note:(isNSCLC ? '肺葉切除 + 縱膈淋巴結廓清。' : '原發病灶切除。') };

  // ── SCLC 術後（罕見，僅 T1-2N0 偶有手術） ──
  if(isSC){
    const steps = [surgeryStep];
    steps.push({ title:'術後輔助化療：Cisplatin + Etoposide', line:'術後輔助', phase:'adjuvant_chemo', nhi:'NHI',
      drugs:[{n:'Cisplatin + Etoposide',z:'鉑類 + 滅必治'}],
      note:'4 個療程。SCLC 即使早期切除，仍建議全身性化療鞏固。' });
    if(st==='LOCAL' || st==='EARLY'){
      steps.push({ title:'若病理發現 N(+)：加縱膈放療', line:'術後鞏固', phase:'consolidation',
        note:'術前未預期到的淋巴結轉移建議加放療。' });
    }
    if(brain==='no'){
      steps.push({ title:'治療反應佳：預防性腦部照射 或 腦部 MRI 監測', line:'追加治療', phase:'consolidation',
        note:'近年多數醫院改採每 3 個月腦部 MRI 監測，預防性腦部照射仍為選項。' });
    } else if(brain==='yes'){
      steps.push({ title:'已有腦轉移：改用治療性放療（針對病灶）', line:'追加治療', phase:'consolidation',
        note:'有腦轉移時不適用預防性腦部照射，改做治療性放療直接針對病灶。' });
    } else {
      steps.push({ title:'術後評估追加治療方式', line:'追加治療', phase:'consolidation',
        note:'先做腦部 MRI 確認沒有轉移；若陰性可選預防性腦部照射 或 MRI 監測。' });
    }
    steps.push({ title:'規律追蹤：前 2 年每 3 個月做電腦斷層、之後每 6 個月', line:'術後追蹤', phase:'followup',
      note:'前 2 年復發風險高；含胸部電腦斷層與必要時腦部 MRI。5 年後改每年。' });
    return { stageTxt:'小細胞肺癌（術後）', pwTxt:'術後輔助化療 + 追加治療 + 規律追蹤',
      steps, warns:['小細胞肺癌即使切除，全身性復發風險高，請務必完成輔助化療'] };
  }

  // ── NSCLC META post-op：罕見（如寡轉移切除） ──
  if(st==='META'){
    return {
      stageTxt:`${typeLabel} 轉移期（術後）`,
      pwTxt:'已切除原發/寡轉移，仍以全身性治療為主',
      steps:[
        surgeryStep,
        // V2.11.0: 寡轉移切除後的「下一步主治療」標 adjuvant_chemo phase
        // (語意：剛開完刀後的第一步主治療；對應 just_op 時進「下一步」區)
        { title:'寡轉移切除後仍須全身性治療', line:'主要治療', phase:'adjuvant_chemo',
          note:'切除原發或單一轉移病灶不等於根治，仍需全身性藥物控制。' },
        { title:'依基因 / PD-L1 結果決定第一線', line:'一線', phase:'consolidation',
          note:'EGFR/ALK/ROS1/BRAF/MET → 標靶；PD-L1 高 → 免疫 ± 化療；NONE → 化療 ± 免疫。' },
        { title:'每 2-3 個月影像追蹤', line:'術後追蹤', phase:'followup',
          note:'CT 每 2-3 個月，必要時加腦 MRI 與骨掃描。' },
      ],
      warns:[
        '轉移期切除多為寡轉移特殊情況，治療以全身性為主',
        '請與主治醫師確認術後系統性治療計畫',
      ],
    };
  }

  // ── NSCLC EARLY postOp (Stage I-II 切除) — V2.11.0 細分 IA vs IB+/II ──
  if(st==='EARLY'){
    const steps = [surgeryStep];
    if(isIA){
      // IA 期：觀察為主
      steps.push({ title:'以規律追蹤為主', line:'術後追蹤', phase:'adjuvant_chemo',
        note:'IA 期復發風險低，多數情況觀察追蹤即可。除非病理發現高風險因子（淋巴血管/臟層肋膜侵犯、低分化），否則不需化療。' });
      // IA 不再推「標靶鞏固非主流適應症」這個 step（資訊太細，IA 病人不需要看到）
    } else {
      // IB / IIA / IIB：明確推化療
      steps.push({ title:'術後輔助化療（II 期或高風險 IB）', line:'術後輔助', phase:'adjuvant_chemo', nhi:'NHI',
        drugs:[
          {n:'Cisplatin + Vinorelbine',z:'鉑類 + 溫諾平'},
          ...(isNS ? [{n:'Cisplatin + Pemetrexed（非鱗狀）',z:'鉑類 + 愛寧達'}] : []),
        ],
        note:'4 個療程。IB 期若有腫瘤 ≥4cm、血管/臟層肋膜/淋巴管侵犯等高風險因子建議化療；II 期一律建議。' });

      // V3.0.1: 三個術後追加藥合成單一「擇一」step，避免病人誤以為要全用
      // V3.6.2: 術後免疫（Atezolizumab）的適應症是「切除 + 完成含鉑化療」後的 II–IIIA 且 PD-L1≥1%，
      //   **IB 不在適應症內** — 原本對所有非 IA 一律列出，會讓 IB 病人以為自己可以用
      // V3.6.4: 保守判定 — 只要「有可能是 IB」就不列（IB 不在術後免疫適應症內）；
      //   完全沒有分期資訊時也不列，交由醫師依實際期別評估
      const atezoEligible = stagesOf(state).length > 0 && !possiblyStage(state, /^IB$/);
      const atezoDrug = {n:'Atezolizumab（II 期以上、PD-L1 ≥1%、已完成含鉑化療者可考慮）',z:'癌自禦'};
      if(isNS){
        steps.push({ title:'術後追加治療：依基因檢測結果擇一', line:'術後追加治療（擇一）', phase:'consolidation', nhi:'SELF',
          drugs:[
            {n:'Osimertinib（EGFR 陽性者，至多 3 年）',z:'泰格莎'},
            {n:'Alectinib（ALK 陽性者，至多 2 年）',z:'安立適'},
            ...(atezoEligible ? [atezoDrug] : []),
          ],
          note:'手術後若做基因檢測發現 EGFR 或 ALK 陽性，可考慮口服標靶藥' + (atezoEligible ? '；若為 II 期以上、PD-L1 ≥1% 且已完成含鉑化療，也可考慮免疫治療' : '（IB 期不在術後免疫治療的適應症內）') + '。一個病人通常只會用一種，依檢測結果決定。目前健保未給付術後追加治療，需自費或申請藥廠資源。' });
      } else if(atezoEligible){
        // 鱗狀只剩 Atezolizumab 選項
        steps.push({ title:'術後追加治療：免疫治療', line:'術後追加治療', phase:'consolidation', nhi:'SELF',
          drugs:[atezoDrug],
          note:'II 期以上、PD-L1 ≥1% 且已完成含鉑化療者可考慮。目前健保未給付術後追加治療，需自費。' });
      }
    }
    steps.push({ title:'規律追蹤：前 2 年每 3-6 個月做電腦斷層', line:'術後追蹤', phase:'followup',
      note:'前 2 年每 3-6 個月、3-5 年每 6 個月、5 年後每年。每年 1 次胸部低劑量電腦斷層。' });

    const warns = [];
    if(isIA){
      warns.push('IA 期切除復發風險低，請務必依時程回診追蹤');
      warns.push('若病理發現高風險因子（淋巴血管/臟層肋膜侵犯），需與主治討論是否加輔助化療');
    } else {
      warns.push('II 期或高風險 IB：請務必完成 4 個療程術後輔助化療');
      // V3.0.7: 「建議做基因檢測」已由總覽頁基因檢測卡片涵蓋，這裡不重複
      warns.push('術後追加治療目前健保未給付，需自費或申請藥廠資源（每位病人通常只用一種）');
    }
    if(!isNS && !isIA) warns.push('鱗狀肺癌目前無口服標靶追加治療藥物，以化療搭配免疫為主');
    return {
      stageTxt:`${typeLabel} 早期 (I-II) — 術後`,
      pwTxt: isIA ? '規律追蹤為主' : '術後輔助治療 + 規律追蹤',
      steps, warns,
    };
  }

  // ── LOCAL post-op (Stage III 切除，多為 IIIA 可切除型) ──
  if(st==='LOCAL'){
    const steps = [surgeryStep];
    steps.push({ title:'術後輔助化療（標準 4 療程）', line:'術後輔助', phase:'adjuvant_chemo', nhi:'NHI',
      drugs:[
        {n:'Cisplatin + Vinorelbine',z:'鉑類 + 溫諾平'},
        ...(isNS ? [{n:'Cisplatin + Pemetrexed（非鱗狀）',z:'鉑類 + 愛寧達'}] : []),
      ],
      note:'III 期切除後標準 4 個療程。' });
    steps.push({ title:'若手術邊緣有殘留腫瘤或多處淋巴轉移：加術後放療', line:'術後放療', phase:'consolidation',
      note:'切緣陽性或腫瘤未完全切除建議加胸部放療；單處淋巴轉移視情況決定。' });
    // V3.0.1: 三個術後追加藥合成單一「擇一」step
    if(isNS){
      steps.push({ title:'術後追加治療：依基因檢測結果擇一', line:'術後追加治療（擇一）', phase:'consolidation', nhi:'SELF',
        drugs:[
          {n:'Osimertinib（EGFR 陽性者，至多 3 年）',z:'泰格莎'},
          {n:'Alectinib（ALK 陽性者，至多 2 年）',z:'安立適'},
          {n:'Atezolizumab（免疫指標 PD-L1 ≥1% 可考慮）',z:'癌自禦'},
        ],
        note:'手術後若做基因檢測發現 EGFR 或 ALK 陽性，可考慮口服標靶藥；若 PD-L1 ≥1% 也可考慮免疫治療。一個病人通常只會用一種，依檢測結果決定。目前健保未給付術後追加治療，需自費或申請藥廠資源。' });
    } else {
      steps.push({ title:'術後追加治療：免疫治療', line:'術後追加治療', phase:'consolidation', nhi:'SELF',
        drugs:[{n:'Atezolizumab（免疫指標 PD-L1 ≥1% 可考慮）',z:'癌自禦'}],
        note:'若 PD-L1 ≥1% 可考慮免疫治療。目前健保未給付術後追加治療，需自費。' });
    }
    steps.push({ title:'規律追蹤：前 2 年每 3 個月做電腦斷層', line:'術後追蹤', phase:'followup',
      note:'III 期復發風險較高 — 前 2 年每 3 個月、3-5 年每 6 個月、5 年後每年。' });

    const warns = [
      'III 期切除復發風險高於 I-II 期，請務必完成術後輔助治療與規律追蹤',
      '建議手術後完成 EGFR、ALK、PD-L1 等檢測，決定後續追加治療',
      '術後追加治療目前健保未給付，需自費或申請藥廠資源（每位病人通常只用一種）',
    ];
    if(!isNS) warns.push('鱗狀肺癌目前無口服標靶追加治療藥物');
    return {
      stageTxt:`${typeLabel} 局部晚期 (III) — 術後`,
      pwTxt:'術後輔助化療 + 標靶/免疫鞏固 + 密集追蹤',
      steps, warns,
    };
  }

  // fallback（理論上不會進來）
  return { stageTxt:`${typeLabel}（術後）`, pwTxt:'術後追蹤',
    steps:[surgeryStep, { title:'與主治醫師討論術後輔助治療計畫', phase:'consolidation', note:'依最終病理分期決定。' }],
    warns:[] };
}

function buildRecurrencePath(t, m, brain, state){
  // 暫存並強制以 META 跑（不污染 S）
  const oldStageCat = state.stageCat;
  const oldPostOp = state.postOp;
  state.stageCat = 'META';
  state.postOp = false;
  let r;
  try { r = buildPathCore(state); }
  finally { state.stageCat = oldStageCat; state.postOp = oldPostOp; }

  // 開頭插「之前治療已完成」
  const surgeryDone = { title:'前次治療：手術切除 + 後續輔助治療已完成', line:'前次治療', phase:'surgery',
    note:'前次手術與術後輔助治療已完成，目前評估為復發或惡化。' };

  // 後續 step 全標 recurrence phase（讓三區呈現時都進「下一步」）
  // V3.0.1: 復發路徑替換「第一線」→「復發後接續治療」措辭，避免病人困惑
  for(const s of r.steps){
    if(!s.phase) s.phase = 'recurrence';
    if(s.title){
      s.title = s.title
        .replace(/^第一線：/, '復發後接續治療（第一順位）：')
        .replace(/^第二線：/, '復發後接續治療（第二順位）：')
        .replace(/^第二線（化療失敗後）：/, '復發後接續治療（化療失敗後）：');
    }
  }
  // 結尾加追蹤 step（標 followup phase → 進「之後」區）
  r.steps.push({
    title:'治療中規律影像追蹤',
    line:'追蹤',
    phase:'followup',
    note:'復發後每 2-3 個月做電腦斷層，依治療反應調整療程；必要時加腦部 MRI 或骨掃描。',
  });
  r.steps = [surgeryDone, ...r.steps];
  // V3.0.1: stageTxt 修順 — 之前 pIIIA 跟 IV 混在一起讓病人困惑（「我是 IIIA 還是 IV？」）
  const typeStr = (t==='NSCLC_NS') ? '非小細胞肺癌（非鱗狀）'
                : (t==='NSCLC_SQ') ? '非小細胞肺癌（鱗狀）'
                : (t==='SCLC') ? '小細胞肺癌' : '肺癌';
  r.stageTxt = `${typeStr} 術後復發 — 接續全身性治療`;
  r.pwTxt = '以全身性治療為主，依基因檢測結果與免疫指標選擇個人化方案';
  r.warns.unshift('已確認復發或惡化：請盡快回診，重做基因檢測與完整影像評估');
  return r;
}

/* ═══ V3.6.1: 分期未定路徑 ═══
   資料不足以判定治療方向時的唯一正確輸出：告訴病人還缺什麼、該做什麼，
   不提供任何治療建議（避免誤導）。                                   */
function buildUnknownStagePath(t, state){
  const typeLabel = (t==='NSCLC_NS') ? '非小細胞肺癌（非鱗狀）'
                  : (t==='NSCLC_SQ') ? '非小細胞肺癌（鱗狀）'
                  : (t==='SCLC') ? '小細胞肺癌' : '肺癌';
  const need = (state && state.stageNeed && state.stageNeed.length) ? state.stageNeed : null;
  const steps = [
    { title:'第一步：完成分期檢查', line:'前置檢查', phase:'surgery',
      note:'胸部電腦斷層（CT）、正子攝影（PET-CT）、腦部核磁共振（MRI）與病理切片報告，是判定期別的依據。' },
    { title:'第二步：回診由主治醫師確認期別', line:'前置檢查', phase:'surgery',
      note: need ? ('目前還需要確認：' + need.join('、')) : '主治醫師會依檢查結果告訴您正式的 T、N、M 與期別。' },
    { title:'第三步：知道期別後再回來查詢', line:'後續', phase:'followup',
      note:'期別確定後，這個工具才能給您對應的治療方向。' },
  ];
  return {
    stageTxt: `${typeLabel} — 期別尚未確定`,
    pwTxt: '目前資料不足以判定治療路徑，請先完成分期檢查',
    steps,
    warns: ['期別是決定治療方向的關鍵：同樣的肺癌，早期以手術為主、晚期以藥物為主，差別很大，所以在期別確定前不提供治療建議'],
    unknownStage: true,
  };
}

/* ═══ V3.6.3: 個人狀況修飾層（年齡 / 體力 / B 肝 / 重大傷病）═══
   從 patient.html 與 edu-patient.html 各自一份抽出共用（原本 edu 只有 age/ecog、
   沒有 B 肝與重大傷病提醒 → 掃 QR 會少東西）。

   設計原則（審稿意見）：年齡與體力是 **treatment fitness modifier**，
   不該凌駕驅動基因、治療目的等真正的決策因素。所以只加註、不覆寫主結論。   */
function applyModifiers(r, state){
  if(!r) return r;
  applyAgeEcog(r, state);
  applyHbvCatastrophic(r, state);
  return r;
}

function hasChemoStep(r){
  return (r.steps || []).some(s => {
    const t = s.title || '';
    if(/(化療|同步化放療|含鉑|鉑類|Cisplatin|Carboplatin|Etoposide|Pemetrexed|Paclitaxel)/.test(t)) return true;
    if(s.drugs && s.drugs.some(d => /Cisplatin|Carboplatin|Etoposide|Pemetrexed|Paclitaxel|化療|鉑類/.test((d.n||'')+(d.z||'')))) return true;
    return false;
  });
}

function applyAgeEcog(r, state){
  if(!r || (!state.age && !state.ecog)) return;
  // V3.6.5: 期別未定時不給任何治療建議，也就不該出現治療強度的調整提醒
  if(r.unknownStage) return;
  const elderly = state.age === 'ge70';
  const ps2  = state.ecog === '2';
  const ps34 = state.ecog === '34';
  // V3.6.3: 帶驅動基因者，即使體力較差仍可能適合口服標靶（不可被「支持療法」蓋掉）
  const driverPositive = ['EGFR','EGFR_CLASSIC','EGFR_EX20','ALK','ROS1','BRAF','MET','KRAS'].includes(state.mut);

  for(const step of r.steps){
    const title = step.title || '';
    const hasChemo = /(化療|同步化放療|含鉑|鉑類|Cisplatin|Carboplatin)/.test(title) ||
                     (step.drugs && step.drugs.some(d=>/Cisplatin|Carboplatin|Etoposide|Pemetrexed|Paclitaxel|化療|鉑類/.test(d.n||'')));
    const hasCCRT = /同步化放療/.test(title);
    const note = step.note || '';
    const adjs = [];
    if(elderly && hasChemo) adjs.push('您 ≥70 歲：化療鉑類可考慮改用副作用較輕的碳鉑（由醫師評估腎功能等條件後決定）');
    if(ps2 && hasCCRT)      adjs.push('您體力狀況中等：同步化放療負擔較重，可與醫師討論改成分開做（先化療再放療）');
    if(ps34 && hasChemo)    adjs.push('您體力狀況較差：化療需與主治醫師審慎評估');
    if(adjs.length) step.note = note + (note ? '　/　' : '') + '【依您狀況】' + adjs.join('；');
  }

  // V3.6.5: 全域警語也要看路徑裡「真的有沒有這個治療」，否則 IA 只做手術的病人
  //   也會看到「化療用藥可能調整」、「同步化放療可以分開做」
  const pathHasChemo = hasChemoStep(r);
  const pathHasCCRT  = (r.steps || []).some(s => /同步化放療/.test(s.title || ''));
  if(elderly && pathHasChemo) r.warns.unshift('您 ≥70 歲：化療用藥可能調整（如改用碳鉑），由醫師依腎功能與整體狀況決定');
  if(ps2 && pathHasCCRT)      r.warns.unshift('您體力狀況中等：同步化放療可與醫師討論改成分開做（先化療再放療）');
  else if(ps2 && pathHasChemo) r.warns.unshift('您體力狀況中等：化療強度可能調整，由醫師評估');
  if(ps34){
    if(pathHasChemo || driverPositive){
      r.warns.unshift(driverPositive
        ? '您體力狀況較差：化療負擔重，但帶有驅動基因者口服標靶藥通常仍可考慮，請與主治醫師討論'
        : '您體力狀況較差：治療強度需與醫師審慎評估，症狀控制與支持性照護同樣重要');
    }
  }
  // V3.6.3: 不再覆寫 pwTxt。體力狀況是調整治療強度的因素，不該蓋掉依分期與基因決定的治療方向
  //   （原本 PS 3-4 會把主結論改成「以支持療法為主」，跟下面列的標靶治療自相矛盾）
}

function applyHbvCatastrophic(r, state){
  if(!r) return;
  const hasChemo = hasChemoStep(r);
  // V3.6.3: B 肝與 C 肝分開 — 治療前預防性抗病毒藥的規範是針對 B 肝（HBsAg / anti-HBc），
  //   不能把 C 肝一起套用（審稿意見）
  if(state.hbv === 'yes' && hasChemo){
    r.warns.push('您有 B 型肝炎（帶原或曾感染）：開始治療前請先與醫師確認是否需要預防性抗病毒藥，避免治療期間病毒活躍傷肝');
  } else if(state.hbv === 'unknown' && hasChemo){
    r.warns.push('開始治療前建議先驗 B 型肝炎（HBsAg、anti-HBc、anti-HBs）；若為帶原或曾感染，需先安排預防性抗病毒藥');
  }
  if(state.catastrophic === 'no'){
    r.warns.push('肺癌可申請重大傷病證明，減免部分醫療費用，請儘早向醫院申請');
  }
}
