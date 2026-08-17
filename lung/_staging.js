/* ═══════════════════════════════════════════════════════════════
   _staging.js — 肺癌 AJCC 9th 分期查表（V3.6.0 從 patient/index 抽出共用）
   
   設計：查表而非 if/else。理由（BUG-64 教訓）：
   - NCCN Table 2 本身就是表格，查表可一格一格對照原表
   - if/else 會折疊區間（如 isT1||isT2 併成一格），容易漏格
   - 換癌別 = 換一張表；換 AJCC 版本 = 換一張表，引擎不動
   - 下一個癌別（大腸直腸癌）沿用同一個引擎、換 CRC 的表

   V3.6.1 臨床修正：T1N1 由 IIB 改為 IIA（依 NCCN Table 2 / AJCC 9th）。
   V3.6.1 新增 resolveStage()：簡易模式（T1/T2/N2/M1 未細分）不再產生假精確分期，
      改回報「可能範圍」；若範圍跨治療分類（如 T1+N2 → IIB(早期) 或 IIIA(局晚)），
      標為需確認，不硬猜。
   ═══════════════════════════════════════════════════════════════ */

// T 分組（細分 → 主群）
const AJCC9_T_BUCKET = {
  Tis:'Tis', T1mi:'T1', T1a:'T1', T1b:'T1', T1c:'T1', T1:'T1',
  T2a:'T2', T2b:'T2', T2:'T2', T3:'T3', T4:'T4',
};

// N0：依 T 細分（每格對應 NCCN Table 2 一列）
const AJCC9_N0 = {
  Tis:'0', T1mi:'IA1', T1a:'IA1', T1b:'IA2', T1c:'IA3',
  T1:'IA',          // 簡易模式「T1」未細分
  T2a:'IB', T2b:'IIA',
  T2:'IB',          // 簡易模式「T2」未細分
  T3:'IIB', T4:'IIIA',
};

// N1 以上：[N][T主群] → stage
const AJCC9_TBL = {
  N1 : { T1:'IIA',  T2:'IIB',  T3:'IIIA', T4:'IIIA' },   // V3.6.1: T1N1 依 NCCN Table 2 為 IIA（原誤為 IIB）
  N2a: { T1:'IIB',  T2:'IIIA', T3:'IIIA', T4:'IIIB' },
  N2b: { T1:'IIIA', T2:'IIIB', T3:'IIIB', T4:'IIIB' },
  N2 : { T1:'IIIA', T2:'IIIA', T3:'IIIB', T4:'IIIB' },   // 簡易模式「N2」未分 a/b
  N3 : { T1:'IIIB', T2:'IIIB', T3:'IIIC', T4:'IIIC' },
};

// M1：M1a/M1b → IVA；M1c1/M1c2（及未細分 M1c/M1）→ IVB
const AJCC9_M = { M1a:'IVA', M1b:'IVA' };

function computeAJCC(t, n, m){
  if(!t || !n || !m) return '';
  if(m !== 'M0') return AJCC9_M[m] || 'IVB';
  if(n === 'N0') return AJCC9_N0[t] || '';
  const tb = AJCC9_T_BUCKET[t];
  const row = AJCC9_TBL[n];
  if(!tb || !row) return '';
  return row[tb] || '';
}

function stageToCategory(stage){
  if(!stage) return '';
  if(/^IV/.test(stage)) return 'META';
  if(/^III/.test(stage)) return 'LOCAL';
  if(/^(0|I|II)/.test(stage)) return 'EARLY';
  return '';
}

/* ═══ V3.6.1: 簡易模式的模糊分期解析 ═══
   簡易按鈕 T1/T2（未分 a/b/c）、N2（未分 a/b）、M1（未分 a/b/c）無法定出唯一分期。
   舊行為：硬給一個（T2N0→IB、N2→IIA路線、M1→IVB），是「假精確」。
   新行為：列出所有可能，回報範圍；若可能值跨治療分類則標 needMore。      */
const AJCC9_AMBIGUOUS = {
  T: { T1:['T1mi','T1b','T1c'], T2:['T2a','T2b'] },   // 未細分的 T
  N: { N2:['N2a','N2b'] },
  M: { M1:['M1a','M1b','M1c1'] },
};
function resolveStage(t, n, m){
  if(!t || !n || !m) return { stage:'', cat:'', label:'', needMore:false, exact:false };
  const ts = AJCC9_AMBIGUOUS.T[t] || [t];
  const ns = AJCC9_AMBIGUOUS.N[n] || [n];
  const ms = AJCC9_AMBIGUOUS.M[m] || [m];
  const set = [];
  for(const a of ts) for(const b of ns) for(const c2 of ms){
    const s = computeAJCC(a, b, c2);
    if(s && !set.includes(s)) set.push(s);
  }
  if(!set.length) return { stage:'', cat:'', label:'', needMore:false, exact:false };
  const cats = [...new Set(set.map(stageToCategory))];
  const exact = (set.length === 1);
  // 排序讓範圍字串穩定（依分期先後）
  const ORDER = ['0','IA1','IA2','IA3','IA','IB','IIA','IIB','IIIA','IIIB','IIIC','IVA','IVB'];
  set.sort((a,b)=>ORDER.indexOf(a)-ORDER.indexOf(b));
  const label = exact ? set[0] : `${set[0]}–${set[set.length-1]}`;
  // 需要確認什麼
  const need = [];
  if(AJCC9_AMBIGUOUS.T[t] && !exact) need.push('腫瘤大小細分（' + t + 'a/b）');
  if(AJCC9_AMBIGUOUS.N[n] && !exact) need.push('N2 是單站(N2a)或多站(N2b)');
  if(AJCC9_AMBIGUOUS.M[m] && !exact) need.push('轉移範圍（M1a/b/c）');
  return {
    stage: exact ? set[0] : '',        // exactStage：只有唯一解才有值
    possible: set,                     // 所有可能分期（唯一解時長度為 1）
    cat: cats.length === 1 ? cats[0] : '',   // 跨分類 → 交由呼叫端走 UNKNOWN
    label, needMore: cats.length > 1, exact, need,
  };
}

/* ═══ V3.6.4: 分期判定 helper — 下游一律用這兩個，不要 parse 分期字串 ═══
   背景：V3.6.1 加了範圍分期（stage='' + label='IA1–IA3'）後，下游仍寫
   `stage.startsWith('IA')`、`stage !== 'IB'`，導致 T1N0M0（實際確定是 IA）
   被判成「非 IA」而列出 II 期的術前/術後化療建議。
     definitelyStage → 所有可能分期都符合（可安全套用該分期的建議）
     possiblyStage   → 任一可能分期符合（用於保守排除）                */
function stagesOf(state){
  if(state && state.possibleStages && state.possibleStages.length) return state.possibleStages;
  if(state && state.stage) return [state.stage];
  return [];
}
function definitelyStage(state, re){
  const s = stagesOf(state);
  return s.length > 0 && s.every(x => re.test(x));
}
function possiblyStage(state, re){
  return stagesOf(state).some(x => re.test(x));
}
