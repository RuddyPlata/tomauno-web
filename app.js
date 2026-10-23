'use strict';
/* TomaUno web: todo ocurre en este navegador. Sin servidor, sin analítica. */

/* ============================================================ utilidades */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const pl = (n, uno, otros) => n + ' ' + (n === 1 ? uno : otros);
const fmtDur = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmtBytes = b => b >= 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : b >= 1048576 ? (b / 1048576).toFixed(b >= 1.05e8 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const fmtHora = t => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
const enLocalhost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname);
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: no pasa nada */ } };

const ICONOS = {
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  left: '<polyline points="15 18 9 12 15 6"/>',
  right: '<polyline points="9 18 15 12 9 6"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  switchcam: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  film: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 12h20M2 7.5h5M2 16.5h5M17 7.5h5M17 16.5h5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

/* ============================================================ guion: parser (equivalente a parsear_guion de servidor.py) */
const RE_ETIQ = /^\s*([0-9]{1,2}[a-zA-Z]?)[.)]\s+(.*)$/;
function idDeEtiqueta(et) {
  const m = /^(\d+)([a-z]?)$/.exec(et);
  return 'L' + String(parseInt(m[1], 10)).padStart(2, '0') + m[2];
}
function parsear(texto) {
  texto = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  texto = texto.replace(/<!--[\s\S]*?-->/g, '');
  const renglones = texto.split('\n');
  let titulo = null, seccion = null, notas = [], bloques = [], actual = [];
  const cerrar = () => {
    if (actual.length) {
      bloques.push([actual, seccion, notas.length ? notas.join(' ') : null]);
      notas = [];
    }
    actual = [];
  };
  for (const r of renglones) {
    const s = r.trim();
    if (!s) cerrar();
    else if (s.startsWith('#')) {
      cerrar();
      const nombre = s.replace(/^#+/, '').trim();
      if (titulo === null) titulo = nombre; else seccion = nombre;
    } else if (s.startsWith('>')) {
      cerrar();
      notas.push(s.replace(/^>+/, '').trim());
    } else actual.push(r.replace(/\s+$/, ''));
  }
  cerrar();
  const hayBlanco = renglones.join('\n').trim().split('\n').some(x => !x.trim());
  if (bloques.length === 1 && bloques[0][0].length > 1 && !hayBlanco) {
    const [rs, sec, nota] = bloques[0];
    bloques = rs.map((x, i) => [[x], sec, i === 0 ? nota : null]);
  }
  const lineas = [], vistos = {};
  for (let [rs, sec, nota] of bloques) {
    const n = lineas.length + 1;
    const m = RE_ETIQ.exec(rs[0]);
    let et;
    if (m) { et = m[1].toLowerCase(); rs = [m[2]].concat(rs.slice(1)); } else et = String(n);
    const lid = idDeEtiqueta(et);
    if (vistos[lid]) throw new Error('Hay dos líneas con el mismo número: «' + et + '».');
    vistos[lid] = true;
    lineas.push({ id: lid, etiqueta: et, n, seccion: sec, nota, texto: rs.filter(x => x.trim()).join('\n') });
  }
  if (!lineas.length) throw new Error('El guion no tiene ninguna línea para leer.');
  return { titulo, lineas };
}
const _cacheParse = new Map();
function analizar(md) {
  if (!_cacheParse.has(md)) {
    try { _cacheParse.set(md, parsear(md)); } catch (e) { _cacheParse.set(md, { titulo: null, lineas: [], error: e.message }); }
  }
  return _cacheParse.get(md);
}
function textoLimpio(t) {
  return t.replace(/\*\*/g, '').replace(/\[pausa[^\]]*\]/gi, ' ').replace(/\s+/g, ' ').trim();
}
function textoHTML(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<span class="enf">$1</span>')
    .replace(/\[pausa[^\]]*\]/gi, '<span class="pausa">pausa</span>')
    .replace(/\n/g, '<br>');
}

/* ============================================================ base de datos (IndexedDB) */
const DB = {
  db: null,
  abrir() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('Este navegador no permite guardar tomas.'));
      const r = indexedDB.open('tomauno', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('scripts', { keyPath: 'id' });
        d.createObjectStore('takes', { keyPath: 'id' }).createIndex('scriptId', 'scriptId');
        d.createObjectStore('blobs');
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  _tx(stores, modo, fn) {
    return new Promise((res, rej) => {
      let tx, out;
      try { tx = this.db.transaction(stores, modo); } catch (e) { return rej(e); }
      tx.oncomplete = () => res(out);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error || new Error('Se canceló al guardar.'));
      const r = fn(tx);
      if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
    });
  },
  todos(store) { return this._tx(store, 'readonly', tx => tx.objectStore(store).getAll()); },
  poner(store, obj) { return this._tx(store, 'readwrite', tx => tx.objectStore(store).put(obj)); },
  guardarToma(meta, blob) {
    return this._tx(['takes', 'blobs'], 'readwrite', tx => { tx.objectStore('blobs').put(blob, meta.id); tx.objectStore('takes').put(meta); });
  },
  blob(id) { return this._tx('blobs', 'readonly', tx => tx.objectStore('blobs').get(id)); },
  borrarTomas(ids) {
    return this._tx(['takes', 'blobs'], 'readwrite', tx => { ids.forEach(i => { tx.objectStore('takes').delete(i); tx.objectStore('blobs').delete(i); }); });
  },
  borrarGuion(id, tomaIds) {
    return this._tx(['scripts', 'takes', 'blobs'], 'readwrite', tx => {
      tx.objectStore('scripts').delete(id);
      tomaIds.forEach(i => { tx.objectStore('takes').delete(i); tx.objectStore('blobs').delete(i); });
    });
  },
};

/* ============================================================ estado */
const AJ_DEF = { fs: 38, vel: 5, mic: '', cam: '', calidad: 'normal', mejorar: false, espejo: true, guia: false, cuenta: true, tema: 'auto', modo: 'voz', lectura: 'linea', facing: 'user' };
const S = {
  scripts: [], takes: [], cur: lsGet('tomauno.cur', null), pos: lsGet('tomauno.pos', {}),
  aj: Object.assign({}, AJ_DEF, lsGet('tomauno.ajustes', {})), biblioteca: null, persistente: null,
  sc() { return this.scripts.find(s => s.id === this.cur) || null; },
  lineas(sc) { return sc ? analizar(sc.md).lineas : []; },
  tomasDe(sid, lid, papelera = false) { return this.takes.filter(t => t.scriptId === sid && t.lineId === lid && !!t.deleted === papelera).sort((a, b) => a.num - b.num); },
  buena(sid, lid) { return this.takes.find(t => t.scriptId === sid && t.lineId === lid && t.good && !t.deleted) || null; },
  tomaParaReproducir(sid, lid) { return this.buena(sid, lid) || this.tomasDe(sid, lid).slice(-1)[0] || null; },
  progreso(sc) {
    const ls = this.lineas(sc);
    const listas = ls.filter(l => this.buena(sc.id, l.id)).length;
    const tomas = this.takes.filter(t => t.scriptId === sc.id && !t.deleted).length;
    return { total: ls.length, listas, tomas };
  },
  idx() { const sc = this.sc(); if (!sc) return 0; const n = this.lineas(sc).length; return Math.min(Math.max(this.pos[sc.id] || 0, 0), Math.max(n - 1, 0)); },
  setIdx(i) { const sc = this.sc(); if (!sc) return; this.pos[sc.id] = i; lsSet('tomauno.pos', this.pos); },
  elegir(id) { this.cur = id; lsSet('tomauno.cur', id); },
};
const guardarAjustes = () => lsSet('tomauno.ajustes', S.aj);
function aplicarAjustes() {
  document.documentElement.style.setProperty('--fs', S.aj.fs + 'px');
  if (S.aj.tema === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = S.aj.tema;
  const claro = S.aj.tema === 'light' || (S.aj.tema === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
  const m = $('meta[name=theme-color]'); if (m) m.content = claro ? '#ffffff' : '#171a21';
}

/* ============================================================ avisos y ventanas */
function toast(msg, o = {}) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (o.accion) {
    const b = document.createElement('button');
    b.textContent = o.accion;
    b.onclick = () => { t.remove(); o.onAccion && o.onAccion(); };
    t.appendChild(b);
  }
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), o.ms || (o.accion ? 6500 : 3500));
  return t;
}
function modal(html, o = {}) {
  const ov = document.createElement('div');
  ov.className = 'ov';
  if (o.fijo) ov.dataset.fijo = '1';
  ov.innerHTML = `<div class="hoja ${o.clase || ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(ov);
  document.body.classList.add('modal-abierto');
  const close = () => { ov.remove(); if (!$('.ov')) document.body.classList.remove('modal-abierto'); o.alCerrar && o.alCerrar(); };
  ov.addEventListener('mousedown', e => { if (e.target === ov && !o.fijo) close(); });
  $$('[data-cerrar]', ov).forEach(b => b.addEventListener('click', close));
  const f = $('[autofocus]', ov) || $('button, input, textarea, select', ov);
  if (f) f.focus();
  return { el: ov.firstElementChild, ov, close };
}
function confirmar(titulo, texto, okTxt, peligro = true) {
  return new Promise(res => {
    const m = modal(`<h2>${esc(titulo)}</h2><p>${texto}</p>
      <div class="pie"><button class="btn" data-no>Cancelar</button><button class="btn ${peligro ? 'peligro solido' : 'primario'}" data-si>${esc(okTxt)}</button></div>`,
      { alCerrar: () => res(false) });
    $('[data-no]', m.el).onclick = () => m.close();
    $('[data-si]', m.el).onclick = () => { m.ov.remove(); if (!$('.ov')) document.body.classList.remove('modal-abierto'); res(true); };
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const o = $$('.ov').pop(); if (o && !o.dataset.fijo) { o.remove(); if (!$('.ov')) document.body.classList.remove('modal-abierto'); } }
});

/* ============================================================ descargas y zip */
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const extDe = (mime, kind) => {
  const m = (mime || '').toLowerCase();
  if (m.includes('mp4')) return kind === 'video' ? 'mp4' : 'm4a';
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  return kind === 'video' ? 'mp4' : 'm4a';
};
const nombreToma = t => (t.lineId === '__corrido' ? 'corrido' : t.lineId) + '_t' + String(t.num).padStart(2, '0') + '.' + extDe(t.mime, t.kind);
const slug = s => (s || 'guion').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'guion';
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function hacerZip(archivos) { // [{nombre, blob}] sin compresión
  const enc = new TextEncoder(), partes = [], central = [];
  let offset = 0;
  const d = new Date();
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const fecha = (Math.max(d.getFullYear() - 1980, 0) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of archivos) {
    const datos = new Uint8Array(await f.blob.arrayBuffer());
    const crc = crc32(datos), tam = datos.length, nom = enc.encode(f.nombre);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, hora, true); lh.setUint16(12, fecha, true); lh.setUint32(14, crc, true); lh.setUint32(18, tam, true);
    lh.setUint32(22, tam, true); lh.setUint16(26, nom.length, true); lh.setUint16(28, 0, true);
    partes.push(lh.buffer, nom, datos);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, hora, true); ch.setUint16(14, fecha, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, tam, true); ch.setUint32(24, tam, true); ch.setUint16(28, nom.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, nom);
    offset += 30 + nom.length + tam;
  }
  const tamCentral = central.reduce((a, b) => a + b.byteLength, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
  return new Blob([...partes, ...central, fin.buffer], { type: 'application/zip' });
}

/* ============================================================ guiones: datos de ejemplo y altas */
const EJEMPLO_MD = `# Guion de ejemplo

> Esto es un ejemplo para que pruebes. Esta nota es para ti: no se lee en voz alta.

1) Hola, esta es mi primera toma con TomaUno.

