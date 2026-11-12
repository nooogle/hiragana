// The stroke order animation shown after "Check" on writing cards: each stroke draws itself in turn,
// with its number appearing where it starts. Also the pictures for Practise (including the classic worksheet,
// which adds one stroke at each step).
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

export {STROKES};

// An entry can be two characters (きゃ): each gets its own picture, side by side in a .multi wrapper,
// with the strokes numbered straight through (き is 1-3, ゃ is 4-6).
const parts=k=>{let o=0;return [...k].map(ch=>{const p={ch,d:STROKES[ch],o};o+=p.d?p.d.s.length:0;return p;});};
const wrap=(k,svgs)=>[...k].length>1?`<span class="multi">${svgs.join('')}</span>`:svgs[0];

/** Kana k's whole strokes as a picture, with their numbers unless nums is false. */
export function strokesSVG(k,nums=true){
  return wrap(k,parts(k).map(({d,o})=>`<svg class="strokes" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.map(p=>`<path d="${p}"/>`).join('')}
    ${nums?d.n.map(([x,y],i)=>`<text x="${x}" y="${y}">${o+i+1}</text>`).join(''):''}</svg>`));
}

/** Draw kana k's strokes into box (replacing what's there) and animate them in order (with numbers unless nums is false).
 *  Returns false if there's no stroke data for k, so the caller can show the plain kana instead. */
export function playStrokes(box,k,nums=true){
  if(!strokeCount(k))return false;
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

/** How many strokes kana k has, across both characters (0 if any character has no stroke data). */
export const strokeCount=k=>{const p=parts(k);return p.every(x=>x.d)?p.reduce((n,x)=>n+x.d.s.length,0):0;};

/** A Practise picture: kana k's first n strokes, the earlier ones grey and stroke n highlighted (with all their numbers if num). */
export function stepSVG(k,n,num){
  return wrap(k,parts(k).map(({d,o})=>{const now=i=>o+i===n-1?' class="now"':'',m=Math.max(0,n-o);
    return `<svg class="steps" viewBox="0 0 109 109" aria-hidden="true">
    ${d.s.slice(0,m).map((p,i)=>`<path d="${p}"${now(i)}/>`).join('')}
    ${num?d.n.slice(0,m).map(([x,y],i)=>`<text x="${x}" y="${y}"${now(i)}>${o+i+1}</text>`).join(''):''}</svg>`;}));
}

/** Animate a Practise picture: all its strokes draw themselves in order, so it's clear they're all to be traced. */
export const drawInStep=drawAll;

