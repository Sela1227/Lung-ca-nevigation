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

console.log(`\n═══ 結果：${pass} 通過 / ${fail} 失敗 ═══`);
process.exit(fail ? 1 : 0);
