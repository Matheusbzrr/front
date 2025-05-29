const dbPromise = idb.openDB("ListaComprasDB", 1, {
  upgrade(db) {
    db.createObjectStore("pendentes", { autoIncrement: true });
  },
});