2) Aquí hay una palabra **importante** y después una pausa. [pausa]
Luego sigo hablando con naturalidad.

> Cierra con una sonrisa.
3) ¡Y listo! Así de fácil se graba una toma.
`;
async function crearGuion(md, titulo, extra = {}) {
  const a = analizar(md);
  const sc = { id: uid(), titulo: (titulo || a.titulo || 'Guion sin título').trim(), md, creado: Date.now(), ...extra };
  await DB.poner('scripts', sc);
  S.scripts.unshift(sc);
  return sc;
}
async function sembrarEjemplo() {
  if (S.scripts.length || lsGet('tomauno.sembrado', false)) return;
  const sc = await crearGuion(EJEMPLO_MD, 'Guion de ejemplo', { ejemplo: true });
  S.elegir(sc.id);
  lsSet('tomauno.sembrado', true);
}
async function importarArchivos(files) {
  let ok = 0, ultimo = null;
  const fallos = [];
  for (const f of files) {
    try {
      const md = await f.text();
      const a = analizar(md);
      if (a.error) throw new Error(a.error);
      ultimo = await crearGuion(md, a.titulo || f.name.replace(/\.[^.]+$/, ''));
      ok++;
    } catch (e) { fallos.push(f.name + ': ' + e.message); }
  }
  if (ultimo) S.elegir(ultimo.id);
  renderActual();
  if (ok) toast(ok === 1 ? 'Guion añadido' : ok + ' guiones añadidos');
  if (fallos.length) modal(`<h2>No se pudieron abrir algunos archivos</h2><ul>${fallos.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="pie"><button class="btn primario" data-cerrar>Entendido</button></div>`);
}

/* ============================================================ reproductor único (Tomas) */
const P = { url: null, cola: [], i: 0, activo: null };
function pEl() { return $('#player'); }
async function sonar() {
  const item = P.cola[P.i];
  if (!item) return detener();
  const blob = await DB.blob(item.id).catch(() => null);
  if (!blob) { toast('No se pudo leer una toma'); P.i++; return sonar(); }
  const el = pEl();
  if (P.url) URL.revokeObjectURL(P.url);
  P.url = URL.createObjectURL(blob);
  P.activo = item.id;
  const panel = $('#player-panel');
  panel.hidden = false;
  panel.classList.toggle('solo-audio', item.kind !== 'video');
  const ln = S.lineas(S.sc()).find(l => l.id === item.lineId);
  $('#pp-info').textContent = (P.cola.length > 1 ? `Reproduciendo ${P.i + 1} de ${P.cola.length} · ` : '') + (ln ? 'Línea ' + ln.etiqueta : item.lineId === '__corrido' ? 'Grabación corrida' : 'Toma') + ' · toma ' + item.num;
  el.src = P.url;
  marcarSonando(true);
  try { await el.play(); } catch (e) { if (e.name !== 'AbortError') toast('Toca ▶ para reproducir'); }
}
function detener() {
  const el = pEl();
  if (!el) return;
  el.pause(); el.removeAttribute('src'); el.load();
  if (P.url) { URL.revokeObjectURL(P.url); P.url = null; }
  P.cola = []; P.i = 0; P.activo = null;
  const panel = $('#player-panel'); if (panel) panel.hidden = true;
  marcarSonando(false);
}
function marcarSonando(scroll) {
  $$('.sonando').forEach(e => e.classList.remove('sonando'));
  if (!P.activo) return;
  const t = $(`.toma[data-tid="${P.activo}"]`);
  if (t) t.classList.add('sonando');
  const item = P.cola[P.i];
  const l = item && $(`.linea[data-lid="${item.lineId}"]`);
  if (l) { if (P.cola.length > 1) l.classList.add('sonando'); if (scroll) l.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

/* ============================================================ pantalla: Guiones */
function renderGuiones() {
  const el = $('#v-guiones');
  const bib = S.biblioteca ? '' : '';
  const cab = `<div class="pagina-cab"><h1>Mis guiones</h1><button class="btn primario grande" data-a="nuevo">${ic('plus')} Nuevo guion</button></div>`;
  if (!S.scripts.length) {
    el.innerHTML = `<div class="cont">${cab}<div class="card vacio">${ic('file', 44)}<h2>Todavía no tienes guiones</h2>
      <p>Un guion es el texto que vas a leer. Pega o escribe el tuyo, ábrelo desde un archivo, y TomaUno te lo muestra línea por línea para grabar.</p>
      <button class="btn primario grande" data-a="nuevo">${ic('plus')} Crear mi primer guion</button></div></div>`;
    return;
  }
  const cards = S.scripts.map(sc => {
    const a = analizar(sc.md), p = S.progreso(sc);
    const pct = p.total ? Math.round(p.listas * 100 / p.total) : 0;
    const info = a.error ? `<p class="sub" style="color:var(--pe)">Este guion tiene un problema: ${esc(a.error)} Edítalo para arreglarlo.</p>`
      : `<p class="sub"><b>${p.listas} de ${pl(p.total, 'línea lista', 'líneas listas')}</b>${p.tomas ? ' · ' + pl(p.tomas, 'toma', 'tomas') : ''}</p>
         <div class="prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>`;
    return `<article class="card guion ${sc.id === S.cur ? 'activo' : ''}" data-id="${sc.id}">
      <div><h3>${esc(sc.titulo)}${sc.id === S.cur ? ' <span class="chip ok">En uso</span>' : ''}</h3>${info}</div>
      <div class="acc">
        <button class="btn primario" data-a="grabar" ${a.error ? 'disabled' : ''}>${ic('mic')} Grabar</button>
        <button class="btn" data-a="tomas">${ic('film')} Ver tomas</button>
        <button class="btn suave" data-a="editar">${ic('edit')} Editar</button>
        <button class="btn suave" data-a="duplicar">${ic('copy')} Duplicar</button>
        <button class="btn suave peligro" data-a="borrar">${ic('trash')} Borrar</button>
      </div></article>`;
  }).join('');
  el.innerHTML = `<div class="cont">${cab}${cards}${bib}</div>`;
}
function irAGrabar(id, desdeLinea) {
  S.elegir(id);
  const sc = S.sc();
  if (desdeLinea === undefined) {
    const ls = S.lineas(sc);
    const i = ls.findIndex(l => !S.buena(sc.id, l.id));
    S.setIdx(i < 0 ? 0 : i);
  } else S.setIdx(desdeLinea);
  location.hash = '#grabar';
  if (ruta() === 'grabar') go();
}
$('#v-guiones').addEventListener('click', async e => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a, card = b.closest('[data-id]'), id = card && card.dataset.id;
  if (a === 'nuevo') return dialogoNuevo();
  const sc = S.scripts.find(s => s.id === id);
  if (!sc) return;
  if (a === 'grabar') irAGrabar(id);
  if (a === 'tomas') { S.elegir(id); location.hash = '#tomas'; }
  if (a === 'editar') editorGuion(sc);
  if (a === 'duplicar') {
    const c = await crearGuion(sc.md, sc.titulo + ' (copia)');
    S.elegir(c.id); renderActual(); toast('Guion duplicado (sin tomas)');
  }
  if (a === 'borrar') {
    const n = S.takes.filter(t => t.scriptId === id).length;
    const ok = await confirmar('¿Borrar este guion?', `Se borrará «${esc(sc.titulo)}»${n ? ` y también sus <b>${pl(n, 'toma', 'tomas')}</b>, incluidas las de la papelera. Esto no se puede deshacer` : ''}.`, 'Sí, borrar');
    if (!ok) return;
    try {
      await DB.borrarGuion(id, S.takes.filter(t => t.scriptId === id).map(t => t.id));
    } catch (err) { return toast('No se pudo borrar: ' + err.message); }
    S.takes = S.takes.filter(t => t.scriptId !== id);
    S.scripts = S.scripts.filter(s => s.id !== id);
    if (S.cur === id) S.elegir(S.scripts[0] ? S.scripts[0].id : null);
    renderActual(); toast('Guion borrado');
  }
});
function dialogoNuevo() {
  const m = modal(`<h2>Nuevo guion</h2><p class="sub">¿Cómo quieres traerlo?</p>
    <div class="opciones">
      <button class="opcion" data-o="texto">${ic('edit', 28)}<div><b>Escribir o pegar el texto</b><span class="sub">Cada párrafo será una línea para grabar.</span></div></button>
      <button class="opcion" data-o="archivos">${ic('folder', 28)}<div><b>Abrir archivos</b><span class="sub">Uno o varios, en formato .md o .txt.</span></div></button>
      ${S.biblioteca ? `<button class="opcion" data-o="biblioteca">${ic('book', 28)}<div><b>Biblioteca</b><span class="sub">Guiones que vienen incluidos con esta página.</span></div></button>` : ''}
    </div><div class="pie"><button class="btn" data-cerrar>Cancelar</button></div>`);
  m.el.addEventListener('click', e => {
    const o = e.target.closest('[data-o]');
    if (!o) return;
    m.close();
    if (o.dataset.o === 'texto') editorGuion(null);
    if (o.dataset.o === 'archivos') $('#archivos').click();
    if (o.dataset.o === 'biblioteca') dialogoBiblioteca();
  });
}
$('#archivos').addEventListener('change', e => { const f = Array.from(e.target.files); e.target.value = ''; if (f.length) importarArchivos(f); });
function dialogoBiblioteca() {
  const filas = () => S.biblioteca.map(g => {
    const ya = S.scripts.some(s => s.libId === g.id);
    return `<div class="pap-fila"><div><b>${esc(g.titulo)}</b><div class="sub">${pl((analizar(g.md).lineas || []).length, 'línea', 'líneas')}</div></div>
      <button class="btn ${ya ? '' : 'primario'}" data-lib="${esc(g.id)}" ${ya ? 'disabled' : ''}>${ya ? 'Ya añadido' : ic('plus') + ' Añadir'}</button></div>`;
  }).join('');
  const m = modal(`<h2>Biblioteca</h2><p class="sub">Elige los guiones que quieras tener en tu lista.</p><div id="bib-l">${filas()}</div>
    <div class="pie"><button class="btn primario" data-cerrar>Listo</button></div>`, { clase: 'ancha' });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-lib]');
    if (!b) return;
    const g = S.biblioteca.find(x => x.id === b.dataset.lib);
    if (!g || analizar(g.md).error) return toast('Ese guion tiene un problema y no se pudo añadir');
    const sc = await crearGuion(g.md, g.titulo, { libId: g.id });
    S.elegir(sc.id);
    $('#bib-l', m.el).innerHTML = filas(); renderActual();
  });
}
function editorGuion(sc) {
  const nuevo = !sc;
  const m = modal(`<h2>${nuevo ? 'Nuevo guion' : 'Editar guion'}</h2>
    <label class="campo"><span>Título</span><input type="text" id="e-tit" maxlength="120" placeholder="Por ejemplo: Video de bienvenida" value="${nuevo ? '' : esc(sc.titulo)}"></label>
    <label class="campo"><span>Texto</span><textarea id="e-md" spellcheck="true" placeholder="Escribe o pega aquí lo que vas a leer.&#10;&#10;Separa cada línea con un renglón en blanco."></textarea></label>
    <p class="estado-linea" id="e-estado" role="status"></p>
    <details class="sub"><summary style="cursor:pointer;min-height:32px">¿Cómo se escribe?</summary>
      <p>Deja un renglón en blanco entre una línea y la siguiente. Si quieres, numéralas así: <kbd>1)</kbd> <kbd>2)</kbd> <kbd>2a)</kbd>.</p>
      <p>Lo que empieza con <kbd>&gt;</kbd> es una nota para ti (cómo decirlo): se muestra pequeñito y no se lee. Una palabra entre <kbd>**dos asteriscos**</kbd> sale resaltada, y <kbd>[pausa]</kbd> marca un descanso. Una línea que empieza con <kbd>#</kbd> es el título.</p></details>
    ${nuevo ? '' : '<p class="sub">Si cambias los números de las líneas, las tomas ya grabadas se quedan con el número que tenían.</p>'}
    <div class="pie"><button class="btn" data-cerrar>Cancelar</button><button class="btn primario" id="e-ok" disabled>${nuevo ? 'Crear guion' : 'Guardar cambios'}</button></div>`, { clase: 'ancha', fijo: true });
  const md = $('#e-md', m.el), tit = $('#e-tit', m.el), est = $('#e-estado', m.el), ok = $('#e-ok', m.el);
  md.value = nuevo ? '' : sc.md;
  const revisar = () => {
    if (!md.value.trim()) { est.className = 'estado-linea'; est.textContent = 'Escribe o pega el texto para empezar.'; ok.disabled = true; return; }
    const a = analizar(md.value);
    if (a.error) { est.className = 'estado-linea mal'; est.textContent = a.error; ok.disabled = true; }
    else { est.className = 'estado-linea bien'; est.textContent = 'Detecto ' + pl(a.lineas.length, 'línea', 'líneas') + ' para grabar.'; ok.disabled = false; }
  };
  md.addEventListener('input', revisar); revisar();
  ok.onclick = async () => {
    const a = analizar(md.value);
    if (a.error) return;
    const titulo = tit.value.trim() || a.titulo || 'Guion sin título';
    if (nuevo) { const n = await crearGuion(md.value, titulo); S.elegir(n.id); }
    else { sc.md = md.value; sc.titulo = titulo; await DB.poner('scripts', sc); }
    m.close(); renderActual(); toast(nuevo ? 'Guion creado' : 'Cambios guardados');
  };
}

