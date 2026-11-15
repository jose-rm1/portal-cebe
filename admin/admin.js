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
  var ICONO = { noticias: 'newspaper', avisos: 'megaphone', calendario_proximas: 'calendar-event', calendario_items: 'calendar3', preguntas: 'question-circle', documentos: 'file-earmark-text', galeria: 'images', directorio: 'people' };

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
  function ir(n, extra) { V = Object.assign({ n: n }, extra || {}); render(); window.scrollTo(0, 0); }
  function esAdmin() { return S.user && S.user.rol === 'administradora'; }
  function aleatoria() {
    var a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(12), s = '';
    (window.crypto || window.msCrypto).getRandomValues(b);
    for (var i = 0; i < 12; i++) s += a[b[i] % a.length];
    return s;
  }
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
    recs.forEach(function (rec) {
      item(S.esq[rec].etiqueta, 'lista', ICONO[rec] || 'file-earmark', { rec: rec });
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
    try { var j = await api('logout'); S.csrf = j.csrf; } catch (e) { /* ya sin sesión */ }
    S.user = null; S.esq = null; await sesion(); V = { n: 'inicio' }; render();
  }
  function render() {
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
    return { input: i, el: h('div', { 'class': 'mb-3 text-start' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: etiqueta }), i) };
  }
  function vLogin() {
    app.textContent = '';
    var u = campoSimple('l_u', 'Usuario', 'text', 'username'), c = campoSimple('l_c', 'Contraseña', 'password', 'current-password');
    var err = h('div', { 'class': 'text-danger fw-semibold mb-3', role: 'alert' });
    var f = h('form', { novalidate: true }, u.el, c.el, err,
      h('button', { 'class': 'btn btn-primary btn-lg w-100', type: 'submit' }, ico('box-arrow-in-right'), ' Ingresar'));
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault(); err.textContent = '';
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
      ev.preventDefault(); err.textContent = '';
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
    main.appendChild(titulo(d.etiqueta));
    main.appendChild(h('div', { 'class': 'd-flex flex-wrap gap-2 align-items-center mb-3' },
      boton('Nuevo', function () { ir('form', { rec: rec, id: 0 }); }, 'btn-primary', 'plus-lg'), sel));
    try {
      var j = await api('listar', { recurso: rec, estado: filtro });
      if (!j.filas.length) { main.appendChild(h('div', { 'class': 'alert alert-light border', text: 'No hay elementos para mostrar.' })); return; }
      var tb = h('tbody');
      j.filas.forEach(function (f) { tb.appendChild(filaLista(rec, d, f)); });
      main.appendChild(tabla(d.columnas.map(function (c) { return c.e; }).concat(['Estado', 'Actualizado', 'Acciones']), tb));
    } catch (e) { falla(e); }
  }
  function filaLista(rec, d, f) {
    var celdas = d.columnas.map(function (c) { var v = f.celdas[c.n]; return h('td', { text: c.op && c.op[v] ? c.op[v] : v }); });
    var ac = h('div', { 'class': 'd-flex flex-wrap gap-1' });
    function b(txt, fn, peligro) { ac.appendChild(boton(txt, fn, 'btn-sm ' + (peligro ? 'btn-outline-danger' : 'btn-outline-primary'))); }
    var puedeEditar = esAdmin() || f.estado === 'borrador' || f.estado === 'pendiente';
    if (puedeEditar) b('Editar', function () { ir('form', { rec: rec, id: f.id }); });
    function cambiar(nuevo, pregunta) {
      return async function () {
        if (pregunta && !confirm(pregunta)) return;
        try { await api('estado', { recurso: rec, id: f.id, estado: nuevo }); aviso('Estado actualizado.'); render(); } catch (e) { falla(e); }
      };
    }
    if (esAdmin()) {
      if (f.estado !== 'publicado') b('Publicar', cambiar('publicado', '¿Publicar este elemento? Será visible para todos en el sitio.'));
      if (f.estado === 'publicado') b('Quitar del sitio', cambiar('borrador', '¿Quitar este elemento del sitio? Volverá a borrador.'));
      if (f.estado !== 'archivado') b('Archivar', cambiar('archivado', '¿Archivar este elemento? Dejará de verse en el sitio.'));
    } else {
      if (f.estado === 'borrador') b('Enviar a revisión', cambiar('pendiente'));
      if (f.estado === 'pendiente') b('Retirar de revisión', cambiar('borrador'));
    }
    if (esAdmin() || f.estado === 'borrador') {
      b('Eliminar', async function () {
        if (!confirm('¿Eliminar este elemento? Esta acción no se puede deshacer.')) return;
        try { await api('eliminar', { recurso: rec, id: f.id }); aviso('Elemento eliminado.'); render(); } catch (e) { falla(e); }
      }, true);
    }
    return h('tr', null, celdas, h('td', null, badge(f.estado)), h('td', { text: fecha(f.actualizado_en) }), h('td', null, ac));
  }

  /* ---------- formulario genérico ---------- */
  function widget(c, val, pref) {
    var id = 'f_' + pref + c.n, inp, extra = null;
    var err = h('div', { 'class': 'text-danger small fw-semibold', id: id + '_e', role: 'alert' });
    var ayuda = c.ayuda ? h('div', { 'class': 'form-text', text: c.ayuda }) : null;
    if (c.t === 'bool') {
      inp = h('input', { type: 'checkbox', id: id, 'class': 'form-check-input' }); inp.checked = !!val;
      return { n: c.n, get: function () { return inp.checked; }, err: err, el: h('div', { 'class': 'form-check mb-3' }, inp, h('label', { 'for': id, 'class': 'form-check-label', text: c.e }), ayuda, err) };
    }
    if (c.t === 'largo') { inp = h('textarea', { id: id, rows: '5', 'class': 'form-control', maxlength: c.max || false }); inp.value = val == null ? '' : val; }
    else if (c.t === 'opcion') {
      inp = h('select', { id: id, 'class': 'form-select' });
      if (!c.req) inp.appendChild(h('option', { value: '', text: '—' }));
      Object.keys(c.op).forEach(function (k) { inp.appendChild(h('option', { value: k, text: c.op[k] })); });
      inp.value = val == null ? '' : String(val);
    }
    else if (c.t === 'entero') { inp = h('input', { type: 'number', id: id, 'class': 'form-control' }); inp.value = val == null ? '' : val; }
    else if (c.t === 'fecha') { inp = h('input', { type: 'date', id: id, 'class': 'form-control' }); inp.value = val == null ? '' : val; }
    else if (c.t === 'imagen' || c.t === 'documento' || c.t === 'medio') {
      inp = h('input', { type: 'text', id: id, 'class': 'form-control', maxlength: '255', placeholder: 'Sube un archivo con el botón' }); inp.value = val == null ? '' : val;
      var acepta = { imagen: '.jpg,.jpeg,.png,.webp', documento: '.pdf', medio: '.jpg,.jpeg,.png,.webp,.mp4' }[c.t];
      var prev = h('img', { 'class': 'img-thumbnail vista-previa mt-2', alt: '', hidden: true });
      var mostrar = function () { var v = inp.value; if (/\.(jpe?g|png|webp)$/i.test(v) && /^(img|uploads)\//.test(v)) { prev.src = '../' + v; prev.hidden = false; } else prev.hidden = true; };
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
      extra = h('div', null, arch, prev);
    }
    else { inp = h('input', { type: 'text', id: id, 'class': 'form-control', maxlength: c.max || false }); inp.value = val == null ? '' : val; }
    return { n: c.n, get: function () { return inp.value; }, err: err, el: h('div', { 'class': 'mb-3' }, h('label', { 'for': id, 'class': 'form-label fw-semibold', text: c.e + (c.req ? ' *' : '') }), inp, extra, ayuda, err) };
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
      cuerpo.appendChild(h('h3', { 'class': 'h6 text-primary mt-4', text: hd.etiqueta }));
      cuerpo.appendChild(lista);
      cuerpo.appendChild(boton('Agregar', function () { agregar(null); }, 'btn-sm btn-outline-primary', 'plus-lg'));
    });

    async function guardar(publicar) {
      ws.forEach(function (w) { w.err.textContent = ''; });
      var cuerpoReq = { recurso: rec, id: id, datos: {}, hijos: {} };
      ws.forEach(function (w) { cuerpoReq.datos[w.n] = w.get(); });
      Object.keys(hs).forEach(function (hn) {
        cuerpoReq.hijos[hn] = hs[hn].map(function (fl) { var o = {}; fl.campos.forEach(function (w) { o[w.n] = w.get(); w.err.textContent = ''; }); return o; });
      });
      try {
        var r = await api('guardar', cuerpoReq);
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
    f.appendChild(h('div', { 'class': 'card-footer d-flex flex-wrap gap-2' },
      h('button', { 'class': 'btn btn-primary', type: 'submit' }, ico('check2'), ' Guardar'),
      esAdmin() ? boton('Guardar y publicar', function () { if (confirm('¿Guardar y publicar? Será visible para todos en el sitio.')) guardar(true); }, 'btn-outline-primary', 'cloud-arrow-up') : null,
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
    var ac = h('div', { 'class': 'd-flex flex-wrap gap-1' });
    function b(t, fn, peligro) { ac.appendChild(boton(t, fn, 'btn-sm ' + (peligro ? 'btn-outline-danger' : 'btn-outline-primary'))); }
    var yo = u.id === S.user.id;
    var puedeTocar = !(u.principal && !yo) && !(u.rol === 'administradora' && !yo && !S.user.principal);
    if (puedeTocar) b('Editar', function () { formUsuario(formZona, u); });
    if (!yo && puedeTocar && !u.principal) {
      b(u.activo ? 'Desactivar' : 'Activar', async function () {
        if (!confirm(u.activo ? '¿Desactivar a ' + u.nombre + '? Perderá el acceso de inmediato.' : '¿Activar a ' + u.nombre + '?')) return;
        try { await api('usuario_activo', { id: u.id, activo: !u.activo }); aviso('Cuenta actualizada.'); render(); } catch (e) { falla(e); }
      }, u.activo);
    }
    if (puedeTocar) b('Restablecer contraseña', async function () {
      if (!confirm('¿Generar una contraseña temporal nueva para ' + u.nombre + '?')) return;
      try {
        var r = await api('usuario_clave', { id: u.id });
        formZona.textContent = '';
        formZona.appendChild(h('div', { 'class': 'card shadow-sm mb-3' }, h('div', { 'class': 'card-body' },
          h('h3', { 'class': 'h5', text: 'Contraseña temporal de ' + u.nombre }),
          h('div', { 'class': 'clave-temporal', text: r.clave }),
          h('p', { 'class': 'text-secondary mb-0', text: 'Se muestra una sola vez. Entrégala en persona; deberá cambiarla al ingresar.' }))));
        aviso('Contraseña restablecida.');
      } catch (e) { falla(e); }
    });
    if (S.user.principal && !yo && u.rol === 'administradora' && u.activo) b('Transferir cargo de directora', async function () {
      if (!confirm('Vas a entregar el cargo de administradora principal a ' + u.nombre + '. ¿Continuar?')) return;
      var c = prompt('Escribe tu contraseña para confirmar:');
      if (!c) return;
      try { await api('transferir', { destino: u.id, clave: c }); await sesion(); aviso('Cargo transferido.'); render(); } catch (e) { falla(e); }
    });
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
    var nombres = { noticias: 'Noticias', avisos: 'Comunicados', calendario: 'Calendario', preguntas: 'Preguntas frecuentes', documentos: 'Documentos', galeria: 'Galería', directorio: 'Directorio' };
    Object.keys(nombres).forEach(function (s) {
      var cb = h('input', { type: 'checkbox', id: 'p_' + s, 'class': 'form-check-input', disabled: !!(u && u.id === S.user.id) }); cb.checked = !!(u && u.permisos.indexOf(s) > -1 && u.rol === 'editora'); cajas[s] = cb;
      permZona.appendChild(h('div', { 'class': 'form-check' }, cb, h('label', { 'for': 'p_' + s, 'class': 'form-check-label', text: nombres[s] })));
    });
    function sincronizar() { permZona.hidden = irol.value === 'administradora'; }
    irol.addEventListener('change', sincronizar); sincronizar();
    var ic = campo('u_clave', 'Contraseña temporal', '', 'text');
    ic.i.autocomplete = 'off';
    var err = h('div', { 'class': 'text-danger fw-semibold mb-3', role: 'alert' });
    var f = h('form', { 'class': 'card shadow-sm mb-3', novalidate: true }, h('div', { 'class': 'card-body' },
      h('h3', { 'class': 'h5 text-primary', text: nuevo ? 'Nueva cuenta' : 'Editar a ' + u.nombre }),
      iu.el, inom.el, icor.el,
      h('div', { 'class': 'mb-3' }, h('label', { 'for': 'u_rol', 'class': 'form-label fw-semibold', text: 'Rol' }), irol), permZona,
      nuevo ? [ic.el, h('div', { 'class': 'mb-3' }, boton('Generar contraseña', function () { ic.i.value = aleatoria(); }, 'btn-sm btn-outline-primary', 'magic'),
        h('div', { 'class': 'form-text', text: 'Mínimo 8 caracteres. Entrégala en persona; la cambiará al ingresar.' }))] : null,
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
