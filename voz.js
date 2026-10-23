'use strict';
/* TomaUno · Donar voz. Una persona firma, lee un guion y graba su voz para que alguien
   cree con IA la voz de un personaje virtual.

   Envío: si ENVIO.url está puesto, al terminar la grabación y la autorización se mandan solas a una
   carpeta privada de Google Drive (ver web/_herramientas/drive/). Si no, la persona guarda un .zip
   y lo manda por WhatsApp como «Documento». Siempre queda el plan B de guardarlo en el teléfono.

   Enlace:  voz.html?para=Nombre&guion=voz-abuela&wa=18095551234
     para   quién recibe la voz (sale en la autorización). Si falta: QUIEN_RECIBE.
     guion  id de un guion de guiones.json con el campo "donar": sale marcado como recomendado.
     wa     número de WhatsApp (solo dígitos) para el botón que abre ese chat. Opcional. */

/* ============================================================ envío a Google Drive */
const ENVIO = {
  // dirección /exec del Apps Script publicado (web/_herramientas/drive/LEEME.md)
  url: 'https://script.google.com/macros/s/AKfycbyZc3aIcayUPW7spOK5qVrZ-aBHnY3DYPPr1N-BC9kQP_cZbUrk2z0GN-b5_dPBvYsESw/exec',
  codigo: 'lWrHonVQBwKyTY-_', // el mismo CODIGO que está en Codigo.gs
};
const conEnvio = () => !!(ENVIO.url && ENVIO.codigo);

/* ============================================================ utilidades */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDur = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmtBytes = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const enLocalhost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname);
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: no pasa nada */ } };
const slug = s => (s || 'voz').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'voz';
const hoyISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const cuando = d => d.toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'medium' }) + ' (' + d.toISOString() + ')';
const fechaLarga = iso => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }); };

const ICONOS = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  firma: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  door: '<path d="M3 21h18M6 21V3h12v18"/><circle cx="14.5" cy="12" r="1"/>',
  fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7s3 4-2 7M14 12c4 0 7 1 7 4s-4 3-7-2M12 14c0 4-1 7-4 7s-3-4 2-7M10 12c-4 0-7-1-7-4s4-3 7 2"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="2" y1="2" x2="22" y2="22"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  clip: '<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  alerta: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  derecha: '<polyline points="9 18 15 12 9 6"/>',
  izquierda: '<polyline points="15 18 9 12 15 6"/>',
  oido: '<path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4-3 5.5s-1 3.5-3.5 3.5"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/>',
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
/* zip sin compresión: copia de hacerZip() de app.js */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function hacerZip(archivos) { // [{nombre, blob}]
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

/* ============================================================ parámetros del enlace */
const QUIEN_RECIBE = 'Ruddy Plata';
const PARAMS = new URLSearchParams(location.search);
const limpio = (v, max) => (v || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const PARA = limpio(PARAMS.get('para'), 80) || QUIEN_RECIBE;
const WA = (PARAMS.get('wa') || '').replace(/\D/g, '').slice(0, 15);
const GUION_PEDIDO = limpio(PARAMS.get('guion'), 60);

/* ============================================================ autorización
   Si cambias el texto, sube VERSION_AUTORIZACION: el .txt dice qué versión firmó cada persona. */
const VERSION_AUTORIZACION = 2;
function autorizacion(nombre) {
  const puntos = [
    'Ese personaje se va a publicar en redes sociales (por ejemplo TikTok, Instagram, Facebook o YouTube) y se puede usar con fines comerciales: publicidad, ventas y contenido que genera dinero.',
    'La voz creada a partir de la mía puede decir frases que yo no grabé.',
    'El personaje no lleva mi nombre ni mi cara, y no se va a presentar como si fuera yo.',
    'Doy mi voz de forma voluntaria y sin pago, salvo que acordemos otra cosa por escrito.',
  ];
  if (conEnvio()) puntos.push(`Mi grabación y esta autorización se envían por internet a ${PARA} y se guardan en su Google Drive privado. No se comparten con nadie más tal como las grabé, y puedo pedirle que las borre cuando quiera.`);
  puntos.push('Puedo pedir por escrito que no se use más mi voz en contenido nuevo. Lo que ya esté publicado se puede quedar.');
  return {
    intro: `Yo, ${nombre}, autorizo a ${PARA} a usar la grabación de mi voz que hago hoy para crear, con inteligencia artificial, la voz de un personaje virtual.`,
    puntos,
    cierre: 'Confirmo que soy mayor de edad, que la voz de esta grabación es la mía y que no estoy imitando la voz de otra persona.',
  };
}

/* ============================================================ guiones */
function partesGuion(md) { // { nota, parrafos[] } — el mismo formato de guion que el resto de TomaUno
  const bloques = md.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split(/\n\s*\n/);
  const notas = [], parrafos = [];
  for (const b of bloques) {
    const rs = b.split('\n').map(r => r.trim()).filter(Boolean);
    if (!rs.length || rs[0].startsWith('#')) continue;
    if (rs[0].startsWith('>')) { notas.push(rs.map(r => r.replace(/^>+/, '').trim()).join(' ')); continue; }
    rs[0] = rs[0].replace(/^[0-9]{1,2}[a-zA-Z]?[.)]\s+/, '');
    parrafos.push(rs.join('\n'));
  }
  return { nota: notas.join(' '), parrafos };
}
const textoLimpio = t => t.replace(/\*\*/g, '').replace(/\[pausa[^\]]*\]/gi, ' ').replace(/[ \t]+/g, ' ').trim();
const textoHTML = t => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<span class="enf">$1</span>')
  .replace(/\[pausa[^\]]*\]/gi, '<span class="pausa">pausa</span>')
  .replace(/\n/g, '<br>');

/* ============================================================ estado */
const PASOS = ['inicio', 'permiso', 'guion', 'consejos', 'grabar', 'enviar'];
const MIN_SEG = 15, CORTA_SEG = 10, MAX_SEG = 90, META_SEG = 30;
const V = {
  paso: 'inicio', guiones: null, errorGuiones: false, guion: null, firma: null, toma: null, archivos: null, guardado: false,
  envio: 'nada', // nada | subiendo | listo | error
  empujes: 0,     // pasos guardados en el historial: así «Atrás» usa el mismo camino que el botón del teléfono
  // letra del teleprompter: si la persona no la ha cambiado, crece con el ancho del teléfono
  fs: lsGet('tomauno.voz.fs', Math.round(Math.min(40, Math.max(27, (window.innerWidth || 375) / 11)))), vel: lsGet('tomauno.voz.vel', 'normal'),
};
const A = { // micrófono y grabación
  ctx: null, stream: null, src: null, an: null, nodo: null, sink: null, raf: 0,
  estado: 'idle', chunks: [], ruidoMin: 0, t0: 0, timerT: 0, cuentaT: 0, cuentaCancel: null, scrollRaf: 0, pausaScroll: 0, wake: null,
};

