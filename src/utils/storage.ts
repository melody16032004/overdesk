import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
  exists,
} from "@tauri-apps/plugin-fs";

// QUAY VỀ CẤU TRÚC ĐƠN GIẢN NHẤT
const FILE_NAME = "overdesk-data.json";

const DEFAULT_DATA = {
  tasks: [],
  notes: [],
  settings: { theme: "light", viewMode: "panel" },
  map_saved_locs: [],
  timerSettings: { work: 25, short: 5, long: 15 },
  timerState: {
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    mode: "focus",
    isActive: false,
    sessions: 0,
    lastUpdated: Date.now(),
  },
};

export const saveToDisk = async (key: string, data: any) => {
  try {
    const dir = BaseDirectory.AppData;

    // Không cần mkdir nữa vì Rust đã làm rồi.
    // Chỉ cần logic đọc/ghi cơ bản.

    let currentData = { ...DEFAULT_DATA };

    // Kiểm tra và đọc file cũ
    try {
      const fileExists = await exists(FILE_NAME, { baseDir: dir });
      if (fileExists) {
        const content = await readTextFile(FILE_NAME, { baseDir: dir });
        if (content) {
          // Merge dữ liệu an toàn
          const parsed = JSON.parse(content);
          currentData = { ...currentData, ...parsed };
        }
      }
    } catch (e) {
      console.warn("First time save or read error:", e);
    }

    // Cập nhật và ghi đè
    currentData = { ...currentData, [key]: data };

    await writeTextFile(FILE_NAME, JSON.stringify(currentData, null, 2), {
      baseDir: dir,
    });
  } catch (err) {
    console.error("SAVE ERROR:", err);
  }
};

export const loadFromDisk = async (key: string) => {
  try {
    const dir = BaseDirectory.AppData;
    const content = await readTextFile(FILE_NAME, { baseDir: dir });
    const data = JSON.parse(content);
    return data[key] || null;
  } catch (err) {
    return null;
  }
};
