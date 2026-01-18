import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gamepad2,
  Play,
  Pause,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  History,
  Home,
} from "lucide-react";

// --- CONFIG ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

// --- TYPES ---
type GameState = "menu" | "playing" | "paused" | "gameover";

interface HistoryRecord {
  id: number;
  score: number;
  level: number;
  date: string;
}

// --- AUDIO ENGINE (Singleton) ---
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
};

const playSound = (
  type: "move" | "rotate" | "drop" | "clear" | "gameover" | "click"
) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  if (type === "move") {
    osc.type = "square";
    osc.frequency.setValueAtTime(200, now);
    gain.gain.setValueAtTime(0.02, now);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "rotate") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.02, now);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "click") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.02, now);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "drop") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain.gain.setValueAtTime(0.05, now);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === "clear") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.05, now);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === "gameover") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    gain.gain.setValueAtTime(0.1, now);
    osc.start(now);
    osc.stop(now + 0.5);
  }
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// --- SHAPES & COLORS ---
const SHAPES = {
  I: { shape: [[1, 1, 1, 1]], color: "cyan" },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "green",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "red",
  },
};
type ShapeType = keyof typeof SHAPES;

const COLORS: Record<string, string> = {
  cyan: "bg-cyan-400 shadow-[0_0_10px_#22d3ee]",
  blue: "bg-blue-500 shadow-[0_0_10px_#3b82f6]",
  orange: "bg-orange-500 shadow-[0_0_10px_#f97316]",
  yellow: "bg-yellow-400 shadow-[0_0_10px_#facc15]",
  green: "bg-emerald-500 shadow-[0_0_10px_#10b981]",
  purple: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
  red: "bg-rose-500 shadow-[0_0_10px_#f43f5e]",
  ghost: "bg-white/10 border border-white/20",
};

const randomPiece = () => {
  const keys = Object.keys(SHAPES) as ShapeType[];
  return keys[Math.floor(Math.random() * keys.length)];
};

