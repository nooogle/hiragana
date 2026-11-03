// The stroke order animation shown after "Check" on writing cards: each stroke draws itself in turn,
// with its number appearing where it starts. Also the pictures for Practise, one stroke at a time.
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

/** Draw kana k's strokes into box (replacing what's there) and animate them in order.
 *  Returns false if there's no stroke data for k, so the caller can show the plain kana instead. */
export function playStrokes(box,k){
  const d=STROKES[k];if(!d)return false;
  box.innerHTML=`<svg class="strokes" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.map(p=>`<path d="${p}"/>`).join('')}
    ${d.n.map(([x,y],i)=>`<text x="${x}" y="${y}">${i+1}</text>`).join('')}</svg>`;
  if(!canAnimate())return true; // just show the finished character with its numbers
  const nums=box.querySelectorAll('text');
  let delay=0;
  box.querySelectorAll('path').forEach((p,i)=>{
    const duration=drawIn(p,delay);
    nums[i].animate([{opacity:0},{opacity:1}],{duration:150,delay,fill:'both'});
    delay+=duration+GAP_MS;
  });
  return true;
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

/** Animate the highlighted stroke in a Practise picture drawing itself. */
export function drawInStep(box){
  const p=box.querySelector('.now');
  if(p&&canAnimate())drawIn(p,0);
}
