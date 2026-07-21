(function(){'use strict';
var form=document.getElementById('auth-form');
var title=document.getElementById('form-title');
var note=document.getElementById('setup-note');
var nameField=document.getElementById('name-field');
var nameInput=document.getElementById('name');
var username=document.getElementById('username');
var password=document.getElementById('password');
var submit=document.getElementById('submit-btn');
var message=document.getElementById('auth-message');
var setupMode=false;

function setMessage(text,good){message.textContent=text||'';message.classList.toggle('good',!!good)}
function api(url,options){options=options||{};options.credentials='same-origin';options.headers=Object.assign({'Content-Type':'application/json'},options.headers||{});return fetch(url,options).then(function(r){return r.json().catch(function(){return{ok:false,error:'Invalid server response'}}).then(function(data){data.httpStatus=r.status;return data})})}
function configureMode(configured){setupMode=!configured;title.textContent=setupMode?'إنشاء حساب المالك':'تسجيل الدخول';note.hidden=!setupMode;nameField.hidden=!setupMode;nameInput.required=setupMode;password.autocomplete=setupMode?'new-password':'current-password';submit.textContent=setupMode?'إنشاء الحساب وتشغيل النظام':'دخول إلى مركز القيادة'}
function inspect(){api('../api/auth.php?action=session').then(function(data){if(data.authenticated){location.replace('index.html');return}configureMode(data.configured!==false)}).catch(function(){setMessage('تعذر الاتصال بالـAPI. تأكد من تشغيل Apache وPHP.')})}
form.addEventListener('submit',function(e){e.preventDefault();setMessage('');submit.disabled=true;var payload={username:username.value.trim(),password:password.value};if(setupMode)payload.name=nameInput.value.trim();var url=setupMode?'../api/setup.php':'../api/auth.php?action=login';api(url,{method:'POST',body:JSON.stringify(payload)}).then(function(data){if(!data.ok)throw new Error(data.error||'فشل تسجيل الدخول');setMessage('تم التحقق بنجاح، جاري فتح مركز القيادة…',true);setTimeout(function(){location.replace('index.html')},250)}).catch(function(err){setMessage(err.message||'تعذر تسجيل الدخول')}).finally(function(){submit.disabled=false})});
inspect();
})();
