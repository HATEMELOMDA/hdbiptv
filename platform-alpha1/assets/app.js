const state = {
  metrics: [
    { icon: '▦', value: '82%', label: 'نسبة الإشغال', trend: '+6.2% هذا الأسبوع' },
    { icon: '▣', value: '114/120', label: 'التلفزيونات المتصلة', trend: '6 أجهزة تحتاج مراجعة', down: true },
    { icon: '▶', value: '67/68', label: 'القنوات تعمل', trend: 'قناة واحدة متوقفة', down: true },
    { icon: '◇', value: '12', label: 'طلبات مفتوحة', trend: '8 أُغلقت اليوم' }
  ],
  rooms: [
    { number:'1701', floor:17, guest:'خالد العتيبي', dates:'20–23 يوليو', tv:'Online', status:'occupied' },
    { number:'1702', floor:17, guest:'—', dates:'—', tv:'Online', status:'vacant' },
    { number:'1703', floor:17, guest:'أحمد السبيعي', dates:'19–22 يوليو', tv:'Online', status:'occupied' },
    { number:'1704', floor:17, guest:'حاتم محمد', dates:'21–25 يوليو', tv:'Online', status:'occupied' },
    { number:'1705', floor:17, guest:'—', dates:'تجهيز الغرفة', tv:'Offline', status:'cleaning' },
    { number:'1706', floor:17, guest:'سعد الغامدي', dates:'18–24 يوليو', tv:'Online', status:'occupied' },
    { number:'1707', floor:17, guest:'—', dates:'—', tv:'Online', status:'vacant' },
    { number:'1708', floor:17, guest:'محمد الحربي', dates:'21–22 يوليو', tv:'Online', status:'occupied' },
    { number:'1801', floor:18, guest:'عبدالله الدوسري', dates:'20–26 يوليو', tv:'Online', status:'occupied' },
    { number:'1802', floor:18, guest:'—', dates:'—', tv:'Online', status:'vacant' },
    { number:'1803', floor:18, guest:'سلمان الشمري', dates:'21–24 يوليو', tv:'Online', status:'occupied' },
    { number:'1804', floor:18, guest:'—', dates:'تجهيز الغرفة', tv:'Online', status:'cleaning' },
    { number:'1805', floor:18, guest:'ناصر القحطاني', dates:'19–23 يوليو', tv:'Online', status:'occupied' },
    { number:'1806', floor:18, guest:'—', dates:'—', tv:'Offline', status:'vacant' },
    { number:'1807', floor:18, guest:'تركي المطيري', dates:'20–25 يوليو', tv:'Online', status:'occupied' },
    { number:'1808', floor:18, guest:'ياسر العنزي', dates:'21–22 يوليو', tv:'Online', status:'occupied' },
    { number:'1901', floor:19, guest:'—', dates:'—', tv:'Online', status:'vacant' },
    { number:'1902', floor:19, guest:'عمر الزهراني', dates:'19–24 يوليو', tv:'Online', status:'occupied' },
    { number:'1903', floor:19, guest:'—', dates:'تجهيز الغرفة', tv:'Online', status:'cleaning' },
    { number:'1904', floor:19, guest:'فهد الشهري', dates:'20–23 يوليو', tv:'Online', status:'occupied' },
    { number:'1905', floor:19, guest:'ماجد المالكي', dates:'21–27 يوليو', tv:'Online', status:'occupied' },
    { number:'1906', floor:19, guest:'—', dates:'—', tv:'Online', status:'vacant' },
    { number:'1907', floor:19, guest:'عبدالرحمن اليامي', dates:'21–23 يوليو', tv:'Online', status:'occupied' },
    { number:'1908', floor:19, guest:'—', dates:'—', tv:'Online', status:'vacant' }
  ],
  health: [
    { icon:'P', name:'PMS Connector', sub:'آخر مزامنة منذ دقيقة', value:'Connected', level:'ok' },
    { icon:'W', name:'WISI Headend', sub:'67 قناة مستقرة', value:'99.8%', level:'ok' },
    { icon:'TV', name:'أجهزة التلفزيون', sub:'6 أجهزة بدون اتصال', value:'95%', level:'warning' },
    { icon:'!', name:'قناة المصدر 42', sub:'لا توجد إشارة منذ 12 دقيقة', value:'Offline', level:'critical' }
  ],
  requests: [
    { name:'مناشف إضافية', room:'1704', since:'منذ 3 دقائق', status:'new', label:'جديد' },
    { name:'صيانة تكييف', room:'1811', since:'منذ 11 دقيقة', status:'progressing', label:'قيد التنفيذ' },
    { name:'طلب إفطار', room:'1907', since:'منذ 24 دقيقة', status:'progressing', label:'قيد التنفيذ' },
    { name:'تنظيف الغرفة', room:'1720', since:'منذ 48 دقيقة', status:'done', label:'مكتمل' }
  ],
  channels: [
    { logo:'Q', name:'القرآن الكريم', source:'WISI · UDP 101', signal:98, state:'مستقر' },
    { logo:'SA', name:'السعودية', source:'WISI · UDP 102', signal:96, state:'مستقر' },
    { logo:'M1', name:'MBC 1', source:'WISI · UDP 110', signal:91, state:'مستقر' },
    { logo:'42', name:'القناة 42', source:'Backup source', signal:18, state:'متوقفة', down:true }
  ]
};

