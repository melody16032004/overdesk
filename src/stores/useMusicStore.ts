import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --- GLOBAL AUDIO INSTANCE (Nằm ngoài React) ---
export const globalAudio = new Audio();
globalAudio.crossOrigin = "anonymous"; // Để Visualizer hoạt động

export interface Song {
  id: string;
  name: string;
  url: string;
  duration?: number;
  isLocal?: boolean;
}

interface MusicState {
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  repeatMode: "off" | "one" | "all";
  isShuffle: boolean;
  volume: number;

  // Actions
  setPlaylist: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  setCurrentIndex: (index: number) => void;
  togglePlay: () => void; // Gom Play/Pause vào 1 hàm
  setRepeatMode: (mode: "off" | "one" | "all") => void;
  toggleShuffle: () => void;
  setVolume: (vol: number) => void;
  setIsPlaying: (playing: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  reorderPlaylist: (newPlaylist: Song[]) => void;

  // Hàm này để component gọi khi muốn load source mới
  loadSource: (src: string) => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      playlist: [
        {
          id: "demo",
          name: "Demo - Lofi Chill",
          url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
          isLocal: false,
        },
      ],
      currentIndex: 0,
      isPlaying: false,
      repeatMode: "off",
      isShuffle: false,
      volume: 0.5,

      setPlaylist: (playlist) => set({ playlist }),

      addSong: (song) =>
        set((state) => ({
          playlist: [...state.playlist, song],
        })),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      // 👇 QUAN TRỌNG: Điều khiển trực tiếp Global Audio
      togglePlay: () => {
        const { isPlaying } = get();
        if (isPlaying) {
          globalAudio.pause();
        } else {
          globalAudio.play().catch((e) => console.error("Play error:", e));
        }
        set({ isPlaying: !isPlaying });
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      setVolume: (volume) => {
        globalAudio.volume = volume; // Set volume thật
        set({ volume }); // Lưu state
      },

      loadSource: (src: string) => {
        if (globalAudio.src !== src) {
          globalAudio.src = src;
          globalAudio.load();
        }
      },

      playNext: () => {
        const { playlist, currentIndex, repeatMode, isShuffle } = get();
        if (playlist.length === 0) return;

        let nextIndex = currentIndex + 1;
        if (isShuffle) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        } else if (nextIndex >= playlist.length) {
          if (repeatMode === "all") nextIndex = 0;
          else {
            globalAudio.pause();
            set({ isPlaying: false });
            return;
          }
        }
        set({ currentIndex: nextIndex, isPlaying: true });
      },

      playPrev: () => {
        const { playlist, currentIndex } = get();
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = playlist.length - 1;
        set({ currentIndex: prevIndex, isPlaying: true });
      },

      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

      reorderPlaylist: (newPlaylist) => {
        // When reordering, we need to ensure the currentIndex still points to the correct playing song
        const { playlist, currentIndex } = get();
        const currentSong = playlist[currentIndex];

        set({ playlist: newPlaylist });

        // If a song is currently playing or selected, find its new index
        if (currentSong) {
          const newIndex = newPlaylist.findIndex(
            (s) => s.id === currentSong.id
          );
          if (newIndex !== -1) {
            set({ currentIndex: newIndex });
          }
        }
      },
    }),
    {
      name: "music-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlist: state.playlist,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        volume: state.volume,
      }),
    }
  )
);
