import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  ChevronLeft,
  ChevronRight,
  Type,
  FastForward,
  History,
  X,
  AlertCircle,
  Trash2,
} from "lucide-react";

// --- TYPES ---
interface ReadingHistory {
  id: string;
  snippet: string;
  fullText: string;
  date: string;
}

// --- HELPERS ---
const getORPIndex = (word: string) => {
  const len = word.length;
  if (len <= 1) return 0;
  if (len >= 2 && len <= 5) return 1;
  if (len >= 6 && len <= 9) return 2;
  if (len >= 10 && len <= 13) return 3;
  return 4;
};

const processText = (text: string) =>
  text.trim().replace(/\s+/g, " ").split(" ");

export const SpeedReaderModule = () => {
  // --- STATE ---
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // History State
  const [history, setHistory] = useState<ReadingHistory[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("reader_history") || "[]");
    } catch {
      return [];
    }
  });

  // Settings
  const [wpm, setWpm] = useState(300);
  const [fontSize, setFontSize] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("reader_history", JSON.stringify(history));
  }, [history]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReading) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") {
        setCurrentIndex((i) => Math.max(0, i - 10));
      } else if (e.code === "ArrowRight") {
        setCurrentIndex((i) => Math.min(words.length - 1, i + 10));
      } else if (e.code === "Escape") {
        handleStop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReading, words.length]);

  // --- LOGIC: SMART LOOP ---
  useEffect(() => {
    if (isPlaying && isReading && currentIndex < words.length) {
      const currentWord = words[currentIndex];

      let delayFactor = 1;
      if (/[.!?]$/.test(currentWord)) delayFactor = 2.2;
      else if (/[,:;]$/.test(currentWord)) delayFactor = 1.5;
      else if (currentWord.length > 8) delayFactor = 1.3;
      else if (currentWord.length < 4) delayFactor = 0.9;

      const baseDelay = 60000 / wpm;
      const finalDelay = baseDelay * delayFactor;

      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, finalDelay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isReading, currentIndex, wpm, words]);

  // --- HANDLERS ---
  const handleStart = () => {
    if (!inputText.trim()) return;
    const processed = processText(inputText);
    setWords(processed);
    setIsReading(true);
    setIsPlaying(true);
    setCurrentIndex(0);

    const newEntry: ReadingHistory = {
      id: Date.now().toString(),
      snippet: processed.slice(0, 8).join(" ") + "...",
      fullText: inputText,
      date: new Date().toLocaleDateString(),
    };
    // Add new, remove duplicates (if any), keep max 10
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.fullText !== inputText);
      return [newEntry, ...filtered].slice(0, 10);
    });
  };

  const handleStop = () => {
    setIsReading(false);
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleLoadHistory = (entry: ReadingHistory) => {
    setInputText(entry.fullText);
  };

  // Feature: Delete History Item
  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Ngăn chặn việc load bài đọc khi bấm nút xóa
    if (confirm("Remove this item from history?")) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // --- RENDER HELPERS ---
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 1:
        return "text-3xl md:text-4xl";
      case 2:
        return "text-4xl md:text-5xl";
      case 3:
        return "text-5xl md:text-6xl";
      case 4:
        return "text-6xl md:text-7xl";
      case 5:
        return "text-7xl md:text-8xl";
      default:
        return "text-5xl md:text-6xl";
    }
  };

  const renderWord = () => {
    if (!words[currentIndex]) return null;
    const word = words[currentIndex];
    const orpIdx = getORPIndex(word);

    const leftPart = word.slice(0, orpIdx);
    const pivotChar = word[orpIdx];
    const rightPart = word.slice(orpIdx + 1);

    return (
      <div
        className={`flex items-baseline font-mono font-bold tracking-wide select-none ${getFontSizeClass()}`}
      >
        <span className="text-slate-500 text-right w-[45%]">{leftPart}</span>
        <span className="text-red-500 w-[10%] text-center transform scale-110">
          {pivotChar}
        </span>
        <span className="text-slate-300 text-left w-[45%]">{rightPart}</span>
      </div>
    );
  };

  const timeLeft = Math.round(((words.length - currentIndex) / wpm) * 60);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <Zap size={20} className="text-indigo-500" />
          </div>
          <span>Speed Reader</span>
        </div>

        {isReading && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setWpm(Math.max(100, wpm - 25))}
                className="p-1.5 hover:text-white rounded hover:bg-slate-700 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono font-bold w-16 text-center text-indigo-400">
                {wpm} WPM
              </span>
              <button
                onClick={() => setWpm(Math.min(2000, wpm + 25))}
                className="p-1.5 hover:text-white rounded hover:bg-slate-700 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all ${
                showSettings
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Type size={18} />
            </button>
            <button
              onClick={handleStop}
              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* SETTINGS OVERLAY */}
      {isReading && showSettings && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          ></div>
          <div className="absolute top-16 right-4 z-50 w-72 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Type size={14} className="text-indigo-500" /> Appearance
              </h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-500 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Font Size
                  </label>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {fontSize}x
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600">A</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-400"
                  />
                  <span className="text-lg text-slate-400 font-bold">A</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Speed
                  </label>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {wpm} WPM
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-emerald-400"
                />
                <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                  <span>Slow</span>
                  <span>Fast</span>
                  <span>Super</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BODY */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {!isReading ? (
          // === INPUT MODE ===
          <div className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-6 animate-in fade-in overflow-hidden">
            {/* Text Area */}
            <div className="flex-1 flex flex-col gap-4 h-full">
              <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-1 flex-1 flex flex-col shadow-xl focus-within:border-indigo-500/50 transition-colors h-full">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none custom-scrollbar leading-relaxed font-mono"
                  placeholder="Paste article, email, or chapter here..."
                />
                <div className="px-4 py-2 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                  <span>
                    {inputText.split(/\s+/).filter((w) => w.length > 0).length}{" "}
                    words
                  </span>
                  <button
                    onClick={() => setInputText("")}
                    className="hover:text-rose-400 transition-colors"
                  >
                    Clear text
                  </button>
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!inputText.trim()}
                className="flex-none py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
              >
                <Play size={18} fill="currentColor" /> Start Reading
              </button>
            </div>

            {/* History Sidebar */}
            <div className="lg:w-72 flex flex-col gap-4 h-full min-h-[300px]">
              <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 flex-1 shadow-lg overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <History size={14} /> Recent
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center text-xs text-slate-600 py-8 italic">
                      No history yet
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleLoadHistory(item)}
                        className="relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 cursor-pointer transition-colors group border border-transparent hover:border-slate-600"
                      >
                        <div className="text-xs text-slate-300 font-medium line-clamp-2 mb-1 group-hover:text-white pr-6">
                          {item.snippet}
                        </div>
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>{item.date}</span>
                          <span className="group-hover:text-indigo-400 transition-colors"></span>
                        </div>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <div className="flex gap-2 items-start">
                  <AlertCircle
                    size={16}
                    className="text-indigo-400 mt-0.5 shrink-0"
                  />
                  <div className="text-xs text-indigo-200/80 leading-relaxed">
                    <strong>Pro Tip:</strong> Stare at the{" "}
                    <span className="text-red-400 font-bold">Red Letter</span>.
                    Use Spacebar to pause.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // === READER MODE ===
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300 select-none">
            {/* (Reader Mode UI giữ nguyên như cũ) */}
            <div
              className="flex-1 relative flex items-center justify-center bg-[#0f172a]"
              ref={readerRef}
            >
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/10 -translate-x-1/2"></div>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-indigo-500/10 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 border-x border-slate-800 opacity-30 pointer-events-none"></div>
              <div className="relative z-10 w-full max-w-5xl text-center px-4">
                {renderWord()}
              </div>
            </div>

            <div className="bg-[#1e293b] border-t border-slate-800 p-4 pb-6 flex flex-col justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
                <span>
                  Progress:{" "}
                  {Math.round((currentIndex / (words.length - 1)) * 100)}%
                </span>
                <span>Time Left: ~{timeLeft}s</span>
              </div>
              <div
                className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6 cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = x / rect.width;
                  setCurrentIndex(Math.floor(pct * words.length));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-100 ease-linear group-hover:brightness-125"
                  style={{
                    width: `${(currentIndex / (words.length - 1)) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(Math.max(0, currentIndex - 10));
                  }}
                  className="p-4 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border-4 border-[#0f172a] ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20"
                  }`}
                >
                  {isPlaying ? (
                    <Pause size={32} fill="currentColor" />
                  ) : (
                    <Play size={32} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(
                      Math.min(words.length - 1, currentIndex + 10)
                    );
                  }}
                  className="p-4 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
                >
                  <FastForward size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
