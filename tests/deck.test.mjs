import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROWS,KANA,BY,CONFMAP,PAIRS,mixKey,mixParts,pickPair,hasSound,unknownCards} from '../js/deck.js';

test('the deck has every entry: 46 basic, 25 dakuten, 33 combinations and small っ',()=>{
  assert.equal(KANA.length,46+25+33+1);
});
test('the kana, romaji and clip names from before the combinations are unchanged (saved progress depends on them)',()=>{
  assert.equal(BY['あ'].r,'a');
  assert.equal(BY['を'].r,'wo');assert.equal(BY['を'].a,'wo');
  assert.equal(BY['ぢ'].r,'ji (di)');assert.equal(BY['ぢ'].a,'di');
  assert.equal(BY['づ'].r,'zu (du)');assert.equal(BY['づ'].a,'du');
  assert.equal(KANA.filter(x=>['basic','dakuten'].includes(ROWS.find(r=>r.id===x.row).sec)).length,71);
});
test('two-character entries are single entries with their own romaji',()=>{
  assert.equal(BY['きゃ'].r,'kya');
  assert.equal(BY['じょ'].r,'jo');
  assert.equal(BY['ぴゅ'].r,'pyu');
});
test('same-sounding entries share a sound key, so they are never offered together',()=>{
  for(const [a,b] of [['を','お'],['ぢ','じ'],['づ','ず']])assert.equal(BY[a].s,BY[b].s,`${a} and ${b}`);
});
test('no two entries with different sounds show the same romaji or use the same clip',()=>{
  for(const x of KANA)for(const y of KANA){
    if(x===y||x.s===y.s)continue;
    assert.notEqual(x.r,y.r,`${x.k} and ${y.k} both show ${x.r}`);
    if(x.a&&y.a)assert.notEqual(x.a,y.a,`${x.k} and ${y.k} both use clip ${x.a}`);
  }
});
test('every entry except っ has a clip name',()=>{
  assert.deepEqual(KANA.filter(x=>!x.a).map(x=>x.k),['っ']);
  assert.equal(hasSound('っ'),false);
  assert.equal(hasSound('か'),true);
  assert.equal(hasSound('きゃ'),true);
});
test('look-alikes are linked',()=>{
  for(const [a,b] of [['ぬ','め'],['っ','つ'],['きゃ','きょ'],['きゃ','き'],['ぎゃ','きゃ'],['が','か'],['ば','ぱ'],['びゃ','ぴゃ']])
    assert.ok(CONFMAP[a]&&CONFMAP[a].has(b),`${a} should look like ${b}`);
});
test('っ has 10 made-up pairs built only from basic kana',()=>{
  const basic=new Set(ROWS.filter(r=>r.sec==='basic').flatMap(r=>r.k));
  assert.equal(PAIRS['っ'].length,10);
  for(const p of PAIRS['っ']){
    assert.ok(p.long.includes('っ'),p.long);
    assert.equal(p.long.replace('っ',''),p.short);
    for(const ch of p.short)assert.ok(basic.has(ch),`${ch} in ${p.short}`);
    for(const f of ['rl','rs','al','as'])assert.ok(p[f],`${p.long} ${f}`);
    assert.notEqual(p.rl,p.rs);
  }
});
test('every row is an array of entries, and sections come in order',()=>{
  const order=['basic','dakuten','combo','marks'];
  let last=0;
  for(const r of ROWS){
    assert.ok(Array.isArray(r.k),r.id);
    assert.equal(r.k.length,r.r.length,r.id);
    const i=order.indexOf(r.sec);assert.ok(i>=last,`${r.id} section ${r.sec}`);last=i;
  }
});
test('a mix-up between two-character entries keeps both entries whole',()=>{
  assert.equal(mixKey('きゃ','きょ'),mixKey('きょ','きゃ'));
  assert.deepEqual(mixParts(mixKey('きょ','きゃ')),['きゃ','きょ']);
  assert.deepEqual(mixParts(mixKey('ぬ','め')),['ぬ','め']);
});
test('a mix-up only counts between two real entries (not the other word of a っ pair)',()=>{
  assert.equal(mixKey('っ','~'),null);
  assert.equal(mixKey('か','?'),null);
});
test('pickPair picks one of the pairs, and whether the long or short word is shown',()=>{
  const seq=v=>{let i=0;return ()=>v[i++];};
  const a=pickPair('っ',seq([0,0.2]));
  assert.equal(a.long,PAIRS['っ'][0].long);assert.equal(a.showLong,true);assert.equal(a.word,a.long);
  const b=pickPair('っ',seq([0.999,0.7]));
  assert.equal(b.long,PAIRS['っ'][9].long);assert.equal(b.showLong,false);
  assert.equal(b.word,b.short);assert.equal(b.romaji,b.rs);assert.equal(b.clip,b.as);
  assert.equal(pickPair('か'),null);
});
test('cards from another app are spotted',()=>{
  assert.deepEqual(unknownCards({cards:{'ア|read':{},'キャ|write':{}}}),['ア|read','キャ|write']);
  assert.deepEqual(unknownCards({cards:{'あ|read':{},'きゃ|write':{},'っ|recall':{}}}),[]);
});
