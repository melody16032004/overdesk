import { DB_NAME, STORE_NAME } from "../constants/anim_const";
import { AnimGroupData } from "../types/anim_type";

export const dbHelper = {
  open: () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
  save: async (data: AnimGroupData) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await dbHelper.open();
    return new Promise<AnimGroupData[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id: string) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

export const floodFill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  width: number,
  height: number,
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixelData = imgData.data;
  const hex = fillColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const startPos = (y * width + x) * 4;
  const startR = pixelData[startPos];
  const startG = pixelData[startPos + 1];
  const startB = pixelData[startPos + 2];
  const startA = pixelData[startPos + 3];
  if (startR === r && startG === g && startB === b && startA === 255) return;
  const matchStartColor = (pos: number) =>
    pixelData[pos] === startR &&
    pixelData[pos + 1] === startG &&
    pixelData[pos + 2] === startB &&
    pixelData[pos + 3] === startA;
  const colorPixel = (pos: number) => {
    pixelData[pos] = r;
    pixelData[pos + 1] = g;
    pixelData[pos + 2] = b;
    pixelData[pos + 3] = 255;
  };
  const stack = [[x, y]];
  while (stack.length) {
    const newPos = stack.pop();
    if (!newPos) continue;
    const [cx, cy] = newPos;
    const pixelPos = (cy * width + cx) * 4;
    if (
      cx >= 0 &&
      cx < width &&
      cy >= 0 &&
      cy < height &&
      matchStartColor(pixelPos)
    ) {
      colorPixel(pixelPos);
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }
  }
  ctx.putImageData(imgData, 0, 0);
};