/* ============================================================ navegación por pasos */
function irA(paso, push = true) {
  if (!PASOS.includes(paso)) paso = 'inicio';
  if (['guion', 'consejos', 'grabar', 'enviar'].includes(paso) && !V.firma) paso = 'permiso';
  if (['consejos', 'grabar', 'enviar'].includes(paso) && !V.guion) paso = 'guion';
  if (paso === 'enviar' && !V.toma) paso = 'grabar';
  if (V.paso === 'grabar' && paso !== 'grabar') salirDeGrabar();
  V.paso = paso;
  if (push) { history.pushState({ paso }, '', '#' + paso); V.empujes++; } else history.replaceState({ paso }, '', '#' + paso);
  const n = PASOS.indexOf(paso);
  $('#vz-paso').textContent = n ? `Paso ${n} de ${PASOS.length - 1}` : '';
  $('#vz-atras').hidden = !n;
  document.body.classList.toggle('en-grabar', paso === 'grabar'); // al grabar, el letrero de arriba se esconde: toda la pantalla es para el texto
  ({ inicio: pInicio, permiso: pPermiso, guion: pGuion, consejos: pConsejos, grabar: pGrabar, enviar: pEnviar })[paso]();
  const pag = $('.vz-pag'); if (pag) pag.scrollTop = 0;
}
window.addEventListener('popstate', e => { V.empujes = Math.max(0, V.empujes - 1); irA((e.state && e.state.paso) || 'inicio', false); });
function atras() { // el botón Atrás de arriba hace lo mismo que el del teléfono
  const n = PASOS.indexOf(V.paso);
  if (n <= 0) return;
  if (V.empujes > 0) history.back(); else irA(PASOS[n - 1], false);
}
$('#vz-atras').onclick = atras;
window.addEventListener('beforeunload', e => { if (V.toma && !V.guardado) { e.preventDefault(); e.returnValue = ''; } });
// barra: el botón principal del paso, fijo abajo para que siempre esté a mano
const pagina = (html, clase = '', barra = '') => {
  $('#vz').innerHTML = `<div class="vz-pag"><div class="vz-cont ${clase}">${html}</div></div>${barra ? `<div class="vz-acc"><div>${barra}</div></div>` : ''}`;
};
const fotoDe = g => 'voz-p-' + g.id.replace(/^voz-/, '') + '.webp';

/* ---- 1. bienvenida */
function pInicio() {
  const pasos = [
    ['Firma la autorización', 'Con tu nombre completo. Es un texto corto.'],
    ['Elige tu personaje', 'El que más se parezca a tu voz y a tu edad.'],
    ['Lee y graba', 'El texto va subiendo solo. Te escuchas y repites si quieres.'],
    conEnvio() ? ['Envíala', `Un toque y le llega a ${PARA}. No tienes que mandar nada por WhatsApp.`] : ['Mándasela', `Guardas el archivo y se lo mandas a ${PARA} por WhatsApp.`],
  ];
  pagina(`
    <div class="vz-mural"><img src="voz-mural.webp" alt="Mural pintado: una abuela y un joven dominicanos riéndose frente a un micrófono" width="1000" height="420"></div>
    <h1>Presta tu voz para un personaje</h1>
    <p class="vz-lead">${esc(PARA)} está creando personajes dominicanos con inteligencia artificial. Te pide que grabes tu voz leyendo un texto corto, de unos 25 segundos.</p>
    <div class="vz-texto-largo"><h2>¿Para qué es?</h2>
      <p style="margin-top:6px">Una inteligencia artificial aprende cómo suena tu voz y con ella le da voz a un personaje virtual que sale en videos de redes sociales. Ese personaje también se usa para ganar dinero, en publicidad y ventas. No lleva tu nombre ni tu cara.</p></div>
    <ol class="vz-pasos">${pasos.map(([t, d]) => `<li><span><b>${esc(t)}</b><span class="sub">${esc(d)}</span></span></li>`).join('')}</ol>
    <p class="priv">${ic('shield', 20)}<span>${conEnvio()
      ? `Tu voz va directo a una carpeta privada de ${esc(PARA)}. No se comparte con nadie más tal como la grabas. Toma unos 5 minutos y necesitas un cuarto callado.`
      : `Tu grabación no se sube a internet: se queda en tu teléfono hasta que tú la mandes. Toma unos 5 minutos y necesitas un cuarto callado.`}</span></p>`, 'vz-inicio',
    '<button class="btn primario grande ancho" id="i-ok">Empezar</button>');
  $('#i-ok').onclick = () => irA('permiso');
}

/* ---- 2. autorización */
function autHTML(nombre) {
  const a = autorizacion(`<span class="nom">${nombre ? esc(nombre) : '[tu nombre completo]'}</span>`);
  return `<p>${a.intro}</p><p>Entiendo y acepto que:</p><ul>${a.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p>${esc(a.cierre)}</p>`;
}
function pPermiso() {
  const f = V.firma || {};
  pagina(`
    <h1>Autorización</h1>
    <p class="sub">Léela con calma. Sin tu firma no se puede grabar. Se guarda en un archivo de texto junto con tu audio.</p>
    <div class="vz-hoja" id="aut">${autHTML(f.nombre)}</div>
    <label class="campo"><span>Tu nombre completo</span><input type="text" id="f-nombre" autocomplete="name" maxlength="100" placeholder="Nombre y apellidos" value="${esc(f.nombre || '')}"></label>
    <label class="campo"><span>Fecha</span><input type="date" id="f-fecha" value="${esc(f.fecha || hoyISO())}"></label>
    <div class="vz-checks-f">
    <label class="vz-check"><input type="checkbox" id="f-mayor" ${f.nombre ? 'checked' : ''}><span>Soy mayor de edad (tengo 18 años o más).</span></label>
    <label class="vz-check"><input type="checkbox" id="f-mia" ${f.nombre ? 'checked' : ''}><span>La voz que voy a grabar es la mía y no estoy imitando a nadie.</span></label>
    <label class="vz-check"><input type="checkbox" id="f-acepto" ${f.nombre ? 'checked' : ''}><span><b>Leí la autorización y la acepto.</b></span></label></div>
    `, '', '<p class="vz-falta" id="f-estado" role="status"></p><button class="btn primario grande ancho" id="f-ok" disabled>Firmar y seguir</button>');
  const nom = $('#f-nombre'), fecha = $('#f-fecha'), ok = $('#f-ok'), est = $('#f-estado');
  const revisar = () => {
    const n = limpio(nom.value, 100);
    $('#aut').innerHTML = autHTML(n);
    let falta = '';
    if (n.split(' ').filter(x => x.length > 1).length < 2) falta = 'Escribe tu nombre y tu apellido.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.value)) falta = 'Pon la fecha de hoy.';
    else if (!$('#f-mayor').checked || !$('#f-mia').checked || !$('#f-acepto').checked) falta = 'Marca las tres casillas para seguir.';
    est.textContent = falta; ok.disabled = !!falta;
  };
  $$('input', $('#vz')).forEach(i => i.addEventListener(i.type === 'checkbox' ? 'change' : 'input', revisar));
  revisar();
  ok.onclick = () => {
    if (ok.disabled) return;
    V.firma = { nombre: limpio(nom.value, 100), fecha: fecha.value, firmadoEn: cuando(new Date()) };
    V.archivos = null; V.envio = 'nada';
    irA('guion');
  };
}

