// The deck: every hiragana row, its entries and romaji, and which ones look alike.
// An entry is usually one kana, but combinations are two (きゃ).
// Pure data, no screen or storage code, so any other module (and the tests) can import it.

// sec: which part of the chart the row sits in. base: the row this one adds marks to (for look-alikes).
export const ROWS=[
  {id:'a',sec:'basic',k:['あ','い','う','え','お'],r:['a','i','u','e','o']},
  {id:'k',sec:'basic',k:['か','き','く','け','こ'],r:['ka','ki','ku','ke','ko']},
  {id:'s',sec:'basic',k:['さ','し','す','せ','そ'],r:['sa','shi','su','se','so']},
  {id:'t',sec:'basic',k:['た','ち','つ','て','と'],r:['ta','chi','tsu','te','to']},
  {id:'n',sec:'basic',k:['な','に','ぬ','ね','の'],r:['na','ni','nu','ne','no']},
  {id:'h',sec:'basic',k:['は','ひ','ふ','へ','ほ'],r:['ha','hi','fu','he','ho']},
  {id:'m',sec:'basic',k:['ま','み','む','め','も'],r:['ma','mi','mu','me','mo']},
  {id:'y',sec:'basic',k:['や','ゆ','よ'],r:['ya','yu','yo']},
  {id:'r',sec:'basic',k:['ら','り','る','れ','ろ'],r:['ra','ri','ru','re','ro']},
  {id:'w',sec:'basic',k:['わ','を','ん'],r:['wa','wo','n']},
  {id:'g',sec:'dakuten',k:['が','ぎ','ぐ','げ','ご'],r:['ga','gi','gu','ge','go'],base:'k'},
  {id:'z',sec:'dakuten',k:['ざ','じ','ず','ぜ','ぞ'],r:['za','ji','zu','ze','zo'],base:'s'},
  {id:'d',sec:'dakuten',k:['だ','ぢ','づ','で','ど'],r:['da','ji (di)','zu (du)','de','do'],base:'t'},
  {id:'b',sec:'dakuten',k:['ば','び','ぶ','べ','ぼ'],r:['ba','bi','bu','be','bo'],base:'h'},
  {id:'p',sec:'dakuten',k:['ぱ','ぴ','ぷ','ぺ','ぽ'],r:['pa','pi','pu','pe','po'],base:'h'},
  {id:'ky',sec:'combo',k:['きゃ','きゅ','きょ'],r:['kya','kyu','kyo']},
  {id:'sh',sec:'combo',k:['しゃ','しゅ','しょ'],r:['sha','shu','sho']},
  {id:'ch',sec:'combo',k:['ちゃ','ちゅ','ちょ'],r:['cha','chu','cho']},
  {id:'ny',sec:'combo',k:['にゃ','にゅ','にょ'],r:['nya','nyu','nyo']},
  {id:'hy',sec:'combo',k:['ひゃ','ひゅ','ひょ'],r:['hya','hyu','hyo']},
  {id:'my',sec:'combo',k:['みゃ','みゅ','みょ'],r:['mya','myu','myo']},
  {id:'ry',sec:'combo',k:['りゃ','りゅ','りょ'],r:['rya','ryu','ryo']},
  {id:'gy',sec:'combo',k:['ぎゃ','ぎゅ','ぎょ'],r:['gya','gyu','gyo'],base:'ky'},
  {id:'j',sec:'combo',k:['じゃ','じゅ','じょ'],r:['ja','ju','jo'],base:'sh'},
  {id:'by',sec:'combo',k:['びゃ','びゅ','びょ'],r:['bya','byu','byo'],base:'hy'},
  {id:'py',sec:'combo',k:['ぴゃ','ぴゅ','ぴょ'],r:['pya','pyu','pyo'],base:'hy'},
  {id:'x',sec:'marks',k:['っ'],r:['small tsu']},
];
export const ROWMAP=Object.fromEntries(ROWS.map(r=>[r.id,r]));

// Entries that sound the same as another, so they're never offered together as answers
const SOUND={'を':'o','っ':'っ'};
// Voice clip names (audio/<name>.mp3) that aren't just the romaji. っ has no sound of its own.
const CLIP={'ぢ':'di','づ':'du','っ':null};

