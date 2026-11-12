#!/usr/bin/env python3
"""Make the voice clips with Google Cloud Text-to-Speech (Chirp 3 HD).

Based on the script that made the original clips (see how-the-voice-was-made.html). Run it from the
top of the repo. It needs Node (to read the clip list from the deck) and a Google API key:

    export GOOGLE_API_KEY=...
    python3 tools/make_voice.py              # every clip not yet in audio/ -> ./out/<name>.mp3
    python3 tools/make_voice.py pair-otto    # only these clips
    python3 tools/make_voice.py --all        # every clip, even ones already in audio/
    VOICE=ja-JP-Chirp3-HD-Kore python3 tools/make_voice.py

Then run tools/tidy_voice.py to trim and level them into audio/, listen to each one,
and rerun tools/make_sw.py with a new version name.
Never commit the key.

Standard library only.
"""
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

VOICE = os.environ.get("VOICE", "ja-JP-Chirp3-HD-Aoede")
OUT_DIR = os.environ.get("OUT_DIR", "out")
TEMPLATE = os.environ.get("TEMPLATE", "{}")  # e.g. "{}。" or "{}、{}" (use {} for the kana)
API_KEY = os.environ.get("GOOGLE_API_KEY")
MIN_BYTES = 2000
MAX_TRIES = 3
URL = "https://texttospeech.googleapis.com/v1/text:synthesize"



def clip_table():
    """Clip name -> hiragana to say, from the deck (via tools/clips.mjs, so the list never drifts)."""
    out = subprocess.run(["node", os.path.join(os.path.dirname(__file__), "clips.mjs")],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def synthesize(text: str) -> bytes:
    body = json.dumps({
        "input": {"text": TEMPLATE.format(text, text)},
        "voice": {"languageCode": "ja-JP", "name": VOICE},
        "audioConfig": {"audioEncoding": "MP3"},
    }).encode()
    req = urllib.request.Request(
        f"{URL}?key={API_KEY}", data=body,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return base64.b64decode(json.load(resp)["audioContent"])
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} for {text!r}: {e.read().decode()}")


def main() -> None:
    if not API_KEY:
        sys.exit("Set GOOGLE_API_KEY first.")
    table = clip_table()["clips"]
    args = sys.argv[1:]
    if args == ["--all"]:
        names = list(table)
    elif args:
        names = args
    else:
        names = [n for n in table if not os.path.exists(os.path.join("audio", n + ".mp3"))]
    unknown = [n for n in names if n not in table]
    if unknown:
        sys.exit(f"Unknown clip names: {', '.join(unknown)}")
    if not names:
        sys.exit("Every clip is already in audio/. Use --all to make them all again.")
    os.makedirs(OUT_DIR, exist_ok=True)
    for name in names:
        path = os.path.join(OUT_DIR, f"{name}.mp3")
        # Chirp occasionally returns a near-silent clip; retry and keep the largest.
        audio = b""
        for _ in range(MAX_TRIES):
            audio = max(audio, synthesize(table[name]), key=len)
            if len(audio) >= MIN_BYTES:
                break
        with open(path, "wb") as f:
            f.write(audio)
        warn = "" if len(audio) >= MIN_BYTES else "  (WARNING: still short, check it)"
        print(f"{table[name]} -> {path}{warn}")


if __name__ == "__main__":
    main()
