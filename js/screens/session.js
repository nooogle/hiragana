// A practice session: showing each card, checking answers, feedback, and the "done" screen.
// The current session is kept in sess (null when no session is running).

import {S,save} from '../storage.js';
import {KANA,BY,CONFMAP} from '../deck.js';
import {grade,newCard} from '../scheduler.js';
import {shuffle,buildReview} from '../queues.js';
import {canSpeak,speak,autoSpeak,whenSoundDone} from '../sound.js';
import {app,spkBtn,toast,PLAY_ICON,DK} from '../ui.js';
import {hintBox} from '../hints.js';
import {setupCanvas} from '../drawing.js';
import {playStrokes,strokeCount,stepSVG,drawInStep,strokesSVG,checkStrokes} from '../strokes.js';
import {showTips} from '../tips.js';

export let sess=null;
export function endSession(){sess=null;}

/** Start a session: mode is 'review', 'practice' or 'placement'; queue is a list of card ids. */
export function startSession(mode,queue){
  if(!queue.length){toast('Nothing to practise yet');return;}
  sess={mode,queue,pos:0,right:0,wrong:0,requeued:new Set(),answered:false};
  renderCard();
}

// Returns a check that's true only while the same card is still on screen (so a delayed sound doesn't play on the next one)
function stillHere(){const s=sess,p=s&&s.pos;return ()=>sess===s&&(!s||s.pos===p);}

// The right answer plus three wrong ones, preferring look-alikes from rows already added
function pickOptions(it){
  const active=KANA.filter(x=>S.rows.includes(x.row));
  const ok=x=>x.k!==it.k&&x.s!==it.s;
  const pool=active.filter(ok);
  const conf=shuffle(pool.filter(x=>CONFMAP[it.k]&&CONFMAP[it.k].has(x.k))).slice(0,2);
  let chosen=conf.concat(shuffle(pool.filter(x=>!conf.includes(x))));
  if(chosen.length<3)chosen=chosen.concat(shuffle(KANA.filter(x=>ok(x)&&!chosen.includes(x))));
  return shuffle([it,...chosen.slice(0,3)]);
}
function bar(){
  const pct=Math.round(sess.pos/sess.queue.length*100);
  return `<div class="sbar"><button class="link" data-act="home">Stop</button><div class="prog"><i style="width:${pct}%"></i></div><span class="count">${sess.pos}/${sess.queue.length}</span></div>`;
}

function renderCard(){
  if(sess.pos>=sess.queue.length)return renderDone();
  const id=sess.queue[sess.pos],[k,type]=id.split('|'),it=BY[k];
  sess.answered=false;sess.t0=performance.now();sess.listen=false;sess.ws=null;sess.ps=null;
  if(type==='read'&&!S.cards[id]&&sess.mode==='review'){
    app.innerHTML=`${bar()}<div class="stage"><p class="ask">New one to learn</p><div class="sq"><span class="big">${k}</span></div>
      <p class="reveal">${it.r}</p>${spkBtn(k)}${hintBox(k)}
      <p class="hint">Practise the strokes in your course app too. You'll be tested on this in a moment.</p>
      <button class="primary" data-act="introok">Got it</button></div>`;
    if(S.settings.sound)autoSpeak(k,stillHere());
    showTips();
    return;
  }
  if(type==='read'){
    const opts=pickOptions(it);
    app.innerHTML=`${bar()}<div class="stage"><p class="ask">What sound is this?</p><div class="sq"><span class="big">${k}</span></div>
      <div class="opts">${opts.map(o=>`<button class="opt" data-act="answer" data-k="${o.k}">${o.r}</button>`).join('')}</div>${DK}<div class="fb" id="fb"></div></div>`;
  }else if(type==='recall'){
    const opts=pickOptions(it);
    const optsHTML=`<div class="opts">${opts.map(o=>`<button class="opt ko" data-act="answer" data-k="${o.k}">${o.k}</button>`).join('')}</div>${DK}<div class="fb" id="fb"></div>`;
    // Half of recall cards become listening cards: sound only, no romaji
    sess.listen=canSpeak&&!sess.noSound&&Math.random()<0.5;
    if(sess.listen){
      app.innerHTML=`${bar()}<div class="stage"><p class="ask">Which hiragana did you hear?</p><div class="sq" id="lsq"><button class="play" data-act="speak" data-k="${k}" aria-label="Play the sound again">${PLAY_ICON}</button></div>
        ${optsHTML}<button class="link mute" data-act="nosound">Can't use sound right now</button></div>`;
      autoSpeak(k,stillHere());
    }else{
      app.innerHTML=`${bar()}<div class="stage"><p class="ask">Which hiragana is this?</p><div class="sq"><span class="roma">${it.r}</span></div>${spkBtn(k)}
        ${optsHTML}</div>`;
      if(S.settings.sound)autoSpeak(k,stillHere());
    }
  }else{
    app.innerHTML=`${bar()}<div class="stage"><p class="ask">Write this one</p><p class="romaline">${it.r}${spkBtn(k)}</p>
      <div class="wsq"><span class="model" id="model">${k}</span><canvas id="cv" aria-label="Drawing area"></canvas></div>
      <div class="btns2" id="wbtns"><button class="secondary" data-act="clear">Clear</button><button class="primary" data-act="check">Check</button></div>
      <button class="dk" data-act="wdk">Don't know</button></div>`;
    setupCanvas(document.getElementById('cv'));
    if(S.settings.sound)autoSpeak(k,stillHere());
  }
  showTips();
}