const titles = {
  command:'مركز القيادة', alerts:'التنبيهات', rooms:'الغرف والإقامات', devices:'التلفزيونات والأجهزة',
  channels:'القنوات والبث', requests:'طلبات النزلاء', experience:'تجربة النزيل', content:'الخدمات والمحتوى',
  messages:'الرسائل', integrations:'التكاملات', reports:'التقارير', settings:'الإعدادات'
};

const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];

function renderMetrics(){
  $('#metricGrid').innerHTML = state.metrics.map(item => `
    <article class="metric-card">
      <div class="metric-top"><span class="metric-icon">${item.icon}</span><span class="metric-trend ${item.down?'down':''}">${item.trend}</span></div>
      <strong>${item.value}</strong><p>${item.label}</p>
    </article>`).join('');
}

function roomLabel(status){
  return status === 'occupied' ? 'مشغولة' : status === 'cleaning' ? 'تجهيز' : 'شاغرة';
}

function renderRoomMap(floor='all'){
  const rooms = floor === 'all' ? state.rooms : state.rooms.filter(r => String(r.floor) === String(floor));
  $('#roomMap').innerHTML = rooms.map(room => `<div class="room-tile ${room.status}" title="${room.guest}"><b>${room.number}</b><span>${roomLabel(room.status)}</span></div>`).join('');
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const percent = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  $('#occupancyValue').textContent = `${percent}%`;
  $('#occupancyBar').style.width = `${percent}%`;
  $('#occupancyText').textContent = `${occupied} من ${rooms.length} غرفة مشغولة`;
}

function renderHealth(){
  $('#healthList').innerHTML = state.health.map(row => `
    <div class="health-row ${row.level}">
      <div class="health-icon">${row.icon}</div>
      <div><strong>${row.name}</strong><span>${row.sub}</span></div>
      <div class="health-value">${row.value}</div>
    </div>`).join('');
}

function renderRequests(){
  $('#requestRows').innerHTML = state.requests.map(row => `<tr><td>${row.name}</td><td>${row.room}</td><td>${row.since}</td><td><span class="status-pill ${row.status}">${row.label}</span></td></tr>`).join('');
}

function renderChannels(){
  $('#channelMonitor').innerHTML = state.channels.map(row => `
    <div class="channel-row ${row.down?'down':''}">
      <div class="channel-logo">${row.logo}</div>
      <div><strong>${row.name}</strong><span>${row.source}</span></div>
      <div class="signal"><i style="width:${row.signal}%"></i></div>
      <div class="channel-state">${row.state}</div>
    </div>`).join('');
}

function renderRoomsTable(){
  const query = ($('#roomSearch')?.value || '').trim().toLowerCase();
  const status = $('#roomStatus')?.value || 'all';
  const rooms = state.rooms.filter(room => {
    const matchesQuery = !query || room.number.includes(query) || room.guest.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || room.status === status;
    return matchesQuery && matchesStatus;
  });
  $('#roomsTable').innerHTML = rooms.map(room => `
    <tr>
      <td><div class="room-name"><i>▦</i><b>${room.number}</b></div></td>
      <td>${room.floor}</td><td>${room.guest}</td><td>${room.dates}</td>
      <td><span class="status-pill ${room.tv === 'Online' ? 'done' : 'new'}">${room.tv}</span></td>
      <td><span class="status-pill ${room.status === 'occupied' ? 'done' : room.status === 'cleaning' ? 'new' : ''}">${roomLabel(room.status)}</span></td>
      <td><button class="more-btn" aria-label="إجراءات">⋮</button></td>
    </tr>`).join('');
  $('#roomsCount').textContent = `${rooms.length} غرفة`;
}

