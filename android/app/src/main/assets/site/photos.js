(()=>{
'use strict';
/* Bundled photos are illustrative, not pictures of actual Pride Cafe servings. */
const defaults={'Холодные закуски':'cold_board','Горячие закуски':'grilled_meat','Первые блюда':'soup','Салаты':'salad','Стейки':'steak','Рыба':'fish','Лапша и паста':'noodles','Бургеры':'burger','Пицца':'pizza','Роллы':'rolls','Сеты':'rolls_alt','Гарниры':'fries','Хлеб':'bread','Соусы':'grilled_meat','Десерты':'dessert'};
function keyFor(item){
 const t=String(item.title||'').toLowerCase(),c=String(item.category||'');
 if(/кревет|морепродукт|том ям|кальмар|мидии/.test(t)&&!['Роллы','Сеты'].includes(c))return 'shrimp';
 if(/лосос|судак|сельдь/.test(t)&&!['Роллы','Сеты'].includes(c))return 'fish';
 if(/шоколад|тирамис|фондан|брауни|какао/.test(t))return 'chocolate';
 if(/торт|чизкейк|меренг|наполеон|штрудель|сырники/.test(t))return 'dessert';
 if(/фри|картофел/.test(t)&&c==='Гарниры')return 'fries';
 if(/рис|овощи/.test(t)&&c==='Гарниры')return 'vegetables';
 if(/сырн|сырное|антипасто/.test(t)&&c==='Холодные закуски')return 'cheese_board';
 if(/овощ|разносол|фрукт/.test(t)&&c==='Холодные закуски')return 'vegetables';
 if(/тартар|деликатес|карпаччо/.test(t)&&c==='Холодные закуски')return 'cold_board';
 if(/цезарь|курин|печен/.test(t)&&c==='Салаты')return 'salad_chicken';
 if(/спагетти|паст[аыу]|карбонара/.test(t))return 'pasta';
 if(/удон|лапша/.test(t))return 'noodles';
 if(/гренки|фокачч|булочк|хлеб/.test(t))return 'bread';
 if(/дракон|филадельфия/.test(t)&&['Роллы','Сеты'].includes(c))return 'rolls_alt';
 if(/чоризо|мясная|пепперони/.test(t)&&c==='Пицца')return 'pizza';
 if(/крылья|наггет|шашлык/.test(t))return 'grilled_meat';
 if(/дабл|говядина/.test(t)&&c==='Бургеры')return 'burger_alt';
 return defaults[c]||'burger';
}
function asset(item){return item.image || './photos/'+keyFor(item)+'.jpg'}
function fallback(item){if(item.category==='Пицца')return './assets/pizza.svg';if(['Роллы','Сеты'].includes(item.category))return './assets/rolls.svg';if(item.category==='Бургеры')return './assets/burger.svg';return './assets/hero.svg'}
function imageHTML(item,className,lazy){
 const label=String(item.title||'блюда').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return '<img class="'+className+'" data-fallback="'+fallback(item)+'" src="'+asset(item)+'" loading="'+(lazy?'lazy':'eager')+'" alt="Фото блюда из меню Прайд: '+label+'" decoding="async">';
}
function decorate(){
 const items=window.PrideMenu||[];
 for(const card of document.querySelectorAll('.dish[data-item-id]')){
   if(card.querySelector('.dish-photo'))continue;
   const item=items[Number(card.dataset.itemId)];if(!item)continue;
   const photo=document.createElement('figure');photo.className='dish-photo';
   photo.innerHTML=imageHTML(item,'dish-image',true)+'<figcaption>Фото из меню Прайд</figcaption>';
   card.insertBefore(photo,card.firstChild);
 }
}
document.addEventListener('error',e=>{
 const im=e.target;
 if(!(im instanceof HTMLImageElement)||!im.hasAttribute('data-fallback'))return;
 const fallbackSrc=im.getAttribute('data-fallback');im.removeAttribute('data-fallback');
 if(fallbackSrc&&im.getAttribute('src')!==fallbackSrc)im.src=fallbackSrc;
},true);
document.addEventListener('pride:render',decorate);
window.PrideDishPhoto={keyFor,asset,fallback,imageHTML,decorate};
decorate();
})();