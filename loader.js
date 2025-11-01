(function(){
  const MSG = document.getElementById('msg');
  const HOSTS = [
    // عدّل الـ IP/دومين أدناه
    'https://192.168.1.11/HDBIPTV/',
    'http://192.168.1.11/HDBIPTV/'
  ];
  const PING = '_=' + Date.now();
  let idx = 0;

  function setMsg(s){ MSG.textContent = s; }

  async function tryHost(url){
    // نحاول الوصول لصفحة index مع bust
    const ping = url + 'index.html?' + PING;
    try{
      const r = await fetch(ping, { cache:'no-store', mode:'cors' });
      if (!r.ok) throw 0;
      // فتح التطبيق الحقيقي
      location.replace(url);
      return true;
    }catch(e){
      return false;
    }
  }

  async function boot(){
    setMsg('Checking server…');
    for (idx=0; idx<HOSTS.length; idx++){
      const ok = await tryHost(HOSTS[idx]);
      if (ok) return;
    }
    setMsg('Failed to load. Retrying in 3s…');
    setTimeout(boot, 3000);
  }

  document.addEventListener('keydown', (e)=>{
    // Back/Escape يغلق التطبيق
    if ([8,27,10009,10182,461].includes(e.keyCode)) {
      try { tizen.application.getCurrentApplication().exit(); } catch {}
    }
  });

  boot();
})();