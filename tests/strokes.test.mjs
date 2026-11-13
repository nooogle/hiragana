import {test} from 'node:test';
import assert from 'node:assert/strict';
import {KANA} from '../js/deck.js';
import {STROKES,strokeCount,strokesSVG,stepSVG} from '../js/strokes.js';

test('every character in the deck has stroke data',()=>{
  const missing=[...new Set(KANA.flatMap(x=>[...x.k]))].filter(ch=>!(STROKES[ch]&&STROKES[ch].s.length>=1&&STROKES[ch].s.length===STROKES[ch].n.length));
  assert.deepEqual(missing,[]);
});
test('stroke counts add up across both characters',()=>{
  assert.equal(strokeCount('き'),4);
  assert.equal(strokeCount('きゃ'),strokeCount('き')+strokeCount('ゃ'));
});
test('a two-character entry draws one picture per character, numbered straight through',()=>{
  const svg=strokesSVG('きゃ');
  assert.equal((svg.match(/<svg/g)||[]).length,2);
  assert.match(svg,/>5<\/text>/); // ゃ's first stroke is number 5
  const step=stepSVG('きゃ',5,true);
  assert.equal((step.match(/class="now"/g)||[]).length,2); // stroke 5 and its number, in the second picture
});
test('a one-character entry is still a single picture',()=>{
  assert.equal((strokesSVG('あ').match(/<svg/g)||[]).length,1);
});
test('a missing character gives no strokes rather than crashing',()=>{
  assert.equal(strokeCount('Q'),0);
});
