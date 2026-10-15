(()=>{'use strict';
const state={category:'Все категории',query:'',tab:'kitchen'};
const $=id=>document.getElementById(id);
const safe=s=>String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let items=[];
async function init(){
 try{const response=await fetch('./data/menu.json');if(!response.ok)throw Error('HTTP '+response.status);items=await response.json();window.PrideMenu=items;}
 catch(err){$('dishes').innerHTML='<p>Не удалось загрузить меню. Перезагрузите страницу или позвоните в кафе.</p>';console.error('Menu load error:',err);return}
 $('total-count').textContent=items.length;
 const cats=['Все категории',...new Set(items.map(i=>i.category))]; $('categories').innerHTML=cats.map(cat=>'<button type="button" data-cat="'+safe(cat)+'">'+safe(cat)+'</button>').join('');
 $('categories').addEventListener('click',e=>{const btn=e.target.closest('[data-cat]');if(!btn)return;state.category=btn.dataset.cat;render()});
 $('search').addEventListener('input',e=>{state.query=e.target.value.trim().toLocaleLowerCase('ru');render()});
 $('clear').addEventListener('click',()=>{state.query='';state.category='Все категории';$('search').value='';render()});
 document.querySelectorAll('[data-feature]').forEach(a=>a.addEventListener('click',()=>{showTab('kitchen');state.category=a.dataset.feature;state.query='';$('search').value='';render()}));
 $('tab-kitchen').addEventListener('click',()=>showTab('kitchen'));
 $('tab-bar').addEventListener('click',()=>showTab('bar'));
 render();
}
function showTab(which){state.tab=which;for(const k of ['kitchen','bar']){$(k).hidden=k!==which;$('tab-'+k).classList.toggle('selected',k===which);$('tab-'+k).setAttribute('aria-selected',String(k===which))}}
function render(){
 const filtered=items.map((item,_id)=>({...item,_id})).filter(i=>(state.category==='Все категории'||i.category===state.category)&&(!state.query||[i.title,i.description,i.category,i.weight].join(' ').toLocaleLowerCase('ru').includes(state.query)));
 document.querySelectorAll('[data-cat]').forEach(b=>{const active=b.dataset.cat===state.category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('clear').hidden=state.category==='Все категории'&&!state.query;
 $('results').textContent='Найдено позиций: '+filtered.length;
 $('dishes').innerHTML=filtered.length?filtered.map(i=>'<article class="dish" data-item-id="'+i._id+'"><div><p class="category">'+safe(i.category)+'</p><h3>'+safe(i.title)+(i.weight?'<span class="weight">'+safe(i.weight)+'</span>':'')+'</h3>'+(i.description?'<p class="description">'+safe(i.description)+'</p>':'')+'</div><span class="price'+(!i.price?' missing':'')+'">'+(i.price?safe(i.price)+' ₽':'Уточнить')+'</span></article>').join(''):'<p>Ничего не найдено. Попробуйте изменить запрос или категорию.</p>';
 document.dispatchEvent(new Event('pride:render'));
}
$('year').textContent=String(new Date().getFullYear());
init();
})();