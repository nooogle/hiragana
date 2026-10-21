// Start-up and button handling. index.html loads only this file; it imports everything else.
//
// Every button in the app has a data-act="..." attribute. Instead of wiring up each button separately,
// one click handler for the whole page reads that attribute and calls the right function.

import {S,save,fresh,replaceState} from './storage.js';
import {ROWMAP,BY} from './deck.js';
import {migrate} from './scheduler.js';
import {shuffle,buildReview,buildPractice,buildRunThrough} from './queues.js';
import {speak} from './sound.js';
import {toast} from './ui.js';
import {closeSheet,rowSheet,settingsSheet} from './sheets.js';
import {editHint,setHint} from './hints.js';
import {renderHome} from './screens/home.js';
import {renderReport,reportText,copyText} from './screens/report.js';
import {startSession,answer,next,introOk,noSound,clearDrawing,checkWriting,selfGrade} from './screens/session.js';
import './keys.js'; // keyboard shortcuts for computers (sets itself up when loaded)

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,row=b.dataset.row;
  switch(a){
    // Starting sessions
    case 'review':closeSheet();startSession('review',buildReview());break;
    case 'practice':closeSheet();startSession('practice',buildPractice());break;
    case 'runall':closeSheet();startSession('practice',buildRunThrough());break;
    // Screens and sheets
    case 'home':closeSheet();renderHome();break;
    case 'settings':settingsSheet();break;
    case 'report':closeSheet();renderReport();break;
    case 'close':closeSheet();break;
    case 'share':{
      const text=reportText();
      if(navigator.share)navigator.share({title:'Hiragana progress',text}).catch(err=>{if(!err||err.name!=='AbortError')copyText(text);});
      else copyText(text);
      break;}
    // Rows on the chart
    case 'row':rowSheet(row);break;
    case 'rownew':if(!S.rows.includes(row))S.rows.push(row);save();closeSheet();renderHome();break;
    case 'rowadd':
      if(!S.rows.includes(row))S.rows.push(row);save();closeSheet();
      startSession('placement',shuffle([...ROWMAP[row].k].map(k=>k+'|read')));break;
    case 'rowpractice':closeSheet();startSession('practice',buildPractice(row));break;
    case 'rowremove':
      if(confirm('Remove this row from your chart? Its progress is kept if you add it back.')){S.rows=S.rows.filter(r=>r!==row);save();closeSheet();renderHome();}
      break;
    // Sound
    case 'speak':speak(b.dataset.k);break;
    case 'testvoice':(async()=>{for(const k of ['は','へ','を','ん'])await speak(k);})();break;
    // During a session
    case 'answer':answer(b.dataset.k);break;
    case 'next':next();break;
    case 'nosound':noSound();break;
    case 'introok':introOk();break;
    case 'clear':clearDrawing();break;
    case 'check':checkWriting();break;
    case 'self':selfGrade(b.dataset.ok==='1');break;
    // Hints
    case 'edithint':editHint(b.dataset.k,b.closest('.hintkeys')?BY[b.dataset.k].row:null);break; // from the chart? go back there after
    case 'savehint':setHint(b.dataset.k,document.getElementById('hinttext').value.trim());break;
    case 'resethint':setHint(b.dataset.k,'');break;
    // Backup and reset
    case 'copy':{
      const txt=JSON.stringify(S);
      const fallback=()=>{const ta=document.getElementById('restore');ta.value=txt;ta.select();toast('Select all and copy');};
      if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('Backup copied'),fallback);else fallback();
      break;}
    case 'restore':{
      const txt=document.getElementById('restore').value.trim();
      try{const s=JSON.parse(txt);if(!s.rows||!s.cards)throw 0;
        if(confirm('Replace the progress on this phone with this backup?')){
          const restored=Object.assign(fresh(),s);if(!s.v)restored.v=1; // backups from before FSRS get converted
          replaceState(restored);migrate();closeSheet();renderHome();toast('Backup restored');}
      }catch(err){toast('That backup could not be read');}
      break;}
    case 'reset':
      if(confirm('Reset all progress? This cannot be undone.')){replaceState(fresh());closeSheet();renderHome();}
      break;
  }
});

// Settings switches
document.addEventListener('change',e=>{
  if(e.target.id==='snd'){S.settings.sound=e.target.checked;save();}
  if(e.target.id==='wrt'){S.settings.write=e.target.checked;save();renderHome();}
  if(e.target.id==='voice'){S.settings.voice=e.target.value;save();speak('あ');}
});

migrate();   // converts progress saved by the old box scheduler (does nothing once done)
renderHome();
// Keeps the pages, code and voice clips on the phone so it works with no signal
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
