import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Bell,
  Palette,
  Check,
} from "lucide-react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

// --- CONFIG THEMES ---
const THEMES = [
  {
    id: "amber",
    primary: "from-amber-400 to-orange-600",
    glow: "bg-amber-500/20",
    text: "text-amber-400",
  },
  {
    id: "cyan",
    primary: "from-cyan-400 to-blue-600",
    glow: "bg-cyan-500/20",
    text: "text-cyan-400",
  },
  {
    id: "rose",
    primary: "from-rose-400 to-pink-600",
    glow: "bg-rose-500/20",
    text: "text-rose-400",
  },
  {
    id: "emerald",
    primary: "from-emerald-400 to-green-600",
    glow: "bg-emerald-500/20",
    text: "text-emerald-400",
  },
];

export const HourglassModule = () => {
  // --- STATE ---
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Pro Features State
  const [isLooping, setIsLooping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const intervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LOGIC TÍNH TOÁN CÁT ---
  const progress = (timeLeft / duration) * 100;
  const topSandHeight = `${progress}%`;
  const bottomSandHeight = `${100 - progress}%`;

  // --- SOUND EFFECT ---
  useEffect(() => {
    // Tạo âm thanh beep đơn giản (hoặc bạn có thể link file mp3 thật)
    // Đây là base64 của một tiếng "ding" nhẹ
    // const soundUrl =
    //   "data:audio/wav;base64,UklGRl9vT1dFWAMAAAB3YXZlZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...";
    // (Lưu ý: Để code gọn, tôi chưa để full base64, bạn có thể thay bằng link file mp3 online hoặc local)
    // audioRef.current = new Audio(soundUrl);
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  // --- NOTIFICATION ---
  const triggerNotification = async () => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
      if (permissionGranted) {
        sendNotification({ title: "OverDesk Hourglass", body: "Time's up!" });
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const handleFinish = () => {
    playSound();
    triggerNotification();

    if (isLooping) {
      // Delay 1 chút rồi lặp lại
      setTimeout(() => {
        setTimeLeft(duration);
        setIsRunning(true);
      }, 1000);
    } else {
      setIsRunning(false);
      setIsFinished(true);
    }
  };

  // --- HANDLERS ---
  const handleStartPause = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
      setIsFinished(false);
    } else {
      // Nếu đã hết giờ mà bấm play -> Reset và chạy lại
      setTimeLeft(duration);
      setIsRunning(true);
      setIsFinished(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(duration);
  };

  const handleChangeDuration = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* --- BACKGROUND GLOW (Responsive) --- */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[80%] ${currentTheme.glow} rounded-full blur-[120px] pointer-events-none transition-colors duration-500 opacity-60`}
      ></div>

      {/* --- HEADER TOOLBAR (Pro Features) --- */}
      <div className="flex justify-between items-center p-4 z-40 bg-gradient-to-b from-black/40 to-transparent shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              soundEnabled
                ? "bg-white/10 text-white"
                : "bg-transparent text-slate-500 hover:text-white"
            }`}
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isLooping
                ? `bg-white/10 ${currentTheme.text}`
                : "bg-transparent text-slate-500 hover:text-white"
            }`}
            title="Auto Loop"
          >
            <Repeat size={16} />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <Palette size={18} />
          </button>
          {/* Theme Picker Dropdown */}
          {showThemePicker && (
            <div className="absolute top-full right-0 mt-2 p-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme);
                    setShowThemePicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.primary}`}
                  ></div>
                  <span
                    className={`text-xs font-medium ${
                      currentTheme.id === theme.id
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  >
                    {theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}
                  </span>
                  {currentTheme.id === theme.id && (
                    <Check size={12} className="ml-auto text-white" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT (Responsive Flex) --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 w-full">
        {/* --- VISUAL HOURGLASS (Tự động scale theo khung hình) --- */}
        <div className="relative w-full max-w-[240px] h-auto aspect-[100/160] max-h-[60%] z-10 animate-in zoom-in duration-500">
          {/* SVG Frame */}
          <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient
                id="glassGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>
            <path
              d="M10,10 L90,10 L55,80 L90,150 L10,150 L45,80 Z"
              stroke="url(#glassGradient)"
              strokeWidth="1.5"
              fill="rgba(0,0,0,0.2)"
              className="backdrop-blur-[2px]"
            />
            {/* Highlight viền */}
            <path
              d="M10,10 L90,10 L55,80 L90,150 L10,150 L45,80 Z"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>

          {/* Sand Container */}
          <div className="absolute inset-[2%] z-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Bầu trên */}
            <div
              className="w-full flex-1 relative overflow-hidden"
              style={{ clipPath: "polygon(10% 0, 90% 0, 55% 100%, 45% 100%)" }}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${currentTheme.primary} transition-all duration-300 ease-linear w-full opacity-90`}
                style={{ height: topSandHeight }}
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
              </div>
            </div>

            {/* Dòng chảy */}
            <div className="relative h-[4%] w-full flex justify-center items-center">
              <div
                className={`w-[2px] bg-white/80 transition-all duration-300 ${
                  isRunning && timeLeft > 0 ? "h-full" : "h-0"
                }`}
              ></div>
            </div>

            {/* Bầu dưới */}
            <div
              className="w-full flex-1 relative overflow-hidden flex items-end"
              style={{ clipPath: "polygon(45% 0, 55% 0, 90% 100%, 10% 100%)" }}
            >
              <div
                className={`w-full bg-gradient-to-t ${currentTheme.primary} transition-all duration-300 ease-linear opacity-90`}
                style={{
                  height: bottomSandHeight,
                  borderRadius: "50% 50% 0 0 / 20% 20% 0 0",
                }}
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- DIGITAL TIME --- */}
        <div
          className={`mt-4 text-5xl md:text-6xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-lg tabular-nums transition-all ${
            isRunning ? "scale-105" : "scale-100"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="p-6 flex flex-col gap-4 z-40 bg-gradient-to-t from-black/60 to-transparent shrink-0">
        {/* Play/Pause/Reset Group */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm active:scale-95"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleStartPause}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-black/50 transition-all active:scale-95 hover:-translate-y-1
                    ${
                      isRunning
                        ? "bg-slate-800 text-white border border-white/10"
                        : `bg-gradient-to-br ${currentTheme.primary} text-white`
                    }
                `}
          >
            {isRunning ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>
          <div className="w-12"></div> {/* Spacer for symmetry */}
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 3, 5, 10, 15, 25, 30, 45].slice(0, 4).map(
            (
              min // Hiển thị 4 nút cho mobile/nhỏ, có thể mở rộng
            ) => (
              <button
                key={min}
                onClick={() => handleChangeDuration(min * 60)}
                className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                  duration === min * 60
                    ? `bg-white/10 border-white/20 text-white`
                    : "bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                {min}m
              </button>
            )
          )}
        </div>
      </div>

      {/* --- FINISHED OVERLAY --- */}
      {isFinished && !isLooping && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 max-w-xs w-full mx-4">
            <Bell
              size={48}
              className={`${currentTheme.text} mb-4 animate-bounce`}
            />
            <h3 className="text-2xl font-bold text-white mb-2">Time's Up!</h3>
            <p className="text-slate-400 text-sm mb-6 text-center">
              Your session has completed.
            </p>
            <button
              onClick={handleReset}
              className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${currentTheme.primary} shadow-lg hover:brightness-110 active:scale-95 transition-all`}
            >
              Start New Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
