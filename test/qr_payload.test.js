/* ═══════════════════════════════════════════════════════════════
   Cancer Navigation — QR payload / 決策引擎回歸測試
   執行：node test/qr_payload.test.js   （只需 Node，不需瀏覽器或套件）

   V3.8.5 起隨包附上（外部審核 P2-02）：
   先前 README 宣稱「舊 QR 相容全綠」，但舊格式「單一 risk factor」的邊界
   （rf='LVI' 被逐字拆成 LVI,VPI,I）沒被涵蓋。測試不隨包，外部就無法確認
   測試矩陣是否真的涵蓋格式邊界 —— 這支檔案就是為了讓那件事可被重現。
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const inlineJS = f => read(f).match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/^<script>|<\/script>$/g, '');

/* 真實的編碼函式（不用替身）—— 亂碼問題只有用真的 btoa/escape 才測得出來 */
function makeCtx() {
  const el = () => ({ classList:{add(){},remove(){},toggle(){},contains:()=>false}, style:{}, value:'',
    textContent:'', innerHTML:'', querySelector:()=>null, querySelectorAll:()=>[], focus(){},
    closest:()=>null, dataset:{}, appendChild(){}, setAttribute(){}, addEventListener(){} });
  const win = { addEventListener(){}, location:{hash:'',search:''}, scrollTo(){},
    matchMedia:()=>({matches:false}), innerWidth:1200, history:{pushState(){},replaceState(){}} };
  const c = {
    document:{ getElementById:el, querySelector:el, querySelectorAll:()=>[],
      body:{classList:{add(){},remove(){},toggle(){}},style:{},appendChild(){},addEventListener(){}},
      addEventListener(){}, createElement:el },
    window: win, alert(){}, confirm:()=>true, setTimeout(f){}, clearTimeout(){}, requestAnimationFrame(){},
    btoa: global.btoa, atob: global.atob, escape: global.escape, unescape: global.unescape,
    encodeURIComponent: global.encodeURIComponent, decodeURIComponent: global.decodeURIComponent,
    QRCode: function(){}, location:{hash:'',href:'',search:''}, history: win.history,
    console, JSON, Math, Date, Object, Array, String, Number, RegExp, parseInt, parseFloat, isNaN, URLSearchParams,
  };
  c.QRCode.CorrectLevel = { M: 0 };
  c.self = c; c.window.__drugOff = [];
  return c;
}
function load(code, names) {
  const c = makeCtx(); vm.createContext(c);
  try { vm.runInContext(code, c); } catch (e) { /* init 需要 DOM，忽略 */ }
  try { vm.runInContext('var __e={};' + names.map(n => `try{__e.${n}=${n};}catch(e){}`).join(''), c); } catch (e) {}
  return c.__e || {};
}

const staging = read('lung/_staging.js');
const pathjs  = read('lung/_path.js');
const PT = load(staging + '\n' + pathjs + '\n' + inlineJS('lung/patient.html'),
  ['buildEduPayload','buildEduURL','recomputeStage','buildPath','buildGeneTestAdvice','renderSummary','stageDisplay','S','TEAM','b64uEnc']);
const ED = load(staging + '\n' + pathjs + '\n' + inlineJS('lung/edu-patient.html'),
  ['normalizeQR','stageDisplay','mutDisplay','pdl1Display','buildPathFromData','b64uDec','escapeHtml','TYPE_CODE_TO_FULL','qrDec']);

