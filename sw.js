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
  "/src/css/app.css",
  "/src/js/app.js",
  "/offline.html",
  // Removido: "/src/js/idb/index-min.js",
];

// ✅ Importa a versão UMD do idb
try {
  importScripts("https://cdn.jsdelivr.net/npm/idb@8/build/umd.js");
  console.log("Service Worker: idb UMD importado com sucesso.");
} catch (e) {
  console.error("Service Worker: Falha ao importar idb UMD:", e);
}

// Inicializa o IndexedDB
let dbPromise;
if (self.idb) {
  dbPromise = self.idb.openDB("ListaComprasDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pendentes")) {
        db.createObjectStore("pendentes", { autoIncrement: true });
        console.log("IndexedDB: Object store 'pendentes' criado.");
      }
    },
  });
  console.log("IndexedDB: DB 'ListaComprasDB' pronto.");
} else {
  console.error("IndexedDB: Biblioteca idb não carregada.");
  dbPromise = Promise.reject(new Error("idb não disponível."));
}

// Instala o Service Worker e faz cache dos arquivos estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cacheando arquivos estáticos.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativa o Service Worker e remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME)
          .map((cache) => {
            console.log(`Service Worker: Removendo cache antigo: ${cache}`);
            return caches.delete(cache);
          })
      )
    )
  );
  self.clients.claim();
});

// Intercepta fetch (GET e POST)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Intercepta POST offline
  if (request.method === "POST") {
    event.respondWith(
      fetch(request.clone())
        .then((response) => response)
        .catch(async () => {
          console.log(`Service Worker: Salvando POST offline: ${request.url}`);

          if (!self.idb || !dbPromise) {
            return new Response(
              JSON.stringify({
                sucesso: false,
                offline: true,
                error: "IndexedDB não disponível.",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          try {
            const db = await dbPromise;
            const clonedRequest = request.clone();
            const body = await clonedRequest.json();

            const requestToStore = {
              url: clonedRequest.url,
              method: "POST",
              body,
              headers: [...clonedRequest.headers.entries()],
              timestamp: Date.now(),
            };

            const key = await db.add("pendentes", requestToStore);
            console.log(
              `Service Worker: POST salvo no IndexedDB (chave ${key}).`
            );

            if (self.registration.sync) {
              await self.registration.sync.register("sync-pendentes");
              console.log("Service Worker: sync-pendentes registrado.");
            }

            return new Response(
              JSON.stringify({
                sucesso: false,
                offline: true,
                message: "Requisição salva para envio posterior.",
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          } catch (error) {
            console.error(
              "Service Worker: Falha ao salvar POST offline:",
              error
            );
            return new Response(
              JSON.stringify({
                sucesso: false,
                error: "Erro ao salvar no IndexedDB.",
                detalhes: error.message,
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        })
    );
    return;
  }

  // Intercepta GET
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            const responseToCache = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache));
            return response;
          })
          .catch(() => {
            console.log(
              `Service Worker: GET offline para ${request.url}. Servindo /offline.html`
            );
            return caches.match("/offline.html");
          });
      })
    );
  }
});

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pendentes") {
    console.log("Service Worker: Sincronização 'sync-pendentes' iniciada.");
    event.waitUntil(syncPendentes());
  }
});

// Função para reenviar POSTs salvos
async function syncPendentes() {
  if (!self.idb || !dbPromise) {
    console.error("Service Worker: IndexedDB não disponível em sync.");
    return;
  }

  const db = await dbPromise;
  const tx = db.transaction("pendentes", "readwrite");
  const store = tx.objectStore("pendentes");
  let cursor = await store.openCursor();

  let successCount = 0;
  let failureCount = 0;

  while (cursor) {
    const { url, method, headers, body } = cursor.value;
    const key = cursor.key;

    try {
      const response = await fetch(url, {
        method,
        headers: new Headers(headers),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log(`Service Worker: POST reenviado com sucesso (ID ${key})`);
        await cursor.delete();
        successCount++;
      } else {
        console.error(
          `Service Worker: Erro ao reenviar POST (ID ${key}) - Status: ${response.status}`
        );
        if (response.status >= 400 && response.status < 500) {
          await cursor.delete();
        }
        failureCount++;
      }
    } catch (error) {
      console.error(
        `Service Worker: Falha de rede ao reenviar POST (ID ${key}):`,
        error
      );
      failureCount++;
    }

    cursor = await cursor.continue();
  }

  await tx.done;
  console.log(
    `Service Worker: Sync finalizado. Sucesso: ${successCount}, Falha: ${failureCount}`
  );

  const pendentesRestantes = await db.count("pendentes");
  if (pendentesRestantes > 0) {
    console.log(`Ainda há ${pendentesRestantes} requisições pendentes.`);
  } else {
    console.log("Todos os POSTs pendentes foram processados.");
  }
}
