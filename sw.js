const CACHE_NAME = 'would-you-rather-v1';
const ASSETS = [
  '/would-you-rather/',
  '/would-you-rather/index.html',
  '/would-you-rather/css/style.css',
  '/would-you-rather/js/app.js',
  '/would-you-rather/js/i18n.js',
  '/would-you-rather/js/locales/ko.json',
  '/would-you-rather/js/locales/en.json',
  '/would-you-rather/js/locales/ja.json',
  '/would-you-rather/js/locales/zh.json',
  '/would-you-rather/js/locales/hi.json',
  '/would-you-rather/js/locales/ru.json',
  '/would-you-rather/js/locales/es.json',
  '/would-you-rather/js/locales/pt.json',
  '/would-you-rather/js/locales/id.json',
  '/would-you-rather/js/locales/tr.json',
  '/would-you-rather/js/locales/de.json',
  '/would-you-rather/js/locales/fr.json',
  '/would-you-rather/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
