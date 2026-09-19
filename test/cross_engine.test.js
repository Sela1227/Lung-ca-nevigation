/* ═══════════════════════════════════════════════════════════════
   跨引擎一致性測試 — golden cases
   執行：node test/cross_engine.test.js

   背景（外部「路徑漂移複審」P0-01）：臨床路徑長期由三套程式碼平行維護：
     1. lung/_path.js      民眾版 patient / edu-patient
     2. lung/index.html    醫護版 PW / PW_SUMMARY / STAGE_GOALS
     3. lung/edu-pro.html  醫護 QR 自有簡化路徑
   結果是同一病人在不同頁面可能拿到不同治療順序與藥物。

   V3.9.0 的過渡做法：把「會分叉的臨床判斷」抽成 _path.js 的共用規則層，
   三頁都呼叫同一個函式。這支測試就是驗證那件事有沒有真的成立 ——
   對每個 golden case，比對三頁在「關鍵臨床欄位」上是否一致。

   允許各頁用語詳略不同；不允許的是：治療意圖、先後順序、主要藥物類別、
   driver exclusion、健保／自費狀態不一致。
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* 共用規則層直接載入（三頁都應該呼叫它） */
const rulesCtx = { console, JSON, Math, Date, Object, Array, String, Number, RegExp,
  parseInt, parseFloat, isNaN, btoa: global.btoa, atob: global.atob,
  escape: global.escape, unescape: global.unescape,
  encodeURIComponent: global.encodeURIComponent, decodeURIComponent: global.decodeURIComponent };
vm.createContext(rulesCtx);
vm.runInContext(read('lung/_staging.js') + '\n' + read('lung/_path.js'), rulesCtx);
const R = name => (...args) => vm.runInContext(
  `${name}(${args.map(a => JSON.stringify(a)).join(',')})`, rulesCtx);

let pass = 0, fail = 0;
const ok = (cond, label, detail) => {
  if (cond) pass++; else { fail++; console.log(`  ✗ ${label}${detail ? '  → ' + detail : ''}`); }
};
const section = t => console.log('\n── ' + t + ' ──');

/* ═══ 1. 三頁是否都載入共用規則層 ═══ */
section('共用規則層的採用');
[['lung/patient.html','民眾查詢頁'], ['lung/edu-patient.html','民眾 QR'],
 ['lung/index.html','醫護主畫面'], ['lung/edu-pro.html','醫護 QR']].forEach(([f, label]) => {
  ok(read(f).includes('_path.js'), `${label} 載入 _path.js`);
});

/* ═══ 2. 規則層本身：III 期鞏固（golden case 6/7/8）═══ */
section('III 期 CCRT 後鞏固（driver 分流）');
const consol = R('ruleConsolidationIII');
[['EGFR_EX19','osimertinib'], ['EGFR_L858R','osimertinib'],
 ['EGFR_EX20','individual'], ['EGFR_OTHER','individual'],
 ['ALK','individual'], ['ROS1','individual'],
 ['KRAS','durvalumab'], ['NEG','durvalumab'], ['BRAF','durvalumab'], ['MET','durvalumab'],
].forEach(([mut, kind]) => {
  const r = consol(mut);
  ok(r.kind === kind, `${mut} → ${kind}`, r.kind);
});
ok(!/Durvalumab/.test(consol('EGFR_EX19').drug + consol('EGFR_EX19').label),
   'EGFR ex19 的鞏固不得出現 Durvalumab');
ok(/Osimertinib/.test(consol('EGFR_L858R').drug), 'L858R 的鞏固為 Osimertinib');
// V3.9.1（健保 115/8/21 逐字）：非鱗狀需 EGFR/ALK/ROS-1 原生型、鱗狀只需 EGFR/ALK 原生型
ok(consol('ROS1', false).kind === 'individual', '非鱗狀 ROS1(+) → 不符 Durvalumab 條件');
ok(consol('ROS1', true).kind === 'durvalumab', '鱗狀 ROS1(+) → 仍符合 Durvalumab（條文未要求 ROS-1 原生型）');
ok(consol('ALK', true).kind === 'individual' && consol('ALK', false).kind === 'individual',
   'ALK(+) 兩種組織型態都不符 Durvalumab 條件');
