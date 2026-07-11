const CACHE_VERSION = '2026-07-11-v1';
const APP_CACHE = `emf-planner-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `emf-planner-runtime-${CACHE_VERSION}`;
const SCHEDULE_CACHE = `emf-planner-schedule-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/emp.svg',
];
const SCHEDULE_URL_PATTERN = /https:\/\/www\.emfcamp\.org\/schedule\/2026\.json(?:$|[?#])/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('emf-planner-') && ![APP_CACHE, RUNTIME_CACHE, SCHEDULE_CACHE].includes(cacheName))
        .map((cacheName) => caches.delete(cacheName)),
    )),
    self.clients.claim(),
  ]));
});

const cacheResponse = async (cacheName, request, response) => {
  if (!response || (!response.ok && response.type !== 'opaque')) {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    await cacheResponse(cacheName, request, response);
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    throw error;
  }
};

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await cacheResponse(cacheName, request, response);
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE).catch(() => caches.match('/index.html')));
    return;
  }

  if (SCHEDULE_URL_PATTERN.test(request.url)) {
    event.respondWith(networkFirst(request, SCHEDULE_CACHE));
    return;
  }

  if (url.origin === self.location.origin || url.hostname === 'ka-f.webawesome.com') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});
