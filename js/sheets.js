// Pop-up panels that slide up from the bottom: row options and Settings.
// (The hint editor is also a sheet, and lives in hints.js.)

import {S} from './storage.js';
import {ROWMAP,BY} from './deck.js';
import {hasTTS} from './sound.js';

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

export function settingsSheet(){
  openSheet(`<h2>Settings</h2>
    <label class="toggle"><input type="checkbox" id="wrt" ${S.settings.write!==false?'checked':''}>Include writing practice</label>
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
    <p class="sub" style="font-size:.8rem;margin-top:16px">Reviews are scheduled with FSRS (ts-fsrs, MIT licence), aiming for 90% recall. <a href="how-it-works.html">How it all works</a></p>
    <button class="danger" data-act="reset">Reset all progress</button>
    <button class="secondary" data-act="close">Done</button>`);
}