/* ============================================================ bienvenida */
function bienvenida() {
  const pasos = [
    { i: 'edit', h: 'Trae tu guion', p: 'Escríbelo, pégalo o ábrelo desde un archivo. Ya te dejamos uno de ejemplo para que pruebes.' },
    { i: 'mic', h: 'Lee y graba, línea por línea', p: 'Verás el texto bien grande. Toca el botón rojo, lee, y repite las veces que quieras hasta que te guste.' },
    { i: 'film', h: 'Elige las buenas y descárgalas', p: 'Escucha todas tus tomas juntas, borra las que no sirvan y descarga las mejores.' },
  ];
  let i = 0;
  const m = modal('<div class="bienv" id="bv"></div>', { fijo: true });
  const pintar = () => {
    const p = pasos[i], ultimo = i === pasos.length - 1;
    $('#bv', m.el).innerHTML = `<div class="paso-ic">${ic(p.i, 38)}</div><h2>${p.h}</h2><p>${p.p}</p>
      ${ultimo ? `<div class="priv">${ic('shield', 18)} <b>Tus grabaciones nunca salen de tu dispositivo.</b> Se guardan en este navegador; no se envían a ningún servidor.</div>` : ''}
      <div class="pasos-pt">${pasos.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="pie" style="justify-content:center">${i ? '<button class="btn" data-at>Atrás</button>' : '<button class="btn suave" data-sk>Saltar</button>'}
      <button class="btn primario grande" data-sg>${ultimo ? 'Empezar' : 'Siguiente'}</button></div>`;
    $('[data-sg]', m.el).onclick = () => { if (ultimo) fin(); else { i++; pintar(); } };
    const at = $('[data-at]', m.el); if (at) at.onclick = () => { i--; pintar(); };
    const sk = $('[data-sk]', m.el); if (sk) sk.onclick = fin;
  };
  const fin = () => { lsSet('tomauno.bienvenida', true); m.close(); location.hash = '#guiones'; renderActual(); };
  pintar();
}

/* ============================================================ pantalla: Grabar */
const R = {
  estado: 'idle', stream: null, kind: null, ctx: null, an: null, srcNode: null, raf: 0, rec: null, chunks: [], mime: '', t0: 0, dur: 0,
  wake: null, rev: null, cuentaT: 0, timerT: 0, salio: false, ocupado: false, pico: 0, satFrames: 0, sat: false, bajoDesde: 0, scrollRaf: 0, pausaScroll: 0,
};
const GRABAR_HTML = `
<div class="g-top">
  <div class="g-info"><span class="g-linea" id="g-linea"></span><span class="g-sec" id="g-sec"></span></div>
  <div class="seg" role="group" aria-label="Qué vas a grabar">
    <button data-modo="voz" aria-pressed="true">${ic('mic', 18)} Solo voz</button>
    <button data-modo="video" aria-pressed="false">${ic('video', 18)} Video</button>
  </div>
  <button class="btn icono suave" id="g-ayuda" aria-label="Ayuda y atajos">${ic('help')}</button>
  <button class="btn icono suave" id="g-aj" aria-label="Ajustes">${ic('sliders')}</button>
</div>
<div class="stage" id="stage">
  <video id="prev" playsinline muted autoplay></video>
  <div class="guia" id="guia" hidden></div>
  <div class="texto-wrap" id="texto-wrap"></div>
  <button class="btn icono flotante" id="cam-sw" aria-label="Cambiar de cámara" hidden>${ic('switchcam')}</button>
  <div class="camara-off" id="camara-off" hidden><div class="card"><p><b>La cámara está apagada.</b> Al activarla, el navegador te pedirá permiso. El video se queda en tu dispositivo.</p><button class="btn primario" id="cam-on">${ic('video')} Activar cámara</button></div></div>
  <div class="rec-info" id="rec-info" hidden><span class="punto"></span><span id="timer">0:00</span></div>
  <div class="cuenta" id="cuenta" hidden></div>
  <div class="revision" id="revision" hidden></div>
  <div class="g-error" id="g-error" hidden></div>
</div>
<div class="g-bottom">
  <div class="medidor"><div class="barra" title="Nivel del micrófono"><i id="med"></i></div><span class="aviso" id="med-aviso" role="status"></span></div>
  <div class="g-controles" id="g-ctl">
    <button class="btn" id="g-prev">${ic('left')} <span>Anterior</span></button>
    <div class="rec-col"><button class="rec" id="rec" aria-label="Grabar"><span class="dot"></span></button><span class="rec-lbl" id="rec-lbl">Grabar</span></div>
    <button class="btn" id="g-next"><span>Siguiente</span> ${ic('right')}</button>
  </div>
  <div class="g-rev-acc" id="g-rev" hidden>
    <button class="btn primario" id="rv-ok" style="min-height:56px">${ic('check')} Me quedo con esta</button>
    <button class="btn" id="rv-rep" style="min-height:56px">${ic('undo')} Repetir</button>
    <button class="btn peligro grande icono" id="rv-del" aria-label="Borrar esta toma" style="width:56px">${ic('trash')}</button>
  </div>
  <div class="g-estado" id="g-estado"></div>
</div>`;

