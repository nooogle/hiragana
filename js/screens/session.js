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
  sess.answered=false;sess.t0=performance.now();sess.listen=false;
  if(type==='read'&&!S.cards[id]&&sess.mode==='review'){
    app.innerHTML=`${bar()}<div class="stage"><p class="ask">New one to learn</p><div class="sq"><span class="big">${k}</span></div>
      <p class="reveal">${it.r}</p>${spkBtn(k)}${hintBox(k)}
      <p class="hint">Practise the strokes in your course app too. You'll be tested on this in a moment.</p>
      <button class="primary" data-act="introok">Got it</button></div>`;
    if(S.settings.sound)autoSpeak(k,stillHere());
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
      <div class="btns2" id="wbtns"><button class="secondary" data-act="clear">Clear</button><button class="primary" data-act="check">Check</button></div></div>`;
    setupCanvas(document.getElementById('cv'));
    if(S.settings.sound)autoSpeak(k,stillHere());
  }
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
    return;}
  const c=BY[chosen];
  const again=sess.mode==='placement'?'It will come up in your reviews.':'You\'ll see it again in a moment.';
  document.getElementById('fb').innerHTML=`<p><span class="kana">${k}</span> is <b>${it.r}</b>. ${dk?again:`<span class="kana">${c.k}</span> is <b>${c.r}</b>.`}</p>
    ${(type==='read'||sess.listen)&&canSpeak?spkBtn(k):''}${hintBox(k,!dk)}${dk?'':hintBox(chosen,true)}<button class="primary" data-act="next" style="margin-top:14px">Next</button>`;
  {const nx=document.querySelector('#fb [data-act="next"]');if(nx&&nx.scrollIntoView)nx.scrollIntoView({block:'nearest',behavior:'smooth'});}
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
export function clearDrawing(){const cv=document.getElementById('cv');if(cv&&cv.clear)cv.clear();}

/** "Check" on a writing card: show the right kana over the drawing and in its own box, then ask for a self-mark. */
export function checkWriting(){
  document.getElementById('model').classList.add('show');
  document.getElementById('cv').dataset.locked='1';
  const k=sess.queue[sess.pos].split('|')[0];
  document.getElementById('wbtns').insertAdjacentHTML('beforebegin',`<div class="ans" id="ans" role="img" aria-label="Correct answer: ${k}"><span class="kana">${k}</span></div>`);
  document.getElementById('ans').scrollIntoView({block:'nearest'});
  document.getElementById('wbtns').innerHTML=`<button class="secondary" data-act="self" data-ok="0">Not quite</button><button class="primary" data-act="self" data-ok="1">Got it</button>`;
}

/** The self-mark on a writing card. */
export function selfGrade(ok){
  if(sess.answered)return;sess.answered=true;
  const k=sess.queue[sess.pos].split('|')[0];
  record(sess.queue[sess.pos],ok);
  if(ok){next();return;}
  // "Not quite": show the hint before moving on
  document.getElementById('wbtns').outerHTML=`${hintBox(k)}<button class="primary" data-act="next" style="margin-top:14px">Next</button>`;
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
