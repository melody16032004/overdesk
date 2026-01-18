import {
  Play,
  Pause,
  SkipForward,
  Music,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMusicStore, globalAudio } from "../../../../stores/useMusicStore";
import { useAppStore } from "../../../../stores/useAppStore";
import { useState, useEffect } from "react";

export const MiniPlayer = () => {
  const { playlist, currentIndex, isPlaying, playNext, togglePlay } =
    useMusicStore();

  const { setLastActiveApp } = useAppStore();
  const currentSong = playlist[currentIndex];

  // Local state
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true); // 👇 State quản lý ẩn/hiện

  useEffect(() => {
    const updateProgress = () => {
      if (globalAudio.duration) {
        setProgress((globalAudio.currentTime / globalAudio.duration) * 100);
      }
    };
    globalAudio.addEventListener("timeupdate", updateProgress);
    return () => globalAudio.removeEventListener("timeupdate", updateProgress);
  }, []);

  if (!currentSong) return null;

  // --- GIAO DIỆN THU NHỎ (MINIMIZED) ---
  if (isMinimized) {
    return (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full pl-2 pr-4 py-2 shadow-2xl ring-1 ring-white/5 hover:scale-105 transition-all cursor-pointer"
        >
          {/* Spinning Icon */}
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center ${
              isPlaying ? "animate-spin-slow" : ""
            }`}
          >
            <Music size={14} className="text-white" />
          </div>

          {/* Text Animation */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-white max-w-[100px] truncate">
              {currentSong.name}
            </span>
            <span className="text-[9px] text-green-400 font-mono flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying
                    ? "bg-green-500 animate-pulse"
                    : "bg-slate-500 animate-pulse"
                } `}
              />
              {isPlaying ? (
                <span className="text-green-400 animate-pulse">PLAYING</span>
              ) : (
                <span className="text-slate-400 animate-pulse">PAUSED</span>
              )}
            </span>
          </div>

          {/* Expand Icon */}
          <ChevronUp
            size={16}
            className="text-slate-400 group-hover:text-white transition-colors ml-2"
          />
        </button>
      </div>
    );
  }

  // --- GIAO DIỆN ĐẦY ĐỦ (EXPANDED) ---
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-2xl ring-1 ring-white/5 group hover:bg-slate-900/90 transition-all">
        {/* Nút thu nhỏ (Minimize Button) - Absolute Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          className="absolute -top-3  left-1/2 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full border border-white/10 shadow-lg hover:scale-110 transition-all z-10"
          title="Minimize"
        >
          <ChevronDown size={14} />
        </button>

        {/* Album Art / Icon */}
        <div
          onClick={() => setLastActiveApp("music")}
          className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
          title="Open Full Player"
        >
          <Music size={20} className="text-white relative z-10" />
          {isPlaying && (
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
        </div>

        {/* Info */}
        <div
          onClick={() => setLastActiveApp("music")}
          className="flex-1 overflow-hidden cursor-pointer"
          title="Open Full Player"
        >
          <h4 className="text-sm font-bold text-white truncate">
            {currentSong.name}
          </h4>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
            {isPlaying ? (
              <span className="text-green-400 animate-pulse">PLAYING</span>
            ) : (
              <span>PAUSED</span>
            )}
            <div className="h-1 w-1 rounded-full bg-slate-600"></div>
            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};
