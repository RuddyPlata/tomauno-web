/* Caché simple: red primero (así una versión nueva llega sola), caché si no hay conexión. */
const CACHE = 'tomauno-v4';
const BASE = ['./', 'index.html', 'app.js', 'app.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'voz.html', 'voz.js', 'voz.css', 'voz.webmanifest', 'voz-icon-180.png', 'voz-icon-192.png', 'voz-icon-512.png', 'voz-logo.png', 'voz-mural.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => { }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
