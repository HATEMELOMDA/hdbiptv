(function(){
'use strict';
var selected=null;
function q(s){return document.querySelector(s)}function qa(s){return[].slice.call(document.querySelectorAll(s))}
function room(){try{return localStorage.getItem('hdb_room')||'1201'}catch(e){return'1201'}}
function saveRequest(item){var requests=[];try{requests=JSON.parse(localStorage.getItem('hdb_requests')||'[]')}catch(e){}requests.unshift(item);try{localStorage.setItem('hdb_requests',JSON.stringify(requests.slice(0,20)))}catch(e){}}
function renderActive(item){var list=q('#request-list');if(!list)return;list.innerHTML='<div class="request-item"><span>'+item.name+'</span><strong>تم الإرسال</strong></div><div class="request-item"><span>القسم</span><strong>'+item.department+'</strong></div><div class="request-item"><span>الوقت المتوقع</span><strong>'+item.eta+'</strong></div>'}
function choose(card){qa('.catalog-card').forEach(function(x){x.classList.remove('focused')});card.classList.add('focused');selected={id:'REQ-'+Date.now(),name:card.getAttribute('data-request'),department:card.getAttribute('data-department')||'Front Office',eta:card.getAttribute('data-eta'),room:room(),status:'new',created_at:new Date().toISOString()};var button=q('#send-request');if(button){button.disabled=false;button.textContent='إرسال: '+selected.name}}
function boot(){var r=q('#service-room');if(r)r.textContent=room();qa('.catalog-card').forEach(function(card){card.addEventListener('click',function(){choose(card)});card.addEventListener('keydown',function(e){if((e.keyCode||e.which)===13)choose(card)})});var send=q('#send-request');if(send)send.addEventListener('click',function(){if(!selected)return;saveRequest(selected);document.dispatchEvent(new CustomEvent('hdb:service-request',{detail:{service:selected.name,details:'Department: '+selected.department+'; ETA: '+selected.eta}}));renderActive(selected);send.textContent='تم إرسال الطلب';send.disabled=true;selected=null})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()
})();
