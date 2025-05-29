// Nome do cache
const CACHE_NAME = "lista-compras-v2";

// Arquivos estáticos a serem cacheados
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
  "/src/css/app.css",
  "/src/js/app.js",
  "/offline.html",
];

// Cache dos arquivos estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME)
          .map((cache) => caches.delete(cache))
      )
    )
  );
  self.clients.claim();
});

// IndexedDB via IDB (biblioteca para simplificar)
importScripts("https://cdn.jsdelivr.net/npm/idb@7/build/iife/index-min.js");

const dbPromise = idb.openDB("ListaComprasDB", 1, {
  upgrade(db) {
    db.createObjectStore("pendentes", { autoIncrement: true });
  },
});

// Fetch: GET = cache; POST = salva offline se falhar
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === "POST") {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        const body = await request.clone().json();
        const db = await dbPromise;
        await db.add("pendentes", {
          url: request.url,
          method: "POST",
          body,
          headers: [...request.headers],
        });

        await self.registration.sync.register("sync-pendentes");

        return new Response(
          JSON.stringify({ sucesso: false, offline: true }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }).catch(() => caches.match("/offline.html"))
        );
      })
    );
  }
});

// Sincroniza requisições POST pendentes
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pendentes") {
    event.waitUntil(syncPendentes());
  }
});

async function syncPendentes() {
  const db = await dbPromise;
  const todas = await db.getAll("pendentes");

  for (const req of todas) {
    try {
      await fetch(req.url, {
        method: req.method,
        headers: new Headers(req.headers),
        body: JSON.stringify(req.body),
      });
    } catch (e) {
      console.error("Falha ao reenviar:", e);
      return;
    }
  }

  await db.clear("pendentes");
}
