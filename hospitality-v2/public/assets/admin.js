const API='../api.php';
const state={csrf:'',user:null,currentView:'dashboard',cache:{},settings:null,search:{}};
const labels={dashboard:'لوحة المتابعة',rooms:'الغرف والإقامات',devices:'التلفزيونات والأجهزة',channels:'القنوات والبث',messages:'رسائل النزلاء',services:'خدمات الفندق',requests:'طلبات الخدمات',settings:'الهوية والإعدادات',audit:'سجل العمليات'};
const entityFields={
  rooms:[['number','رقم الغرفة','text'],['floor','الدور','text'],['type','نوع الغرفة','text'],['status','الحالة','select',{'vacant':'شاغرة','occupied':'مشغولة','maintenance':'صيانة'}],['package','الباقة','select',{'standard':'أساسية','premium':'مميزة'}]],
  devices:[['code','كود الجهاز','text'],['room_id','معرّف الغرفة','text'],['brand','الماركة','select',{'Samsung':'Samsung','LG':'LG','STB':'STB','Browser':'Browser'}],['model','الموديل','text'],['ip','عنوان IP','text'],['status','الحالة','select',{'online':'متصل','offline':'غير متصل','blocked':'محظور'}],['app_version','إصدار التطبيق','text']],
  channels:[['number','رقم القناة','number'],['name_ar','الاسم بالعربي','text'],['name_en','الاسم بالإنجليزي','text'],['group','المجموعة','text'],['source','المصدر الرئيسي','text'],['backup_source','المصدر الاحتياطي','text'],['status','الحالة','select',{'active':'مفعلة','inactive':'متوقفة'}],['package','الباقة','select',{'standard':'أساسية','premium':'مميزة'}],['sort','الترتيب','number']],
  messages:[['title_ar','العنوان بالعربي','text'],['title_en','العنوان بالإنجليزي','text'],['body_ar','النص بالعربي','textarea'],['body_en','النص بالإنجليزي','textarea'],['scope','النطاق','select',{'all':'كل الفندق','floor':'دور','room':'غرفة'}],['scope_id','معرّف النطاق','text'],['active','مفعلة','checkbox'],['starts_at','تبدأ في','datetime-local'],['ends_at','تنتهي في','datetime-local']],
  services:[['name_ar','الاسم بالعربي','text'],['name_en','الاسم بالإنجليزي','text'],['icon','الأيقونة','text'],['category','التصنيف','select',{'hotel':'خدمات الفندق','dining':'المطاعم','wellness':'السبا والرفاهية'}],['active','مفعلة','checkbox'],['sort','الترتيب','number']],
  requests:[['status','الحالة','select',{'new':'جديد','in_progress':'قيد التنفيذ','completed':'مكتمل','cancelled':'ملغي'}],['note','ملاحظة','textarea']]
};

