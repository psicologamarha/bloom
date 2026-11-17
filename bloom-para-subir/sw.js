/* BLOOM 2027 · Modo sin conexión.
 * Guarda los archivos de la app en el dispositivo para que abra sin internet.
 * Al publicar una versión nueva, cambia VERSION para que todas reciban la actualización. */
const VERSION = 'bloom-2027-v18';
const SHELL = ['./', './index.html', './app.css', './manifest.webmanifest',
  './app.js', './store.js', './model.js', './content.js', './stickers.js', './google.js', './cloud.js', './config.js', './privacidad.html',
  './logo.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Archivos propios: responde con la copia guardada y la renueva en segundo plano.
 * Peticiones a otros sitios (nube, Google): siempre por internet, nunca guardadas. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) {
    if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
      e.respondWith(caches.open(VERSION).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })));
    }
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
