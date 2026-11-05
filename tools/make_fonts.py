#!/usr/bin/env python3
"""Rebuild vendor/fonts: local copies of the two Google Fonts the app uses (Klee One and Zen Maru Gothic).

Keeping them in the app means they work offline and never hold up the page on a weak signal.
Google splits each Japanese font into about 120 small pieces; this keeps only the pieces that cover
characters the app actually uses (all of hiragana, plus whatever appears in the pages and scripts), so a
character that's added later and isn't covered just shows in the phone's own font.

Run it from the top of the repo after adding text with new characters (such as katakana or kanji),
then rerun tools/make_sw.py with a new version name:

    python3 tools/make_fonts.py
"""
import glob, os, re, urllib.request

FONTS = [('Klee One', '400'), ('Klee One', '600'), ('Zen Maru Gothic', '500'), ('Zen Maru Gothic', '700')]
CSS_URL = 'https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Zen+Maru+Gothic:wght@500;700&display=swap'
# Google sends woff2 files with unicode-range only to browsers it knows support them
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
OUT = 'vendor/fonts'
OTHER_SCRIPTS = ('latin-ext', 'cyrillic', 'greek', 'greek-ext', 'vietnamese')


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read()


def ranges(face):
    out = []
    for part in re.search(r'unicode-range: ([^;]+);', face).group(1).split(','):
        a, _, b = part.strip()[2:].partition('-')
        out.append((int(a, 16), int(b or a, 16)))
    return out


def covers(face, chars):
    r = ranges(face)
    return {c for c in chars if any(a <= c <= b for a, b in r)}


used = set(range(0x20, 0x7f)) | set(range(0x3041, 0x3097))  # all of ASCII and hiragana
for f in glob.glob('*.html') + glob.glob('js/**/*.js', recursive=True) + glob.glob('css/*.css'):
    used |= {ord(c) for c in open(f, encoding='utf-8').read()}

css = get(CSS_URL).decode()
faces = re.findall(r'(?:/\* (\S+) \*/\s*)?@font-face \{(.*?)\}', css, re.S)  # (subset name or '', body)
os.makedirs(OUT, exist_ok=True)
for old in glob.glob(os.path.join(OUT, '*.woff2')):
    os.remove(old)
rules, total = [], 0
for family, weight in FONTS:
    mine = [(sub, f) for sub, f in faces if f"'{family}'" in f and f'font-weight: {weight};' in f]
    latin = next(f for sub, f in mine if sub == 'latin')
    need = used - covers(latin, used)
    japanese = [f for sub, f in mine if sub not in OTHER_SCRIPTS + ('latin',) and covers(f, need)]
    left = need - set().union(*(covers(f, need) for f in japanese))
    print(f'{family} {weight}: {len(japanese)} Japanese pieces + latin; left to the phone\'s fonts: {"".join(map(chr, sorted(left)))}')
    # Keep Google's order (latin last): where pieces overlap, the browser uses the last one
    for i, face in enumerate(japanese + [latin]):
        url = re.search(r'url\((\S+)\)', face).group(1)
        name = f"{family.lower().replace(' ', '-')}-{weight}-{'latin' if face is latin else i}.woff2"
        data = get(url)
        total += len(data)
        open(os.path.join(OUT, name), 'wb').write(data)
        rules.append('@font-face{' + re.sub(r'\s+', ' ', face.replace(url, name)).strip() + '}')

open(os.path.join(OUT, 'fonts.css'), 'w').write(
    '/* Klee One and Zen Maru Gothic (SIL Open Font License, see OFL-*.txt), from Google Fonts.\n'
    '   Made by tools/make_fonts.py: only the pieces covering characters the app uses. */\n' + '\n'.join(rules) + '\n')
for project, slug in [('klee-one', 'kleeone'), ('zen-maru-gothic', 'zenmarugothic')]:
    open(os.path.join(OUT, f'OFL-{project}.txt'), 'wb').write(get(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{slug}/OFL.txt'))
print(f'{len(rules)} font files, {total // 1024} KB, in {OUT}')