// Grade the answer, and bring a missed card back a few cards later in the same session
function record(id,ok){
  grade(id,ok,sess.mode,performance.now()-sess.t0,sess.listen);
  ok?sess.right++:sess.wrong++;
  if(!ok&&sess.mode!=='placement'&&!sess.requeued.has(id)){
    sess.requeued.add(id);
    sess.queue.splice(Math.min(sess.queue.length,sess.pos+4),0,id);
  }
}

/** A multiple-choice answer: chosen is the kana tapped, or '?' for "Don't know". */
export function answer(chosen){
  if(sess.answered)return;sess.answered=true;
  const id=sess.queue[sess.pos],[k,type]=id.split('|'),it=BY[k],ok=chosen===k,dk=chosen==='?';
  document.querySelectorAll('.opt').forEach(b=>{b.disabled=true;if(b.dataset.k===k)b.classList.add('right');else if(b.dataset.k===chosen)b.classList.add('wrong');});
  {const d=document.querySelector('.dk');if(d)d.remove();}
  record(id,ok);
  if(dk){S.log[S.log.length-1].dk=true;save();}
  else if(!ok){S.log[S.log.length-1].c=chosen;save();} // remember what was picked, to spot mix-ups
  if(sess.listen){
    S.log[S.log.length-1].v='listen';save();
    const sq=document.getElementById('lsq');if(sq)sq.innerHTML=`<span class="roma">${it.r}</span>`;
    const m=document.querySelector('.mute');if(m)m.remove();
  }
  if(type==='read'&&S.settings.sound)speak(k);
  if(ok){ // move on after a short pause, but never before the sound has finished
    const pos=sess.pos;
    Promise.all([new Promise(r=>setTimeout(r,900)),whenSoundDone()]).then(()=>{if(sess&&sess.pos===pos&&sess.answered)next();});
    showTips();
    return;}
  const c=BY[chosen];
  const again=sess.mode==='placement'?'It will come up in your reviews.':'You\'ll see it again in a moment.';
  document.getElementById('fb').innerHTML=`<p><span class="kana">${k}</span> is <b>${it.r}</b>. ${dk?again:`<span class="kana">${c.k}</span> is <b>${c.r}</b>.`}</p>
    ${(type==='read'||sess.listen)&&canSpeak?spkBtn(k):''}${hintBox(k,!dk)}${dk?'':hintBox(chosen,true)}<button class="primary" data-act="next" style="margin-top:14px">Next</button>`;
  {const nx=document.querySelector('#fb [data-act="next"]');if(nx&&nx.scrollIntoView)nx.scrollIntoView({block:'nearest',behavior:'smooth'});}
  showTips();
}

export function next(){if(!sess)return;sess.pos++;renderCard();}

/** "Got it" on a new kana's intro card: it's now in play and will be tested a few cards later. */
export function introOk(){
  const id=sess.queue[sess.pos];
  S.cards[id]=newCard();save();
  sess.queue.splice(Math.min(sess.queue.length,sess.pos+4),0,id);
  next();
}

