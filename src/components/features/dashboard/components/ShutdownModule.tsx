import { useState, useEffect, useRef } from "react";
import {
  Power,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Monitor,
  Apple,
  Command,
} from "lucide-react";

type OS = "win" | "mac";

export const ShutdownModule = () => {
  // --- STATE ---
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [os, setOs] = useState<OS>("win");
  const [copied, setCopied] = useState(false);
  const [cancelCopied, setCancelCopied] = useState(false);

  // Custom Input State
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);

  const timerRef = useRef<number | null>(null);

  // --- AUTO DETECT OS ---
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) setOs("mac");
    else setOs("win");
  }, []);

  // --- LOGIC ---
  const getTotalSeconds = () => hours * 3600 + minutes * 60;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Tính thời gian dự kiến tắt máy
  const getPredictedTime = () => {
    const now = new Date();
    const secondsToAdd = isRunning ? timeLeft : getTotalSeconds();
    now.setSeconds(now.getSeconds() + secondsToAdd);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getCommand = () => {
    const totalSec = getTotalSeconds();
    if (os === "win") {
      return `shutdown -s -t ${totalSec}`; // Windows dùng giây
    } else {
      return `sudo shutdown -h +${Math.ceil(totalSec / 60)}`; // Mac dùng phút
    }
  };

  const getCancelCommand = () => {
    return os === "win" ? "shutdown -a" : "sudo killall shutdown";
  };

  const handleStart = () => {
    if (getTotalSeconds() === 0) return;

    setIsRunning(true);
    setTimeLeft(getTotalSeconds());

    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const copyCancel = () => {
    navigator.clipboard.writeText(getCancelCommand());
    setCancelCopied(true);
    setTimeout(() => setCancelCopied(false), 2000);
    handleStop();
  };

  // Timer Effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // Adjust time presets
  const setPreset = (m: number) => {
    setHours(Math.floor(m / 60));
    setMinutes(m % 60);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden text-slate-800 dark:text-white">
      {/* Background Pulse Effect when Running */}
      {isRunning && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none z-0"></div>
      )}

      {/* HEADER */}
      <div className="flex-none p-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isRunning
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-200 dark:bg-white/10 text-slate-500"
            }`}
          >
            <Power size={18} />
          </div>
          <span className="tracking-tight">Power Timer</span>
        </h2>

        {/* OS Switcher */}
        <div className="flex bg-slate-200 dark:bg-black/20 p-1 rounded-lg">
          <button
            onClick={() => setOs("win")}
            className={`px-2 py-1 rounded transition-all ${
              os === "win"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setOs("mac")}
            className={`px-2 py-1 rounded transition-all ${
              os === "mac"
                ? "bg-white text-black shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Apple size={14} />
          </button>
        </div>
      </div>

      {/* MAIN CLOCK DISPLAY */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[200px]">
        {/* Circular Progress */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Static Ring */}
          <div className="absolute inset-0 rounded-full border-[6px] border-slate-200 dark:border-white/5"></div>

          {/* Active Ring (SVG) */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <circle
              cx="112"
              cy="112"
              r="108"
              fill="none"
              stroke={isRunning ? "#ef4444" : "#cbd5e1"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={678} // 2 * PI * 108
              strokeDashoffset={
                isRunning ? 678 - (678 * timeLeft) / getTotalSeconds() : 0
              }
              className="transition-all duration-1000 linear"
            />
          </svg>

          {/* Inner Content */}
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 w-40 h-40 rounded-full shadow-inner border border-slate-100 dark:border-white/5 z-10">
            {isRunning ? (
              // RUNNING STATE: COUNTDOWN
              <>
                <div className="text-3xl font-black font-mono tracking-tighter text-red-500 animate-pulse">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Remaining
                </div>
                <div className="text-[10px] text-slate-500 mt-2 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Target: {getPredictedTime()}
                </div>
              </>
            ) : (
              // IDLE STATE: CUSTOM INPUT
              <>
                <div className="flex items-end gap-1 mb-1">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-12 text-3xl font-bold bg-transparent text-center focus:outline-none focus:text-red-500 border-b-2 border-transparent focus:border-red-500 transition-colors"
                    />
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      Hr
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-300 pb-2">
                    :
                  </span>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      className="w-12 text-3xl font-bold bg-transparent text-center focus:outline-none focus:text-red-500 border-b-2 border-transparent focus:border-red-500 transition-colors"
                    />
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      Min
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-green-500 mt-2 flex items-center gap-1">
                  Target: {getPredictedTime()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Presets (Only when NOT running) */}
        {!isRunning && (
          <div className="flex gap-2 mt-6">
            {[15, 30, 45, 60, 120].map((m) => (
              <button
                key={m}
                onClick={() => setPreset(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  hours * 60 + minutes === m
                    ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                    : "border-slate-200 dark:border-white/10 hover:border-red-400 text-slate-500 hover:text-red-400"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACTIONS AREA */}
      <div className="flex-none p-4 space-y-3 z-10 bg-slate-100/50 dark:bg-black/20 backdrop-blur-sm border-t border-slate-200 dark:border-white/5">
        {/* Command Terminal Box */}
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700 relative group overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
            <span className="flex items-center gap-1">
              <Terminal size={10} /> Terminal Command
            </span>
            <span className="text-slate-600">
              {os === "win" ? "cmd / powershell" : "terminal"}
            </span>
          </div>
          <code className="text-sm font-mono text-green-400 block truncate pr-8">
            <span className="text-slate-500 mr-2">$</span>
            {isRunning ? getCancelCommand() : getCommand()}
          </code>

          {/* Manual Copy Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                isRunning ? getCancelCommand() : getCommand()
              );
              const setFn = isRunning ? setCancelCopied : setCopied;
              setFn(true);
              setTimeout(() => setFn(false), 2000);
            }}
            className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {(isRunning ? cancelCopied : copied) ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {/* Warning Tip */}
        {!isRunning && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <AlertTriangle size={10} className="text-yellow-500" />
            <span>
              App will auto-copy command. Paste into <b>Run (Win+R)</b>
            </span>
          </div>
        )}

        {/* Main Action Buttons */}
        {isRunning ? (
          <div className="flex gap-3 animate-in slide-in-from-bottom-2">
            <button
              onClick={copyCancel}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Command size={16} /> Copy Cancel Cmd
            </button>
            <button
              onClick={handleStop}
              className="px-5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-bold flex items-center justify-center transition-all"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleStart}
            disabled={getTotalSeconds() === 0}
            className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Power size={18} /> START TIMER
          </button>
        )}
      </div>
    </div>
  );
};