async function api(action,{method='GET',body=null,auth=true}={}){
  const options={method,headers:{'Accept':'application/json'}};
  if(body!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
  if(auth&&method!=='GET'&&state.csrf)options.headers['X-HDB-CSRF']=state.csrf;
  const response=await fetch(`${API}?action=${encodeURIComponent(action)}`,options);
  const data=await response.json().catch(()=>({ok:false,error:'استجابة غير صالحة من الخادم'}));
  if(response.status===401&&action!=='login'){showLogin();throw new Error('انتهت الجلسة')}
  if(!response.ok||!data.ok)throw new Error(data.error||'تعذر تنفيذ العملية');
  return data;
}

function escapeHtml(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function statusLabel(value){const map={vacant:'شاغرة',occupied:'مشغولة',maintenance:'صيانة',online:'متصل',offline:'غير متصل',active:'مفعلة',inactive:'متوقفة',new:'جديد',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',checked_in:'مقيم',checked_out:'غادر'};return map[value]||value||'-'}
function statusPill(value){return `<span class="pill"><span class="status-dot ${escapeHtml(value)}"></span>${escapeHtml(statusLabel(value))}</span>`}
function toast(message,type='success'){const node=document.createElement('div');node.className=`toast ${type}`;node.textContent=message;document.getElementById('toastStack').appendChild(node);setTimeout(()=>node.remove(),3200)}
function table(headers,rows){if(!rows.length)return '<div class="empty-state">لا توجد بيانات حاليًا</div>';return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
function formatDate(value){if(!value)return '-';const date=new Date(value);return Number.isNaN(date.getTime())?escapeHtml(value):date.toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'})}

function showLogin(){document.getElementById('loginScreen').classList.remove('hidden');document.getElementById('appShell').classList.add('hidden')}
function showApp(){document.getElementById('loginScreen').classList.add('hidden');document.getElementById('appShell').classList.remove('hidden');document.getElementById('userName').textContent=state.user?.display_name||state.user?.username||'Administrator'}

async function bootstrap(){
  bindStaticEvents();
  try{const me=await api('me',{auth:false});state.user=me.user;state.csrf=me.csrf;showApp();await navigate('dashboard')}catch{showLogin()}
}

function bindStaticEvents(){
  document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{const data=await api('login',{method:'POST',body:{username:loginUser.value.trim(),password:loginPass.value},auth:false});state.user=data.user;state.csrf=data.csrf;showApp();await navigate('dashboard');toast('تم تسجيل الدخول')}catch(err){toast(err.message,'error')}});
  document.getElementById('logoutBtn').addEventListener('click',async()=>{try{await api('logout',{method:'POST'});}catch{}state.user=null;state.csrf='';showLogin()});
  document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.view)));
  document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.jump)));
  document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>openEntityModal(btn.dataset.add)));
  document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>{state.search[input.dataset.search]=input.value.toLowerCase();renderEntity(input.dataset.search)}));
  document.getElementById('publishBtn').addEventListener('click',publish);
  document.getElementById('previewBtn').addEventListener('click',()=>window.open('../tv/?room=1201','_blank'));
  document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('settingsForm').addEventListener('submit',saveSettings);
  document.addEventListener('click',handleDelegatedClick);
}

async function navigate(view){
  state.currentView=view;
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  document.getElementById('topTitle').textContent=labels[view]||view;
  document.getElementById('sidebar').classList.remove('open');
  try{
    if(view==='dashboard')await loadDashboard();
    else if(view==='settings')await loadSettings();
    else await loadEntity(view);
  }catch(err){toast(err.message,'error')}
}

async function loadDashboard(){
  const data=await api('dashboard');
  const m=data.metrics;
  const cards=[['إجمالي الغرف',m.rooms_total,'غرفة مسجلة'],['الغرف المشغولة',m.rooms_occupied,`${m.rooms_vacant} شاغرة`],['الأجهزة المتصلة',m.devices_online,`من ${m.devices_total} جهاز`],['الطلبات المفتوحة',m.requests_open,`${m.channels_active} قناة مفعلة`]];
  document.getElementById('metrics').innerHTML=cards.map(c=>`<div class="metric card"><div class="metric-label">${c[0]}</div><div class="metric-value">${c[1]}</div><div class="metric-sub">${c[2]}</div></div>`).join('');
  document.getElementById('recentRequests').innerHTML=data.recent_requests.length?data.recent_requests.map(r=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>غرفة ${escapeHtml(r.room_number)}</strong><div class="muted">${escapeHtml(r.service_name_ar||r.service_id)}</div></div>${statusPill(r.status)}</div>`).join(''):'<div class="empty-state">لا توجد طلبات</div>';
  document.getElementById('recentAudit').innerHTML=data.recent_audit.length?data.recent_audit.map(a=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>${escapeHtml(a.action)} · ${escapeHtml(a.entity)}</strong><small>${formatDate(a.created_at)}</small></div></div>`).join(''):'<div class="empty-state">لا توجد عمليات</div>';
  document.getElementById('systemVersion').textContent=`v${data.meta.version}`;
  const published=!!data.meta.published_at;document.getElementById('publishState').innerHTML=`<span class="status-dot ${published?'online':''}"></span>${published?'آخر نشر '+formatDate(data.meta.published_at):'غير منشور'}`;
}

