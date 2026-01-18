import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dices,
  History,
  Volume2,
  VolumeX,
  BarChart3,
  RotateCcw,
  Keyboard,
  X,
  Menu,
  Calculator,
  Sigma,
} from "lucide-react";

// --- TYPES ---
interface DieData {
  id: number;
  value: number;
  isRolling: boolean;
  isHeld: boolean;
}

interface RollHistory {
  id: string;
  values: number[];
  total: number;
  time: string;
}

type DiceTheme = "white" | "red" | "blue" | "black" | "gold";

// --- CONFIG ---
const THEMES: Record<
  DiceTheme,
  { bg: string; pip: string; border: string; shadow: string; name: string }
> = {
  white: {
    bg: "bg-white",
    pip: "bg-slate-900",
    border: "border-slate-300",
    shadow: "shadow-slate-400/50",
    name: "Cổ điển",
  },
  red: {
    bg: "bg-gradient-to-br from-red-500 to-red-700",
    pip: "bg-white",
    border: "border-red-400",
    shadow: "shadow-red-900/50",
    name: "Casino",
  },
  blue: {
    bg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    pip: "bg-white",
    border: "border-cyan-300",
    shadow: "shadow-cyan-500/40",
    name: "Neon",
  },
  black: {
    bg: "bg-gradient-to-br from-slate-800 to-black",
    pip: "bg-red-500",
    border: "border-slate-600",
    shadow: "shadow-black/80",
    name: "Bóng đêm",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-300 to-amber-500",
    pip: "bg-black",
    border: "border-yellow-200",
    shadow: "shadow-amber-500/40",
    name: "Hoàng gia",
  },
};