/* ---- 3. elegir personaje */
async function cargarGuiones() {
  if (V.guiones) return;
  try {
    const r = await fetch('guiones.json', { cache: 'no-cache' });
    const j = r.ok ? await r.json() : [];
    V.guiones = (Array.isArray(j) ? j : []).filter(g => g && g.donar && g.id && g.titulo && typeof g.md === 'string' && partesGuion(g.md).parrafos.length);
    V.errorGuiones = false;
  } catch (e) { V.guiones = []; V.errorGuiones = true; }
}
async function pGuion() {
  pagina('<p class="sub">Cargando los personajes…</p>');
  await cargarGuiones();
  if (V.paso !== 'guion') return;
  if (!V.guiones.length) {
    pagina(`<div class="card vz-error"><h2>No pude cargar los textos</h2><p>${V.errorGuiones ? 'Revisa que tengas internet y vuelve a intentar.' : 'Esta página todavía no tiene textos para leer. Avísale a ' + esc(PARA) + '.'}</p></div>
      <button class="btn primario grande ancho" id="g-rep">Volver a intentar</button>`);
    $('#g-rep').onclick = () => { V.guiones = null; pGuion(); };
    return;
  }
  const lista = V.guiones.slice().sort((a, b) => (b.id === GUION_PEDIDO) - (a.id === GUION_PEDIDO));
  pagina(`
    <h1>Elige tu personaje</h1>
    <p class="sub">Escoge el que más se parezca a tu voz y a tu edad${GUION_PEDIDO ? `. Si ${esc(PARA)} te dijo cuál, es el que tiene la etiqueta amarilla` : ''}.</p>
    <div class="vz-pers">${lista.map(g => `
      <button class="vz-per ${V.guion && V.guion.id === g.id ? 'elegida' : ''}" data-g="${esc(g.id)}">
        <img src="${esc(fotoDe(g))}" alt="" width="360" height="360" loading="lazy">
        ${g.id === GUION_PEDIDO ? '<span class="vz-sello">Para ti</span>' : ''}
        <b>${esc(g.titulo)}</b><span class="sub">${esc(g.donar.quien || '')}</span>
      </button>`).join('')}</div>`);
  $('.vz-pers').addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const g = V.guiones.find(x => x.id === b.dataset.g);
    if (V.guion && V.guion.id !== g.id) descartarToma();
    V.guion = g;
    irA('consejos');
  });
}

/* ---- 4. consejos */
function pConsejos() {
  const p = partesGuion(V.guion.md);
  const tips = [
    ['door', 'Busca el cuarto más callado.', 'Cierra la puerta y la ventana.'],
    ['fan', 'Apaga lo que suene.', 'El abanico, el aire, la tele y la música. Pide que nadie hable cerca.'],
    ['phone', 'Celular a un palmo de la boca.', 'Unos 20 centímetros, un poquito de lado. No tapes el micrófono con la mano: está abajo.'],
    ['smile', 'Habla natural.', 'Como si le contaras algo a un amigo. No hace falta voz de locutor.'],
    ['bell', 'Pon el celular en «No molestar».', 'Así no suena ninguna notificación en medio de la toma.'],
  ];
  pagina(`
    <h1>Antes de grabar</h1>
    <ul class="vz-tips">${tips.map(([i, t, d]) => `<li>${ic(i, 26)}<span><b>${t}</b><span class="sub">${d}</span></span></li>`).join('')}</ul>
    <div class="vz-leer"><h2>Léelo una vez en voz alta</h2>
      ${p.nota ? `<p class="sub" style="margin-bottom:10px">${esc(p.nota)}</p>` : ''}
      ${p.parrafos.map(x => `<p>${textoHTML(x)}</p>`).join('')}</div>
    <div id="c-error"></div>
    <p class="sub">Al tocar «Abrir el micrófono», el teléfono te va a pedir permiso. Di que sí.</p>`, '',
    '<button class="btn primario grande ancho" id="c-ok">Abrir el micrófono</button>');
  $('#c-ok').onclick = async () => {
    const b = $('#c-ok'); b.disabled = true;
    try { await abrirMic(); irA('grabar'); }
    catch (e) { $('#c-error').innerHTML = errorMicHTML(e); b.disabled = false; }
  };
}
function errorMicHTML(e) {
  const n = e && e.name;
  let t;
  if (n === 'Inseguro') t = '<h2>Aquí no se puede grabar</h2><p>El navegador solo deja usar el micrófono en páginas con candado (<b>https://</b>). Abre el enlace tal como te lo mandaron.</p>';
  else if (n === 'SinAudio') t = '<h2>Este navegador no deja grabar</h2><p>Abre el enlace en <b>Chrome</b> (Android) o <b>Safari</b> (iPhone) actualizados. Si lo abriste dentro de Instagram o Facebook, toca los tres puntos y elige «Abrir en el navegador».</p>';
  else if (n === 'NotAllowedError' || n === 'SecurityError') t = '<h2>No hay permiso para el micrófono</h2><p>Toca el candado (o «aA» en iPhone) al lado de la dirección, permite el <b>micrófono</b> y vuelve a tocar el botón. Si no te sale, cierra esta pestaña y abre el enlace otra vez.</p>';
  else if (n === 'NotFoundError') t = '<h2>No encuentro el micrófono</h2><p>Si tienes audífonos o un micrófono conectado, desconéctalo y prueba otra vez.</p>';
  else if (n === 'NotReadableError' || n === 'AbortError') t = '<h2>Otra app está usando el micrófono</h2><p>Cierra la llamada, WhatsApp u otra app que esté grabando, y vuelve a intentar.</p>';
  else t = `<h2>No se pudo abrir el micrófono</h2><p>${esc((e && e.message) || 'Error desconocido')}. Prueba cerrando esta pestaña y abriendo el enlace otra vez.</p>`;
  return `<div class="card vz-error">${t}</div>`;
}

