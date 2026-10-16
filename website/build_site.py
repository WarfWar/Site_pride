#!/usr/bin/env python3
"""Build the public Pride website from the latest Android WebView assets.

Keeps menu, bar, basket, original food photos, news and branding in sync with
Android without copying/rewriting hundreds of binary files in git.
Table choice is a REQUEST DRAFT, never a guaranteed reservation.
"""
from pathlib import Path
import json
import re
import shutil

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'android/app/src/main/assets/site'
TARGET=ROOT/'_site'
WEB=ROOT/'website'

if TARGET.exists():
    shutil.rmtree(TARGET)
shutil.copytree(SOURCE,TARGET)
shutil.copy2(WEB/'booking.css',TARGET/'booking.css')
shutil.copy2(WEB/'booking.js',TARGET/'booking.js')

# Pull the latest public Telegram snapshot into the deployed site.
news=ROOT/'data/news.json'
if news.is_file():
    shutil.copy2(news,TARGET/'data/news.json')

html=(SOURCE/'index.html').read_text(encoding='utf-8')
assert html.count('<section class="contact-section"')==1
assert html.count('</head>')==1
assert html.count('</body>')==1

html=html.replace(
    '</head>',
    '  <link rel="stylesheet" href="./booking.css">\n</head>'
)
html=html.replace(
    'href="#contacts">Контакты</a></nav>',
    'href="#tables">Выбор столика</a><a href="#contacts">Контакты</a></nav>'
)
html=html.replace(
    '<div class="hero-actions">',
    '<div class="hero-actions"><a class="btn btn-outline hero-book-link" href="#tables">Выбрать столик ↗</a>'
)
html=html.replace(
    'Кухня, бар и новости<br>в одном приложении.',
    'Кухня, бар и новости<br>на нашем сайте.'
)
html=html.replace(
    'ПРИЛОЖЕНИЕ КАФЕ','КАФЕ «ПРАЙД» · МЕНЮ'
).replace(
    'Переключайтесь между кухней, барной картой и новостями. Добавляйте понравившиеся блюда и напитки в корзину.',
    'Выбирайте блюда и напитки, сохраняйте понравившееся в корзину и подберите столик для встречи.'
)
html=html.replace(
    '<title>Прайд — кафе в Волновахе | Меню, бар и новости</title>',
    '<title>Кафе «Прайд» — меню, новости и выбор столика | Волноваха</title>'
)
html=html.replace(
    'Кафе «Прайд», Волноваха: меню кухни, бара, новости, адрес и телефон.',
    'Кафе «Прайд» в Волновахе: меню кухни и бара, фотографии, новости, выбор столика и контакты.'
)
booking_section = r'''
  <section class="booking-section" id="tables" aria-labelledby="booking-heading">
    <div class="container">
      <div class="booking-intro">
        <div>
          <span class="eyebrow">ВАШ ВЕЧЕР · ВАШ СТОЛ</span>
          <h2 id="booking-heading">Выберите <em>своё место.</em></h2>
          <p>Подберите удобный столик, дату и количество гостей. Подготовьте запрос и подтвердите бронирование по телефону кафе.</p>
        </div>
        <a href="tel:+79490684888" class="booking-intro-phone">+7 (949) 068-48-88 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="booking-layout">
        <div class="booking-map-card">
          <div class="booking-card-head">
            <div><span class="booking-kicker">СХЕМА ЗАЛА</span><h3>Найдите подходящий стол</h3></div>
            <span class="booking-legend"><i aria-hidden="true"></i> Выбран вами</span>
          </div>
          <p class="booking-demo-note"><strong>Предварительная схема:</strong> расположение и номера столов показаны для примера. Реальную схему и свободные места подтвердит администратор.</p>
          <div class="booking-floor" id="booking-floor" role="group" aria-label="Столики на предварительной схеме зала">
            <span class="floor-side floor-side-window">◫ ОКНА</span>
            <span class="floor-side floor-side-entry">ВХОД <span aria-hidden="true">↗</span></span>
            <span class="floor-accent floor-accent-one" aria-hidden="true">✳</span>
            <span class="floor-accent floor-accent-two" aria-hidden="true">✳</span>
            <button class="floor-table" type="button" data-table="1" data-seats="2" style="--x:17%;--y:21%" aria-pressed="false"><span class="floor-table-number">01</span><span class="floor-table-seats">2 места</span></button>
            <button class="floor-table" type="button" data-table="2" data-seats="4" style="--x:43%;--y:21%" aria-pressed="false"><span class="floor-table-number">02</span><span class="floor-table-seats">4 места</span></button>
            <button class="floor-table" type="button" data-table="3" data-seats="2" style="--x:72%;--y:21%" aria-pressed="false"><span class="floor-table-number">03</span><span class="floor-table-seats">2 места</span></button>
            <button class="floor-table" type="button" data-table="4" data-seats="4" style="--x:17%;--y:48%" aria-pressed="false"><span class="floor-table-number">04</span><span class="floor-table-seats">4 места</span></button>
            <button class="floor-table floor-table-large" type="button" data-table="5" data-seats="6" style="--x:45%;--y:48%" aria-pressed="false"><span class="floor-table-number">05</span><span class="floor-table-seats">6 мест</span></button>
            <button class="floor-table" type="button" data-table="6" data-seats="4" style="--x:76%;--y:48%" aria-pressed="false"><span class="floor-table-number">06</span><span class="floor-table-seats">4 места</span></button>
            <button class="floor-table" type="button" data-table="7" data-seats="2" style="--x:17%;--y:76%" aria-pressed="false"><span class="floor-table-number">07</span><span class="floor-table-seats">2 места</span></button>
            <button class="floor-table" type="button" data-table="8" data-seats="4" style="--x:43%;--y:76%" aria-pressed="false"><span class="floor-table-number">08</span><span class="floor-table-seats">4 места</span></button>
            <button class="floor-table floor-table-large" type="button" data-table="9" data-seats="8" style="--x:76%;--y:76%" aria-pressed="false"><span class="floor-table-number">09</span><span class="floor-table-seats">8 мест</span></button>
          </div>
          <p class="booking-map-hint">Нажмите на столик, чтобы выбрать его. Столики, которые меньше вашей компании, будут недоступны для выбора.</p>
        </div>
        <div class="booking-request-card">
          <span class="booking-kicker">ШАГ 02 · ДЕТАЛИ ВСТРЕЧИ</span>
          <h3>Ваш вечер в «Прайде»</h3>
          <p class="booking-request-lead">Заполните пожелания — сайт подготовит заявку, которую можно передать администратору.</p>
          <form id="booking-form">
            <label class="booking-field">Дата посещения <input id="booking-date" type="date" required aria-required="true"></label>
            <div class="booking-two-fields">
              <label class="booking-field">Время <input id="booking-time" type="time" required aria-required="true"></label>
              <label class="booking-field">Гостей
                <select id="booking-guests" required aria-required="true">
                  <option value="1">1 гость</option><option value="2" selected>2 гостя</option>
                  <option value="3">3 гостя</option><option value="4">4 гостя</option>
                  <option value="5">5 гостей</option><option value="6">6 гостей</option>
                  <option value="7">7 гостей</option><option value="8">8 гостей</option>
                </select>
              </label>
            </div>
            <div class="booking-selected" aria-live="polite"><span>ВЫБРАННЫЙ СТОЛ</span><strong id="booking-table-label">Пока не выбран</strong><small id="booking-table-detail">Нажмите на столик на схеме слева</small></div>
            <label class="booking-field">Пожелания <textarea id="booking-notes" rows="3" maxlength="350" placeholder="Например: возле окна, день рождения"></textarea></label>
            <button class="booking-copy" id="booking-copy" type="submit">Скопировать запрос <span aria-hidden="true">↗</span></button>
            <a class="booking-call" href="tel:+79490684888">Позвонить и подтвердить столик <span aria-hidden="true">↗</span></a>
            <div id="booking-feedback" class="booking-feedback" role="status" aria-live="polite" hidden></div>
            <p class="booking-disclaimer">Выбор столика на сайте <strong>не является подтверждённой бронью</strong>. Мы не показываем занятость в реальном времени; подтвердите дату, время и номер стола по телефону.</p>
          </form>
        </div>
      </div>
    </div>
  </section>
'''
html=html.replace(
    '  <section class="contact-section" id="contacts">',
    booking_section + '\n  <section class="contact-section" id="contacts">'
)
html=html.replace('</body>', '  <script src="./booking.js" defer></script>\n</body>')