// --- AUDIO ENGINE ---
let audioCtx: AudioContext | null = null;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const playSound = (type: "roll" | "lock") => {
  const ctx = initAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (type === "roll") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(Math.random() * 200 + 100, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
};

export const DiceRollerModule = () => {
  const [numDice, setNumDice] = useState(2);
  const [dice, setDice] = useState<DieData[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const [history, setHistory] = useState<RollHistory[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dice_history") || "[]");
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dice_stats") || "[0,0,0,0,0,0]");
    } catch {
      return [0, 0, 0, 0, 0, 0];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("dice_sound") !== "false"
  );
  const [theme, setTheme] = useState<DiceTheme>(
    () => (localStorage.getItem("dice_theme") as DiceTheme) || "white"
  );

  // Tab State: 'history' | 'stats' | 'prob'
  const [activeTab, setActiveTab] = useState<"history" | "stats" | "prob">(
    "history"
  );

  const diceRef = useRef(dice);
  useEffect(() => {
    diceRef.current = dice;
  }, [dice]);

  useEffect(() => {
    localStorage.setItem("dice_history", JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem("dice_stats", JSON.stringify(stats));
  }, [stats]);
  useEffect(() => {
    localStorage.setItem("dice_theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("dice_sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    setDice(
      Array.from({ length: numDice }, (_, i) => ({
        id: i,
        value: 1,
        isRolling: false,
        isHeld: false,
      }))
    );
  }, []);

  // --- MATH: PROBABILITY CALCULATION (Dynamic Programming) ---
  const probabilities = useMemo(() => {
    // DP: dp[sum] = count of ways to reach sum
    let dp: { [key: number]: number } = { 0: 1 };

    for (let i = 0; i < numDice; i++) {
      const newDp: { [key: number]: number } = {};
      for (const sum in dp) {
        const currentCount = dp[sum];
        for (let face = 1; face <= 6; face++) {
          const nextSum = Number(sum) + face;
          newDp[nextSum] = (newDp[nextSum] || 0) + currentCount;
        }
      }
      dp = newDp;
    }

    const totalCombinations = Math.pow(6, numDice);
    const result = Object.entries(dp).map(([sum, count]) => ({
      sum: Number(sum),
      chance: (count / totalCombinations) * 100,
    }));
    return result;
  }, [numDice]);

  const updateDiceCount = (n: number) => {
    if (isRolling) return;
    setNumDice(n);
    setDice((prev) => {
      const newDice = [...prev];
      if (n > prev.length) {
        for (let i = prev.length; i < n; i++)
          newDice.push({ id: i, value: 1, isRolling: false, isHeld: false });
      } else {
        return newDice.slice(0, n);
      }
      return newDice;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        rollDice();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRolling, soundEnabled]);

  const rollDice = () => {
    if (isRolling) return;
    if (soundEnabled) initAudioContext();

    setIsRolling(true);

    const interval = setInterval(() => {
      if (soundEnabled && Math.random() > 0.5) playSound("roll");
      setDice((prev) =>
        prev.map((d) =>
          d.isHeld
            ? d
            : { ...d, value: Math.ceil(Math.random() * 6), isRolling: true }
        )
      );
    }, 80);

    setTimeout(() => {
      clearInterval(interval);

      const currentDice = diceRef.current;
      const finalDice = currentDice.map((d) =>
        d.isHeld
          ? d
          : { ...d, value: Math.ceil(Math.random() * 6), isRolling: false }
      );

      setDice(finalDice);
      if (soundEnabled) playSound("roll");
      if (navigator.vibrate) navigator.vibrate(50);

      setStats((prevStats) => {
        const newStats = [...prevStats];
        finalDice.forEach((d) => {
          newStats[d.value - 1] += 1;
        });
        return newStats;
      });

      const total = finalDice.reduce((acc, curr) => acc + curr.value, 0);
      const newRecord: RollHistory = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        values: finalDice.map((d) => d.value),
        total,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setHistory((prev) => [newRecord, ...prev].slice(0, 50));
      setIsRolling(false);
    }, 800);
  };

  const toggleHold = (id: number) => {
    if (isRolling) return;
    if (soundEnabled) playSound("lock");
    setDice((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isHeld: !d.isHeld } : d))
    );
  };

  const resetAll = () => {
    if (!confirm("Xóa toàn bộ lịch sử?")) return;
    setDice((prev) => prev.map((d) => ({ ...d, isHeld: false })));
    setHistory([]);
    setStats([0, 0, 0, 0, 0, 0]);
  };

  const totalScore = dice.reduce((acc, d) => acc + d.value, 0);

  // --- CONTENT RENDER ---
  const HistoryContent = () => (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-700 shrink-0">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === "history"
              ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <History size={16} /> Lịch sử
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === "stats"
              ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <BarChart3 size={16} /> Thống kê
        </button>
        <button
          onClick={() => setActiveTab("prob")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === "prob"
              ? "bg-slate-800 text-blue-400 border-b-2 border-blue-500"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <Sigma size={16} /> Xác suất
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* VIEW 1: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
            {history.length === 0 ? (
              <div className="text-center text-slate-600 py-10 text-xs">
                Chưa có lượt gieo nào.
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider">
                      {h.time}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {h.values.map((v, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 bg-slate-700 rounded text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-700/50">
                    <div className="text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">
                        Tổng
                      </span>
                      <span className="block text-lg font-black text-emerald-400">
                        {h.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 2: STATISTICS */}
        {activeTab === "stats" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center text-xs text-slate-500 mb-2">
              Tần suất xuất hiện (Tổng: {history.length * numDice})
            </div>
            <div className="space-y-3">
              {stats.map((count, idx) => {
                const max = Math.max(...stats) || 1;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {idx + 1}
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / max) * 100}%`,
                          opacity: count > 0 ? 1 : 0.3,
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] font-mono w-8 text-right text-slate-400">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={resetAll}
              className="w-full mt-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Xóa dữ liệu
            </button>
          </div>
        )}

        {/* VIEW 3: PROBABILITY (NEW) */}
        {activeTab === "prob" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl mb-4">
              <div className="text-xs text-blue-300 font-bold mb-1 flex items-center gap-2">
                <Calculator size={12} /> Lý thuyết toán học
              </div>
              <p className="text-[10px] text-slate-400">
                Tỉ lệ % ra các tổng điểm khi gieo <b>{numDice}</b> viên xúc xắc.
              </p>
            </div>

            <div
              className="space-y-1.5 h-full overflow-y-auto pr-1 custom-scrollbar"
              style={{ maxHeight: "60vh" }}
            >
              {probabilities.map((p) => {
                // Find max percent for scaling bar
                const maxPercent = Math.max(
                  ...probabilities.map((i) => i.chance)
                );
                const isHighest = p.chance === maxPercent;

                return (
                  <div
                    key={p.sum}
                    className={`group flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/50 ${
                      isHighest ? "bg-blue-900/10" : ""
                    }`}
                  >
                    <div
                      className={`w-6 text-center text-xs font-bold ${
                        isHighest ? "text-blue-400" : "text-slate-500"
                      }`}
                    >
                      {p.sum}
                    </div>
                    <div className="flex-1 h-6 relative flex items-center">
                      {/* Background Bar */}
                      <div className="absolute inset-0 bg-slate-800/50 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isHighest ? "bg-blue-500" : "bg-slate-600"
                          }`}
                          style={{
                            width: `${(p.chance / maxPercent) * 100}%`,
                            opacity: isHighest ? 0.8 : 0.4,
                          }}
                        ></div>
                      </div>
                      {/* Percent Text */}
                      <span className="relative z-10 ml-2 text-[9px] font-bold text-white drop-shadow-md">
                        {p.chance.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
            <Dices size={20} />
          </div>
          <span className="font-bold text-white text-lg tracking-wide hidden sm:block">
            Casino Pro
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(Object.keys(THEMES) as DiceTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-5 h-5 md:w-6 md:h-6 rounded mx-0.5 transition-all ${
                  theme === t
                    ? "ring-2 ring-white scale-110"
                    : "opacity-50 hover:opacity-100"
                }`}
                style={{
                  background:
                    t === "white"
                      ? "#e2e8f0"
                      : t === "black"
                      ? "#334155"
                      : THEMES[t].bg.includes("red")
                      ? "#ef4444"
                      : t === "blue"
                      ? "#06b6d4"
                      : "#fbbf24",
                }}
                title={THEMES[t].name}
              />
            ))}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-white border border-slate-700"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* CENTER: GAME BOARD */}
        <div className="flex-1 bg-[#0f172a] flex flex-col relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-emerald-900/10 pointer-events-none"></div>

          <div className="flex-none p-4 md:p-6 text-center z-10">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-1 animate-pulse">
              Total Score
            </div>
            <div
              className={`text-6xl md:text-7xl font-black ${
                isRolling
                  ? "text-slate-600 blur-sm scale-90"
                  : "text-white scale-100"
              } transition-all duration-300 drop-shadow-2xl`}
            >
              {totalScore}
            </div>
            <div className="h-6 mt-1 text-xs text-slate-500 font-medium">
              {dice.some((d) => d.isHeld) && (
                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 animate-in zoom-in">
                  🔒 Đang giữ {dice.filter((d) => d.isHeld).length} viên
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-3xl perspective-1000">
              {dice.map((d) => (
                <Die
                  key={d.id}
                  value={d.value}
                  rolling={d.isRolling}
                  held={d.isHeld}
                  theme={theme}
                  onClick={() => toggleHold(d.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex-none p-4 md:p-6 z-20 flex justify-center w-full bg-gradient-to-t from-[#0f172a] to-transparent">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl p-2 flex items-center gap-2 shadow-2xl w-full max-w-md md:w-auto justify-between">
              <div className="flex items-center px-3 border-r border-slate-700">
                <span className="text-xs font-bold text-slate-500 mr-2">
                  Dice:
                </span>
                <select
                  value={numDice}
                  onChange={(e) => updateDiceCount(Number(e.target.value))}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-lg"
                  disabled={isRolling}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} className="bg-slate-900">
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={rollDice}
                disabled={isRolling}
                className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                <Dices
                  size={22}
                  className={`transition-transform ${
                    isRolling ? "animate-spin" : "group-hover:-rotate-12"
                  }`}
                />
                <span className="tracking-wide">ROLL</span>
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 border-l border-slate-700 text-slate-500 text-[10px] uppercase font-bold">
                <Keyboard size={14} /> Spacebar
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: SIDEBAR (Desktop) */}
        <div className="hidden lg:flex w-80 bg-[#1e293b] border-l border-slate-800 flex-col shrink-0 z-20 shadow-xl">
          <HistoryContent />
        </div>

        {/* RIGHT: DRAWER (Mobile) */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setShowDrawer(false)}
            ></div>
            <div className="relative w-80 bg-[#1e293b] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-700">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-emerald-500" /> Data Center
                </h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <HistoryContent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DIE COMPONENT ---
const Die = ({
  value,
  rolling,
  held,
  theme,
  onClick,
}: {
  value: number;
  rolling: boolean;
  held: boolean;
  theme: DiceTheme;
  onClick: () => void;
}) => {
  const dotsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const dots = dotsMap[value] || [];
  const style = THEMES[theme];

  return (
    <div
      onClick={onClick}
      className={`
            w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl flex items-center justify-center cursor-pointer relative transition-all duration-300 border-[3px]
            ${style.bg} ${style.border} ${style.shadow}
            ${
              held
                ? "ring-2 md:ring-4 ring-emerald-500/50 scale-95 translate-y-2 grayscale-[0.2]"
                : "hover:-translate-y-2 hover:shadow-2xl"
            }
            ${rolling ? "animate-bounce blur-[1px]" : ""} shadow-xl
        `}
    >
      {held && (
        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-emerald-500 text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-20 flex items-center gap-1 animate-in zoom-in">
          <X size={8} /> HELD
        </div>
      )}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none"></div>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 md:gap-1.5 w-10 h-10 md:w-14 md:h-14">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <div
                className={`w-2 h-2 md:w-3.5 md:h-3.5 rounded-full shadow-inner ${style.pip} transition-all duration-300`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
