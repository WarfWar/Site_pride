#!/usr/bin/env python3
"""Download/validate freely usable Unsplash JPGs for bundling offline in Android APK.
Run from repository root: python3 android/scripts/fetch_photos.py
Generated *.jpg files go into Android assets and are excluded from Git history.
"""
import concurrent.futures
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "photo-sources.json"
OUT = ROOT / "app/src/main/assets/site/photos"
SOURCES = json.loads(MANIFEST.read_text(encoding="utf-8"))["photos"]
OUT.mkdir(parents=True, exist_ok=True)

def fetch(rec):
    dest = OUT / (rec["key"] + ".jpg")
    if dest.exists() and dest.stat().st_size >= 5000:
        return rec["key"], True, "cached"
    url = ("https://images.unsplash.com/" + rec["photo"] +
           "?w=660&h=420&fit=crop&fm=jpg&q=72")
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 PrideCafeAndroid/1.1"})
            with urllib.request.urlopen(request, timeout=25) as response:
                content = response.read(2_000_000)
            if not (content.startswith(b"\xff\xd8") and len(content) >= 5000):
                raise ValueError("Not a JPEG or file too small")
            dest.write_bytes(content)
            return rec["key"], True, f"{len(content)} bytes"
        except Exception as e:
            error = str(e)
            if attempt < 2:
                time.sleep(attempt + 1)
    return rec["key"], False, error

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(fetch, SOURCES))

for name, ok, msg in results:
    print(("OK " if ok else "FAIL ") + name + ": " + msg)
success = [name for name, ok, _ in results if ok]
print(f"Valid bundled photographs: {len(success)} / {len(SOURCES)}")
if len(success) < 12:
    raise SystemExit("Insufficient downloadable photos; refusing to produce a photo-less APK.")