// One entry per kana: k = the kana (one or two characters), r = romaji shown, s = the sound
// (used to avoid offering two that sound the same), a = the voice clip's name
export const KANA=[];
ROWS.forEach(row=>row.k.forEach((k,i)=>{const r=row.r[i];
  KANA.push({k,r,s:SOUND[k]||r.split(' ')[0],a:k in CLIP?CLIP[k]:r.split(' ')[0],row:row.id,i});}));
export const BY=Object.fromEntries(KANA.map(x=>[x.k,x]));

// Each entry has three cards: read it, pick it from romaji (or from its sound), and write it
export const TYPES=['read','recall','write'];

// Word pairs for っ, which has no sound on its own: hear or see one, and tell which it was.
// They're all real words (かった bought, かた shoulder...), but only the sounds are taught, not the meanings.
// rl/rs = romaji of the long and short words, al/as = their voice clips. Some clips are the Katakana drill's
// (かった and カッタ sound exactly the same); tools/make_voice.py makes the rest.
const pair=(long,short,rl,rs,as)=>({long,short,rl,rs,al:'pair-'+rl,as:as||'pair-'+rs});
export const PAIRS={
  'っ':[['かった','かた','katta','kata'],['きって','きて','kitte','kite'],['さっか','さか','sakka','saka'],['ねっこ','ねこ','nekko','neko'],
        ['もっと','もと','motto','moto'],['みっつ','みつ','mittsu','mitsu'],['おっと','おと','otto','oto'],['いった','いた','itta','ita'],
        ['さっき','さき','sakki','saki'],['しって','して','shitte','shite']]
       .map(([l,s,rl,rs])=>pair(l,s,rl,rs)),
};

// Entries that are easily confused with each other, used to pick convincing wrong answers
const CONF=['ぬめ','ねれわ','るろ','はほけ','いこり','さちき','あおめ','うらつ','しつん','くへ','まもよ','たな','そろ','にこ','すむ','ゆよ','っつ'];
export const CONFMAP={};
const link=(a,b)=>{if(a===b)return;(CONFMAP[a]=CONFMAP[a]||new Set()).add(b);(CONFMAP[b]=CONFMAP[b]||new Set()).add(a);};
CONF.forEach(g=>{const c=[...g];c.forEach(a=>c.forEach(b=>link(a,b)));});
// Rows that add marks look like the row they're built on, entry by entry
ROWS.filter(r=>r.base).forEach(r=>r.k.forEach((k,i)=>link(k,ROWMAP[r.base].k[i])));
ROWMAP.b.k.forEach((k,i)=>link(k,ROWMAP.p.k[i]));
ROWMAP.by.k.forEach((k,i)=>link(k,ROWMAP.py.k[i]));
// Combinations look like the others in their row, and like their first kana
ROWS.filter(r=>r.sec==='combo').forEach(r=>r.k.forEach(a=>{
  r.k.forEach(b=>link(a,b));
  if(BY[a[0]])link(a,a[0]);
}));

// Two entries the learner mixed up, as one key (the same whichever way round), and back again.
// null unless both are real entries (on a っ card the other word is '~', which isn't one).
export const mixKey=(a,b)=>BY[a]&&BY[b]?[a,b].sort().join('|'):null;
export const mixParts=key=>key.split('|');

/** For っ: one of its pairs at random, and which word of it to show or play (word, romaji, clip).
 *  null for anything else. rand is there so the tests can choose. */
export function pickPair(k,rand=Math.random){
  const list=PAIRS[k];if(!list)return null;
  const p=list[Math.min(list.length-1,Math.floor(rand()*list.length))],showLong=rand()<0.5;
  return {...p,showLong,word:showLong?p.long:p.short,romaji:showLong?p.rl:p.rs,clip:showLong?p.al:p.as};
}

/** Whether entry k has a sound of its own (っ doesn't: it only changes the sounds around it). */
export const hasSound=k=>!!(BY[k]&&BY[k].a);

/** Card ids in a saved progress object that aren't in this deck, such as a Katakana drill backup's. */
export const unknownCards=state=>Object.keys((state&&state.cards)||{}).filter(id=>!BY[id.split('|')[0]]);
