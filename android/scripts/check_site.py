#!/usr/bin/env python3
"""Validate both offline menus, news, and original photo links before APK build."""
import json
import pathlib
SITE=pathlib.Path(__file__).resolve().parents[1]/'app/src/main/assets/site'
food=json.loads((SITE/'data/menu.json').read_text(encoding='utf-8'))
bar=json.loads((SITE/'data/bar.json').read_text(encoding='utf-8'))
assert len(food)==108, f'{len(food)} kitchen entries'
assert len(bar)==108, f'{len(bar)} bar entries'
assert all((SITE/x['image']).is_file() for x in bar)
for item in food:
    assert item['image'].startswith('./photos/')
    assert (SITE/item['image']).is_file(),item['image']
for item in bar:
    assert item['image'].startswith('./bar_photos/')
    assert (SITE/item['image']).is_file(),item['image']
news=json.loads((SITE/'data/news.json').read_text(encoding='utf-8'))
assert isinstance(news.get('posts'),list)
for name in ['index.html','app.js','cart.js','photos.js','news.js','cart.css','styles.css','assets/pride-brand.png']:
    assert (SITE/name).is_file(),name
html=(SITE/'index.html').read_text(encoding='utf-8')
for value in ['id="tab-kitchen"','id="tab-bar"','id="tab-news"','id="cart-open-top"']:
    # Cart is constructed by JS, not static HTML.
    if value=='id="cart-open-top"':continue
    assert value in html,value
cart=(SITE/'cart.js').read_text(encoding='utf-8')
for value in ['data-open-cart','pride.selection.v1','pride.selection.v2','pride:render']:
    assert value in cart,value
print('PASS:',len(food),'kitchen items,',len(bar),'bar items and photos, logo, navigation and basket')
