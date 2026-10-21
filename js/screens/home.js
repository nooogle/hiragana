// The home screen: what's ready to review, and the hiragana chart coloured by how well each kana is known.

import {S} from '../storage.js';
import {ROWS,BY} from '../deck.js';
import {buildReview} from '../queues.js';
import {app,level,nextDueText,paceText} from '../ui.js';
import {endSession} from './session.js';

function rowHTML(row){
  const on=S.rows.includes(row.id);
  const lvlVar=['--l0','--l1','--l2','--l3','--l4'];
  const cells=[...row.k].map(k=>{const l=level(BY[k]);return `<span class="cell" ${l>=0?`style="background:var(${lvlVar[l]})"`:''}>${k}</span>`;}).join('');
  return `<button class="row ${on?'on':'off'}" data-act="row" data-row="${row.id}" aria-label="${on?'Options for':'Add'} the ${row.k[0]} row"><span class="cells">${cells}</span><span class="tag">${on?'':'Add'}</span></button>`;
}

export function renderHome(){
  endSession();
  const n=buildReview().length;
  const seen=Object.keys(S.cards).some(id=>S.rows.includes(BY[id.split('|')[0]].row));
  let hero;
  if(!S.rows.length){
    hero=`<p class="lead">Pick the rows you've studied</p><p class="sub">Tap a row in the chart to add it. If you already know a row, you'll get a quick check first so the easy ones don't waste your time.</p>`;
  }else if(n){
    hero=`<p class="lead">${n} ${n===1?'card':'cards'} ready</p><p class="sub">Short and often works best. A few minutes now, a few more later.</p><button class="primary" data-act="review">Start review</button>${seen?'<button class="secondary" data-act="practice">Practise weakest</button><button class="secondary" data-act="runall">Run through everything</button>':''}`;
  }else{
    hero=`<p class="lead">All caught up</p><p class="sub">${nextDueText()}</p>${seen?'<button class="primary" data-act="practice">Practise weakest</button><button class="secondary" data-act="runall">Run through everything</button>':''}`;
  }
  app.innerHTML=`
    <header class="top"><h1>Hiragana drill</h1><span class="nav"><button class="link" data-act="report">Progress</button><button class="link" data-act="settings">Settings</button></span></header>
    <section class="hero">${hero}</section>
    <p class="pace">${paceText()}</p>
    <section class="chart">
      <h2>Basic hiragana</h2>${ROWS.filter(r=>!r.base).map(rowHTML).join('')}
      <h2>With dakuten</h2>${ROWS.filter(r=>r.base).map(rowHTML).join('')}
    </section>
    <div class="legend"><span><i style="background:var(--l1)"></i>Learning</span><span><i style="background:var(--l2)"></i>Shaky</span><span><i style="background:var(--l3)"></i>Good</span><span><i style="background:var(--l4)"></i>${S.settings.write===false?'Solid':'Solid, can write it'}</span></div>
    <p class="howlink"><a href="how-it-works.html">How this works</a></p>`;
}
