// Pop-up panels that slide up from the bottom: row options, Settings and Send feedback.
// (The hint editor is also a sheet, and lives in hints.js.)

import {S} from './storage.js';
import {ROWMAP,BY,KANA} from './deck.js';
import {hasTTS} from './sound.js';
import {isManual,manualTypes} from './scheduler.js';

export function openSheet(html){
  closeSheet();
  const s=document.createElement('div');s.className='scrim';s.id='scrim';
  s.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  s.addEventListener('click',e=>{if(e.target===s)closeSheet();});
  document.body.appendChild(s);
}
export function closeSheet(){const s=document.getElementById('scrim');if(s)s.remove();}

export function rowSheet(id){
  const row=ROWMAP[id],on=S.rows.includes(id);
  if(on){
    openSheet(`<h2>The ${row.k[0]} row</h2>
      <p class="sub" style="margin-bottom:6px">Tap a kana to see or change its hint.</p>
      <div class="hintkeys">${[...row.k].map(k=>`<button class="${S.hints[k]?'mine':''}" data-act="edithint" data-k="${k}" aria-label="Hint for ${BY[k].r}">${k}</button>`).join('')}</div>
      <button class="primary" data-act="rowpractice" data-row="${id}">Practise this row</button>
      <button class="secondary" data-act="rowremove" data-row="${id}">Remove from my chart</button>
      <button class="secondary" data-act="close">Cancel</button>`);
    return;
  }
  const baseNote=row.base&&!S.rows.includes(row.base)?`<p class="sub">Tip: these build on the ${ROWMAP[row.base].k[0]} row, which isn't in your chart yet.</p>`:'';
  openSheet(`<h2>Add the ${row.k[0]} row</h2><p class="preview kana">${row.k}</p>${baseNote}
    <button class="primary" data-act="rowadd" data-row="${id}">I already know these</button>
    <p class="sub" style="margin-top:8px">You'll get a quick check. Any you miss start from the beginning.</p>
    <button class="secondary" data-act="rownew" data-row="${id}">They're new to me</button>
    <button class="secondary" data-act="close">Cancel</button>`);
}

// The card types offered in manual mode, in the order they're listed
const MANUAL_TYPES=[['write','Writing'],['recall','Romaji or sound → hiragana'],['read','Hiragana → romaji']];

export function settingsSheet(){
  const manual=isManual(),types=manualTypes();
  openSheet(`<h2>Settings</h2>
    <h3>Help and feedback</h3>
    <button class="secondary" data-act="feedback">Send feedback</button>
    <button class="secondary" data-act="welcome">Show the welcome again</button>
    <button class="secondary" data-act="tipsreset">Show tips again</button>
    <h3>What to practise</h3>
    <label class="toggle"><input type="radio" name="pmode" value="auto" ${manual?'':'checked'}>Automatic</label>
    <div id="pauto" ${manual?'hidden':''}>
      <p class="sub">Reading first, then picking the kana from romaji, then writing, each unlocking as you get the one before.</p>
      <label class="toggle"><input type="checkbox" id="wrt" ${S.settings.write!==false?'checked':''}>Include writing practice</label>
    </div>
    <label class="toggle"><input type="radio" name="pmode" value="manual" ${manual?'checked':''}>Manual</label>
    <div id="pmanual" ${manual?'':'hidden'}>
      <p class="sub">Only the ones you tick, for every kana in your chosen rows.</p>
      ${MANUAL_TYPES.map(([t,name])=>`<label class="toggle"><input type="checkbox" name="ptype" value="${t}" ${types.includes(t)?'checked':''}>${name}</label>`).join('')}
    </div>
    <h3>Sound</h3>
    <label class="toggle"><input type="checkbox" id="snd" ${S.settings.sound?'checked':''}>Play sounds automatically</label>
    <label class="field">Voice<select id="voice">
      <option value="rec" ${S.settings.voice!=='phone'?'selected':''}>Recorded voice (clearest)</option>
      ${hasTTS?`<option value="phone" ${S.settings.voice==='phone'?'selected':''}>This phone's voice</option>`:''}
    </select></label>
    <button class="secondary" data-act="testvoice">Test: は へ を ん</button>
    <p class="sub" style="font-size:.8rem;margin-top:10px">Recorded voice: Google Cloud Text-to-Speech (Chirp 3 HD, Aoede). <a href="how-the-voice-was-made.html">How the clips were made</a></p>
    <h3>Backup</h3>
    <p class="sub">Progress is stored on this phone only. Copy a backup now and then, and paste it here to restore it.</p>
    <button class="secondary" data-act="copy">Copy backup</button>
    <textarea id="restore" placeholder="Paste a backup here"></textarea>
    <button class="secondary" data-act="restore">Restore from backup</button>
    <p class="sub" style="font-size:.8rem;margin-top:16px">Reviews are scheduled with FSRS (ts-fsrs, MIT licence), aiming for 90% recall. Stroke order from <a href="https://kanjivg.tagaini.net/">KanjiVG</a> by Ulrich Apel (CC BY-SA 3.0). <a href="how-it-works.html">How it all works</a></p>
    <button class="danger" data-act="reset">Reset all progress</button>
    <button class="secondary" data-act="close">Done</button>`);
}

// ----- Send feedback -----
// There's no server, so feedback goes by email: this opens the person's own email app with a message started.
const FEEDBACK_TO='jon@carpediemsystems.co.uk';

function feedbackBody(withHints,version){
  const mine=KANA.filter(x=>S.hints[x.k]).map(x=>`${x.k} (${x.r}): ${S.hints[x.k]}`);
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ua=navigator.userAgent,device=/iPhone|iPad|iPod/.test(ua)?'iPhone/iPad':/Android/.test(ua)?'Android':'Computer';
  let body='\n\n\n';
  if(withHints&&mine.length)body+='--- My hints ---\n'+mine.join('\n')+'\n\n';
  return body+`--- About this phone (to help with any problems) ---\nApp version ${version}, ${device}${standalone?', home screen app':''}`;
}

export function feedbackSheet(){
  const n=Object.keys(S.hints).filter(k=>S.hints[k]).length;
  openSheet(`<h2>Send feedback</h2>
    <p class="sub">Spotted a mistake, got an idea, or a better memory hint? This opens your email app with a message ready to go. Add your thoughts and press Send.</p>
    ${n?`<label class="toggle"><input type="checkbox" id="fbhints" checked>Include my own hints (${n})</label>`:''}
    <a class="primary" id="fbmail" href="#">Write email</a>
    <p class="sub" style="font-size:.8rem;margin-top:10px">Or email ${FEEDBACK_TO} yourself.</p>
    <button class="secondary" data-act="close">Close</button>`);
  let version='unknown';
  const update=()=>{const a=document.getElementById('fbmail'),cb=document.getElementById('fbhints');if(!a)return;
    a.href=`mailto:${FEEDBACK_TO}?subject=${encodeURIComponent('Hiragana drill feedback')}&body=${encodeURIComponent(feedbackBody(!cb||cb.checked,version))}`;};
  update();
  {const cb=document.getElementById('fbhints');if(cb)cb.addEventListener('change',update);}
  // The app version is the offline cache's name (set when sw.js is rebuilt)
  if(window.caches)caches.keys().then(keys=>{const k=keys.find(x=>/^hiragana-\d/.test(x));if(k){version=k.replace('hiragana-','');update();}}).catch(()=>{});
}
