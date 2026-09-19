// test/edu_pro_exec.test.js — 實際執行 edu-pro.html（不是比對原始碼字串）
// 執行：node test/edu_pro_exec.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..', 'lung');
const html = fs.readFileSync(path.join(ROOT, 'edu-pro.html'), 'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

function renderEduPro(payload){
  const els = {};
  const el = id => els[id] || (els[id] = { id, innerHTML:'', textContent:'', style:{},
    classList:{add(){},remove(){},toggle(){}}, appendChild(){}, querySelector(){ return null; } });
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  const ctx = { console, location:{ hash:'#'+b64 },
    document:{ getElementById:el, querySelector:()=>el('_q'), querySelectorAll:()=>[], createElement:()=>el('_c'+Math.random()), title:'' },
    atob:s=>Buffer.from(s,'base64').toString('binary'), btoa:s=>Buffer.from(s,'binary').toString('base64'),
    escape, unescape, encodeURIComponent, decodeURIComponent };
  ctx.window = ctx; vm.createContext(ctx);
  ['_staging.js','_path.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), ctx));
  inline.forEach(s => vm.runInContext(s, ctx));
  return (els.app ? els.app.innerHTML : '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
}

let pass = 0, fail = 0;
const ok = (c, label, detail) => { if(c) pass++; else { fail++; console.log('  ✗ ' + label + (detail ? '  → ' + detail : '')); } };

// 這組 payload 的 m 欄位格式與 lung/index.html buildEduPayload() 目前實際送出的一致（mutEnumForRules）
const IV = (m, extra) => renderEduPro(Object.assign({ n:'王○明', t:'NS', s:'IVA', m }, extra||{}));

ok(/Osimertinib/.test(IV('EGFR_EX19')), 'IVA EGFR ex19 → 應出現 EGFR 標靶', IV('EGFR_EX19').slice(0,120));
ok(!/等報告期間/.test(IV('EGFR_EX19')), 'IVA EGFR ex19 → 不得出現「等報告期間可先含鉑化療」');
ok(/Osimertinib/.test(IV('EGFR_L858R')), 'IVA EGFR L858R → 應出現 EGFR 標靶');
ok(/Pembrolizumab/.test(IV('NEG', { pd:'80' })), 'IVA driver 陰性 + PD-L1 80% → 應出現免疫治療');
ok(/Selpercatinib|RET/.test(IV('RET')), 'IVA RET → 應出現 RET 對應說明');
ok(!/不可加免疫|免疫不適用/.test(renderEduPro({ n:'x', t:'SC', s:'IVB', m:'PENDING', b:'yes' })),
   'ES-SCLC 腦轉移 → 不得寫成醫學禁忌（C4）');
ok(/自費|未給付/.test(renderEduPro({ n:'x', t:'NS', s:'IB', m:'EGFR_EX19', po:1 })),
   '早期 EGFR 術後 Osimertinib → 必須標自費／未給付');

console.log(`\n═══ 結果：${pass} 通過 / ${fail} 失敗 ═══`);
process.exit(fail ? 1 : 0);
