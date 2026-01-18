import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  Shield,
  Zap,
  Hexagon,
  Coins,
  Heart,
  Play,
  Pause,
  Crosshair,
  AlertTriangle,
  Target,
  ArrowUpCircle,
  Trash2,
  Map as MapIcon,
  Forward,
  FastForward,
  FlaskConical,
  Bomb,
  CloudLightning,
  Timer,
  Move,
  ZoomIn,
  Tent,
  Sun,
  Wind,
  Users,
} from "lucide-react";

// --- 1. CONFIG ---

const CELL_SIZE = 64;
const BASE_TICK_RATE = 50;
const STORAGE_KEY = "td_save_v13_drag_build";

// MAP CONFIGURATION
const MAPS = [
  {
    id: 0,
    name: "Thảo Nguyên (Dễ)",
    difficulty: "Dễ",
    desc: "Bản đồ nhỏ, đường đi đơn giản.",
    color: "text-emerald-400",
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0],
    ],
    waypoints: [
      { r: 1, c: 0 },
      { r: 1, c: 3 },
      { r: 3, c: 3 },
      { r: 3, c: 6 },
      { r: 2, c: 6 },
      { r: 2, c: 9 },
      { r: 5, c: 9 },
      { r: 5, c: 2 },
      { r: 7, c: 2 },
      { r: 7, c: 5 },
    ],
  },
  {
    id: 2,
    name: "Vùng Chết",
    difficulty: "Khó",
    desc: "Bản đồ siêu rộng.",
    color: "text-purple-400",
    grid: [
      [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], // CORE
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    waypoints: [
      { r: 0, c: 0 },
      { r: 0, c: 19 },

      { r: 0, c: 19 },
      { r: 19, c: 19 },

      { r: 19, c: 19 },
      { r: 19, c: 1 },

      { r: 19, c: 1 },
      { r: 2, c: 1 },

      { r: 2, c: 1 },
      { r: 2, c: 17 },

      { r: 2, c: 17 },
      { r: 17, c: 17 },

      { r: 17, c: 17 },
      { r: 17, c: 3 },

      { r: 17, c: 3 },
      { r: 4, c: 3 },

      { r: 4, c: 3 },
      { r: 4, c: 15 },

      { r: 4, c: 15 },
      { r: 15, c: 15 },

      { r: 15, c: 15 },
      { r: 15, c: 5 },

      { r: 15, c: 5 },
      { r: 6, c: 5 },

      { r: 6, c: 5 },
      { r: 6, c: 13 },

      { r: 6, c: 13 },
      { r: 13, c: 13 },

      { r: 13, c: 13 },
      { r: 13, c: 7 },

      { r: 13, c: 7 },
      { r: 8, c: 7 },

      { r: 8, c: 7 },
      { r: 8, c: 11 },

      { r: 8, c: 11 },
      { r: 11, c: 11 },

      { r: 11, c: 11 },
      { r: 11, c: 9 },

      { r: 11, c: 9 },
      { r: 10, c: 9 },
    ],
  },
];

// TOWERS
const TOWERS: Record<string, any> = {
  ARCHER: {
    id: "archer",
    name: "Cung Thủ",
    price: 60,
    range: 3.5,
    dmg: 15,
    cooldown: 12,
    color: "#3b82f6",
    icon: Crosshair,
    desc: "Cơ bản, bắn nhanh.",
  },
  CANNON: {
    id: "cannon",
    name: "Đại Bác",
    price: 140,
    range: 2.5,
    dmg: 50,
    cooldown: 40,
    color: "#ef4444",
    icon: Hexagon,
    desc: "Sát thương lớn.",
  },
  ICE: {
    id: "ice",
    name: "Băng Giá",
    price: 100,
    range: 3,
    dmg: 8,
    cooldown: 15,
    slow: 0.4,
    color: "#06b6d4",
    icon: Zap,
    desc: "Làm chậm 40%.",
  },
  POISON: {
    id: "poison",
    name: "Độc Dược",
    price: 180,
    range: 3,
    dmg: 5,
    cooldown: 10,
    poison: 4,
    color: "#22c55e",
    icon: FlaskConical,
    desc: "Sát thương độc.",
  },
  MORTAR: {
    id: "mortar",
    name: "Pháo Cối",
    price: 300,
    range: 5,
    dmg: 80,
    cooldown: 60,
    aoe: 2,
    color: "#c2410c",
    icon: Bomb,
    desc: "Nổ lan (AoE).",
  },
  LASER: {
    id: "laser",
    name: "Laser",
    price: 350,
    range: 4.5,
    dmg: 8,
    cooldown: 2,
    color: "#a855f7",
    icon: Target,
    desc: "Tia chết chóc.",
  },
  TESLA: {
    id: "tesla",
    name: "Tesla",
    price: 450,
    range: 3.5,
    dmg: 35,
    cooldown: 25,
    chain: 3,
    color: "#eab308",
    icon: Zap,
    desc: "Sét lan 3 mục tiêu.",
  },
  SOLAR: {
    id: "solar",
    name: "Quang Minh",
    price: 650,
    range: 8,
    dmg: 250,
    cooldown: 80,
    color: "#f97316",
    icon: Sun,
    desc: "Bắn xuyên thấu.",
  },
  STORM: {
    id: "storm",
    name: "Thần Sấm",
    price: 1200,
    range: 6,
    dmg: 150,
    cooldown: 45,
    chain: 5,
    color: "#0ea5e9",
    icon: CloudLightning,
    desc: "Hủy diệt diện rộng.",
  },
  BARRACKS: {
    id: "barracks",
    name: "Lính Đánh Thuê",
    price: 250,
    range: 2,
    dmg: 20,
    cooldown: 15,
    color: "#78716c",
    icon: Tent,
    desc: "Bắn tầm gần.",
  },
  TORNADO: {
    id: "tornado",
    name: "Bão Tố",
    price: 550,
    range: 3,
    dmg: 15,
    cooldown: 30,
    pushback: 1,
    color: "#94a3b8",
    icon: Wind,
    desc: "Đẩy lùi quái.",
  },
};

