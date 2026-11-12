// Sound: the recorded voice clips, with the phone's own speech as an alternative.
// Also makes sure sounds never overlap and that nothing moves on before a sound has finished.

import {S} from './storage.js';
import {BY,hasSound} from './deck.js';

// Voice clips: Google Cloud Text-to-Speech, one MP3 per entry in audio/, named in the deck (BY[k].a; see tools/clips.mjs)
const AUDIO_FILE=k=>{const it=BY[k];return it&&it.a?'audio/'+it.a+'.mp3':null;};
export const hasTTS='speechSynthesis' in window;
export const canSpeak=true;
const player=new Audio();player.preload='auto';

let audioReady=false;
function unlockAudio(){
  // iOS only lets audio play without a tap once the player has been started from a tap
  if(audioReady)return;audioReady=true;
  try{player.src=AUDIO_FILE('あ');player.muted=true;
    // only stop the silent unlock clip, never a real sound that started on the same tap
    const p=player.play();if(p&&p.then)p.then(()=>{if(player.muted){player.pause();player.muted=false;}},()=>{player.muted=false;audioReady=false;});else player.muted=false;}catch(e){audioReady=false;}
}
document.addEventListener('touchend',unlockAudio,{passive:true});
document.addEventListener('click',unlockAudio);

const toKata=t=>[...t].map(c=>{const n=c.charCodeAt(0);return n>=0x3041&&n<=0x3096?String.fromCharCode(n+0x60):c;}).join('');
function speakTTS(text,onDone){
  if(!hasTTS)return false;
  try{
    // Katakana makes the phone read は and へ as "ha" and "he", not as the particles "wa" and "e"
    const u=new SpeechSynthesisUtterance(toKata(text));u.lang='ja-JP';u.rate=0.7;
    const vs=speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.toLowerCase().startsWith('ja'));
    const v=vs.find(v=>/premium|enhanced|natural|neural/i.test(v.name))||vs[0];if(v)u.voice=v;
    u.onend=onDone;u.onerror=onDone;
    speechSynthesis.cancel();speechSynthesis.speak(u);return true;
  }catch(e){return false;}
}
if(hasTTS)speechSynthesis.getVoices(); // starts the phone loading its voice list early

// soundDone settles once the current sound has finished playing, plus a short gap.
// Moving to the next card, and a new card's own sound, both wait for it so nothing gets cut off.
const SOUND_GAP=350,SOUND_MAX=3000;
let soundDone=Promise.resolve(),endSound=null;

/** A promise that settles when the current sound (if any) has finished, plus a short gap. */
export function whenSoundDone(){return soundDone;}

/** Play a kana once the previous sound has finished, but only if stillHere() says the card is still showing. */
export function autoSpeak(k,stillHere=()=>true){
  soundDone.then(()=>{if(stillHere())speak(k);});
}

/** Play a kana straight away (or text, with its clip), and return a promise that settles when it has finished.
 *  If the clip won't play (say it hasn't been made yet), the phone's own voice says it instead. */
export function speak(text,clip=AUDIO_FILE(text)){
  if(endSound)endSound(); // a new sound replaces one that's still going
  let settled=false,resolve;
  soundDone=new Promise(r=>{resolve=r;});
  const finish=()=>{if(settled)return;settled=true;if(endSound===finish)endSound=null;setTimeout(resolve,SOUND_GAP);};
  endSound=finish;
  setTimeout(finish,SOUND_MAX); // never wait forever if the phone doesn't report the end
  if(clip&&S.settings.voice!=='phone'){
    try{player.onended=finish;player.onerror=()=>{if(!speakTTS(text,finish))finish();};player.muted=false;player.src=clip;player.currentTime=0;
      const p=player.play();if(p&&p.catch)p.catch(finish);return soundDone;}catch(e){}
  }
  if(BY[text]&&!hasSound(text)){finish();return soundDone;} // っ: nothing to say on its own
  if(!speakTTS(text,finish))finish();
  return soundDone;
}

/** Play a made-up word from a っ pair (かった, かた) by its clip name. */
export const speakWord=(text,name)=>speak(text,'audio/'+name+'.mp3');
