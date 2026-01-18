import { create } from "zustand";

interface ScreenShareState {
  // Trạng thái dữ liệu
  stream: MediaStream | null;
  isLive: boolean;
  isRecording: boolean;
  videoUrl: string | null;

  // Cấu hình
  micEnabled: boolean;
  camPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  mode: "standard" | "stream";

  // Hàm cập nhật state
  setStream: (stream: MediaStream | null) => void;
  setLive: (isLive: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  setVideoUrl: (url: string | null) => void;
  setMicEnabled: (enabled: boolean) => void;
  setCamPosition: (
    pos: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  ) => void;
  setMode: (mode: "standard" | "stream") => void;

  // Hàm điều khiển logic (Sẽ được Engine đăng ký vào đây)
  actions: {
    startStudio: () => Promise<void>;
    stopStudio: () => void;
    toggleRecord: () => void;
    toggleMic: () => void;
  };
  registerActions: (actions: ScreenShareState["actions"]) => void;
}

export const useScreenShareStore = create<ScreenShareState>((set) => ({
  stream: null,
  isLive: false,
  isRecording: false,
  videoUrl: null,
  micEnabled: true,
  camPosition: "bottom-right",
  mode: "standard",

  setStream: (stream) => set({ stream }),
  setLive: (isLive) => set({ isLive }),
  setRecording: (isRecording) => set({ isRecording }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setCamPosition: (camPosition) => set({ camPosition }),
  setMode: (mode) => set({ mode }),

  actions: {
    startStudio: async () => {},
    stopStudio: () => {},
    toggleRecord: () => {},
    toggleMic: () => {},
  },
  registerActions: (actions) => set({ actions }),
}));
