(()=>{
'use strict';
const CHANNEL='https://t.me/cafe_Pride_Volna';
const REMOTE='https://raw.githubusercontent.com/WarfWar/Site_pride/main/data/news.json';
const CACHE='pride.telegram.news.v1';
let loading=false;
const $=id=>document.getElementById(id);
function escapeHTML(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function valid(obj){return obj&&Array.isArray(obj.posts)&&obj.posts.every(p=>Number.isInteger(p.id)&&p.id>0&&typeof p.text==='string');}
function dateLabel(s){if(!s)return '';const d=new Date(s);return isNaN(d.getTime())?'':d.toLocaleString('ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function render(data,source){
 const list=$('news-items');if(!list)return;
 if(!valid(data)||!data.posts.length){list.innerHTML='<div class="news-empty"><h4>Публикации ещё не загружены</h4><p>Перейдите в официальный канал, пока лента обновляется.</p></div>';$('news-status').textContent='Нет сохранённых публикаций';return;}
 const items=data.posts.slice(0,24).filter(p=>p.text);
 list.innerHTML=items.map(p=>{
   const u=CHANNEL+'/'+p.id;
   const title=escapeHTML(p.title||String(p.text).split('\n')[0]||'Новость кафе');
   const body=escapeHTML(p.text);
   const date=dateLabel(p.date);
   return '<article class="news-card"><span class="news-date">'+escapeHTML(date)+'</span><h4>'+title+'</h4><p>'+body+'</p><a href="'+u+'" target="_blank" rel="noopener noreferrer">Читать в Telegram ↗</a></article>';
 }).join('');
 $('news-status').textContent=(source==='live'?'Новости обновлены':'Сохранённые публикации')+' · '+items.length;
}
async function localLoad(){
 try{const cached=JSON.parse(localStorage.getItem(CACHE)||'null');if(valid(cached)&&cached.posts.length){render(cached,'cached');return;}}catch(e){}
 try{const r=await fetch('./data/news.json');if(!r.ok)return;const data=await r.json();if(valid(data))render(data,'bundled');}catch(e){}
}
async function refresh(){
 if(loading)return;loading=true;
 $('news-status').textContent='Проверяем Telegram…';
 try{
   const ctrl=new AbortController();
   const response=await fetch(REMOTE+'?v='+Date.now(),{cache:'no-store',signal:ctrl.signal});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();if(!valid(data)||!data.posts.length)throw Error('Empty feed');
   render(data,'live');
   try{localStorage.setItem(CACHE,JSON.stringify(data));}catch(e){}
 }catch(e){
   const hasCached=!!$('news-items').querySelector('.news-card');
   $('news-status').textContent=hasCached?'Нет сети · показаны сохранённые новости':'Не удалось получить публикации';
   if(!hasCached)$('news-items').innerHTML='<div class="news-empty"><h4>Новости временно недоступны</h4><p>Проверьте интернет или откройте официальный Telegram-канал.</p></div>';
 }finally{loading=false}
}
const btn=$('refresh-news');if(btn)btn.addEventListener('click',refresh);
localLoad().then(refresh);
document.addEventListener('pride:tabchange',ev=>{if(ev.detail.tab==='news')refresh()});
})();