ok(/115\/8\/21/.test(consol('NEG', false).note), '健保條件標註條文版本', consol('NEG', false).note.slice(0,40));
// 順序語意：label 必須表達「CCRT 之後」，不可寫成並列選項
['EGFR_EX19','ALK','NEG'].forEach(mut => {
  ok(/CCRT\s*完成|完成.*未惡化/.test(consol(mut).label),
     `${mut} 的鞏固 label 表達「CCRT 完成且未惡化之後」`, consol(mut).label);
});

/* ═══ 3. LS-SCLC 鞏固（golden case 12）═══ */
section('LS-SCLC 鞏固');
const ls = R('ruleLsSclcConsolidation')();
ok(/Durvalumab/.test(ls.drug), 'LS-SCLC 有 Durvalumab 鞏固');
ok(/健保尚未給付|未給付/.test(ls.nhi), '明確標示台灣健保未給付', ls.nhi);
ok(/PCI|腦部照射/.test(ls.note), '說明 PCI 與鞏固的時序', ls.note);
// 三頁都要提到（醫護主畫面、醫護摘要、醫護 QR、民眾引擎）
ok(read('lung/index.html').includes('_lsConsol'), '醫護主畫面使用 LS 鞏固規則');
ok(/免疫鞏固/.test(read('lung/index.html')), '醫護摘要含免疫鞏固');
ok(/免疫鞏固|Durvalumab/.test(read('lung/edu-pro.html')), '醫護 QR 含 LS 鞏固');

/* ═══ 4. ES-SCLC 腦轉移：臨床 vs 健保分開（golden case 14 / C4）═══ */
section('ES-SCLC 腦轉移（臨床與健保分開陳述）');
const esYes = R('ruleEsSclcImmune')('yes');
const esNo  = R('ruleEsSclcImmune')('no');
ok(!!esYes.clinical && !!esYes.nhi, '腦轉移時同時提供臨床與健保兩種說明');
ok(/健保/.test(esYes.nhi) && !/不適用/.test(esYes.clinical),
   '不可把健保限制寫成醫學上不適用', esYes.clinical);
ok(esYes.immuneNhiEligible === false && esNo.immuneNhiEligible === true, '健保資格旗標正確');
// 只檢查實際輸出的字串（註解裡引述舊說法是為了留下脈絡，不算違規）
const pathNoComments = read('lung/_path.js').split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
ok(!/免疫不適用/.test(pathNoComments), '民眾版引擎輸出已移除「免疫不適用」的說法');

/* ═══ 5. 轉移期全身治療不因 M 期別而改變分子分流（golden case 11 / P1-01）═══ */
section('M1a／M1b／M1c 的全身治療一律依分子結果');
const meta = R('ruleMetaSystemic');
['EGFR_EX19','EGFR_L858R','ALK','ROS1','BRAF','MET','KRAS'].forEach(mut => {
  ok(meta(mut, '').kind === 'targeted', `${mut} → 標靶（不論 M1a/b/c）`, meta(mut,'').kind);
});
ok(meta('EGFR_EX20','').kind === 'targeted' && /Amivantamab/.test(meta('EGFR_EX20','').label),
   'EGFR exon20 → Amivantamab，不走一般 EGFR TKI');
ok(meta('NEG','HIGH').kind === 'io', 'driver 陰性 + PD-L1 高 → 免疫');
ok(meta('PENDING','HIGH').kind === 'pending', '未驗 + PD-L1 高 → 先完成檢測（不得逕行免疫）');

/* ═══ 6. 醫護版能否承接 EGFR 次型（P1-03）═══ */
section('醫護版 EGFR 次型');
const proCtx = { console, JSON, Math, Date, Object, Array, String, Number, RegExp, parseInt, parseFloat, isNaN };
vm.createContext(proCtx);
const proJS = read('lung/index.html').match(/<script>([\s\S]*?)<\/script>/g).pop()
  .replace(/^<script>|<\/script>$/g, '');
// 只抽兩個純函式來驗（不需 DOM）
const fnSrc = (proJS.match(/function parseEgfrSubtype\([\s\S]*?\n\}/) || [''])[0]
            + '\n' + (proJS.match(/function mutEnumForRules\([\s\S]*?\n\}/) || [''])[0];
