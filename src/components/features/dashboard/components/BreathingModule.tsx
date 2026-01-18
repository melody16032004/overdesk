import { useState, useEffect, useRef } from "react";
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CloudRain,
  Waves,
  Trees,
  Zap,
  Timer,
  VolumeX,
} from "lucide-react";

// --- CONFIG ---
type BreathMode = "box" | "4-7-8" | "relax";
type Phase = "inhale" | "hold" | "exhale" | "idle";

interface BreathPattern {
  id: BreathMode;
  name: string;
  steps: { phase: Phase; duration: number }[];
  desc: string;
  color: string;
}

const PATTERNS: BreathPattern[] = [
  {
    id: "box",
    name: "Box Breathing",
    desc: "Focus & Alertness",
    color: "text-cyan-400",
    steps: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 4 },
      { phase: "exhale", duration: 4 },
      { phase: "hold", duration: 4 },
    ],
  },
  {
    id: "4-7-8",
    name: "4-7-8 Relax",
    desc: "Sleep & Anxiety",
    color: "text-indigo-400",
    steps: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 7 },
      { phase: "exhale", duration: 8 },
    ],
  },
  {
    id: "relax",
    name: "Coherence",
    desc: "Balance",
    color: "text-emerald-400",
    steps: [
      { phase: "inhale", duration: 5 },
      { phase: "exhale", duration: 5 },
    ],
  },
];

// --- SOUNDS (LOCAL FILES) ---
// Đảm bảo bạn đã bỏ file vào folder: public/sounds/
const SOUNDS = [
  {
    id: "rain",
    label: "Rain",
    icon: CloudRain,
    src: "/sounds/rain.mp3",
  },
  {
    id: "waves",
    label: "Ocean",
    icon: Waves,
    src: "/sounds/ocean.mp3",
  },
  {
    id: "forest",
    label: "Forest",
    icon: Trees,
    src: "/sounds/forest.mp3",
  },
];

