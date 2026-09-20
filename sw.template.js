// Service worker généré au build (voir vite.config.js) : la liste de fichiers et la version sont injectées.
const CACHE = 'totk-__VERSION__'
const FILES = __FILES__

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Tout est précaché : cache d'abord, réseau en secours ; la navigation retombe sur la page d'accueil
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) => hit || fetch(e.request).catch(() => (e.request.mode === 'navigate' ? caches.match('./') : Response.error()))
    )
  )
})
