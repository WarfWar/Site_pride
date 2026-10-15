(()=>{'use strict';
const state={kitchen:{category:'Все категории',query:''},bar:{category:'Все категории',query:''},tab:'kitchen'};
const $=id=>document.getElementById(id);
const safe=s=>String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let kitchen=[],bar=[];
function match(item,q){return !q||[item.title,item.description,item.category,item.weight].join(' ').toLocaleLowerCase('ru').includes(q)}
function renderList(items, mountId, emptyText, sectionName){
  const mount=$(mountId);
  mount.innerHTML=items.length?items.map(i=>'<article class="dish" data-item-id="'+i.id+'" data-section="'+sectionName+'"><div><p class="category">'+safe(i.category)+'</p><h3>'+safe(i.title)+(i.weight?'<span class="weight">'+safe(i.weight)+'</span>':'')+'</h3>'+(i.description?'<p class="description">'+safe(i.description)+'</p>':'')+'</div><span class="price'+(!i.price?' missing':'')+'">'+(i.price?safe(i.price)+' ₽':'Уточнить')+'</span></article>').join(''):'<p>'+emptyText+'</p>';
}
function renderCategories(data,targetId,active){
  const cats=['Все категории',...new Set(data.map(i=>i.category))];
  $(targetId).innerHTML=cats.map(cat=>'<button type="button" data-cat="'+safe(cat)+'" '+(cat===active?'class="active" aria-pressed="true"':'aria-pressed="false"')+'>'+safe(cat)+'</button>').join('');
}
function renderKitchen(){
  renderCategories(kitchen,'categories',state.kitchen.category);
  const items=kitchen.map((item,idx)=>({...item,id:'k-'+idx})).filter(i=>(state.kitchen.category==='Все категории'||i.category===state.kitchen.category)&&match(i,state.kitchen.query));
  $('clear').hidden=state.kitchen.category==='Все категории'&&!state.kitchen.query;
  $('results').textContent='Найдено позиций: '+items.length;
  renderList(items,'dishes','Ничего не найдено. Попробуйте изменить запрос или категорию.','kitchen');
}
function renderBar(){
  renderCategories(bar,'bar-categories',state.bar.category);
  const items=bar.map((item,idx)=>({...item,id:'b-'+idx})).filter(i=>(state.bar.category==='Все категории'||i.category===state.bar.category)&&match(i,state.bar.query));
  $('bar-clear').hidden=state.bar.category==='Все категории'&&!state.bar.query;
  $('bar-results').textContent='Найдено напитков: '+items.length;
  renderList(items,'bar-dishes','Ничего не найдено. Попробуйте изменить запрос или категорию.','bar');
}
function showTab(which){
  state.tab=which;
  for(const k of ['kitchen','bar','news']){
    $(k).hidden=k!==which;
    $('tab-'+k).classList.toggle('selected',k===which);
    $('tab-'+k).setAttribute('aria-selected',String(k===which));
  }
  document.dispatchEvent(new CustomEvent('pride:tabchange',{detail:{tab:which}}));
}
function bind(){
  $('categories').addEventListener('click',e=>{const btn=e.target.closest('[data-cat]');if(!btn)return;state.kitchen.category=btn.dataset.cat;renderKitchen();document.dispatchEvent(new Event('pride:render'));});
  $('bar-categories').addEventListener('click',e=>{const btn=e.target.closest('[data-cat]');if(!btn)return;state.bar.category=btn.dataset.cat;renderBar();document.dispatchEvent(new Event('pride:render'));});
  $('search').addEventListener('input',e=>{state.kitchen.query=e.target.value.trim().toLocaleLowerCase('ru');renderKitchen();document.dispatchEvent(new Event('pride:render'));});
  $('bar-search').addEventListener('input',e=>{state.bar.query=e.target.value.trim().toLocaleLowerCase('ru');renderBar();document.dispatchEvent(new Event('pride:render'));});
  $('clear').addEventListener('click',()=>{state.kitchen.query='';state.kitchen.category='Все категории';$('search').value='';renderKitchen();document.dispatchEvent(new Event('pride:render'));});
  $('bar-clear').addEventListener('click',()=>{state.bar.query='';state.bar.category='Все категории';$('bar-search').value='';renderBar();document.dispatchEvent(new Event('pride:render'));});
  document.querySelectorAll('[data-feature]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();state.kitchen.category=a.dataset.feature;showTab('kitchen');renderKitchen();document.dispatchEvent(new Event('pride:render'));document.getElementById('menu').scrollIntoView({behavior:'smooth'})}));
  document.querySelectorAll('[data-pride-tab]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const tab=a.dataset.prideTab;showTab(tab);document.getElementById('menu').scrollIntoView({behavior:'smooth'})}));
  ['kitchen','bar','news'].forEach(tab=>$('tab-'+tab).addEventListener('click',()=>showTab(tab)));
}
window.PrideApp={showTab};
async function init(){
  try{
    const [a,b]=await Promise.all([fetch('./data/menu.json'),fetch('./data/bar.json')]);
    if(!a.ok||!b.ok)throw Error('Не удалось загрузить данные меню');
    kitchen=await a.json();
    bar=await b.json();
    window.PrideData={kitchen,bar};
    $('total-count').textContent=String(kitchen.length+bar.length);
    bind();
    renderKitchen();
    renderBar();
    showTab('kitchen');
    document.dispatchEvent(new Event('pride:render'));
  }catch(err){
    console.error(err);
    $('dishes').innerHTML='<p>Не удалось загрузить меню. Перезагрузите страницу или позвоните в кафе.</p>';
  }
}
$('year').textContent=String(new Date().getFullYear());
init();
})();