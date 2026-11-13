// Memory hints. The suggested hints are in hintdata.js. Anyone can replace a hint with their own; those are kept in S.hints
// and saved with the rest of the progress.

import {S,save} from './storage.js';
import {BY} from './deck.js';
import {HINTS} from './hintdata.js';
import {esc,toast} from './ui.js';
import {openSheet,closeSheet,rowSheet} from './sheets.js';

export {HINTS};

function hintFor(k){const mine=S.hints&&S.hints[k];return mine?{text:mine,mine:true}:{text:HINTS[k]||'',mine:false};}

/** One hint box; showKana adds the kana in front (used when two hints are shown together). */
export function hintBox(k,showKana){
  const h=hintFor(k);if(!h.text)return '';
  return `<div class="mn${h.mine?' mine':''}" data-hk="${k}"><span class="lbl">${h.mine?'Your hint':'Hint'}</span><p>${showKana?`<span class="k">${k}</span>`:''}${esc(h.text)}</p><button class="mnedit" data-act="edithint" data-k="${k}">${h.mine?'Change your hint':'Write your own hint'}</button></div>`;
}
// Redraw any hint boxes for this kana that are on screen (after editing it)
function refreshHints(k){document.querySelectorAll(`[data-hk="${k}"]`).forEach(el=>{const two=!!el.querySelector('.k');el.outerHTML=hintBox(k,two);});}

let hintFromRow=null; // the chart row the editor was opened from, so saving can go back to it
/** Open the hint editor for a kana; fromRow is the row id when opened from the chart. */
export function editHint(k,fromRow){
  hintFromRow=fromRow||null;
  const h=hintFor(k);
  openSheet(`<h2>Your hint for <span class="kana" style="font-size:1.6rem">${k}</span> (${BY[k].r})</h2>
    <textarea id="hinttext" placeholder="Write something that helps you remember it">${h.mine?esc(h.text):''}</textarea>
    <div class="sugg"><b>Suggested:</b> ${esc(HINTS[k]||'')}</div>
    <button class="primary" data-act="savehint" data-k="${k}">Save</button>
    ${h.mine?`<button class="secondary" data-act="resethint" data-k="${k}">Use the suggested hint</button>`:''}
    <button class="secondary" data-act="close">Cancel</button>`);
}
/** Save the user's own hint (empty text means go back to the suggested one). */
export function setHint(k,text){
  if(text)S.hints[k]=text;else delete S.hints[k];
  save();closeSheet();refreshHints(k);toast(text?'Hint saved':'Using the suggested hint');
  if(hintFromRow)rowSheet(hintFromRow); // back to the row it was opened from
}
