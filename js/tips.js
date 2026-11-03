// One-time tips during practice: a small bubble under the thing it explains, shown the first time that thing
// appears. It stays until "Got it" or the next step (answering, marking, moving on). Each tip shows once per phone (S.settings.tips lists the ones seen);
// "Show tips again" in Settings clears the list.

import {S,save} from './storage.js';

// In priority order: when several could show at once, only the first unseen one does (the rest wait for next time).
// sel finds the thing the tip points at (and need, if given, must be inside it); the bubble goes just below it.
const TIPS=[
  {id:'strokes',sel:'.wsq',need:'.trace',text:'<b>Watch the stroke order</b>, drawn in red over yours. Tap the box to see it again.'},
  {id:'practise',sel:'#wbtns',need:'[data-act="practise"]',text:'<b>Practise</b> takes you through it one stroke at a time, like a practice sheet. It won\'t change your mark.'},
  {id:'dk',sel:'.dk',text:'<b>Not sure? Tap Don\'t know.</b> A lucky guess hides a kana you haven\'t learnt yet.'},
  {id:'listen',sel:'#lsq',need:'.play',text:'<b>A listening card.</b> Tap the speaker to hear it again. Somewhere you can\'t play sound? There\'s a button for that below.'},
  {id:'hint',sel:'.mn',need:'.mnedit',text:'<b>Make the hints yours.</b> Tap <b>Write your own hint</b> for one that works for you. Got a good one? Send it in from Settings.'},
];

let shown=null; // the bubble on screen

function close(){if(shown){shown.remove();shown=null;}}

/** Look at what's on screen and show the first tip that applies and hasn't been seen yet. Call after drawing a screen. */
export function showTips(){
  close(); // moving on to the next step closes the last tip
  const seen=S.settings.tips||[];
  for(const t of TIPS){
    if(seen.includes(t.id))continue;
    const anchor=document.querySelector(t.sel);
    if(!anchor||(t.need&&!anchor.querySelector(t.need)))continue;
    const el=document.createElement('div');el.className='tip';el.setAttribute('role','note');
    el.innerHTML=`<p>${t.text}</p><button class="link" data-act="tipok">Got it</button>`;
    anchor.insertAdjacentElement('afterend',el);
    shown=el;
    S.settings.tips=seen.concat(t.id);save();
    return;
  }
}

/** "Got it" on a tip. */
export function closeTip(){close();showTips();}

/** "Show tips again" in Settings. */
export function resetTips(){close();S.settings.tips=[];save();}
