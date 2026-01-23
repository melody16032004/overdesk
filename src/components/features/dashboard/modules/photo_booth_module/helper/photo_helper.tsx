import { DB_NAME, STORE_NAME } from "../constants/photo_const";

export const cameraDB = {
  open: () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
  add: async (photo: { id: number; data: string }) => {
    const db = await cameraDB.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(photo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await cameraDB.open();
    return new Promise<{ id: number; data: string }[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () =>
        resolve(request.result ? request.result.reverse() : []); // Mới nhất lên đầu
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id: number) => {
    const db = await cameraDB.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
