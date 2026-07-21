(function(){'use strict';
var EXPERIENCE_URL='api/index.php?resource=experience';
function byId(id){return document.getElementById(id)}
function apply(data){if(!data||typeof data!=='object')return;try{localStorage.setItem('hdb_experience',JSON.stringify(data))}catch(e){}if(data.color||data.primary_color)document.documentElement.style.setProperty('--gold',data.color||data.primary_color);var title=byId('welcome-title');if(title&&data.title)title.textContent=data.title;var subtitle=byId('welcome-subtitle');if(subtitle&&data.subtitle)subtitle.textContent=data.subtitle;var brand=document.querySelector('.hdb-brand-copy strong');if(brand&&data.hotel)brand.textContent=data.hotel.toUpperCase();document.dispatchEvent(new CustomEvent('hdb:experience',{detail:data}))}
function load(){var xhr=new XMLHttpRequest();xhr.open('GET',EXPERIENCE_URL,true);xhr.timeout=3500;xhr.onreadystatechange=function(){if(xhr.readyState!==4)return;if(xhr.status>=200&&xhr.status<300){try{var response=JSON.parse(xhr.responseText);if(response&&response.ok)apply(response.data)}catch(e){}}};try{xhr.send()}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