# The website's fixed bottom bar links to table choice rather than duplicating Contacts.
cart=(SOURCE/'cart.js').read_text(encoding='utf-8')
cart=cart.replace('href="#contacts" class="nav-contacts"', 'href="#tables" class="nav-contacts"')
cart=cart.replace('Контакты</a>\'; document.body.appendChild(nav);','Столик</a>\'; document.body.appendChild(nav);')
(TARGET/'cart.js').write_text(cart,encoding='utf-8')

(TARGET/'index.html').write_text(html,encoding='utf-8')
(TARGET/'.nojekyll').write_text('',encoding='utf-8')
# Basic correctness: site should not accidentally expose Android-only secrets.
assert '<section class="booking-section"' in html
assert 'id="booking-table-label"' in html
assert 'src="./booking.js"' in html
for file in ['index.html','booking.css','booking.js','data/menu.json','data/bar.json','data/news.json',
             'assets/pride-brand.png','photos/menu-042.webp','bar_photos/clover-club.webp']:
    assert (TARGET/file).is_file(),f'Missing deployed asset: {file}'
food=json.loads((TARGET/'data/menu.json').read_text(encoding='utf-8'))
bar=json.loads((TARGET/'data/bar.json').read_text(encoding='utf-8'))
assert len(food)==108,(len(food),'food')
assert len(bar)==108,(len(bar),'bar')
print('Website ready: ',len(food),'kitchen,',len(bar),'bar; 9 demonstrative selectable tables; news synced.')
