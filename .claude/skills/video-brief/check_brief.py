#!/usr/bin/env python3
"""Timing and fit check for a video brief's scene table (product/VIDEO-BRIEF-STANDARD.md, checks 1-4).

Reads markdown table rows shaped `| 01 / 4s | "spoken words" | ...` or the plain-text export of the
agency's .docx (a `01 / 4s` line followed by the VO line). Exits 1 if any check fails.
ponytail: covers timing only; the full 17-check lint belongs in server/videoLint.ts (plan phase 1).
"""
import argparse
import math
import re
import sys

ROW = re.compile(r"^\|?\s*(\d\d)\s*/\s*(\d+)s\s*(?:\|\s*(.*?)\s*\|.*)?$")


def scenes(text):
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = ROW.match(line.strip())
        if not m:
            continue
        vo = m.group(3) if m.group(3) is not None else (lines[i + 1].strip() if i + 1 < len(lines) else "")
        silent = vo.lower().startswith("music only")
        yield m.group(1), int(m.group(2)), 0 if silent else len(re.findall(r"[A-Za-z0-9$'’]+", vo))


def check(text, pace, runtime, max_scene):
    rows, problems = list(scenes(text)), []
    total = sum(d for _, d, _ in rows)
    if not rows:
        problems.append("no scene rows found")
    if runtime and total != runtime:
        problems.append(f"durations add up to {total}s, runtime is {runtime}s")
    for n, d, w in rows:
        if w > math.ceil(d * pace * 1.1):  # limit rounded up to a whole word
            problems.append(f"scene {n}: {w} words in {d}s is {w / d:.1f} words/s (pace {pace})")
        if max_scene and d > max_scene and (n, d, w) != rows[-1]:
            problems.append(f"scene {n}: {d}s breaks the pacing rule (max {max_scene}s)")
    return rows, problems


def demo():
    good = '| 01 / 4s | "Starting every October, this window lets the cold right in." | x |\n| 02 / 2s | Music only | x |'
    assert check(good, 2.5, 6, 4)[1] == []
    bad = '| 03 / 3s | "Then our bill would come and it kept getting higher! That\'s what made me give in and call." | x |'
    assert len(check(bad, 2.5, 30, 4)[1]) == 2  # wrong total, and over pace


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("brief", nargs="?")
    p.add_argument("--pace", type=float, default=2.5, help="words per second for this concept")
    p.add_argument("--runtime", type=int, default=0, help="required total seconds")
    p.add_argument("--max-scene", type=int, default=0, help="longest allowed scene, from the pacing rule")
    a = p.parse_args()
    if not a.brief:
        demo()
        sys.exit(print("self-check passed"))
    rows, problems = check(open(a.brief).read(), a.pace, a.runtime, a.max_scene)
    words = sum(w for _, _, w in rows)
    print(f"{len(rows)} scenes, {sum(d for _, d, _ in rows)}s, {words} words, needs {words / a.pace:.1f}s at {a.pace} words/s")
    for x in problems:
        print("FAIL", x)
    sys.exit(1 if problems else 0)