let pass = 0, fail = 0;
const ok = (cond, label, detail) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  ✗ ${label}${detail ? '  → ' + detail : ''}`); }
};
const section = t => console.log('\n── ' + t + ' ──');

const BASE = { type:'', t:'', n:'', m:'', stage:'', possibleStages:[], stageLabel:'', stageNeed:[], stageCat:'',
  mut:'', pdl1:'', t790m:'', brainMet:'', drugOff:[], riskFactors:[], postOp:false, txProgress:'',
  age:'', ecog:'', hbv:'', catastrophic:'', consult:{}, code:'', name:'' };
const setS = o => { Object.keys(PT.S).forEach(k => delete PT.S[k]); Object.assign(PT.S, BASE, o); };
const asEdu = pl => { const d = ED.normalizeQR(JSON.parse(JSON.stringify(pl)));
  d._type = ED.TYPE_CODE_TO_FULL[d.t] || d.t; d._stageCat = ED.qrDec('sc', d.sc) || ''; return d; };
const ser = r => JSON.stringify({ p:r.pwTxt, st:(r.steps||[]).map(s => s.title + '|' + (s.note||'')), w:r.warns });

/* ═══ 1. risk factor 新舊格式（外部審核 P1-01 的必補矩陣）═══ */
section('risk factor 格式邊界');
[['LVI','LVI'], ['VPI','VPI'], ['SIZE4','SIZE4'], ['POOR','POOR'], ['MARGIN','MARGIN'], ['NX','NX'],
 ['LVI,VPI','LVI,VPI'],
 ['L','LVI'], ['V','VPI'], ['S','SIZE4'], ['P','POOR'], ['M','MARGIN'], ['N','NX'],
 ['LVS','LVI,VPI,SIZE4'], ['', ''],
].forEach(([input, expect]) => {
  const got = ED.normalizeQR({ rf: input }).rf || '';
  ok(got === expect, `rf "${input}" 應為 "${expect}"`, `實得 "${got}"`);
});
ok(!/[^A-Z0-9,]/.test(ED.normalizeQR({ rf:'@@@' }).rf || ''), 'rf 不合法值不得產生未知 factor');

/* ═══ 2. 編碼往返不亂碼（真 btoa/escape）═══ */
section('編碼往返（中文／罕用字／emoji／符號）');
['林O雲','龔𠁻','測試🙂','①②③','Ⅳ期','–—…','"引號"&<>','Mary 陳'].forEach(s => {
  let got = null;
  try { got = JSON.parse(ED.b64uDec(PT.b64uEnc(JSON.stringify({ x: s })))).x; } catch (e) {}
  ok(got === s, `往返 ${JSON.stringify(s)}`, JSON.stringify(got));
});

/* ═══ 3. 新 QR：payload → edu 顯示欄位（14 項）═══ */
section('新 QR 顯示欄位稽核');
const depts = (PT.TEAM && PT.TEAM.depts || []).map(d => d.id);
setS({ type:'NSCLC_NS', t:'T2a', n:'N0', m:'M0', postOp:true, mut:'EGFR_L858R', pdl1:'HIGH', t790m:'yes',
  brainMet:'yes', hbv:'yes', catastrophic:'no', age:'ge70', ecog:'2', txProgress:'chemo',
  riskFactors:['LVI','VPI'], name:'林O雲', code:'A069169',
  consult:{ [depts[0]]:'張竣期', [depts[1]]:'高劍虹', [depts[2]]:'__SKIP__' } });
PT.recomputeStage();
const plNew = PT.buildEduPayload();
const dNew = asEdu(plNew);
ok(ED.stageDisplay(dNew) === 'IB', '分期顯示 IB（唯一解不加「約」）', ED.stageDisplay(dNew));
ok(ED.mutDisplay(dNew.m) === 'EGFR L858R(+)', '驅動基因', ED.mutDisplay(dNew.m));
ok(ED.pdl1Display(dNew.pd) === 'PD-L1≥50%', 'PD-L1', ED.pdl1Display(dNew.pd));
ok(dNew.tm[0] === '張竣期' && dNew.tm[1] === '高劍虹', '主治醫師還原成陣列', JSON.stringify(dNew.tm));
ok(dNew.tm[2] === '__SKIP__', '標記不需要的科別保留');
ok(dNew.b === 'yes' && dNew.hb === 'yes' && dNew.ct === 'no', '腦轉移／B肝／重大傷病短碼還原');
ok(dNew.a === 'ge70' && dNew.e === '2' && dNew.tp === 'chemo', '年齡／ECOG／治療進度短碼還原');
ok(dNew.rf === 'LVI,VPI', '高風險因子短碼還原', dNew.rf);
ok(/^\d{4}-\d{2}-\d{2}$/.test(dNew.d), '日期還原為 YYYY-MM-DD', dNew.d);
ok(dNew.n === '林O雲' && dNew.co === 'A069169', '姓名／病歷號');

/* ═══ 4. QR 長度與字元集 ═══ */
section('QR URL');
const url = PT.buildEduURL();
const frag = url.split('#')[1] || '';
ok(/^[A-Za-z0-9_-]+$/.test(frag), 'fragment 為純 base64url（無 + / =）');
ok(url.length < 500, `URL 長度 ${url.length} < 500`);

/* ═══ 5. 舊 QR 相容（長格式 + 標準 base64 + 舊 dx）═══ */
section('舊 QR 相容');
const oldPayload = { n:'王小明', t:'NS', s:'IIIB', sl:'IIIB', ps:'IIIB', sc:'LOCAL', m:'EGFR_L858R',
  pd:'HIGH', t9:'yes', b:'yes', hb:'yes', ct:'no', a:'ge70', e:'2', po:1, tp:'chemo',
  rf:'LVI', dx:'egfr-1l|Gefitinib', tm:['張竣期','高劍虹',''], c:'陳個管', d:'2026-07-04', co:'A001' };
const oldB64 = global.btoa(global.unescape(global.encodeURIComponent(JSON.stringify(oldPayload))));
let dOld = null;
try { dOld = ED.normalizeQR(JSON.parse(ED.b64uDec(oldB64))); } catch (e) {}
ok(!!dOld, '舊 QR（標準 base64）可解碼');
if (dOld) {
  dOld._type = 'NSCLC_NS'; dOld._stageCat = dOld.sc;
  ok(dOld.rf === 'LVI', '舊 QR 單一 risk factor 不被拆開', dOld.rf);
  ok(dOld.tm[0] === '張竣期', '舊 QR 主治（本來就是陣列）');
  ok(ED.stageDisplay(dOld) === 'IIIB', '舊 QR 分期', ED.stageDisplay(dOld));
  let r = null; try { r = ED.buildPathFromData(dOld); } catch (e) {}
  ok(r && r.steps.length > 0, '舊 QR 可渲染治療路徑');
}

/* ═══ 6. patient / edu round-trip（經完整 payload 往返）═══ */
section('patient ↔ edu round-trip');
let rtFail = 0, rtN = 0;
const TNM = [['T1','N0','M0'],['T2','N0','M0'],['T1a','N0','M0'],['T2a','N2','M0'],
             ['T3','N2b','M0'],['T2a','N0','M1'],['T4','N3','M0'],['T2b','N1','M0']];
for (const [t, n, m] of TNM)
  for (const mut of ['EGFR_EX19','EGFR_L858R','EGFR_EX20','ALK','NEG','PENDING','DECLINED'])
    for (const pd of ['HIGH',''])
      for (const po of [false, true]) {
        rtN++;
        setS({ type:'NSCLC_NS', t, n, m, mut, pdl1:pd, postOp:po });
        PT.recomputeStage();
        const pl = PT.buildEduPayload();
        let a, b;
        try { a = ser(PT.buildPath()); } catch (e) { a = 'EX' + e.message; }
        try { b = ser(ED.buildPathFromData(asEdu(pl))); } catch (e) { b = 'EX' + e.message; }
        if (a !== b) { rtFail++; if (rtFail <= 3) console.log(`  ✗ round-trip ${t}/${n}/${m} ${mut} pd=${pd} po=${po}`); }
      }
ok(rtFail === 0, `round-trip ${rtN} 組一致`, rtFail + ' 組不同');

/* ═══ 7. 驅動基因分類完整性（內部審核建議的最重要斷言）═══ */
section('驅動基因分類完整性');
const MUTS = [...new Set([...read('lung/patient.html')
  .matchAll(/id="opt-mut"[\s\S]*?<\/div>/g)].map(x => x[0]).join('')
  .matchAll(/data-val="([^"]+)"/g))].map(x => x[1]);
// 不要驗「某個值走對分支」，要驗「沒有任何值掉出分類」
const ctx2 = makeCtx(); vm.createContext(ctx2);
vm.runInContext(staging + '\n' + pathjs, ctx2);
const classified = v => vm.runInContext(
  `EGFR_CLASSIC_SET.includes(${JSON.stringify(v)}) || ${JSON.stringify(v)}==='EGFR_EX20' ||
   ${JSON.stringify(v)}==='EGFR_OTHER' || NON_EGFR_DRIVERS.includes(${JSON.stringify(v)}) ||
   NON_POSITIVE_MUT.includes(${JSON.stringify(v)})`, ctx2);
MUTS.forEach(v => ok(classified(v), `mut "${v}" 有落入分類（不得掉進 else）`));

/* ═══ 8. 臨床斷言 ═══ */
section('臨床斷言');
const runEngine = o => { setS(Object.assign({ type:'NSCLC_NS' }, o)); PT.recomputeStage(); return PT.buildPath(); };
['EGFR_EX19','EGFR_L858R'].forEach(mut => {
  const j = JSON.stringify(runEngine({ t:'T4', n:'N3', m:'M0', mut }));
  ok(/Osimertinib/.test(j), `III 期 ${mut} → 鞏固用 Osimertinib`);
  ok(!/Durvalumab/.test(j), `III 期 ${mut} → 不得出現 Durvalumab`);
});
ok(/Durvalumab/.test(JSON.stringify(runEngine({ t:'T4', n:'N3', m:'M0', mut:'KRAS' }))),
   'III 期 KRAS → 仍可用 Durvalumab（不在排除名單）');
// 只檢查「藥物清單」，不檢查說明文字（說明會寫「鱗狀不使用 Pemetrexed」，那是正確的衛教）
const drugNames = r => (r.steps||[]).reduce((a,s)=>a.concat((s.drugs||[]).map(d=>d.n)), []).join(' | ');
ok(/Pemetrexed/.test(drugNames(runEngine({ t:'T4', n:'N3', m:'M0', mut:'NEG' }))),
   '非鱗狀同步化放療 → 藥物清單含 Pemetrexed 組合');
setS({ type:'NSCLC_SQ', t:'T4', n:'N3', m:'M0', mut:'NEG' }); PT.recomputeStage();
ok(!/Pemetrexed/.test(drugNames(PT.buildPath())), '鱗狀路徑 → 藥物清單不得出現 Pemetrexed');
// 鱗狀全分期掃描（BUG-82 的完整版）
let sqPem = [];
[['T2a','N0','M0',false],['T2a','N0','M0',true],['T4','N3','M0',false],['T2a','N0','M1c1',false]].forEach(([t,n,m,po])=>{
  setS({ type:'NSCLC_SQ', t, n, m, mut:'NEG', pdl1:'LOW', postOp:po }); PT.recomputeStage();
  if(/Pemetrexed/.test(drugNames(PT.buildPath()))) sqPem.push(`${t}/${n}/${m}${po?' 術後':''}`);
});
ok(sqPem.length === 0, '鱗狀所有分期的藥物清單皆無 Pemetrexed', sqPem.join(', '));
// 未驗基因不得被導向免疫單藥
const pend = JSON.stringify(runEngine({ t:'T2a', n:'N0', m:'M1c1', mut:'PENDING', pdl1:'HIGH' }));
ok(/先完成驅動基因檢測/.test(pend), '基因未驗 + PD-L1 高 → 先導向檢測');
// 期別未定不得給治療建議
const unk = runEngine({ stageCat:'UNKNOWN' });
ok(!/手術|化療|標靶|免疫/.test(unk.steps.map(s => s.title).join()), '期別未定 → 不給任何治療建議');

/* ═══ 9. 渲染層（V3.7.1 的空白 bug 就是只測引擎沒測渲染）═══ */
section('渲染層');
let renderFail = 0;
[['NSCLC_NS','DECLINED'],['NSCLC_NS','EGFR_EX19'],['SCLC','']].forEach(([type, mut]) => {
  setS({ type, t: type==='SCLC' ? '' : 'T2a', n: type==='SCLC' ? '' : 'N0', m: type==='SCLC' ? '' : 'M1c1',
         stageCat: type==='SCLC' ? 'LOCAL' : '', stage: type==='SCLC' ? 'Limited' : '', mut, brainMet: type==='SCLC' ? 'no' : '' });
  if (type !== 'SCLC') PT.recomputeStage();
  try { PT.renderSummary(); } catch (e) { renderFail++; console.log('  ✗ renderSummary ' + type + ' ' + e.message); }
});
ok(renderFail === 0, 'renderSummary 不拋錯');

console.log(`\n═══ 結果：${pass} 通過 / ${fail} 失敗 ═══`);
process.exit(fail ? 1 : 0);
