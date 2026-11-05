// Progress storage. Everything lives in one object, S, saved as JSON in the browser's localStorage.
// "Copy backup" in Settings copies exactly this object.
//
// Other modules import S and read or change its properties (S.cards, S.rows...). Only this module may
// replace S with a whole new object, through replaceState(); importers then see the new one automatically.

// Previews of work in progress live under /preview/ on the same site; they keep separate progress
// so trying something out can never touch the real thing.
const STORE='hiragana-drill-v1'+(location.pathname.includes('/preview/')?'-preview':'');

export function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
export function fresh(){return {v:2,rows:[],cards:{},log:[],hints:{},settings:{sound:false}};}
function load(){
  try{const raw=localStorage.getItem(STORE);if(raw){const s=JSON.parse(raw);if(s&&s.rows&&s.cards)return Object.assign(fresh(),s);}}catch(e){}
  return fresh();
}
export function save(){try{localStorage.setItem(STORE,JSON.stringify(S));}catch(e){}}

export let S=load();
delete S.settings.target; // the test-date setting (and its deadline mode) has been removed

/** Swap in a whole new progress object (restoring a backup, or resetting) and save it. */
export function replaceState(next){S=next;save();}
