(()=>{
  'use strict';
  const STORAGE_KEY='pride.selection.v1';
  const $=id=>document.getElementById(id);
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cart=Object.create(null);
  let menu=[];
  function identity(item){return [item.category,item.title,item.weight||''].join(' ◇ ');}
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
      for(const [key,val] of Object.entries(saved)){
        if(Number.isInteger(val)&&val>0&&val<=99)cart[key]=val;
      }
    }
  } catch(e){console.warn('Saved selection unavailable',e);}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cart))}catch(e){console.warn('Cannot save selection',e)}}
  function priceValue(item){return /^\d+$/.test(String(item.price||'').trim())?Number(item.price):null;}
  function selected(){
    return menu.map((item,id)=>({item,id,quantity:cart[identity(item)]||0})).filter(p=>p.quantity>0);
  }
  function totals(){
    const lines=selected(),count=lines.reduce((a,l)=>a+l.quantity,0);
    const sum=lines.reduce((a,l)=>a+(priceValue(l.item)||0)*l.quantity,0);
    const unknown=lines.some(l=>priceValue(l.item)===null);
    return {count,sum,unknown,lines};
  }
  const topButton=document.createElement('button');
  topButton.type='button';topButton.id='cart-open-top';topButton.className='cart-open-top';topButton.setAttribute('aria-label','Открыть корзину');
  document.querySelector('.header-inner').appendChild(topButton);
  const nav=document.createElement('nav');
  nav.className='app-bottom-nav';nav.setAttribute('aria-label','Навигация по приложению');
  nav.innerHTML='<a href="#menu" data-pride-tab="kitchen" class="nav-menu"><span aria-hidden="true">☰</span>Меню</a><a href="#menu" data-pride-tab="news" class="nav-news"><span aria-hidden="true">✦</span>Новости</a><button type="button" class="nav-cart" data-open-cart><span aria-hidden="true">♡</span>Мой выбор <b id="cart-count">0</b></button><a href="#contacts" class="nav-contacts"><span aria-hidden="true">☎</span>Контакты</a>';
  document.body.appendChild(nav);
  const backdrop=document.createElement('div');backdrop.id='cart-backdrop';backdrop.hidden=true;document.body.appendChild(backdrop);
  const drawer=document.createElement('aside');drawer.id='cart-drawer';drawer.hidden=true;drawer.tabIndex=-1;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Сохранённые блюда');
  drawer.innerHTML='<header class="cart-header"><div class="cart-brand"><img src="./assets/pride-original-logo.png" width="54" height="54" alt="Прайд"><div><span class="eyebrow">КАФЕ «ПРАЙД»</span><h2>Мой выбор</h2><p>Здесь всё, что вам понравилось</p></div></div><button type="button" data-close-cart class="cart-close" aria-label="Закрыть корзину">✕</button></header><div class="cart-list" id="cart-list"></div><footer class="cart-footer"><div class="cart-total"><span>Предварительная сумма</span><b id="cart-total">0 ₽</b></div><p id="cart-note"></p><button class="cart-clear" type="button" id="cart-clear">Очистить список</button><p class="cart-disclaimer">Фото из меню ознакомительные — подача может отличаться. Это список выбранного, не оформленный заказ.</p></footer>';
  document.body.appendChild(drawer);
  let opened=false,previousFocus=null;
  function updateButtons(){
    const t=totals();
    topButton.innerHTML='♡ <span>Выбрано: '+t.count+'</span>';
    $('cart-count').textContent=String(t.count);
    for(const node of document.querySelectorAll('.dish[data-item-id]')){
      const id=Number(node.dataset.itemId),item=menu[id];if(!item)continue;
      let button=node.querySelector('.cart-add');
      if(!button){button=document.createElement('button');button.type='button';button.className='cart-add';button.dataset.addItem=String(id);node.appendChild(button);}
      const qty=cart[identity(item)]||0;
      button.textContent=qty?'✓ В списке: '+qty+' · Добавить ещё':'＋ Добавить в мой выбор';
      button.classList.toggle('added',qty>0);
      button.setAttribute('aria-label',(qty?'Добавить ещё: ':'Добавить в корзину: ')+item.title);
    }
    if(opened)renderCart();
  }
  function renderCart(){
    const t=totals();
    $('cart-list').innerHTML=t.lines.length?t.lines.map(({item,id,quantity})=>{
      const price=item.price?safe(item.price)+' ₽':'Цена уточняется';
      return '<article class="cart-line">'+(window.PrideDishPhoto?window.PrideDishPhoto.imageHTML(item,'cart-thumb',false):'')+'<div class="cart-line-content">'<span class="cart-category">'+safe(item.category)+'</span><h3>'+safe(item.title)+'</h3><p>'+safe(item.weight)+'</p><strong>'+price+'</strong></div><div class="cart-line-actions"><div class="quantity"><button type="button" data-cart-minus="'+id+'" aria-label="Уменьшить количество '+safe(item.title)+'">−</button><span>'+quantity+'</span><button type="button" data-cart-plus="'+id+'" aria-label="Увеличить количество '+safe(item.title)+'">+</button></div><button type="button" class="remove-item" data-cart-remove="'+id+'">Удалить</button></div></article>';
    }).join(''):'<div class="cart-empty"><span aria-hidden="true">♡</span><h3>Пока ничего не выбрано</h3><p>Добавляйте понравившиеся блюда из меню. Они останутся здесь после закрытия приложения.</p><button type="button" data-close-cart class="btn btn-primary">Вернуться в меню</button></div>';
    $('cart-total').textContent=t.sum.toLocaleString('ru-RU')+' ₽';
    $('cart-note').textContent=t.unknown?'В сумму не включены позиции с неуказанной или вариативной ценой.':'Сумма ориентировочная — актуальную стоимость уточняйте в кафе.';
    $('cart-clear').hidden=!t.lines.length;
  }
  function openCart(){
    previousFocus=document.activeElement;
    opened=true;backdrop.hidden=false;drawer.hidden=false;
    document.body.classList.add('cart-is-open');renderCart();drawer.focus();
  }
  function closeCart(){
    if(!opened)return false;
    opened=false;backdrop.hidden=true;drawer.hidden=true;
    document.body.classList.remove('cart-is-open');
    if(previousFocus&&previousFocus.focus)previousFocus.focus();
    return true;
  }
  function change(id,delta,remove=false){
    const item=menu[id];if(!item)return;
    const key=identity(item);const n=remove?0:Math.max(0,Math.min(99,(cart[key]||0)+delta));
    if(n===0)delete cart[key];else cart[key]=n;
    save();updateButtons();
  }
  document.addEventListener('click',event=>{
    const add=event.target.closest('[data-add-item]');if(add){change(Number(add.dataset.addItem),1);return;}
    const plus=event.target.closest('[data-cart-plus]');if(plus){change(Number(plus.dataset.cartPlus),1);return;}
    const minus=event.target.closest('[data-cart-minus]');if(minus){change(Number(minus.dataset.cartMinus),-1);return;}
    const remove=event.target.closest('[data-cart-remove]');if(remove){change(Number(remove.dataset.cartRemove),0,true);return;}
    if(event.target.closest('[data-open-cart]')||event.target.closest('#cart-open-top')){openCart();return;}
    if(event.target.closest('[data-close-cart]')){closeCart();return;}
  });
  backdrop.addEventListener('click',closeCart);
  $('cart-clear').addEventListener('click',()=>{if(!confirm('Очистить весь список выбранных блюд?'))return;for(const k of Object.keys(cart))delete cart[k];save();updateButtons()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();closeCart()}});
  document.addEventListener('pride:render',()=>{menu=window.PrideMenu||[];updateButtons()});
  window.PrideApp={closeCartIfOpen:closeCart,openCart};
  menu=window.PrideMenu||[];updateButtons();
})();