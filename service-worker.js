const CACHE_NAME="emf-sprint-6-content-pack-1";
const APP_SHELL=["./","./index.html","./studio.html","./styles.css","./manifest.webmanifest","./data/icon.svg","./data/themes.json","./data/content.json","./js/app.js","./js/studio.js","./js/config.js","./js/database.js","./js/engine.js","./js/fortune-engine.js","./js/models.js","./js/storage.js","./js/utils.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{if(r&&r.status===200&&r.type==="basic"){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});