function soporte() {
  if (!window.isSecureContext && !enLocalhost) return 'inseguro';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'nomedia';
  if (!window.MediaRecorder) return 'norec';
  return null;
}
function mostrarError(html) { const e = $('#g-error'); e.innerHTML = `<div class="card">${html}</div>`; e.hidden = false; }
function ocultarError() { const e = $('#g-error'); if (e) e.hidden = true; }
function errorSoporte(motivo) {
  const t = {
    inseguro: '<h2>Aquí no se puede grabar</h2><p>Para usar el micrófono y la cámara, el navegador exige que la página se abra con <b>https://</b> (con candado). Esta dirección no es segura, así que lo bloquea. Abre la dirección oficial de TomaUno y vuelve a intentar.</p>',
    nomedia: '<h2>Este navegador no deja grabar</h2><p>No encuentro acceso al micrófono. Prueba con Chrome, Edge o Safari actualizados, y fuera de ventanas de otras apps (como el navegador interno de Instagram o WhatsApp: ábrela en Safari o Chrome).</p>',
    norec: '<h2>Tu navegador es muy viejo para grabar</h2><p>En iPhone, actualiza a iOS 14.3 o más nuevo. En otros equipos, usa Chrome, Edge o Safari actualizados.</p>',
  }[motivo];
  mostrarError(t);
}
function errorPermiso(err, kind) {
  const n = err && err.name, que = kind === 'video' ? 'la cámara y el micrófono' : 'el micrófono';
  let h;
  if (n === 'NotAllowedError' || n === 'SecurityError') {
    h = `<h2>Falta el permiso para usar ${que}</h2><p>Sin ese permiso no se puede grabar. Para activarlo:</p>
      <p><b>En iPhone (Safari):</b> toca <b>aA</b> junto a la dirección, luego <b>Ajustes del sitio web</b> y pon ${kind === 'video' ? 'Cámara y Micrófono' : 'Micrófono'} en <b>Permitir</b>. Si no sale, ve a Ajustes del iPhone &gt; Safari &gt; Micrófono / Cámara.</p>
      <p><b>En Chrome (PC o Android):</b> toca el candado (o el ícono de ajustes) junto a la dirección, entra a <b>Permisos</b> y permite ${kind === 'video' ? 'cámara y micrófono' : 'el micrófono'}.</p>
      <p>Después toca <b>Intentar de nuevo</b>.</p>`;
  } else if (n === 'NotFoundError' || n === 'OverconstrainedError') {
    h = `<h2>No encuentro ${kind === 'video' ? 'la cámara o el micrófono' : 'un micrófono'}</h2><p>Revisa que esté conectado. Si elegiste uno concreto en Ajustes, vuelve a «Predeterminado».</p>`;
  } else if (n === 'NotReadableError' || n === 'AbortError') {
    h = `<h2>${kind === 'video' ? 'La cámara o el micrófono' : 'El micrófono'} está ocupado</h2><p>Otra app o pestaña lo está usando (una videollamada, por ejemplo). Ciérrala y toca <b>Intentar de nuevo</b>.</p>`;
  } else h = `<h2>No pude abrir ${que}</h2><p>${esc((err && err.message) || 'Error desconocido')}</p>`;
  mostrarError(h + '<div class="acc" style="margin-top:12px"><button class="btn primario" id="err-re">Intentar de nuevo</button><button class="btn" id="err-x">Cerrar</button></div>');
  $('#err-re').onclick = () => { ocultarError(); if (S.aj.modo === 'video') activarCamara(); else onRec(); };
  $('#err-x').onclick = ocultarError;
}

function initGrabar() {
  const v = $('#v-grabar');
  v.innerHTML = GRABAR_HTML;
  v.addEventListener('click', e => {
    const mb = e.target.closest('[data-modo]');
    if (mb) return cambiarModo(mb.dataset.modo);
  });
  $('#g-prev').onclick = () => moverLinea(-1);
  $('#g-next').onclick = () => moverLinea(1);
  $('#rec').onclick = onRec;
  $('#g-aj').onclick = ajustes;
  $('#g-ayuda').onclick = ayuda;
  $('#cam-on').onclick = activarCamara;
  $('#cam-sw').onclick = cambiarCamara;
  $('#rv-ok').onclick = quedarme;
  $('#rv-rep').onclick = repetir;
  $('#rv-del').onclick = () => { if (R.rev) { const id = R.rev.meta.id; cerrarRevision(); borrarToma(id); } };
  const tw = $('#texto-wrap');
  ['wheel', 'touchstart', 'pointerdown'].forEach(ev => tw.addEventListener(ev, () => { R.pausaScroll = performance.now() + 2500; }, { passive: true }));
}

