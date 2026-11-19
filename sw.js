// KodEdit Preview — service worker
// Hanya urus fail app Preview sendiri (dalam skop /kodedit-preview/). Permintaan lain — termasuk app yang
// sedang dipreview dalam iframe, Firebase & GitHub — dibiarkan terus ke rangkaian supaya tiada cache lama.
var CACHE = 'kodedit-preview-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(SHELL); }).then(function() { return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k.indexOf('kodedit-preview-') === 0 && k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e) {
  var req = e.request, url = new URL(req.url), skop = new URL(self.registration.scope);
  if (req.method !== 'GET' || url.origin !== skop.origin || url.pathname.indexOf(skop.pathname) !== 0) return; // bukan fail Preview → jangan sentuh
  // Rangkaian dahulu (sentiasa versi terkini), cache hanya bila offline
  e.respondWith(fetch(req, { cache: 'no-store' }).then(function(res) {
    if (res && res.ok) { var salin = res.clone(); caches.open(CACHE).then(function(c) { c.put(req, salin); }); }
    return res;
  }).catch(function() {
    return caches.match(req).then(function(r) { return r || caches.match('./index.html'); });
  }));
});
