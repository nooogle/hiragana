// Run with: node --test tests/*.test.mjs  (Node's built-in test runner; nothing to install)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backupText,checkBackup} from '../js/backup.js';

const state={v:2,rows:['a'],cards:{'あ|read':{}},log:[],hints:{},settings:{}};

test('a backup is labelled with this app',()=>{
  assert.equal(JSON.parse(backupText(state)).app,'hiragana-drill');
});
test('this app’s own backup restores, without the label ending up in the progress',()=>{
  const r=checkBackup(JSON.parse(backupText(state)));
  assert.equal(r.error,undefined);
  assert.deepEqual(r.state,state);
});
test('a backup labelled as the Katakana drill’s is turned away by name',()=>{
  assert.match(checkBackup({...state,app:'katakana-drill'}).error,/from the Katakana drill/);
});
test('an older unlabelled backup still restores if its cards are hiragana',()=>{
  assert.equal(checkBackup(state).error,undefined);
});
test('an older unlabelled backup with katakana cards is turned away',()=>{
  assert.match(checkBackup({...state,cards:{'ア|read':{},'キャ|write':{}}}).error,/another app/);
});
test('something that isn’t a backup at all is turned away',()=>{
  assert.ok(checkBackup({hello:1}).error);
  assert.ok(checkBackup(null).error);
});
