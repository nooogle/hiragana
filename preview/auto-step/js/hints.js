// Memory hints. Suggested hints for the basic kana; the ones with dakuten or handakuten get a hint
// built from their base kana. Anyone can replace a hint with their own; those are kept in S.hints
// and saved with the rest of the progress.

import {S,save} from './storage.js';
import {ROWS,ROWMAP,BY} from './deck.js';
import {esc,toast} from './ui.js';
import {openSheet,closeSheet,rowSheet} from './sheets.js';

export const HINTS={
'あ':'There\'s a wonky capital A hiding in it: the cross and the swoop. お looks similar but has an extra flick at the top right.',
'い':'Two eels standing side by side.',
'う':'A U lying on its side, wearing a little hat.',
'え':'A bird with a feather on its head and a zig-zag tail, saying "Eh?"',
'お':'Like あ, but with an extra flick at the top right. "Oh! There\'s an extra bit."',
'か':'Someone doing karate: a bent arm and a little flick for the "Ka!"',
'き':'A key: the two crossbars are the teeth and the curve at the bottom is the handle.',
'く':'A bird\'s beak open wide, going "coo".',
'け':'A keg standing next to a post. The short line across is the metal hoop round the barrel.',
'こ':'Two short lines lying together, a cosy couple.',
'さ':'A cross over a separate little curve that opens to the right, like a sickle swishing through grass. In ち the curve is joined on and bulges the other way, like a 5.',
'し':'A fishing hook, or one long strand of her hair: "she".',
'す':'Someone on a rope swing, looping round once: "swing", "su".',
'せ':'A wide-open mouth with one sharp tooth, ready to "say" something.',
'そ':'A zig-zag thread ending in a curly needle: "sew".',
'た':'A little t with two strokes beside it that look a bit like an a. t + a = ta.',
'ち':'Looks like a 5 with a cross at the top. High five, cheers! Its curve is joined on and bulges right, the opposite way to さ.',
'つ':'A big wave rolling over: tsunami.',
'て':'An arm reaching out with the hand curling round. Te is Japanese for hand.',
'と':'A big toe with a splinter sticking out of it.',
'な':'A cross with a knot tied underneath. Knot, "na".',
'に':'A knee: picture the tall stick as a leg, with the two short lines as a knee pad strapped on.',
'ぬ':'Noodles lifted on chopsticks, with a loop at the end. め is the same but with no loop.',
'ね':'A cat (neko) sitting with its tail curled round at the end.',
'の':'One quick swirl, like a no-entry sign drawn in a hurry. No!',
'は':'A stick next to a cross with a loop, like a capital H joined to an a. ほ has one extra line on top.',
'ひ':'A big grinning mouth: "hee hee!"',
'ふ':'Mount Fuji, with little clouds puffing out on each side.',
'へ':'A small hill: "Hey, a hill!"',
'ほ':'Like は with an extra line on top. Two lines on the right: "ho ho".',
'ま':'A ship\'s mast with two crossbars, and the sail rolled up into a loop at the bottom. も also has two bars but ends in a hook, not a loop.',
'み':'It looks a bit like a scribbled 21. "Look at me, I\'m 21!"',
'む':'A cow\'s head with one horn sticking out: "moo".',
'め':'An eye. Me is Japanese for eye. No loop at the end, unlike ぬ.',
'も':'A fish hook with two bars across it: catch more fish.',
'や':'A yak\'s head with its horns sticking up.',
'ゆ':'A round fish with a line down its middle, swimming straight at you: "you".',
'よ':'A yo-yo dangling on its string.',
'ら':'A little rabbit with one ear up.',
'り':'Two reeds by a river, one longer than the other.',
'る':'A route that ends in a loop. ろ is the same road with no loop.',
'れ':'A leg kicking straight out. れ ends in a kick, ね curls into a loop and わ curves round smoothly.',
'ろ':'A road with no loop at the end. る has the loop.',
'わ':'A wave rolling in and curving back round: "wa". It ends in a smooth curve, unlike ね, which curls into a little loop.',
'を':'Someone bent right over saying "Whoa!" Said just like お.',
'ん':'Looks like a lowercase n with a tail flicking up.'
};
// Base kana and sound change for the dakuten (two little marks) and handakuten (little circle) rows
ROWS.filter(r=>r.base).forEach(r=>{const base=[...ROWMAP[r.base].k];[...r.k].forEach((k,i)=>{
  const b=base[i],br=BY[b].r,kr=BY[k].s,circle=r.id==='p';
  HINTS[k]=k==='ぢ'?'ち with two little marks. It sounds just like じ, and you won\'t see it very often.'
    :k==='づ'?'つ with two little marks. It sounds just like ず, and you won\'t see it very often.'
    :`${b} with ${circle?'a little circle':'two little marks'}, so ${br} becomes ${kr}.`;});});

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
