const CACHE_NAME = 'medicacion-checklist-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/favicon-16x16.png',
  '/src/favicon-32x32.png',
  '/src/apple-touch-icon.png',
  '/src/android-chrome-192x192.png',
  '/src/android-chrome-512x512.png',
  '/src/site.webmanifest',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline: No se pudo cargar el recurso.', { status: 503 });
  }
}