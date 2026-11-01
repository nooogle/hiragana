// The stroke order animation shown after "Check" on writing cards: each stroke draws itself in turn,
// with its number appearing where it starts. Stroke data comes from KanjiVG (see vendor/kanjivg-LICENSE.txt).

import {STROKES} from '../vendor/kanjivg-hiragana.js';

const STROKE_MS=500,GAP_MS=150;
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Draw kana k's strokes into box (replacing what's there) and animate them in order.
 *  Returns false if there's no stroke data for k, so the caller can show the plain kana instead. */
export function playStrokes(box,k){
  const d=STROKES[k];if(!d)return false;
  box.innerHTML=`<svg class="strokes" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.map(p=>`<path d="${p}"/>`).join('')}
    ${d.n.map(([x,y],i)=>`<text x="${x}" y="${y}">${i+1}</text>`).join('')}</svg>`;
  if(reduceMotion()||!Element.prototype.animate)return true; // just show the finished character with its numbers
  const paths=box.querySelectorAll('path'),nums=box.querySelectorAll('text');
  paths.forEach((p,i)=>{
    const len=p.getTotalLength(),delay=i*(STROKE_MS+GAP_MS);
    p.style.strokeDasharray=len;
    p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:STROKE_MS,delay,easing:'ease-in-out',fill:'both'});
    nums[i].animate([{opacity:0},{opacity:1}],{duration:150,delay,fill:'both'});
  });
  return true;
}
