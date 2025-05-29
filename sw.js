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
  "/src/js/idb/index-min.js", 
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cacheando arquivos estáticos");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME)
          .map((cache) => {
            console.log(`Service Worker: Deletando cache antigo: ${cache}`);
            return caches.delete(cache);
          })
      )
    )
  );
  self.clients.claim();
});

try {
  importScripts("/src/js/idb/index-min.js");
} catch (e) {
  console.error("Falha ao importar idb:", e);
  
}

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
  console.log("IndexedDB: Promise para 'ListaComprasDB' configurada.");
} else {
  console.error("Biblioteca IDB não carregada. Funcionalidade offline de POST pode ser afetada.");
  dbPromise = Promise.reject(new Error("IDB library not loaded"));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method === "POST") {
    event.respondWith(
      fetch(request.clone())
        .then(response => {
          if (!response.ok) {
            console.warn(`Service Worker: Resposta de rede para POST ${request.url} não foi OK: ${response.status}`);
          }
          return response;
        })
        .catch(async () => {
          console.log(`Service Worker: Falha na rede para POST ${request.url}. Tentando salvar no IndexedDB.`);
          if (!self.idb || !dbPromise) {
             console.error("Service Worker: IDB não está disponível para salvar POST offline.");
             return new Response(
                JSON.stringify({ sucesso: false, error: "IDB not available", offline: true }),
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
              timestamp: Date.now()
            };

            const key = await db.add("pendentes", requestToStore);
            console.log(`Service Worker: Requisição POST para ${requestToStore.url} salva no IndexedDB com chave ${key}.`, requestToStore);

            if (self.registration.sync) {
              await self.registration.sync.register("sync-pendentes");
              console.log("Service Worker: Sincronização 'sync-pendentes' registrada.");
            } else {
              console.warn("Service Worker: Background Sync não é suportado neste navegador.");
            }
          
            return new Response(
              JSON.stringify({ sucesso: false, offline: true, message: "Requisição salva para envio posterior." }),
              { headers: { "Content-Type": "application/json" } }
            );
          } catch (error) {
            console.error("Service Worker: Erro ao salvar requisição POST no IndexedDB:", error);
            return new Response(
              JSON.stringify({ sucesso: false, error: "Falha ao salvar requisição offline.", details: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        })
    );
    return;
  }

  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          
          return cachedResponse;
        }
      
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              if (response) {
                
              }
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            console.log(`Service Worker: Falha na rede para GET ${request.url}. Servindo offline.html do cache.`);
            return caches.match("/offline.html");
          });
      })
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pendentes") {
    console.log("Service Worker: Evento de sincronização 'sync-pendentes' recebido.");
    event.waitUntil(syncPendentes());
  }
});

async function syncPendentes() {
  if (!self.idb || !dbPromise) {
     console.error("Service Worker (syncPendentes): IDB não está disponível.");
     return;
  }
  console.log("Service Worker: Iniciando sincronização de requisições POST pendentes.");
  const db = await dbPromise;
  const tx = db.transaction("pendentes", "readwrite");
  const store = tx.objectStore("pendentes");
  let cursor = await store.openCursor();

  let successCount = 0;
  let failureCount = 0;

  while (cursor) {
    const req = cursor.value; 
    const reqKey = cursor.key; 

    console.log(`Service Worker: Tentando reenviar requisição pendente (ID: ${reqKey}):`, req.url);
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: new Headers(req.headers), 
        body: JSON.stringify(req.body), 
      });

      if (response.ok) {
        console.log(`Service Worker: Requisição (ID: ${reqKey}, URL: ${req.url}) reenviada com sucesso!`);
        await cursor.delete(); 
        successCount++;
      } else {
        console.error(`Service Worker: Falha ao reenviar requisição (ID: ${reqKey}, URL: ${req.url}). Status: ${response.status}`);
        if (response.status >= 400 && response.status < 500) {
          console.log(`Service Worker: Erro do cliente para requisição (ID: ${reqKey}). Removendo da fila.`);
          await cursor.delete();
        }
        failureCount++;
      }
    } catch (error) {
      console.error(`Service Worker: Erro de rede ao tentar reenviar requisição (ID: ${reqKey}, URL: ${req.url}):`, error);
      failureCount++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  console.log(`Service Worker: Sincronização 'pendentes' finalizada. Sucessos: ${successCount}, Falhas (mantidas na fila ou removidas por erro 4xx): ${failureCount}.`);
  
  
  const remainingItems = await db.count('pendentes');
  if (remainingItems > 0) {
    console.log(`Service Worker: Ainda existem ${remainingItems} requisições pendentes.`);
    
  } else {
    console.log("Service Worker: Todas as requisições pendentes foram processadas.");
  }
}
