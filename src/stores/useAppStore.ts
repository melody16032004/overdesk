// src/stores/useAppStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface Task {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface TimerSettings {
  work: number; // Phút
  short: number; // Phút
  long: number; // Phút
}

interface TimerState {
  timeLeft: number;
  initialTime: number;
  mode: "focus" | "short" | "long";
  isActive: boolean;
  sessions: number;
  lastUpdated: number; // Quan trọng: Để tính bù giờ khi app chạy ngầm/background
}

export interface WeatherLocation {
  name: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface SocialItem {
  id: string;
  label: string;
  url: string;
  isCustom?: boolean; // Đánh dấu là link do người dùng tự thêm
}

const DEFAULT_SOCIALS: SocialItem[] = [
  { id: "fb", label: "Facebook", url: "https://www.facebook.com" },
  { id: "yt", label: "YouTube", url: "https://www.youtube.com" },
  { id: "ig", label: "Instagram", url: "https://www.instagram.com" },
  { id: "gpt", label: "ChatGPT", url: "https://chat.openai.com" },
];

interface AppState {
  // 1. UI State
  viewMode: "bubble" | "panel";
  theme: "dark" | "light";
  lastActiveApp: string | null;
  opacity: number;
  socialApps: SocialItem[];

  // 2. Data State (Dữ liệu người dùng)
  tasks: Task[];
  notes: Note[];
  mapSavedLocs: SavedLocation[];

  timerSettings: TimerSettings;
  timerState: TimerState;
  userName: string;
  weatherLocation: WeatherLocation | null;
  savedWeatherLocations: WeatherLocation[];

  // 3. Actions (Hàm xử lý)
  setViewMode: (mode: "bubble" | "panel") => void;
  toggleTheme: () => void;
  setLastActiveApp: (appId: string | null) => void;
  setOpacity: (val: number) => void;

  // 👇 CÁC HÀM CÒN THIẾU ĐÂY
  setTasks: (tasks: Task[]) => void;
  setNotes: (notes: Note[]) => void;
  setMapSavedLocs: (locs: SavedLocation[]) => void;
  setTimerState: (newState: Partial<TimerState>) => void;
  setUserName: (name: string) => void;
  setWeatherLocation: (loc: WeatherLocation | null) => void;
  toggleSavedWeatherLocation: (loc: WeatherLocation) => void;
  addSocialApp: (app: SocialItem) => void;
  removeSocialApp: (id: string) => void;

  multiWindowEnabled: boolean; // <--- THÊM
  toggleMultiWindow: () => void; // <--- THÊM

  cursorStyle: string; // Thêm dòng này
  customCursor: {
    normal: string | null; // Base64 ảnh tĩnh
    pointer: string | null; // Base64 ảnh pointer
    animated: string | null; // Base64 ảnh động
    size: number; // Kích thước
    enableAnimation: boolean; // Bật tắt animation
    isCustomMode: boolean;
  };
  setCustomCursor: (config: Partial<AppState["customCursor"]>) => void;

  backgroundImage: string | null; // Thêm dòng này
  setBackgroundImage: (url: string | null) => void; // Thêm dòng này

  autoHideUI: boolean;
  toggleAutoHideUI: () => void;

  appNotifications: Record<string, number>; // { 'calendar': 5, 'mail': 2 ... }
  setAppNotification: (appId: string, count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      viewMode: "panel",
      theme: "dark",
      lastActiveApp: "tasks",
      opacity: 1,
      userName: "User",
      weatherLocation: null,
      savedWeatherLocations: [],
      socialApps: DEFAULT_SOCIALS,

      tasks: [], // Mặc định rỗng
      notes: [], // Mặc định rỗng
      mapSavedLocs: [], // Mặc định rỗng

      // --- Actions ---
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),
      setLastActiveApp: (appId) => set({ lastActiveApp: appId }),
      setOpacity: (val) => set({ opacity: val }),

      // 👇 IMPLEMENT CÁC HÀM MỚI
      setTasks: (tasks) => set({ tasks }),
      setNotes: (notes) => set({ notes }),
      setMapSavedLocs: (locs) => set({ mapSavedLocs: locs }),

      timerSettings: { work: 25, short: 5, long: 15 },
      timerState: {
        timeLeft: 25 * 60,
        initialTime: 25 * 60,
        mode: "focus",
        isActive: false,
        sessions: 0,
        lastUpdated: Date.now(),
      },
      setTimerState: (newState) =>
        set((state) => ({
          timerState: { ...state.timerState, ...newState },
        })),
      setUserName: (name) => set({ userName: name }),
      setWeatherLocation: (loc) => set({ weatherLocation: loc }),
      toggleSavedWeatherLocation: (loc) =>
        set((state) => {
          const exists = state.savedWeatherLocations.find(
            (l) => l.lat === loc.lat && l.lon === loc.lon,
          );

          if (exists) {
            // Nếu đã có -> Xóa đi
            return {
              savedWeatherLocations: state.savedWeatherLocations.filter(
                (l) => l.lat !== loc.lat,
              ),
            };
          } else {
            // Nếu chưa có -> Thêm vào
            return {
              savedWeatherLocations: [...state.savedWeatherLocations, loc],
            };
          }
        }),
      addSocialApp: (app) =>
        set((state) => ({
          socialApps: [...state.socialApps, app],
        })),

      removeSocialApp: (id) =>
        set((state) => ({
          socialApps: state.socialApps.filter((app) => app.id !== id),
        })),

      multiWindowEnabled: false,
      toggleMultiWindow: () =>
        set((state) => ({ multiWindowEnabled: !state.multiWindowEnabled })),

      cursorStyle: "auto", // Mặc định
      customCursor: {
        normal: null,
        pointer: null,
        animated: null,
        size: 32,
        enableAnimation: false,
        isCustomMode: false,
      },
      setCustomCursor: (config) =>
        set((state) => ({
          customCursor: { ...state.customCursor, ...config },
        })),

      backgroundImage: null, // Mặc định là null (dùng nền mặc định của app)
      setBackgroundImage: (url) => set({ backgroundImage: url }),

      // 2. Giá trị mặc định là true (đang bật)
      autoHideUI: true,

      // 3. Hàm toggle
      toggleAutoHideUI: () =>
        set((state) => ({ autoHideUI: !state.autoHideUI })),

      appNotifications: {},
      setAppNotification: (appId, count) =>
        set((state) => ({
          appNotifications: { ...state.appNotifications, [appId]: count },
        })),
    }),
    {
      name: "overdesk-storage",
    },
  ),
);
