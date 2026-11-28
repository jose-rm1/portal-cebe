/* Dibuja en la página el contenido que viene de data/*.js.
   Hoy lee archivos locales; cuando exista el backend, estas mismas funciones
   recibirán los datos desde la API sin cambiar el diseño.
   Todo el texto se inserta con textContent (nunca con innerHTML) para evitar código malicioso. */
(function () {
  'use strict';
  var D = window.CEBE || {};
  window.CEBE = D;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) continue;
      if (k === 'text') e.textContent = v;
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function safe(u) { return /^(#[\w-]*|https?:\/\/|mailto:|tel:|img\/|video\/|documentos\/|uploads\/)/i.test(u || '') ? u : '#'; }
  function lnk(l) {
    var a = el('a', { href: safe(l.href), text: l.texto });
    if (l.externo) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  function box(id) { var c = document.getElementById(id); if (c) c.textContent = ''; return c; }
  function empty(t) { return el('div', { 'class': 'empty', role: 'status', text: t }); }
  function links(arr, sep) {
    var p = el('p');
    arr.forEach(function (l, i) { if (i && sep) p.appendChild(document.createTextNode(sep)); p.appendChild(lnk(l)); });
    return p;
  }
  function table(heads, rows, o) {
    o = o || {};
    var t = el('table', { style: 'min-width:' + (o.min || 480) + 'px' });
    if (o.caption) t.appendChild(el('caption', { style: 'position:absolute;left:-999px', text: o.caption }));
    var tr = el('tr');
    heads.forEach(function (h) { tr.appendChild(el('th', { scope: 'col', text: h })); });
    t.appendChild(el('thead', null, [tr]));
    var b = el('tbody');
    rows.forEach(function (r) {
      var row = el('tr');
      r.forEach(function (x, i) { row.appendChild(el('td', { style: (o.left || []).indexOf(i) > -1 ? 'text-align:left' : null, text: x })); });
      b.appendChild(row);
    });
    t.appendChild(b);
    return el('div', { 'class': 'tw' }, [t]);
  }

  function noticias() {
    var list = box('nlist'), f = box('nfilt'), L = D.noticias || [];
    if (!list) return;
    if (!L.length) { list.appendChild(empty('Aún no hay noticias publicadas.')); return; }
    L.forEach(function (n) {
      var k = [];
      if (n.imagen) k.push(el('img', { src: n.imagen, alt: n.alt || '', loading: 'lazy' }));
      k.push(el('p', null, [el('span', { 'class': 'tag', text: n.etiqueta }), n.fecha ? ' ' : null, n.fecha ? el('time', { text: n.fecha }) : null]));
      k.push(el('h3', { text: n.titulo }));
      k.push(el('p', { text: n.resumen }));
      if (n.enlaces && n.enlaces.length) k.push(links(n.enlaces, ' · '));
      list.appendChild(el('article', { 'class': 'card nw', 'data-cat': n.categoria }, k));
    });
    if (!f) return;
    var cats = [['todas', 'Todas']], seen = {};
    L.forEach(function (n) { if (!seen[n.categoria]) { seen[n.categoria] = 1; cats.push([n.categoria, n.etiqueta]); } });
    var cards = list.querySelectorAll('[data-cat]');
    cats.forEach(function (c, i) {
      var b = el('button', { type: 'button', 'data-c': c[0], 'aria-pressed': i === 0 ? 'true' : 'false', text: c[1] });
      b.onclick = function () {
        [].forEach.call(f.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        [].forEach.call(cards, function (e) { e.hidden = !(c[0] === 'todas' || e.getAttribute('data-cat') === c[0]); });
      };
      f.appendChild(b);
    });
  }

  function avisoCard(a, h, first) {
    var k = [];
    if (a.etiqueta) k.push(el('span', { 'class': 'tag', text: a.etiqueta }));
    k.push(el(h, { style: h === 'h2' ? 'margin:8px 0 4px' : null, text: a.titulo }));
    if (a.texto) k.push(el('p', { text: a.texto }));
    // Comunicado subido como imagen o PDF (en vez de escrito).
    var ar = a.archivo && /^(img|uploads|documentos)\/[\w.\/-]+$/.test(a.archivo) && a.archivo.indexOf('..') < 0 ? a.archivo : '';
    if (ar && /\.pdf$/i.test(ar)) {
      if (a.resumen) k.push(el('p', { text: a.resumen }));
      k.push(el('p', null, [el('a', { 'class': 'btn', href: ar, target: '_blank', rel: 'noopener', text: 'Ver el comunicado (PDF)' })]));
    } else if (ar) {
      k.push(el('img', { 'class': 'av-img', 'data-zoom': true, tabindex: '0', role: 'button', loading: 'lazy', src: ar, alt: a.resumen || a.titulo }));
      k.push(el('p', null, [el('small', { text: 'Toca la imagen para verla más grande.' })]));
    }
    if (a.detalles && a.detalles.length) {
      var p = el('p');
      a.detalles.forEach(function (d, i) {
        if (i) p.appendChild(el('br'));
        p.appendChild(el('strong', { text: d.etiqueta + ': ' }));
        p.appendChild(document.createTextNode(d.texto));
      });
      k.push(p);
    }
    (a.notas || []).forEach(function (n) { k.push(el('p', { text: n })); });
    if (a.filas && a.filas.length) k.push(table(['Actividad', 'Fecha'], a.filas.map(function (r) { return [r.actividad, r.fecha]; }), { left: [0], min: 420, caption: 'Cronograma de actividades' }));
    if (a.cierre) k.push(el('p', { style: 'margin-top:14px' }, [el('strong', { text: a.cierre })]));
    if (a.firma) k.push(el('p', null, [el('small', { text: a.firma })]));
    return el('div', { 'class': 'card av' + (a.destacado ? ' d' : ''), style: first ? 'margin-top:20px' : null }, k);
  }
  function avisos() {
    var c = box('avisos-lista'), L = D.avisos || [];
    if (!c) return;
    if (!L.length) { c.appendChild(empty('No hay comunicados publicados.')); return; }
    var act = L.filter(function (a) { return !a.archivado; }), old = L.filter(function (a) { return a.archivado; });
    act.forEach(function (a, i) { c.appendChild(avisoCard(a, 'h2', i === 0)); });
    if (old.length) {
      c.appendChild(el('h2', { style: 'margin-top:40px', text: 'Comunicados anteriores' }));
      var g = el('div', { 'class': 'grid' });
      old.forEach(function (a) { g.appendChild(avisoCard(a, 'h3', false)); });
      c.appendChild(g);
    }
  }

  function calendario() {
    var C = D.calendario || {}, p = box('cal-prox'), m = box('cc');
    if (p) (C.proximas || []).forEach(function (x) {
      var k = [];
      if (x.etiqueta) k.push(el('span', { 'class': 'tag', text: x.etiqueta }));
      k.push(el('h3', { text: x.titulo }));
      var q = el('p', { text: x.texto + (x.enlace ? ' ' : '') });
      if (x.enlace) q.appendChild(lnk(x.enlace));
      k.push(q);
      p.appendChild(el('div', { 'class': 'card' + (x.destacado ? ' av d' : '') }, k));
    });
    if (m) {
      var now = new Date().getMonth() + 1;
      (C.meses || []).forEach(function (x) {
        var h = el('h3', { text: x.nombre }), ul = el('ul');
        x.items.forEach(function (i) {
          var li = el('li');
          if (i.dia) { li.appendChild(el('strong', { text: i.dia })); li.appendChild(document.createTextNode(' · ' + i.texto)); }
          else li.textContent = i.texto;
          ul.appendChild(li);
        });
        var c = el('div', { 'class': 'card', 'data-m': x.mes }, [h, ul]);
        if (x.mes === now) { c.style.borderColor = 'var(--red)'; c.style.borderWidth = '2px'; h.appendChild(document.createTextNode(' ')); h.appendChild(el('span', { 'class': 'tag', text: 'Este mes' })); }
        m.appendChild(c);
      });
    }
  }

  function documentos() {
    var c = box('doc-lista'), L = D.documentos || [];
    if (!c) return;
    if (!L.length) { c.appendChild(empty('Aún no hay documentos publicados. Aparecerán aquí los documentos autorizados por la Dirección, con nombre, descripción, fecha y tipo de archivo.')); return; }
    var g = el('div', { 'class': 'grid' });
    L.forEach(function (d) {
      g.appendChild(el('div', { 'class': 'card' }, [
        el('span', { 'class': 'tag', text: d.tipo }), el('h3', { text: d.nombre }),
        el('p', { text: d.descripcion }), el('p', null, [el('small', { text: d.fecha })]),
        el('a', { 'class': 'btn', href: safe(d.url), target: '_blank', rel: 'noopener', text: 'Ver o descargar' })
      ]));
    });
    c.appendChild(g);
  }

  function galeria() {
    var G = D.galeria || {}, f = box('gal-fotos'), v = box('gal-videos');
    if (f) (G.fotos || []).forEach(function (x) {
      f.appendChild(el('figure', { style: 'margin:0' }, [
        el('img', { 'data-zoom': true, tabindex: '0', role: 'button', loading: 'lazy', src: x.src, alt: x.alt }),
        el('figcaption', { text: x.pie })
      ]));
    });
    if (v) (G.videos || []).forEach(function (x) {
      v.appendChild(el('h2', { style: 'margin-top:34px', text: x.titulo }));
      v.appendChild(el('video', { controls: true, preload: 'metadata', playsinline: true, poster: x.poster, src: x.src, 'aria-label': x.descripcion, style: 'width:100%;max-width:340px;border-radius:14px;display:block;margin-top:14px;background:#000' }));
    });
  }

  function preguntas() {
    var c = box('faq-lista'), L = D.preguntas || [];
    if (!c) return;
    L.forEach(function (q, i) {
      var d = el('details', { open: i === 0 }, [el('summary', { text: q.pregunta }), el('p', { text: q.respuesta })]);
      if (q.enlaces && q.enlaces.length) {
        var p = el('p');
        q.enlaces.forEach(function (l, j) { if (j) p.appendChild(document.createTextNode(' ')); var a = lnk(l); a.className = 'btn'; p.appendChild(a); });
        d.appendChild(p);
      }
      c.appendChild(d);
    });
  }

  function directorio() {
    var c = box('dirbox'), L = D.directorio || [];
    if (!c) return;
    L.forEach(function (g) {
      c.appendChild(el('h2', { style: 'margin-top:30px', text: g.grupo }));
      c.appendChild(table(['Nombre', 'Cargo', 'Grado y sección'], g.personas.map(function (p) { return [p.nombre, p.cargo, p.detalle]; }), { left: [0], min: 480 }));
    });
  }

  // Historia: cada párrafo con su foto; si aún no hay foto, queda el espacio reservado.
  function historia() {
    var c = box('historia-lista'), L = D.historia || [];
    if (!c) return;
    if (!L.length) { c.appendChild(empty('Pronto publicaremos la historia del CEBE.')); return; }
    L.forEach(function (h, i) {
      var img = h.imagen && /^(img|uploads)\/[\w.\/-]+$/.test(h.imagen) && h.imagen.indexOf('..') < 0 ? h.imagen : '';
      var fig = img
        ? el('figure', { 'class': 'hfig' }, [el('img', { src: img, alt: h.alt || '', loading: 'lazy', 'data-zoom': true, tabindex: '0', role: 'button' }), h.pie ? el('figcaption', { text: h.pie }) : null])
        : el('figure', { 'class': 'hfig vacia', 'aria-hidden': 'true' }, [el('span', { text: 'Foto histórica' })]);
      var txt = [];
      if (h.fecha) txt.push(el('span', { 'class': 'tag', text: h.fecha }));
      txt.push(el('h2', { text: h.titulo }));
      String(h.texto || '').split(/\n\s*\n/).forEach(function (p) { if (p.trim()) txt.push(el('p', { text: p.trim() })); });
      c.appendChild(el('section', { 'class': 'hbloque' + (i % 2 ? ' inv' : '') }, [el('div', { 'class': 'htxt' }, txt), fig]));
    });
  }

  function mision() {
    var c = box('mision-box'), m = D.mision;
    if (!c) return;
    if (!m) { c.appendChild(empty('Pronto publicaremos la misión y visión del CEBE.')); return; }
    if (m.periodo) c.appendChild(el('p', null, [el('span', { 'class': 'tag', text: m.periodo })]));
    c.appendChild(el('div', { 'class': 'grid' }, [
      el('div', { 'class': 'card mv' }, [el('h2', { text: 'Misión' }), el('p', { text: m.mision })]),
      el('div', { 'class': 'card mv' }, [el('h2', { text: 'Visión' }), el('p', { text: m.vision })])
    ]));
    if (m.valores && m.valores.length) {
      c.appendChild(el('h2', { style: 'margin-top:30px', text: 'Valores' }));
      c.appendChild(el('ul', { 'class': 'chips valores' }, m.valores.map(function (v) { return el('li', { text: v }); })));
    }
  }

  function dibujar() {
    [noticias, avisos, calendario, documentos, galeria, preguntas, directorio, historia, mision].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error('Error al dibujar ' + fn.name, e); }
    });
  }

  // 1) Se dibuja de inmediato con los datos locales (data/*.js).
  dibujar();

  // 2) Si hay servidor con la API (XAMPP, InfinityFree), se piden los datos de la base de datos
  //    en UNA sola petición y se vuelve a dibujar. Si falla, la página sigue con los datos locales.
  var CLAVES = ['noticias', 'avisos', 'calendario', 'preguntas', 'documentos', 'galeria', 'directorio', 'mision', 'historia'];
  if (window.fetch && /^https?:$/.test(location.protocol)) {
    var ctl = window.AbortController ? new AbortController() : null;
    var corte = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    fetch('api/publico.php?r=todo', { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        clearTimeout(corte);
        var completo = j && typeof j === 'object' && !j.error && CLAVES.every(function (k) { return j[k] !== undefined; });
        if (!completo) throw new Error('respuesta incompleta');
        CLAVES.forEach(function (k) { D[k] = j[k]; });
        dibujar();
      })
      .catch(function (e) { clearTimeout(corte); if (window.console) console.info('Se usan los datos locales:', e.message); });
  }
})();
