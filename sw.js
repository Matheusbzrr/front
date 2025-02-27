const CACHE_NAME = "lista-compras-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/css/index.css",
  "/src/js/index.js",
  "/src/pages/login.html",
  "/src/css/login.css",
  "/src/js/login.js",
  "/src/js/cadastro.js",
  "/src/pages/app.html",
  "src/css/app.css",
  "/src/js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1️⃣ Evita cache de login/logout
  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/logout")) {
    return event.respondWith(fetch(request));
  }

  // 2️⃣ Armazena apenas requisições GET no cache
  if (request.method !== "GET") {
    return event.respondWith(fetch(request));
  }

  // 3️⃣ Caso futuro: Caching para API de geolocalização
  //   if (url.pathname.startsWith("/api/mercados")) {
  //     return event.respondWith(
  //       caches.match(request).then((cachedResponse) => {
  //         return (
  //           cachedResponse ||
  //           fetch(request)
  //             .then((networkResponse) => {
  //               return caches.open(CACHE_NAME).then((cache) => {
  //                 cache.put(request, networkResponse.clone());
  //                 return networkResponse;
  //               });
  //             })
  //             .catch(() => caches.match("/offline.html"))
  //         );
  //       })
  //     );
  //   }

  // 4️⃣ Estratégia de cache para arquivos estáticos e listas de compras
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              return networkResponse;
            }

            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => caches.match("/offline.html"))
      );
    })
  );
});

// Atualiza o cache quando o Service Worker é ativado
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
