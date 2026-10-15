#!/usr/bin/env python3
"""Download all 113 exact bar photographs from the original cafe site.

The photo path for each drink is saved in bar.json, in the order received from
original /menu.json. No category-shared placeholders are substituted.
"""
import concurrent.futures
import json
import time
import urllib.request
from pathlib import Path

ANDROID = Path(__file__).resolve().parents[1]
SITE = ANDROID / 'app/src/main/assets/site'
BAR = SITE / 'data/bar.json'
OUT = SITE / 'bar_photos'
HOST = 'https://cafe-pride-menu.savory-heron-9771.chatgpt.site'
OUT.mkdir(parents=True, exist_ok=True)
items = json.loads(BAR.read_text(encoding='utf-8'))
assert len(items) == 113, f'Wrong number of bar items: {len(items)}'
assert len(set(x['image'] for x in items)) == 113, 'Duplicate drink photo filenames!'

def valid(data):
    return len(data) > 450 and data[:4] == b'RIFF' and data[8:12] == b'WEBP'

def get(index_item):
    idx, item = index_item
    path = item['source_image']
    assert path.startswith('/assets/') and path.endswith('.webp'), (idx, path)
    name = path.rsplit('/', 1)[1]
    expected = './bar_photos/' + name
    assert item['image'] == expected, (idx, item['image'], expected)
    output = OUT / name
    if output.is_file() and valid(output.read_bytes()):
        return idx, True, 'cached'
    error = 'unknown'
    for retry in range(3):
        try:
            req = urllib.request.Request(HOST + path, headers={
                'User-Agent': 'Mozilla/5.0 PrideCafeAndroid/1.6',
                'Accept': 'image/webp,image/*;q=0.8',
            })
            with urllib.request.urlopen(req, timeout=38) as resp:
                data = resp.read(2_500_000)
            if not valid(data):
                raise ValueError(f'Invalid WebP: {len(data)} bytes')
            output.write_bytes(data)
            return idx, True, f'{len(data)} bytes'
        except Exception as ex:
            error = str(ex)
            time.sleep(0.8 * (retry + 1))
    return idx, False, error

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    results = sorted(pool.map(get, enumerate(items)))
for i, ok, info in results:
    print(('OK  ' if ok else 'FAIL') + f' [{i:03d}] {items[i]["title"]}: {info}')
success = sum(ok for _, ok, _ in results)
print('Exact individual bar photos:', success, '/', len(items))
if success != 113:
    raise SystemExit(f'Build stopped: {113-success} original bar images missing')
