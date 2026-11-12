#!/usr/bin/env python3
"""Tidy freshly made voice clips the same way as the ones already in the app, then copy them into audio/.

Google's clips start with about 0.4 seconds of silence, which feels like lag after tapping play. For each
clip in out/ (from tools/make_voice.py) this:
  - trims the silence off both ends, leaving a tiny bit of breathing room
  - levels it so its loudest moment is -1.4 dB, like the existing clips
  - saves it as a small mono MP3 (24 kHz, 48 kbit/s) in audio/

Needs ffmpeg. Run it from the top of the repo, listen to the results, then rerun tools/make_sw.py:

    python3 tools/tidy_voice.py              # every clip in out/
    python3 tools/tidy_voice.py pair-otto  # only these
"""
import glob, os, re, subprocess, sys

SRC, DEST = 'out', 'audio'
PEAK_DB = -1.4
GAP = 0.03  # seconds of silence kept at each end
TRIM = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=%s,areverse,'
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=%s,areverse') % (GAP, GAP)


def run(args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y'] + args, capture_output=True, text=True)


def peak(path):
    out = run(['-i', path, '-af', TRIM + ',volumedetect', '-f', 'null', '-']).stderr
    return float(re.search(r'max_volume: (-?[\d.]+) dB', out).group(1))


names = sys.argv[1:] or sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(SRC, '*.mp3')))
for name in names:
    src, dest = os.path.join(SRC, name + '.mp3'), os.path.join(DEST, name + '.mp3')
    gain = PEAK_DB - peak(src)
    r = run(['-i', src, '-af', f'{TRIM},volume={gain:.2f}dB', '-ac', '1', '-ar', '24000',
             '-c:a', 'libmp3lame', '-b:a', '48k', dest])
    if r.returncode:
        sys.exit(f'ffmpeg failed on {name}:\n{r.stderr[-500:]}')
    print(f'{name}: {os.path.getsize(dest)} bytes, {gain:+.1f} dB')
