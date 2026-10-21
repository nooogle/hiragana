// Keyboard shortcuts for using the app on a computer.
// Each key just presses the matching button on screen, so all the normal button handling in app.js
// still applies and there's nothing to keep in step.
//
//   1-4          pick an answer          0, D or ?   Don't know
//   Enter/Space  Next, Got it, Check, or the main button on the home and done screens
//   Y / N        Got it / Not quite on writing cards
//   P or R       play the sound again    C           clear the drawing
//   Esc          close a pop-up panel

import {closeSheet} from './sheets.js';

// The first matching button that's on screen and usable
const visible=sel=>[...document.querySelectorAll(sel)].find(el=>!el.disabled&&el.offsetParent!==null);
function press(sel){const el=visible(sel);if(el){el.click();return true;}return false;}

document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return; // leave browser shortcuts alone
  const k=e.key.toLowerCase();
  if(document.getElementById('scrim')){ // a pop-up panel is open: only Esc does anything
    if(k==='escape'){closeSheet();e.preventDefault();}
    return;
  }
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return; // typing somewhere
  // Enter or Space on a button that has keyboard focus already presses that button, so don't press another
  if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button'))return;
  let done=false;
  if(/^[1-4]$/.test(k)){
    const opts=[...document.querySelectorAll('.opt')].filter(b=>!b.disabled);
    if(opts[+k-1]){opts[+k-1].click();done=true;}
  }
  else if(k==='0'||k==='?'||k==='d')done=press('.dk');
  else if(k==='enter'||k===' ')done=press('[data-act="next"]')||press('[data-act="introok"]')||press('[data-act="check"]')||press('.hero .primary');
  else if(k==='y')done=press('[data-act="self"][data-ok="1"]');
  else if(k==='n')done=press('[data-act="self"][data-ok="0"]');
  else if(k==='p'||k==='r')done=press('.play')||press('.spk');
  else if(k==='c')done=press('[data-act="clear"]');
  if(done)e.preventDefault(); // e.g. stop Space scrolling the page
});
