(function(){
  'use strict';

  var STORE={lang:'hdb_lang',room:'hdb_room',guest:'hdb_guest'};
  var focusSelector='.focusable,.service-tile,.catalog-card,.primary-action,.language-action,.back-button';

  function byId(id){return document.getElementById(id)}
  function safeGet(key,fallback){try{var value=localStorage.getItem(key);return value===null?fallback:value}catch(error){return fallback}}
  function safeSet(key,value){try{localStorage.setItem(key,value)}catch(error){}}
  function pad(value){value=String(value);return value.length<2?'0'+value:value}
  function decode(value){try{return decodeURIComponent(String(value||'').replace(/\+/g,' '))}catch(error){return String(value||'')}}

  function queryValue(name){
    var query=window.location.search.replace(/^\?/,'').split('&');
    for(var i=0;i<query.length;i++){
      var parts=query[i].split('=');
      if(parts[0]===name){return decode(parts.slice(1).join('='))}
    }
    return '';
  }

  function absorbQueryGuest(){
    var room=queryValue('room');
    var guest=queryValue('guest');
    if(room){safeSet(STORE.room,room)}
    if(guest){safeSet(STORE.guest,guest)}
  }

  function getLanguage(){return safeGet(STORE.lang,'ar')==='en'?'en':'ar'}

  function dateParts(){
    var date=new Date();
    var language=getLanguage();
    var locale=language==='ar'?'ar-SA':'en-GB';
    var formatted;
    try{formatted=date.toLocaleDateString(locale,{weekday:'long',day:'2-digit',month:'long'})}
    catch(error){formatted=pad(date.getDate())+'/'+pad(date.getMonth()+1)+'/'+date.getFullYear()}
    return{time:pad(date.getHours())+':'+pad(date.getMinutes()),date:formatted};
  }

  function updateClock(){
    var parts=dateParts();
    var timeIds=['time','menu-time'];
    var dateIds=['date','menu-date'];
    var i,element;
    for(i=0;i<timeIds.length;i++){element=byId(timeIds[i]);if(element){element.textContent=parts.time}}
    for(i=0;i<dateIds.length;i++){element=byId(dateIds[i]);if(element){element.textContent=parts.date}}
  }

  var dictionary={
    ar:{
      welcome:'أهلًا بك في هدب',subtitle:'إقامة هادئة وتجربة رقمية صُممت لتكون كل خدمات الفندق بين يديك.',enter:'الدخول إلى خدمات الفندق',
      room:'الغرفة',roomSummary:'رقم الغرفة',guest:'مرحبًا',online:'الخدمات متصلة',stayReady:'إقامتك جاهزة',today:'اليوم في الرياض',
      weather:'أجواء صافية',weatherRange:'العظمى 35° · الصغرى 23°',prayer:'الصلاة القادمة',prayerName:'الظهر',prayerCity:'حسب توقيت الرياض',
      concierge:'خدمة الضيوف',conciergeTitle:'نحن هنا لخدمتك طوال اليوم',continue:'استخدم الأسهم ثم اضغط موافق للمتابعة',
      menuWelcome:'مرحبًا بك',menuSubtitle:'كل خدمات إقامتك في مكان واحد',available:'متاح الآن',diningHours:'حتى 11 مساءً',
      system:'النظام متصل',navigation:'استخدم الأسهم وموافق للتنقل',time:'الوقت',date:'التاريخ',
      tv:'مشاهدة التلفزيون',tvdesc:'قنوات مباشرة بجودة عالية وترتيب مخصص للفندق.',services:'خدمات الغرفة',servicesdesc:'تنظيف، صيانة، مستلزمات وطلبات خاصة.',
      dining:'المطاعم',diningdesc:'قائمة الطعام والطلب المباشر إلى الغرفة.',hotel:'دليل الفندق',hoteldesc:'المرافق، أوقات العمل والمعلومات المهمة.',
      apps:'التطبيقات',appsdesc:'وصول سريع إلى التطبيقات المتاحة.',settings:'الإعدادات',settingsdesc:'اللغة، الصوت وخيارات العرض.',
      messages:'الرسائل',messagesdesc:'رسائل الفندق والعروض المخصصة لإقامتك.'
    },
    en:{
      welcome:'Welcome to HDB',subtitle:'A calm stay and a digital experience that keeps every hotel service within reach.',enter:'Enter hotel services',
      room:'Room',roomSummary:'Room number',guest:'Welcome',online:'Services online',stayReady:'Your stay is ready',today:'Today in Riyadh',
      weather:'Clear skies',weatherRange:'High 35° · Low 23°',prayer:'Next prayer',prayerName:'Dhuhr',prayerCity:'Riyadh local time',
      concierge:'Guest assistance',conciergeTitle:'We are available throughout your stay',continue:'Use the arrows, then press OK to continue',
      menuWelcome:'Welcome',menuSubtitle:'Every part of your stay in one place',available:'Available now',diningHours:'Until 11 PM',
      system:'System online',navigation:'Use arrows and OK to navigate',time:'Time',date:'Date',
      tv:'Live TV',tvdesc:'High-quality live channels arranged for the hotel.',services:'Room services',servicesdesc:'Housekeeping, maintenance, amenities and special requests.',
      dining:'Dining',diningdesc:'Browse menus and order directly to your room.',hotel:'Hotel guide',hoteldesc:'Facilities, opening hours and useful information.',
      apps:'Applications',appsdesc:'Quick access to available applications.',settings:'Settings',settingsdesc:'Language, sound and display preferences.',
      messages:'Messages',messagesdesc:'Hotel messages and personalized offers for your stay.'
    }
  };

  function text(language,key){return(dictionary[language]||dictionary.ar)[key]||key}

  function setText(id,value){var element=byId(id);if(element){element.textContent=value}}

  function applyLanguage(language){
    language=language==='en'?'en':'ar';
    safeSet(STORE.lang,language);
    document.documentElement.lang=language;
    document.documentElement.dir=language==='ar'?'rtl':'ltr';

    var mappings={
      'welcome-title':'welcome','welcome-subtitle':'subtitle','enter-label':'enter','room-label':'room','room-summary-label':'roomSummary',
      'guest-label':'guest','online-label':'online','stay-status':'stayReady','today-label':'today','weather-status':'weather','weather-range':'weatherRange',
      'prayer-label':'prayer','prayer-name':'prayerName','prayer-city':'prayerCity','concierge-label':'concierge','concierge-title':'conciergeTitle',
      'continue-label':'continue','time-label':'time','date-label':'date','menu-welcome-label':'menuWelcome','menu-subtitle':'menuSubtitle',
      'menu-room-label':'room','menu-time-label':'time','menu-date-label':'date','available-label':'available','dining-hours':'diningHours',
      'system-label':'system','navigation-label':'navigation','tile-tv-title':'tv','tile-tv-desc':'tvdesc','tile-services-title':'services',
      'tile-services-desc':'servicesdesc','tile-dining-title':'dining','tile-dining-desc':'diningdesc','tile-hotel-title':'hotel',
      'tile-hotel-desc':'hoteldesc','tile-apps-title':'apps','tile-apps-desc':'appsdesc','tile-settings-title':'settings',
      'tile-settings-desc':'settingsdesc','tile-messages-title':'messages','tile-messages-desc':'messagesdesc'
    };

    for(var id in mappings){if(Object.prototype.hasOwnProperty.call(mappings,id)){setText(id,text(language,mappings[id]))}}
    updateClock();
  }

  function hydrateGuest(){
    var room=safeGet(STORE.room,'1208');
    var guest=safeGet(STORE.guest,getLanguage()==='ar'?'ضيف الفندق':'Hotel Guest');
    var roomIds=['room-number','room-number-copy','menu-room','service-room'];
    var guestIds=['guest-name','menu-guest'];
    var i,element;
    for(i=0;i<roomIds.length;i++){element=byId(roomIds[i]);if(element){element.textContent=room}}
    for(i=0;i<guestIds.length;i++){element=byId(guestIds[i]);if(element){element.textContent=guest}}
  }

  function isVisible(element){
    if(!element){return false}
    var rect=element.getBoundingClientRect();
    return rect.width>0&&rect.height>0&&window.getComputedStyle(element).visibility!=='hidden';
  }

  function focusables(){
    var all=document.querySelectorAll(focusSelector);
    var list=[];
    for(var i=0;i<all.length;i++){if(isVisible(all[i])&&!all[i].disabled){list.push(all[i])}}
    return list;
  }

  function center(element){
    var rect=element.getBoundingClientRect();
    return{x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  }

  function directionalCandidate(direction){
    var list=focusables();
    if(!list.length){return null}
    var current=document.activeElement;
    if(list.indexOf(current)===-1){return list[0]}
    var origin=center(current);
    var best=null;
    var bestScore=Infinity;

    for(var i=0;i<list.length;i++){
      var candidate=list[i];
      if(candidate===current){continue}
      var point=center(candidate);
      var dx=point.x-origin.x;
      var dy=point.y-origin.y;
      var primary=0;
      var cross=0;
      var valid=false;

      if(direction==='left'&&dx<-8){primary=-dx;cross=Math.abs(dy);valid=true}
      if(direction==='right'&&dx>8){primary=dx;cross=Math.abs(dy);valid=true}
      if(direction==='up'&&dy<-8){primary=-dy;cross=Math.abs(dx);valid=true}
      if(direction==='down'&&dy>8){primary=dy;cross=Math.abs(dx);valid=true}
      if(!valid){continue}

      var score=primary+(cross*2.15)+(cross>primary*1.8?1000:0);
      if(score<bestScore){bestScore=score;best=candidate}
    }
    return best;
  }

  function moveFocus(direction){
    var target=directionalCandidate(direction);
    if(target){target.focus()}
  }

  function linkedAncestor(element){
    while(element&&element!==document.body){
      if(element.getAttribute&&element.getAttribute('data-link')){return element}
      element=element.parentNode;
    }
    return null;
  }

  function activate(element){
    if(!element){return}
    var target=linkedAncestor(element)||element;
    var link=target.getAttribute?target.getAttribute('data-link')||target.getAttribute('href'):'';
    if(link){window.location.href=link;return}
    if(typeof target.click==='function'){target.click()}
  }

  function registerTizenKeys(){
    try{
      if(window.tizen&&tizen.tvinputdevice&&tizen.tvinputdevice.registerKeyBatch){
        tizen.tvinputdevice.registerKeyBatch(['ColorF0Red','ColorF1Green','ColorF2Yellow','ColorF3Blue','MediaPlay','MediaPause','MediaStop']);
      }
    }catch(error){}
  }

  function bindRemote(){
    document.addEventListener('keydown',function(event){
      var key=event.keyCode||event.which;
      if(key===37){event.preventDefault();moveFocus('left')}
      else if(key===39){event.preventDefault();moveFocus('right')}
      else if(key===38){event.preventDefault();moveFocus('up')}
      else if(key===40){event.preventDefault();moveFocus('down')}
      else if(key===13){event.preventDefault();activate(document.activeElement)}
      else if(key===10009||key===8){
        if(window.location.pathname.indexOf('menu.html')===-1&&window.location.pathname.slice(-1)!=='/'){event.preventDefault();window.history.back()}
      }
    });

    document.addEventListener('focusin',function(event){if(event.target&&event.target.classList){event.target.classList.add('focused')}});
    document.addEventListener('focusout',function(event){if(event.target&&event.target.classList){event.target.classList.remove('focused')}});
  }

  function bindActions(){
    var enter=byId('ok-btn');
    if(enter){enter.addEventListener('click',function(){window.location.href='menu.html'})}
    var arabic=byId('btn-ar');
    if(arabic){arabic.addEventListener('click',function(){applyLanguage('ar');hydrateGuest()})}
    var english=byId('btn-en');
    if(english){english.addEventListener('click',function(){applyLanguage('en');hydrateGuest()})}
    document.addEventListener('click',function(event){
      var tile=linkedAncestor(event.target);
      if(tile){var link=tile.getAttribute('data-link');if(link){window.location.href=link}}
    });
  }

  function loadPublishedExperience(){
    if(!window.XMLHttpRequest){return}
    try{
      var request=new XMLHttpRequest();
      request.open('GET','api/?resource=state',true);
      request.timeout=1500;
      request.onreadystatechange=function(){
        if(request.readyState!==4||request.status<200||request.status>=300){return}
        try{
          var response=JSON.parse(request.responseText||'{}');
          var experience=response.data&&response.data.experience?response.data.experience:null;
          if(!experience){return}
          if(experience.title){setText('welcome-title',experience.title)}
          if(experience.subtitle){setText('welcome-subtitle',experience.subtitle)}
          if(experience.primary_color){document.documentElement.style.setProperty('--gold',experience.primary_color)}
        }catch(error){}
      };
      request.send();
    }catch(error){}
  }

  function initialFocus(){
    var target=document.querySelector('.primary-action,.service-tile,.focusable');
    if(target){target.focus()}
  }

  function boot(){
    absorbQueryGuest();
    hydrateGuest();
    applyLanguage(getLanguage());
    updateClock();
    window.setInterval(updateClock,30000);
    registerTizenKeys();
    bindActions();
    bindRemote();
    loadPublishedExperience();
    window.setTimeout(initialFocus,120);
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot)}else{boot()}
})();