export const BreathingModule = () => {
  // --- STATE ---
  const [selectedPatternIdx, setSelectedPatternIdx] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [sessionTime, setSessionTime] = useState(0);

  // Settings
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [soundId, setSoundId] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Computed
  const currentPattern = PATTERNS[selectedPatternIdx];
  const currentStep = currentPattern.steps[stepIndex];
  const phase = isActive ? currentStep.phase : "idle";
  const totalDuration = currentStep.duration;

  // Progress Calculation (Fix division by zero)
  const progress =
    totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  // --- LOGIC: AUDIO ---
  useEffect(() => {
    // 1. Init Audio
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    // 2. Handle Source
    if (soundId) {
      const soundSrc = SOUNDS.find((s) => s.id === soundId)?.src;
      // Chỉ cập nhật nếu src thay đổi để tránh reset nhạc
      if (soundSrc && !audio.src.endsWith(soundSrc)) {
        audio.src = soundSrc;
        audio.load();
      }
    } else {
      audio.pause();
      // Không clear src để tránh lỗi NotSupported, chỉ pause là đủ
    }

    // 3. Handle Volume
    audio.volume = volume / 100;

    // 4. Handle Playback
    const playAudio = async () => {
      try {
        if (isActive && soundId) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.warn("Playback error (check file path):", error);
      }
    };
    playAudio();

    return () => {
      audio.pause();
    };
  }, [soundId, volume, isActive]);

  // --- LOGIC: BREATHING LOOP ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            const nextIndex = (stepIndex + 1) % currentPattern.steps.length;
            setStepIndex(nextIndex);

            // Haptic Feedback
            if (hapticEnabled && navigator.vibrate) {
              if (currentPattern.steps[nextIndex].phase === "inhale")
                navigator.vibrate([50, 30, 50]);
              else navigator.vibrate(50);
            }
            return currentPattern.steps[nextIndex].duration;
          }
          return prev - 0.1;
        });
      }, 100);

      sessionRef.current = setInterval(() => {
        setSessionTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sessionRef.current) clearInterval(sessionRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sessionRef.current) clearInterval(sessionRef.current);
    };
  }, [isActive, stepIndex, selectedPatternIdx, hapticEnabled]);

  // --- HANDLERS ---
  const handleReset = () => {
    setIsActive(false);
    setStepIndex(0);
    setTimeLeft(currentPattern.steps[0].duration);
    setSessionTime(0);
  };

  const handlePatternChange = (idx: number) => {
    setSelectedPatternIdx(idx);
    setIsActive(false);
    setStepIndex(0);
    setTimeLeft(PATTERNS[idx].steps[0].duration);
  };

  // --- VISUAL STYLES ---
  const getCircleStyle = () => {
    let scale = 1;
    if (!isActive)
      return { transform: "scale(1)", transition: "transform 0.5s ease-out" };

    switch (phase) {
      case "inhale":
        scale = 1.6;
        break;
      case "hold":
        const prevPhase =
          currentPattern.steps[
            (stepIndex - 1 + currentPattern.steps.length) %
              currentPattern.steps.length
          ].phase;
        scale = prevPhase === "inhale" ? 1.6 : 1;
        break;
      case "exhale":
        scale = 1;
        break;
    }

    return {
      transform: `scale(${scale})`,
      transition: `transform ${currentStep.duration}s linear`,
    };
  };

  const getPhaseText = () => {
    if (!isActive) return "Start";
    switch (phase) {
      case "inhale":
        return "Hít vào";
      case "hold":
        return "Giữ hơi";
      case "exhale":
        return "Thở ra";
      default:
        return "";
    }
  };

  const getPhaseColor = () => {
    if (!isActive) return "text-slate-400";
    switch (phase) {
      case "inhale":
        return "text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]";
      case "hold":
        return "text-violet-400 drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]";
      case "exhale":
        return "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]";
      default:
        return "text-slate-500";
    }
  };

  // SVG Config
  const RADIUS = 120;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* 1. HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-cyan-500/20 rounded-lg">
            <Wind size={20} className="text-cyan-500" />
          </div>
          <span>Zen Focus</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`p-2 rounded-xl transition-all ${
              hapticEnabled
                ? "bg-indigo-500/20 text-indigo-400"
                : "bg-slate-800 text-slate-500"
            }`}
            title="Haptic Feedback"
          >
            <Zap size={18} fill={hapticEnabled ? "currentColor" : "none"} />
          </button>
          <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-slate-400 flex items-center gap-2">
            <Timer size={12} /> {Math.floor(sessionTime / 60)}:
            {(sessionTime % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY */}
      <div className="flex-1 flex flex-col items-center justify-between relative p-3 overflow-y-auto custom-scrollbar">
        {/* Pattern Selector */}
        <div className="w-full flex justify-center mt-1 z-10">
          <div className="inline-flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {PATTERNS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handlePatternChange(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPatternIdx === idx
                    ? "bg-slate-700 text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* VISUALIZER */}
        <div className="flex-1 flex items-center justify-center w-full min-h-[290px]">
          <div className="relative w-[280px] h-[280px] flex items-center justify-center">
            {/* Progress Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 300 300"
            >
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                stroke="#1e293b"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-100 ease-linear ${
                  isActive ? "text-cyan-500" : "text-transparent"
                }`}
              />
            </svg>

            {/* Breathing Circle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center border border-slate-700 pointer-events-auto cursor-pointer select-none"
                style={getCircleStyle()}
                onClick={!isActive ? () => setIsActive(true) : undefined}
              >
                <div
                  className={`text-xl font-bold transition-all duration-300 text-center whitespace-nowrap ${getPhaseColor()}`}
                >
                  {getPhaseText()}
                </div>
                {isActive && (
                  <div className="text-3xl font-mono font-black text-white mt-1 opacity-90">
                    {Math.ceil(timeLeft)}
                  </div>
                )}
                {!isActive && (
                  <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    Tap
                  </div>
                )}
              </div>
            </div>

            {/* Glow */}
            <div
              className={`absolute inset-0 bg-cyan-500/10 rounded-full blur-[80px] transition-opacity duration-1000 pointer-events-none ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            ></div>
          </div>
        </div>

        {/* CONTROLS & MIXER */}
        <div className="w-full max-w-sm space-y-3 z-10">
          {/* Play/Reset */}
          <div className="flex justify-center gap-6 items-center">
            <button
              onClick={handleReset}
              className="p-4 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 shadow-lg"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`p-6 rounded-full text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                isActive
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20"
                  : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20"
              }`}
            >
              {isActive ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
          </div>

          {/* Sound Mixer */}
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Volume2 size={14} /> Ambience
              </span>
              {soundId ? (
                <span className="text-[10px] text-cyan-400 animate-pulse">
                  Playing
                </span>
              ) : (
                <span className="text-[10px] text-slate-600">Muted</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setSoundId(null)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
                  !soundId
                    ? "bg-slate-700 text-white shadow-inner"
                    : "bg-transparent text-slate-500 hover:bg-slate-700/50"
                }`}
              >
                <VolumeX size={18} />
                <span className="text-[10px] mt-1.5 font-medium">Off</span>
              </button>
              {SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSoundId(soundId === s.id ? null : s.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
                    soundId === s.id
                      ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-inner"
                      : "bg-transparent text-slate-500 hover:bg-slate-700/50"
                  }`}
                >
                  <s.icon size={18} />
                  <span className="text-[10px] mt-1.5 font-medium">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Volume */}
            <div
              className={`flex items-center gap-3 px-2 transition-all duration-300 ${
                soundId
                  ? "opacity-100 max-h-10"
                  : "opacity-30 max-h-10 grayscale pointer-events-none"
              }`}
            >
              <Volume2 size={14} className="text-slate-500" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
              />
              <span className="text-xs font-mono text-slate-400 w-6 text-right">
                {volume}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
