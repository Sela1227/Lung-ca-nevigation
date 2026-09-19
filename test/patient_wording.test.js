/* ═══════════════════════════════════════════════════════════════
   民眾版用語掃描 — 病人不該看到的專業術語
   執行：node test/patient_wording.test.js

   背景（內部審核 P1-1）：V3.0.1／BUG-35 訂下民眾版禁字（CCRT、鞏固、PCI、
   TKI、試驗代號、條文編號、NCCN 分級）。但 V3.9.0 起共用規則層 `rule*()`
   直接回傳醫護語氣的 label/note，民眾版原封不動呈現 → 術語全面回流。
   審核方以 10,800 組矩陣掃描，抓到「鞏固」1,140 次、「CCRT」165 次、
   「LAURA」44 次、「9.126」120 次、「G2032R／TKI」240 次、「MDT」77 次。

   這支測試把掃描自動化：跑過民眾版引擎的輸入矩陣，把病人會看到的每一段
   文字（步驟標題、說明、警語、主結論）拿去比對禁字表。
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const ctx = { console, JSON, Math, Date, Object, Array, String, Number, RegExp,
  parseInt, parseFloat, isNaN };
vm.createContext(ctx);
vm.runInContext(read('lung/_staging.js') + '\n' + read('lung/_path.js'), ctx);

/* 禁字表：病人版不該出現的專業術語。
   每項給一個「建議改法」，讓失敗訊息直接可行動。 */
const BANNED = [
  ['CCRT',        '寫「同步化放療」'],
  ['鞏固',        '寫「維持治療」或「接續治療」'],
  ['PCI',         '寫「預防性腦部照射」'],
  ['TKI',         '寫「口服標靶藥」'],
  ['ICI',         '寫「免疫治療」'],
  ['MDT',         '寫「多專科團隊」'],
  ['LAURA',       '不要寫試驗代號'],
  ['ADRIATIC',    '不要寫試驗代號'],
  ['PACIFIC',     '不要寫試驗代號'],
  ['FLAURA',      '不要寫試驗代號'],
  ['MARIPOSA',    '不要寫試驗代號'],
  ['PROCLAIM',    '不要寫試驗代號'],
  ['ADAURA',      '不要寫試驗代號'],
  ['category 1',  '不要寫 NCCN 分級'],
  ['G2032R',      '不要寫突變位點代號'],
  ['ERBB2',       '寫「HER2」即可'],
  ['METex14',     '寫「MET 基因跳躍」'],
  ['NSCL-',       '不要寫指引頁碼'],
  ['原生型',      '寫「沒有帶這些基因」'],
  ['definitive',  '用中文'],
  ['treatment',   '用中文（疑似未譯完）'],
];
/* 條文編號（9.xx）另外用 regex 抓 */
const NHI_REF = /第\s*9\s*章[^。]{0,10}9\.\d+|健保\s*9\.\d+|\b9\.\d{2,3}\b/;

const TYPES = ['NSCLC_NS', 'NSCLC_SQ', 'SCLC'];
const TNM = [
  ['T1a','N0','M0'], ['T2b','N0','M0'], ['T2a','N1','M0'], ['T3','N2a','M0'],
  ['T2a','N2b','M0'], ['T4','N3','M0'], ['T2a','N0','M1a'], ['T2a','N0','M1c1'],
];
const MUTS = ['EGFR_EX19','EGFR_L858R','EGFR_EX20','EGFR_OTHER','ALK','ROS1',
              'BRAF','MET','KRAS','RET','NTRK','HER2','NEG','PENDING','DECLINED'];

function build(state) {
  return vm.runInContext(
    `(function(){var s=${JSON.stringify(state)};var r=buildPathRaw(s);applyModifiers(r,s);return r;})()`,
    ctx);
}
/* 病人實際看得到的文字：主結論 + 每個步驟的標題與說明 + 警語 */
function patientVisibleText(r) {
  const parts = [r.stageTxt || '', r.pwTxt || ''];
  (r.steps || []).forEach(s => {
    parts.push(s.title || '', s.note || '', s.line || '');
    (s.drugs || []).forEach(d => parts.push(d.z || ''));   // 中文藥名給病人看
  });
  (r.warns || []).forEach(w => parts.push(w));
  return parts.join('\n');
}

const hits = {};      // 禁字 → [情境]
let cases = 0;
TYPES.forEach(type => {
  TNM.forEach(([t, n, m]) => {
    const info = vm.runInContext(
      `resolveStage(${JSON.stringify(t)},${JSON.stringify(n)},${JSON.stringify(m)})`, ctx);
    MUTS.forEach(mut => {
      [false, true].forEach(postOp => {
        ['', 'no'].forEach(resectable => {
          cases++;
          const state = {
            type, t, n, m, stage: info.stage, possibleStages: info.possible,
            stageCat: info.cat || (type === 'SCLC' ? 'LOCAL' : ''),
            mut, pdl1: 'HIGH', t790m: '', brainMet: type === 'SCLC' ? 'no' : '',
            drugOff: [], riskFactors: [], neoIO: '', resectable,
            postOp, txProgress: '', age: '', ecog: '', hbv: '', catastrophic: '',
          };
          let text = '';
          try { text = patientVisibleText(build(state)); } catch (e) { text = ''; }
          const label = `${type}/${t}${n}${m}/${mut}${postOp ? '/術後' : ''}${resectable === 'no' ? '/不可切除' : ''}`;
          BANNED.forEach(([word]) => {
            if (text.includes(word)) (hits[word] = hits[word] || []).push(label);
          });
          if (NHI_REF.test(text)) (hits['健保條文編號'] = hits['健保條文編號'] || []).push(label);
        });
      });
    });
  });
});

let pass = 0, fail = 0;
console.log(`掃描 ${cases} 組民眾版輸出\n`);
BANNED.concat([['健保條文編號', '寫「健保有／沒有給付」即可，不要寫條號']]).forEach(([word, advice]) => {
  const list = hits[word];
  if (!list || !list.length) { pass++; return; }
  fail++;
  console.log(`  ✗ 「${word}」出現 ${list.length} 次 → ${advice}`);
  console.log(`      例：${list.slice(0, 2).join('　')}`);
});

console.log(`\n═══ 結果：${pass} 項乾淨 / ${fail} 項有禁字 ═══`);
process.exit(fail ? 1 : 0);
