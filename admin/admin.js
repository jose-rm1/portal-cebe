/* Panel de administración del CEBE (Bootstrap 5 + barra lateral).
   Dibuja las pantallas a partir del esquema que entrega el servidor (api/admin.php).
   Todo el texto se inserta con textContent: nunca con innerHTML. */
(function () {
  'use strict';
  var API = '../api/admin.php';
  var S = { csrf: '', user: null, esq: null };
  var V = { n: 'inicio' };
  var app = document.getElementById('app');
  var msg = document.getElementById('msg');
  var ESTADO = { borrador: 'Borrador', pendiente: 'En revisión', publicado: 'Publicado', archivado: 'Archivado' };
  var CLASE_ESTADO = { borrador: 'text-bg-secondary', pendiente: 'text-bg-warning', publicado: 'text-bg-success', archivado: 'text-bg-light border' };
  // Secciones que se muestran juntas, con pestañas, bajo una sola entrada del menú.
  var GRUPOS = { calendario_proximas: 'calendario', calendario_items: 'calendario', mision: 'nosotros', historia: 'nosotros' };
  var NOMBRE_GRUPO = { calendario: 'Calendario', nosotros: 'Nosotros' };
  var PESTANA = { calendario_proximas: 'Próximas actividades', calendario_items: 'Calendario cívico', mision: 'Misión y visión', historia: 'Historia' };
  var ICONO = { noticias: 'newspaper', avisos: 'megaphone', calendario_proximas: 'calendar-event', calendario_items: 'calendar3', preguntas: 'question-circle', documentos: 'file-earmark-text', galeria: 'images', directorio: 'people', mision: 'bullseye', historia: 'clock-history' };

  /* ---------- utilidades ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag), k, i, c;
    if (attrs) for (k in attrs) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) continue;
      if (k === 'text') e.textContent = v;
      else if (k === 'on') { for (var ev in v) e.addEventListener(ev, v[ev]); }
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (i = 2; i < arguments.length; i++) {
      c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) {
        if (x === null || x === undefined || x === false) return;
        e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
      });
    }
    return e;
  }
  function ico(n) { return h('i', { 'class': 'bi bi-' + n, 'aria-hidden': 'true' }); }
  function aviso(t, tipo) {
    msg.textContent = t; msg.className = 'alert shadow alert-' + (tipo === 'error' ? 'danger' : 'success');
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { msg.textContent = ''; msg.className = ''; }, 8000);
  }
  async function api(accion, datos) {
    var r = await fetch(API, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': S.csrf },
      body: JSON.stringify(Object.assign({ accion: accion }, datos || {}))
    });
    var j = {};
    try { j = await r.json(); } catch (e) { /* respuesta sin JSON */ }
    if (!r.ok) { var er = new Error(j.error || ('Error ' + r.status)); er.status = r.status; er.campos = j.campos || null; er.data = j; throw er; }
    return j;
  }
  async function falla(e) {
    if (e.status === 401) { S.user = null; S.esq = null; aviso('Tu sesión terminó. Inicia sesión de nuevo.', 'error'); await sesion(); render(); return; }
    if (e.data && e.data.csrf) { await sesion(); }
    aviso(e.message, 'error');
  }
  async function sesion() {
    var r = await fetch(API + '?accion=sesion', { credentials: 'same-origin' });
    var j = await r.json();
    S.csrf = j.csrf; S.user = j.usuario;
  }
  async function cargarEsquema() { S.esq = (await api('esquema')).recursos; }
  // S.sucio = hay cambios sin guardar en el formulario abierto.
  function ir(n, extra) {
    if (S.sucio) {
      dialogo({ titulo: '¿Salir sin guardar?', texto: 'Hiciste cambios en este formulario. Si sales ahora, se perderán.', aceptar: 'Salir sin guardar', peligro: true })
        .then(function (ok) { if (ok) { S.sucio = false; ir(n, extra); } });
      return;
    }
    V = Object.assign({ n: n }, extra || {}); render(); window.scrollTo(0, 0);
  }
  window.addEventListener('beforeunload', function (e) { if (S.sucio) { e.preventDefault(); e.returnValue = ''; } });
  function esAdmin() { return S.user && S.user.rol === 'administradora'; }
  // Contraseña temporal fácil de dictar: dos palabras y un número, por ejemplo "tacna-peru-47".
  // Es solo para el primer ingreso: el sistema obliga a cambiarla.
  var PALABRAS = ['tacna', 'peru', 'sol', 'luna', 'mar', 'rio', 'valle', 'olivo', 'campo', 'arena', 'nube', 'cielo', 'flor', 'rosa',
    'pino', 'lago', 'monte', 'playa', 'verde', 'azul', 'rojo', 'aula', 'libro', 'lapiz', 'casa', 'pan', 'uva', 'maiz', 'arco',
    'faro', 'puente', 'torre', 'plaza', 'parque', 'camino', 'jardin', 'estrella', 'viento', 'alegre', 'amigo'];
  function aleatoria() {
    var b = new Uint32Array(3);
    (window.crypto || window.msCrypto).getRandomValues(b);
    var a = PALABRAS[b[0] % PALABRAS.length], c = PALABRAS[b[1] % PALABRAS.length];
    if (a === c) c = PALABRAS[(b[1] + 1) % PALABRAS.length];
    return a + '-' + c + '-' + (10 + b[2] % 90);
  }

  /* Ventana propia para confirmar o pedir la contraseña (reemplaza las ventanas confirm y prompt del navegador).
     Devuelve una promesa: true al aceptar, el texto escrito si pide contraseña, o false al cancelar. */
  function dialogo(o) {
    return new Promise(function (resolver) {
      var campo = o.clave ? campoSimple('dlg_clave', 'Tu contraseña', 'password', 'current-password') : null;
      if (campo) campo.input.classList.remove('form-control-lg');
      var err = h('div', { 'class': 'text-danger small fw-semibold', role: 'alert' });
      var ok = h('button', { type: 'submit', 'class': 'btn ' + (o.peligro ? 'btn-danger' : 'btn-primary') }, o.aceptar || 'Aceptar');
      var no = h('button', { type: 'button', 'class': 'btn btn-outline-secondary' }, 'Cancelar');
      var f = h('form', { novalidate: true },
        h('h2', { 'class': 'h5 mb-2', id: 'dlg_t', text: o.titulo }),
        o.texto ? h('p', { 'class': 'mb-2', id: 'dlg_d', text: o.texto }) : null,
        campo ? campo.el : null, err,
        h('div', { 'class': 'd-flex justify-content-end flex-wrap gap-2 mt-3' }, no, ok));
      var d = h('dialog', { 'class': 'dialogo', 'aria-labelledby': 'dlg_t', 'aria-describedby': o.texto ? 'dlg_d' : false }, f);
      var vuelta = document.activeElement, valor = false;
      function cerrar(v) { valor = v; d.close(); }
      d.addEventListener('close', function () { d.remove(); if (vuelta && vuelta.focus && document.contains(vuelta)) vuelta.focus(); resolver(valor); });
      no.addEventListener('click', function () { cerrar(false); });
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!campo) return cerrar(true);
        if (!campo.input.value) { err.textContent = 'Escribe tu contraseña.'; campo.input.focus(); return; }
        cerrar(campo.input.value);
      });
      document.body.appendChild(d); d.showModal();
      (campo ? campo.input : (o.peligro ? no : ok)).focus();   // en acciones peligrosas el foco queda en "Cancelar"
    });
  }

  /* Botón "Más" con acciones secundarias. El menú se posiciona fijo para que la tabla no lo recorte. */
  function menuMas(acciones) {
    if (!acciones.length) return null;
    var lista = h('div', { 'class': 'mas-menu', role: 'menu' });
    var d = h('details', { 'class': 'mas' }, h('summary', { 'class': 'btn btn-sm btn-outline-secondary', 'aria-haspopup': 'menu' }, ico('three-dots'), ' Más'), lista);
    acciones.forEach(function (a) {
      lista.appendChild(h('button', { type: 'button', role: 'menuitem', 'class': a.peligro ? 'peligro' : false, on: { click: function () { d.open = false; a.fn(); } } }, a.icono ? ico(a.icono) : null, ' ' + a.t));
    });
    d.ubicar = function () {
      var r = d.firstChild.getBoundingClientRect();
      lista.style.top = (r.bottom + 4) + 'px';
      lista.style.left = Math.max(8, r.right - lista.offsetWidth) + 'px';
      if (r.bottom + 4 + lista.offsetHeight > window.innerHeight) lista.style.top = Math.max(8, r.top - 4 - lista.offsetHeight) + 'px';
    };
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      [].forEach.call(document.querySelectorAll('details.mas[open]'), function (x) { if (x !== d) x.open = false; });
      d.ubicar();
      var b = lista.querySelector('button'); if (b) b.focus({ preventScroll: true });
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.firstChild.focus(); } });
    return d;
  }
  function cerrarMenusMas(e) { [].forEach.call(document.querySelectorAll('details.mas[open]'), function (x) { if (!e || !x.contains(e.target)) x.open = false; }); }
  document.addEventListener('click', cerrarMenusMas);
  // Si la página se desplaza con el menú abierto, el menú acompaña a su botón.
  function reubicarMenusMas() { [].forEach.call(document.querySelectorAll('details.mas[open]'), function (x) { x.ubicar(); }); }
  window.addEventListener('scroll', reubicarMenusMas, true);
  window.addEventListener('resize', reubicarMenusMas);
  function sinTildes(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function badge(est) { return h('span', { 'class': 'badge rounded-pill ' + (CLASE_ESTADO[est] || 'text-bg-secondary'), text: ESTADO[est] || est }); }
  function fecha(s) { return s ? String(s).replace('T', ' ').slice(0, 16) : ''; }
  function boton(txt, fn, cls, icono) { return h('button', { 'class': 'btn ' + (cls || 'btn-primary'), type: 'button', on: { click: fn } }, icono ? ico(icono) : null, icono ? ' ' : null, txt); }
  function tabla(cabeza, cuerpo) {
    return h('div', { 'class': 'card shadow-sm' }, h('div', { 'class': 'table-responsive' }, h('table', { 'class': 'table table-hover align-middle mb-0' },
      h('thead', null, h('tr', null, cabeza.map(function (t) { return h('th', { scope: 'col', text: t }); }))), cuerpo)));
  }
  function titulo(t) { return h('h2', { 'class': 'titulo h3 mb-3', text: t }); }

  /* ---------- estructura con barra lateral ---------- */
  function shell() {
    app.textContent = '';
    var lateral = h('aside', { 'class': 'lateral', id: 'lateral', 'aria-label': 'Menú del panel' });
    var velo = h('div', { 'class': 'velo', on: { click: cerrarMenu } });
    function cerrarMenu() { lateral.classList.remove('abierto'); velo.classList.remove('abierto'); }
    var nav = h('nav', { 'class': 'menu', 'aria-label': 'Secciones' });
    function item(txt, n, icono, extra) {
      var activo = V.n === n && (!extra || V.rec === extra.rec || (V.n === 'form' && V.rec === extra.rec));
      nav.appendChild(h('button', { type: 'button', 'aria-current': activo ? 'page' : false, on: { click: function () { cerrarMenu(); ir(n, extra); } } }, ico(icono), txt));
    }
    item('Resumen', 'inicio', 'grid');
    var recs = Object.keys(S.esq || {});
    if (recs.length) nav.appendChild(h('div', { 'class': 'grupo', text: 'Contenido' }));
    var vistos = {};
    recs.forEach(function (rec) {
      var g = GRUPOS[rec];
      if (!g) return item(S.esq[rec].etiqueta, 'lista', ICONO[rec] || 'file-earmark', { rec: rec });
      if (vistos[g]) return;
      vistos[g] = true;
      var activo = (V.n === 'lista' || V.n === 'form') && GRUPOS[V.rec] === g;
      nav.appendChild(h('button', { type: 'button', 'aria-current': activo ? 'page' : false, on: { click: function () { cerrarMenu(); ir('lista', { rec: rec }); } } }, ico(ICONO[rec] || 'calendar3'), NOMBRE_GRUPO[g]));
    });
    nav.appendChild(h('div', { 'class': 'grupo', text: 'Administración' }));
    if (esAdmin()) { item('Usuarios', 'usuarios', 'person-gear'); item('Registro', 'registro', 'clock-history'); }
    item('Mi cuenta', 'cuenta', 'person-circle');
    var rol = esAdmin() ? (S.user.principal ? 'Administradora principal' : 'Administradora') : 'Editora';
    lateral.appendChild(h('div', { 'class': 'marca' }, h('img', { src: '../img/logo.png', alt: '' }), h('div', null, h('strong', { text: 'CEBE “FCR”' }), h('small', { text: esAdmin() ? 'Panel administrador' : 'Panel de edición' }))));
    lateral.appendChild(nav);
    lateral.appendChild(h('div', { 'class': 'pie-lateral' },
      h('div', { 'class': 'quien' }, h('strong', { text: S.user.nombre }), rol),
      h('a', { href: '../', target: '_blank', rel: 'noopener' }, ico('box-arrow-up-right'), 'Ver el sitio'),
      h('button', { type: 'button', 'class': 'salir', on: { click: salir } }, ico('box-arrow-left'), 'Cerrar sesión')));
    var main = h('main', { id: 'vista', tabindex: '-1' });
    var movil = h('header', { 'class': 'barra-movil' },
      h('button', { type: 'button', 'aria-label': 'Abrir el menú', 'aria-controls': 'lateral', on: { click: function () { lateral.classList.add('abierto'); velo.classList.add('abierto'); } } }, ico('list')),
      h('img', { src: '../img/logo.png', alt: '' }), h('strong', { text: 'Panel del CEBE' }));
    app.appendChild(h('div', { 'class': 'panel' }, lateral, h('div', { 'class': 'cuerpo' }, movil, main), velo));
    return main;
  }
  async function salir() {
    if (S.sucio && !(await dialogo({ titulo: '¿Cerrar sesión sin guardar?', texto: 'Hiciste cambios en este formulario. Si cierras sesión, se perderán.', aceptar: 'Cerrar sesión', peligro: true }))) return;
    S.sucio = false;
    try { var j = await api('logout'); S.csrf = j.csrf; } catch (e) { /* ya sin sesión */ }
    S.user = null; S.esq = null; await sesion(); V = { n: 'inicio' }; render();
  }
  function render() {
    S.sucio = false;
    if (!S.user) return vLogin();
    if (S.user.debe_cambiar_clave) return vClave(true);
    var main = shell();
    var f = { inicio: vInicio, lista: vLista, form: vForm, usuarios: vUsuarios, registro: vRegistro, cuenta: function (m) { vClave(false, m); } }[V.n] || vInicio;
    f(main);
    main.focus();
  }

  /* ---------- acceso ---------- */
  function campoSimple(id, etiqueta, tipo, auto) {
    var i = h('input', { type: tipo, id: id, 'class': 'form-control form-control-lg', autocomplete: auto, autocapitalize: 'none', spellcheck: 'false' });
    var control = i;
    if (tipo === 'password') {
      // Botón "ver contraseña": solo el ícono del ojo (SVG propio, no depende del CDN de íconos).
      var OJO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      var OJO_TACHADO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      var ojo = h('button', { type: 'button', 'class': 'btn btn-outline-secondary btn-ojo', 'aria-controls': id, 'aria-label': 'Mostrar contraseña', 'aria-pressed': 'false', title: 'Mostrar contraseña' });
      ojo.innerHTML = OJO;
      ojo.addEventListener('click', function () {
        var ver = i.type === 'password';
        i.type = ver ? 'text' : 'password';
        var t = ver ? 'Ocultar contraseña' : 'Mostrar contraseña';
        ojo.title = t; ojo.setAttribute('aria-label', t); ojo.setAttribute('aria-pressed', ver ? 'true' : 'false');
        ojo.innerHTML = ver ? OJO_TACHADO : OJO;
        i.focus();
      });
      // Al enviar el formulario, la contraseña vuelve a ocultarse.
      i.ocultar = function () { if (i.type !== 'password') ojo.click(); };
      control = h('div', { 'class': 'input-group' }, i, ojo);
    }
    return { input: i, el: h('div', { 'class': 'mb-3 text-start' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: etiqueta }), control) };
  }
  function vLogin() {
    app.textContent = '';
    var u = campoSimple('l_u', 'Usuario', 'text', 'username'), c = campoSimple('l_c', 'Contraseña', 'password', 'current-password');
    var err = h('div', { 'class': 'text-danger fw-semibold mb-3', role: 'alert' });
    var f = h('form', { novalidate: true }, u.el, c.el, err,
      h('button', { 'class': 'btn btn-primary btn-lg w-100', type: 'submit' }, ico('box-arrow-in-right'), ' Ingresar'));
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault(); err.textContent = ''; c.input.ocultar();
      if (!u.input.value.trim() || !c.input.value) { err.textContent = 'Escribe tu usuario y tu contraseña.'; return; }
      try {
        var j = await api('login', { usuario: u.input.value, clave: c.input.value });
        S.csrf = j.csrf; S.user = j.usuario;
        if (!S.user.debe_cambiar_clave) await cargarEsquema();
        V = { n: 'inicio' }; render();
      } catch (e) { c.input.value = ''; err.textContent = e.message; }
    });
    app.appendChild(h('div', { 'class': 'login' }, h('div', { 'class': 'login-caja text-center' },
      h('img', { 'class': 'logo mb-3', src: '../img/logo.png', alt: 'Logotipo del CEBE FCR Tacna' }),
      h('h1', { text: 'Panel de administración' }),
      h('p', { 'class': 'text-secondary mb-4', text: 'CEBE Félix y Carolina de Repetti · Tacna' }),
      f,
      h('p', { 'class': 'text-secondary small mt-4', text: 'Si olvidaste tu contraseña, pide a una administradora que la restablezca.' }),
      h('p', { 'class': 'small' }, h('a', { href: '../', text: 'Volver al sitio' })))));
    u.input.focus();
  }

  function vClave(forzada, main) {
    var cont = main || app;
    if (!main) app.textContent = '';
    var a = campoSimple('c_a', 'Contraseña actual', 'password', 'current-password');
    var n = campoSimple('c_n', 'Contraseña nueva', 'password', 'new-password');
    var r = campoSimple('c_r', 'Repite la contraseña nueva', 'password', 'new-password');
    [a, n, r].forEach(function (x) { x.input.classList.remove('form-control-lg'); });
    var err = h('div', { 'class': 'text-danger fw-semibold mb-3', role: 'alert' });
    var f = h('form', { novalidate: true },
      h('p', { 'class': 'text-secondary', text: forzada ? 'Por seguridad, cambia la contraseña temporal antes de continuar.' : 'Usuario: ' + S.user.usuario }),
      a.el, n.el, h('div', { 'class': 'form-text mb-3', text: 'Mínimo 8 caracteres. No uses tu usuario, solo números ni una contraseña muy común.' }), r.el, err,
      h('button', { 'class': 'btn btn-primary', type: 'submit' }, ico('check2'), ' Guardar contraseña'));
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault(); err.textContent = ''; [a, n, r].forEach(function (x) { x.input.ocultar(); });
      if (n.input.value !== r.input.value) { err.textContent = 'Las contraseñas nuevas no coinciden.'; return; }
      try {
        var j = await api('cambiar_clave', { actual: a.input.value, nueva: n.input.value });
        S.csrf = j.csrf; await sesion();
        if (S.user && !S.esq) await cargarEsquema();
        aviso('Contraseña actualizada.');
        V = { n: 'inicio' }; render();
      } catch (e) { err.textContent = e.message; }
    });
    if (forzada) {
      cont.appendChild(h('div', { 'class': 'login' }, h('div', { 'class': 'login-caja' },
        h('div', { 'class': 'text-center' }, h('img', { 'class': 'logo mb-3', src: '../img/logo.png', alt: 'Logotipo del CEBE FCR Tacna' }), h('h1', { text: 'Crea tu contraseña nueva' })), f)));
      a.input.focus();
    } else {
      cont.appendChild(titulo('Mi cuenta'));
      cont.appendChild(h('div', { 'class': 'card shadow-sm' }, h('div', { 'class': 'card-body', style: 'max-width:520px' }, f)));
    }
  }

  /* ---------- inicio ---------- */
  async function vInicio(main) {
    main.appendChild(titulo('Hola, ' + S.user.nombre));
    try {
      var r = await api('resumen');
      var fila = h('div', { 'class': 'row g-3 mb-4' });
      Object.keys(r.recursos).forEach(function (rec) {
        var d = r.recursos[rec], c = d.conteo;
        fila.appendChild(h('div', { 'class': 'col-12 col-md-6 col-xl-4' }, h('div', { 'class': 'card shadow-sm h-100' }, h('div', { 'class': 'card-body d-flex flex-column' },
          h('h3', { 'class': 'h5 text-primary' }, ico(ICONO[rec] || 'file-earmark'), ' ' + d.etiqueta),
          h('p', { 'class': 'mb-3' }, h('span', { 'class': 'badge rounded-pill text-bg-success me-1', text: c.publicado + ' publicados' }),
            h('span', { 'class': 'badge rounded-pill text-bg-warning me-1', text: c.pendiente + ' en revisión' }),
            h('span', { 'class': 'badge rounded-pill text-bg-secondary', text: c.borrador + ' borradores' })),
          h('div', { 'class': 'mt-auto' }, boton('Abrir', function () { ir('lista', { rec: rec }); }, 'btn-sm btn-outline-primary'))))));
      });
      main.appendChild(fila);
      if (r.pendientes.length) {
        main.appendChild(h('h3', { 'class': 'h5 text-primary mb-2', text: 'Esperando revisión' }));
        var lg = h('div', { 'class': 'list-group shadow-sm mb-4' });
        r.pendientes.forEach(function (p) {
          lg.appendChild(h('a', { href: '#', 'class': 'list-group-item list-group-item-action', on: { click: function (e) { e.preventDefault(); ir('form', { rec: p.recurso, id: p.id }); } } },
            h('strong', { text: p.etiqueta + ': ' }), p.titulo || ('N.º ' + p.id)));
        });
        main.appendChild(lg);
      }
      if (!Object.keys(r.recursos).length) main.appendChild(h('div', { 'class': 'alert alert-info', text: 'Todavía no tienes secciones asignadas. Pide a una administradora que te dé permisos.' }));
    } catch (e) { falla(e); }
  }

  /* ---------- listas ---------- */
  async function vLista(main) {
    var rec = V.rec, d = S.esq[rec];
    if (!d) { main.appendChild(h('div', { 'class': 'alert alert-warning', text: 'No tienes permiso para esta sección.' })); return; }
    var filtro = V.estado || '';
    var sel = h('select', { id: 'f_estado', 'class': 'form-select w-auto', 'aria-label': 'Filtrar por estado' }, h('option', { value: '', text: 'Todos los estados' }));
    Object.keys(ESTADO).forEach(function (k) { sel.appendChild(h('option', { value: k, text: ESTADO[k], selected: k === filtro })); });
    sel.addEventListener('change', function () { V.estado = sel.value; render(); });
    var grupo = GRUPOS[rec];
    main.appendChild(titulo(grupo ? NOMBRE_GRUPO[grupo] : d.etiqueta));
    if (grupo) {
      var tabs = h('div', { 'class': 'nav nav-tabs mb-3 pestanas', role: 'tablist' });
      Object.keys(S.esq).filter(function (r) { return GRUPOS[r] === grupo; }).forEach(function (r) {
        var act = r === rec;
        tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': act ? 'true' : 'false', 'class': 'nav-link' + (act ? ' active' : ''),
          on: { click: function () { if (r !== rec) { V.q = ''; V.estado = ''; ir('lista', { rec: r }); } } } }, PESTANA[r] || S.esq[r].etiqueta));
      });
      main.appendChild(tabs);
    }
    var buscar = h('input', { type: 'search', id: 'f_buscar', 'class': 'form-control buscar', placeholder: 'Buscar…', 'aria-label': 'Buscar en ' + d.etiqueta, autocomplete: 'off' });
    buscar.value = V.q || '';
    var cuenta = h('span', { 'class': 'text-secondary small', role: 'status', 'aria-live': 'polite' });
    main.appendChild(h('div', { 'class': 'd-flex flex-wrap gap-2 align-items-center mb-3' },
      boton('Nuevo', function () { ir('form', { rec: rec, id: 0 }); }, 'btn-primary', 'plus-lg'), buscar, sel, cuenta));
    try {
      var j = await api('listar', { recurso: rec, estado: filtro });
      if (!j.filas.length) { main.appendChild(h('div', { 'class': 'alert alert-light border', text: 'No hay elementos para mostrar.' })); return; }
      var tb = h('tbody'), filas = [];
      // Flechas ↑ ↓: solo administradoras, en secciones ordenables y sin filtro de estado (para no saltar elementos ocultos).
      var conFlechas = d.mover && esAdmin() && !filtro;
      j.filas.forEach(function (f, i) {
        var ant = j.filas[i - 1], sig = j.filas[i + 1];
        var pos = conFlechas ? { primero: !ant || ant.grupo !== f.grupo, ultimo: !sig || sig.grupo !== f.grupo } : null;
        var tr = filaLista(rec, d, f, pos);
        tr.dataset.texto = sinTildes(d.columnas.map(function (c) { var v = f.celdas[c.n]; return c.op && c.op[v] ? c.op[v] : v; }).join(' '));
        filas.push(tr); tb.appendChild(tr);
      });
      var nada = h('tr', { hidden: true }, h('td', { colspan: String(d.columnas.length + (conFlechas ? 4 : 3)), 'class': 'text-center text-secondary py-4', text: 'No hay coincidencias con la búsqueda.' }));
      tb.appendChild(nada);
      // Filtra en la misma página, sin volver a pedir los datos al servidor.
      var filtrar = function () {
        V.q = buscar.value;
        var q = sinTildes(buscar.value.trim()), n = 0;
        filas.forEach(function (tr) { var ver = !q || tr.dataset.texto.indexOf(q) > -1; tr.hidden = !ver; if (ver) n++; });
        nada.hidden = n > 0;
        cuenta.textContent = q ? n + (n === 1 ? ' resultado' : ' resultados') : '';
      };
      buscar.addEventListener('input', filtrar); filtrar();
      if (d.mover && esAdmin()) main.appendChild(h('p', { 'class': 'text-secondary small mb-2' }, ico('arrow-down-up'),
        filtro ? ' Para cambiar el orden con las flechas, elige "Todos los estados".'
               : ' Usa las flechas para cambiar el orden en el sitio.' + (d.mover_dentro ? ' Se mueven dentro de su mismo grupo.' : '') + ' Los nuevos se agregan al final.'));
      main.appendChild(tabla((conFlechas ? ['Orden'] : []).concat(d.columnas.map(function (c) { return c.e; })).concat(['Estado', 'Actualizado', 'Acciones']), tb));
      if (V.foco) {   // tras mover, el foco vuelve a la flecha del mismo elemento (o a la otra si llegó al extremo)
        var bf = main.querySelector('[data-foco="' + V.foco + '"]');
        if (bf && bf.disabled) bf = bf.parentNode.querySelector('button:not([disabled])');
        V.foco = null; if (bf) bf.focus();
      }
    } catch (e) { falla(e); }
  }
  function filaLista(rec, d, f, pos) {
    var celdas = d.columnas.map(function (c) { var v = f.celdas[c.n]; return h('td', { text: c.op && c.op[v] ? c.op[v] : v }); });
    var nombre = f.celdas[d.columnas[0].n] || 'este elemento';
    var flechas = null;
    if (pos) {
      var mover = function (dir) {
        return async function () {
          try { await api('mover', { recurso: rec, id: f.id, dir: dir }); V.foco = f.id + '-' + dir; render(); } catch (e) { falla(e); }
        };
      };
      flechas = h('td', { 'class': 'flechas' },
        h('button', { type: 'button', 'class': 'btn btn-sm btn-outline-secondary', 'data-foco': f.id + '-arriba', disabled: pos.primero, title: 'Subir', 'aria-label': 'Subir «' + nombre + '»', on: { click: mover('arriba') } }, '↑'),
        h('button', { type: 'button', 'class': 'btn btn-sm btn-outline-secondary', 'data-foco': f.id + '-abajo', disabled: pos.ultimo, title: 'Bajar', 'aria-label': 'Bajar «' + nombre + '»', on: { click: mover('abajo') } }, '↓'));
    }
    var ac = h('div', { 'class': 'd-flex flex-wrap gap-1 align-items-center' }), mas = [];
    function b(txt, fn) { ac.appendChild(boton(txt, fn, 'btn-sm btn-outline-primary')); }
    var puedeEditar = esAdmin() || f.estado === 'borrador' || f.estado === 'pendiente';
    if (puedeEditar) b('Editar', function () { ir('form', { rec: rec, id: f.id }); });
    function cambiar(nuevo, pregunta) {
      return async function () {
        if (pregunta && !(await dialogo(pregunta))) return;
        try { await api('estado', { recurso: rec, id: f.id, estado: nuevo }); aviso('Estado actualizado.'); render(); } catch (e) { falla(e); }
      };
    }
    // A la vista: Editar y la acción principal. En "Más": archivar y eliminar.
    if (esAdmin()) {
      if (f.estado !== 'publicado') b('Publicar', cambiar('publicado', { titulo: '¿Publicar «' + nombre + '»?', texto: 'Será visible para todos en el sitio.', aceptar: 'Publicar' }));
      if (f.estado === 'publicado') b('Quitar del sitio', cambiar('borrador', { titulo: '¿Quitar «' + nombre + '» del sitio?', texto: 'Volverá a borrador y dejará de verse en el sitio.', aceptar: 'Quitar del sitio' }));
      if (f.estado !== 'archivado') mas.push({ t: 'Archivar', icono: 'archive', fn: cambiar('archivado', { titulo: '¿Archivar «' + nombre + '»?', texto: 'Dejará de verse en el sitio. Podrás publicarlo de nuevo más adelante.', aceptar: 'Archivar' }) });
    } else {
      if (f.estado === 'borrador') b('Enviar a revisión', cambiar('pendiente'));
      if (f.estado === 'pendiente') b('Retirar de revisión', cambiar('borrador'));
    }
    if (esAdmin() || f.estado === 'borrador') {
      mas.push({ t: 'Eliminar', icono: 'trash', peligro: true, fn: async function () {
        if (!(await dialogo({ titulo: '¿Eliminar «' + nombre + '»?', texto: 'Se borrará definitivamente. Esta acción no se puede deshacer.', aceptar: 'Eliminar', peligro: true }))) return;
        try { await api('eliminar', { recurso: rec, id: f.id }); aviso('Elemento eliminado.'); render(); } catch (e) { falla(e); }
      } });
    }
    var m = menuMas(mas); if (m) ac.appendChild(m);
    return h('tr', null, flechas, celdas, h('td', null, badge(f.estado)), h('td', { text: fecha(f.actualizado_en) }), h('td', null, ac));
  }

  /* ---------- formulario genérico ---------- */
  function widget(c, val, pref) {
    var id = 'f_' + pref + c.n, inp, extra = null;
    var err = h('div', { 'class': 'text-danger small fw-semibold', id: id + '_e', role: 'alert' });
    var ayuda = c.ayuda ? h('div', { 'class': 'form-text', text: c.ayuda }) : null;
    if (c.t === 'bool') {
      inp = h('input', { type: 'checkbox', id: id, 'class': 'form-check-input' }); inp.checked = !!val;
      return { n: c.n, c: c, get: function () { return inp.checked; }, err: err, el: h('div', { 'class': 'form-check mb-3' }, inp, h('label', { 'for': id, 'class': 'form-check-label', text: c.e }), ayuda, err) };
    }
    if (c.t === 'largo') { inp = h('textarea', { id: id, rows: '5', 'class': 'form-control', maxlength: c.max || false }); inp.value = val == null ? '' : val; }
    else if (c.t === 'opcion') {
      inp = h('select', { id: id, 'class': 'form-select' });
      if (!c.req) inp.appendChild(h('option', { value: '', text: '—' }));
      Object.keys(c.op).forEach(function (k) { inp.appendChild(h('option', { value: k, text: c.op[k] })); });
      if (val != null && val !== '' && !Object.prototype.hasOwnProperty.call(c.op, String(val)))   // valor antiguo que ya no está en la lista: se muestra para que se elija uno válido
        inp.appendChild(h('option', { value: String(val), text: val + ' (no está en la lista: elige otro)' }));
      inp.value = val == null ? '' : String(val);
      if (c.req && inp.selectedIndex < 0 && inp.options.length) inp.selectedIndex = 0;   // opción obligatoria: empieza en la primera
    }
    else if (c.t === 'mes') {
      var MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      var selM = h('select', { id: id, 'class': 'form-select', 'aria-label': c.e + ': mes' }, h('option', { value: '', text: 'Mes (opcional)' }));
      MES.forEach(function (m) { selM.appendChild(h('option', { value: m, text: m })); });
      var selA = h('select', { id: id + '_a', 'class': 'form-select', 'aria-label': c.e + ': año' }, h('option', { value: '', text: 'Año' }));
      var hoy = new Date().getFullYear();
      for (var an = hoy + 1; an >= 2000; an--) selA.appendChild(h('option', { value: String(an), text: String(an) }));
      var previo = null, mm = /^(?:(\S+) de )?(\d{4})$/.exec(String(val || '').trim());
      if (mm && (!mm[1] || MES.indexOf(mm[1]) > -1)) {
        if (!selA.querySelector('option[value="' + mm[2] + '"]')) selA.appendChild(h('option', { value: mm[2], text: mm[2] }));
        selA.value = mm[2]; selM.value = mm[1] || '';
      } else if (val) previo = h('div', { 'class': 'form-text text-warning-emphasis', text: 'Fecha anterior: "' + val + '". Elige el mes y el año para reemplazarla.' });
      var getMes = function () { if (!selA.value) return ''; return (selM.value ? selM.value + ' de ' : '') + selA.value; };
      return { n: c.n, c: c, get: getMes, err: err, el: h('div', { 'class': 'mb-3' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: c.e + (c.req ? ' *' : '') }),
        h('div', { 'class': 'd-flex flex-wrap gap-2 campo-mes' }, selM, selA), previo, ayuda, err) };
    }
    else if (c.t === 'entero') { inp = h('input', { type: 'number', id: id, 'class': 'form-control' }); inp.value = val == null ? '' : val; }
    else if (c.t === 'fecha') { inp = h('input', { type: 'date', id: id, 'class': 'form-control' }); inp.value = val == null ? '' : val; }
    else if (c.t === 'imagen' || c.t === 'documento' || c.t === 'medio' || c.t === 'imagen_pdf') {
      // Vista previa del archivo (miniatura, video o enlace al PDF). La ruta queda abajo, en pequeño.
      inp = h('input', { type: 'text', id: id, 'class': 'form-control form-control-sm ruta', maxlength: '255', placeholder: 'Aún no hay archivo', 'aria-label': c.e + ': ruta del archivo' }); inp.value = val == null ? '' : val;
      var acepta = { imagen: '.jpg,.jpeg,.png,.webp', documento: '.pdf', medio: '.jpg,.jpeg,.png,.webp,.mp4', imagen_pdf: '.jpg,.jpeg,.png,.webp,.pdf' }[c.t];
      var prev = h('div', { 'class': 'vista-previa-caja' });
      var mostrar = function () {
        var v = inp.value.trim(), ok = /^(img|uploads|video|documentos)\//.test(v);
        prev.textContent = '';
        if (ok && /\.(jpe?g|png|webp)$/i.test(v)) prev.appendChild(h('img', { 'class': 'img-thumbnail vista-previa', src: '../' + v, alt: 'Vista previa' }));
        else if (ok && /\.mp4$/i.test(v)) prev.appendChild(h('video', { 'class': 'vista-previa', src: '../' + v, controls: true, preload: 'metadata', 'aria-label': 'Vista previa del video' }));
        else if (ok && /\.pdf$/i.test(v)) prev.appendChild(h('a', { 'class': 'btn btn-sm btn-outline-primary', href: '../' + v, target: '_blank', rel: 'noopener' }, ico('file-earmark-pdf'), ' Abrir ' + v.split('/').pop()));
        else prev.appendChild(h('div', { 'class': 'text-secondary small', text: 'Aún no hay archivo.' }));
      };
      var arch = h('input', { type: 'file', accept: acepta, 'class': 'form-control form-control-sm mt-2', 'aria-label': 'Subir archivo para ' + c.e });
      arch.addEventListener('change', async function () {
        if (!arch.files[0]) return;
        var fd = new FormData(); fd.append('accion', 'subir'); fd.append('tipo', c.t); fd.append('archivo', arch.files[0]);
        aviso('Subiendo archivo…');
        try {
          var r = await fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': S.csrf }, body: fd });
          var j = await r.json().catch(function () { return {}; });
          if (!r.ok) throw Object.assign(new Error(j.error || 'No se pudo subir el archivo.'), { status: r.status, data: j });
          inp.value = j.ruta; mostrar(); aviso('Archivo subido.');
        } catch (e) { falla(e); }
        arch.value = '';
      });
      inp.addEventListener('input', mostrar); mostrar();
      var wm = { n: c.n, c: c, arch: arch, get: function () { return inp.value; }, err: err };
      wm.el = h('div', { 'class': 'mb-3' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: c.e + (c.req ? ' *' : '') }),
        prev, arch, h('details', { 'class': 'mt-1 ruta-detalle' }, h('summary', { 'class': 'small text-secondary', text: 'Ruta del archivo' }), inp), ayuda, err);
      return wm;
    }
    else { inp = h('input', { type: 'text', id: id, 'class': 'form-control', maxlength: c.max || false }); inp.value = val == null ? '' : val; }
    return { n: c.n, c: c, get: function () { return inp.value; }, err: err, el: h('div', { 'class': 'mb-3' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: c.e + (c.req ? ' *' : '') }), inp, extra, ayuda, err) };
  }

  async function vForm(main) {
    var rec = V.rec, id = V.id || 0, d = S.esq[rec];
    if (!d) { main.appendChild(h('div', { 'class': 'alert alert-warning', text: 'No tienes permiso para esta sección.' })); return; }
    var datos = {}, hijos = {}, estado = 'borrador';
    if (id) {
      try { var o = await api('obtener', { recurso: rec, id: id }); datos = o.datos; hijos = o.hijos; estado = o.estado; } catch (e) { falla(e); return; }
    }
    main.appendChild(titulo((id ? 'Editar' : 'Nuevo') + ': ' + d.etiqueta));
    if (id) main.appendChild(h('p', null, 'Estado: ', badge(estado)));
    if (!esAdmin()) main.appendChild(h('div', { 'class': 'alert alert-info', text: 'Al guardar, el elemento queda como borrador. Cuando esté listo, envíalo a revisión desde la lista.' }));
    var ws = d.campos.map(function (c) { return widget(c, datos[c.n], ''); });
    var cuerpo = h('div', { 'class': 'card-body' }, ws.map(function (w) { return w.el; }));
    // Muestra solo los campos que corresponden (ej.: en Galería, los de foto o los de video según el tipo).
    var seccionesCond = [];
    function aplica(w, val) {
      var si = w.c.si; if (!si) return true;
      return Object.keys(si).every(function (k) { return [].concat(si[k]).map(String).indexOf(String(val[k])) > -1; });
    }
    function condiciones() {
      var val = {}; ws.forEach(function (w) { val[w.n] = w.get(); });
      seccionesCond.forEach(function (x) { x.el.hidden = !aplica(x, val); });
      ws.forEach(function (w) {
        w.el.hidden = !aplica(w, val);
        if (w.c.req_si) { var lb = w.el.querySelector('label'); if (lb) lb.textContent = w.c.e + (val[w.c.req_si] ? ' *' : ''); }
        var seg = w.c.acepta_segun;
        if (seg && w.arch) { var ext = seg.ext[val[seg.campo]]; w.arch.accept = ext ? ext.map(function (e) { return '.' + e; }).join(',') : ''; }
      });
    }
    cuerpo.addEventListener('change', condiciones); cuerpo.addEventListener('input', condiciones); condiciones();
    var f = h('form', { 'class': 'card shadow-sm', novalidate: true }, cuerpo);
    var hs = {};
    Object.keys(d.hijos || {}).forEach(function (hn) {
      var hd = d.hijos[hn], lista = h('div'), filas = [];
      function agregar(vals) {
        var campos = hd.campos.map(function (c) { return widget(c, vals ? vals[c.n] : (c.t === 'bool' ? false : ''), hn + filas.length + '_'); });
        var fila = { campos: campos };
        var caja = h('div', { 'class': 'hijo' }, h('div', { 'class': 'fila' }, campos.map(function (w) { return w.el; })),
          boton('Quitar', function () { filas.splice(filas.indexOf(fila), 1); caja.remove(); }, 'btn-sm btn-outline-danger', 'trash'));
        fila.caja = caja; filas.push(fila); lista.appendChild(caja);
      }
      (hijos[hn] || []).forEach(agregar);
      hs[hn] = filas;
      // Sección de filas (ej.: cronograma); se oculta si no corresponde (comunicado subido como imagen o PDF).
      var sec = h('div', null, h('h3', { 'class': 'h6 text-primary mt-4', text: hd.etiqueta }), lista,
        boton('Agregar', function () { agregar(null); }, 'btn-sm btn-outline-primary', 'plus-lg'));
      if (hd.si) seccionesCond.push({ c: { si: hd.si }, el: sec });
      cuerpo.appendChild(sec);
    });
    condiciones();

    async function guardar(publicar) {
      ws.forEach(function (w) { w.err.textContent = ''; });
      var cuerpoReq = { recurso: rec, id: id, datos: {}, hijos: {} };
      ws.forEach(function (w) { cuerpoReq.datos[w.n] = w.el.hidden ? '' : w.get(); });
      Object.keys(hs).forEach(function (hn) {
        cuerpoReq.hijos[hn] = hs[hn].map(function (fl) { var o = {}; fl.campos.forEach(function (w) { o[w.n] = w.get(); w.err.textContent = ''; }); return o; });
      });
      try {
        var r = await api('guardar', cuerpoReq);
        S.sucio = false;
        if (publicar) await api('estado', { recurso: rec, id: r.id, estado: 'publicado' });
        aviso(publicar ? 'Guardado y publicado.' : 'Guardado.');
        ir('lista', { rec: rec });
      } catch (e) {
        if (e.campos) {
          var primero = null;
          ws.forEach(function (w) { if (e.campos[w.n]) { w.err.textContent = e.campos[w.n]; primero = primero || w; } });
          Object.keys(hs).forEach(function (hn) {
            hs[hn].forEach(function (fl, i) { fl.campos.forEach(function (w) { var m = e.campos[hn + '.' + i + '.' + w.n]; if (m) { w.err.textContent = m; primero = primero || w; } }); });
          });
          aviso(e.message, 'error');
          if (primero) { var x = primero.err.parentNode.querySelector('input,select,textarea'); if (x) x.focus(); }
        } else falla(e);
      }
    }
    f.addEventListener('submit', function (ev) { ev.preventDefault(); guardar(false); });
    f.addEventListener('input', function () { S.sucio = true; });
    f.addEventListener('change', function () { S.sucio = true; });
    f.appendChild(h('div', { 'class': 'card-footer d-flex flex-wrap gap-2' },
      h('button', { 'class': 'btn btn-primary', type: 'submit' }, ico('check2'), ' Guardar'),
      esAdmin() ? boton('Guardar y publicar', async function () { if (await dialogo({ titulo: '¿Guardar y publicar?', texto: 'Será visible para todos en el sitio.', aceptar: 'Guardar y publicar' })) guardar(true); }, 'btn-outline-primary', 'cloud-arrow-up') : null,
      boton('Cancelar', function () { ir('lista', { rec: rec }); }, 'btn-outline-secondary')));
    main.appendChild(f);
  }

  /* ---------- usuarios ---------- */
  async function vUsuarios(main) {
    main.appendChild(titulo('Usuarios'));
    var zona = h('div'), formZona = h('div');
    main.appendChild(h('div', { 'class': 'mb-3' }, boton('Nueva cuenta', function () { formUsuario(formZona, null); }, 'btn-primary', 'person-plus')));
    main.appendChild(formZona); main.appendChild(zona);
    try {
      var j = await api('usuarios');
      var tb = h('tbody');
      j.usuarios.forEach(function (u) { tb.appendChild(filaUsuario(u, formZona)); });
      zona.appendChild(tabla(['Usuario', 'Nombre', 'Rol', 'Secciones', 'Último acceso', 'Estado', 'Acciones'], tb));
    } catch (e) { falla(e); }
  }
  function filaUsuario(u, formZona) {
    var ac = h('div', { 'class': 'd-flex flex-wrap gap-1 align-items-center' }), mas = [];
    var yo = u.id === S.user.id;
    var puedeTocar = !(u.principal && !yo) && !(u.rol === 'administradora' && !yo && !S.user.principal);
    if (puedeTocar) ac.appendChild(boton('Editar', function () { formUsuario(formZona, u); }, 'btn-sm btn-outline-primary'));
    if (puedeTocar) mas.push({ t: 'Restablecer contraseña', icono: 'key', fn: async function () {
      if (!(await dialogo({ titulo: '¿Restablecer la contraseña de ' + u.nombre + '?', texto: 'Se generará una contraseña temporal nueva y la actual dejará de funcionar.', aceptar: 'Restablecer' }))) return;
      try {
        var r = await api('usuario_clave', { id: u.id });
        formZona.textContent = '';
        formZona.appendChild(h('div', { 'class': 'card shadow-sm mb-3' }, h('div', { 'class': 'card-body' },
          h('h3', { 'class': 'h5', text: 'Contraseña temporal de ' + u.nombre }),
          h('div', { 'class': 'clave-temporal', text: r.clave }),
          h('p', { 'class': 'text-secondary mb-0', text: 'Se muestra una sola vez. Entrégala en persona; deberá cambiarla al ingresar.' }))));
        aviso('Contraseña restablecida.');
      } catch (e) { falla(e); }
    } });
    if (!yo && puedeTocar && !u.principal) {
      mas.push({ t: u.activo ? 'Desactivar' : 'Activar', icono: u.activo ? 'person-x' : 'person-check', peligro: u.activo, fn: async function () {
        var ok = await dialogo(u.activo
          ? { titulo: '¿Desactivar a ' + u.nombre + '?', texto: 'Perderá el acceso al panel de inmediato. Podrás activarla de nuevo.', aceptar: 'Desactivar', peligro: true }
          : { titulo: '¿Activar a ' + u.nombre + '?', texto: 'Podrá volver a ingresar al panel.', aceptar: 'Activar' });
        if (!ok) return;
        try { await api('usuario_activo', { id: u.id, activo: !u.activo }); aviso('Cuenta actualizada.'); render(); } catch (e) { falla(e); }
      } });
    }
    if (S.user.principal && !yo && u.rol === 'administradora' && u.activo) mas.push({ t: 'Transferir cargo de directora', icono: 'arrow-left-right', fn: async function () {
      var c = await dialogo({ titulo: '¿Entregar el cargo de administradora principal a ' + u.nombre + '?', texto: 'Dejarás de ser la administradora principal. Escribe tu contraseña para confirmar.', aceptar: 'Transferir cargo', peligro: true, clave: true });
      if (!c) return;
      try { await api('transferir', { destino: u.id, clave: c }); await sesion(); aviso('Cargo transferido.'); render(); } catch (e) { falla(e); }
    } });
    var m = menuMas(mas); if (m) ac.appendChild(m);
    var secc = u.rol === 'administradora' ? 'Todas' : (u.permisos.length ? u.permisos.join(', ') : 'Ninguna');
    return h('tr', null, h('td', { text: u.usuario }), h('td', { text: u.nombre + (u.principal ? ' (principal)' : '') }),
      h('td', { text: u.rol === 'administradora' ? 'Administradora' : 'Editora' }), h('td', { text: secc }),
      h('td', { text: fecha(u.ultimo_acceso) || 'Nunca' }),
      h('td', null, h('span', { 'class': 'badge rounded-pill ' + (u.activo ? 'text-bg-success' : 'text-bg-secondary'), text: u.activo ? 'Activa' : 'Desactivada' }),
        u.debe_cambiar_clave ? h('span', { 'class': 'badge rounded-pill text-bg-warning ms-1', text: 'clave temporal' }) : null),
      h('td', null, ac));
  }
  function formUsuario(zona, u) {
    zona.textContent = '';
    var nuevo = !u;
    function campo(id, etiqueta, valor, tipo, deshab) {
      var i = h('input', { type: tipo || 'text', id: id, 'class': 'form-control', autocapitalize: 'none', disabled: !!deshab }); i.value = valor || '';
      return { i: i, el: h('div', { 'class': 'mb-3' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: etiqueta }), i) };
    }
    var iu = campo('u_usuario', 'Usuario (para ingresar)', u ? u.usuario : '', 'text', !nuevo);
    var inom = campo('u_nombre', 'Nombre completo', u ? u.nombre : '');
    var icor = campo('u_correo', 'Correo (opcional)', u ? u.correo : '', 'email');
    var irol = h('select', { id: 'u_rol', 'class': 'form-select', disabled: !!(u && (u.id === S.user.id || u.principal)) }, h('option', { value: 'editora', text: 'Editora' }));
    if (S.user.principal) irol.appendChild(h('option', { value: 'administradora', text: 'Administradora' }));
    irol.value = u ? u.rol : 'editora';
    var cajas = {}, permZona = h('fieldset', { 'class': 'mb-3' }, h('legend', { 'class': 'h6', text: 'Secciones que puede editar' }));
    var nombres = { noticias: 'Noticias', avisos: 'Comunicados', calendario: 'Calendario', preguntas: 'Preguntas frecuentes', documentos: 'Documentos', galeria: 'Galería', directorio: 'Directorio', institucion: 'Nosotros (misión, visión e historia)' };
    Object.keys(nombres).forEach(function (s) {
      var cb = h('input', { type: 'checkbox', id: 'p_' + s, 'class': 'form-check-input', disabled: !!(u && u.id === S.user.id) }); cb.checked = !!(u && u.permisos.indexOf(s) > -1 && u.rol === 'editora'); cajas[s] = cb;
      permZona.appendChild(h('div', { 'class': 'form-check' }, cb, h('label', { 'for': 'p_' + s, 'class': 'form-check-label', text: nombres[s] })));
    });
    function sincronizar() { permZona.hidden = irol.value === 'administradora'; }
    irol.addEventListener('change', sincronizar); sincronizar();
    var ic = campo('u_clave', 'Contraseña temporal', nuevo ? aleatoria() : '', 'text');
    ic.i.autocomplete = 'off';
    var err = h('div', { 'class': 'text-danger fw-semibold mb-3', role: 'alert' });
    var f = h('form', { 'class': 'card shadow-sm mb-3', novalidate: true }, h('div', { 'class': 'card-body' },
      h('h3', { 'class': 'h5 text-primary', text: nuevo ? 'Nueva cuenta' : 'Editar a ' + u.nombre }),
      iu.el, inom.el, icor.el,
      h('div', { 'class': 'mb-3' }, h('label', { 'for': 'u_rol', 'class': 'form-label fw-semibold', text: 'Rol' }), irol), permZona,
      nuevo ? [ic.el, h('div', { 'class': 'mb-3' }, boton('Generar otra', function () { ic.i.value = aleatoria(); }, 'btn-sm btn-outline-primary', 'arrow-repeat'),
        h('div', { 'class': 'form-text', text: 'Ya viene una sugerida, fácil de dictar (por ejemplo, tacna-peru-47). Puedes cambiarla; mínimo 8 caracteres. Entrégala en persona: la cambiará al ingresar por primera vez.' }))] : null,
      err),
      h('div', { 'class': 'card-footer d-flex gap-2' }, h('button', { 'class': 'btn btn-primary', type: 'submit' }, ico('check2'), ' Guardar'),
        boton('Cancelar', function () { zona.textContent = ''; }, 'btn-outline-secondary')));
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault(); err.textContent = '';
      var permisos = Object.keys(cajas).filter(function (s) { return cajas[s].checked; });
      try {
        await api('usuario_guardar', { id: u ? u.id : 0, usuario: iu.i.value, nombre: inom.i.value, correo: icor.i.value, rol: irol.value, permisos: permisos, clave: ic.i.value });
        aviso(nuevo ? 'Cuenta creada. Entrega la contraseña temporal en persona.' : 'Cuenta actualizada.'); render();
      } catch (e) { err.textContent = e.message; }
    });
    zona.appendChild(f); inom.i.focus();
  }

  /* ---------- registro ---------- */
  async function vRegistro(main) {
    main.appendChild(titulo('Registro de actividad'));
    main.appendChild(h('p', { 'class': 'text-secondary', text: 'Las últimas 200 acciones: quién entró, publicó, editó o eliminó algo, y cuándo.' }));
    try {
      var j = await api('registro');
      var tb = h('tbody');
      j.filas.forEach(function (f) {
        tb.appendChild(h('tr', null, h('td', { text: fecha(f.fecha) }), h('td', { text: f.quien || '—' }), h('td', { text: f.accion }),
          h('td', { text: f.entidad + (f.entidad_id ? ' #' + f.entidad_id : '') }), h('td', { text: f.detalle }), h('td', { text: f.ip })));
      });
      main.appendChild(tabla(['Fecha', 'Quién', 'Acción', 'Sobre', 'Detalle', 'Conexión'], tb));
    } catch (e) { falla(e); }
  }

  /* ---------- inicio de la aplicación ---------- */
  (async function () {
    try {
      await sesion();
      if (S.user && !S.user.debe_cambiar_clave) await cargarEsquema();
    } catch (e) { app.textContent = ''; app.appendChild(h('p', { 'class': 'text-center p-5', text: 'No se pudo conectar con el servidor. Revisa que Apache y MySQL estén activos.' })); return; }
    render();
  })();
})();