try { vm.runInContext(fnSrc, proCtx); } catch (e) {}
const parseSub = v => { try { return vm.runInContext(`parseEgfrSubtype(${JSON.stringify(v)})`, proCtx); } catch (e) { return 'ERR'; } };
[['Exon 19 del','EGFR_EX19'], ['19del','EGFR_EX19'], ['L858R','EGFR_L858R'],
 ['exon 21 L858R','EGFR_L858R'], ['Exon 20 ins','EGFR_EX20'], ['20ins','EGFR_EX20'],
 ['','EGFR_OTHER'], ['T790M','EGFR_OTHER'],
].forEach(([site, expect]) => ok(parseSub(site) === expect, `位點 "${site}" → ${expect}`, parseSub(site)));
ok(parseSub('') === 'EGFR_OTHER', '位點未填不得被當成 classic（會誤觸 Osimertinib 鞏固）');

/* ═══ 7. 醫護版不再把鞏固寫成 CCRT 的並列選項（P0-02）═══ */
section('醫護版 III 期措辭');
const proHTML = read('lung/index.html');
ok(!/合併化放療 或標靶治療 或免疫治療/.test(proHTML), '已移除「合併化放療 或標靶 或免疫」的並列寫法');
ok(!/同步化放療（CCRT）或標靶治療 或免疫治療/.test(proHTML), '已移除「CCRT 或標靶 或免疫」的並列寫法');
ok(proHTML.includes('_consolIII'), '醫護版 III 期改呼叫共用規則');

