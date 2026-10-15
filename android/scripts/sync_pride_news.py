#!/usr/bin/env python3
"""Synchronize the latest *public* posts from https://t.me/s/cafe_Pride_Volna.

The generated JSON contains only public post text, dates and official Telegram links.
On build, --bundle also copies the current snapshot into Android offline assets.
No Telegram token, cookies, account, or scraping of private chats is used.
"""
import argparse
import html
import json
import re
import shutil
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/news.json"
LOCAL = ROOT / "android/app/src/main/assets/site/data/news.json"
SOURCE = "https://t.me/s/cafe_Pride_Volna"
CHANNEL = "cafe_Pride_Volna"
LIMIT = 24

def request_text(url):
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) PrideCafeAppNews/1.0", "Accept":"text/html"})
    with urllib.request.urlopen(req, timeout=40) as response:
        if response.status != 200:
            raise ValueError(f"HTTP {response.status}")
        return response.read(3000000).decode("utf-8", errors="replace")

def clean(value, maxchars):
    s = re.sub(r"\n{3,}", "\n\n", value.replace("\u200b", "")).strip()
    return s[:maxchars]

def extract():
    soup = BeautifulSoup(request_text(SOURCE), "html.parser")
    results = []
    seen = set()
    for el in soup.select(".tgme_widget_message[data-post]"):
        post = el.get("data-post", "")
        matched = re.fullmatch(r"cafe_Pride_Volna/(\d+)", post, re.IGNORECASE)
        if not matched:
            continue
        post_id = int(matched.group(1))
        if post_id in seen:
            continue
        textnode = el.select_one(".tgme_widget_message_text")
        content = clean(textnode.get_text("\n", strip=True) if textnode else "", 3400)
        if not content:
            continue
        seen.add(post_id)
        title = next((ln.strip() for ln in content.splitlines() if ln.strip()), "Новость кафе")
        title = clean(title, 145)
        date = el.select_one("time[datetime]")
        timestamp = date.get("datetime", "") if date else ""
        if not re.fullmatch(r"\d{4}-\d\d-\d\dT[^\s]+", timestamp):
            timestamp = ""
        results.append({
            "id": post_id,
            "title": title,
            "text": content,
            "date": timestamp,
            "url": f"https://t.me/{CHANNEL}/{post_id}",
        })
    results.sort(key=lambda x:x["id"], reverse=True)
    if not results:
        raise RuntimeError("Telegram returned no public messages")
    return results[:LIMIT]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle", action="store_true")
    args = parser.parse_args()
    DEST.parent.mkdir(parents=True, exist_ok=True)
    existing = None
    if DEST.is_file():
        try: existing = json.loads(DEST.read_text(encoding="utf-8"))
        except Exception: existing = None
    try:
        posts = extract()
        if existing and existing.get("posts") == posts:
            payload = existing
            print("No new Telegram publications.")
        else:
            payload = {
              "source": SOURCE,
              "channel": CHANNEL,
              "updated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
              "posts": posts
            }
            DEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
            print(f"Updated {len(posts)} public posts. Newest id: {posts[0]['id']}")
    except Exception as exc:
        print(f"Cannot fetch Telegram news: {type(exc).__name__}: {exc}", file=sys.stderr)
        if existing and existing.get("posts"):
            payload = existing
            print("Using last successfully fetched news.")
        else:
            payload={"source":SOURCE,"channel":CHANNEL,"updated_at":None,"posts":[]}
            if args.bundle:
                print("Bundled feed is empty; live app can retry online.")
            else:
                raise
    if args.bundle:
        LOCAL.parent.mkdir(parents=True, exist_ok=True)
        LOCAL.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        print("Added",len(payload["posts"]),"public posts to Android's offline news snapshot.")

if __name__=="__main__":
    main()
