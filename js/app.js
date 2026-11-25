/* Comportamiento general: vistas, menú, modo claro/oscuro, accesibilidad, formulario de Contáctenos, Mesa de Partes de demostración y ampliación de imágenes. */
var V=[].slice.call(document.querySelectorAll('.view')),N=document.getElementById('nav'),B=document.getElementById('mb');
/* Directorio, equipo interdisciplinario y funciones ahora son apartados de "Nuestro equipo" (#equipo); sus enlaces antiguos siguen funcionando. */
var ALIAS={directorio:'s-directorio',interdisciplinario:'s-interdisciplinario',funciones:'s-funciones'};
function go(){var h=(location.hash||'#inicio').slice(1),sec=ALIAS[h];if(sec)h='equipo';var t=document.getElementById(h);if(!t||!t.classList.contains('view')){h='inicio';t=document.getElementById(h)}
V.forEach(function(v){v.classList.toggle('on',v===t)});
[].forEach.call(document.querySelectorAll('nav a'),function(a){if(a.getAttribute('href')==='#'+h)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
cl();N.classList.remove('open');B.setAttribute('aria-expanded','false');window.scrollTo(0,0);var f=t.querySelector('h1');if(f){f.setAttribute('tabindex','-1');f.focus({preventScroll:true})}if(sec){var x=document.getElementById(sec);if(x)x.scrollIntoView()}}
addEventListener('hashchange',go);go();
B.onclick=function(){var o=N.classList.toggle('open');B.setAttribute('aria-expanded',o)};
function cl(){[].forEach.call(document.querySelectorAll('li.has.open'),function(l){l.classList.remove('open');l.querySelector('.dd').setAttribute('aria-expanded','false')})}
[].forEach.call(document.querySelectorAll('.dd'),function(b){b.setAttribute('aria-expanded','false');b.onclick=function(e){e.stopPropagation();var l=b.parentNode,o=l.classList.contains('open');cl();if(!o){l.classList.add('open');b.setAttribute('aria-expanded','true')}}});
document.addEventListener('click',cl);document.addEventListener('keydown',function(e){if(e.key==='Escape')cl()});
document.getElementById('y').textContent=new Date().getFullYear();
/* Formulario de Contáctenos: valida y envía la consulta al correo institucional mediante FormSubmit (funciona en GitHub Pages, XAMPP e InfinityFree). */
(function(){var CORREO='cebe.repetti.2020@gmail.com',f=document.getElementById('f');if(!f)return;
function $(i){return document.getElementById(i)}
f.onsubmit=function(e){e.preventDefault();var n=$('n').value.trim(),c=$('c').value.trim(),t=$('t').value.trim(),m=$('m').value.trim(),ok=$('ok'),b=$('fb');
var en=n.length>=3?'':'Escriba sus nombres y apellidos.',ec=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)?'':'Escriba un correo válido.',et=(!t||/^\+?[0-9 ]{9,15}$/.test(t))?'':'Escriba un celular válido (9 dígitos) o deje el campo vacío.',em=m.length>=10?'':'Escriba al menos 10 caracteres.';
$('en').textContent=en;$('ec').textContent=ec;$('et').textContent=et;$('em').textContent=em;ok.textContent='';
if(en||ec||et||em){(en?$('n'):ec?$('c'):et?$('t'):$('m')).focus();return}
if($('hp').value)return;
if(!window.fetch){ok.textContent='Su navegador no permite enviar el formulario. Escríbanos a '+CORREO+'.';return}
b.disabled=true;ok.textContent='Enviando…';
fetch('https://formsubmit.co/ajax/'+CORREO,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
body:JSON.stringify({nombre:n,email:c,celular:t||'No indicó',mensaje:m,_subject:'Consulta desde el portal web: '+n,_template:'table',_captcha:'false'})})
.then(function(r){return r.json().then(function(j){if(!r.ok||j.success===false||j.success==='false')throw new Error(j.message||'HTTP '+r.status)})})
.then(function(){f.reset();ok.textContent='¡Gracias! Su consulta fue enviada. Le responderemos a su correo.'})
.catch(function(){ok.textContent='No se pudo enviar. Inténtelo de nuevo o escríbanos a '+CORREO+' o llame al 052-285707.'})
.then(function(){b.disabled=false})}})();
(function(){var d=document.getElementById('lb'),i=document.getElementById('lbi');function o(f){i.src=f.src;i.alt=f.alt;d.showModal()}
document.addEventListener('click',function(e){var f=e.target.closest&&e.target.closest('[data-zoom]');if(f)o(f);else if(e.target===d||e.target.id==='lbc')d.close()});
document.addEventListener('keydown',function(e){var f=e.target;if((e.key==='Enter'||e.key===' ')&&f.hasAttribute&&f.hasAttribute('data-zoom')){e.preventDefault();o(f)}})})();
(function(){var r=document.documentElement,b=document.getElementById('th'),m=matchMedia('(prefers-color-scheme: dark)');
function cur(){return r.getAttribute('data-theme')||(m.matches?'dark':'light')}
function ui(){var d=cur()==='dark';b.textContent=d?'☀️':'🌙';b.setAttribute('aria-label',d?'Cambiar a modo claro':'Cambiar a modo oscuro')}
try{var t=localStorage.getItem('cebe-theme');if(t==='dark'||t==='light')r.setAttribute('data-theme',t)}catch(e){}
b.onclick=function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('cebe-theme',n)}catch(e){}ui()};ui()})();
(function(){var r=document.documentElement,B=document.getElementById('ab'),P=document.getElementById('ap'),Z=[1,1.15,1.3],N=['Normal','Grande','Muy grande'],st={z:0,hc:0};
try{var j=JSON.parse(localStorage.getItem('cebe-a11y')||'null');if(j){st.z=Math.min(2,Math.max(0,j.z|0));st.hc=j.hc?1:0}}catch(e){}
function up(){r.style.zoom=st.z?Z[st.z]:'';if(st.hc)r.setAttribute('data-hc','1');else r.removeAttribute('data-hc');document.getElementById('hc').setAttribute('aria-pressed',st.hc?'true':'false');document.getElementById('hcs').textContent=st.hc?'Activado':'Desactivado';document.getElementById('zs').textContent=N[st.z];try{localStorage.setItem('cebe-a11y',JSON.stringify(st))}catch(e){}}
function sh(o){P.hidden=!o;B.setAttribute('aria-expanded',o?'true':'false')}
B.onclick=function(e){e.stopPropagation();sh(P.hidden)};P.onclick=function(e){e.stopPropagation()};
document.getElementById('zm').onclick=function(){st.z=Math.max(0,st.z-1);up()};
document.getElementById('zp').onclick=function(){st.z=Math.min(2,st.z+1);up()};
document.getElementById('hc').onclick=function(){st.hc=st.hc?0:1;up()};
document.getElementById('rs').onclick=function(){st.z=0;st.hc=0;up()};
document.addEventListener('click',function(){sh(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!P.hidden){sh(false);B.focus()}});
up()})();
(function(){var f=document.getElementById('mp');if(!f)return;
f.addEventListener('submit',function(e){e.preventDefault();var ok=true;
[['mp-t','Elige un tipo de trámite.'],['mp-n','Escribe tus nombres y apellidos.'],['mp-e','Escribe un correo válido.'],['mp-a','Escribe el asunto.'],['mp-d','Describe tu solicitud (mínimo 10 caracteres).']].forEach(function(x){var v=document.getElementById(x[0]).value.trim(),bad=!v;if(x[0]==='mp-e')bad=!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);if(x[0]==='mp-d')bad=v.length<10;document.getElementById(x[0]+'-er').textContent=bad?x[1]:'';if(bad)ok=false});
var c=document.getElementById('mp-c');document.getElementById('mp-c-er').textContent=c.checked?'':'Debes aceptar el uso de tus datos para continuar.';if(!c.checked)ok=false;
document.getElementById('mp-ok').textContent=ok?'Prototipo: la solicitud no se envió ni se guardó. Aún no se reciben trámites.':''});
document.getElementById('mp-sf').addEventListener('submit',function(e){e.preventDefault();document.getElementById('mp-so').textContent='Prototipo: el seguimiento aún no está disponible.'})})();
