// The Progress screen, and the plain-text version used by "Share this report".

import {S,ymd} from '../storage.js';
import {KANA,BY} from '../deck.js';
import {app,level,streak,toast} from '../ui.js';
import {endSession} from './session.js';

const TYPE_NAME={read:'Reading (kana to sound)',recall:'Picking the kana from romaji',listen:'Listening',write:'Writing'};
const kindOf=l=>{const t=l.id.split('|')[1];return t==='recall'&&l.v==='listen'?'listen':t;};
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'–';

// All the numbers the report needs, worked out from the answer log
function reportData(){
  const DAY=864e5,today=new Date();today.setHours(0,0,0,0);
  const log=S.log.filter(l=>l.m!=='placement'); // placement checks aren't practice
  const days=[];
  for(let i=13;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push({key:ymd(d),label:d.toLocaleDateString('en-GB',{weekday:'narrow'}),n:0,ms:0});}
  const byKey=Object.fromEntries(days.map(d=>[d.key,d]));
  log.forEach(l=>{const d=byKey[ymd(new Date(l.t))];if(d){d.n++;d.ms+=Math.min(l.ms||0,30000);}});
  const weekStart=today.getTime()-6*DAY,week=log.filter(l=>l.t>=weekStart);
  const types={read:{n:0,ok:0},recall:{n:0,ok:0},listen:{n:0,ok:0},write:{n:0,ok:0}};
  week.forEach(l=>{const t=types[kindOf(l)];t.n++;if(l.ok)t.ok++;});
  const misses={},pairs={};
  log.filter(l=>l.t>=today.getTime()-13*DAY&&!l.ok).forEach(l=>{
    const k=l.id.split('|')[0];misses[k]=(misses[k]||0)+1;
    if(l.c){const p=[k,l.c].sort().join('');pairs[p]=(pairs[p]||0)+1;}
  });
  const levels=[0,0,0,0,0];KANA.forEach(it=>{const v=level(it);if(v>=1)levels[v]++;});
  const w=days.slice(7);
  return {days,types,levels,
    added:KANA.filter(it=>S.rows.includes(it.row)).length,
    activeDays:w.filter(d=>d.n).length,
    answers:week.length,ok:week.filter(l=>l.ok).length,dk:week.filter(l=>l.dk).length,
    mins:Math.round(w.reduce((a,d)=>a+d.ms,0)/60000),
    hard:Object.entries(misses).sort((a,b)=>b[1]-a[1]).slice(0,8),
    pairs:Object.entries(pairs).filter(p=>p[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,4),
    last:S.log.length?S.log[S.log.length-1].t:null};
}

export function renderReport(){
  endSession();
  const R=reportData(),max=Math.max(1,...R.days.map(d=>d.n)),st=streak();
  const bars=R.days.map((d,i)=>`<div class="bcol${d.n?'':' zero'}${i===13?' today':''}" aria-label="${d.n} answers"><span class="bwrap"><span class="bar" style="height:${d.n?Math.max(4,Math.round(d.n/max*100)):3}%"></span></span><span class="blab">${d.label}</span></div>`).join('');
  const types=['read','recall','listen','write'].filter(k=>R.types[k].n).map(k=>`<div class="li"><span>${TYPE_NAME[k]}</span><span>${pct(R.types[k].ok,R.types[k].n)} of ${R.types[k].n}</span></div>`).join('')||'<div class="li"><span>No answers this week yet</span></div>';
  const names=['','Learning','Shaky','Good','Solid'];
  const lastText=R.last?`Last practised ${new Date(R.last).toLocaleString('en-GB',{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}.`:'No practice yet.';
  app.innerHTML=`<header class="top"><h1>Progress</h1><button class="link" data-act="home">Back</button></header>
  <div class="rep">
    <p class="pace">${lastText}${st>=2?` ${st} days in a row.`:''}</p>
    <div class="stats">
      <div class="stat"><b>${R.activeDays} of 7</b><span>days practised this week</span></div>
      <div class="stat"><b>${R.answers}</b><span>answers this week, about ${R.mins} min</span></div>
      <div class="stat"><b>${pct(R.ok,R.answers)}</b><span>right this week</span></div>
      <div class="stat"><b>${R.added} of ${KANA.length}</b><span>hiragana added</span></div>
    </div>
    <h2>Answers each day, last two weeks</h2><div class="bars">${bars}</div>
    <h2>How solid they are</h2>
    <div class="stack">${[1,2,3,4].map(i=>`<i style="width:${(R.levels[i]/KANA.length*100).toFixed(2)}%;background:var(--l${i})"></i>`).join('')}</div>
    <div class="legend">${[1,2,3,4].map(i=>`<span><i style="background:var(--l${i})"></i>${names[i]} ${R.levels[i]}</span>`).join('')}<span>Not added ${KANA.length-R.added}</span></div>
    <h2>Accuracy this week</h2><div class="list">${types}${R.dk?`<div class="li"><span>Don't know (counted as misses)</span><span>${R.dk}</span></div>`:''}</div>
    ${R.hard.length?`<h2>Most missed, last two weeks</h2><div class="chips">${R.hard.map(([k,n])=>`<span class="chip"><span class="kana">${k}</span><small>${BY[k].r}, missed ${n}</small></span>`).join('')}</div>`:''}
    ${R.pairs.length?`<h2>Often mixed up</h2><div class="list">${R.pairs.map(([p,n])=>`<div class="li"><span class="kana" style="font-size:1.5rem">${[...p].join(' and ')}</span><span>${n} times</span></div>`).join('')}</div>`:''}
    <button class="primary" data-act="share" style="margin-top:24px">Share this report</button>
    <p class="hint">Placement checks aren't counted. Minutes are estimated from answer times.</p>
  </div>`;
}

export function reportText(){
  const R=reportData();
  const lines=['Hiragana progress, '+new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}),
    `Practised on ${R.activeDays} of the last 7 days`,
    `${R.answers} answers this week (about ${R.mins} min), ${pct(R.ok,R.answers)} right`,
    `${R.added} of ${KANA.length} hiragana added: ${R.levels[4]} solid, ${R.levels[3]} good, ${R.levels[2]} shaky, ${R.levels[1]} learning`];
  ['read','recall','listen','write'].forEach(k=>{const t=R.types[k];if(t.n)lines.push(`${TYPE_NAME[k]}: ${pct(t.ok,t.n)} of ${t.n}`);});
  if(R.dk)lines.push(`Tapped "Don't know" ${R.dk} ${R.dk===1?'time':'times'}`);
  if(R.hard.length)lines.push('Most missed: '+R.hard.slice(0,6).map(([k,n])=>`${k} (${BY[k].r}) ${n}x`).join(', '));
  if(R.pairs.length)lines.push('Mixed up: '+R.pairs.map(([p])=>[...p].join('/')).join(', '));
  return lines.join('\n');
}

export function copyText(text){
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('Report copied'),()=>toast('Could not copy the report'));
  else toast('Could not copy the report');
}
