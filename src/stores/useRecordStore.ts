import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --- UTILS: INDEXED DB CHO GHI ÂM ---
const DB_NAME = "OverDeskRecordDB";
const STORE_NAME = "recordings";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
};

export const saveRecordingToDB = async (id: string, blob: Blob) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(blob, id);
};

export const getRecordingFromDB = async (id: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

export const deleteRecordingFromDB = async (id: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
};

// --- STORE ---
export interface Recording {
  id: string;
  name: string;
  date: string;
  duration: number; // giây
}

interface RecordState {
  recordings: Recording[];
  isRecording: boolean;
  recordingTime: number;

  setRecordings: (list: Recording[]) => void;
  addRecording: (rec: Recording) => void;
  removeRecording: (id: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setRecordingTime: (time: number) => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      recordings: [],
      isRecording: false,
      recordingTime: 0,

      setRecordings: (recordings) => set({ recordings }),
      addRecording: (rec) =>
        set((state) => ({ recordings: [rec, ...state.recordings] })),
      removeRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
        })),
      setIsRecording: (isRecording) => set({ isRecording }),
      setRecordingTime: (recordingTime) => set({ recordingTime }),
    }),
    {
      name: "record-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ recordings: state.recordings }), // Chỉ lưu danh sách, không lưu trạng thái đang ghi
    }
  )
);