async function loadEntity(entity){
  const data=await api(`list&entity=${encodeURIComponent(entity)}`);
  state.cache[entity]=data.items;
  if(entity==='rooms'){const [g,d]=await Promise.all([api('list&entity=guests'),api('list&entity=devices')]);state.cache.guests=g.items;state.cache.devices=d.items}
  renderEntity(entity);
}

function filtered(entity){const q=state.search[entity]||'';const items=state.cache[entity]||[];if(!q)return items;return items.filter(item=>JSON.stringify(item).toLowerCase().includes(q))}

function renderEntity(entity){
  const items=filtered(entity);
  if(entity==='rooms')renderRooms(items);
  if(entity==='devices')renderDevices(items);
  if(entity==='channels')renderChannels(items);
  if(entity==='messages')renderMessages(items);
  if(entity==='services')renderServices(items);
  if(entity==='requests')renderRequests(items);
  if(entity==='audit')renderAudit(items);
}

function actions(entity,id,extra=''){return `<div class="table-actions">${extra}<button class="icon-btn" data-edit="${entity}" data-id="${escapeHtml(id)}" title="تعديل">✎</button><button class="icon-btn" data-delete="${entity}" data-id="${escapeHtml(id)}" title="حذف">×</button></div>`}
function renderRooms(items){
  const guests=Object.fromEntries((state.cache.guests||[]).map(x=>[x.id,x]));const devices=Object.fromEntries((state.cache.devices||[]).map(x=>[x.id,x]));
  const rows=items.map(r=>{const guest=guests[r.guest_id];const device=devices[r.device_id];const extra=r.status==='occupied'?`<button class="btn danger" data-checkout="${r.id}">مغادرة</button>`:`<button class="btn ghost" data-checkin="${r.id}">تسكين</button>`;return `<tr><td><strong>${escapeHtml(r.number)}</strong></td><td>${escapeHtml(r.floor)}</td><td>${escapeHtml(r.type)}</td><td>${statusPill(r.status)}</td><td>${escapeHtml(guest?.full_name||'-')}</td><td>${escapeHtml(device?.code||'-')}</td><td>${actions('rooms',r.id,extra)}</td></tr>`});
  document.getElementById('roomsTable').innerHTML=table(['الغرفة','الدور','النوع','الحالة','النزيل','الجهاز','الإجراءات'],rows);document.getElementById('roomsCount').textContent=`${items.length} غرفة`;
}
function renderDevices(items){const rows=items.map(d=>`<tr><td><strong>${escapeHtml(d.code)}</strong></td><td>${escapeHtml(d.room_id||'-')}</td><td>${escapeHtml(d.brand)}</td><td>${escapeHtml(d.model)}</td><td>${escapeHtml(d.ip||'-')}</td><td>${statusPill(d.status)}</td><td>${formatDate(d.last_seen)}</td><td>${actions('devices',d.id)}</td></tr>`);document.getElementById('devicesTable').innerHTML=table(['كود الجهاز','الغرفة','الماركة','الموديل','IP','الحالة','آخر اتصال','الإجراءات'],rows);document.getElementById('devicesCount').textContent=`${items.length} جهاز`}
function renderChannels(items){items=[...items].sort((a,b)=>Number(a.sort||a.number)-Number(b.sort||b.number));const rows=items.map(c=>`<tr><td><strong>${escapeHtml(c.number)}</strong></td><td>${escapeHtml(c.name_ar)}</td><td>${escapeHtml(c.name_en)}</td><td>${escapeHtml(c.group)}</td><td>${escapeHtml(c.package)}</td><td>${statusPill(c.status)}</td><td><span class="muted">${escapeHtml(c.source||'لم يحدد')}</span></td><td>${actions('channels',c.id)}</td></tr>`);document.getElementById('channelsTable').innerHTML=table(['#','الاسم العربي','الاسم الإنجليزي','المجموعة','الباقة','الحالة','المصدر','الإجراءات'],rows);document.getElementById('channelsCount').textContent=`${items.length} قناة`}
function renderMessages(items){const rows=items.map(m=>`<tr><td><strong>${escapeHtml(m.title_ar)}</strong><div class="muted">${escapeHtml(m.title_en)}</div></td><td>${escapeHtml(m.scope)}</td><td>${escapeHtml(m.scope_id||'الكل')}</td><td>${statusPill(m.active?'active':'inactive')}</td><td>${formatDate(m.starts_at)}</td><td>${actions('messages',m.id)}</td></tr>`);document.getElementById('messagesTable').innerHTML=table(['العنوان','النطاق','الهدف','الحالة','تاريخ البدء','الإجراءات'],rows)}
function renderServices(items){const rows=items.sort((a,b)=>Number(a.sort)-Number(b.sort)).map(s=>`<tr><td><strong>${escapeHtml(s.name_ar)}</strong><div class="muted">${escapeHtml(s.name_en)}</div></td><td>${escapeHtml(s.category)}</td><td>${escapeHtml(s.icon)}</td><td>${escapeHtml(s.sort)}</td><td>${statusPill(s.active?'active':'inactive')}</td><td>${actions('services',s.id)}</td></tr>`);document.getElementById('servicesTable').innerHTML=table(['الخدمة','التصنيف','الأيقونة','الترتيب','الحالة','الإجراءات'],rows)}
function renderRequests(items){const rows=items.map(r=>`<tr><td><strong>${escapeHtml(r.room_number)}</strong></td><td>${escapeHtml(r.service_name_ar||r.service_id)}</td><td>${escapeHtml(r.note||'-')}</td><td>${statusPill(r.status)}</td><td>${formatDate(r.created_at)}</td><td><button class="btn ghost" data-edit="requests" data-id="${escapeHtml(r.id)}">تحديث الحالة</button></td></tr>`);document.getElementById('requestsTable').innerHTML=table(['الغرفة','الخدمة','الملاحظة','الحالة','الوقت','الإجراء'],rows)}
function renderAudit(items){const rows=items.map(a=>`<tr><td>${formatDate(a.created_at)}</td><td>${escapeHtml(a.user)}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.entity)}</td><td>${escapeHtml(a.entity_id||'-')}</td></tr>`);document.getElementById('auditTable').innerHTML=table(['الوقت','المستخدم','العملية','القسم','المعرف'],rows)}

