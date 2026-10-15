(()=>{'use strict';
const LOGO='./assets/pride-brand.png';
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fallback(item){if(item.category==='Пицца')return './assets/pizza.svg';if(['Роллы','Сеты'].includes(item.category))return './assets/rolls.svg';if(item.category==='Бургеры')return './assets/burger.svg';if(item.image&&item.image.includes('./bar_photos/'))return item.image;return './assets/hero.svg';}
function asset(item){return item.image || fallback(item);}
function photoBox(item,imgClass,lazy,compact){
 const label=escapeHtml(item.title||'блюда');
 return '<div class="photo-shell'+(compact?' compact':'')+'">'+
        '<img class="'+imgClass+'" data-fallback="'+fallback(item)+'" src="'+asset(item)+'" loading="'+(lazy?'lazy':'eager')+'" alt="Фото позиции меню Прайд: '+label+'" decoding="async">'+
        '<div class="photo-ribbon'+(compact?' compact':'')+'">ОЗНАКОМИТЕЛЬНОЕ ФОТО</div>'+
        '<div class="photo-disclaimer'+(compact?' compact':'')+'"><img src="'+LOGO+'" alt="" aria-hidden="true"><span>Может отличаться<br>от готовой подачи</span></div>'+
        '</div>';
}
function decorate(){
  const data=window.PrideData||{};
  document.querySelectorAll('.dish[data-item-id]').forEach(card=>{
    if(card.querySelector('.dish-photo'))return;
    const [prefix,idxStr]=String(card.dataset.itemId).split('-');
    const idx=Number(idxStr);
    const item=(prefix==='k'?data.kitchen:data.bar)?.[idx];
    if(!item)return;
    const figure=document.createElement('figure');
    figure.className='dish-photo';
    figure.innerHTML=photoBox(item,'dish-image',true,false)+'<figcaption>Ознакомительное фото</figcaption>';
    card.insertBefore(figure,card.firstChild);
  });
}
document.addEventListener('error',e=>{
 const im=e.target;
 if(!(im instanceof HTMLImageElement)||!im.hasAttribute('data-fallback'))return;
 const fb=im.getAttribute('data-fallback'); im.removeAttribute('data-fallback');
 if(fb && im.getAttribute('src')!==fb) im.src=fb;
},true);
document.addEventListener('pride:render',decorate);
window.PridePhoto={thumb:(item)=>photoBox(item,'cart-thumb',false,true),decorate};
})();