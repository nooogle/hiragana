// The stroke order animation shown after "Check" on writing cards: each stroke draws itself in turn,
// with its number appearing where it starts. Also the pictures for Practise (one stroke more at each step in the
// classic worksheet), and a rough check of the order and direction someone drew the strokes in.
// Stroke data comes from KanjiVG (see vendor/kanjivg-LICENSE.txt).

import {STROKES} from '../vendor/kanjivg-hiragana.js';

// Strokes are drawn at a steady pen speed, so long ones take longer (lengths are in the 109-unit box:
// from about 12 for a dakuten dot to 290 for the loop in ぬ). Even the shortest take MIN_MS, so they can be seen.
const SPEED=120/1000,MIN_MS=200,GAP_MS=150; // SPEED in units per millisecond
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate=()=>!reduceMotion()&&!!Element.prototype.animate;

// Animate one stroke drawing itself, starting after delay ms. Returns how long it takes.
function drawIn(p,delay){
  const len=p.getTotalLength(),duration=Math.max(MIN_MS,len/SPEED);
  p.style.strokeDasharray=len;
  p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration,delay,easing:'ease-in-out',fill:'both'});
  return duration;
}

/** Kana k's whole strokes as a picture, with their numbers unless nums is false. */
export function strokesSVG(k,nums=true){
  const d=STROKES[k];
  return `<svg class="strokes" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.map(p=>`<path d="${p}"/>`).join('')}
    ${nums?d.n.map(([x,y],i)=>`<text x="${x}" y="${y}">${i+1}</text>`).join(''):''}</svg>`;
}

/** Draw kana k's strokes into box (replacing what's there) and animate them in order (with numbers unless nums is false).
 *  Returns false if there's no stroke data for k, so the caller can show the plain kana instead. */
export function playStrokes(box,k,nums=true){
  if(!STROKES[k])return false;
  box.innerHTML=strokesSVG(k,nums);
  drawAll(box);
  return true;
}

// Animate every stroke in box drawing itself in order, each number appearing as its stroke starts.
// Without animation the finished picture (with its numbers) just stays as it is.
function drawAll(box){
  if(!canAnimate())return;
  const nums=box.querySelectorAll('text');
  let delay=0;
  box.querySelectorAll('path').forEach((p,i)=>{
    const duration=drawIn(p,delay);
    if(nums[i])nums[i].animate([{opacity:0},{opacity:1}],{duration:150,delay,fill:'both'});
    delay+=duration+GAP_MS;
  });
}

/** How many strokes kana k has (0 if there's no stroke data). */
export const strokeCount=k=>STROKES[k]?STROKES[k].s.length:0;

/** A Practise picture: kana k's first n strokes, the earlier ones grey and stroke n highlighted (with all their numbers if num). */
export function stepSVG(k,n,num){
  const d=STROKES[k],now=i=>i===n-1?' class="now"':'';
  return `<svg class="steps" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.slice(0,n).map((p,i)=>`<path d="${p}"${now(i)}/>`).join('')}
    ${num?d.n.slice(0,n).map(([x,y],i)=>`<text x="${x}" y="${y}"${now(i)}>${i+1}</text>`).join(''):''}</svg>`;
}

/** Animate a Practise picture: all its strokes draw themselves in order, so it's clear they're all to be traced. */
export const drawInStep=drawAll;

// ----- Checking the order and direction of someone's strokes -----
// Only a rough check: each stroke they drew is paired with the real stroke whose start and end are nearest
// (trying every way of pairing them up), and then we look at whether the pairs come in the right order and
// whether any stroke was drawn from its end to its start. Very short strokes (like the dakuten dots) are too
// small to tell which way they went, so their direction isn't checked.
const SHORT=20; // strokes shorter than this (in the 109-unit box) don't get a direction check

// Where each of kana k's strokes starts and ends, and how long it is (worked out once, then kept)
const ends={};
function strokeEnds(k){
  if(ends[k])return ends[k];
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('style','position:absolute;width:0;height:0;visibility:hidden');
  document.body.appendChild(svg);
  ends[k]=STROKES[k].s.map(d=>{
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);svg.appendChild(p);
    const len=p.getTotalLength(),a=p.getPointAtLength(0),b=p.getPointAtLength(len);
    return {a:[a.x,a.y],b:[b.x,b.y],len};
  });
  svg.remove();
  return ends[k];
}

const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
// Every way of ordering the numbers 0 to n-1
const orders=n=>n?orders(n-1).flatMap(o=>Array.from({length:n},(_,i)=>[...o.slice(0,i),n-1,...o.slice(i)])):[[]];
const list=xs=>xs.length>1?xs.slice(0,-1).join(', ')+' and '+xs[xs.length-1]:String(xs[0]);

/** Compare strokes drawn (a drawing pad's cv.strokes) with kana k's real ones.
 *  Returns {ok, notes} where notes are short sentences to show, or null if there's no stroke data for k. */
export function checkStrokes(k,drawn){
  if(!STROKES[k])return null;
  const m=strokeEnds(k),u=drawn.filter(s=>s.length).map(s=>({a:s[0].map(v=>v*109),b:s[s.length-1].map(v=>v*109)}));
  const n=m.length;
  if(u.length!==n)return {ok:false,notes:[`You drew ${u.length} stroke${u.length===1?'':'s'}, but ${k} has ${n}, so the order couldn't be checked.`]};
  const fwd=(i,j)=>dist(u[i].a,m[j].a)+dist(u[i].b,m[j].b),rev=(i,j)=>dist(u[i].a,m[j].b)+dist(u[i].b,m[j].a);
  const cost=o=>o.reduce((t,j,i)=>t+Math.min(fwd(i,j),rev(i,j)),0);
  const best=orders(n).reduce((b,o)=>cost(o)<cost(b)?o:b); // best[i] is the real stroke that their stroke i matches
  const notes=[];
  if(best.some((j,i)=>j!==i))notes.push(`Stroke order: yours went ${best.map(j=>j+1).join(' → ')}. It should be ${best.map((_,i)=>i+1).join(' → ')}.`);
  const back=best.map((j,i)=>m[j].len>=SHORT&&rev(i,j)<fwd(i,j)?j+1:0).filter(Boolean).sort((a,b)=>a-b);
  if(back.length)notes.push(`${back.length>1?'Strokes':'Stroke'} ${list(back)} ${back.length>1?'look':'looks'} drawn the wrong way round.`);
  return notes.length?{ok:false,notes}:{ok:true,notes:['Stroke order and direction look right.']};
}