/* ============================================================ micrófono y grabación en WAV
   MediaRecorder siempre comprime. Para clonar una voz conviene el sonido tal cual, así que se
   copian las muestras del micrófono (sin filtros de llamada: ni eco, ni ruido, ni volumen
   automático) y se arma un WAV de 16 bits sin compresión. */
const MUESTRAS = 4096;
const WORKLET = `class TomaVoz extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(${MUESTRAS}); this.n = 0; }
  process(ins) {
    const c = ins[0] && ins[0][0];
    if (c) for (let i = 0; i < c.length; i++) {
      this.b[this.n++] = c[i];
      if (this.n === this.b.length) { this.port.postMessage(this.b, [this.b.buffer]); this.b = new Float32Array(${MUESTRAS}); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('toma-voz', TomaVoz);`;

async function abrirMic() {
  if (!window.isSecureContext && !enLocalhost) throw Object.assign(new Error('inseguro'), { name: 'Inseguro' });
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('sin audio'), { name: 'SinAudio' });
  if (A.stream && A.stream.getAudioTracks().some(t => t.readyState === 'live') && A.ctx && A.ctx.state !== 'closed') { await A.ctx.resume().catch(() => { }); return; }
  cerrarMic();
  const ctx = new Ctx(); // se crea dentro del toque: iPhone no deja arrancar el audio de otra forma
  A.ctx = ctx;
  ctx.resume().catch(() => { });
  let s;
  const pedir = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 } };
  try { s = await navigator.mediaDevices.getUserMedia({ audio: pedir }); }
  catch (e) {
    if (e.name !== 'OverconstrainedError' && e.name !== 'TypeError') { cerrarMic(); throw e; }
    try { s = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e2) { cerrarMic(); throw e2; }
  }
  await ctx.resume().catch(() => { });
  A.stream = s;
  A.src = ctx.createMediaStreamSource(s);
  A.an = ctx.createAnalyser(); A.an.fftSize = 1024;
  A.src.connect(A.an);
  A.sink = ctx.createGain(); A.sink.gain.value = 0; A.sink.connect(ctx.destination); // nada sale por el altavoz
  A.nodo = await nodoCaptura(ctx);
  A.src.connect(A.nodo); A.nodo.connect(A.sink);
  s.getAudioTracks().forEach(t => t.addEventListener('ended', () => {
    if (A.stream !== s) return;
    if (A.estado === 'grabando') parar(); else if (A.estado === 'cuenta') cancelarCuenta();
    cerrarMic(); toast('Se perdió el micrófono. Toca Grabar para abrirlo otra vez.');
  }));
}
async function nodoCaptura(ctx) {
  const recibir = buf => {
    if (A.estado !== 'grabando') return;
    A.chunks.push(buf);
    let suma = 0; for (let i = 0; i < buf.length; i++) suma += buf[i] * buf[i];
    const db = 10 * Math.log10(suma / buf.length || 1e-12);
    if (A.chunks.length > 1) A.ruidoMin = Math.min(A.ruidoMin, db); // el bloque más callado ≈ ruido del cuarto
  };
  if (ctx.audioWorklet && window.AudioWorkletNode) {
    try {
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const n = new AudioWorkletNode(ctx, 'toma-voz', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit' });
      n.port.onmessage = e => recibir(e.data);
      return n;
    } catch (e) { /* navegador viejo: sigue con el método anterior */ }
  }
  const n = ctx.createScriptProcessor(MUESTRAS, 1, 1);
  n.onaudioprocess = e => recibir(new Float32Array(e.inputBuffer.getChannelData(0)));
  return n;
}
function cerrarMic() {
  detenerMedidor();
  try { if (A.src) A.src.disconnect(); if (A.nodo) A.nodo.disconnect(); } catch (e) { /* ya estaba suelto */ }
  if (A.stream) A.stream.getTracks().forEach(t => t.stop());
  if (A.ctx && A.ctx.state !== 'closed') A.ctx.close().catch(() => { });
  A.ctx = A.stream = A.src = A.an = A.nodo = A.sink = null;
}
function hacerWav(chunks, sr) {
  const n = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const txt = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); txt(8, 'WAVE');
  txt(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  txt(36, 'data'); v.setUint32(40, n * 2, true);
  let o = 44, pico = 0, saturadas = 0;
  for (const c of chunks) for (let i = 0; i < c.length; i++) {
    const s = Math.max(-1, Math.min(1, c[i])), a = Math.abs(s);
    if (a > pico) pico = a;
    if (a >= 0.985) saturadas++;
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
  }
  return { blob: new Blob([buf], { type: 'audio/wav' }), dur: n / sr, pico, saturadas };
}

/* ---- medidor */
function iniciarMedidor() {
  detenerMedidor();
  if (!A.an) return;
  const buf = new Float32Array(A.an.fftSize), barra = $('#med'), av = $('#med-aviso');
  if (!barra) return;
  let ultimo = '', pico = 0, sat = 0;
  const bucle = () => {
    A.raf = requestAnimationFrame(bucle);
    if (!A.an) return;
    A.an.getFloatTimeDomainData(buf);
    let max = 0, suma = 0;
    for (let k = 0; k < buf.length; k++) { const a = Math.abs(buf[k]); if (a > max) max = a; suma += buf[k] * buf[k]; }
    const db = 20 * Math.log10(Math.sqrt(suma / buf.length) || 1e-6);
    const nivel = Math.min(1, Math.max(0, (db + 60) / 60));
    barra.style.width = (nivel * 100).toFixed(0) + '%';
    barra.style.background = max >= 0.97 ? 'var(--rojo)' : nivel > 0.8 ? 'var(--amarillo)' : 'var(--verde)';
    pico = Math.max(pico * 0.995, max);
    sat = max >= 0.97 ? sat + 1 : 0;
    let aviso = '', mal = false;
    if (sat >= 3) { aviso = 'Muy fuerte: aleja un poquito el celular.'; mal = true; }
    else if (A.estado === 'grabando' && performance.now() - A.t0 > 3000 && pico < 0.02) aviso = 'Casi no se oye: acércate al celular.';
    else if (A.estado === 'idle') aviso = 'Di algo para probar: la barra se tiene que mover.';
    if (aviso !== ultimo) { av.textContent = aviso; av.classList.toggle('mal', mal); ultimo = aviso; }
  };
  bucle();
}
function detenerMedidor() {
  cancelAnimationFrame(A.raf);
  const b = $('#med'); if (b) b.style.width = '0';
}

/* ---- 5. grabar */
const VELOCIDADES = { lenta: 32, normal: 26, rapida: 21 }; // segundos que tarda el texto en pasar
const ANILLO = 2 * Math.PI * 48;
function pGrabar() {
  const p = partesGuion(V.guion.md);
  $('#vz').innerHTML = `<div id="vz-grabar">
    <div class="g-top">
      <button class="btn icono" id="g-atras" aria-label="Atrás">${ic('izquierda', 24)}</button>
      <div class="g-info"><img src="${esc(fotoDe(V.guion))}" alt="" width="36" height="36"><span><span class="g-linea">${esc(V.guion.titulo)}</span><span class="g-sec">Lo ideal: 20 a 30 segundos</span></span></div>
      <button class="btn icono" id="t-menos" aria-label="Letra más pequeña" style="font-size:14px">A−</button>
      <button class="btn icono" id="t-mas" aria-label="Letra más grande" style="font-size:19px">A+</button>
    </div>
    <div class="stage" id="stage">
      <div class="texto-wrap" id="tw"><div class="vz-texto">${p.nota ? `<div class="nota">${esc(p.nota)}</div>` : ''}${p.parrafos.map(x => `<div class="texto">${textoHTML(x)}</div>`).join('')}</div></div>
      <div class="rec-info" id="rec-info" hidden><span class="punto"></span><span id="timer">0:00</span><span class="vz-meta" id="meta"></span></div>
      <div class="cuenta" id="cuenta" hidden></div>
      <div class="revision" id="revision" hidden></div>
      <span class="vz-aviso" id="med-aviso" role="status"></span>
      <div class="g-error" id="g-error" hidden></div>
    </div>
    <div class="g-bottom">
      <div class="medidor" title="Nivel del micrófono"><i id="med"></i></div>
      <div class="vz-fila" id="ctl"><button class="btn vz-velbtn" id="vel" aria-label="Cambiar la velocidad del texto"></button><div class="rec-col"><div class="vz-recbox">
        <svg class="vz-anillo" viewBox="0 0 104 104" aria-hidden="true"><circle class="pista" cx="52" cy="52" r="48"/><circle class="avance" id="anillo" cx="52" cy="52" r="48" stroke-dasharray="${ANILLO.toFixed(1)}" stroke-dashoffset="${ANILLO.toFixed(1)}"/></svg>
        <button class="rec" id="rec" aria-label="Grabar"><span class="dot"></span></button></div>
        <span class="rec-lbl" id="rec-lbl">Grabar</span></div><span></span></div>
      <div class="g-rev-acc" id="rev-acc" hidden>
        <button class="btn primario grande" id="rv-ok">${conEnvio() ? 'Me gusta, enviarla' : 'Me gusta, seguir'}</button>
        <button class="btn grande" id="rv-rep">Repetir</button>
      </div>
    </div></div>`;
  document.documentElement.style.setProperty('--fs', V.fs + 'px');
  $('#g-atras').onclick = atras;
  $('#t-menos').onclick = () => tamLetra(-3);
  $('#t-mas').onclick = () => tamLetra(3);
  $('#rec').onclick = onRec;
  $('#rv-ok').onclick = () => { if (!$('#rv-ok').disabled) irA('enviar'); };
  $('#rv-rep').onclick = () => { descartarToma(); setEstado('idle'); };
  const pintarVel = () => { $('#vel').innerHTML = `<small>Texto</small>${{ lenta: 'Lento', normal: 'Normal', rapida: 'Rápido' }[V.vel] || 'Normal'}`; };
  pintarVel();
  $('#vel').onclick = () => { // lento → normal → rápido → lento
    const orden = ['lenta', 'normal', 'rapida'];
    V.vel = orden[(orden.indexOf(V.vel) + 1) % orden.length]; lsSet('tomauno.voz.vel', V.vel); pintarVel();
  };
  const tw = $('#tw');
  ['wheel', 'touchstart', 'pointerdown'].forEach(ev => tw.addEventListener(ev, () => { A.pausaScroll = performance.now() + 2500; }, { passive: true }));
  if (V.toma) { mostrarRevision(); setEstado('revision'); } else setEstado('idle');
  if (A.stream) iniciarMedidor();
}
function tamLetra(d) {
  V.fs = Math.min(56, Math.max(20, V.fs + d)); lsSet('tomauno.voz.fs', V.fs);
  document.documentElement.style.setProperty('--fs', V.fs + 'px');
}
function pintarAnillo(s) {
  const a = $('#anillo'); if (!a) return;
  a.style.strokeDashoffset = (ANILLO * (1 - Math.min(s / META_SEG, 1))).toFixed(1);
  a.style.stroke = s < 20 ? 'var(--cobalto)' : s <= META_SEG ? 'var(--verde)' : 'var(--amarillo)';
}
function setEstado(e) {
  A.estado = e;
  const rec = $('#rec'); if (!rec) return;
  rec.classList.toggle('on', e === 'grabando');
  rec.setAttribute('aria-label', e === 'grabando' ? 'Parar' : e === 'cuenta' ? 'Cancelar' : 'Grabar');
  $('#rec-lbl').textContent = e === 'grabando' ? 'Parar' : e === 'cuenta' ? 'Cancelar' : 'Grabar';
  $('#rec-info').hidden = e !== 'grabando';
  $('#stage').classList.toggle('grabando', e === 'grabando');
  $('#cuenta').hidden = e !== 'cuenta';
  const rev = e === 'revision';
  $('#ctl').hidden = rev; $('#rev-acc').hidden = !rev; $('#revision').hidden = !rev;
  $('#vel').style.visibility = e === 'grabando' || e === 'cuenta' ? 'hidden' : '';
  $('#vz-atras').disabled = $('#g-atras').disabled = e === 'grabando' || e === 'cuenta';
  $('#tw').style.visibility = rev ? 'hidden' : '';
  $('#t-menos').disabled = $('#t-mas').disabled = e === 'grabando';
  if (e === 'idle') pintarAnillo(0);
}
async function onRec() {
  if (A.estado === 'cuenta') return cancelarCuenta();
  if (A.estado === 'grabando') return parar();
  if (A.estado !== 'idle') return;
  $('#rec').disabled = true;
  try { await abrirMic(); $('#g-error').hidden = true; }
  catch (e) { $('#g-error').innerHTML = errorMicHTML(e); $('#g-error').hidden = false; return; }
  finally { $('#rec').disabled = false; }
  iniciarMedidor();
  if (await cuentaAtras()) empezar();
}
function cuentaAtras() {
  return new Promise(res => {
    let n = 3;
    const c = $('#cuenta');
    setEstado('cuenta');
    $('#tw').scrollTop = 0;
    c.innerHTML = `<span>${n}</span>`;
    A.cuentaCancel = () => { clearInterval(A.cuentaT); res(false); };
    A.cuentaT = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(A.cuentaT); A.cuentaCancel = null; res(true); } else { c.innerHTML = `<span>${n}</span>`; if (navigator.vibrate) navigator.vibrate(20); }
    }, 1000);
  });
}
function cancelarCuenta() {
  if (A.cuentaCancel) { const f = A.cuentaCancel; A.cuentaCancel = null; f(); }
  setEstado('idle');
}
function empezar() {
  A.chunks = []; A.ruidoMin = 0; A.t0 = performance.now();
  setEstado('grabando');
  pedirWake();
  const tm = $('#timer'), meta = $('#meta');
  tm.textContent = '0:00';
  clearInterval(A.timerT);
  A.timerT = setInterval(() => {
    const s = (performance.now() - A.t0) / 1000;
    tm.textContent = fmtDur(s);
    meta.textContent = s < 20 ? 'sigue leyendo' : s <= META_SEG ? '¡bien!' : '';
    pintarAnillo(s);
    if (s >= MAX_SEG) parar();
  }, 250);
  scrollAuto();
}
function scrollAuto() {
  const tw = $('#tw'), ult = tw.firstElementChild.lastElementChild;
  const recorrido = Math.max(0, ult.offsetTop + ult.offsetHeight - tw.clientHeight * 0.6); // hasta que el final quede a media pantalla
  if (!recorrido) return;
  const porSeg = recorrido / (VELOCIDADES[V.vel] || 26);
  let ultimo = performance.now(), acum = 0;
  const arranque = performance.now() + 2000; // dos segundos quieto para empezar a leer con calma
  const paso = ahora => {
    if (A.estado !== 'grabando') return;
    A.scrollRaf = requestAnimationFrame(paso);
    const dt = (ahora - ultimo) / 1000; ultimo = ahora;
    if (ahora < arranque || ahora < A.pausaScroll) return;
    acum += dt * porSeg;
    if (acum >= 1) { tw.scrollTop += Math.floor(acum); acum -= Math.floor(acum); }
  };
  A.scrollRaf = requestAnimationFrame(paso);
}
function parar() {
  if (A.estado !== 'grabando') return;
  clearInterval(A.timerT); cancelAnimationFrame(A.scrollRaf);
  $('#rec-lbl').textContent = 'Guardando…';
  $('#rec').disabled = true;
  setTimeout(() => { // un instante más para no cortar la última sílaba
    if (A.estado !== 'grabando') return; // salió de la pantalla mientras tanto
    const sr = A.ctx ? A.ctx.sampleRate : 48000, ruido = A.ruidoMin;
    A.estado = 'parando';
    releaseWake();
    const r = hacerWav(A.chunks, sr);
    A.chunks = [];
    const rec = $('#rec'); if (rec) rec.disabled = false;
    if (!r.dur || r.dur < 1) { setEstado('idle'); toast('No se grabó nada. Intenta de nuevo.'); return; }
    descartarToma();
    V.toma = { ...r, sr, ruido, url: URL.createObjectURL(r.blob), creada: new Date() };
    V.guardado = false; V.archivos = null; V.envio = 'nada';
    if (V.paso !== 'grabar') return;
    mostrarRevision();
    setEstado('revision');
  }, 250);
}
function descartarToma() {
  if (!V.toma) return;
  const m = $('#rev-m'); if (m) { m.pause(); m.removeAttribute('src'); m.load(); }
  URL.revokeObjectURL(V.toma.url);
  V.toma = null; V.archivos = null; V.guardado = false; V.envio = 'nada';
  const r = $('#revision'); if (r) r.innerHTML = '';
}
function revisarToma(t) { // [[clase, texto]]
  const out = [];
  if (t.dur < CORTA_SEG) out.push(['mal', `Quedó muy corta (${Math.round(t.dur)} segundos). Para crear la voz hacen falta por lo menos ${MIN_SEG}: repítela leyendo todo el texto.`]);
  else if (t.dur < MIN_SEG) out.push(['av', `Quedó un poco corta (${Math.round(t.dur)} segundos). Lo ideal es de 20 a 30. Si puedes, repítela leyendo todo el texto.`]);
  else out.push(['bien', `Duración buena: ${Math.round(t.dur)} segundos.`]);
  if (t.saturadas > 30) out.push(['av', 'En algún momento sonó muy fuerte y se distorsionó. Repítela con el celular un poquito más lejos.']);
  else if (t.pico < 0.08) out.push(['av', 'Se oye bajito. Repítela con el celular un poco más cerca de la boca.']);
  else out.push(['bien', 'El volumen está bien.']);
  if (t.ruido > -50) out.push(['av', 'Se oye ruido de fondo (abanico, calle, nevera, tele…). Si puedes, busca un lugar más callado y repítela.']);
  out.push(['', 'Escúchala completa: ¿se oye clara, sin ruidos ni interrupciones?']);
  return out;
}
function mostrarRevision() {
  const t = V.toma, r = $('#revision');
  r.innerHTML = `<h2>Escúchate (${fmtDur(t.dur)})</h2><audio id="rev-m" controls preload="auto"></audio>
    <div class="vz-checks">${revisarToma(t).map(([c, x]) => `<div class="${c}">${ic(c === 'bien' ? 'check' : c ? 'alerta' : 'oido', 20)}<span>${esc(x)}</span></div>`).join('')}</div>`;
  $('#rev-m').src = t.url;
  $('#rv-ok').disabled = t.dur < CORTA_SEG;
}
async function pedirWake() { try { if ('wakeLock' in navigator) A.wake = await navigator.wakeLock.request('screen'); } catch (e) { /* sin wake lock */ } }
function releaseWake() { try { if (A.wake) A.wake.release(); } catch (e) { /* ya liberado */ } A.wake = null; }
function salirDeGrabar() {
  if (A.estado === 'cuenta') cancelarCuenta();
  if (A.estado === 'grabando') { clearInterval(A.timerT); cancelAnimationFrame(A.scrollRaf); A.estado = 'idle'; A.chunks = []; releaseWake(); }
  const m = $('#rev-m'); if (m) m.pause();
  cerrarMic();
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || V.paso !== 'grabar') return;
  if (A.estado === 'cuenta') cancelarCuenta();
  if (A.estado === 'grabando') parar();
});
window.addEventListener('pagehide', () => { if (A.estado !== 'grabando') cerrarMic(); });

