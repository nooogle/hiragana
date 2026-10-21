// Choosing which cards come up: due reviews, practice on the weakest, and a run through everything.

import {S} from './storage.js';
import {KANA,BY} from './deck.js';
import {activeCards,cardScore} from './scheduler.js';

export function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// Shuffle but never put two cards from the same row (or same kana) back to back
function spread(ids){
  const pool=shuffle(ids),out=[];
  while(pool.length){
    const last=out.length?BY[out[out.length-1].split('|')[0]]:null;
    let idx=last?pool.findIndex(id=>{const it=BY[id.split('|')[0]];return it.row!==last.row&&it.k!==last.k;}):0;
    if(idx<0)idx=0;
    out.push(pool.splice(idx,1)[0]);
  }
  return out;
}

/** Cards due now, then a few not started yet; at most 30 per session. */
export function buildReview(){
  const now=Date.now(),due=[],newer=[],intro=[];
  for(const id of activeCards()){
    const c=S.cards[id];
    if(!c)(id.endsWith('|read')?intro:newer).push(id);
    else if(c.due<=now)due.push(id);
  }
  let q=shuffle(due).slice(0,30);
  q=q.concat(shuffle(newer).slice(0,Math.max(0,Math.min(12,30-q.length))));
  q=q.concat(shuffle(intro).slice(0,Math.max(0,Math.min(8,30-q.length))));
  return spread(q);
}

/** The weakest started cards (optionally just one row), for extra practice. */
export function buildPractice(rowId){
  let ids=activeCards().filter(id=>rowId?BY[id.split('|')[0]].row===rowId:!!S.cards[id]);
  const score=id=>{const c=S.cards[id];return cardScore(id)-Math.min(c?c.lapses:0,3)*0.5+Math.random()*1.5;};
  ids=ids.map(id=>[score(id),id]).sort((a,b)=>a[0]-b[0]).slice(0,rowId?20:15).map(x=>x[1]);
  return spread(ids);
}

/** One card for every hiragana already started, shuffled; runs as practice so it doesn't disturb the schedule. */
export function buildRunThrough(){
  const ids=[];
  KANA.forEach(it=>{const started=activeCards().filter(id=>id.startsWith(it.k+'|')&&S.cards[id]);
    if(started.length)ids.push(started[Math.floor(Math.random()*started.length)]);});
  return spread(ids);
}
