(()=>{'use strict';
const floor=document.getElementById('booking-floor');
const form=document.getElementById('booking-form');
if(!floor||!form)return;
const byId=id=>document.getElementById(id);
const dateInput=byId('booking-date'),timeInput=byId('booking-time');
const guestInput=byId('booking-guests'),notesInput=byId('booking-notes');
const feedback=byId('booking-feedback');
const tableLabel=byId('booking-table-label'),detail=byId('booking-table-detail');
const buttons=Array.from(floor.querySelectorAll('.floor-table'));
let selected=null;
const localDate=()=>{
 const d=new Date();
 const p=n=>String(n).padStart(2,'0');
 return [d.getFullYear(),p(d.getMonth()+1),p(d.getDate())].join('-');
};
dateInput.min=localDate();
const today=localDate();
try{
 const saved=JSON.parse(sessionStorage.getItem('pride.booking.draft.v1')||'null');
 if(saved && typeof saved==='object' && !Array.isArray(saved)){
  if(typeof saved.date==='string'&&saved.date>=today)dateInput.value=saved.date;
  if(typeof saved.time==='string'&&/^\d\d:\d\d$/.test(saved.time))timeInput.value=saved.time;
  if(Number.isInteger(saved.guests)&&saved.guests>=1&&saved.guests<=8)guestInput.value=String(saved.guests);
  if(typeof saved.table==='string')selected=saved.table;
  if(typeof saved.notes==='string')notesInput.value=saved.notes.slice(0,350);
 }
}catch(e){}
if(!dateInput.value)dateInput.value=today;
function save(){
 try{sessionStorage.setItem('pride.booking.draft.v1',JSON.stringify({
  date:dateInput.value,time:timeInput.value,guests:Number(guestInput.value),
  table:selected,notes:notesInput.value.slice(0,350)
 }));}catch(e){}
}
function setFeedback(message,isError=false,raw=''){
 feedback.hidden=false;
 feedback.classList.toggle('is-error',isError);
 feedback.textContent=message;
 if(raw){
  const el=document.createElement('textarea');el.readOnly=true;el.value=raw;
  el.setAttribute('aria-label','Текст запроса на бронирование');feedback.appendChild(el);
 }
}
function update(){
 const guests=Number(guestInput.value);
 const exists=buttons.find(b=>b.dataset.table===selected);
 if(exists && Number(exists.dataset.seats)<guests)selected=null;
 for(const button of buttons){
  const fits=Number(button.dataset.seats)>=guests;
  button.disabled=!fits;
  const chosen=selected===button.dataset.table;
  button.classList.toggle('is-selected',chosen);
  button.setAttribute('aria-pressed',String(chosen));
  button.setAttribute('aria-label','Стол №'+button.dataset.table+', '+button.dataset.seats+' мест'+(chosen?', выбран':''));
  button.title=fits?'Предварительно выбрать стол №'+button.dataset.table:'Этот стол слишком мал для вашей компании';
 }
 const chosen=buttons.find(b=>b.dataset.table===selected);
 tableLabel.textContent=chosen?'Столик №'+chosen.dataset.table:'Пока не выбран';
 detail.textContent=chosen?'Рассчитан на '+chosen.dataset.seats+' гостей. Наличие уточняется у администратора.':'Выберите стол на схеме. Занятость не проверяется онлайн.';
 save();
}
floor.addEventListener('click',event=>{
 const button=event.target.closest('button[data-table]');
 if(!button||button.disabled)return;
 selected=selected===button.dataset.table?null:button.dataset.table;
 update();
 feedback.hidden=true;
});
for(const el of [dateInput,timeInput,guestInput,notesInput]){
 el.addEventListener('change',()=>{update();feedback.hidden=true;});
 el.addEventListener('input',save);
}
form.addEventListener('submit',async e=>{
 e.preventDefault();
 dateInput.min=localDate();
 if(!form.reportValidity())return;
 const guests=Number(guestInput.value),date=dateInput.value,time=timeInput.value;
 const table=buttons.find(b=>b.dataset.table===selected && !b.disabled);
 if(!table){setFeedback('Выберите столик на схеме, подходящий по количеству гостей.',true);floor.focus?.();return;}
 if(date<localDate()){setFeedback('Выберите сегодняшнюю или будущую дату.',true);return;}
 const intended=new Date(date+'T'+time+':00');
 if(isNaN(intended.getTime())||intended.getTime()<Date.now()-60000){
  setFeedback('Укажите будущие дату и время посещения.',true);return;
 }
 const value=[
  'Запрос на бронирование — кафе «Прайд»',
  'Стол №'+selected+' ('+table.dataset.seats+' мест)',
  'Дата: '+date.split('-').reverse().join('.'),
  'Время: '+time,
  'Гостей: '+guests,
  notesInput.value.trim()?'Пожелания: '+notesInput.value.trim():'',
  'Прошу подтвердить наличие стола и бронирование. Телефон кафе: +7 (949) 068-48-88'
 ].filter(Boolean).join('\n');
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText){
   await navigator.clipboard.writeText(value);
  }else{
   const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.left='-100vw';
   document.body.appendChild(input);input.select();
   const ok=document.execCommand('copy');input.remove();if(!ok)throw Error('clipboard unavailable');
  }
  setFeedback('Запрос скопирован. Позвоните в кафе для подтверждения бронирования. До подтверждения стол не закреплён за вами.');
 }catch(err){
  setFeedback('Автоматически скопировать не удалось. Выделите текст ниже и передайте его администратору.',true,value);
 }
 save();
});
update();
})();