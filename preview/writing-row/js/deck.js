// The deck: every hiragana row, its kana and romaji, and which kana look alike.
// Pure data, no screen or storage code, so any other module can import it.

export const ROWS=[
  {id:'a',k:'あいうえお',r:['a','i','u','e','o']},
  {id:'k',k:'かきくけこ',r:['ka','ki','ku','ke','ko']},
  {id:'s',k:'さしすせそ',r:['sa','shi','su','se','so']},
  {id:'t',k:'たちつてと',r:['ta','chi','tsu','te','to']},
  {id:'n',k:'なにぬねの',r:['na','ni','nu','ne','no']},
  {id:'h',k:'はひふへほ',r:['ha','hi','fu','he','ho']},
  {id:'m',k:'まみむめも',r:['ma','mi','mu','me','mo']},
  {id:'y',k:'やゆよ',r:['ya','yu','yo']},
  {id:'r',k:'らりるれろ',r:['ra','ri','ru','re','ro']},
  {id:'w',k:'わをん',r:['wa','wo','n']},
  {id:'g',k:'がぎぐげご',r:['ga','gi','gu','ge','go'],base:'k'},
  {id:'z',k:'ざじずぜぞ',r:['za','ji','zu','ze','zo'],base:'s'},
  {id:'d',k:'だぢづでど',r:['da','ji (di)','zu (du)','de','do'],base:'t'},
  {id:'b',k:'ばびぶべぼ',r:['ba','bi','bu','be','bo'],base:'h'},
  {id:'p',k:'ぱぴぷぺぽ',r:['pa','pi','pu','pe','po'],base:'h'},
];
export const ROWMAP=Object.fromEntries(ROWS.map(r=>[r.id,r]));

// One entry per kana: k = the kana, r = romaji shown, s = the sound (used to avoid offering two that sound the same)
export const KANA=[];
ROWS.forEach(row=>[...row.k].forEach((k,i)=>KANA.push({k,r:row.r[i],s:row.r[i].split(' ')[0],row:row.id,i})));
KANA.find(x=>x.k==='を').s='o'; // sounds the same as お, so never offer both together
export const BY=Object.fromEntries(KANA.map(x=>[x.k,x]));

// Each kana has three cards: read it, pick it from romaji (or from its sound), and write it
export const TYPES=['read','recall','write'];

// Characters that are easily confused with each other, used to pick convincing wrong answers
const CONF=['ぬめ','ねれわ','るろ','はほけ','いこり','さちき','あおめ','うらつ','しつん','くへ','まもよ','たな','そろ','にこ','すむ','ゆよ'];
export const CONFMAP={};
const link=(a,b)=>{if(a===b)return;(CONFMAP[a]=CONFMAP[a]||new Set()).add(b);(CONFMAP[b]=CONFMAP[b]||new Set()).add(a);};
CONF.forEach(g=>{const c=[...g];c.forEach(a=>c.forEach(b=>link(a,b)));});
ROWS.filter(r=>r.base).forEach(r=>{const base=[...ROWMAP[r.base].k];[...r.k].forEach((k,i)=>link(k,base[i]));});
[...'ばびぶべぼ'].forEach((k,i)=>link(k,'ぱぴぷぺぽ'[i]));
