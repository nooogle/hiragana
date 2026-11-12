// Every voice clip the app uses: clip name (audio/<name>.mp3) → the hiragana to say.
// Built from the deck, so the list never drifts from it. tools/make_voice.py runs this to get the list:
//   node tools/clips.mjs        prints the whole table as JSON
import {KANA,PAIRS} from '../js/deck.js';

export const CLIPS={};
for(const x of KANA)if(x.a)CLIPS[x.a]=x.k;
for(const p of PAIRS['っ']){CLIPS[p.al]=p.long;CLIPS[p.as]=p.short;}

if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify({clips:CLIPS}));
