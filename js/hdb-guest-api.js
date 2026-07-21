(function(){
'use strict';
var API='api/v2/index.php';
var TOKEN='change-me-production-token';
function byId(id){return document.getElementById(id)}
function request(resource,options){options=options||{};return fetch(API+'?resource='+encodeURIComponent(resource)+(options.id?'&id='+encodeURIComponent(options.id):''),{method:options.method||'GET',headers:{'Content-Type':'application/json','X-HDB-Token':TOKEN,'X-HDB-User':'guest-tv'},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(String(r.status));return r.json()})}
function roomNumber(){var q=new URLSearchParams(location.search).get('room');if(q){try{localStorage.setItem('hdb_room',q)}catch(e){}return q}try{return localStorage.getItem('hdb_room')||'1201'}catch(e){return'1201'}}
function setText(ids,value){ids.forEach(function(id){var el=byId(id);if(el)el.textContent=value})}
function hydrate(){
 var room=roomNumber();setText(['room-number','room-number-copy','menu-room','service-room','bill-room','checkout-room'],room);
 Promise.all([request('experience'),request('rooms')]).then(function(results){
  var exp=results[0].data||{},rooms=results[1].data||[];var found=rooms.filter(function(x){return String(x.number)===String(room)})[0]||{};
  if(exp.welcome_ar)setText(['welcome-title'],exp.welcome_ar);
  if(exp.subtitle_ar)setText(['welcome-subtitle'],exp.subtitle_ar);
  if(exp.accent){document.documentElement.style.setProperty('--gold',exp.accent);document.documentElement.style.setProperty('--gold2',exp.accent)}
  if(found.guest&&found.guest!=='—'){setText(['guest-name','menu-guest'],found.guest);try{localStorage.setItem('hdb_guest',found.guest)}catch(e){}}
 }).catch(function(){return null});
}
function postGuestRequest(service,details){return request('requests',{method:'POST',body:{service:service,room:roomNumber(),guest:(byId('guest-name')||{}).textContent||'Guest',department:'Front Office',priority:'normal',status:'new',created:new Date().toLocaleTimeString(),sla:'15 min',details:details||''}})}
function bind(){
 document.addEventListener('hdb:service-request',function(e){postGuestRequest(e.detail.service,e.detail.details).catch(function(){})});
 var checkout=byId('confirm-checkout');if(checkout)checkout.addEventListener('click',function(){checkout.disabled=true;checkout.textContent='جاري إرسال الطلب...';postGuestRequest('Express checkout','Guest requested express checkout').then(function(){checkout.textContent='تم إرسال طلب المغادرة';}).catch(function(){checkout.disabled=false;checkout.textContent='إعادة المحاولة'})});
 var cast=byId('start-casting');if(cast)cast.addEventListener('click',function(){var code=String(Math.floor(100000+Math.random()*900000));setText(['casting-code'],code);var panel=byId('casting-ready');if(panel)panel.classList.add('visible')});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){hydrate();bind()});else{hydrate();bind()}
})();
