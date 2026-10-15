#!/usr/bin/env python3
"""Recover exactly the dish photographs currently hosted on the original Pride site.

This script downloads the original site's image files (not replacement stock photos)
and packages them inside the Android WebView assets for entirely offline use.

Run from repository root: python3 android/scripts/fetch_original_photos.py
"""
import concurrent.futures
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "app/src/main/assets/site"
OUT = SITE / "photos"
SOURCE = "https://cafe-pride-menu.savory-heron-9771.chatgpt.site"
OUT.mkdir(parents=True, exist_ok=True)

def request_bytes(url, limit=2500000):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 PrideCafeOriginalPhotoRecovery/1.2",
        "Accept": "image/webp,image/avif,image/*,*/*;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=40) as response:
        return response.read(limit + 1)

def is_webp(data):
    return len(data) > 500 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP"

menu = json.loads((SITE / "data/menu.json").read_text(encoding="utf-8"))
assert len(menu) == 108, f"Expected 108 curated menu items, got {len(menu)}"
orig = json.loads(request_bytes(SOURCE + "/menu.json", limit=1500000).decode("utf-8"))
source_items = [item for group in orig["food"] for item in group["items"]]
assert len(source_items) == 125, f"Original site has {len(source_items)} items instead of 125"
references = []
source_paths = set()
for index, item in enumerate(source_items):
    path = item.get("image", "")
    assert path.startswith("/assets/") and path.endswith(".webp"), (index,path)
    filename = path.rsplit("/", 1)[-1]
    if filename in source_paths:
        raise ValueError("Duplicate original food image: "+filename)
    source_paths.add(filename)
    references.append((index, item["name"], urllib.parse.urljoin(SOURCE, path), OUT / filename))
# Card images may be reused deliberately for multiple variants and curated four sushi sets.
for item in menu:
    path = item["image"]
    assert path.startswith("./photos/") and path.rsplit("/",1)[-1] in source_paths, (item["title"], path)

def download(entry):
    index, name, uri, path = entry
    if path.is_file() and is_webp(path.read_bytes()):
        return index, name, True, "cached"
    last_error = "unknown"
    for attempt in range(3):
        try:
            data = request_bytes(uri)
            if not is_webp(data):
                raise ValueError(f"Not a valid WebP ({len(data)} bytes)")
            path.write_bytes(data)
            return index, name, True, str(len(data)) + " bytes"
        except (OSError, ValueError, urllib.error.URLError) as err:
            last_error = str(err)
            if attempt != 2:
                time.sleep(attempt + 1)
    return index, name, False, last_error

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    result = list(pool.map(download, references))
failed = []
for index, name, ok, detail in result:
    if not ok:
        failed.append((index, name, detail))
        print(f"FAILED [{index}] {name}: {detail}")
successful = sum(ok for _, _, ok, _ in result)
size_bytes = sum(p.stat().st_size for p in OUT.glob("*.webp"))
print(f"Recovered ORIGINAL Pride food photographs: {successful}/125")
print(f"Total downloaded photo data: {size_bytes/1048576:.2f} MiB")
if failed:
    raise SystemExit(f"Cannot build offline APK: {len(failed)} original photographs unavailable")

assert len(references)==125
