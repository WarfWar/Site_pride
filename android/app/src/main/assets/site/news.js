(()=>{
'use strict';
const CHANNEL='https://t.me/cafe_Pride_Volna';
const REMOTE='https://raw.githubusercontent.com/WarfWar/Site_pride/main/data/news.json';
const CACHE='pride.telegram.news.v2';
const $=id=>document.getElementById(id);
let loading=false;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function valid(o){return o&&Array.isArray(o.posts)&&o.posts.every(p=>Number.isInteger(p.id)&&p.id>0&&typeof p.text==='string');}
function formatDate(s){const d=new Date(s||'');return isNaN(d.valueOf())?'':d.toLocaleString('ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function photo(p){
 const u=String(p.image||p.image_url||p.photo||(Array.isArray(p.images)?p.images[0]:'')||'');
 if(!u)return '';
 // Never insert javascript:, data:, or unknown URL schemes into the WebView.
 if(u.startsWith('./news_images/'))return u;
 try{const v=new URL(u);if(v.protocol==='https:')return v.href;}catch(e){}
 return '';
}
function card(p){
 const title=esc(p.title||String(p.text).split('\n').find(x=>x.trim())||'Новость кафе');
 const safeText=esc(p.text);
 const u=CHANNEL+'/'+p.id;
 const src=photo(p);
 const crop=String(p.text).length>420||String(p.text).split('\n').length>10;
 return '<article class="news-card'+(crop?' is-collapsible':'')+'" data-post="'+p.id+'">'+
   (src?'<div class="news-image-wrap"><img src="'+esc(src)+'" loading="lazy" decoding="async" alt="Фотография к публикации кафе"></div>':'')+
   '<div class="news-card-inner"><span class="news-date">'+esc(formatDate(p.date))+'</span>'+
   '<h4>'+title+'</h4><p class="news-body">'+safeText+'</p>'+
   '<div class="news-card-actions">'+(crop?'<button type="button" class="news-expand" aria-expanded="false">Показать полностью</button>':'')+
   '<a href="'+u+'" target="_blank" rel="noopener noreferrer">Открыть в Telegram ↗</a></div></div></article>';
}
function render(data,source){
 const box=$('news-items');if(!box)return;
 if(!valid(data)||!data.posts.length){
  box.innerHTML='<div class="news-empty"><h4>Публикации пока не загружены</h4><p>Попробуйте обновить или открыть Telegram-канал.</p></div>';
  $('news-status').textContent='Нет сохранённых публикаций';return;
 }
 const posts=data.posts.filter(p=>p.text).slice(0,24);
 box.innerHTML=posts.map(card).join('');
 $('news-status').textContent=(source==='live'?'Новости обновлены':'Сохранённые публикации')+' · '+posts.length;
}
async function loadLocal(){
 try{
  const cache=localStorage.getItem(CACHE)||localStorage.getItem('pride.telegram.news.v1');
  if(cache){const data=JSON.parse(cache);if(valid(data)&&data.posts.length){render(data,'cached');return;}}
 }catch(e){}
 try{const response=await fetch('./data/news.json');if(response.ok){const data=await response.json();if(valid(data))render(data,'bundled');}}catch(e){}
}
async function refresh(){
 if(loading)return;
 loading=true;$('news-status').textContent='Проверяем Telegram…';
 try{
  const r=await fetch(REMOTE+'?v='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();if(!valid(data)||!data.posts.length)throw Error('Empty feed');
  render(data,'live');
  try{localStorage.setItem(CACHE,JSON.stringify(data));}catch(e){}
 }catch(e){
  const saved=$('news-items').querySelector('.news-card');
  $('news-status').textContent=saved?'Нет сети · показаны сохранённые новости':'Не удалось загрузить новости';
  if(!saved){$('news-items').innerHTML='<div class="news-empty"><h4>Новости временно недоступны</h4><p>Попробуйте ещё раз или перейдите в канал.</p></div>';}
 }finally{loading=false;}
}
$('news-items').addEventListener('click',e=>{
 const button=e.target.closest('.news-expand');if(!button)return;
 const article=button.closest('.news-card');if(!article)return;
 const isExpanded=article.classList.toggle('expanded');
 button.textContent=isExpanded?'Свернуть':'Показать полностью';button.setAttribute('aria-expanded',String(isExpanded));
});
document.addEventListener('error',e=>{
 const img=e.target;
 if(img instanceof HTMLImageElement&&img.closest('.news-image-wrap'))img.closest('.news-image-wrap').remove();
},true);
$('refresh-news').addEventListener('click',refresh);
loadLocal().then(refresh);
document.addEventListener('pride:tabchange',e=>{if(e.detail&&e.detail.tab==='news'&&!$('news-items').querySelector('.news-card'))loadLocal();});
})();