function pintarGrabar() {
  const v = $('#v-grabar'), sc = S.sc();
  const tw = $('#texto-wrap'), stage = $('#stage');
  if (!sc || S.lineas(sc).length === 0) {
    v.classList.add('sin-guion');
    tw.innerHTML = `<div class="card vacio">${ic('file', 44)}<h2>Primero elige un guion</h2><p>Para grabar necesitas un texto que leer.</p><button class="btn primario grande" id="ir-g">Ir a mis guiones</button></div>`;
    $('#ir-g').onclick = () => { location.hash = '#guiones'; };
    $('#g-linea').textContent = 'Sin guion'; $('#g-sec').textContent = '';
    return;
  }
  v.classList.remove('sin-guion');
  const ls = S.lineas(sc), i = S.idx(), l = ls[i], corrido = S.aj.lectura === 'corrido';
  $('#g-linea').textContent = corrido ? 'Lectura corrida' : `Línea ${l.etiqueta} · ${i + 1} de ${ls.length}`;
  $('#g-sec').textContent = (l.seccion && !corrido ? l.seccion + ' · ' : '') + sc.titulo;
  stage.classList.toggle('video', S.aj.modo === 'video');
  $$('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === S.aj.modo)));
  if (corrido) {
    tw.innerHTML = '<div class="corrido">' + ls.map(x => `${x.nota ? `<div class="nota">${esc(x.nota)}</div>` : ''}<div class="lin"><span class="et">Línea ${esc(x.etiqueta)}</span><div class="texto">${textoHTML(x.texto)}</div></div>`).join('') + '</div>';
    tw.scrollTop = 0;
  } else {
    const sig = ls[i + 1];
    tw.innerHTML = `${l.nota ? `<div class="nota">${esc(l.nota)}</div>` : ''}<div class="texto">${textoHTML(l.texto)}</div>${sig ? `<div class="sig"><small>Sigue</small>${esc(textoLimpio(sig.texto))}</div>` : ''}`;
    tw.scrollTop = 0;
  }
  $('#g-prev').disabled = corrido || i === 0 || R.estado === 'grabando';
  $('#g-next').disabled = corrido || i >= ls.length - 1 || R.estado === 'grabando';
  $('#g-prev').style.visibility = $('#g-next').style.visibility = corrido ? 'hidden' : '';
  $('#guia').hidden = !(S.aj.modo === 'video' && S.aj.guia);
  pintarEstadoLinea();
  pintarCamaraUI();
}
function pintarEstadoLinea() {
  const sc = S.sc(), el = $('#g-estado');
  if (!sc) return;
  const corrido = S.aj.lectura === 'corrido';
  const lid = corrido ? '__corrido' : (S.lineas(sc)[S.idx()] || {}).id;
  const ts = S.tomasDe(sc.id, lid), b = S.buena(sc.id, lid);
  el.innerHTML = ts.length ? `${pl(ts.length, 'toma', 'tomas')} en esta ${corrido ? 'lectura' : 'línea'} · ${b ? `<span class="chip ok">la buena es la toma ${b.num}</span>` : '<span class="chip av">sin elegir la buena</span>'} <button class="link" id="ver-t">Ver tomas</button>`
    : `<span class="chip">${corrido ? 'Aún sin lectura corrida' : 'Esta línea aún no tiene tomas'}</span>`;
  const vt = $('#ver-t'); if (vt) vt.onclick = () => { location.hash = '#tomas'; };
  const rb = $('#rec-lbl');
  if (R.estado === 'idle') rb.textContent = ts.length ? 'Otra toma' : 'Grabar';
}
function pintarCamaraUI() {
  const video = S.aj.modo === 'video', activa = !!(R.stream && R.kind === 'video');
  const stage = $('#stage');
  stage.classList.toggle('cam-off', video && !activa);
  $('#camara-off').hidden = !(video && !activa) || R.estado !== 'idle' || !!R.rev;
  $('#prev').hidden = !(video && activa);
  $('#prev').classList.toggle('espejo', S.aj.espejo && S.aj.facing === 'user');
  $('#cam-sw').hidden = !(video && activa) || R.estado === 'grabando';
}
function moverLinea(d) {
  const sc = S.sc(); if (!sc || R.estado === 'grabando' || R.estado === 'cuenta') return;
  const n = S.lineas(sc).length, i = Math.min(Math.max(S.idx() + d, 0), n - 1);
  if (R.rev) cerrarRevision();
  S.setIdx(i); pintarGrabar();
}
async function cambiarModo(m) {
  if (R.estado === 'grabando' || R.estado === 'cuenta') return toast('Primero termina la toma');
  if (m === S.aj.modo) return;
  if (R.rev) cerrarRevision();
  S.aj.modo = m; guardarAjustes();
  soltarStream();
  ocultarError();
  pintarGrabar();
}

/* ---- audio / medidor */
function prepararAudio() {
  try {
    if (!R.ctx) R.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (R.ctx.state === 'suspended') R.ctx.resume().catch(() => { });
  } catch (e) { R.ctx = null; }
}
function iniciarMedidor() {
  detenerMedidor();
  if (!R.ctx || !R.stream || !R.stream.getAudioTracks().length) return;
  try {
    R.srcNode = R.ctx.createMediaStreamSource(new MediaStream(R.stream.getAudioTracks()));
    R.an = R.ctx.createAnalyser(); R.an.fftSize = 1024;
    R.srcNode.connect(R.an);
  } catch (e) { return; }
  const buf = new Float32Array(R.an.fftSize), barra = $('#med'), av = $('#med-aviso');
  let ultimoAviso = '', pico = 0;
  const bucle = () => {
    R.raf = requestAnimationFrame(bucle);
    R.an.getFloatTimeDomainData(buf);
    let max = 0, suma = 0;
    for (let k = 0; k < buf.length; k++) { const a = Math.abs(buf[k]); if (a > max) max = a; suma += buf[k] * buf[k]; }
    const rms = Math.sqrt(suma / buf.length), db = 20 * Math.log10(rms || 1e-6);
    const nivel = Math.min(1, Math.max(0, (db + 60) / 60));
    barra.style.width = (nivel * 100).toFixed(0) + '%';
    barra.style.background = max >= 0.97 ? 'var(--rec)' : nivel > 0.8 ? 'var(--av)' : 'var(--ok)';
    pico = Math.max(pico * 0.995, max);
    const ahora = performance.now();
    let aviso = '', mal = false;
    if (max >= 0.97) R.satFrames++; else R.satFrames = 0;
    if (R.satFrames >= 3) { aviso = 'Se está saturando: aléjate un poco del micrófono.'; mal = true; if (R.estado === 'grabando') R.sat = true; }
    if (R.estado === 'grabando') {
      R.pico = Math.max(R.pico, max);
      if (!aviso && ahora - R.t0 > 2500 && pico < 0.02) { aviso = 'Casi no se oye: acércate al micrófono o revisa que sea el correcto.'; }
    }
    if (aviso !== ultimoAviso) { av.textContent = aviso; av.classList.toggle('mal', mal); ultimoAviso = aviso; }
  };
  bucle();
}
function detenerMedidor() {
  cancelAnimationFrame(R.raf);
  try { if (R.srcNode) R.srcNode.disconnect(); } catch (e) { /* ya estaba suelto */ }
  R.srcNode = null; R.an = null;
  const b = $('#med'); if (b) b.style.width = '0'; const a = $('#med-aviso'); if (a) a.textContent = '';
}

/* ---- flujo de cámara/micrófono */
function restricciones(kind) {
  const a = S.aj;
  const voz = a.mejorar ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
  const audio = Object.assign({}, voz, a.mic ? { deviceId: { exact: a.mic } } : {});
  let video = false;
  if (kind === 'video') {
    const alta = a.calidad === 'alta';
    video = Object.assign({ width: { ideal: alta ? 1920 : 1280 }, height: { ideal: alta ? 1080 : 720 } }, a.cam ? { deviceId: { exact: a.cam } } : { facingMode: { ideal: a.facing } });
  }
  return { audio, video };
}
async function pedirStream(kind) {
  if (R.stream && R.kind === kind && R.stream.getTracks().every(t => t.readyState === 'live')) return R.stream;
  soltarStream();
  let s;
  try { s = await navigator.mediaDevices.getUserMedia(restricciones(kind)); }
  catch (e) {
    if ((e.name === 'OverconstrainedError' || e.name === 'NotFoundError') && (S.aj.mic || S.aj.cam)) {
      s = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' });
    } else throw e;
  }
  R.stream = s; R.kind = kind;
  lsSet('tomauno.permiso', true);
  s.getTracks().forEach(t => t.addEventListener('ended', () => { if (R.stream === s && R.estado === 'idle') soltarStream(); }));
  if (kind === 'video') { const p = $('#prev'); p.srcObject = s; p.play().catch(() => { }); }
  iniciarMedidor();
  pintarCamaraUI();
  return s;
}
function soltarStream() {
  detenerMedidor();
  if (R.stream) R.stream.getTracks().forEach(t => t.stop());
  R.stream = null; R.kind = null;
  const p = $('#prev'); if (p) { p.srcObject = null; }
  pintarCamaraUI();
}
function explicarPermisos(kind) {
  if (lsGet('tomauno.permiso', false)) return Promise.resolve(true);
  return new Promise(res => {
    const que = kind === 'video' ? 'la cámara y el micrófono' : 'el micrófono';
    const m = modal(`<h2>Antes de grabar</h2><p>Ahora el navegador te va a pedir permiso para usar <b>${que}</b>. Di que sí para poder grabar.</p>
      <div class="priv">${ic('shield', 18)} Lo que grabes se guarda solo en este dispositivo. No se envía a ningún lado.</div>
      <div class="pie"><button class="btn" data-no>Ahora no</button><button class="btn primario grande" data-si autofocus>Entendido, continuar</button></div>`, { alCerrar: () => res(false), fijo: true });
    $('[data-no]', m.el).onclick = () => m.close();
    $('[data-si]', m.el).onclick = () => { m.ov.remove(); if (!$('.ov')) document.body.classList.remove('modal-abierto'); prepararAudio(); res(true); };
  });
}
async function activarCamara() {
  const so = soporte(); if (so) return errorSoporte(so);
  prepararAudio();
  if (!(await explicarPermisos('video'))) return;
  try { await pedirStream('video'); ocultarError(); } catch (e) { errorPermiso(e, 'video'); }
}
async function cambiarCamara() {
  if (R.estado !== 'idle') return;
  S.aj.facing = S.aj.facing === 'user' ? 'environment' : 'user'; S.aj.cam = ''; guardarAjustes();
  soltarStream();
  try { await pedirStream('video'); } catch (e) { errorPermiso(e, 'video'); }
}

/* ---- grabar */
function elegirMime(kind) {
  const lista = kind === 'video'
    ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  for (const m of lista) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* siguiente */ } }
  return '';
}
function setEstado(e) {
  R.estado = e;
  const rec = $('#rec'), lbl = $('#rec-lbl');
  rec.classList.toggle('on', e === 'grabando');
  rec.setAttribute('aria-label', e === 'grabando' ? 'Parar' : e === 'cuenta' ? 'Cancelar' : 'Grabar');
  if (e === 'grabando') lbl.textContent = 'Parar'; else if (e === 'cuenta') lbl.textContent = 'Cancelar'; else if (e === 'idle') pintarEstadoLinea();
  $('#rec-info').hidden = e !== 'grabando';
  $('#cuenta').hidden = e !== 'cuenta';
  const rev = e === 'revision';
  $('#g-ctl').hidden = rev; $('#g-rev').hidden = !rev; $('#revision').hidden = !rev; $('#texto-wrap').style.visibility = rev ? 'hidden' : '';
  const ocup = e === 'grabando' || e === 'cuenta';
  $('#g-prev').disabled = ocup || S.idx() === 0 || S.aj.lectura === 'corrido';
  $('#g-next').disabled = ocup || S.aj.lectura === 'corrido' || S.idx() >= S.lineas(S.sc()).length - 1;
  $$('[data-modo]').forEach(b => b.disabled = ocup);
  pintarCamaraUI();
}
async function onRec() {
  if (R.ocupado) return;
  if (R.estado === 'cuenta') return cancelarCuenta();
  if (R.estado === 'grabando') return parar();
  if (!S.sc()) return;
  const so = soporte(); if (so) return errorSoporte(so);
  R.ocupado = true;
  try {
    if (R.estado === 'revision') cerrarRevision();
    prepararAudio();
    const kind = S.aj.modo;
    if (!(R.stream && R.kind === kind) && !(await explicarPermisos(kind))) return;
    prepararAudio();
    try { await pedirStream(kind); ocultarError(); } catch (e) { return errorPermiso(e, kind); }
    if (S.aj.cuenta) { if (!(await cuentaAtras())) return; }
    empezar();
  } finally { R.ocupado = false; }
}
function cuentaAtras() {
  return new Promise(res => {
    let n = 3;
    const c = $('#cuenta');
    setEstado('cuenta');
    c.textContent = n;
    R.cuentaCancel = () => { clearInterval(R.cuentaT); res(false); };
    R.cuentaT = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(R.cuentaT); R.cuentaCancel = null; res(true); } else { c.textContent = n; if (navigator.vibrate) navigator.vibrate(20); }
    }, 1000);
  });
}
function cancelarCuenta() {
  if (R.cuentaCancel) { const f = R.cuentaCancel; R.cuentaCancel = null; f(); }
  setEstado('idle');
}
function empezar() {
  const kind = S.aj.modo, alta = S.aj.calidad === 'alta';
  R.mime = elegirMime(kind);
  const opts = { audioBitsPerSecond: alta ? 192000 : 128000 };
  if (kind === 'video') opts.videoBitsPerSecond = alta ? 8000000 : 3500000;
  if (R.mime) opts.mimeType = R.mime;
  let rec;
  try { rec = new MediaRecorder(R.stream, opts); }
  catch (e) { try { rec = new MediaRecorder(R.stream); } catch (e2) { setEstado('idle'); return mostrarError('<h2>No se pudo empezar a grabar</h2><p>' + esc(e2.message) + '</p>'); } }
  R.rec = rec; R.chunks = []; R.pico = 0; R.sat = false; R.satFrames = 0;
  rec.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
  rec.onstop = alParar;
  rec.onerror = () => { toast('Hubo un error al grabar'); };
  rec.start(1000);
  R.t0 = performance.now();
  setEstado('grabando');
  pedirWake();
  clearInterval(R.timerT);
  const tm = $('#timer'); tm.textContent = '0:00';
  R.timerT = setInterval(() => { tm.textContent = fmtDur((performance.now() - R.t0) / 1000); }, 250);
  if (S.aj.lectura === 'corrido') scrollAuto();
}
function scrollAuto() {
  const tw = $('#texto-wrap');
  tw.scrollTop = 0;
  let ultimo = performance.now(), acum = 0;
  const paso = ahora => {
    if (R.estado !== 'grabando') return;
    R.scrollRaf = requestAnimationFrame(paso);
    const dt = (ahora - ultimo) / 1000; ultimo = ahora;
    if (ahora < R.pausaScroll) return;
    acum += dt * S.aj.vel * S.aj.fs * 0.3;
    if (acum >= 1) { tw.scrollTop += Math.floor(acum); acum -= Math.floor(acum); }
  };
  R.scrollRaf = requestAnimationFrame(paso);
}
function parar() {
  if (R.estado !== 'grabando' || !R.rec) return;
  R.dur = (performance.now() - R.t0) / 1000;
  clearInterval(R.timerT); cancelAnimationFrame(R.scrollRaf);
  $('#rec-lbl').textContent = 'Guardando…';
  try { if (R.rec.state !== 'inactive') R.rec.stop(); } catch (e) { alParar(); }
}
async function alParar() {
  const rec = R.rec; R.rec = null;
  const mime = (rec && rec.mimeType) || R.mime || (S.aj.modo === 'video' ? 'video/webm' : 'audio/webm');
  const blob = new Blob(R.chunks, { type: mime }); R.chunks = [];
  releaseWake();
  const salio = R.salio; R.salio = false;
  const kind = S.aj.modo === 'video' ? 'video' : 'audio';
  const sc = S.sc();
  if (!blob.size || !sc) { setEstado('idle'); if (salio) soltarStream(); toast('No se grabó nada. Intenta de nuevo.'); return; }
  const lid = S.aj.lectura === 'corrido' ? '__corrido' : S.lineas(sc)[S.idx()].id;
  const num = S.takes.filter(t => t.scriptId === sc.id && t.lineId === lid).reduce((m, t) => Math.max(m, t.num), 0) + 1;
  const meta = { id: uid(), scriptId: sc.id, lineId: lid, num, kind, mime, dur: R.dur, size: blob.size, creado: Date.now(), good: false, deleted: null, sat: R.sat, bajo: R.pico < 0.05 };
  try { await DB.guardarToma(meta, blob); }
  catch (err) { setEstado('idle'); if (salio) soltarStream(); return errorGuardar(err, blob, meta); }
  S.takes.push(meta);
  pedirPersistencia();
  if (salio) { soltarStream(); setEstado('idle'); toast('Toma guardada'); return; }
  R.rev = { meta, url: URL.createObjectURL(blob) };
  mostrarRevision();
  setEstado('revision');
}
function errorGuardar(err, blob, meta) {
  const cuota = err && (err.name === 'QuotaExceededError' || /quota/i.test(err.message || ''));
  const m = modal(`<h2>${cuota ? 'No hay espacio para guardar' : 'No se pudo guardar la toma'}</h2>
    <p>${cuota ? 'El dispositivo se quedó sin espacio para tus grabaciones.' : esc(err && err.message || 'Error desconocido')} Esta toma todavía no se perdió: descárgala ahora.</p>
    <p class="sub">Para hacer espacio: descarga las tomas que quieras conservar y bórralas desde la pantalla Tomas (y vacía la papelera).</p>
    <div class="pie"><button class="btn primario" data-d>${ic('download')} Descargar esta toma</button><button class="btn" data-t>Ir a Tomas</button></div>`);
  $('[data-d]', m.el).onclick = () => descargarBlob(blob, nombreToma(meta));
  $('[data-t]', m.el).onclick = () => { m.close(); location.hash = '#tomas'; };
}
function mostrarRevision() {
  const r = $('#revision'), t = R.rev.meta;
  const media = t.kind === 'video' ? `<video id="rev-m" playsinline controls></video>` : `<audio id="rev-m" controls></audio>`;
  const ln = S.lineas(S.sc()).find(l => l.id === t.lineId);
  r.innerHTML = `<div class="lbl">${ln ? 'Línea ' + esc(ln.etiqueta) : 'Lectura corrida'} · toma ${t.num} · ${fmtDur(t.dur)}</div>${media}
    ${t.sat ? '<span class="chip av">Se saturó en algún momento</span>' : ''}${t.bajo ? '<span class="chip av">Se oyó muy bajito</span>' : ''}`;
  const m = $('#rev-m'); m.src = R.rev.url;
  m.play().catch(() => { });
}
function cerrarRevision() {
  if (!R.rev) return;
  const m = $('#rev-m'); if (m) { m.pause(); m.removeAttribute('src'); m.load(); }
  URL.revokeObjectURL(R.rev.url); R.rev = null;
  $('#revision').innerHTML = '';
  setEstado('idle');
}
async function quedarme() {
  if (!R.rev) return;
  const t = R.rev.meta;
  cerrarRevision();
  await marcarBuena(t.id);
  if (t.lineId === '__corrido') { toast('Lectura corrida guardada como buena'); pintarGrabar(); return; }
  const sc = S.sc(), n = S.lineas(sc).length;
  if (S.idx() < n - 1) { S.setIdx(S.idx() + 1); pintarGrabar(); }
  else {
    pintarGrabar();
    toast('¡Listo! Ya grabaste todas las líneas', { accion: 'Ver tomas', onAccion: () => { location.hash = '#tomas'; }, ms: 8000 });
  }
}
function repetir() {
  if (!R.rev) return;
  const id = R.rev.meta.id;
  cerrarRevision();
  borrarToma(id, 'Toma descartada');
}
async function marcarBuena(id) {
  const t = S.takes.find(x => x.id === id); if (!t) return;
  const otras = S.takes.filter(x => x.scriptId === t.scriptId && x.lineId === t.lineId && x.good && x.id !== id);
  for (const o of otras) { o.good = false; await DB.poner('takes', o); }
  t.good = true; await DB.poner('takes', t);
}
async function borrarToma(id, msg) {
  const t = S.takes.find(x => x.id === id); if (!t) return;
  t.wasGood = t.good; t.good = false; t.deleted = Date.now();
  await DB.poner('takes', t);
  if (P.activo === id) detener();
  renderActual();
  toast(msg || 'Toma borrada', { accion: 'Deshacer', onAccion: () => restaurarToma(id) });
}
async function restaurarToma(id) {
  const t = S.takes.find(x => x.id === id); if (!t) return;
  t.deleted = null;
  if (t.wasGood && !S.buena(t.scriptId, t.lineId)) t.good = true;
  t.wasGood = false;
  await DB.poner('takes', t);
  renderActual();
}
async function pedirWake() { try { if ('wakeLock' in navigator) R.wake = await navigator.wakeLock.request('screen'); } catch (e) { /* sin wake lock */ } }
function releaseWake() { try { if (R.wake) R.wake.release(); } catch (e) { /* ya liberado */ } R.wake = null; }
function pedirPersistencia() {
  if (S.persistente !== null || !(navigator.storage && navigator.storage.persist)) return;
  S.persistente = false;
  navigator.storage.persist().then(ok => { S.persistente = ok; }).catch(() => { });
}
function salirDeGrabar() {
  if (R.estado === 'cuenta') cancelarCuenta();
  if (R.estado === 'grabando') { R.salio = true; parar(); }
  else { if (R.rev) cerrarRevision(); soltarStream(); }
}

