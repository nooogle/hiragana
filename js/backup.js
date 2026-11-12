// Backups: the progress as text to copy, labelled with this app's name, and the checks before restoring one.
// Every app on nooogle.github.io has its own backups, so a Katakana drill backup pasted here is turned away
// (by its label, or for older unlabelled ones, because its cards aren't in this deck).

import {BY} from './deck.js';

export const APP='hiragana-drill';
const NAMES={'hiragana-drill':'the Hiragana drill','katakana-drill':'the Katakana drill'};

/** The progress object as backup text, with this app's label. */
export const backupText=S=>JSON.stringify({app:APP,...S});

/** Check a parsed backup. Returns {state} (the progress, without the label) if it can be restored here,
 *  or {error} with a message to show if it can't. */
export function checkBackup(s){
  if(!s||typeof s!=='object'||!s.rows||!s.cards)return {error:'That backup could not be read'};
  if(s.app&&s.app!==APP)return {error:`This backup is from ${NAMES[s.app]||'another app'}. Restore it there instead.`};
  if(Object.keys(s.cards).some(id=>!BY[id.split('|')[0]]))return {error:'That backup is from another app, such as the Katakana drill'};
  const {app,...state}=s;
  return {state};
}