/** "Can't use sound right now": turn listening cards off for the rest of this session. */
export function noSound(){sess.noSound=true;renderCard();toast('Sound off for this session');}

// ----- Writing cards -----
export function clearDrawing(){
  const cv=document.getElementById('cv');if(cv&&cv.clear)cv.clear();
  if(sess&&sess.ws){clearTimeout(sess.ws.timer);sess.ws.drawn=0;drawInStep(document.getElementById('guide'));} // practising: start this box again
  if(sess&&sess.ps&&sess.ps.step===2)drawInStep(document.getElementById('guide')); // tracing: draw the guide in again
}

/** "Check" on a writing card: show the answer, then ask for a self-mark. */
export function checkWriting(){
  showStrokes();
  document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="self" data-ok="0">Not quite</button><button class="primary" data-act="self" data-ok="1">Got it</button>`;
  showTips();
}

/** "Don't know" on a writing card: show the answer and mark it as a miss, with no self-mark to make. */
export function dontKnowWriting(){showStrokes();selfGrade(false,true);}

/** Draw the right kana's strokes in red over the drawing, one at a time in order. Tapping the box plays them again. */
function showStrokes(){
  const cv=document.getElementById('cv');cv.dataset.locked='1';
  const k=sess.queue[sess.pos].split('|')[0];
  {const d=document.querySelector('.dk');if(d)d.remove();}
  cv.insertAdjacentHTML('afterend',`<button class="trace" id="trace" data-act="strokes" aria-label="Correct answer: ${k}. Tap to see the stroke order again"></button>`);
  if(!replayStrokes())document.getElementById('model').classList.add('show'); // no stroke data: show the plain kana instead
}

/** Play the stroke order animation over the drawing. Returns false if there's no stroke data for this kana. */
export function replayStrokes(){
  const box=document.getElementById('trace');
  return !!(box&&sess&&playStrokes(box,sess.queue[sess.pos].split('|')[0],!box.dataset.plain)); // data-plain: no numbers
}

/** The self-mark on a writing card. "Got it" moves straight on; "Not quite" (or "Don't know", dk) shows the hint and offers more goes at it. */
export function selfGrade(ok,dk){
  if(sess.answered)return;sess.answered=true;
  const k=sess.queue[sess.pos].split('|')[0];
  record(sess.queue[sess.pos],ok);
  if(dk){S.log[S.log.length-1].dk=true;save();}
  if(ok){next();return;}
  document.getElementById('wbtns').outerHTML=`${hintBox(k)}<div class="btns2" id="wbtns"><button class="secondary" data-act="practise">Practise</button><button class="primary" data-act="next">Next</button></div>`;
  {const nx=document.querySelector('#wbtns [data-act="next"]');if(nx&&nx.scrollIntoView)nx.scrollIntoView({block:'nearest',behavior:'smooth'});}
  showTips();
}

// ----- Practise -----
// "Practise" (and "Again") on a writing card, once it's been marked. There are two ways to do it, chosen in
// Settings → Practising writing: 4 steps (the default) or the classic worksheet row. Neither changes the mark or the schedule.

/** "Practise" (and "Again"): start practising the kana on this card, from the beginning. */
export function practiseWriting(){
  const k=sess.queue[sess.pos].split('|')[0],n=strokeCount(k);
  if(!n){const cv=document.getElementById('cv');cv.clear();delete cv.dataset.locked;return;} // no stroke data: just another go
  sess.ws=sess.ps=null;
  if(S.settings.practise==='classic')practiseClassic(k,n);
  else{sess.ps={k,step:1};showPStep();}
}

// ----- Practise in 4 steps -----
// The same four steps for every kana, however many strokes it has:
//   1 Watch: the strokes draw themselves (no numbers), with the sound. Replay plays both again.
//   2 Trace: one box, with the whole kana in faint red underneath to draw over.
//   3 Copy: an empty box, with the kana and its numbered strokes in a small box beside it.
//   4 Recall: an empty box, with only the romaji and the sound. Done shows the answer beside their writing.
// In 3 and 4, Done checks the order and direction of the strokes they drew. It never interrupts while they're drawing.
// sess.ps keeps track: k is the kana, step the step they're on.
const PSTEPS=['Watch','Trace','Copy','Recall'];

// Set up the screen for the current step
function showPStep(){
  const {k,step}=sess.ps,it=BY[k];
  const steps=PSTEPS.map((t,i)=>`<li class="${i+1===step?'now':i+1<step?'done':''}">${i+1} ${t}</li>`).join('');
  const clear=`<button class="secondary" data-act="clear">Clear</button>`;
  let box,say,btns;
  if(step===1){
    box=`<div class="wsq"><button class="trace" id="trace" data-act="strokes" data-plain="1" aria-label="${k}: tap to watch the strokes again"></button></div>`;
    say='Watch the strokes go in';
    btns=`<button class="secondary" data-act="pwatch">Replay</button><button class="primary" data-act="pnext">Next</button>`;
  }else if(step===2){
    box=`<div class="wsq"><span class="guide ghost" id="guide">${strokesSVG(k,false)}</span><canvas id="cv" aria-label="Drawing area"></canvas></div>`;
    say='Trace over it, in order';
    btns=`${clear}<button class="primary" data-act="pnext">Next</button>`;
  }else{
    const model=step===3?`<span class="pmodel">${strokesSVG(k)}</span>`:'';
    box=`<div class="pside" id="pside">${model}<div class="wsq"><canvas id="cv" aria-label="Drawing area"></canvas></div></div>`;
    say=step===3?'Copy it, in order':'Now write it from memory';
    btns=`${clear}<button class="primary" data-act="pdone">Done</button>`;
  }
  document.querySelector('.stage').innerHTML=`<p class="ask">Practise writing it</p><ol class="psteps">${steps}</ol>
    <p class="romaline">${it.r}${spkBtn(k)}</p>${box}<p class="wstep" id="wstep">${say}</p>
    <div class="pfb" id="pfb"></div><div class="btns2" id="wbtns">${btns}</div>`;
  if(step===1){pWatch();return;}
  setupCanvas(document.getElementById('cv'));
  if(step===2)drawInStep(document.getElementById('guide'));
  if(step===4)speak(k);
}

/** "Replay" on the Watch step: the strokes and the sound again. */
export function pWatch(){
  if(!sess||!sess.ps)return;
  replayStrokes();speak(sess.ps.k);
}

/** "Next": on to the next step. "Try again" (again set): the same step from the start. */
export function pNext(again){
  if(!sess||!sess.ps)return;
  if(!again)sess.ps.step++;
  showPStep();
}

/** "Done" on Copy or Recall: check the stroke order, and on Recall show the answer beside their writing. */
export function pDone(){
  if(!sess||!sess.ps)return;
  const w=sess.ps,cv=document.getElementById('cv');
  if(!cv.strokes.length){toast('Write it in the box first');return;}
  cv.dataset.locked='1';
  const r=checkStrokes(w.k,cv.strokes),fb=document.getElementById('pfb');
  fb.className='pfb '+(r.ok?'good':'bad');
  fb.innerHTML=r.notes.map(t=>`<p>${t}</p>`).join('');
  if(w.step===3){
    document.getElementById('wstep').textContent='';
    document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="pretry">Try again</button><button class="primary" data-act="pnext">Next</button>`;
    return;
  }
  document.getElementById('pside').insertAdjacentHTML('afterbegin',`<span class="pmodel"><button class="trace" id="trace" data-act="strokes" aria-label="Correct answer: ${w.k}. Tap to see the stroke order again"></button></span>`);
  replayStrokes();
  document.getElementById('wstep').textContent='Tap the answer to watch it again';
  document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="practise">Again</button><button class="primary" data-act="next">Next</button>`;
}

// ----- Practise, classic: the worksheet row -----
// Like the practice sheets from school: the romaji, then a box per stroke (stroke 1, then 1 and 2, and so on) to trace,
// then an empty box to write the whole kana from memory. It only comes after the card has been marked, so nothing here
// changes the mark or the schedule. sess.ws keeps track: k is the kana, n its number of strokes, step the box being done
// (1 to n are tracing, n+1 is the empty box), drawn how many strokes they've drawn in it so far.
// Once a tracing box has as many strokes as it needs, it moves on by itself after a short pause (unless they start
// drawing again first, say if they lifted their finger partway through a stroke). Next step is there in case the count
// never gets there, such as when two strokes are joined into one.
const STEP_PAUSE_MS=700;

// Turn the card into the worksheet row for kana k (which has n strokes), starting from stroke 1
function practiseClassic(k,n){
  sess.ws={k,n,step:1};
  const cells=Array.from({length:n+1},(_,i)=>`<span class="wcell" id="wc${i+1}">${i<n?stepSVG(k,i+1):''}</span>`).join('');
  document.querySelector('.stage').innerHTML=`<p class="ask">Practise writing it</p>
    <div class="wrow"><span class="wrom">${BY[k].r}</span>${cells}</div>
    <div class="wsq"><span class="guide" id="guide"></span><canvas id="cv" aria-label="Drawing area"></canvas></div>
    <p class="wstep" id="wstep"></p><div class="btns2" id="wbtns"></div>`;
  const cv=document.getElementById('cv');
  setupCanvas(cv);
  cv.onStrokeStart=()=>clearTimeout(sess.ws.timer);
  cv.onStrokeEnd=()=>{
    const w=sess.ws;
    if(++w.drawn>=w.step&&w.step<=w.n)w.timer=setTimeout(()=>{if(sess&&sess.ws===w)nextStep();},STEP_PAUSE_MS);
  };
  showStep();
}

// Set up the big box and buttons for the current step
function showStep(){
  const w=sess.ws,last=w.step>w.n,guide=document.getElementById('guide');
  clearTimeout(w.timer);w.drawn=0;
  document.querySelectorAll('.wcell').forEach((c,i)=>c.classList.toggle('now',i===w.step-1));
  guide.innerHTML=last?'':stepSVG(w.k,w.step,true);
  drawInStep(guide);
  document.getElementById('wstep').textContent=last?'Now write it on your own':w.step===1?`Stroke 1 of ${w.n}: trace it`:`Strokes 1 to ${w.step} of ${w.n}: trace them in order`;
  document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="clear">Clear</button>`+
    (last?`<button class="primary" data-act="wshow">Show me</button>`:`<button class="secondary" data-act="wstep">Next step</button>`);
}

