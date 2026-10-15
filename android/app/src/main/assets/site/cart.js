(()=>{'use strict';
const STORAGE_KEY='pride.selection.v2';
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cart=Object.create(null);
const OLD_KEY='pride.selection.v1';
let datasets={kitchen:[],bar:[]};
function identity(entry){return [entry.section,entry.item.category,entry.item.title,entry.item.weight||''].join(' ◇ ')}
try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(saved&&typeof saved==='object')for(const [k,v] of Object.entries(saved))if(Number.isInteger(v)&&v>0&&v<100)cart[k]=v}catch(e){}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cart))}catch(e){}}
// Migrate favourites saved by the old Android version; don't discard previous choices.
try{
 const old=JSON.parse(localStorage.getItem(OLD_KEY)||'{}');
 for(const [key,n] of Object.entries(old)) {
   const k='k ◇ '+key;
   if(Number.isInteger(n)&&n>0&&n<100&&!cart[k])cart[k]=n;
 }
 save();
}catch(e){}
function priceValue(item){return /^\d+$/.test(String(item.price||'').trim())?Number(item.price):null;}
function allEntries(){return [{section:'k',items:datasets.kitchen},{section:'b',items:datasets.bar}].flatMap(group=>group.items.map((item,index)=>({section:group.section,index,item})));}
function selected(){return allEntries().map(entry=>({...entry,quantity:cart[identity(entry)]||0})).filter(x=>x.quantity>0)}
function totals(){const lines=selected(),count=lines.reduce((a,l)=>a+l.quantity,0),sum=lines.reduce((a,l)=>a+(priceValue(l.item)||0)*l.quantity,0),unknown=lines.some(l=>priceValue(l.item)===null);return {lines,count,sum,unknown}}
const topButton=document.createElement('button'); topButton.type='button'; topButton.id='cart-open-top'; topButton.className='cart-open-top'; topButton.setAttribute('aria-label','Открыть корзину'); topButton.innerHTML='♡ <span>Корзина</span>'; document.querySelector('.header-inner').appendChild(topButton);
const nav=document.createElement('nav'); nav.className='app-bottom-nav'; nav.setAttribute('aria-label','Навигация по приложению'); nav.innerHTML='<a href="#menu" data-pride-tab-link="kitchen" class="nav-menu"><span aria-hidden="true">☰</span>Меню</a><a href="#menu" data-pride-tab-link="bar" class="nav-bar"><span aria-hidden="true">🥂</span>Бар</a><a href="#menu" data-pride-tab-link="news" class="nav-news"><span aria-hidden="true">✦</span>Новости</a><button type="button" class="nav-cart" data-open-cart><span aria-hidden="true">🛒</span>Корзина <b id="cart-count">0</b></button><a href="#contacts" class="nav-contacts"><span aria-hidden="true">☎</span>Контакты</a>'; document.body.appendChild(nav);
const backdrop=document.createElement('div'); backdrop.id='cart-backdrop'; backdrop.hidden=true; document.body.appendChild(backdrop);
const drawer=document.createElement('aside'); drawer.id='cart-drawer'; drawer.hidden=true; drawer.tabIndex=-1; drawer.setAttribute('role','dialog'); drawer.setAttribute('aria-modal','true'); drawer.setAttribute('aria-label','Корзина'); drawer.innerHTML='<header class="cart-header"><div class="cart-brandline"><img src="./assets/pride-brand.png" alt="Логотип Прайд"><div><span class="eyebrow">КАФЕ «ПРАЙД»</span><h2>Корзина</h2><p>Сохранённые блюда и напитки</p></div></div><button type="button" data-close-cart class="cart-close" aria-label="Закрыть корзину">✕</button></header><div class="cart-list" id="cart-list"></div><footer class="cart-footer"><div class="cart-total"><span>Предварительная сумма</span><b id="cart-total">0 ₽</b></div><p id="cart-note"></p><button class="cart-clear" type="button" id="cart-clear">Очистить корзину</button><p class="cart-disclaimer">Корзина сохраняет ваш выбор в приложении. Фото ознакомительные, состав и подача могут отличаться.</p></footer>'; document.body.appendChild(drawer);
let opened=false,previousFocus=null;
function renderButtons(){
  const total=totals();
  $('cart-count').textContent=String(total.count);
  topButton.innerHTML='🛒 <span>Корзина: '+total.count+'</span>';
  document.querySelectorAll('.dish[data-item-id]').forEach(node=>{
    const [section,idStr]=String(node.dataset.itemId).split('-');
    const item=(section==='k'?datasets.kitchen:datasets.bar)[Number(idStr)]; if(!item) return;
    let btn=node.querySelector('.cart-add');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='cart-add';node.appendChild(btn);} 
    btn.dataset.addItem=node.dataset.itemId;
    const qty=cart[[section,item.category,item.title,item.weight||''].join(' ◇ ')]||0;
    btn.textContent=qty?'✓ В корзине: '+qty+' · Добавить ещё':'＋ Добавить в корзину';
    btn.classList.toggle('added',qty>0);
  });
  if(opened) renderCart();
}
function renderCart(){
  const total=totals();
  $('cart-list').innerHTML=total.lines.length?total.lines.map(entry=>{const item=entry.item;const pid=entry.section+'-'+entry.index;const thumb=window.PridePhoto?window.PridePhoto.thumb(item):'';const price=item.price?safe(item.price)+' ₽':'Цена уточняется'; return '<article class="cart-line">'+thumb+'<div class="cart-line-content"><span class="cart-category">'+safe(entry.section==='k'?'Кухня · ':'Бар · ')+safe(item.category)+'</span><h3>'+safe(item.title)+'</h3><p>'+safe(item.weight||'')+'</p><strong>'+price+'</strong></div><div class="cart-line-actions"><div class="quantity"><button type="button" data-cart-minus="'+pid+'">−</button><span>'+entry.quantity+'</span><button type="button" data-cart-plus="'+pid+'">+</button></div><button type="button" class="remove-item" data-cart-remove="'+pid+'">Удалить</button></div></article>';}).join(''):'<div class="cart-empty"><span aria-hidden="true">🛒</span><h3>Корзина пока пустая</h3><p>Добавляйте понравившиеся блюда и напитки из меню кухни и бара.</p><button type="button" data-close-cart class="btn btn-primary">Вернуться к меню</button></div>';
  $('cart-total').textContent=total.sum.toLocaleString('ru-RU')+' ₽';
  $('cart-note').textContent=total.unknown?'В сумму не включены позиции с неуказанной ценой.':'Сумма ориентировочная — актуальную стоимость уточняйте в кафе.';
  $('cart-clear').hidden=!total.lines.length;
}
function change(itemId, delta, remove){
  const [section,idxStr]=String(itemId).split('-'); const idx=Number(idxStr); const item=(section==='k'?datasets.kitchen:datasets.bar)[idx]; if(!item)return;
  const key=[section,item.category,item.title,item.weight||''].join(' ◇ '); const next=remove?0:Math.max(0,Math.min(99,(cart[key]||0)+delta));
  if(next===0) delete cart[key]; else cart[key]=next; save(); renderButtons();
}
function openCart(){previousFocus=document.activeElement; opened=true; backdrop.hidden=false; drawer.hidden=false; document.body.classList.add('cart-is-open'); renderCart(); drawer.focus();}
function closeCart(){if(!opened)return false; opened=false; backdrop.hidden=true; drawer.hidden=true; document.body.classList.remove('cart-is-open'); if(previousFocus&&previousFocus.focus) previousFocus.focus(); return true;}
function wire(){
  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-item]'); if(add){change(add.dataset.addItem,1,false);return;}
    const plus=e.target.closest('[data-cart-plus]'); if(plus){change(plus.dataset.cartPlus,1,false);return;}
    const minus=e.target.closest('[data-cart-minus]'); if(minus){change(minus.dataset.cartMinus,-1,false);return;}
    const rm=e.target.closest('[data-cart-remove]'); if(rm){change(rm.dataset.cartRemove,0,true);return;}
    const open=e.target.closest('[data-open-cart],#cart-open-top'); if(open){openCart();return;}
    const close=e.target.closest('[data-close-cart]'); if(close){closeCart();return;}
    const tab=e.target.closest('[data-pride-tab-link]'); if(tab){e.preventDefault(); if(window.PrideApp&&window.PrideApp.showTab) window.PrideApp.showTab(tab.dataset.prideTabLink); document.getElementById('menu').scrollIntoView({behavior:'smooth'}); return;}
  });
  backdrop.addEventListener('click',closeCart);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});
  $('cart-clear').addEventListener('click',()=>{if(!confirm('Очистить всю корзину?'))return; Object.keys(cart).forEach(k=>delete cart[k]); save(); renderButtons();});
  document.addEventListener('pride:render',renderButtons);
}
function sync(){
  if(window.PrideData){datasets=window.PrideData;renderButtons();}
}
window.PrideCart={openCart,closeCart,refresh:sync};
window.PrideApp=window.PrideApp||{};
window.PrideApp.closeCartIfOpen=closeCart;
wire(); sync();
document.addEventListener('pride:render',sync);
document.addEventListener('pride:tabchange',sync);

})();