/* ---- ajustes y ayuda */
async function ajustes() {
  const a = S.aj;
  const m = modal(`<h2>Ajustes</h2>
    <label class="campo"><span>Cómo leer</span><select id="a-lect"><option value="linea">Línea por línea</option><option value="corrido">Corrido (todo el guion de una vez)</option></select></label>
    <label class="campo"><span>Tamaño de letra: <b id="a-fs-v">${a.fs}</b></span><input type="range" id="a-fs" min="20" max="90" step="2" value="${a.fs}"></label>
    <label class="campo"><span>Velocidad del texto en lectura corrida: <b id="a-vel-v">${a.vel}</b></span><input type="range" id="a-vel" min="1" max="10" value="${a.vel}"></label>
    <label class="campo"><span>Micrófono</span><select id="a-mic"></select></label>
    <label class="campo"><span>Cámara</span><select id="a-cam"></select></label>
    <p class="sub" id="a-nota"></p>
    <label class="campo"><span>Calidad</span><select id="a-cal"><option value="normal">Normal (ocupa menos espacio)</option><option value="alta">Alta (más nítida, ocupa más)</option></select></label>
    <label class="campo fila"><span>Mejorar la voz con los filtros del navegador<br><small class="sub">Quita ruido y eco, pero puede alterar la voz. Para locución, déjalo apagado.</small></span><input type="checkbox" id="a-mej" ${a.mejorar ? 'checked' : ''}></label>
    <label class="campo fila"><span>Verme como en un espejo<br><small class="sub">Solo en la vista previa; el video grabado no se voltea.</small></span><input type="checkbox" id="a-esp" ${a.espejo ? 'checked' : ''}></label>
    <label class="campo fila"><span>Guía vertical 9:16</span><input type="checkbox" id="a-gui" ${a.guia ? 'checked' : ''}></label>
    <label class="campo fila"><span>Cuenta atrás de 3 segundos</span><input type="checkbox" id="a-cue" ${a.cuenta ? 'checked' : ''}></label>
    <label class="campo"><span>Apariencia</span><select id="a-tema"><option value="auto">Automática</option><option value="dark">Oscura</option><option value="light">Clara</option></select></label>
    <div class="pie"><button class="btn primario" data-cerrar>Listo</button></div>`, { clase: 'ancha' });
  const q = s => $(s, m.el);
  q('#a-lect').value = a.lectura; q('#a-cal').value = a.calidad; q('#a-tema').value = a.tema;
  const cambiaDisp = () => { if (R.estado === 'idle') { const v = R.kind === 'video'; soltarStream(); if (v) activarCamara(); } };
  const on = (id, fn) => q(id).addEventListener('input', () => { fn(q(id)); guardarAjustes(); });
  on('#a-lect', e => { a.lectura = e.value; pintarGrabar(); });
  on('#a-fs', e => { a.fs = +e.value; q('#a-fs-v').textContent = a.fs; aplicarAjustes(); });
  on('#a-vel', e => { a.vel = +e.value; q('#a-vel-v').textContent = a.vel; });
  on('#a-cal', e => { a.calidad = e.value; });
  on('#a-mej', e => { a.mejorar = e.checked; cambiaDisp(); });
  on('#a-esp', e => { a.espejo = e.checked; pintarCamaraUI(); });
  on('#a-gui', e => { a.guia = e.checked; pintarGrabar(); });
  on('#a-cue', e => { a.cuenta = e.checked; });
  on('#a-tema', e => { a.tema = e.value; aplicarAjustes(); });
  on('#a-mic', e => { a.mic = e.value; cambiaDisp(); });
  on('#a-cam', e => { a.cam = e.value; cambiaDisp(); });
  let devs = [];
  try { devs = await navigator.mediaDevices.enumerateDevices(); } catch (e) { /* sin lista */ }
  const llena = (sel, tipo, actual, vacio) => {
    const l = devs.filter(d => d.kind === tipo);
    sel.innerHTML = `<option value="">${vacio}</option>` + l.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || (tipo === 'audioinput' ? 'Micrófono ' : 'Cámara ') + (i + 1))}</option>`).join('');
    sel.value = actual; if (sel.value !== actual) sel.value = '';
  };
  llena(q('#a-mic'), 'audioinput', a.mic, 'Predeterminado');
  llena(q('#a-cam'), 'videoinput', a.cam, 'Predeterminada');
  if (devs.length && devs.every(d => !d.label)) q('#a-nota').textContent = 'Los nombres de los equipos aparecen después de dar permiso al micrófono.';
}
function ayuda() {
  modal(`<h2>Ayuda</h2>
    <p class="sub">Atajos de teclado (en computadora)</p>
    <div class="atajos"><span><kbd>Espacio</kbd></span><span>Grabar / parar</span>
      <span><kbd>←</kbd> <kbd>→</kbd></span><span>Línea anterior / siguiente</span>
      <span><kbd>Enter</kbd></span><span>Me quedo con esta toma</span>
      <span><kbd>Supr</kbd></span><span>Borrar la última toma de la línea (con opción de deshacer)</span>
      <span><kbd>?</kbd></span><span>Abrir esta ayuda</span></div>
    <p class="sub" style="margin-top:14px">Consejos</p>
    <ul><li>Lee con calma; si te equivocas, toca <b>Repetir</b>: no pasa nada.</li>
    <li>Las tomas que borres van a la <b>Papelera</b> (en la pantalla Tomas) y se pueden recuperar.</li>
    <li>En video, pon el celular a la altura de los ojos para mirar cerca del lente.</li></ul>
    <div class="pie"><button class="btn primario" data-cerrar>Entendido</button></div>`);
}
document.addEventListener('keydown', e => {
  if (ruta() !== 'grabar' || $('.ov')) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!S.sc()) return;
  if (e.key === ' ' || e.code === 'Space') { if (tag === 'button' && e.target.id !== 'rec') return; e.preventDefault(); onRec(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); moverLinea(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); moverLinea(-1); }
  else if (e.key === 'Enter' && R.estado === 'revision' && tag !== 'button') { e.preventDefault(); quedarme(); }
  else if (e.key === 'Delete' && R.estado === 'idle') {
    const sc = S.sc(), lid = S.aj.lectura === 'corrido' ? '__corrido' : S.lineas(sc)[S.idx()].id;
    const ult = S.tomasDe(sc.id, lid).slice(-1)[0];
    if (ult) borrarToma(ult.id); else toast('Esta línea no tiene tomas para borrar');
  } else if (e.key === '?') ayuda();
});

/* ============================================================ pantalla: Tomas */
function filaToma(t) {
  const tipo = t.kind === 'video' ? 'Video' : 'Voz';
  return `<div class="toma" data-tid="${t.id}">
    <div class="toma-info"><b>Toma ${t.num}</b><span>${fmtDur(t.dur)}</span><span class="sub">${tipo} · ${fmtHora(t.creado)}</span>
      ${t.good ? '<span class="chip ok">La buena</span>' : ''}${t.sat ? '<span class="chip av">Saturó</span>' : ''}${t.bajo ? '<span class="chip av">Muy bajito</span>' : ''}</div>
    <div class="toma-btns">
      <button class="btn" data-a="ver" aria-label="Reproducir toma ${t.num}">${ic('play', 18)} <span>${t.kind === 'video' ? 'Ver' : 'Escuchar'}</span></button>
      ${t.good ? '' : `<button class="btn" data-a="buena" aria-label="Marcar toma ${t.num} como la buena">${ic('check', 18)} <span>Es la buena</span></button>`}
      <button class="btn" data-a="bajar" aria-label="Descargar toma ${t.num}">${ic('download', 18)} <span>Descargar</span></button>
      <button class="btn peligro" data-a="borrar" aria-label="Borrar toma ${t.num}">${ic('trash', 18)} <span>Borrar</span></button>
    </div></div>`;
}
function renderTomas() {
  const el = $('#v-tomas'), sc = S.sc();
  const panel = $('#player-panel');
  if (!el.dataset.listo) {
    el.dataset.listo = '1';
    el.innerHTML = `<div class="cont" id="tomas-cont"></div>
      <div class="player-panel" id="player-panel" hidden><div class="pp-fila"><b id="pp-info"></b><button class="btn" id="pp-stop">${ic('stop', 18)} Detener</button></div><video id="player" playsinline controls></video></div>`;
    $('#pp-stop').onclick = detener;
    pEl().addEventListener('ended', () => { if (P.cola.length > 1 && P.i < P.cola.length - 1) { P.i++; sonar(); } else detener(); });
    pEl().addEventListener('error', () => { if (!P.activo) return; toast('No se pudo reproducir esa toma'); if (P.i < P.cola.length - 1) { P.i++; sonar(); } else detener(); });
    el.addEventListener('click', clicTomas);
  }
  const cont = $('#tomas-cont');
  if (!sc) {
    cont.innerHTML = `<div class="card vacio">${ic('film', 44)}<h2>Aún no hay nada que mostrar</h2><p>Elige un guion y graba sus líneas; aquí verás todas las tomas juntas.</p><a class="btn primario grande" href="#guiones">Ir a mis guiones</a></div>`;
    return;
  }
  const a = analizar(sc.md), ls = a.lineas, p = S.progreso(sc);
  const enPap = S.takes.filter(t => t.scriptId === sc.id && t.deleted).length;
  const puedeCompartir = !!(navigator.share && navigator.canShare);
  const nombresConocidos = new Set(ls.map(l => l.id).concat('__corrido'));
  const huerfanas = S.takes.filter(t => t.scriptId === sc.id && !t.deleted && !nombresConocidos.has(t.lineId));
  const corr = S.tomasDe(sc.id, '__corrido');
  const bloques = ls.map(l => {
    const ts = S.tomasDe(sc.id, l.id), b = S.buena(sc.id, l.id);
    const estado = b ? '<span class="chip ok">Lista</span>' : ts.length ? '<span class="chip av">Elige la buena</span>' : '<span class="chip falta">Falta grabar</span>';
    return `<article class="card linea" data-lid="${l.id}"><div class="linea-cab"><span class="et">Línea ${esc(l.etiqueta)}</span><span class="lt">${esc(textoLimpio(l.texto))}</span>${estado}</div>
      ${ts.length ? ts.map(filaToma).join('') : ''}
      <div class="falta-fila">${ts.length ? '<span class="sub">¿Otra toma?</span>' : '<span class="sub">Esta línea aún no tiene tomas.</span>'}<button class="btn ${ts.length ? '' : 'primario'}" data-a="grabar-linea" data-n="${l.n - 1}">${ic('mic', 18)} ${ts.length ? 'Grabar otra' : 'Grabar esta línea'}</button></div></article>`;
  }).join('');
  const extra = (tit, ts) => ts.length ? `<h2 class="sec-tit">${tit}</h2><article class="card linea" data-lid="${ts[0].lineId}">${ts.map(filaToma).join('')}</article>` : '';
  cont.innerHTML = `<div class="pagina-cab"><h1>${esc(sc.titulo)}</h1></div>
    <div class="card resumen">
      <div><b>${p.listas} de ${pl(p.total, 'línea lista', 'líneas listas')}</b><div class="prog"><i style="width:${p.total ? Math.round(p.listas * 100 / p.total) : 0}%"></i></div></div>
      <div class="acc">
        <button class="btn primario grande" data-a="todo">${ic('play')} Reproducir todo</button>
        <button class="btn grande" data-a="zip">${ic('download')} Descargar todo</button>
        ${puedeCompartir ? `<button class="btn grande" data-a="compartir">${ic('share')} Compartir</button>` : ''}
        <button class="btn" data-a="papelera">${ic('trash')} Papelera${enPap ? ' (' + enPap + ')' : ''}</button>
      </div>
      <div class="almacen" id="almacen">&nbsp;</div>
    </div>
    ${bloques}${extra('Lectura corrida', corr)}${extra('Tomas de líneas que ya no existen en el guion', huerfanas)}`;
  marcarSonando(false);
  pintarAlmacen();
}
async function pintarAlmacen() {
  const el = $('#almacen'); if (!el) return;
  let txt = '';
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      txt = `Espacio usado: ${fmtBytes(e.usage || 0)}${e.quota ? ' de ' + fmtBytes(e.quota) + ' disponibles' : ''}.`;
    }
    if (navigator.storage && navigator.storage.persisted) {
      const per = await navigator.storage.persisted();
      if (per) S.persistente = true;
      else if (navigator.storage.persist) { S.persistente = await navigator.storage.persist(); }
      txt += S.persistente ? ' Tus tomas están protegidas contra borrado automático.' : ' El navegador podría borrar las tomas si se queda sin espacio: descarga las que te importen.';
    }
  } catch (e) { /* sin estimación */ }
  if (el.isConnected) el.innerHTML = esc(txt) || '&nbsp;';
}
function gruposParaDescarga() {
  const sc = S.sc(), out = [];
  for (const l of S.lineas(sc)) { const b = S.buena(sc.id, l.id); if (b) out.push(b); }
  const c = S.buena(sc.id, '__corrido'); if (c) out.push(c);
  return out;
}
async function clicTomas(e) {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a, sc = S.sc();
  const tid = b.closest('[data-tid]') && b.closest('[data-tid]').dataset.tid;
  const t = tid && S.takes.find(x => x.id === tid);
  if (a === 'ver' && t) { P.cola = [t]; P.i = 0; await sonar(); }
  if (a === 'buena' && t) { await marcarBuena(t.id); renderTomas(); toast('Toma ' + t.num + ' marcada como la buena'); }
  if (a === 'borrar' && t) borrarToma(t.id);
  if (a === 'bajar' && t) { const bl = await DB.blob(t.id); if (bl) descargarBlob(bl, nombreToma(t)); }
  if (a === 'grabar-linea') irAGrabar(sc.id, +b.dataset.n);
  if (a === 'papelera') papelera();
  if (a === 'todo') {
    const ls = S.lineas(sc), cola = [];
    ls.forEach(l => { const x = S.tomaParaReproducir(sc.id, l.id); if (x) cola.push(x); });
    if (!cola.length) return toast('Todavía no hay tomas para reproducir');
    if (cola.length < ls.length) toast(`Faltan ${ls.length - cola.length} líneas por grabar: se saltan`);
    P.cola = cola; P.i = 0; await sonar();
  }
  if (a === 'zip' || a === 'compartir') descargarTodo(a === 'compartir', b);
}
async function descargarTodo(compartir) {
  const sc = S.sc(), buenas = gruposParaDescarga();
  if (!buenas.length) return toast('Primero elige al menos una toma buena');
  const pend = toast('Preparando…', { ms: 60000 });
  try {
    const files = [];
    for (const t of buenas) { const bl = await DB.blob(t.id); if (bl) files.push({ nombre: nombreToma(t), blob: bl, t }); }
    pend.remove();
    if (compartir) {
      const fs = files.map(f => new File([f.blob], f.nombre, { type: (f.t.mime || '').split(';')[0] }));
      if (navigator.canShare && navigator.canShare({ files: fs })) {
        try { await navigator.share({ files: fs, title: sc.titulo }); } catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir; usa Descargar todo'); }
        return;
      }
      return toast('Este dispositivo no puede compartir archivos; usa Descargar todo');
    }
    if (files.length === 1) return descargarBlob(files[0].blob, files[0].nombre);
    const zip = await hacerZip(files);
    descargarBlob(zip, slug(sc.titulo) + '.zip');
    toast('Descargando ' + pl(files.length, 'toma', 'tomas') + ' en un ZIP', {
      accion: 'Una por una', onAccion: () => files.forEach((f, i) => setTimeout(() => descargarBlob(f.blob, f.nombre), i * 700)), ms: 9000 });
  } catch (err) { pend.remove(); toast('No se pudo preparar la descarga: ' + err.message); }
}
function papelera() {
  const sc = S.sc();
  const lista = () => {
    const ts = S.takes.filter(t => t.scriptId === sc.id && t.deleted).sort((a, b) => b.deleted - a.deleted);
    if (!ts.length) return '<p class="sub" style="padding:16px 0">La papelera está vacía.</p>';
    return ts.map(t => `<div class="pap-fila"><div><b>${t.lineId === '__corrido' ? 'Lectura corrida' : 'Línea ' + esc(t.lineId.replace(/^L0?/, ''))}</b> · toma ${t.num} · ${fmtDur(t.dur)}<div class="sub">Borrada ${new Date(t.deleted).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
      <button class="btn" data-r="${t.id}">${ic('undo', 18)} Restaurar</button></div>`).join('');
  };
  const m = modal(`<h2>Papelera</h2><p class="sub">Aquí están las tomas que borraste. Puedes recuperarlas.</p><div id="pap-l">${lista()}</div>
    <div class="pie"><button class="btn peligro" id="pap-vac">${ic('trash', 18)} Vaciar papelera</button><button class="btn primario" data-cerrar>Cerrar</button></div>`, { clase: 'ancha' });
  m.el.addEventListener('click', async e => {
    const r = e.target.closest('[data-r]');
    if (r) { await restaurarToma(r.dataset.r); $('#pap-l', m.el).innerHTML = lista(); }
  });
  $('#pap-vac', m.el).onclick = async () => {
    const ids = S.takes.filter(t => t.scriptId === sc.id && t.deleted).map(t => t.id);
    if (!ids.length) return toast('La papelera ya está vacía');
    m.ov.style.display = 'none';
    const ok = await confirmar('¿Vaciar la papelera?', `Se borrarán para siempre <b>${pl(ids.length, 'toma', 'tomas')}</b>. Esto no se puede deshacer.`, 'Sí, vaciar');
    if (!ok) { m.ov.style.display = ''; return; }
    try { await DB.borrarTomas(ids); } catch (err) { m.ov.style.display = ''; return toast('No se pudo vaciar: ' + err.message); }
    S.takes = S.takes.filter(t => !ids.includes(t.id));
    m.close(); renderActual(); toast('Papelera vaciada');
  };
}

/* ============================================================ enrutado */
const RUTAS = ['guiones', 'grabar', 'tomas'];
const ruta = () => { const h = location.hash.slice(1); return RUTAS.includes(h) ? h : 'guiones'; };
let rutaPrev = null;
function renderActual() {
  const r = ruta();
  if (r === 'guiones') renderGuiones();
  if (r === 'grabar') pintarGrabar();
  if (r === 'tomas') renderTomas();
}
function go() {
  const r = ruta();
  if (rutaPrev === 'grabar' && r !== 'grabar') salirDeGrabar();
  if (rutaPrev === 'tomas' && r !== 'tomas') detener();
  RUTAS.forEach(x => { $('#v-' + x).classList.toggle('activa', x === r); const t = $('#tab-' + x); if (x === r) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  rutaPrev = r;
  renderActual();
  const v = $('#v-' + r); if (r !== 'grabar') v.scrollTop = 0;
  document.title = { guiones: 'Guiones', grabar: 'Grabar', tomas: 'Tomas' }[r] + ' · TomaUno';
}
window.addEventListener('hashchange', go);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && rutaPrev === 'grabar') {
    if (R.estado === 'cuenta') cancelarCuenta();
    if (R.estado === 'grabando') { R.salio = true; parar(); } else soltarStream();
  }
});
window.addEventListener('pagehide', () => { if (rutaPrev === 'grabar' && R.estado !== 'grabando') soltarStream(); });

/* ============================================================ modo prueba (solo localhost) */
function instalarPrueba() {
  const md = navigator.mediaDevices || (navigator.mediaDevices = {});
  md.getUserMedia = async c => {
    const out = new MediaStream();
    if (c.audio) {
      const ac = new AudioContext(); await ac.resume();
      const osc = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), dest = ac.createMediaStreamDestination();
      osc.frequency.value = 170; osc.type = 'sawtooth'; g.gain.value = 0.3; lfo.frequency.value = 2.5; lg.gain.value = 0.25;
      lfo.connect(lg); lg.connect(g.gain); osc.connect(g); g.connect(dest); osc.start(); lfo.start();
      dest.stream.getAudioTracks().forEach(t => out.addTrack(t));
    }
    if (c.video) {
      const cv = document.createElement('canvas'); cv.width = 360; cv.height = 640;
      const x = cv.getContext('2d'); let k = 0;
      setInterval(() => { k++; x.fillStyle = '#254'; x.fillRect(0, 0, 360, 640); x.fillStyle = '#fc6'; x.beginPath(); x.arc(180 + Math.sin(k / 10) * 100, 320, 60, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '28px sans-serif'; x.fillText('cámara de prueba ' + k, 20, 60); }, 40);
      cv.captureStream(25).getVideoTracks().forEach(t => out.addTrack(t));
    }
    return out;
  };
  $('#prueba-tag').hidden = false;
}

/* ============================================================ arranque */
async function iniciar() {
  const nav = { guiones: ['list', 'Guiones'], grabar: ['mic', 'Grabar'], tomas: ['film', 'Tomas'] };
  RUTAS.forEach(r => { $('#tab-' + r).innerHTML = ic(nav[r][0], 22) + '<span>' + nav[r][1] + '</span>'; });
  aplicarAjustes();
  if (enLocalhost && /[?&]prueba=1/.test(location.search)) instalarPrueba();
  initGrabar();
  try {
    await DB.abrir();
    S.scripts = (await DB.todos('scripts')).sort((a, b) => b.creado - a.creado);
    S.takes = await DB.todos('takes');
  } catch (e) {
    $('#v-guiones').innerHTML = `<div class="cont"><div class="card vacio"><h2>No puedo guardar datos aquí</h2><p>${esc(e.message)} Si estás en una ventana privada, abre TomaUno en una normal.</p></div></div>`;
    $('#v-guiones').classList.add('activa');
    return;
  }
  if (S.cur && !S.scripts.some(s => s.id === S.cur)) S.cur = null;
  if (!S.cur && S.scripts[0]) S.elegir(S.scripts[0].id);
  await sembrarEjemplo();
  fetch('guiones.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
    if (Array.isArray(j)) { const v = j.filter(g => g && g.id && g.titulo && typeof g.md === 'string' && !g.donar); if (v.length) S.biblioteca = v; }
  }).catch(() => { });
  go();
  if (!lsGet('tomauno.bienvenida', false)) bienvenida();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || enLocalhost)) navigator.serviceWorker.register('sw.js').catch(() => { });
  window.TomaUno = { parsear, S };
}
iniciar();