/* ═══ 8. 醫護 QR 不再無條件 Durvalumab（P0-02）═══ */
section('醫護 QR 第三期');
const eduProHTML = read('lung/edu-pro.html');
ok(!/items\.push\(\{title:'CCRT 後鞏固', drugs:'Durvalumab'/.test(eduProHTML),
   '已移除無條件的 Durvalumab 鞏固卡片');
ok(eduProHTML.includes('ruleConsolidationIII'), '醫護 QR 改呼叫共用規則');

/* ═══ 9. 內部複審 N-02/N-03/N-04：_path.js 引擎自身的臨床錯誤 ═══ */
section('引擎自身臨床正確性（內部複審新發現）');
const engCtx = { console, JSON, Math, Date, Object, Array, String, Number, RegExp, parseInt, parseFloat, isNaN };
vm.createContext(engCtx);
vm.runInContext(read('lung/_staging.js') + '\n' + read('lung/_path.js'), engCtx);
const runEng = (type, mut, extra) => {
  const st = Object.assign({ type, stageCat:'META', stage:'IVA', possibleStages:['IVA'], mut,
    pdl1:'', t790m:'', brainMet:'', drugOff:[], riskFactors:[], postOp:false, txProgress:'',
    age:'', ecog:'', hbv:'', catastrophic:'' }, extra || {});
  return vm.runInContext(`(function(){var s=${JSON.stringify(st)};var r=buildPathRaw(s);applyModifiers(r,s);return r;})()`, engCtx);
};
const allDrugs = r => (r.steps||[]).reduce((a,s)=>a.concat((s.drugs||[]).map(d=>d.n)),[]).join(' | ');

// N-02：鱗狀癌任一 driver 都不得出現 Pemetrexed
['EGFR_EX19','EGFR_L858R','EGFR_EX20','ALK','ROS1','BRAF','MET','KRAS','NEG','PENDING'].forEach(mut => {
  ok(!/Pemetrexed/.test(allDrugs(runEng('NSCLC_SQ', mut))), `鱗狀 + ${mut} 不得出現 Pemetrexed`);
});
// 非鱗狀仍應保有 Pemetrexed backbone
ok(/Pemetrexed/.test(allDrugs(runEng('NSCLC_NS','ALK'))), '非鱗狀 + ALK 仍用 Pemetrexed backbone');

// N-03：非 EGFR 背景的 T790M 不得建議 Osimertinib
['ALK','ROS1','BRAF','MET','KRAS','NEG','PENDING'].forEach(mut => {
  const r = runEng('NSCLC_NS', mut, { t790m:'yes' });
  const bad = (r.steps||[]).some(s => /T790M/.test(s.title||'') && /Osimertinib/.test(JSON.stringify(s.drugs||[])));
  ok(!bad, `${mut} + T790M 不得建議換 Osimertinib`);
});
ok((runEng('NSCLC_NS','EGFR_EX19',{t790m:'yes'}).steps||[]).some(s => /T790M/.test(s.title||'')),
   'EGFR + T790M 仍給二線建議');

// N-04：術後追加治療要依 driver 分流
const poEGFR = allDrugs(runEng('NSCLC_NS','EGFR_EX19',{ postOp:true, stageCat:'EARLY', stage:'IIB', possibleStages:['IIB'] }));
const poALK  = allDrugs(runEng('NSCLC_NS','ALK',      { postOp:true, stageCat:'EARLY', stage:'IIB', possibleStages:['IIB'] }));
ok(poEGFR !== poALK, '術後追加治療依 driver 不同');
ok(/Osimertinib/.test(poEGFR) && !/Alectinib/.test(poEGFR), 'EGFR 術後只列 Osimertinib');
ok(/Alectinib/.test(poALK) && !/Osimertinib/.test(poALK), 'ALK 術後只列 Alectinib');

// N-05：SCLC 侷限期 + 已知腦轉移 → 不得輸出侷限期鞏固，應提示分期不一致
const sclcBrain = runEng('SCLC','', { stageCat:'LOCAL', stage:'Limited', possibleStages:['Limited'], brainMet:'yes' });
ok(!/Durvalumab/.test(allDrugs(sclcBrain)), 'SCLC 侷限期+腦轉移 不得給侷限期免疫鞏固');
ok(/分期/.test(sclcBrain.pwTxt || ''), 'SCLC 侷限期+腦轉移 應提示分期需確認', sclcBrain.pwTxt);

// N-06：第三期基因未驗/暫不檢測 → 不得直接給 Durvalumab 鞏固
['PENDING','DECLINED'].forEach(mut => {
  const r = runEng('NSCLC_NS', mut, { stageCat:'LOCAL', stage:'IIIB', possibleStages:['IIIB'] });
  const drugHit = (r.steps||[]).some(s => (s.drugs||[]).some(d => /Durvalumab/.test(d.n)));
  ok(!drugHit, `第三期 ${mut} 不得直接給 Durvalumab（給付需檢測報告佐證）`);
});
const negIII = runEng('NSCLC_NS','NEG', { stageCat:'LOCAL', stage:'IIIB', possibleStages:['IIIB'] });
ok((negIII.steps||[]).some(s => (s.drugs||[]).some(d => /Durvalumab/.test(d.n))),
   '第三期已確認 driver 陰性 → 仍可給 Durvalumab');

// N-13：已被 durvaExcludedFor 取代的死常數不得殘留
ok(!/const DURVA_EXCLUDED/.test(read('lung/_path.js')), 'DURVA_EXCLUDED 死常數已移除');

/* ═══ 10. 內部複審 N-09／N-15／N-16 ═══ */
section('步驟識別碼與跨頁欄位（N-09／N-15／N-16）');

// N-09：所有含 drugs 的步驟都要有穩定 id（否則復發改寫 title 後，個管勾選會失效）
const scenarios = [
  ['NSCLC_NS','META','IVA','EGFR_EX19'], ['NSCLC_NS','META','IVA','ALK'], ['NSCLC_NS','META','IVA','ROS1'],
  ['NSCLC_NS','META','IVA','BRAF'], ['NSCLC_NS','META','IVA','MET'], ['NSCLC_NS','META','IVA','KRAS'],
  ['NSCLC_NS','META','IVA','NEG'], ['NSCLC_SQ','META','IVA','NEG'],
  ['NSCLC_NS','LOCAL','IIIB','NEG'], ['NSCLC_NS','EARLY','IIB','NEG'],
  ['SCLC','META','',''], ['SCLC','LOCAL','Limited',''],
];
let noId = [];
scenarios.forEach(([type, sc, stage, mut]) => {
  const r = runEng(type, mut, { stageCat:sc, stage, possibleStages: stage ? [stage] : [],
    brainMet: type === 'SCLC' ? 'no' : '' });
  (r.steps||[]).forEach(s => { if(s.drugs && s.drugs.length && !s.id) noId.push(`${type}/${mut}: ${s.title}`); });
});
ok(noId.length === 0, '所有含藥物的步驟都有穩定 id', noId.slice(0,3).join(' ／ '));

// N-09：復發改寫 title 後，step id 不變
const recur = runEng('NSCLC_NS','ALK', { postOp:true, txProgress:'recurrence', stageCat:'EARLY', stage:'IIB', possibleStages:['IIB'] });
const recurIds = (recur.steps||[]).filter(s => s.drugs && s.drugs.length).map(s => s.id);
ok(recurIds.every(Boolean), '復發路徑的含藥步驟仍有 id（勾選不會失效）', JSON.stringify(recurIds));

// N-10：stepKeyOf 不得再 fallback 到 title
ok(!/step\.phase \|\| step\.title/.test(read('lung/_path.js')), 'stepKeyOf 不再 fallback 到 phase/title');

// N-15：getAdjuvantHTML 補 IA 分支且不靜默回空
const proSrc = read('lung/index.html');
ok(/s==='IA' \|\| s==='IA1'|s==='0'\|\|s==='IA'\|\|/.test(proSrc), "getAdjuvantHTML 補上 'IA' 分支");
ok(/此病理分期無對應的輔助治療建議/.test(proSrc), 'getAdjuvantHTML 不再靜默回空字串');

// N-16：醫護版 QR payload 要帶 edu-pro 分流需要的欄位
const payloadSrc = (proSrc.match(/function buildEduPayload\(\)[\s\S]*?\n\}/) || [''])[0];
['b:', 'pd:', 'tt:', 'nn:', 'mm:'].forEach(f => {
  ok(payloadSrc.includes(f), `醫護版 payload 含 ${f.replace(':','')} 欄位`);
});
ok(/mutEnumForRules/.test(payloadSrc), '醫護版 payload 送次型 enum 而非粗分類');

/* ═══ 11. 術前（前導）輔助治療 — 健保 115/6/1 ═══ */
section('術前輔助治療資格（健保 115/6/1）');
const neoStep = (type, t, n, m, mut) => {
  const info = vm.runInContext(`resolveStage(${JSON.stringify(t)},${JSON.stringify(n)},${JSON.stringify(m)})`, engCtx);
  const st = { type, t, n, m, stage: info.stage, possibleStages: info.possible, stageCat: info.cat,
    mut, pdl1:'', t790m:'', brainMet:'', drugOff:[], riskFactors:[], postOp:false, txProgress:'',
    age:'', ecog:'', hbv:'', catastrophic:'' };
  const r = vm.runInContext(`(function(){var s=${JSON.stringify(st)};var r=buildPathRaw(s);applyModifiers(r,s);return r;})()`, engCtx);
  return (r.steps||[]).find(s => /術前輔助/.test(s.title || '')) || null;
};
// 符合：腫瘤≥4cm（T2b+）或 N1/N2，M0，driver 陰性
ok(!!neoStep('NSCLC_NS','T2b','N0','M0','NEG'), 'T2b N0 M0 driver 陰性 → 有術前輔助');
ok(!!neoStep('NSCLC_NS','T1b','N1','M0','NEG'), 'T1b N1 M0 → 有術前輔助（淋巴結陽性）');
ok(!!neoStep('NSCLC_NS','T3','N2a','M0','NEG'), 'T3 N2a M0 → 有術前輔助（可切除 IIIA）');
// 排除
ok(!neoStep('NSCLC_NS','T2b','N0','M0','EGFR_EX19'), 'EGFR(+) → 不得提供術前輔助');
ok(!neoStep('NSCLC_NS','T2b','N0','M0','ALK'), 'ALK(+) → 不得提供術前輔助');
ok(!neoStep('NSCLC_NS','T1a','N0','M0','NEG'), 'T1a N0（<4cm 且無淋巴結）→ 不符合');
ok(!neoStep('NSCLC_NS','T2b','N3','M0','NEG'), 'N3 → 條文明文排除');
// 未檢測 → 導向先確認，不得直接給
const pend = neoStep('NSCLC_NS','T2b','N0','M0','PENDING');
ok(pend && /需先確認/.test(pend.title), '未檢測 EGFR／ALK → 導向先確認', pend && pend.title);
ok(!pend || !(pend.drugs||[]).length, '未檢測時不得列出免疫藥物');
// 處方依組織型態
const nsNeo = neoStep('NSCLC_NS','T3','N2a','M0','NEG');
const sqNeo = neoStep('NSCLC_SQ','T3','N2a','M0','NEG');
ok(/Pemetrexed/.test(JSON.stringify(nsNeo.drugs)), '非鱗狀術前含 Pemetrexed');
ok(!/Pemetrexed/.test(JSON.stringify(sqNeo.drugs)), '鱗狀術前不得含 Pemetrexed');
ok(/Nivolumab/.test(JSON.stringify(nsNeo.drugs)) && /Nivolumab/.test(JSON.stringify(sqNeo.drugs)),
   '兩種組織型態都用 Nivolumab');
// 不得殘留「健保尚未給付」的過時說法
ok(!/術前免疫合併化療目前健保尚未給付/.test(read('lung/_path.js')), '已移除「術前免疫健保尚未給付」的過時註記');

console.log(`\n═══ 結果：${pass} 通過 / ${fail} 失敗 ═══`);
process.exit(fail ? 1 : 0);