function fieldHtml(field,item){const [name,label,type,options]=field;const value=item?.[name]??'';if(type==='select')return `<div class="field"><label>${label}</label><select name="${name}">${Object.entries(options).map(([v,l])=>`<option value="${escapeHtml(v)}" ${String(value)===v?'selected':''}>${l}</option>`).join('')}</select></div>`;if(type==='textarea')return `<div class="field"><label>${label}</label><textarea name="${name}">${escapeHtml(value)}</textarea></div>`;if(type==='checkbox')return `<div class="field"><label><input name="${name}" type="checkbox" ${value?'checked':''}> ${label}</label></div>`;return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${escapeHtml(type==='datetime-local'&&value?String(value).slice(0,16):value)}"></div>`}
function openEntityModal(entity,item=null){const title=item?'تعديل':'إضافة';document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop"><form id="entityForm" class="modal card"><div class="modal-head"><h3>${title} ${labels[entity]||entity}</h3><button type="button" class="icon-btn" data-close-modal>×</button></div><div class="grid-2">${entityFields[entity].map(f=>fieldHtml(f,item)).join('')}</div><div class="modal-actions"><button type="button" class="btn ghost" data-close-modal>إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></form></div>`;document.getElementById('entityForm').addEventListener('submit',e=>saveEntity(e,entity,item))}
async function saveEntity(event,entity,existing){event.preventDefault();const form=event.currentTarget;const item={...(existing||{})};for(const field of entityFields[entity]){const [name,,type]=field;const el=form.elements[name];if(type==='checkbox')item[name]=el.checked;else if(type==='number')item[name]=Number(el.value||0);else item[name]=el.value.trim()}try{await api('save',{method:'POST',body:{entity,item}});closeModal();toast('تم الحفظ بنجاح');await loadEntity(entity);if(entity==='requests')await loadDashboard()}catch(err){toast(err.message,'error')}}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}

function openCheckin(roomId){const room=(state.cache.rooms||[]).find(r=>r.id===roomId);document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop"><form id="checkinForm" class="modal card"><div class="modal-head"><h3>تسكين الغرفة ${escapeHtml(room?.number||'')}</h3><button type="button" class="icon-btn" data-close-modal>×</button></div><div class="grid-2"><div class="field"><label>اسم النزيل</label><input name="full_name" required></div><div class="field"><label>اللغة</label><select name="language"><option value="ar">العربية</option><option value="en">English</option></select></div><div class="field"><label>الوصول</label><input name="arrival" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>المغادرة</label><input name="departure" type="date"></div><div class="field"><label>الباقة</label><select name="package"><option value="standard">أساسية</option><option value="premium">مميزة</option></select></div></div><div class="modal-actions"><button type="button" class="btn ghost" data-close-modal>إلغاء</button><button class="btn primary">تأكيد التسكين</button></div></form></div>`;document.getElementById('checkinForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;try{await api('checkin',{method:'POST',body:{room_id:roomId,full_name:f.full_name.value,language:f.language.value,arrival:f.arrival.value,departure:f.departure.value,package:f.package.value}});closeModal();toast('تم التسكين وظهور بيانات النزيل على التلفزيون');await loadEntity('rooms')}catch(err){toast(err.message,'error')}})}

async function handleDelegatedClick(event){
  const close=event.target.closest('[data-close-modal]');if(close){closeModal();return}
  const edit=event.target.closest('[data-edit]');if(edit){const entity=edit.dataset.edit;const item=(state.cache[entity]||[]).find(x=>x.id===edit.dataset.id);openEntityModal(entity,item);return}
  const del=event.target.closest('[data-delete]');if(del){if(!confirm('تأكيد حذف العنصر؟'))return;try{await api('delete',{method:'POST',body:{entity:del.dataset.delete,id:del.dataset.id}});toast('تم الحذف');await loadEntity(del.dataset.delete)}catch(err){toast(err.message,'error')}return}
  const checkin=event.target.closest('[data-checkin]');if(checkin){openCheckin(checkin.dataset.checkin);return}
  const checkout=event.target.closest('[data-checkout]');if(checkout){if(!confirm('تأكيد مغادرة النزيل وتنظيف بيانات الشاشة؟'))return;try{await api('checkout',{method:'POST',body:{room_id:checkout.dataset.checkout}});toast('تمت المغادرة وتنظيف بيانات النزيل');await loadEntity('rooms')}catch(err){toast(err.message,'error')}}
}

async function loadSettings(){const data=await api('settings');state.settings=data;const form=document.getElementById('settingsForm');for(const [k,v] of Object.entries({...data.meta,...data.theme})){if(form.elements[k]){if(form.elements[k].type==='checkbox')form.elements[k].checked=!!v;else form.elements[k].value=v??''}}}
async function saveSettings(event){event.preventDefault();const f=event.currentTarget;const body={meta:{hotel_name_ar:f.hotel_name_ar.value,hotel_name_en:f.hotel_name_en.value},theme:{welcome_ar:f.welcome_ar.value,welcome_en:f.welcome_en.value,primary:f.primary.value,background:f.background.value,surface:f.surface.value,hero_image:f.hero_image.value}};try{await api('settings',{method:'POST',body});toast('تم حفظ الهوية والإعدادات')}catch(err){toast(err.message,'error')}}
async function publish(){try{const data=await api('publish',{method:'POST',body:{}});document.getElementById('publishState').innerHTML=`<span class="status-dot online"></span>آخر نشر ${formatDate(data.published_at)}`;toast('تم نشر التحديثات على تجربة النزيل')}catch(err){toast(err.message,'error')}}

bootstrap();
