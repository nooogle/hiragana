// Scheduling with FSRS.
// Each card keeps an FSRS memory state (stability and difficulty) and is next shown when recall is
// predicted to drop to 90%. Wrong or "Don't know" = Again; right answers are Hard, Good or Easy by speed.
// New and missed cards go through short learning steps (1 and 10 minutes) before longer gaps.

import {fsrs,generatorParameters,createEmptyCard,Rating,State} from '../vendor/ts-fsrs-5.4.2.mjs';
import {S,save} from './storage.js';
import {KANA,BY,TYPES} from './deck.js';

export {State};

// Gaps are capped at 60 days: multiple choice is easier than recalling from nothing, so very long gaps would be over-confident
const F=fsrs(generatorParameters({request_retention:0.9,maximum_interval:60,enable_fuzz:true}));

// Cards are stored with dates as plain numbers (milliseconds) so they survive being saved as JSON
const toCard=c=>Object.assign({},c,{due:new Date(c.due),last_review:c.last_review?new Date(c.last_review):undefined});
const fromCard=(c,ok)=>Object.assign({},c,{due:c.due.getTime(),last_review:c.last_review?c.last_review.getTime():null,ok});
export function newCard(now=Date.now()){return fromCard(createEmptyCard(new Date(now)),false);}

// Answer-time limits in ms for a right answer: quicker than the first is Easy, slower than the second is Hard
const SPEED={read:[1800,6000],recall:[2200,7000],listen:[3200,8000]};
function rating(type,ok,ms,listen,c){
  if(!ok)return Rating.Again;
  if(type==='write')return Rating.Good; // self-graded, so no speed signal
  const [easy,hard]=SPEED[listen?'listen':type];
  if(ms>hard)return Rating.Hard;
  if(ms<easy&&c&&c.state===State.Review)return Rating.Easy; // only once a card is past its learning steps
  return Rating.Good;
}
function schedule(c,r,now){
  return fromCard(F.next(toCard(c||newCard(now)),new Date(now),r).card,r!==Rating.Again);
}
// "I already know these": a right answer counts as two good reviews, so the card skips its learning steps
function placementGrade(c,ok,now){
  if(!ok)return schedule(c,Rating.Again,now);
  return schedule(schedule(c,Rating.Good,now),Rating.Good,now);
}

// A card type unlocks once the one before it (read, then recall, then write) is past its learning steps
function strong(id){const c=S.cards[id];return !!c&&c.state===State.Review;}
export function unlocked(it,t){
  if(!S.rows.includes(it.row))return false;
  if(t==='write'&&S.settings.write===false)return false;
  if(t==='read'||S.cards[it.k+'|'+t])return true; // once a card type has started it stays in
  return strong(it.k+'|'+(t==='recall'?'read':'recall'));
}
/** Every card id ("ね|read" and so on) that's currently in play. */
export function activeCards(){const ids=[];KANA.forEach(it=>TYPES.forEach(t=>{if(unlocked(it,t))ids.push(it.k+'|'+t);}));return ids;}

// 0 not started, 1 learning, 2-4 by how long it's expected to be remembered
export function cardScore(id){
  const c=S.cards[id];
  if(!c||c.state===State.New)return 0;
  if(c.state!==State.Review)return 1;
  return c.stability<4?2:c.stability<14?3:4;
}

/** Record an answer: update the card's schedule and add it to the answer log. */
export function grade(id,ok,mode,ms,listen){
  const now=Date.now(),type=id.split('|')[1],c=S.cards[id];
  let r=null;
  if(mode==='placement')S.cards[id]=placementGrade(c,ok,now);
  else if(mode==='practice'){if(!ok){r=Rating.Again;S.cards[id]=schedule(c,r,now);}} // extra practice: only misses change the schedule
  else{r=rating(type,ok,ms,listen,c);S.cards[id]=schedule(c,r,now);}
  S.log.push({t:now,id,ok,ms:Math.round(ms),m:mode,r});
  save();
}

// Progress saved by the old box scheduler is rebuilt by replaying every logged answer through FSRS
export function migrate(){
  if(S.v>=2)return;
  const old=S.cards,cards={},byId={};
  S.log.slice().sort((a,b)=>a.t-b.t).forEach(l=>{if(BY[l.id.split('|')[0]])(byId[l.id]=byId[l.id]||[]).push(l);});
  for(const id in byId){
    let c=null;const type=id.split('|')[1];
    for(const l of byId[id]){
      if(l.m==='practice'){if(!l.ok&&c)c=schedule(c,Rating.Again,l.t);continue;}
      if(l.m==='placement'){c=placementGrade(c,l.ok,l.t);continue;}
      c=schedule(c,rating(type,l.ok,l.ms,l.v==='listen',c),l.t);
    }
    if(c)cards[id]=c;
  }
  for(const id in old)if(!cards[id]&&BY[id.split('|')[0]])cards[id]=newCard(Math.min(old[id].due||Date.now(),Date.now()));
  S.cardsV1=old;S.cards=cards;S.v=2;save();
}
