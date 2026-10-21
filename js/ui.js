// Small shared pieces for building screens: the app box, icons, toasts, and the text and colour helpers.

import {S,ymd} from './storage.js';
import {TYPES} from './deck.js';
import {activeCards,cardScore} from './scheduler.js';
import {canSpeak} from './sound.js';

/** The one box on the page that every screen is drawn into. */
export const app=document.getElementById('app');

/** Make text safe to put inside HTML (used for anything the user typed). */
export const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const SPK_ICON='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
export const PLAY_ICON=SPK_ICON.replace('width="22" height="22"','width="56" height="56"');
// "Don't know" counts as a miss, so the card comes back soon instead of being rewarded for a lucky guess
export const DK='<button class="dk" data-act="answer" data-k="?">Don\'t know</button>';

export function spkBtn(k){return canSpeak?`<button class="spk" data-act="speak" data-k="${k}" aria-label="Play sound">${SPK_ICON}</button>`:'';}
export function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800);}

/** Colour level for a kana on the chart: -1 not added, 1 learning, 2 shaky, 3 good, 4 solid. */
export function level(it){
  if(!S.rows.includes(it.row))return -1;
  // With writing switched off, score on reading and recall only, scaled so "solid" is still reachable
  const ts=S.settings.write===false?['read','recall']:TYPES;
  const avg=ts.reduce((a,t)=>a+cardScore(it.k+'|'+t),0)/ts.length;
  return avg<1.5?1:avg<2.5?2:avg<3.5?3:4;
}
/** How many days in a row there's been some practice (today counts if done, otherwise up to yesterday). */
export function streak(){
  const days=new Set(S.log.map(l=>ymd(new Date(l.t))));
  const d=new Date();if(!days.has(ymd(d)))d.setDate(d.getDate()-1);
  let n=0;while(days.has(ymd(d))){n++;d.setDate(d.getDate()-1);}
  return n;
}
export function nextDueText(){
  let min=Infinity;for(const id of activeCards()){const c=S.cards[id];if(c&&c.due<min)min=c.due;}
  if(min===Infinity)return '';
  const diff=min-Date.now();
  if(diff<3600e3){const m=Math.max(1,Math.round(diff/60000));return `More cards will be ready in about ${m} ${m===1?'minute':'minutes'}.`;}
  const d=new Date(min),today=new Date();
  if(ymd(d)===ymd(today))return `More cards will be ready at ${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}.`;
  const tm=new Date();tm.setDate(tm.getDate()+1);
  if(ymd(d)===ymd(tm))return 'More cards will be ready tomorrow.';
  return `More cards will be ready on ${d.toLocaleDateString('en-GB',{weekday:'long'})}.`;
}
export function paceText(){
  const st=streak();
  return st>=2?`You've practised ${st} days running.`:'';
}
