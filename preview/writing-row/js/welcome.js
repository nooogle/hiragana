// The welcome screens for a first-time user: four short slides you swipe through (or tap Next), with Skip.
// Shown once; "Show the welcome again" in Settings brings them back. S.settings.welcomed is set when done.

import {S,save} from './storage.js';
import {app} from './ui.js';

const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

// Android (Chrome and others) offer their own install dialog, which a button can open. Hold on to it.
// Chrome would also pop up its own install banner; only hold that back when the welcome is about to show it instead.
let installEvt=null;
addEventListener('beforeinstallprompt',e=>{if(needsWelcome())e.preventDefault();installEvt=e;});
addEventListener('appinstalled',()=>{installEvt=null;});

/** True for someone who has never used the app (existing users skip the welcome). */
export function needsWelcome(){return !S.settings.welcomed&&!S.rows.length&&!S.log.length;}

function installHTML(){
  if(isStandalone())return '';
  if(installEvt)return `<div class="wbox"><b>Make it an app</b><p>Put it on your home screen, and it works offline too.</p><button class="secondary" data-act="install">Install app</button></div>`;
  if(isIOS)return `<div class="wbox"><b>Make it an app</b><p>In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>. It works offline too.</p></div>`;
  return `<div class="wbox"><b>Make it an app</b><p>In your browser's menu, look for <b>Install app</b> or <b>Add to home screen</b>. It works offline too.</p></div>`;
}

const SLIDES=()=>[
  `<div class="wbig kana">あ</div><h2>Learn to read and write hiragana</h2>
   <p>A few minutes a day. The ones you find hard come back more often, and the ones you know drift away.</p>`,
  `<h2>Practise the way you'll be tested</h2>
   <ul><li><b>Read it:</b> pick the sound</li><li><b>Recognise it:</b> from romaji, or by ear</li><li><b>Write it:</b> draw it, see the stroke order, and mark yourself</li></ul>
   <p>The app moves you on as you improve. Or choose exactly what to practise in <b>Settings → What to practise</b>, such as writing only.</p>`,
  `<h2>Your progress stays on your phone</h2>
   <p>No account, no sign-up, no ads. Copy a backup in Settings now and then.</p>${installHTML()}`,
  `<h2>Help make it better</h2>
   <p>This app is new and gets improved all the time. Spotted a mistake, or got a better memory hint? I'd love to hear it.</p>
   <button class="secondary" data-act="feedback">Send feedback</button><p class="wnote">You'll find this in Settings too.</p>`,
];

export function renderWelcome(){
  const slides=SLIDES();
  app.innerHTML=`<section class="welcome">
    <button class="link wskip" data-act="wdone">Skip</button>
    <div class="wslides" id="wslides">${slides.map((h,i)=>`<div class="wslide" aria-label="${i+1} of ${slides.length}">${h}</div>`).join('')}</div>
    <div class="wdots" aria-hidden="true">${slides.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>
    <button class="primary" data-act="wnext" id="wnext">Next</button></section>`;
  const box=document.getElementById('wslides');
  box.addEventListener('scroll',()=>{ // swiping: keep the dots and the button in step
    const i=slideIndex(box);
    document.querySelectorAll('.wdots i').forEach((d,j)=>d.classList.toggle('on',i===j));
    document.getElementById('wnext').textContent=i===slides.length-1?'Get started':'Next';
  },{passive:true});
}
const slideIndex=box=>Math.round(box.scrollLeft/box.clientWidth);

/** Next, or Get started on the last slide. Returns true when the welcome is finished. */
export function welcomeNext(){
  const box=document.getElementById('wslides');if(!box)return true;
  const i=slideIndex(box);
  if(i>=box.children.length-1)return finishWelcome();
  box.scrollTo({left:(i+1)*box.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  return false;
}
export function finishWelcome(){S.settings.welcomed=true;save();return true;}

/** "Install app" (Android): open the browser's own install dialog. */
export async function install(){
  if(!installEvt)return;
  installEvt.prompt();
  await installEvt.userChoice.catch(()=>{});
  installEvt=null;
  document.querySelectorAll('[data-act="install"]').forEach(b=>b.closest('.wbox').remove());
}