// --- TYPES ---
interface Entity {
  id: string;
  x: number;
  y: number;
  r: number;
  c: number;
}
interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  reward: number;
  frozen: number;
  poison: number;
  isBoss?: boolean;
  color: string;
  isInvisible: boolean;
}
interface Tower extends Entity {
  type: string;
  cooldownTimer: number;
  level: number;
  angle: number;
}
interface Projectile extends Entity {
  targetId: string;
  speed: number;
  dmg: number;
  color: string;
  type: string;
  targetPos?: { x: number; y: number };
  startX?: number;
  startY?: number;
  progress?: number;
}
interface Explosion extends Entity {
  id: string;
  duration: number;
  range: number;
}
interface GameSaveData {
  gold: number;
  lives: number;
  wave: number;
  towers: Tower[];
}

export const TowerDefenseModule = () => {
  // UI State
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [mapIndex, setMapIndex] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">(
    "idle"
  );
  const [gameSpeed, setGameSpeed] = useState(1);
  const [uiTrigger, setUiTrigger] = useState(0);
  console.log(uiTrigger);

  // Auto Wave
  const [isAutoWave, setIsAutoWave] = useState(false);
  const [autoWaveTimerDisplay, setAutoWaveTimerDisplay] = useState(0);

  // Selection & Building State
  const [selectedBuildTower, setSelectedBuildTower] = useState<string | null>(
    null
  ); // Loại tháp đang chọn để xây
  const [selectedMapTower, setSelectedMapTower] = useState<Tower | null>(null); // Tháp đã xây đang được chọn
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(
    null
  );

  // Zoom/Pan
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);

  const [view, setView] = useState({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  // Game Logic
  const gameRef = useRef({
    gold: 450,
    lives: 20,
    wave: 1,
    enemies: [] as Enemy[],
    towers: [] as Tower[],
    projectiles: [] as Projectile[],
    explosions: [] as Explosion[],
    spawning: false,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    autoWaveTimer: 0,
  });

  const currentMap = MAPS.find((m) => m.id === mapIndex) || MAPS[0];

  // --- SAVE / LOAD ---
  const loadGameData = (idx: number) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const allData = JSON.parse(saved);
        if (allData.maps && allData.maps[idx]) return allData.maps[idx];
      } catch (e) {}
    }
    return null;
  };

  const saveGameData = (idx: number, data: GameSaveData) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let allData = { maps: {} as Record<number, GameSaveData> };
    if (saved) {
      try {
        allData = JSON.parse(saved);
      } catch (e) {}
    }
    allData.maps[idx] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  };

  // --- MAP PRE-RENDERING ---
  useEffect(() => {
    if (screen !== "game") return;
    const buffer = document.createElement("canvas");
    if (currentMap?.grid) {
      buffer.width = currentMap.grid[0].length * CELL_SIZE;
      buffer.height = currentMap.grid.length * CELL_SIZE;
      const ctx = buffer.getContext("2d");
      if (!ctx) return;

      currentMap.grid.forEach((row, y) => {
        row.forEach((cell, x) => {
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;
          ctx.fillStyle = (x + y) % 2 === 0 ? "#1e293b" : "#334155";
          if (cell === 1) ctx.fillStyle = "#475569";
          if (cell === 2) ctx.fillStyle = "#1d4ed8";
          if (cell === 3) ctx.fillStyle = "#b91c1c";
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          if (cell === 1) {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      bufferRef.current = buffer;
    }
  }, [currentMap, screen]);

  // --- AUTO SCALE ---
  useLayoutEffect(() => {
    if (screen !== "game") return;
    const handleResize = () => {
      if (containerRef.current && currentMap?.grid) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const mapWidth = currentMap.grid[0].length * CELL_SIZE;
        const mapHeight = currentMap.grid.length * CELL_SIZE;

        const scaleX = (width - 32) / mapWidth;
        const scaleY = (height - 32) / mapHeight;
        const newScale = Math.min(scaleX, scaleY, 1.0);

        const offsetX = (width - mapWidth * newScale) / 2;
        const offsetY = (height - mapHeight * newScale) / 2;

        setView({
          scale: newScale,
          x: offsetX,
          y: offsetY,
          isDragging: false,
          startX: 0,
          startY: 0,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentMap, screen]);

  // --- GAME LOOP ---
  useEffect(() => {
    let interval: any;
    let animId: number;

    if (screen === "game" && gameState !== "gameover") {
      interval = setInterval(() => {
        updateGame();
        setUiTrigger((prev) => prev + 1);
      }, BASE_TICK_RATE / gameSpeed);

      const render = () => {
        draw();
        animId = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, [
    screen,
    gameState,
    gameSpeed,
    view,
    hoverCell,
    selectedBuildTower,
    selectedMapTower,
    currentMap,
  ]);

  const getWaveInfo = (waveNum: number) => {
    const isBoss = waveNum % 5 === 0;
    const difficultyScale = Math.pow(1.15, waveNum - 1);

    let enemyType = "Quái";
    let baseHp = 50;
    let baseSpeed = 0.1;
    let baseCount = 5;
    let color = "bg-slate-500";
    let isInvisible = false;

    if (isBoss) {
      enemyType = "BOSS HYDRA";
      baseHp = waveNum <= 10 ? 800 * (waveNum / 5) : 3000;
      baseSpeed = 0.05;
      baseCount = 1;
      color = "bg-purple-600 border-2 border-yellow-400";
    } else {
      const type = waveNum % 5;
      if (type === 1) {
        enemyType = "Slime";
        color = "bg-green-500";
      } else if (type === 2) {
        enemyType = "Sói";
        baseSpeed = 0.15;
        baseHp = 40;
        color = "bg-orange-500";
      } else if (type === 3) {
        enemyType = "Dơi";
        baseSpeed = 0.2;
        baseHp = 30;
        color = "bg-pink-500";
      } else if (type === 4) {
        enemyType = "Kỵ Sĩ";
        baseSpeed = 0.07;
        baseHp = 120;
        color = "bg-slate-400";
      } else {
        enemyType = "Bóng Ma";
        baseSpeed = 0.12;
        baseHp = 60;
        color = "bg-indigo-900/80";
        isInvisible = true;
      }
      baseCount = 5 + Math.floor(waveNum / 1.5);
    }

    return {
      count: baseCount,
      hp: Math.floor(baseHp * difficultyScale),
      speed: Math.min(0.35, baseSpeed + waveNum * 0.002),
      reward: Math.floor((isBoss ? 400 : 15) * (1 + waveNum * 0.1)),
      interval: Math.max(300, 1500 - waveNum * 30),
      color,
      name: `${enemyType} (Lv.${waveNum})`,
      isBoss,
      isInvisible,
    };
  };

  const updateGame = () => {
    const state = gameRef.current;

    // 1. AUTO WAVE
    if (
      !state.spawning &&
      state.enemies.length === 0 &&
      state.enemiesToSpawn === 0
    ) {
      if (isAutoWave) {
        if (state.autoWaveTimer > 0) {
          state.autoWaveTimer -= BASE_TICK_RATE;
          setAutoWaveTimerDisplay(Math.ceil(state.autoWaveTimer / 1000));
        } else {
          if (gameState === "playing") {
            state.wave += 1;
            setGameState("idle");
            saveCurrentMapProgress();
            startWaveLogic();
          }
        }
      } else {
        if (gameState === "playing") {
          setGameState("idle");
          state.wave += 1;
          saveCurrentMapProgress();
        }
      }
      return;
    }

    // 2. SPAWN
    if (state.spawning && state.enemiesToSpawn > 0) {
      state.spawnTimer -= BASE_TICK_RATE;
      if (state.spawnTimer <= 0) {
        spawnEnemy();
        state.enemiesToSpawn--;
        const waveInfo = getWaveInfo(state.wave);
        state.spawnTimer = waveInfo ? waveInfo.interval : 1000;
        if (state.enemiesToSpawn <= 0) state.spawning = false;
      }
    }

    // 3. MOVE
    state.enemies.forEach((e) => {
      if (e.poison > 0) {
        e.hp -= 0.5;
        e.poison -= BASE_TICK_RATE;
      }
      if (e.pathIndex >= currentMap.waypoints.length) return;
      const target = currentMap.waypoints[e.pathIndex];
      const dx = target.c - e.x;
      const dy = target.r - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let moveSpeed = e.frozen > 0 ? e.speed * 0.5 : e.speed;
      if (e.frozen > 0) e.frozen -= BASE_TICK_RATE;

      if (dist <= moveSpeed) {
        e.pathIndex++;
        if (e.pathIndex < currentMap.waypoints.length) {
          const wp = currentMap.waypoints[e.pathIndex];
          e.x = wp.c;
          e.y = wp.r;
        }
      } else {
        e.x += (dx / dist) * moveSpeed;
        e.y += (dy / dist) * moveSpeed;
      }
    });

    const reachedBase = state.enemies.filter(
      (e) => e.pathIndex >= currentMap.waypoints.length
    );
    if (reachedBase.length > 0) {
      state.lives -= reachedBase.length;
      if (state.lives <= 0) {
        setGameState("gameover");
        saveGameData(mapIndex, { gold: 400, lives: 20, wave: 1, towers: [] });
      }
      state.enemies = state.enemies.filter(
        (e) => e.pathIndex < currentMap.waypoints.length
      );
    }

    // 4. TOWERS
    state.towers.forEach((t) => {
      if (t.cooldownTimer > 0) t.cooldownTimer -= 1;
      const stats = TOWERS[t.type];
      const range = stats.range * (1 + (t.level - 1) * 0.1);
      const damage = stats.dmg * (1 + (t.level - 1) * 0.3);

      const targetsInRanges = state.enemies.filter((e) => {
        const dist = Math.sqrt(Math.pow(e.x - t.c, 2) + Math.pow(e.y - t.r, 2));
        return dist <= range;
      });

      if (targetsInRanges.length > 0) {
        const target = targetsInRanges[0];
        const angle =
          Math.atan2(target.y - t.r, target.x - t.c) * (180 / Math.PI);
        t.angle = angle;

        if (t.cooldownTimer <= 0) {
          t.cooldownTimer = stats.cooldown;
          if (t.type === "TESLA" || t.type === "STORM") {
            const chainTargets = targetsInRanges.slice(0, stats.chain);
            chainTargets.forEach((ct) => {
              ct.hp -= damage;
              if (ct.hp <= 0) state.gold += ct.reward;
              state.projectiles.push({
                id: Math.random().toString(),
                x: t.c,
                y: t.r,
                r: 0,
                c: 0,
                targetId: ct.id,
                speed: 0,
                dmg: 0,
                color: t.type === "STORM" ? "bg-sky-400" : "bg-yellow-400",
                type: "beam",
                targetPos: { x: ct.x, y: ct.y },
              });
            });
          } else if (t.type === "SOLAR") {
            state.projectiles.push({
              id: Math.random().toString(),
              x: t.c,
              y: t.r,
              r: 0,
              c: 0,
              targetId: target.id,
              speed: 0,
              dmg: 0,
              color: "bg-orange-500",
              type: "beam",
              targetPos: { x: target.x, y: target.y },
            });
            target.hp -= damage;
            if (target.hp <= 0) state.gold += target.reward;
          } else if (t.type === "MORTAR") {
            state.projectiles.push({
              id: Math.random().toString(),
              x: t.c,
              y: t.r,
              r: 0,
              c: 0,
              targetId: "ground",
              targetPos: { x: target.x, y: target.y },
              speed: 0.05,
              dmg: damage,
              color: stats.color,
              type: "mortar_shell",
              startX: t.c,
              startY: t.r,
              progress: 0,
            });
          } else {
            state.projectiles.push({
              id: Math.random().toString(),
              x: t.c,
              y: t.r,
              r: 0,
              c: 0,
              targetId: targetsInRanges[0].id,
              speed: t.type === "LASER" ? 1.5 : 0.5,
              dmg: damage,
              color: stats.color,
              type: t.type,
            });
          }
        }
      }
    });

    // 5. PROJECTILES
    const survivingProjectiles: Projectile[] = [];
    state.projectiles.forEach((p) => {
      if (p.type === "beam") return;

      if (
        p.type === "mortar_shell" &&
        p.targetPos &&
        p.startX !== undefined &&
        p.startY !== undefined
      ) {
        p.progress = (p.progress || 0) + p.speed;
        if (p.progress >= 1) {
          state.explosions.push({
            id: Math.random().toString(),
            x: p.targetPos.x,
            y: p.targetPos.y,
            r: 0,
            c: 0,
            duration: 10,
            range: 2,
          });
          state.enemies.forEach((e) => {
            const dist = Math.sqrt(
              Math.pow(e.x - p.targetPos!.x, 2) +
                Math.pow(e.y - p.targetPos!.y, 2)
            );
            if (dist <= 2) {
              e.hp -= p.dmg;
              if (e.hp <= 0) state.gold += e.reward;
            }
          });
        } else {
          p.x = p.startX + (p.targetPos.x - p.startX) * p.progress;
          p.y = p.startY + (p.targetPos.y - p.startY) * p.progress;
          survivingProjectiles.push(p);
        }
        return;
      }

      const target = state.enemies.find((e) => e.id === p.targetId);
      if (!target) return;

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= p.speed) {
        target.hp -= p.dmg;
        if (p.color.includes("cyan")) target.frozen = 1500;
        if (p.type === "POISON") target.poison = 5000;
        if (target.hp <= 0) state.gold += target.reward;
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
        survivingProjectiles.push(p);
      }
    });

    state.projectiles = survivingProjectiles;
    state.explosions = state.explosions.filter((ex) => {
      ex.duration -= 1;
      return ex.duration > 0;
    });
    state.enemies = state.enemies.filter((e) => e.hp > 0);
  };

  const spawnEnemy = () => {
    const waveInfo = getWaveInfo(gameRef.current.wave);
    const start = currentMap.waypoints[0];
    gameRef.current.enemies.push({
      id: Math.random().toString(),
      x: start.c,
      y: start.r,
      r: start.r,
      c: start.c,
      pathIndex: 1,
      hp: waveInfo.hp,
      maxHp: waveInfo.hp,
      speed: waveInfo.speed,
      reward: waveInfo.reward,
      frozen: 0,
      poison: 0,
      isBoss: waveInfo.isBoss,
      color: waveInfo.color,
      isInvisible: waveInfo.isInvisible || false,
    });
  };

  const startWaveLogic = () => {
    const info = getWaveInfo(gameRef.current.wave);
    gameRef.current.enemiesToSpawn = info.count;
    gameRef.current.spawning = true;
    if (isAutoWave) gameRef.current.autoWaveTimer = 3000;
    setGameState("playing");
    setSelectedMapTower(null);
  };

  const startWave = () => {
    gameRef.current.autoWaveTimer = 0;
    startWaveLogic();
  };

  // --- ACTIONS ---

  const saveCurrentMapProgress = () => {
    saveGameData(mapIndex, {
      gold: gameRef.current.gold,
      lives: gameRef.current.lives,
      wave: gameRef.current.wave,
      towers: gameRef.current.towers,
    });
  };

  const handleMapClick = (r: number, c: number) => {
    if (gameState === "gameover") return;

    // 1. Check if clicking on an existing tower
    const existingTower = gameRef.current.towers.find(
      (t) => t.r === r && t.c === c
    );
    if (existingTower) {
      setSelectedMapTower(existingTower);
      setSelectedBuildTower(null); // Cancel building
      return;
    }

    // 2. Building Logic (If a build type is selected)
    if (selectedBuildTower) {
      if (currentMap.grid[r][c] !== 0) return; // Must be empty land

      const towerConfig = TOWERS[selectedBuildTower];
      if (gameRef.current.gold >= towerConfig.price) {
        // Build Tower
        gameRef.current.gold -= towerConfig.price;
        gameRef.current.towers.push({
          id: Math.random().toString(),
          type: selectedBuildTower,
          r,
          c,
          x: c,
          y: r,
          cooldownTimer: 0,
          level: 1,
          angle: 0,
        });
        setUiTrigger((n) => n + 1);
        saveCurrentMapProgress();
        // Don't deselect build tower to allow placing multiple
      }
    } else {
      // Just clicked empty space
      setSelectedMapTower(null);
    }
  };

  const upgradeTower = () => {
    if (!selectedMapTower) return;
    const cost = Math.floor(
      TOWERS[selectedMapTower.type].price * 0.8 * selectedMapTower.level
    );
    if (gameRef.current.gold >= cost) {
      gameRef.current.gold -= cost;
      selectedMapTower.level += 1;
      setUiTrigger((n) => n + 1);
      saveCurrentMapProgress();
    }
  };

  const sellTower = () => {
    if (!selectedMapTower) return;
    const refund = Math.floor(TOWERS[selectedMapTower.type].price * 0.5);
    gameRef.current.gold += refund;
    gameRef.current.towers = gameRef.current.towers.filter(
      (t) => t.id !== selectedMapTower.id
    );
    setSelectedMapTower(null);
    setUiTrigger((n) => n + 1);
    saveCurrentMapProgress();
  };

  const selectMap = (id: number) => {
    setMapIndex(id);
    const savedMapData = loadGameData(id);
    if (savedMapData) {
      gameRef.current = {
        ...gameRef.current,
        ...savedMapData,
        enemies: [],
        projectiles: [],
        explosions: [],
        spawning: false,
        enemiesToSpawn: 0,
        autoWaveTimer: 0,
      };
    } else {
      gameRef.current = {
        gold: 450,
        lives: 20,
        wave: 1,
        enemies: [],
        towers: [],
        projectiles: [],
        explosions: [],
        spawning: false,
        enemiesToSpawn: 0,
        spawnTimer: 0,
        autoWaveTimer: 0,
      };
    }
    setView({ scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 });
    setGameState("idle");
    setScreen("game");
  };

  const exitToMenu = () => {
    saveCurrentMapProgress();
    setScreen("menu");
  };
  const toggleAutoWave = () => {
    const newState = !isAutoWave;
    setIsAutoWave(newState);
    if (newState) {
      gameRef.current.autoWaveTimer = 3000;
      if (gameState === "idle") startWave();
    } else {
      gameRef.current.autoWaveTimer = 0;
    }
  };

  // Zoom/Pan
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomIntensity = 0.1;
    const newScale = Math.max(
      0.5,
      Math.min(3, view.scale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity))
    );
    setView((prev) => ({ ...prev, scale: newScale }));
  };

  // Main interaction handler for Click & Hover on Canvas
  const handleInteract = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;

      const rawX = (e.clientX - rect.left) * scaleX;
      const rawY = (e.clientY - rect.top) * scaleY;
      const worldX = (rawX - view.x) / view.scale;
      const worldY = (rawY - view.y) / view.scale;

      const gx = Math.floor(worldX / CELL_SIZE);
      const gy = Math.floor(worldY / CELL_SIZE);

      if (e.type === "mousedown") {
        if (e.button === 2) {
          setView((v) => ({
            ...v,
            isDragging: true,
            startX: e.clientX - v.x,
            startY: e.clientY - v.y,
          }));
        } else if (e.button === 0) {
          // Click Logic
          if (
            gx >= 0 &&
            gx < currentMap.grid[0].length &&
            gy >= 0 &&
            gy < currentMap.grid.length
          ) {
            handleMapClick(gy, gx);
          } else {
            setSelectedMapTower(null); // Click outside clears selection
          }
        }
      }

      if (e.type === "mousemove") {
        setHoverCell({ r: gy, c: gx });
        if (view.isDragging) {
          setView((v) => ({
            ...v,
            x: e.clientX - v.startX,
            y: e.clientY - v.startY,
          }));
        }
      }

      if (e.type === "mouseup" || e.type === "mouseleave") {
        setView((v) => ({ ...v, isDragging: false }));
      }
    },
    [view, currentMap, selectedBuildTower, gameState]
  ); // Add necessary dependencies

  // --- DRAW ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    // Draw Map
    if (bufferRef.current) {
      ctx.drawImage(bufferRef.current, 0, 0);
    }

    // Preview: Hover Cell Range
    if (
      selectedBuildTower &&
      hoverCell &&
      currentMap.grid[hoverCell.r]?.[hoverCell.c] === 0
    ) {
      const range = TOWERS[selectedBuildTower].range * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(
        hoverCell.c * CELL_SIZE + CELL_SIZE / 2,
        hoverCell.r * CELL_SIZE + CELL_SIZE / 2,
        range,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Highlight grid cell
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(
        hoverCell.c * CELL_SIZE,
        hoverCell.r * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    }

    // Selection: Selected Tower Range
    if (selectedMapTower) {
      const range =
        TOWERS[selectedMapTower.type].range *
        (1 + (selectedMapTower.level - 1) * 0.1) *
        CELL_SIZE;
      ctx.beginPath();
      ctx.arc(
        selectedMapTower.c * CELL_SIZE + CELL_SIZE / 2,
        selectedMapTower.r * CELL_SIZE + CELL_SIZE / 2,
        range,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Highlight grid
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectedMapTower.c * CELL_SIZE,
        selectedMapTower.r * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    }

    // Towers
    gameRef.current.towers.forEach((t) => {
      const x = t.c * CELL_SIZE + CELL_SIZE / 2;
      const y = t.r * CELL_SIZE + CELL_SIZE / 2;
      const stats = TOWERS[t.type];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((t.angle * Math.PI) / 180);

      ctx.fillStyle = stats.color;
      if (t.type === "CANNON" || t.type === "MORTAR") {
        ctx.fillRect(-12, -12, 24, 24);
      } else if (t.type === "ARCHER") {
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-10, -10);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.level.toString(), x + 16, y + 16);
    });

    // Enemies
    gameRef.current.enemies.forEach((e) => {
      if (e.isInvisible) ctx.globalAlpha = 0.5;
      const x = e.x * CELL_SIZE + CELL_SIZE / 2;
      const y = e.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.fillStyle = e.isBoss
        ? "#ef4444"
        : e.color === "bg-green-500"
        ? "#22c55e"
        : e.color === "bg-orange-500"
        ? "#f97316"
        : e.color === "bg-pink-500"
        ? "#ec4899"
        : "#64748b";
      if (e.frozen > 0) ctx.fillStyle = "#67e8f9";

      ctx.beginPath();
      ctx.arc(x, y, e.isBoss ? 18 : 12, 0, Math.PI * 2);
      ctx.fill();
      if (e.isBoss) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#facc15";
        ctx.stroke();
      }

      const hpPct = e.hp / e.maxHp;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x - 16, y - 24, 32, 4);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x - 16, y - 24, 32 * hpPct, 4);
      ctx.globalAlpha = 1;
    });

    // Projectiles
    gameRef.current.projectiles.forEach((p) => {
      if (p.type === "beam") {
        ctx.strokeStyle = p.color === "bg-sky-400" ? "#38bdf8" : "#fbbf24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(
          p.x * CELL_SIZE + CELL_SIZE / 2,
          p.y * CELL_SIZE + CELL_SIZE / 2
        );
        const target = p.targetPos
          ? p.targetPos
          : gameRef.current.enemies.find((e) => e.id === p.targetId);
        if (target)
          ctx.lineTo(
            target.x * CELL_SIZE + CELL_SIZE / 2,
            target.y * CELL_SIZE + CELL_SIZE / 2
          );
        ctx.stroke();
      } else {
        ctx.fillStyle = TOWERS[p.type].color;
        ctx.beginPath();
        ctx.arc(
          p.x * CELL_SIZE + CELL_SIZE / 2,
          p.y * CELL_SIZE + CELL_SIZE / 2,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });

    // Explosions
    gameRef.current.explosions.forEach((ex) => {
      ctx.fillStyle = `rgba(249, 115, 22, ${ex.duration / 10})`;
      ctx.beginPath();
      ctx.arc(
        ex.x * CELL_SIZE + CELL_SIZE / 2,
        ex.y * CELL_SIZE + CELL_SIZE / 2,
        ex.range * CELL_SIZE * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  };

  // --- RENDER MENU ---
  if (screen === "menu") {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800 p-4 md:p-8 items-center justify-center animate-in fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-indigo-900/50 rounded-full mb-4 shadow-lg shadow-indigo-500/20">
            <Shield size={48} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            THỦ THÀNH VÔ TẬN
          </h1>
          <p className="text-slate-500 uppercase tracking-widest text-xs md:text-sm">
            Chọn địa hình để bắt đầu
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl overflow-y-auto max-h-[60vh] custom-scrollbar">
          {MAPS.map((map) => {
            const hasSave = loadGameData(map.id);
            return (
              <div
                key={map.id}
                onClick={() => selectMap(map.id)}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-indigo-500 hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-indigo-600 transition-colors">
                    <MapIcon size={20} />
                  </div>
                  <div
                    className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-800 ${map.color}`}
                  >
                    {map.difficulty}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{map.name}</h3>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                  {map.desc}
                </p>
                {hasSave && (
                  <div className="absolute bottom-0 left-0 w-full bg-indigo-900/50 text-[10px] text-center py-1 text-indigo-200">
                    Đã lưu: Wave {hasSave.wave}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const remainingEnemies =
    gameRef.current.enemies.length + gameRef.current.enemiesToSpawn;

  return (
    <div
      className="flex flex-col md:flex-row h-full bg-slate-950 text-slate-200 rounded-xl overflow-hidden shadow-2xl border border-slate-800 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* HEADER */}
        <div className="h-12 md:h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={exitToMenu}
              className="flex items-center gap-2 font-bold text-sm md:text-base text-white hover:text-indigo-400 transition-colors"
            >
              <ArrowUpCircle className="-rotate-90" size={18} />{" "}
              <span className="hidden md:inline">{currentMap.name}</span>
            </button>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-yellow-400 font-bold bg-slate-800 px-2 md:px-3 py-1 rounded border border-slate-700 text-xs md:text-sm">
                <Coins size={14} /> {gameRef.current.gold}
              </div>
              <div className="flex items-center gap-1 text-red-400 font-bold bg-slate-800 px-2 md:px-3 py-1 rounded border border-slate-700 text-xs md:text-sm">
                <Heart size={14} /> {gameRef.current.lives}
              </div>
              <div className="flex items-center gap-1 text-blue-400 font-bold bg-slate-800 px-2 md:px-3 py-1 rounded border border-slate-700 text-xs md:text-sm">
                <Shield size={14} /> {gameRef.current.wave}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {gameState === "playing" && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-rose-400 bg-rose-900/20 px-2 py-1 rounded border border-rose-900/50 mr-2">
                <Users size={12} /> Quái: {remainingEnemies}
              </div>
            )}
            <button
              onClick={toggleAutoWave}
              className={`p-1.5 md:p-2 rounded font-bold flex items-center gap-1 border ${
                isAutoWave
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title="Tự động wave"
            >
              <Forward
                size={16}
                className={isAutoWave ? "animate-pulse" : ""}
              />{" "}
              <span className="text-[10px] hidden md:inline">
                {isAutoWave && gameRef.current.autoWaveTimer > 0
                  ? `${autoWaveTimerDisplay}s`
                  : "Auto"}
              </span>
            </button>
            <button
              onClick={() => setGameSpeed((s) => (s === 1 ? 2 : 1))}
              className={`p-1.5 md:p-2 rounded font-bold flex items-center gap-1 ${
                gameSpeed === 2
                  ? "bg-yellow-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <FastForward size={16} />{" "}
              <span className="text-[10px]">x{gameSpeed}</span>
            </button>
            {gameState === "idle" && !isAutoWave && (
              <button
                onClick={startWave}
                className="p-1.5 md:px-4 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg flex items-center gap-1 text-xs md:text-sm"
              >
                <Play size={16} fill="currentColor" />{" "}
                <span className="hidden md:inline">START</span>
              </button>
            )}
            {(gameState === "playing" || isAutoWave) && (
              <div className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg font-bold cursor-wait">
                {gameRef.current.autoWaveTimer > 0 ? (
                  <Timer size={18} className="animate-spin" />
                ) : (
                  <Pause size={18} fill="currentColor" />
                )}{" "}
                <span className="hidden sm:inline">
                  {gameRef.current.autoWaveTimer > 0
                    ? `${autoWaveTimerDisplay}s`
                    : "CHIẾN ĐẤU"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CANVAS */}
        <div
          className="flex-1 bg-slate-950 relative overflow-hidden cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleInteract}
          onMouseMove={handleInteract}
          onMouseUp={handleInteract}
          onMouseLeave={handleInteract}
        >
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full block touch-none"
          />
          <div className="absolute bottom-4 left-4 z-40 text-[10px] text-slate-500 pointer-events-none flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <ZoomIn size={12} /> Lăn chuột để Zoom
            </div>
            <div className="flex items-center gap-1">
              <Move size={12} /> Chuột phải để Kéo
            </div>
          </div>
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in backdrop-blur-sm">
              <AlertTriangle
                size={80}
                className="text-red-500 mb-4 animate-bounce"
              />
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                THẤT BẠI
              </h2>
              <p className="text-slate-400 text-base mb-6 font-medium">
                Thành trì thất thủ ở Wave {gameRef.current.wave}!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => selectMap(mapIndex)}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/30 transition-all active:scale-95"
                >
                  Chơi Lại
                </button>
                <button
                  onClick={exitToMenu}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                >
                  Thoát
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR (RIGHT/BOTTOM) */}
      <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 md:p-5 flex flex-col gap-4 shadow-xl z-20 overflow-y-auto max-h-[40vh] md:max-h-full custom-scrollbar">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shrink-0">
          {(() => {
            const info = getWaveInfo(gameRef.current.wave);
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shadow-lg ${info.color}`}
                  ></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {info.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {info.isBoss
                        ? "Nguy hiểm cực độ"
                        : info.isInvisible
                        ? "Tàng hình"
                        : "Thường"}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-slate-300 font-mono font-bold">
                  x{info.count}
                </span>
              </div>
            );
          })()}
        </div>

        {selectedMapTower ? (
          <div className="animate-in slide-in-from-right duration-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm uppercase flex items-center gap-2">
                <ArrowUpCircle size={16} /> Nâng Cấp Tháp
              </h3>
              <button
                onClick={() => setSelectedMapTower(null)}
                className="text-slate-500 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={16} className="opacity-0" />
              </button>
            </div>

            <div
              className={`p-4 rounded-xl border ${TOWERS[
                selectedMapTower.type
              ].color
                .replace("bg-", "border-")
                .replace(
                  "500",
                  "400"
                )} bg-slate-800/50 relative overflow-hidden`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className={`p-3 rounded-xl ${
                    TOWERS[selectedMapTower.type].color
                  } text-white shadow-lg`}
                >
                  {(() => {
                    const Icon = TOWERS[selectedMapTower.type].icon;
                    return <Icon size={24} />;
                  })()}
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-none mb-1">
                    {TOWERS[selectedMapTower.type].name}
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded inline-block font-mono">
                    Lv.{selectedMapTower.level}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Sát thương</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.floor(
                      TOWERS[selectedMapTower.type].dmg *
                        (1 + (selectedMapTower.level - 1) * 0.3)
                    )}{" "}
                    <span className="text-slate-500 text-[10px] ml-1">
                      (+{Math.floor(TOWERS[selectedMapTower.type].dmg * 0.3)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tầm bắn</span>
                  <span className="text-blue-400 font-bold">
                    {Math.floor(
                      TOWERS[selectedMapTower.type].range *
                        (1 + (selectedMapTower.level - 1) * 0.1) *
                        10
                    ) / 10}{" "}
                    ô
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={upgradeTower}
                disabled={
                  gameRef.current.gold <
                  Math.floor(
                    TOWERS[selectedMapTower.type].price *
                      0.8 *
                      selectedMapTower.level
                  )
                }
                className="py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                <span className="flex items-center gap-1 text-xs">
                  <ArrowUpCircle size={14} /> Nâng cấp
                </span>
                <span className="text-[10px] opacity-80">
                  {Math.floor(
                    TOWERS[selectedMapTower.type].price *
                      0.8 *
                      selectedMapTower.level
                  )}
                  G
                </span>
              </button>
              <button
                onClick={sellTower}
                className="py-3 bg-slate-800 hover:bg-red-900/30 text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <span className="flex items-center gap-1 text-xs">
                  <Trash2 size={14} /> Bán
                </span>
                <span className="text-[10px] opacity-80">
                  +{Math.floor(TOWERS[selectedMapTower.type].price * 0.5)}G
                </span>
              </button>
            </div>
            <button
              onClick={() => setSelectedMapTower(null)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(TOWERS) as [string, any][]).map(([key, t]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedBuildTower(
                    selectedBuildTower === key ? null : key
                  );
                  setSelectedMapTower(null);
                }}
                disabled={gameRef.current.gold < t.price}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all relative group
                    ${
                      selectedBuildTower === key
                        ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
                    } 
                    ${
                      gameRef.current.gold < t.price
                        ? "opacity-40 grayscale cursor-not-allowed"
                        : "active:scale-95"
                    }`}
              >
                <div
                  className={`p-2 rounded-lg ${t.color} text-white mb-2 shadow-md`}
                >
                  <t.icon size={20} />
                </div>
                <div className="text-xs font-bold text-slate-300 truncate w-full text-center mb-0.5">
                  {t.name}
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    gameRef.current.gold < t.price
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {t.price}G
                </div>
                {selectedBuildTower === key && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