export const GameModule = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>("menu"); // NEW: Game State Management
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [activePiece, setActivePiece] = useState<{
    type: ShapeType;
    shape: number[][];
    x: number;
    y: number;
  } | null>(null);
  const [nextPieceType, setNextPieceType] = useState<ShapeType>(() =>
    randomPiece()
  );

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [startLevel, setStartLevel] = useState(1); // NEW: Starting Difficulty
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particles, setParticles] = useState<
    { x: number; y: number; id: number }[]
  >([]);

  // NEW: History
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Calculate speed based on level
  const dropInterval = Math.max(100, 1000 - (level - 1) * 100);

  // --- EFFECTS ---

  // Load History & High Score
  useEffect(() => {
    const savedHistory = localStorage.getItem("tetris_history_v2");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Auto-Pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "playing") setGameState("paused");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameState]);

  // --- GAME LOGIC ---

  const saveHistory = useCallback(
    (finalScore: number, finalLevel: number) => {
      const newRecord: HistoryRecord = {
        id: Date.now(),
        score: finalScore,
        level: finalLevel,
        date: new Date().toLocaleDateString("vi-VN"),
      };
      const newHistory = [newRecord, ...history].slice(0, 10); // Keep top 10
      setHistory(newHistory);
      localStorage.setItem("tetris_history_v2", JSON.stringify(newHistory));
    },
    [history]
  );

  const spawnPiece = useCallback(() => {
    const type = nextPieceType;
    const shape = SHAPES[type].shape;
    const newPiece = {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };

    if (checkCollision(newPiece.x, newPiece.y, shape, grid)) {
      setGameState("gameover");
      if (soundEnabled) playSound("gameover");
      saveHistory(score, level);
    } else {
      setActivePiece(newPiece);
      setNextPieceType(randomPiece());
    }
  }, [nextPieceType, grid, soundEnabled, score, level, saveHistory]);

  const checkCollision = (
    x: number,
    y: number,
    shape: number[][],
    currentGrid: (string | null)[][]
  ) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newY = y + r;
          const newX = x + c;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && currentGrid[newY][newX])
          )
            return true;
        }
      }
    }
    return false;
  };

  const spawnExplosion = (y: number) => {
    const newParticles: any[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * COLS * BLOCK_SIZE,
        y: y * BLOCK_SIZE,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 600);
  };

  const lockPiece = () => {
    if (!activePiece) return;
    const newGrid = grid.map((row) => [...row]);
    activePiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const gy = activePiece.y + r;
          const gx = activePiece.x + c;
          if (gy >= 0) newGrid[gy][gx] = SHAPES[activePiece.type].color;
        }
      });
    });

    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newGrid[r].every((cell) => cell !== null)) {
        newGrid.splice(r, 1);
        newGrid.unshift(Array(COLS).fill(null));
        spawnExplosion(r);
        linesCleared++;
        r++;
      }
    }

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800];
      setScore((s) => s + points[linesCleared] * level);
      // Level tăng dựa trên StartLevel
      setLevel((l) =>
        Math.max(
          l,
          Math.floor((score + points[linesCleared] * level) / 1000) + startLevel
        )
      );
      if (soundEnabled) playSound("clear");
    } else {
      if (soundEnabled) playSound("drop");
    }

    setGrid(newGrid);
    setActivePiece(null);
  };

  const move = (dx: number, dy: number) => {
    if (gameState !== "playing" || !activePiece) return;
    if (
      !checkCollision(
        activePiece.x + dx,
        activePiece.y + dy,
        activePiece.shape,
        grid
      )
    ) {
      setActivePiece({
        ...activePiece,
        x: activePiece.x + dx,
        y: activePiece.y + dy,
      });
      if (dx !== 0 && soundEnabled) playSound("move");
      return true;
    }
    return false;
  };

  const rotate = () => {
    if (gameState !== "playing" || !activePiece) return;
    const newShape = activePiece.shape[0].map((_, index) =>
      activePiece.shape.map((row) => row[index]).reverse()
    );
    let offset = 0;
    if (checkCollision(activePiece.x, activePiece.y, newShape, grid)) {
      if (!checkCollision(activePiece.x - 1, activePiece.y, newShape, grid))
        offset = -1;
      else if (
        !checkCollision(activePiece.x + 1, activePiece.y, newShape, grid)
      )
        offset = 1;
      else return;
    }
    setActivePiece({
      ...activePiece,
      shape: newShape,
      x: activePiece.x + offset,
    });
    if (soundEnabled) playSound("rotate");
  };

  const hardDrop = () => {
    if (gameState !== "playing" || !activePiece) return;
    let dropY = activePiece.y;
    while (!checkCollision(activePiece.x, dropY + 1, activePiece.shape, grid)) {
      dropY++;
    }
    setActivePiece({ ...activePiece, y: dropY });
  };

  const update = (time: number) => {
    if (gameState !== "playing") return; // Stop loop if not playing
    if (!activePiece) {
      spawnPiece();
    } else {
      if (time - lastTimeRef.current > dropInterval) {
        if (!move(0, 1)) {
          lockPiece();
        }
        lastTimeRef.current = time;
      }
    }
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (gameState === "playing") {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [activePiece, grid, gameState, spawnPiece]); // Depend on gameState

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowUp") rotate();
      if (e.code === "Space") hardDrop();
      if (e.key === "p")
        setGameState((prev) => (prev === "paused" ? "playing" : "paused"));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePiece, grid, gameState, soundEnabled]);

  // --- GAME CONTROL ---
  const startGame = () => {
    if (soundEnabled) playSound("click");
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setLevel(startLevel);
    setGameState("playing");
    setActivePiece(null);
    setNextPieceType(randomPiece());
  };

  const goHome = () => {
    if (soundEnabled) playSound("click");
    setGameState("menu");
  };

  const getGhostY = () => {
    if (!activePiece) return 0;
    let y = activePiece.y;
    while (!checkCollision(activePiece.x, y + 1, activePiece.shape, grid)) {
      y++;
    }
    return y;
  };
  const ghostY = getGhostY();

  return (
    <div className="h-full flex flex-col bg-[#09090b] text-slate-300 overflow-hidden select-none font-sans">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Gamepad2 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-widest uppercase">
              Neon Tetris
            </h3>
            <p className="text-[10px] text-slate-400">Cyberpunk Edition</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg text-slate-300 ${
              soundEnabled ? "bg-slate-700 text-emerald-400" : "bg-slate-800"
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {/* Pause Button only visible when playing */}
          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              <Pause size={16} />
            </button>
          )}
          <button
            onClick={goHome}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* GAME BODY */}
      <div className="flex-1 flex items-center justify-center p-4 gap-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#09090b] to-black relative overflow-hidden">
        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-ping"
            style={{
              left: p.x + 20,
              top: p.y + 40,
              boxShadow: "0 0 10px white",
            }}
          ></div>
        ))}

        {/* --- MAIN BOARD --- */}
        <div
          className="relative border-4 border-slate-800 bg-black/50 rounded-lg shadow-2xl overflow-hidden"
          style={{
            width: COLS * BLOCK_SIZE + 8,
            height: ROWS * BLOCK_SIZE + 8,
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-20 pointer-events-none opacity-10">
            {Array.from({ length: 200 }).map((_, i) => (
              <div key={i} className="border border-slate-700"></div>
            ))}
          </div>

          {/* Active Game Area (Only rendered if NOT in Menu) */}
          {gameState !== "menu" && (
            <div className="inset-0 p-1 relative">
              {/* Static Grid */}
              {grid.map((row, y) =>
                row.map(
                  (colorKey, x) =>
                    colorKey && (
                      <div
                        key={`${x}-${y}`}
                        className={`absolute w-6 h-6 rounded-sm ${COLORS[colorKey]}`}
                        style={{
                          left: x * BLOCK_SIZE,
                          top: y * BLOCK_SIZE,
                          width: BLOCK_SIZE,
                          height: BLOCK_SIZE,
                        }}
                      />
                    )
                )
              )}
              {/* Ghost */}
              {activePiece &&
                gameState === "playing" &&
                activePiece.shape.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? (
                      <div
                        key={`g-${r}-${c}`}
                        className={`absolute w-6 h-6 rounded-sm ${COLORS["ghost"]}`}
                        style={{
                          left: (activePiece.x + c) * BLOCK_SIZE,
                          top: (ghostY + r) * BLOCK_SIZE,
                          width: BLOCK_SIZE,
                          height: BLOCK_SIZE,
                        }}
                      />
                    ) : null
                  )
                )}
              {/* Active */}
              {activePiece &&
                gameState === "playing" &&
                activePiece.shape.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? (
                      <div
                        key={`a-${r}-${c}`}
                        className={`absolute w-6 h-6 rounded-sm ${
                          COLORS[SHAPES[activePiece.type].color]
                        }`}
                        style={{
                          left: (activePiece.x + c) * BLOCK_SIZE,
                          top: (activePiece.y + r) * BLOCK_SIZE,
                          width: BLOCK_SIZE,
                          height: BLOCK_SIZE,
                        }}
                      />
                    ) : null
                  )
                )}
            </div>
          )}

          {/* --- OVERLAYS --- */}

          {/* 1. START MENU */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 z-50 space-y-6">
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                  NEON TETRIS
                </h1>
                <p className="text-slate-400 text-xs uppercase tracking-widest">
                  Ultimate Experience
                </p>
              </div>

              {/* Difficulty Select */}
              <div className="w-full">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">
                  Độ khó (Tốc độ)
                </div>
                <div className="flex gap-2 justify-center">
                  {[1, 5, 10].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setStartLevel(lvl);
                        if (soundEnabled) playSound("click");
                      }}
                      className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                        startLevel === lvl
                          ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_#9333ea]"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {lvl === 1 ? "EASY" : lvl === 5 ? "NORMAL" : "HARD"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-xl shadow-[0_0_20px_#10b981] transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={24} fill="black" /> BẮT ĐẦU
              </button>

              {/* Mini History */}
              <div className="w-full bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2 uppercase border-b border-slate-700 pb-1">
                  <History size={12} /> Lịch sử đấu
                </div>
                <div className="h-24 overflow-y-auto custom-scrollbar space-y-1">
                  {history.length > 0 ? (
                    history.map((h, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-[10px] text-slate-300"
                      >
                        <span>{h.date}</span>
                        <span className="text-amber-400 font-mono">
                          {h.score} pts
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-600 italic">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PAUSE SCREEN */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <div className="text-3xl font-bold text-white tracking-widest animate-pulse mb-6">
                TẠM DỪNG
              </div>
              <button
                onClick={() => setGameState("playing")}
                className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-slate-200 flex items-center gap-2"
              >
                <Play size={16} fill="black" /> Tiếp tục
              </button>
            </div>
          )}

          {/* 3. GAME OVER SCREEN */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center animate-in fade-in z-50">
              <h2 className="text-4xl font-black text-rose-500 mb-2 glitch-text">
                THUA RỒI!
              </h2>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 w-4/5">
                <div className="text-slate-400 text-xs uppercase mb-1">
                  Điểm số
                </div>
                <div className="text-3xl font-mono font-bold text-white">
                  {score}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goHome}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                >
                  Menu
                </button>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20"
                >
                  Chơi lại
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR STATS (Ẩn khi ở Menu để đỡ rối) */}
        <div
          className={`w-32 flex flex-col gap-4 transition-opacity duration-500 ${
            gameState === "menu"
              ? "opacity-20 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col items-center shadow-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase mb-2">
              Next
            </span>
            <div className="w-16 h-12 relative flex flex-col items-center justify-center">
              {SHAPES[nextPieceType].shape.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => (
                    <div
                      key={c}
                      className={`w-3 h-3 m-[1px] rounded-[1px] ${
                        cell ? COLORS[SHAPES[nextPieceType].color] : "opacity-0"
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg space-y-3">
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Trophy size={14} />{" "}
                <span className="text-[10px] font-bold uppercase">Score</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {score}
              </div>
            </div>
            <div className="w-full h-px bg-slate-800"></div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">
                High Score
              </span>
              <div className="text-sm font-mono text-amber-400">
                {history.length > 0
                  ? Math.max(...history.map((h) => h.score))
                  : 0}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-cyan-500 mb-1">
              <Zap size={14} />{" "}
              <span className="text-[10px] font-bold uppercase">Level</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {level}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 space-y-1 bg-black/20 p-2 rounded border border-white/5">
            <div className="flex justify-between">
              <span>Xoay</span>{" "}
              <span className="text-slate-300 font-bold">↑</span>
            </div>
            <div className="flex justify-between">
              <span>Di chuyển</span>{" "}
              <span className="text-slate-300 font-bold">← →</span>
            </div>
            <div className="flex justify-between">
              <span>Thả nhanh</span>{" "}
              <span className="text-slate-300 font-bold">Space</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