/* ---- 6. enviar */
async function sha256(blob) {
  try {
    const h = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { return 'no disponible en este navegador'; }
}
async function prepararArchivos() {
  if (V.archivos) return V.archivos;
  const t = V.toma, f = V.firma, g = V.guion;
  const base = `voz-${slug(f.nombre)}-${slug(g.titulo)}-${f.fecha}`;
  const a = autorizacion(f.nombre);
  const huella = await sha256(t.blob);
  const txt = [
    'AUTORIZACIÓN DE USO DE VOZ',
    '==========================',
    '',
    a.intro,
    '',
    'Entiendo y acepto que:',
    ...a.puntos.map(p => '- ' + p),
    '',
    a.cierre,
    '',
    'Nombre completo: ' + f.nombre,
    'Fecha: ' + fechaLarga(f.fecha) + ' (' + f.fecha + ')',
    'Marcó en pantalla: «Soy mayor de edad», «La voz que voy a grabar es la mía y no estoy imitando a nadie» y «Leí la autorización y la acepto».',
    'Firmó en este teléfono el: ' + f.firmadoEn,
    'Texto de autorización: versión ' + VERSION_AUTORIZACION,
    '',
    'DATOS DE LA GRABACIÓN',
    '---------------------',
    'Archivo de audio: ' + base + '.wav',
    'Grabado el: ' + cuando(t.creada),
    'Duración: ' + fmtDur(t.dur) + ' (' + t.dur.toFixed(1) + ' segundos)',
    'Calidad: WAV sin compresión, ' + t.sr + ' Hz, 16 bits, mono, sin filtros de llamada',
    'Huella del audio (SHA-256): ' + huella,
    '  (sirve para comprobar que esta autorización corresponde a ese audio y que no se cambió)',
    'Personaje: ' + g.titulo + ' (' + g.id + ')',
    'Navegador: ' + navigator.userAgent,
    '',
    'TEXTO QUE LEYÓ',
    '--------------',
    ...partesGuion(g.md).parrafos.map(textoLimpio),
    '',
    'Grabado con TomaUno (Donar voz).',
  ].join('\n').replace(/\n/g, '\r\n') + '\r\n'; // saltos de Windows: se abre bien en cualquier lado
  const wav = new File([t.blob], base + '.wav', { type: 'audio/wav' });
  const aut = new File(['﻿' + txt], base + '-autorizacion.txt', { type: 'text/plain' });
  const zip = new File([await hacerZip([{ nombre: wav.name, blob: wav }, { nombre: aut.name, blob: aut }])], base + '.zip', { type: 'application/zip' });
  V.archivos = { base, wav, aut, txt, zip };
  return V.archivos;
}
const aBase64 = blob => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1] || '');
  r.onerror = () => rej(r.error);
  r.readAsDataURL(blob);
});
async function subir() {
  const ar = V.archivos;
  V.envio = 'subiendo'; pintarEnvio();
  try {
    const cuerpo = JSON.stringify({
      codigo: ENVIO.codigo, base: ar.base, nombre: V.firma.nombre, personaje: V.guion.titulo,
      dur: Math.round(V.toma.dur), wav: await aBase64(ar.wav), txt: ar.txt,
    });
    // Petición «simple» (texto plano, sin escuchar el avance de la subida): cualquier otra cosa hace que el
    // navegador pregunte antes con OPTIONS, y Apps Script no contesta esa pregunta.
    const ctl = new AbortController(), reloj = setTimeout(() => ctl.abort(), 120000);
    let r;
    try {
      const resp = await fetch(ENVIO.url, { method: 'POST', body: cuerpo, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl.signal });
      r = await resp.json();
    } catch (e) { throw new Error(e.name === 'AbortError' ? 'tardó demasiado' : e instanceof SyntaxError ? 'respuesta rara' : 'sin conexión'); }
    finally { clearTimeout(reloj); }
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    V.envio = 'listo'; V.guardado = true;
  } catch (e) { V.envio = 'error'; V.errorEnvio = e.message; }
  if (V.paso === 'enviar') pintarEnvio();
}
async function pEnviar() {
  pagina('<p class="sub">Preparando tu archivo…</p>');
  await prepararArchivos();
  if (V.paso !== 'enviar') return;
  if (conEnvio() && V.envio === 'nada') { subir(); return; }
  pintarEnvio();
}
function pintarEnvio() {
  const ar = V.archivos;
  if (conEnvio() && V.envio === 'subiendo') {
    pagina(`<div class="vz-envio vz-subiendo" role="status"><img src="voz-logo.png" alt="" width="132" height="132"><h1>Enviando tu voz</h1>
      <p>No cierres esta página. Tarda unos segundos.</p><div class="vz-barra"><i></i></div></div>`);
    return;
  }
  if (conEnvio() && V.envio === 'listo') {
    pagina(`<div class="vz-envio"><img src="${esc(fotoDe(V.guion))}" alt="" width="132" height="132"><h1>¡Llegó! Muchas gracias</h1>
      <p>Tu voz y tu autorización ya están en la carpeta de ${esc(PARA)}. No tienes que mandar nada más.</p></div>
      <p class="priv">${ic('shield', 20)}<span>Si un día quieres que borren tu grabación, solo díselo a ${esc(PARA)}.</span></p>
      <details class="vz-mas"><summary>Guardar una copia en mi teléfono</summary>${botonesCopia()}</details>`, '',
      '<button class="btn primario grande ancho" id="e-otro">Grabar otro personaje</button>');
    $('#e-otro').onclick = () => { descartarToma(); irA('guion'); };
    enlazarCopia();
    return;
  }
  const fallo = conEnvio() && V.envio === 'error';
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const pasosAndroid = `<li>Abre el chat de <b>${esc(PARA)}</b> en WhatsApp.</li><li>Toca el <b>clip</b> ${ic('clip', 16)} al lado de donde se escribe.</li><li>Toca <b>«Documento»</b>.</li><li>Busca el archivo <b>${esc(ar.zip.name)}</b> (está en <b>Descargas</b>) y tócalo.</li><li>Toca <b>Enviar</b>.</li>`;
  const pasosIphone = `<li>Abre el chat de <b>${esc(PARA)}</b> en WhatsApp.</li><li>Toca el <b>«+»</b> al lado de donde se escribe.</li><li>Toca <b>«Documento»</b>.</li><li>Busca el archivo <b>${esc(ar.zip.name)}</b> en <b>Descargas</b> (en «Explorar», si no sale) y tócalo.</li><li>Toca <b>Enviar</b>.</li>`;
  pagina(`
    ${fallo ? `<div class="vz-envio"><span class="estado mal">${ic('alerta', 34)}</span><h1>No se pudo enviar</h1>
      <p>Revisa la señal y vuelve a intentar: tu grabación sigue aquí. (Detalle: ${esc(V.errorEnvio || 'sin detalle')}.)</p>
      <p class="sub">Si sigue fallando, mándala tú por WhatsApp como te explico abajo.</p></div>`
      : `<div class="vz-envio"><img src="${esc(fotoDe(V.guion))}" alt="" width="132" height="132"><h1>¡Gracias! Ya casi</h1>
      <p>Guarda el archivo en tu teléfono y mándaselo a ${esc(PARA)} por WhatsApp como documento.</p></div>`}
    <div class="vz-archivo">${ic('file', 26)}<div><b>${esc(ar.zip.name)}</b>
      <span class="sub">Tu voz sin comprimir (${fmtDur(V.toma.dur)}) y tu autorización firmada. ${fmtBytes(ar.zip.size)}.</span></div></div>
    <button class="btn grande ancho" id="e-zip">Guardar el archivo en el teléfono</button>
    <div class="vz-wa"><h2>Después, mándalo por WhatsApp como «Documento»</h2>
      <ol>${iphone ? pasosIphone : pasosAndroid}</ol>
      ${WA ? `<a class="btn ancho" style="margin-top:12px" href="https://wa.me/${esc(WA)}" target="_blank" rel="noopener">${ic('chat')} Abrir el chat de ${esc(PARA)}</a>` : ''}
      <p class="sub" style="margin-top:10px"><b>No lo mandes como nota de voz</b> ni lo grabes otra vez con el micrófono de WhatsApp: WhatsApp comprime el audio y la voz pierde calidad. Como documento llega igualito.</p>
      <details style="margin-top:8px"><summary class="sub" style="cursor:pointer;min-height:32px">${iphone ? '¿Tienes Android?' : '¿Tienes iPhone?'}</summary><ol class="sub">${iphone ? pasosAndroid : pasosIphone}</ol></details>
    </div>
    <details class="vz-mas"><summary>Otras formas de guardarlo</summary>${botonesCopia()}</details>
    ${conEnvio() ? '' : `<p class="priv">${ic('shield', 20)}<span>Esta página no subió nada a internet. Cuando la cierres, la grabación se borra de aquí; el archivo que guardaste se queda en tu teléfono.</span></p>`}
    <button class="btn suave ancho" id="e-otra">Grabar otra vez</button>`, '',
    fallo ? '<button class="btn primario grande ancho" id="e-rep">Volver a enviar</button>' : '<button class="btn primario grande ancho" id="e-zip2">Guardar el archivo en el teléfono</button>');
  const guardarZip = () => { descargarBlob(ar.zip, ar.zip.name); V.guardado = true; toast('Listo: el archivo está en tus Descargas'); };
  $('#e-zip').onclick = guardarZip;
  const z2 = $('#e-zip2'); if (z2) { z2.onclick = guardarZip; $('#e-zip').hidden = true; }
  const rep = $('#e-rep'); if (rep) rep.onclick = subir;
  $('#e-otra').onclick = () => { descartarToma(); irA('grabar'); };
  enlazarCopia();
}
function puedeCompartir() {
  const ar = V.archivos;
  try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [ar.wav, ar.aut] })); } catch (e) { return false; }
}
function botonesCopia() {
  return `<div class="vz-otros">
    <button class="btn" data-copia="zip">${ic('download')} Audio y autorización (.zip)</button>
    <button class="btn" data-copia="wav">${ic('download')} Solo el audio (.wav)</button>
    <button class="btn" data-copia="txt">${ic('download')} Solo la autorización (.txt)</button>
    ${puedeCompartir() ? `<button class="btn" data-copia="compartir">${ic('share')} Compartir (correo, Drive…)</button>` : ''}</div>`;
}
function enlazarCopia() {
  const ar = V.archivos;
  $$('[data-copia]').forEach(b => b.onclick = async () => {
    const k = b.dataset.copia;
    if (k === 'zip') descargarBlob(ar.zip, ar.zip.name);
    else if (k === 'wav') descargarBlob(ar.wav, ar.wav.name);
    else if (k === 'txt') descargarBlob(ar.aut, ar.aut.name);
    else {
      try { await navigator.share({ files: [ar.wav, ar.aut], title: 'Mi voz para ' + PARA }); }
      catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir. Usa «Guardar».'); return; }
    }
    if (k !== 'txt') V.guardado = true;
  });
}

/* ============================================================ modo prueba (solo localhost): micrófono falso */
function instalarPrueba() {
  const md = navigator.mediaDevices || (navigator.mediaDevices = {});
  md.getUserMedia = async () => {
    const ac = new AudioContext(); await ac.resume();
    const osc = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), dest = ac.createMediaStreamDestination();
    osc.frequency.value = 170; osc.type = 'sawtooth'; g.gain.value = 0.3; lfo.frequency.value = 2.5; lg.gain.value = 0.25;
    lfo.connect(lg); lg.connect(g.gain); osc.connect(g); g.connect(dest); osc.start(); lfo.start();
    return dest.stream;
  };
  $('#prueba-tag').hidden = false;
  const u = PARAMS.get('envio'); // ?envio=URL para probar contra un servidor de prueba local
  if (u && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u)) { ENVIO.url = u; ENVIO.codigo = 'prueba'; }
}

/* ============================================================ arranque */
if (enLocalhost && /[?&]prueba=1/.test(location.search)) instalarPrueba();
irA('inicio', false);
cargarGuiones();
window.TomaUnoVoz = { V, A, ENVIO, partesGuion, hacerWav, irA };
