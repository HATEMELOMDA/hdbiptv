(function(){'use strict';
var style=document.createElement('link');style.rel='stylesheet';style.href='enterprise.css';document.head.appendChild(style);
var KEY='hdb_control_state_v11';
var originalSetItem=localStorage.setItem.bind(localStorage);
var syncTimer=null;
var authenticated=false;
var applyingRemote=false;

function status(text,type){var el=document.getElementById('sync-status');if(!el)return;el.textContent=text;el.className='sync-status '+(type||'')}
function scheduleSync(value){if(!authenticated||applyingRemote)return;clearTimeout(syncTimer);status('تغييرات غير محفوظة','pending');syncTimer=setTimeout(function(){var state;try{state=JSON.parse(value||localStorage.getItem(KEY)||'null')}catch(e){state=null}if(!state)return;status('جاري المزامنة…','working');HDBApi.saveState(state).then(function(data){if(!data.ok)throw new Error(data.error||'تعذر الحفظ');status('متزامن مع الخادم','good')}).catch(function(err){status('تعذر المزامنة','bad');console.error(err)})},600)}

localStorage.setItem=function(key,value){originalSetItem(key,value);if(key===KEY)scheduleSync(value)};

function hasOperationalData(state){return state&&(['rooms','devices','channels'].some(function(k){return Array.isArray(state[k])&&state[k].length>0}))}
function attachUser(user){var name=document.getElementById('current-user-name');var role=document.getElementById('current-user-role');if(name)name.textContent=user&&user.name?user.name:'مستخدم النظام';if(role)role.textContent=user&&user.role?user.role:'operator'}
function bindLogout(){var btn=document.getElementById('logout-btn');if(!btn)return;btn.addEventListener('click',function(){btn.disabled=true;HDBApi.logout().finally(function(){location.replace('login.html')})})}
function syncInitial(){return HDBApi.getState().then(function(result){if(!result.ok)throw new Error(result.error||'Unable to load state');var remote=result.data||{};var local=null;try{local=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}if(hasOperationalData(remote)){var remoteJson=JSON.stringify(remote);if(localStorage.getItem(KEY)!==remoteJson){applyingRemote=true;originalSetItem(KEY,remoteJson);applyingRemote=false;if(sessionStorage.getItem('hdb_enterprise_boot')!=='1'){sessionStorage.setItem('hdb_enterprise_boot','1');location.reload();return false}}status('متزامن مع الخادم','good');return true}if(local){return HDBApi.saveState(local).then(function(saved){if(!saved.ok)throw new Error(saved.error||'Unable to seed server');status('تم تهيئة قاعدة البيانات','good');return true})}status('جاهز للتهيئة','pending');return true})}
function boot(){status('جاري التحقق…','working');HDBApi.session().then(function(session){if(!session.configured){location.replace('login.html');return}if(!session.authenticated){location.replace('login.html');return}authenticated=true;attachUser(session.user);bindLogout();return syncInitial()}).catch(function(err){console.error(err);status('الخادم غير متاح','bad')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
