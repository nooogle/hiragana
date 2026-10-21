// Offline cache for Hiragana drill: every page, script, stylesheet and voice clip is stored on the phone.
// Pages, scripts and styles are fetched fresh whenever there's signal (and the saved copy is updated),
// so code updates arrive straight away and old and new files never get mixed.
// Voice clips are taken from the cache first. Change VERSION when the clips change, or files are added.
const VERSION='hiragana-2026-10-21a';
const FILES=["./","how-it-works.html","how-the-voice-was-made.html","index.html","css/style.css","js/app.js","js/deck.js","js/drawing.js","js/hints.js","js/queues.js","js/scheduler.js","js/sheets.js","js/sound.js","js/storage.js","js/ui.js","js/screens/home.js","js/screens/report.js","js/screens/session.js","vendor/ts-fsrs-5.4.2.mjs","audio/a.mp3","audio/ba.mp3","audio/be.mp3","audio/bi.mp3","audio/bo.mp3","audio/bu.mp3","audio/bya.mp3","audio/byo.mp3","audio/byu.mp3","audio/cha.mp3","audio/chi.mp3","audio/cho.mp3","audio/chu.mp3","audio/da.mp3","audio/de.mp3","audio/di.mp3","audio/do.mp3","audio/du.mp3","audio/e.mp3","audio/fu.mp3","audio/ga.mp3","audio/ge.mp3","audio/gi.mp3","audio/go.mp3","audio/gu.mp3","audio/gya.mp3","audio/gyo.mp3","audio/gyu.mp3","audio/ha.mp3","audio/he.mp3","audio/hi.mp3","audio/ho.mp3","audio/hya.mp3","audio/hyo.mp3","audio/hyu.mp3","audio/i.mp3","audio/ja.mp3","audio/ji.mp3","audio/jo.mp3","audio/ju.mp3","audio/ka.mp3","audio/ke.mp3","audio/ki.mp3","audio/ko.mp3","audio/ku.mp3","audio/kya.mp3","audio/kyo.mp3","audio/kyu.mp3","audio/ma.mp3","audio/me.mp3","audio/mi.mp3","audio/mo.mp3","audio/mu.mp3","audio/mya.mp3","audio/myo.mp3","audio/myu.mp3","audio/n.mp3","audio/na.mp3","audio/ne.mp3","audio/ni.mp3","audio/no.mp3","audio/nu.mp3","audio/nya.mp3","audio/nyo.mp3","audio/nyu.mp3","audio/o.mp3","audio/pa.mp3","audio/pe.mp3","audio/pi.mp3","audio/po.mp3","audio/pu.mp3","audio/pya.mp3","audio/pyo.mp3","audio/pyu.mp3","audio/ra.mp3","audio/re.mp3","audio/ri.mp3","audio/ro.mp3","audio/ru.mp3","audio/rya.mp3","audio/ryo.mp3","audio/ryu.mp3","audio/sa.mp3","audio/se.mp3","audio/sha.mp3","audio/shi.mp3","audio/sho.mp3","audio/shu.mp3","audio/so.mp3","audio/su.mp3","audio/ta.mp3","audio/te.mp3","audio/to.mp3","audio/tsu.mp3","audio/u.mp3","audio/wa.mp3","audio/wo.mp3","audio/ya.mp3","audio/yo.mp3","audio/yu.mp3","audio/za.mp3","audio/ze.mp3","audio/zo.mp3","audio/zu.mp3"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hiragana-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  if(url.pathname.includes('/audio/')){ // clips: cache first
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
    return;
  }
  // everything else: network first, saved copy when offline
  e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy));}return r;})
    .catch(()=>caches.match(req,{ignoreSearch:true}).then(hit=>hit||(req.mode==='navigate'?caches.match('./'):undefined))));
});
