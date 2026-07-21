const API='../api.php';
const params=new URLSearchParams(location.search);
const roomNumber=params.get('room')||localStorage.getItem('hdb_room')||'1201';
let deviceCode=params.get('device')||localStorage.getItem('hdb_device');
let context=null;
let language='ar';
let mode='menu';
let focusIndex=0;
let overlayItems=[];
let dialogChoice=0;
let sessionRequests=[];

const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tr=(ar,en)=>language==='ar'?ar:en;

async function api(action,{method='GET',body=null}={}){
  const options={method,headers:{Accept:'application/json'}};
  if(body){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
  const response=await fetch(`${API}?action=${encodeURIComponent(action)}`,options);
  const data=await response.json().catch(()=>({ok:false,error:'Invalid server response'}));
  if(!response.ok||!data.ok)throw new Error(data.error||'Request failed');
  return data;
}

async function start(){
  localStorage.setItem('hdb_room',roomNumber);
  if(!deviceCode){deviceCode=`WEB-${roomNumber}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;localStorage.setItem('hdb_device',deviceCode)}
  try{await api('device-register',{method:'POST',body:{code:deviceCode,room:roomNumber,brand:detectBrand(),model:navigator.userAgent.slice(0,80),app_version:'2.0.0-alpha.1'}})}catch{}
  try{
    context=await api(`tv-context&room=${encodeURIComponent(roomNumber)}&device=${encodeURIComponent(deviceCode)}`);
    language=context.guest?.language||'ar';
    document.documentElement.lang=language;
    document.documentElement.dir=language==='ar'?'rtl':'ltr';
    applyContext();
    bindRemote();
    tickClock();
    setInterval(tickClock,1000);
    setInterval(refreshContext,60000);
  }catch(error){
    $('connectionState').textContent='● '+tr('تعذر الاتصال بالمنصة','Platform unavailable');
    showDialog(tr('تعذر تحميل بيانات الغرفة','Unable to load room data'),error.message,[tr('إعادة المحاولة','Retry')],()=>location.reload());
  }
}

function detectBrand(){const ua=navigator.userAgent.toLowerCase();if(ua.includes('tizen'))return'Samsung';if(ua.includes('webos'))return'LG';return'Browser'}

function applyContext(){
  const {meta,theme,guest,room}=context;
  document.documentElement.style.setProperty('--gold',theme.primary||'#d2b272');
  document.documentElement.style.setProperty('--bg',theme.background||'#081018');
  document.documentElement.style.setProperty('--surface',theme.surface||'#111b25');
  if(theme.hero_image)$('tvShell').style.setProperty('--hero',`url("${theme.hero_image.replace(/"/g,'')}")`);
  $('hotelName').textContent=language==='ar'?meta.hotel_name_ar:meta.hotel_name_en;
  $('roomLabel').textContent=tr(`الغرفة ${room.number}`,`Room ${room.number}`);
  const name=guest?.full_name;
  $('eyebrow').textContent=tr('أهلًا وسهلًا','WELCOME');
  $('welcomeTitle').textContent=name?tr(`مرحبًا ${name}`,`Welcome, ${name}`):(language==='ar'?theme.welcome_ar:theme.welcome_en);
  $('welcomeSubtitle').textContent=tr('نتمنى لكم إقامة سعيدة ومريحة. جميع خدمات الفندق بين يديك.','We wish you a pleasant stay. All hotel services are at your fingertips.');
  document.querySelectorAll('[data-ar]').forEach(el=>el.textContent=language==='ar'?el.dataset.ar:el.dataset.en);
  $('connectionState').textContent='● '+tr('متصل بالمنصة','Connected to platform');
  updateMenuFocus();
}

async function refreshContext(){try{context=await api(`tv-context&room=${encodeURIComponent(roomNumber)}&device=${encodeURIComponent(deviceCode)}`);applyContext()}catch{$('connectionState').textContent='● '+tr('الاتصال غير مستقر','Connection unstable')}}

function tickClock(){const now=new Date();$('tvTime').textContent=now.toLocaleTimeString(language==='ar'?'ar-SA':'en-GB',{hour:'2-digit',minute:'2-digit'});$('tvDate').textContent=now.toLocaleDateString(language==='ar'?'ar-SA':'en-GB',{weekday:'long',day:'numeric',month:'long'})}

function bindRemote(){
  $('closeOverlay').addEventListener('click',closeCurrent);
  document.querySelectorAll('.tv-tile').forEach((tile,index)=>tile.addEventListener('click',()=>{focusIndex=index;openPanel(tile.dataset.panel)}));
  document.addEventListener('keydown',event=>{
    const key=event.key;const code=event.keyCode;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape','Backspace'].includes(key)||[37,38,39,40,13,10009,461].includes(code))event.preventDefault();
    if(mode==='video'){if(key==='Escape'||key==='Backspace'||code===10009||code===461)stopVideo();return}
    if(mode==='dialog'){handleDialogKey(key,code);return}
    if(key==='Escape'||key==='Backspace'||code===10009||code===461){closeCurrent();return}
    if(mode==='menu')handleMenuKey(key,code);else if(mode==='overlay')handleOverlayKey(key,code);
  });
}

function handleMenuKey(key,code){const tiles=[...document.querySelectorAll('.tv-tile')];const cols=window.innerWidth<1180?3:6;if(key==='ArrowLeft'||code===37)focusIndex=(focusIndex+(language==='ar'?1:-1)+tiles.length)%tiles.length;if(key==='ArrowRight'||code===39)focusIndex=(focusIndex+(language==='ar'?-1:1)+tiles.length)%tiles.length;if(key==='ArrowDown'||code===40)focusIndex=Math.min(tiles.length-1,focusIndex+cols);if(key==='ArrowUp'||code===38)focusIndex=Math.max(0,focusIndex-cols);if(key==='Enter'||code===13)openPanel(tiles[focusIndex].dataset.panel);updateMenuFocus()}
function updateMenuFocus(){document.querySelectorAll('.tv-tile').forEach((tile,index)=>tile.classList.toggle('focused',index===focusIndex))}

function handleOverlayKey(key,code){if(!overlayItems.length)return;const cols=window.innerWidth<1180?3:5;if(key==='ArrowLeft'||code===37)focusIndex=(focusIndex+(language==='ar'?1:-1)+overlayItems.length)%overlayItems.length;if(key==='ArrowRight'||code===39)focusIndex=(focusIndex+(language==='ar'?-1:1)+overlayItems.length)%overlayItems.length;if(key==='ArrowDown'||code===40)focusIndex=Math.min(overlayItems.length-1,focusIndex+cols);if(key==='ArrowUp'||code===38)focusIndex=Math.max(0,focusIndex-cols);if(key==='Enter'||code===13)overlayItems[focusIndex]?.click();updateOverlayFocus()}
function updateOverlayFocus(){overlayItems.forEach((item,index)=>item.classList.toggle('focused',index===focusIndex));overlayItems[focusIndex]?.scrollIntoView({block:'nearest',inline:'nearest'})}

function openPanel(panel){
  mode='overlay';focusIndex=0;$('overlay').classList.remove('hidden');
  const handlers={channels:renderChannels,services:()=>renderServices('hotel'),dining:()=>renderServices('dining'),requests:renderRequests,messages:renderMessages,information:renderInformation};
  (handlers[panel]||renderInformation)();
}

function setOverlay(title,kicker,html){$('overlayTitle').textContent=title;$('overlayKicker').textContent=kicker;$('overlayContent').innerHTML=html;overlayItems=[...$('overlayContent').querySelectorAll('[data-focusable]')];overlayItems.forEach((item,index)=>item.addEventListener('mouseenter',()=>{focusIndex=index;updateOverlayFocus()}));updateOverlayFocus()}

function renderChannels(){
  const channels=context.channels||[];
  const html=channels.length?`<div class="tv-grid">${channels.map(channel=>`<button class="tv-item" data-focusable data-channel="${safe(channel.id)}"><span class="channel-number">${safe(channel.number)}</span><span class="channel-name">${safe(language==='ar'?channel.name_ar:channel.name_en)}</span><small>${safe(channel.group||'')}</small></button>`).join('')}</div>`:`<div class="empty-state">${tr('لم تتم إضافة مصادر القنوات بعد','Channel sources have not been added')}</div>`;
  setOverlay(tr('القنوات التلفزيونية','Live Television'),tr('البث المباشر','LIVE TV'),html);
  overlayItems.forEach(item=>item.addEventListener('click',()=>playChannel(channels.find(c=>c.id===item.dataset.channel))));
}

function renderServices(category){
  const services=(context.services||[]).filter(service=>category==='dining'?service.category==='dining':service.category!=='dining');
  const html=services.length?`<div class="tv-grid">${services.map(service=>`<button class="tv-item" data-focusable data-service="${safe(service.id)}"><span class="tile-icon">${serviceIcon(service.icon)}</span><span class="channel-name">${safe(language==='ar'?service.name_ar:service.name_en)}</span><small>${tr('اضغط للطلب','Press to request')}</small></button>`).join('')}</div>`:`<div class="empty-state">${tr('لا توجد خدمات في هذا القسم','No services in this section')}</div>`;
  setOverlay(category==='dining'?tr('المطاعم وخدمة الغرف','Dining & Room Service'):tr('خدمات الفندق','Hotel Services'),tr('الخدمات','SERVICES'),html);
  overlayItems.forEach(item=>item.addEventListener('click',()=>confirmService(services.find(s=>s.id===item.dataset.service))));
}

function serviceIcon(icon){const icons={sparkles:'✦',shirt:'♢',utensils:'♨',wrench:'⚙'};return icons[icon]||'◇'}

function renderRequests(){const html=sessionRequests.length?`<div class="tv-grid">${sessionRequests.map(request=>`<div class="tv-item" data-focusable><span class="channel-number">${safe(request.status==='new'?tr('جديد','NEW'):request.status)}</span><span class="channel-name">${safe(request.service_name)}</span><small>${new Date(request.created_at).toLocaleTimeString(language==='ar'?'ar-SA':'en-GB',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div>`:`<div class="empty-state">${tr('لم تطلب أي خدمة خلال هذه الجلسة','No service requests in this session')}</div>`;setOverlay(tr('طلباتي','My Requests'),tr('متابعة الطلبات','REQUEST TRACKING'),html)}

function renderMessages(){const messages=context.messages||[];const html=messages.length?`<div class="tv-grid">${messages.map(message=>`<button class="tv-item" data-focusable data-message="${safe(message.id)}"><span class="channel-number">✉</span><span class="channel-name">${safe(language==='ar'?message.title_ar:message.title_en)}</span><small>${safe((language==='ar'?message.body_ar:message.body_en).slice(0,80))}</small></button>`).join('')}</div>`:`<div class="empty-state">${tr('لا توجد رسائل جديدة','No new messages')}</div>`;setOverlay(tr('رسائل الفندق','Hotel Messages'),tr('الرسائل','MESSAGES'),html);overlayItems.forEach(item=>item.addEventListener('click',()=>{const message=messages.find(m=>m.id===item.dataset.message);showDialog(language==='ar'?message.title_ar:message.title_en,language==='ar'?message.body_ar:message.body_en,[tr('إغلاق','Close')],hideDialog)}))}

function renderInformation(){const hotel=language==='ar'?context.meta.hotel_name_ar:context.meta.hotel_name_en;const html=`<div class="tv-grid"><div class="tv-item" data-focusable><span class="channel-number">24/7</span><span class="channel-name">${tr('الاستقبال','Reception')}</span><small>${tr('اتصل بالرقم 0','Dial 0')}</small></div><div class="tv-item" data-focusable><span class="channel-number">Wi-Fi</span><span class="channel-name">${tr('الإنترنت','Internet')}</span><small>HDB-GUEST</small></div><div class="tv-item" data-focusable><span class="channel-number">HDB</span><span class="channel-name">${safe(hotel)}</span><small>${tr('نتمنى لكم إقامة سعيدة','Enjoy your stay')}</small></div></div>`;setOverlay(tr('معلومات الفندق','Hotel Information'),tr('دليل الإقامة','STAY GUIDE'),html)}

function confirmService(service){if(!service)return;const name=language==='ar'?service.name_ar:service.name_en;showDialog(tr('تأكيد الطلب','Confirm Request'),tr(`هل تريد إرسال طلب ${name} للغرفة ${roomNumber}؟`,`Send a ${name} request for room ${roomNumber}?`),[tr('إلغاء','Cancel'),tr('إرسال الطلب','Send Request')],async choice=>{if(choice===1){try{const data=await api('service-request',{method:'POST',body:{room:roomNumber,service_id:service.id,note:''}});sessionRequests.unshift({...data.request,service_name:name});showDialog(tr('تم إرسال الطلب','Request Sent'),tr('تم إرسال طلبك إلى القسم المختص.','Your request has been sent to the relevant team.'),[tr('حسنًا','OK')],hideDialog)}catch(error){showDialog(tr('تعذر إرسال الطلب','Request Failed'),error.message,[tr('إغلاق','Close')],hideDialog)}}else hideDialog()})}

function playChannel(channel){if(!channel)return;if(!channel.source){showDialog(tr('المصدر غير مضاف','Source Not Configured'),tr('أضف رابط البث الرئيسي من لوحة التحكم أولًا.','Add the primary stream URL from the administration console first.'),[tr('إغلاق','Close')],hideDialog);return}mode='video';$('overlay').classList.add('hidden');$('videoStage').classList.remove('hidden');$('playingNumber').textContent=`${channel.number} · `;$('playingName').textContent=language==='ar'?channel.name_ar:channel.name_en;const player=$('videoPlayer');player.src=channel.source;player.play().catch(()=>{if(channel.backup_source){player.src=channel.backup_source;player.play().catch(()=>{})}})}
function stopVideo(){const player=$('videoPlayer');player.pause();player.removeAttribute('src');player.load();$('videoStage').classList.add('hidden');$('overlay').classList.remove('hidden');mode='overlay';updateOverlayFocus()}

function showDialog(title,body,buttons,onSelect){mode='dialog';dialogChoice=0;const dialog=$('dialog');dialog.innerHTML=`<h3>${safe(title)}</h3><p>${safe(body)}</p><div class="dialog-actions">${buttons.map((button,index)=>`<button data-dialog-choice="${index}" class="${index===buttons.length-1?'primary':''}">${safe(button)}</button>`).join('')}</div>`;dialog.classList.remove('hidden');dialog._onSelect=onSelect;dialog.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>onSelect(Number(button.dataset.dialogChoice))));updateDialogFocus()}
function updateDialogFocus(){$('dialog').querySelectorAll('button').forEach((button,index)=>button.style.outline=index===dialogChoice?'3px solid rgba(210,178,114,.6)':'none')}
function handleDialogKey(key,code){const buttons=[...$('dialog').querySelectorAll('button')];if(key==='ArrowLeft'||key==='ArrowRight'||code===37||code===39){dialogChoice=(dialogChoice+1)%buttons.length;updateDialogFocus()}if(key==='Enter'||code===13)$('dialog')._onSelect?.(dialogChoice);if(key==='Escape'||key==='Backspace'||code===10009||code===461)hideDialog()}
function hideDialog(){ $('dialog').classList.add('hidden'); mode=$('overlay').classList.contains('hidden')?'menu':'overlay'; if(mode==='overlay')updateOverlayFocus();else updateMenuFocus() }

function closeCurrent(){if(mode==='video'){stopVideo();return}if(mode==='dialog'){hideDialog();return}if(mode==='overlay'){$('overlay').classList.add('hidden');mode='menu';overlayItems=[];focusIndex=0;updateMenuFocus()}}

start();