function navigate(view){
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  $$('.view').forEach(section => section.classList.remove('active'));
  const target = $(`#view-${view}`);
  if(target) target.classList.add('active');
  $('#pageTitle').textContent = titles[view] || 'HDB Hospitality OS';
  $('#sidebar').classList.remove('open');
  history.replaceState(null, '', `#${view}`);
  window.scrollTo({top:0,behavior:'smooth'});
  if(view === 'rooms') renderRoomsTable();
}

function updateClock(){
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
  $('#today').textContent = now.toLocaleDateString('ar-SA',{weekday:'long',day:'numeric',month:'long'});
}

function showToast(message='تم تحديث البيانات'){
  const toast = $('#toast');
  $('span',toast).textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'),2200);
}

function initExperienceEditor(){
  const update = () => {
    $('#previewWelcome').textContent = $('#welcomeAr').value || 'مرحبًا بك';
    $('#previewText').textContent = $('#welcomeText').value || '';
    const color = $('#accentColor').value;
    document.documentElement.style.setProperty('--accent',color);
    document.documentElement.style.setProperty('--accent-2',color);
  };
  ['welcomeAr','welcomeText','accentColor'].forEach(id => $(`#${id}`).addEventListener('input',update));
  $('#backgroundMode').addEventListener('change', event => {
    const screen = $('#tvScreen');
    const backgrounds = {
      city:'linear-gradient(90deg,rgba(3,9,18,.94),rgba(3,9,18,.3)),radial-gradient(circle at 70% 40%,rgba(42,82,123,.7),transparent 35%),linear-gradient(145deg,#14283e,#07111f)',
      gradient:'linear-gradient(125deg,#0a1727,#263b57 58%,#8b7145)',
      image:'linear-gradient(90deg,rgba(2,8,15,.9),rgba(2,8,15,.2)),radial-gradient(circle at 72% 45%,#765f3d,transparent 36%),linear-gradient(145deg,#1c2e43,#07111f)'
    };
    screen.style.background = backgrounds[event.target.value];
  });
  $('#publishBtn').addEventListener('click',() => showToast('تم نشر تجربة النزيل التجريبية'));
}

function bindEvents(){
  $$('.nav-item').forEach(btn => btn.addEventListener('click',() => navigate(btn.dataset.view)));
  $$('[data-view-target]').forEach(btn => btn.addEventListener('click',() => navigate(btn.dataset.viewTarget)));
  $$('#floorFilter button').forEach(btn => btn.addEventListener('click',() => {
    $$('#floorFilter button').forEach(item => item.classList.remove('active'));
    btn.classList.add('active'); renderRoomMap(btn.dataset.floor);
  }));
  $('#menuToggle').addEventListener('click',() => $('#sidebar').classList.toggle('open'));
  $('#refreshBtn').addEventListener('click',event => {
    event.currentTarget.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:550});
    showToast();
  });
  $('#quickAction').addEventListener('click',() => $('#quickDialog').showModal());
  $$('[data-open]').forEach(btn => btn.addEventListener('click',() => $('#quickDialog').showModal()));
  $('#quickDialog').addEventListener('close',() => {
    if($('#quickDialog').returnValue && $('#quickDialog').returnValue !== 'cancel') showToast('تم فتح الإجراء التجريبي');
  });
  $('#roomSearch').addEventListener('input',renderRoomsTable);
  $('#roomStatus').addEventListener('change',renderRoomsTable);
}

function init(){
  renderMetrics(); renderRoomMap(); renderHealth(); renderRequests(); renderChannels(); renderRoomsTable();
  bindEvents(); initExperienceEditor(); updateClock(); setInterval(updateClock,30000);
  const hash = location.hash.replace('#','');
  if(hash && titles[hash]) navigate(hash);
}

document.addEventListener('DOMContentLoaded',init);
