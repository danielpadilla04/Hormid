// HORMID: funciona sin internet. La página se pide primero a la red (para recibir actualizaciones) y, si no hay conexión, sale de la caché.
const CACHE = "hormid-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "html2pdf.bundle.min.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const guardar = r => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; };
  // fuentes y librerías externas: primero caché
  if (url.origin !== location.origin) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(guardar)));
    return;
  }
  // archivos propios: primero red, si falla la caché
  e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
});
