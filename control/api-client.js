(function(global){'use strict';
var csrf='';
var user=null;
function parse(response){return response.json().catch(function(){return{ok:false,error:'Invalid JSON response'}}).then(function(data){if(!response.ok&&data.ok!==false)data.ok=false;data.httpStatus=response.status;return data})}
function request(url,options){options=options||{};var headers=Object.assign({'Accept':'application/json'},options.headers||{});if(options.body&&typeof options.body!=='string'){headers['Content-Type']='application/json';options.body=JSON.stringify(options.body)}if(csrf&&!/^(GET|HEAD|OPTIONS)$/i.test(options.method||'GET'))headers['X-HDB-CSRF']=csrf;options.headers=headers;options.credentials='same-origin';return fetch(url,options).then(parse).then(function(data){if(data.httpStatus===401){user=null;csrf=''}return data})}
function session(){return request('../api/auth.php?action=session').then(function(data){if(data.ok){user=data.user||null;csrf=data.csrf||''}return data})}
function getState(){return request('../api/index.php?resource=state')}
function saveState(state){return request('../api/index.php?resource=state',{method:'PUT',body:{data:state}})}
function publishExperience(data){return request('../api/index.php?resource=experience',{method:'PUT',body:data})}
function logout(){return request('../api/auth.php?action=logout',{method:'POST',body:{}}).then(function(data){user=null;csrf='';return data})}
function currentUser(){return user}
global.HDBApi={request:request,session:session,getState:getState,saveState:saveState,publishExperience:publishExperience,logout:logout,currentUser:currentUser};
})(window);