// Copy what's in the big box into this step's small box
function keepDrawing(){
  const cv=document.getElementById('cv'),c=document.getElementById('wc'+sess.ws.step);
  c.classList.add('done');
  c.insertAdjacentHTML('beforeend',`<img src="${cv.toDataURL()}" alt="">`);
}

/** "Next step": keep this tracing in its small box and move on to the next stroke (or the empty box). */
export function nextStep(){
  if(!sess||!sess.ws)return;
  keepDrawing();
  document.getElementById('cv').clear();
  sess.ws.step++;
  showStep();
}

/** "Show me" on the empty box: draw the answer in red over their writing, to compare. Tapping the box plays it again. */
export function showPractised(){
  if(!sess||!sess.ws)return;
  clearTimeout(sess.ws.timer);
  keepDrawing();
  const cv=document.getElementById('cv');cv.dataset.locked='1';
  cv.insertAdjacentHTML('afterend',`<button class="trace" id="trace" data-act="strokes" aria-label="Correct answer: ${sess.ws.k}. Tap to see the stroke order again"></button>`);
  replayStrokes();
  document.querySelector('.wcell.now').classList.remove('now');
  document.getElementById('wstep').textContent='Tap the box to watch it again';
  document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="practise">Again</button><button class="primary" data-act="next">Next</button>`;
}

function renderDone(){
  const total=sess.right+sess.wrong;
  let title='Session done',sub=`${sess.right} right out of ${total}.`;
  if(sess.mode==='placement'){title='Check done';sub=`You knew ${sess.right} of ${total}. Any you missed will come up in your reviews until they stick.`;}
  else if(sess.wrong)sub+=' The ones you missed will come back soon.';
  const more=buildReview().length;
  app.innerHTML=`<header class="top"><h1>Hiragana drill</h1></header><section class="hero"><p class="lead">${title}</p><p class="sub">${sub}</p>
    ${more?`<button class="primary" data-act="review">Review ${more} more</button>`:''}
    <button class="${more?'secondary':'primary'}" data-act="practice">Keep practising</button>
    <button class="secondary" data-act="home">Back to chart</button></section>`;
  sess=null;
}
