// Every voice clip the app asks for must be in audio/.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {KANA,PAIRS} from '../js/deck.js';

const has=n=>existsSync(new URL(`../audio/${n}.mp3`,import.meta.url));
test('every entry with a sound has its clip',()=>{
  assert.deepEqual(KANA.filter(x=>x.a&&!has(x.a)).map(x=>x.a),[]);
});
test('every word in the っ pairs has its clip',()=>{
  assert.deepEqual(PAIRS['っ'].flatMap(p=>[p.al,p.as]).filter(n=>!has(n)),[]);
});
