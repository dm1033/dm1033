// Minimal offline cache for the Construction Phase Planner.
// Cache-first for same-origin GET requests, with network fallback and
// background refresh of the cache on successful fetches.
const CACHE = 'cpp-smsts-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetched
    }),
  )
})
