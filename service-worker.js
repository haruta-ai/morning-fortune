const CACHE_PREFIX = "emf-";
const CACHE_NAME = `${CACHE_PREFIX}1-0-2-r2`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./studio.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./data/apple-touch-icon.png",
  "./data/icon-192.png",
  "./data/icon-512.png",
  "./data/icon.svg",
  "./data/themes.json",
  "./data/content.json",
  "./js/app.js",
  "./js/studio.js",
  "./js/config.js",
  "./js/database.js",
  "./js/engine.js",
  "./js/fortune-engine.js",
  "./js/models.js",
  "./js/storage.js",
  "./js/utils.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then(response => {
        if (response?.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});
