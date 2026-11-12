import {test} from 'node:test';
import assert from 'node:assert/strict';
import {KANA} from '../js/deck.js';
import {HINTS} from '../js/hintdata.js';

test('every entry in the deck has a hint',()=>{
  assert.deepEqual(KANA.filter(x=>!(HINTS[x.k]&&HINTS[x.k].trim())).map(x=>x.k),[]);
});
test('dakuten hints are built from the base kana',()=>{
  assert.equal(HINTS['が'],'か with two little marks, so ka becomes ga.');
  assert.equal(HINTS['ぱ'],'は with a little circle, so ha becomes pa.');
  assert.match(HINTS['ぢ'],/sounds just like じ/);
});
test('combination hints explain the small kana, including the ones that build on a dakuten row',()=>{
  assert.equal(HINTS['きゃ'],'き followed by a small ゃ: say them together as one quick sound, kya.');
  assert.match(HINTS['ぎょ'],/^ぎ followed by a small ょ.*gyo\.$/);
});
test('っ explains what it does',()=>{
  assert.match(HINTS['っ'],/かった is katta/);
});
