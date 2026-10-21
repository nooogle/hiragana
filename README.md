# Hiragana drill: notes for working on the code

This is the developer side of the app. (For how to *use* it, see [How it works](how-it-works.html).)

It's plain HTML, CSS and JavaScript with no build step. GitHub Pages serves these files exactly as they are, and the browser loads the JavaScript as **ES modules**: each file `export`s what it shares and `import`s what it needs from the others.

## Where things are

```
hiragana/
  index.html            the page skeleton: one empty <main>, then loads js/app.js
  css/style.css         all the styling (colours are variables at the top, with dark mode below)
  js/
    app.js              start-up, and the one click handler that routes every button (data-act="...")
    deck.js             the rows, kana, romaji and look-alike pairs
    storage.js          the progress object S, saved to localStorage; backups copy exactly this
    scheduler.js        FSRS: grading answers, unlocking card types, converting old progress
    queues.js           which cards come up: reviews, weakest, run through everything
    sound.js            voice clips and phone speech, and waiting for sounds to finish
    hints.js            the suggested hints, hint boxes and the hint editor
    keys.js             keyboard shortcuts for computers (each key presses a button on screen)
    sheets.js           pop-up panels: row options and Settings
    ui.js               shared bits: icons, toasts, chart colours, streak, "next cards ready" text
    drawing.js          the finger-drawing pad on writing cards
    screens/
      home.js           the chart screen
      session.js        showing cards, answers, feedback, the done screen
      report.js         the Progress screen and its share text
  vendor/               the ts-fsrs library, untouched (MIT licence)
  icons/                app icons for iPhone, Android and desktop, and the favicons
  manifest.webmanifest  the app's name, icons and colours, used when it's installed
  audio/                one MP3 per sound, named by romaji
  sw.js                 the offline cache (generated, see below)
  how-it-works.html     the user guide
  how-the-voice-was-made.html
```

Screens are drawn by building HTML in JavaScript and putting it into the `<main id="app">` box. Buttons don't get their own handlers: each has a `data-act` attribute, and `app.js` has a single `switch` that decides what to do.

## Trying changes on your Mac

Modules won't load if you just double-click the HTML file (browsers block that). Run a tiny web server from the top of the repo instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/hiragana/>. Progress there is separate from the live site.

## The offline cache

`sw.js` keeps a copy of every file on the phone so the app works with no signal. Pages, scripts and styles are always fetched fresh when there's signal, so ordinary code changes need nothing extra. But **if you add, rename or remove a file, or change a voice clip**, rebuild the list and give it a new version name:

```bash
python3 tools/make_sw.py hiragana hiragana/sw.js 2026-10-21c
```

## Saved progress

Progress lives in `localStorage` under the key `hiragana-drill-v1`, as one JSON object (`S` in `storage.js`). Keep that format compatible, or add a conversion step like `migrate()` in `scheduler.js`, so nobody loses their progress when the app updates.
