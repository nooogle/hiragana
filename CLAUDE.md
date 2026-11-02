# hiragana

The Hiragana drill: a small web app for learning to read and write hiragana, published by GitHub Pages at
<https://nooogle.github.io/hiragana/>. The home page that lists all the apps is in the separate
`nooogle.github.io` repo; it links here, so keep the address the same.

Read `README.md` before working on the code.

## Layout

- The app is at the top of the repo: `index.html`, `css/`, `js/`, `vendor/`, `icons/`, `audio/`, `sw.js` and so on.
- `tools/`: helper scripts, run from the top of the repo (`make_sw.py` for the offline cache list, `make_strokes.py` for the stroke data).
- `preview/`: temporary copies of work in progress for trying on a phone. See `preview/README.md`. Delete the copy once the work is merged.
- `.nojekyll`: tells GitHub Pages to serve files as they are.

## Conventions

- Plain HTML, CSS and JavaScript (ES modules), with no build step and no npm. GitHub Pages serves the files exactly as committed.
- Third-party code is copied into `vendor/`, pinned to a version, with its licence alongside.
- Pages should work well on a phone first, and support light and dark mode (colours as CSS variables on `:root`).
- Every app on nooogle.github.io shares one browser storage space, so keep `localStorage` keys and caches namespaced to this app (`hiragana-...`).
- Explanations and docs are written in plain, friendly English for a non-specialist reader.

## Running locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Opening the HTML files directly won't work, because browsers block ES modules from `file://`.

## Things to remember

- If you add, rename or remove a file, or change a voice clip, rerun `tools/make_sw.py` with a new version name.
- Don't break the saved progress format without adding a migration.
