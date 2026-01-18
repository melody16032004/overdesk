import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun,
  Zap,
  Shield,
  Skull,
  Flower2,
  Play,
  Pause,
  Snowflake,
  Bomb,
  Shovel,
  Lock,
  Trophy,
  Forward,
  Coins,
  FastForward,
  Anchor,
  Layers,
  MoveDown,
  Hammer,
  Tractor,
  Flame,
  Citrus,
  ArrowUp,
  Infinity,
  Sword,
  Heart,
  Clock,
  ArrowRight,
  Sprout,
  ArrowLeft,
  RotateCcw,
  Home,
  ZoomIn,
} from "lucide-react";

// --- 1. CONFIGURATION ---
const GRID_ROWS = 5;
const GRID_COLS = 9;
const TICK_RATE = 50;
const STORAGE_KEY = "td_garden_v26_viewport";
const HAMMER_COOLDOWN = 60000;

// Helpers
const calculateStats = (
  base: number,
  level: number,
  type: "hp" | "dmg" | "cd"
) => {
  if (type === "cd") {
    const reduction = Math.min(0.5, (level - 1) * 0.05);
    return Math.floor(base * (1 - reduction));
  }
  return Math.floor(base * (1 + (level - 1) * 0.2));
};

// Custom Icon
const StarIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// PLANTS DATABASE
const PLANTS_DB: Record<string, any> = {
  PEASHOOTER: {
    id: "PEASHOOTER",
    name: "Súng Đậu",
    cost: 100,
    baseHp: 300,
    baseCd: 3000,
    actionInterval: 1500,
    baseDmg: 20,
    icon: Zap,
    color: "bg-green-500 border-green-700 shadow-green-500/50",
    desc: "Bắn đậu về phía kẻ thù.",
    lore: "Cậu ấy nổi tiếng với sự kiên định.",
    unlockLevel: 0,
  },
  SUNFLOWER: {
    id: "SUNFLOWER",
    name: "Hướng Dương",
    cost: 50,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 10000,
    baseDmg: 0,
    icon: Flower2,
    color: "bg-yellow-400 border-yellow-600 shadow-yellow-500/50",
    desc: "Tạo thêm năng lượng mặt trời.",
    lore: "Cô ấy thích nhảy múa theo điệu nhạc pop.",
    unlockLevel: 2,
  },
  CHERRYBOMB: {
    id: "CHERRYBOMB",
    name: "Bom Cherry",
    cost: 150,
    baseHp: 9999,
    baseCd: 30000,
    actionInterval: 1000,
    baseDmg: 1800,
    isInstant: true,
    icon: Bomb,
    color: "bg-red-600 border-red-800 shadow-red-500/50",
    desc: "Nổ tung tất cả zombie trong phạm vi 3x3.",
    lore: "'TỤI TÔI MUỐN NỔ TUNG!', họ hét lên.",
    unlockLevel: 3,
  },
  WALLNUT: {
    id: "WALLNUT",
    name: "Củ Quả",
    cost: 50,
    baseHp: 4000,
    baseCd: 20000,
    baseDmg: 0,
    icon: Shield,
    color: "bg-orange-800 border-orange-950 shadow-orange-900/50",
    desc: "Lá chắn kiên cố chặn đường zombie.",
    lore: "Cứng bên ngoài, mềm bên trong.",
    unlockLevel: 4,
  },
  POTATOMINE: {
    id: "POTATOMINE",
    name: "Khoai Mìn",
    cost: 25,
    baseHp: 300,
    baseCd: 20000,
    actionInterval: 14000,
    baseDmg: 1800,
    isTrap: true,
    icon: Anchor,
    color: "bg-amber-600 border-amber-800 shadow-amber-500/50",
    desc: "Nổ khi bị dẫm lên (Cần thời gian kích hoạt).",
    lore: "Spudow! Đó là âm thanh yêu thích của cậu ấy.",
    unlockLevel: 5,
  },
  SNOWPEA: {
    id: "SNOWPEA",
    name: "Súng Băng",
    cost: 175,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 1500,
    baseDmg: 20,
    effect: "slow",
    icon: Snowflake,
    color: "bg-cyan-400 border-cyan-600 shadow-cyan-400/50",
    desc: "Bắn đậu băng làm chậm đối thủ.",
    lore: "Mọi người bảo cậu ấy lạnh lùng, nhưng thực ra không phải.",
    unlockLevel: 6,
  },
  REPEATER: {
    id: "REPEATER",
    name: "Súng Kép",
    cost: 200,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 1500,
    baseDmg: 20,
    shots: 2,
    icon: Layers,
    color: "bg-emerald-600 border-emerald-800 shadow-emerald-500/50",
    desc: "Bắn hai viên đậu cùng lúc.",
    lore: "Súng Đậu ghen tị với cậu ấy.",
    unlockLevel: 7,
  },
  TORCHWOOD: {
    id: "TORCHWOOD",
    name: "Cây Đuốc",
    cost: 175,
    baseHp: 400,
    baseCd: 5000,
    baseDmg: 0,
    icon: Flame,
    color: "bg-orange-600 border-red-900 shadow-orange-500/50",
    desc: "Biến đậu thường thành đạn lửa (x2 sát thương).",
    lore: "Đừng đứng quá gần, cậu ấy rất nóng tính.",
    unlockLevel: 8,
    isPassive: true,
  },
  THREEPEATER: {
    id: "THREEPEATER",
    name: "Ba Nòng",
    cost: 325,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 1500,
    baseDmg: 20,
    isThreepeater: true,
    icon: ArrowUp,
    color: "bg-green-600 border-green-800 shadow-green-600/50",
    desc: "Bắn đạn ra 3 hàng (Trên, Giữa, Dưới).",
    lore: "Ba đầu thì tốt hơn một đầu, đúng không?",
    unlockLevel: 9,
  },
  SQUASH: {
    id: "SQUASH",
    name: "Bí Nghiền",
    cost: 50,
    baseHp: 1000,
    baseCd: 20000,
    actionInterval: 500,
    baseDmg: 1800,
    isShortRange: true,
    icon: MoveDown,
    color: "bg-lime-600 border-lime-800 shadow-lime-500/50",
    desc: "Nhảy lên và đè bẹp zombie lại gần.",
    lore: "Cậu ấy đã sẵn sàng để nghiền nát mọi thứ.",
    unlockLevel: 10,
  },
  SPIKEWEED: {
    id: "SPIKEWEED",
    name: "Gai Nhọn",
    cost: 100,
    baseHp: 9999,
    baseCd: 5000,
    actionInterval: 1000,
    baseDmg: 10,
    isFloor: true,
    icon: MoveDown,
    color: "bg-stone-500 border-stone-700 shadow-stone-500/50",
    desc: "Gây sát thương liên tục cho zombie đi qua.",
    lore: "Cậu ấy thích chọc ghẹo người khác.",
    unlockLevel: 11,
  },
  JALAPENO: {
    id: "JALAPENO",
    name: "Ớt Nổ",
    cost: 125,
    baseHp: 9999,
    baseCd: 35000,
    actionInterval: 1000,
    baseDmg: 2000,
    isRowInstant: true,
    icon: Flame,
    color: "bg-red-500 border-red-700 shadow-orange-500/50",
    desc: "Thiêu rụi toàn bộ zombie trên một hàng.",
    lore: "Cậu ấy cay nồng và bùng nổ.",
    unlockLevel: 12,
  },
  TWINSUN: {
    id: "TWINSUN",
    name: "Hoa Đôi",
    cost: 150,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 10000,
    baseDmg: 0,
    icon: Citrus,
    color: "bg-yellow-500 border-orange-500 shadow-orange-500/50",
    desc: "Tạo ra gấp đôi năng lượng (50 Sun).",
    lore: "Hai cái đầu cùng suy nghĩ về việc tạo ra năng lượng.",
    unlockLevel: 13,
  },
  MELONPULT: {
    id: "MELONPULT",
    name: "Dưa Hấu",
    cost: 300,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 2800,
    baseDmg: 80,
    isLobbed: true,
    aoe: 1.5,
    icon: MoveDown,
    color: "bg-green-400 border-green-800 shadow-green-500/50",
    desc: "Bắn dưa hấu gây sát thương lan mạnh.",
    lore: "Cậu ấy không phải là người ném đá giấu tay.",
    unlockLevel: 14,
  },
  GATLING: {
    id: "GATLING",
    name: "Súng Máy",
    cost: 450,
    baseHp: 400,
    baseCd: 5000,
    actionInterval: 1500,
    baseDmg: 20,
    shots: 4,
    icon: ArrowUp,
    color: "bg-green-800 border-green-950 shadow-green-900/50",
    desc: "Bắn liên thanh 4 viên đậu một lúc.",
    lore: "Cậu ấy đã đi lính về và giờ đây cậu ấy rất nghiêm túc.",
    unlockLevel: 15,
  },
  MAGNET: {
    id: "MAGNET",
    name: "Nam Châm",
    cost: 100,
    baseHp: 300,
    baseCd: 10000,
    actionInterval: 5000,
    baseDmg: 0,
    isMagnet: true,
    icon: Hammer,
    color: "bg-red-400 border-slate-600 shadow-red-500/50",
    desc: "Hút mũ sắt của Zombie.",
    lore: "Lực hút của cậu ấy là không thể cưỡng lại.",
    unlockLevel: 16,
  },
  STARFRUIT: {
    id: "STARFRUIT",
    name: "Sao Biển",
    cost: 125,
    baseHp: 300,
    baseCd: 5000,
    actionInterval: 1400,
    baseDmg: 20,
    isStar: true,
    icon: StarIcon,
    color: "bg-yellow-300 border-yellow-500 shadow-yellow-400/50",
    desc: "Bắn đạn ra 5 hướng.",
    lore: "Cậu ấy luôn muốn trở thành ngôi sao.",
    unlockLevel: 17,
  },
  ICESHROOM: {
    id: "ICESHROOM",
    name: "Nấm Băng",
    cost: 75,
    baseHp: 200,
    baseCd: 40000,
    actionInterval: 1000,
    isInstant: true,
    effect: "global_freeze",
    baseDmg: 20,
    icon: Snowflake,
    color: "bg-indigo-400 border-indigo-700 shadow-indigo-500/50",
    desc: "Đóng băng toàn màn hình",
    lore: "Mát lạnh!",
    unlockLevel: 18,
  },
};

const ZOMBIE_TYPES: Record<string, any> = {
  NORMAL: {
    type: "NORMAL",
    hp: 200,
    speed: 0.1,
    damage: 100,
    color: "bg-slate-500",
    icon: Skull,
  },
  CONE: {
    type: "CONE",
    hp: 560,
    speed: 0.1,
    damage: 100,
    color: "bg-orange-400",
    icon: Skull,
  },
  BUCKET: {
    type: "BUCKET",
    hp: 1300,
    speed: 0.08,
    damage: 100,
    color: "bg-zinc-500",
    icon: Skull,
    hasMetal: true,
  },
  FOOTBALL: {
    type: "FOOTBALL",
    hp: 1600,
    speed: 0.25,
    damage: 100,
    color: "bg-red-800",
    icon: Skull,
    hasMetal: true,
  },
  FLAG: {
    type: "FLAG",
    hp: 250,
    speed: 0.22,
    damage: 150,
    color: "bg-red-500",
    icon: Skull,
  },
  GARGANTUAR: {
    type: "GARGANTUAR",
    hp: 3000,
    speed: 0.05,
    damage: 9999,
    color: "bg-purple-700",
    icon: Skull,
    isBoss: true,
  },
};

const LEVEL_CONFIG: Record<number, any> = {
  1: { total: 5, types: ["NORMAL"], interval: 8000, desc: "Sân vườn" },
  2: {
    total: 10,
    types: ["NORMAL", "NORMAL", "CONE"],
    interval: 7000,
    desc: "Có thêm Hướng Dương",
  },
  3: {
    total: 15,
    types: ["NORMAL", "CONE"],
    interval: 6000,
    desc: "Có thêm Bom Cherry",
  },
  4: {
    total: 20,
    types: ["NORMAL", "CONE", "BUCKET"],
    interval: 5000,
    desc: "Có thêm Củ Quả",
  },
  5: {
    total: 25,
    types: ["NORMAL", "CONE", "BUCKET", "FLAG"],
    interval: 4500,
    desc: "Massive Wave",
  },
};

// --- TYPES ---
interface UserData {
  coins: number;
  unlockedPlants: string[];
  plantLevels: Record<string, number>;
  maxLevelReached: number;
  currentLevel: number;
}
interface Plant {
  id: string;
  r: number;
  c: number;
  type: string;
  hp: number;
  maxHp: number;
  actionTimer: number;
  state?: "armed" | "unarmed";
}
interface Zombie {
  id: string;
  r: number;
  c: number;
  type: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  isEating: boolean;
  color: string;
  freezeTimer: number;
  visualOffset: number;
  hasMetal?: boolean;
}
interface Projectile {
  id: string;
  r: number;
  x: number;
  y?: number;
  speedX: number;
  speedY: number;
  damage: number;
  effect?: string;
  isLobbed?: boolean;
  targetR?: number;
  targetC?: number;
  progress?: number;
  type?: string;
  isFire?: boolean;
}
interface SunToken {
  id: string;
  top: number;
  left: number;
  value: number;
  timer: number;
  isCollecting?: boolean;
}
interface Lawnmower {
  r: number;
  status: "ready" | "running" | "gone";
  x: number;
}
interface Particle {
  id: string;
  r: number;
  c: number;
  color: string;
  life: number;
  type: "hit" | "explode" | "sun" | "coin" | "freeze";
}
interface CoinDrop {
  id: string;
  top: number;
  left: number;
  value: number;
  timer: number;
  isCollecting?: boolean;
}

export const PvzGameModule = () => {
  // STATE
  const [screen, setScreen] = useState<"menu" | "game" | "shop">("menu");
  const [gameState, setGameState] = useState<
    "idle" | "playing" | "paused" | "gameover" | "victory" | "level_transition"
  >("idle");
  const [gameMode, setGameMode] = useState<"story" | "endless">("story");

  const [isLoaded, setIsLoaded] = useState(false);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 }); // Viewport Transform

  const [userData, setUserData] = useState<UserData>({
    coins: 0,
    unlockedPlants: ["PEASHOOTER"],
    plantLevels: {},
    maxLevelReached: 1,
    currentLevel: 1,
  });

  const [sun, setSun] = useState(150);
  const [level, setLevel] = useState(1);
  const [waveProgress, setWaveProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [isShovelActive, setIsShovelActive] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "shovel" | "glove" | "hammer" | null
  >(null);
  const [movingPlant, setMovingPlant] = useState<Plant | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);
  const [isAutoCollect, setIsAutoCollect] = useState(false);

  const [shopViewingId, setShopViewingId] = useState<string | null>(null);

  // VIEWPORT REFS
  // const viewportRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const gameRef = useRef({
    plants: [] as Plant[],
    zombies: [] as Zombie[],
    projectiles: [] as Projectile[],
    suns: [] as SunToken[],
    coins: [] as CoinDrop[],
    lawnmowers: [] as Lawnmower[],
    particles: [] as Particle[],
    spawnTimer: 0,
    skySunTimer: 0,
    hammerTimer: 0,
    totalZombiesSpawned: 0,
    zombiesToSpawn: 10,
    endlessDifficultyMult: 1,
    currentLevelConfig: LEVEL_CONFIG[1],
  });

  const [, setTick] = useState(0);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserData({
          coins: parsed.coins || 0,
          unlockedPlants: parsed.unlockedPlants || ["PEASHOOTER"],
          plantLevels: parsed.plantLevels || {},
          maxLevelReached: parsed.maxLevelReached || 1,
          currentLevel: parsed.currentLevel || 1,
        });
        setLevel(parsed.currentLevel || 1);
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData, isLoaded]);

  // Viewport Handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    setViewport((prev) => {
      const newScale = Math.min(
        Math.max(0.5, prev.scale - e.deltaY * 0.001),
        2.5
      );
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      // Right Click
      e.preventDefault();
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Game Loop
  const updateGame = useCallback(() => {
    try {
      const state = gameRef.current;
      if (!state) return;

      if (state.hammerTimer > 0)
        state.hammerTimer = Math.max(0, state.hammerTimer - TICK_RATE);

      state.skySunTimer += TICK_RATE;
      const sunInterval = !userData.unlockedPlants.includes("SUNFLOWER")
        ? 5000
        : 10000;
      if (state.skySunTimer > sunInterval) {
        spawnSun(Math.random() * 80 + 5, -10, 25);
        state.skySunTimer = 0;
      }

      state.spawnTimer -= TICK_RATE;
      if (state.spawnTimer <= 0) {
        if (state.totalZombiesSpawned < state.zombiesToSpawn) {
          spawnZombie();
          let interval = 2000;
          if (gameMode === "story") {
            const config = LEVEL_CONFIG[level] || { interval: 3000 };
            const progress = state.totalZombiesSpawned / state.zombiesToSpawn;
            interval = Math.max(1000, config.interval - progress * 2000);
          } else {
            state.endlessDifficultyMult += 0.005;
            interval = Math.max(500, 4000 / state.endlessDifficultyMult);
          }
          state.spawnTimer = interval + Math.random() * 1000;
        }
      }

      if (
        gameMode === "story" &&
        state.totalZombiesSpawned >= state.zombiesToSpawn &&
        state.zombies.length === 0
      ) {
        handleLevelComplete();
        return;
      }

      setWaveProgress(
        gameMode === "story"
          ? (state.totalZombiesSpawned / state.zombiesToSpawn) * 100
          : Math.min(100, (state.totalZombiesSpawned % 50) * 2)
      );

      // ... Plant/Projectile Logic (Collapsed for brevity - unchanged from v24.0) ...
      state.plants.forEach((p) => {
        const db = PLANTS_DB[p.type];
        if (!db) return;
        const plantLevel = userData.plantLevels[p.type] || 1;
        const stats = {
          dmg: calculateStats(db.baseDmg, plantLevel, "dmg"),
          cd: calculateStats(db.actionInterval, plantLevel, "cd"),
        };
        if (db.isMagnet) {
          p.actionTimer += TICK_RATE;
          if (p.actionTimer >= stats.cd) {
            const target = state.zombies.find(
              (z) =>
                z.hasMetal &&
                Math.abs(z.r - p.r) <= 1 &&
                Math.abs(z.c - p.c) <= 2
            );
            if (target) {
              target.hasMetal = false;
              target.hp = Math.min(target.hp, 200);
              createParticle(p.r, p.c, "bg-gray-400", "hit");
              p.actionTimer = 0;
            }
          }
          return;
        }
        if (db.isPassive) return;
        if (db.isInstant || db.isTrap || db.isRowInstant || db.isShortRange) {
          if (db.isRowInstant) {
            p.actionTimer += TICK_RATE;
            if (p.actionTimer >= stats.cd) {
              explodeRow(p.r, stats.dmg);
              p.hp = -1;
            }
            return;
          }
          if (db.isShortRange) {
            const prey = state.zombies.find(
              (z) => z.r === p.r && Math.abs(z.c - p.c) < 1.2
            );
            if (prey) {
              p.actionTimer += TICK_RATE;
              if (p.actionTimer > 500) {
                prey.hp -= stats.dmg;
                createParticle(prey.r, prey.c, "bg-lime-500", "explode");
                p.hp = -1;
              }
            }
            return;
          }
          if (db.isInstant) {
            p.actionTimer += TICK_RATE;
            if (p.actionTimer >= stats.cd) {
              if (db.effect === "global_freeze") {
                state.zombies.forEach((z) => (z.freezeTimer = 10000));
                createParticle(2, 4, "bg-cyan-500", "explode");
              } else {
                explode(p.r, p.c, 1.5, stats.dmg);
              }
              p.hp = -1;
            }
          } else if (db.isTrap) {
            if (p.state !== "armed") {
              p.actionTimer += TICK_RATE;
              if (p.actionTimer >= stats.cd) {
                p.state = "armed";
              }
            } else {
              const prey = state.zombies.find(
                (z) => z.r === p.r && Math.abs(z.c - p.c) < 0.3
              );
              if (prey) {
                explode(p.r, p.c, 0.5, stats.dmg);
                p.hp = -1;
              }
            }
          }
          return;
        }
        if (p.type === "SUNFLOWER" || p.type === "TWINSUN") {
          p.actionTimer += TICK_RATE;
          if (p.actionTimer >= stats.cd) {
            spawnSun(
              p.c * 11 + 2,
              p.r * 20 + 2,
              p.type === "TWINSUN" ? 50 : 25
            );
            p.actionTimer = 0;
          }
        }
        if (db.baseDmg > 0) {
          p.actionTimer += TICK_RATE;
          let hasTarget = false;
          if (db.isStar) hasTarget = state.zombies.length > 0;
          else if (db.isLobbed)
            hasTarget = state.zombies.some((z) => z.r === p.r);
          else hasTarget = state.zombies.some((z) => z.r === p.r && z.c > p.c);
          if (hasTarget && p.actionTimer >= stats.cd) {
            const shots = db.shots || 1;
            if (db.isStar) {
              [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0.5, -0.5],
                [0.5, 0.5],
              ].forEach((dir) => {
                state.projectiles.push({
                  id: Math.random().toString(),
                  r: p.r,
                  x: p.c + 0.5,
                  y: p.r,
                  speedX: dir[0] * 0.3,
                  speedY: dir[1] * 0.3,
                  damage: stats.dmg,
                  effect: db.effect,
                  type: p.type,
                });
              });
            } else if (db.isLobbed) {
              const target = state.zombies
                .filter((z) => z.r === p.r)
                .sort((a, b) => b.c - a.c)[0];
              if (target)
                state.projectiles.push({
                  id: Math.random().toString(),
                  r: p.r,
                  x: p.c + 0.5,
                  speedX: 0.15,
                  speedY: 0,
                  damage: stats.dmg,
                  isLobbed: true,
                  targetR: target.r,
                  targetC: target.c,
                  progress: 0,
                  effect: "aoe",
                  type: p.type,
                });
            } else if (db.isThreepeater) {
              [-1, 0, 1].forEach((offset) => {
                const targetR = p.r + offset;
                if (targetR >= 0 && targetR < GRID_ROWS)
                  state.projectiles.push({
                    id: Math.random().toString(),
                    r: targetR,
                    x: p.c + 0.6,
                    speedX: 0.25,
                    speedY: 0,
                    damage: stats.dmg,
                    effect: db.effect,
                    type: p.type,
                  });
              });
            } else {
              for (let i = 0; i < shots; i++) {
                state.projectiles.push({
                  id: Math.random().toString(),
                  r: p.r,
                  x: p.c + 0.6 + i * 0.2,
                  speedX: 0.25,
                  speedY: 0,
                  damage: stats.dmg,
                  effect: db.effect,
                  type: p.type,
                });
              }
            }
            p.actionTimer = 0;
          }
        }
      });

      state.projectiles = state.projectiles.filter((p) => {
        const torch = state.plants.find(
          (pl) =>
            pl.r === p.r &&
            Math.abs(pl.c - p.x) < 0.5 &&
            pl.type === "TORCHWOOD"
        );
        if (torch && !p.isFire && !p.isLobbed && p.effect !== "slow") {
          p.isFire = true;
          p.damage *= 2;
        }
        if (p.isLobbed) {
          p.progress = (p.progress || 0) + 0.04;
          p.x = p.x + (p.targetC! - p.x) * 0.1;
          if (p.progress >= 1) {
            explode(p.targetR!, p.targetC!, 1.5, p.damage);
            return false;
          }
          return true;
        } else {
          p.x += p.speedX;
          p.y = (p.y || p.r) + p.speedY;
          const hit = state.zombies.find(
            (z) =>
              Math.abs(z.r - (p.y || p.r)) < 0.5 && Math.abs(z.c - p.x) < 0.3
          );
          if (hit) {
            hit.hp -= p.damage;
            if (p.effect === "slow") hit.freezeTimer = 3000;
            createParticle(
              hit.r,
              hit.c,
              p.isFire
                ? "bg-orange-500"
                : p.effect === "slow"
                ? "bg-cyan-300"
                : "bg-green-400",
              "hit"
            );
            return false;
          }
          return p.x < GRID_COLS && p.x > -1;
        }
      });
      state.lawnmowers.forEach((m) => {
        if (m.status === "running") {
          m.x += 0.4;
          state.zombies.forEach((z) => {
            if (z.r === m.r && Math.abs(z.c - m.x) < 0.8) z.hp = -9999;
          });
          if (m.x > GRID_COLS) m.status = "gone";
        }
      });
      state.zombies = state.zombies.filter((z) => {
        z.isEating = false;
        let moveSpeed = z.speed;
        if (z.freezeTimer > 0) {
          z.freezeTimer -= TICK_RATE;
          moveSpeed *= 0.5;
          if (z.freezeTimer > 8000) moveSpeed = 0;
        }
        const mower = state.lawnmowers[z.r];
        if (z.c <= -0.2) {
          if (mower.status === "ready") mower.status = "running";
          else if (mower.status === "gone" && z.c < -0.8)
            setGameState("gameover");
        }
        const eatenPlant = state.plants.find(
          (p) =>
            p.r === z.r &&
            Math.abs(p.c - z.c) < 0.2 &&
            p.hp > 0 &&
            !PLANTS_DB[p.type].isTrap &&
            !PLANTS_DB[p.type].isFloor
        );
        if (eatenPlant) {
          z.isEating = true;
          eatenPlant.hp -= z.damage * (TICK_RATE / 1000);
        } else {
          z.c -= moveSpeed * (TICK_RATE / 1000);
        }
        if (z.hp <= 0) {
          if (Math.random() < 0.3) spawnCoin(z.c, z.r);
          return false;
        }
        return true;
      });
      state.plants = state.plants.filter((p) => p.hp > 0);
      state.particles = state.particles.filter((p) => {
        p.life -= TICK_RATE;
        return p.life > 0;
      });
      [state.suns, state.coins].forEach((list: any[]) => {
        for (let i = list.length - 1; i >= 0; i--) {
          const item = list[i];
          if (isAutoCollect && !item.isCollecting)
            collectItem(
              list === state.suns ? "sun" : "coin",
              item.id,
              item.value
            );
          if (item.isCollecting) {
            const targetX = list === state.suns ? 5 : 15;
            item.left += (targetX - item.left) * 0.2;
            item.top += (5 - item.top) * 0.2;
            if (Math.abs(targetX - item.left) < 2) list.splice(i, 1);
          } else {
            item.timer -= TICK_RATE;
            if (item.top < 85) item.top += 0.3;
            if (item.timer <= 0) list.splice(i, 1);
          }
        }
      });
    } catch (e) {
      console.error("Loop Error", e);
    }
  }, [userData, gameMode, level, isAutoCollect]);

  useEffect(() => {
    let interval: any;
    if (gameState === "playing") {
      interval = setInterval(() => {
        updateGame();
        setTick((t) => t + 1);
      }, TICK_RATE / gameSpeed);
    }
    return () => clearInterval(interval);
  }, [gameState, gameSpeed, updateGame]);

  // Actions (Same as before)
  const initLevel = (lvl: number, mode: "story" | "endless") => {
    const mowers: Lawnmower[] = Array.from({ length: GRID_ROWS }).map(
      (_, i) => ({ r: i, status: "ready", x: -1.2 })
    );
    let config;
    let spawnCount = 10;
    if (mode === "endless") {
      config = null;
      spawnCount = 999999;
    } else {
      config = LEVEL_CONFIG[lvl];
      if (!config) {
        config = {
          total: 25 + lvl * 5,
          types: ["NORMAL", "CONE", "BUCKET", "FLAG", "FOOTBALL"],
          interval: Math.max(800, 3000 - lvl * 100),
          desc: `Đợt tấn công ${lvl}`,
        };
      }
      spawnCount = config.total;
    }
    gameRef.current = {
      plants: [],
      zombies: [],
      projectiles: [],
      suns: [],
      coins: [],
      particles: [],
      lawnmowers: mowers,
      spawnTimer: 3000,
      skySunTimer: 0,
      totalZombiesSpawned: 0,
      hammerTimer: 0,
      zombiesToSpawn: spawnCount,
      endlessDifficultyMult: 1,
      currentLevelConfig: config || { types: ["NORMAL"], interval: 3000 },
    };
    setGameMode(mode);
    setSun(150);
    setWaveProgress(0);
    setGameState("playing");
    setScreen("game");
    setSelectedPlant(null);
    setActiveTool(null);
    setMovingPlant(null);
    setViewport({ scale: 1, x: 0, y: 0 });
    if (mode === "story") {
      setLevel(lvl);
      setUserData((prev) => ({ ...prev, currentLevel: lvl }));
    }
  };
  const nextLevel = () => {
    setLevel((l) => l + 1);
    initLevel(level + 1, "story");
  };
  const handleLevelComplete = () => {
    if (gameMode === "endless") return;
    setGameState("level_transition");
    const nextLevelNum = level + 1;
    const newPlantKey = Object.keys(PLANTS_DB).find(
      (key) => PLANTS_DB[key].unlockLevel === nextLevelNum
    );
    setUserData((prev) => {
      const newData = {
        ...prev,
        maxLevelReached: Math.max(prev.maxLevelReached, nextLevelNum),
        currentLevel: nextLevelNum,
      };
      if (newPlantKey && !prev.unlockedPlants.includes(newPlantKey)) {
        newData.unlockedPlants = [...prev.unlockedPlants, newPlantKey];
      }
      return newData;
    });
    if (newPlantKey && !userData.unlockedPlants.includes(newPlantKey))
      setNewlyUnlocked(newPlantKey);
    else setNewlyUnlocked(null);
  };
  const spawnZombie = () => {
    const row = Math.floor(Math.random() * GRID_ROWS);
    let types = ["NORMAL"];
    if (gameMode === "story") {
      const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
      types = cfg.types;
    } else {
      types = ["NORMAL"];
      if (gameRef.current.totalZombiesSpawned > 10) types.push("CONE");
      if (gameRef.current.totalZombiesSpawned > 30) types.push("BUCKET");
      if (gameRef.current.totalZombiesSpawned > 50) types.push("FOOTBALL");
      if (gameRef.current.totalZombiesSpawned > 80) types.push("FLAG");
      if (gameRef.current.totalZombiesSpawned > 120) types.push("GARGANTUAR");
    }
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const config = ZOMBIE_TYPES[typeKey];
    gameRef.current.zombies.push({
      id: Math.random().toString(),
      r: row,
      c: GRID_COLS + Math.random(),
      type: typeKey,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      damage: config.damage,
      isEating: false,
      color: config.color,
      freezeTimer: 0,
      visualOffset: (Math.random() - 0.5) * 10,
      hasMetal: config.hasMetal,
    });
    gameRef.current.totalZombiesSpawned++;
  };
  const explode = (r: number, c: number, radius: number, dmg: number) => {
    gameRef.current.zombies.forEach((z) => {
      if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= radius) z.hp -= dmg;
    });
    createParticle(r, c, "bg-red-500", "explode");
  };
  const explodeRow = (r: number, dmg: number) => {
    gameRef.current.zombies.forEach((z) => {
      if (z.r === r) z.hp -= dmg;
    });
    for (let i = 0; i < GRID_COLS; i++)
      setTimeout(
        () => createParticle(r, i, "bg-orange-500", "explode"),
        i * 50
      );
  };
  const spawnSun = (left: number, top: number, value: number) => {
    gameRef.current.suns.push({
      id: Math.random().toString(),
      left,
      top,
      value,
      timer: 10000,
      isCollecting: false,
    });
  };
  const spawnCoin = (c: number, r: number) => {
    gameRef.current.coins.push({
      id: Math.random().toString(),
      left: c * 11 + 2,
      top: r * 20 + 2,
      value: 10,
      timer: 8000,
      isCollecting: false,
    });
  };
  const createParticle = (
    r: number,
    c: number,
    color: string,
    type: "hit" | "explode" | "sun" | "coin" = "hit"
  ) => {
    gameRef.current.particles.push({
      id: Math.random().toString(),
      r,
      c,
      color,
      life: type === "explode" ? 800 : 300,
      type,
    });
  };
  const collectItem = (type: "sun" | "coin", id: string, value: number) => {
    const list = type === "sun" ? gameRef.current.suns : gameRef.current.coins;
    const item = list.find((i) => i.id === id);
    if (item && !item.isCollecting) {
      item.isCollecting = true;
      if (type === "sun") setSun((s) => s + value);
      else setUserData((u) => ({ ...u, coins: u.coins + value }));
    }
  };
  const handleGridClick = (r: number, c: number) => {
    if (gameState !== "playing") return;
    if (activeTool === "hammer") {
      const zombiesInCell = gameRef.current.zombies.filter(
        (z) => z.r === r && Math.abs(z.c - c) < 0.8
      );
      if (zombiesInCell.length > 0) {
        zombiesInCell.forEach((z) => {
          z.hp = -9999;
          createParticle(z.r, z.c, "bg-yellow-500", "explode");
        });
        gameRef.current.hammerTimer = HAMMER_COOLDOWN;
        setActiveTool(null);
      }
      return;
    }
    if (activeTool === "glove") {
      if (movingPlant) {
        const occupied = gameRef.current.plants.some(
          (p) => p.r === r && p.c === c
        );
        if (!occupied) {
          movingPlant.r = r;
          movingPlant.c = c;
          gameRef.current.plants.push(movingPlant);
          setMovingPlant(null);
          setActiveTool(null);
        }
      } else {
        const idx = gameRef.current.plants.findIndex(
          (p) => p.r === r && p.c === c
        );
        if (idx !== -1) {
          setMovingPlant(gameRef.current.plants[idx]);
          gameRef.current.plants.splice(idx, 1);
        }
      }
      return;
    }
    if (activeTool === "shovel") {
      const idx = gameRef.current.plants.findIndex(
        (p) => p.r === r && p.c === c
      );
      if (idx !== -1) {
        gameRef.current.plants.splice(idx, 1);
        setSun((s) => s + 25);
        createParticle(r, c, "bg-stone-300", "hit");
        setActiveTool(null);
      }
      return;
    }
    if (selectedPlant) {
      const config = PLANTS_DB[selectedPlant];
      const occupied = gameRef.current.plants.some(
        (p) =>
          p.r === r &&
          p.c === c &&
          !config.isFloor &&
          !PLANTS_DB[p.type].isFloor
      );
      if (!occupied && sun >= config.cost) {
        setSun((s) => s - config.cost);
        const plantLevel = userData.plantLevels[selectedPlant] || 1;
        const stats = {
          hp: calculateStats(config.baseHp, plantLevel, "hp"),
          cd: calculateStats(config.actionInterval, plantLevel, "cd"),
        };
        gameRef.current.plants.push({
          id: Math.random().toString(),
          r,
          c,
          type: selectedPlant,
          hp: stats.hp,
          maxHp: stats.hp,
          actionTimer: 0,
        });
        createParticle(r, c, "bg-green-600", "sun");
        if (selectedPlant !== "SPIKEWEED") setSelectedPlant(null);
      }
    }
  };
  const buyUpgrade = (plantId: string) => {
    const currentLvl = userData.plantLevels[plantId] || 1;
    const cost = currentLvl * 100;
    if (userData.coins >= cost) {
      setUserData((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        plantLevels: { ...prev.plantLevels, [plantId]: currentLvl + 1 },
      }));
    }
  };
  const renderHPBar = (
    current: number,
    max: number,
    color: string = "bg-green-500"
  ) => (
    <div className="absolute -top-3 left-0 w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-black/20 z-50 pointer-events-none">
      {" "}
      <div
        className={`h-full ${color} transition-all duration-200`}
        style={{ width: `${Math.max(0, (current / max) * 100)}%` }}
      ></div>{" "}
    </div>
  );

  // --- SCREENS ---
  if (screen === "menu") {
    return (
      <div className="h-full bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-30"></div>
        <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <Flower2
            size={120}
            className="text-green-500 mx-auto animate-bounce drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]"
          />
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 drop-shadow-xl">
              GARDEN DEFENSE
            </h1>
            <p className="text-xl text-slate-400 font-light tracking-widest mt-2">
              ULTIMATE EDITION
            </p>
          </div>
          <div className="flex flex-col gap-4 w-72 mx-auto">
            <button
              onClick={() => initLevel(userData.currentLevel || 1, "story")}
              className="bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <Play fill="currentColor" />{" "}
              {userData.currentLevel > 1
                ? `TIẾP TỤC LV.${userData.currentLevel}`
                : "BẮT ĐẦU"}
            </button>
            <button
              onClick={() => initLevel(99, "endless")}
              className="bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <Infinity /> VÔ TẬN
            </button>
            <button
              onClick={() => {
                setScreen("shop");
                setShopViewingId(null);
              }}
              className="bg-amber-600 hover:bg-amber-500 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <Coins /> CỬA HÀNG
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "shop") {
    const plants = userData.unlockedPlants.map((id) => PLANTS_DB[id]);
    const viewingId = shopViewingId || plants[0]?.id;
    const currentPlant = PLANTS_DB[viewingId];
    const currentLvl = userData.plantLevels[viewingId] || 1;
    const upgradeCost = currentLvl * 100;
    const stats = {
      hp: calculateStats(currentPlant.baseHp, currentLvl, "hp"),
      dmg: calculateStats(currentPlant.baseDmg, currentLvl, "dmg"),
      cd: calculateStats(currentPlant.actionInterval, currentLvl, "cd"),
    };
    const nextStats = {
      hp: calculateStats(currentPlant.baseHp, currentLvl + 1, "hp"),
      dmg: calculateStats(currentPlant.baseDmg, currentLvl + 1, "dmg"),
      cd: calculateStats(currentPlant.actionInterval, currentLvl + 1, "cd"),
    };

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col md:flex-row overflow-hidden font-sans">
        <div className="w-full md:w-1/3 bg-slate-950 border-r border-slate-800 flex flex-col h-full z-10">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <button
              onClick={() => setScreen("menu")}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2 bg-slate-900 px-4 py-1 rounded-full border border-yellow-600">
              <Coins className="text-yellow-400" size={18} />{" "}
              <span className="font-bold text-yellow-300 text-lg">
                {userData.coins}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
              {plants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setShopViewingId(p.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    viewingId === p.id
                      ? "bg-green-900/60 border-2 border-green-500 shadow-lg"
                      : "bg-slate-900 border border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <div className={`p-2 rounded-full ${p.color} shrink-0`}>
                    <p.icon size={24} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-green-400 font-mono">
                      Lv.{userData.plantLevels[p.id] || 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className={`absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md md:static md:bg-transparent md:w-2/3 flex flex-col items-center justify-center p-6 transition-all duration-300 ${
            shopViewingId ? "flex" : "hidden md:flex"
          }`}
        >
          <button
            onClick={() => setShopViewingId(null)}
            className="absolute top-4 left-4 md:hidden p-2 bg-slate-800 rounded-full text-white"
          >
            <ArrowLeft />
          </button>
          <div className="bg-slate-800/90 p-8 rounded-3xl border border-slate-700 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center gap-6 mb-6">
              <div
                className={`p-6 rounded-2xl ${currentPlant.color} shadow-lg scale-110`}
              >
                <currentPlant.icon size={48} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">
                  {currentPlant.name}
                </h2>
                <p className="text-slate-400 mt-1 italic text-sm">
                  "{currentPlant.lore}"
                </p>
              </div>
            </div>
            <div className="space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mb-6">
              {currentPlant.baseDmg > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                    <Sword size={16} className="text-red-400" /> SÁT THƯƠNG
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xl">
                      {stats.dmg}
                    </span>
                    <ArrowRight size={16} className="text-slate-600" />
                    <span className="font-mono font-bold text-xl text-green-400">
                      {nextStats.dmg}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                  <Heart size={16} className="text-green-400" /> MÁU
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xl">
                    {stats.hp}
                  </span>
                  <ArrowRight size={16} className="text-slate-600" />
                  <span className="font-mono font-bold text-xl text-green-400">
                    {nextStats.hp}
                  </span>
                </div>
              </div>
              {currentPlant.actionInterval > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                    <Clock size={16} className="text-blue-400" /> HỒI CHIÊU
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xl">
                      {(stats.cd / 1000).toFixed(1)}s
                    </span>
                    <ArrowRight size={16} className="text-slate-600" />
                    <span className="font-mono font-bold text-xl text-green-400">
                      {(nextStats.cd / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => buyUpgrade(viewingId)}
              disabled={userData.coins < upgradeCost}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                userData.coins >= upgradeCost
                  ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/50 active:scale-95"
                  : "bg-slate-700 opacity-50 cursor-not-allowed"
              }`}
            >
              <Sprout /> NÂNG CẤP{" "}
              <span className="bg-black/30 px-3 py-1 rounded text-yellow-400 font-mono text-sm">
                {upgradeCost}G
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-[#1a3c18] text-white select-none overflow-hidden relative font-sans"
      style={{
        backgroundImage: `url("https://www.transparenttextures.com/patterns/dark-wood.png")`,
      }}
    >
      {/* 1. TOP BAR */}
      <div className="h-18 bg-[#3d2b1f] border-b-4 border-[#2a1d15] flex items-center justify-between px-4 z-50 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        {/* ... (Giữ nguyên Top Bar) ... */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="bg-[#5c4030] pl-10 pr-4 py-1.5 rounded-r-full border-2 border-[#8b6b57] shadow-inner relative -ml-4 flex flex-col justify-center min-w-[100px]">
              <span className="text-xl font-black text-yellow-300 leading-none">
                {sun}
              </span>
              <span className="text-[10px] text-yellow-600/80 font-bold leading-none">
                SUN
              </span>
            </div>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 bg-yellow-400 p-1.5 rounded-full border-4 border-[#5c4030] shadow-lg">
              <Sun
                className="text-yellow-100 fill-yellow-200 animate-spin-slow"
                size={24}
              />
            </div>
          </div>
          <div className="flex gap-1 bg-[#2a1d15] p-1 rounded-lg border border-[#5c4030]">
            <button
              onClick={() => {
                setActiveTool(activeTool === "shovel" ? null : "shovel");
                setSelectedPlant(null);
              }}
              className={`p-2 rounded-md transition-all ${
                activeTool === "shovel"
                  ? "bg-red-500/20 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-[#8b6b57] hover:bg-white/5"
              }`}
              title="Xẻng (Đào cây)"
            >
              <Shovel size={20} />
            </button>
            <button
              onClick={() => {
                setActiveTool(activeTool === "glove" ? null : "glove");
                setSelectedPlant(null);
              }}
              className={`p-2 rounded-md transition-all ${
                activeTool === "glove" || movingPlant
                  ? "bg-blue-500/20 text-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]"
                  : "text-[#8b6b57] hover:bg-white/5"
              }`}
              title="Găng tay (Di chuyển cây)"
            >
              <Forward size={20} className="rotate-[-45deg]" />
            </button>
            <button
              onClick={() => {
                setActiveTool(activeTool === "hammer" ? null : "hammer");
                setSelectedPlant(null);
              }}
              className={`p-2 rounded-md transition-all relative overflow-hidden ${
                activeTool === "hammer"
                  ? "bg-yellow-500/20 text-yellow-400 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]"
                  : "text-[#8b6b57] hover:bg-white/5"
              } ${
                gameRef.current.hammerTimer > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Búa (Đập Zombie)"
            >
              <Hammer size={20} />
              {gameRef.current.hammerTimer > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                  {Math.ceil(gameRef.current.hammerTimer / 1000)}s
                </div>
              )}
            </button>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="flex justify-between text-[10px] text-[#ccb4a1] mb-1 font-bold uppercase">
            <span>
              {gameMode === "endless"
                ? `Wave ${gameRef.current.totalZombiesSpawned}`
                : `Level ${level}`}
            </span>
            <span>{Math.round(waveProgress)}%</span>
          </div>
          <div className="h-3 bg-[#2a1d15] rounded-full overflow-hidden border border-[#5c4030] shadow-inner relative">
            <div
              className="absolute right-0 top-0 h-full w-full bg-gradient-to-r from-green-700 to-lime-500 origin-right transition-transform duration-500"
              style={{ transform: `scaleX(${1 - waveProgress / 100})` }}
            ></div>
            <div className="absolute top-0 right-0 bottom-0 w-px bg-white/20"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen("menu")}
            className="bg-[#5c4030] p-2 rounded-lg border border-[#75523f] text-[#ccb4a1] hover:text-white font-bold text-xs"
          >
            MENU
          </button>
          <button
            onClick={() => setIsAutoCollect(!isAutoCollect)}
            className={`flex items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all border ${
              isAutoCollect
                ? "bg-yellow-600/40 border-yellow-500 text-yellow-300"
                : "bg-[#5c4030] border-[#75523f] text-[#ccb4a1]"
            }`}
          >
            <Coins size={14} /> <span className="hidden sm:inline">Auto</span>
          </button>
          <button
            onClick={() => setGameSpeed((s) => (s === 1 ? 2 : 1))}
            className={`p-2 rounded-lg border transition-all ${
              gameSpeed === 2
                ? "bg-blue-600/40 border-blue-500 text-blue-300"
                : "bg-[#5c4030] border-[#75523f] text-[#ccb4a1]"
            }`}
          >
            <FastForward size={16} />
          </button>
          <button
            onClick={() =>
              setGameState(gameState === "paused" ? "playing" : "paused")
            }
            className="bg-[#387d32] hover:bg-[#45963d] p-2 rounded-lg border-b-4 border-[#1e451b] active:border-b-0 active:translate-y-1 transition-all"
          >
            {gameState === "paused" ? (
              <Play size={20} fill="currentColor" />
            ) : (
              <Pause size={20} fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      {/* 2. GAME VIEWPORT (ZOOMABLE) */}
      <div
        className="flex-1 relative bg-[#2a5a27] overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-24 right-4 z-40 flex flex-col gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
          <button
            onClick={() =>
              setViewport((v) => ({
                ...v,
                scale: Math.min(v.scale + 0.2, 2.5),
              }))
            }
            className="p-2 bg-slate-700/80 rounded hover:bg-slate-600"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
            className="p-2 bg-slate-700/80 rounded hover:bg-slate-600 text-xs font-bold"
          >
            1:1
          </button>
        </div>

        <div
          className="w-full h-full flex items-center justify-center transform-gpu transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          }}
        >
          <div className="relative w-full max-w-5xl aspect-[9/5] bg-[#3a7c34] rounded-xl overflow-hidden shadow-2xl border-[8px] border-[#224a20] shrink-0">
            <div className="absolute inset-0 grid grid-rows-5 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-full h-full border-b border-black/10 ${
                    i % 2 === 0 ? "bg-[#438e3c]/80" : "bg-[#4caf50]/80"
                  }`}
                ></div>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-stone-900/40 border-r-4 border-black/20 z-0"></div>

            {/* GRID */}
            <div className="absolute inset-0 left-[8%] grid grid-rows-5 grid-cols-9 z-10">
              {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
                const r = Math.floor(i / GRID_COLS);
                const c = i % GRID_COLS;
                return (
                  <div
                    key={i}
                    onClick={() => handleGridClick(r, c)}
                    className={`w-full h-full border-r border-black/5 transition-all duration-150 relative ${
                      selectedPlant &&
                      !gameRef.current.plants.some(
                        (p) =>
                          p.r === r &&
                          p.c === c &&
                          !PLANTS_DB[selectedPlant].isFloor
                      )
                        ? "hover:bg-white/20 hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]"
                        : ""
                    } ${
                      (isShovelActive ||
                        (activeTool === "glove" && !movingPlant)) &&
                      gameRef.current.plants.some((p) => p.r === r && p.c === c)
                        ? "hover:bg-red-500/30 cursor-pointer"
                        : ""
                    } ${
                      activeTool === "glove" && movingPlant
                        ? "hover:bg-blue-500/30 cursor-pointer"
                        : ""
                    } ${
                      activeTool === "hammer" &&
                      gameRef.current.zombies.some(
                        (z) => z.r === r && Math.abs(z.c - c) < 0.8
                      )
                        ? "hover:bg-yellow-500/30 cursor-crosshair"
                        : ""
                    }`}
                  >
                    {selectedPlant &&
                      !gameRef.current.plants.some(
                        (p) => p.r === r && p.c === c
                      ) && (
                        <div className="absolute inset-2 border-2 border-white/50 rounded-lg border-dashed opacity-0 hover:opacity-100"></div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* ENTITIES */}
            <div className="absolute inset-0 pointer-events-none left-[8%]">
              {gameRef.current.lawnmowers.map(
                (m, i) =>
                  m.status !== "gone" && (
                    <div
                      key={`mower-${i}`}
                      className="absolute w-[10%] h-[16%] flex items-center justify-center z-20 transition-transform duration-100 ease-linear"
                      style={{
                        top: `${i * 20 + 2}%`,
                        left: `${m.x * 11.1 - 10}%`,
                      }}
                    >
                      <Tractor
                        size={32}
                        className="text-red-500 drop-shadow-xl"
                      />
                    </div>
                  )
              )}
              {gameRef.current.plants.map((p) => {
                const Config = PLANTS_DB[p.type];
                return (
                  <div
                    key={p.id}
                    className="absolute w-[11.11%] h-[20%] flex items-center justify-center z-20 animate-in zoom-in duration-300"
                    style={{ top: `${p.r * 20}%`, left: `${p.c * 11.11}%` }}
                  >
                    <div className="relative w-[75%] h-[85%] group">
                      <div
                        className={`w-full h-full rounded-2xl shadow-xl flex items-center justify-center ${Config.color} border-2 relative transform group-hover:-translate-y-1 transition-transform`}
                      >
                        {p.type === "POTATOMINE" && p.state === "unarmed" ? (
                          <Config.icon
                            size={20}
                            className="text-white/50 animate-pulse"
                          />
                        ) : (
                          <Config.icon
                            size={30}
                            className={`text-white drop-shadow-md ${
                              ["SUNFLOWER", "TWINSUN"].includes(p.type)
                                ? "animate-spin-slow"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                      {p.hp < p.maxHp &&
                        !Config.isTrap &&
                        !Config.isFloor &&
                        renderHPBar(p.hp, p.maxHp)}
                    </div>
                  </div>
                );
              })}
              {gameRef.current.zombies.map((z) => (
                <div
                  key={z.id}
                  className="absolute w-[11.11%] h-[20%] flex items-center justify-center z-30 transition-transform duration-100 linear"
                  style={{ top: `${z.r * 20}%`, left: `${z.c * 11.11}%` }}
                >
                  <div className="relative w-[65%] h-[90%]">
                    <div
                      className={`w-full h-full rounded-xl border-2 border-black/40 flex flex-col items-center justify-center shadow-xl relative ${
                        z.color
                      } ${z.isEating ? "animate-bounce" : ""} ${
                        z.freezeTimer > 0
                          ? "saturate-50 brightness-125 border-cyan-400 shadow-[0_0_10px_cyan]"
                          : ""
                      }`}
                    >
                      {z.type === "CONE" && (
                        <div className="absolute -top-4 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-orange-500 drop-shadow-md"></div>
                      )}
                      {z.type === "BUCKET" && (
                        <div className="absolute -top-3 z-10 w-8 h-6 bg-zinc-400 rounded-t-lg border border-black/30 drop-shadow-md"></div>
                      )}
                      {z.type === "FOOTBALL" && (
                        <div className="absolute -top-2 z-10 w-10 h-8 bg-red-700 rounded-lg border-2 border-white/50 shadow-md transform -skew-x-12"></div>
                      )}
                      {z.type === "FLAG" && (
                        <div className="absolute -right-3 -top-4 text-2xl animate-pulse filter drop-shadow">
                          🚩
                        </div>
                      )}
                      <Skull
                        size={26}
                        className="text-white/90 drop-shadow-md"
                      />
                    </div>
                    {renderHPBar(z.hp, z.maxHp, "bg-red-500")}
                  </div>
                </div>
              ))}
              {gameRef.current.projectiles.map((p) => (
                <div
                  key={p.id}
                  className={`absolute w-[2.5%] aspect-square rounded-full shadow-lg z-20 flex items-center justify-center border border-white/20 ${
                    p.isFire
                      ? "bg-orange-500 shadow-[0_0_15px_orange] animate-pulse"
                      : p.effect === "slow"
                      ? "bg-cyan-300 shadow-[0_0_10px_cyan]"
                      : p.type === "JALAPENO"
                      ? "hidden"
                      : "bg-green-400 shadow-[0_0_10px_#4ade80]"
                  }`}
                  style={{ top: `${p.r * 20 + 8}%`, left: `${p.x * 11.11}%` }}
                />
              ))}
              {gameRef.current.particles.map((p) => (
                <div
                  key={p.id}
                  className={`absolute rounded-full ${p.color} ${
                    p.type === "explode" ? "animate-ping" : "animate-pulse"
                  } z-40`}
                  style={{
                    top: `${p.r * 20}%`,
                    left: `${p.c * 11.11}%`,
                    width: p.type === "explode" ? "30%" : "11.11%",
                    height: p.type === "explode" ? "50%" : "20%",
                    transform:
                      p.type === "explode" ? "translate(-30%, -30%)" : "none",
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 z-50 pointer-events-none">
              {[...gameRef.current.suns, ...gameRef.current.coins].map(
                (item: any) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      collectItem(
                        item.value === 10 ? "coin" : "sun",
                        item.id,
                        item.value
                      )
                    }
                    className={`absolute w-[6%] aspect-square rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 transition-transform animate-in fade-in zoom-in duration-500 border-2 ${
                      item.value === 10
                        ? "bg-yellow-600 border-yellow-400 shadow-xl"
                        : "bg-yellow-400 border-white/50 shadow-[0_0_30px_#facc15]"
                    }`}
                    style={{ top: `${item.top}%`, left: `${item.left}%` }}
                  >
                    {item.value === 10 ? (
                      <Coins size={20} className="text-yellow-200" />
                    ) : (
                      <Sun
                        size={24}
                        className="text-yellow-100 drop-shadow-sm animate-spin-slow"
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DOCK (ABSOLUTE BOTTOM) */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#3d2b1f]/95 backdrop-blur border-t-4 border-[#2a1d15] p-2 z-50 flex justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex gap-3 items-center overflow-x-auto px-4 w-full justify-start md:justify-center custom-scrollbar z-10 pb-2">
          {Object.entries(PLANTS_DB).map(([key, plant]) => {
            const isUnlocked = userData.unlockedPlants.includes(key);
            const canAfford = sun >= plant.cost;
            return (
              <button
                key={key}
                onClick={() => {
                  if (isUnlocked) {
                    setSelectedPlant(selectedPlant === key ? null : key);
                    setIsShovelActive(false);
                    setActiveTool(null);
                  }
                }}
                disabled={!isUnlocked}
                className={`relative flex flex-col items-center justify-center w-18 h-22 rounded-xl border-2 transition-all shrink-0 group ${
                  !isUnlocked
                    ? "bg-[#2a1d15] border-[#3d2b1f] opacity-50 grayscale"
                    : selectedPlant === key
                    ? "border-yellow-400 bg-green-900/40 -translate-y-2 shadow-lg"
                    : "border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500"
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10">
                    <Lock size={20} className="text-slate-500" />
                  </div>
                )}
                <div
                  className={`p-2 rounded-full mb-1 ${plant.color} group-hover:scale-110 transition-transform`}
                >
                  <plant.icon className="text-white" size={20} />
                </div>
                <span
                  className={`text-[10px] font-black font-mono mt-0.5 ${
                    !canAfford ? "text-red-400" : "text-yellow-400"
                  }`}
                >
                  {plant.cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- OVERLAYS --- */}
      {gameState === "idle" && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#3d2b1f] p-8 rounded-3xl border-4 border-[#75523f] text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-overlay"></div>
            <Flower2
              size={80}
              className="text-green-500 mx-auto mb-4 animate-bounce drop-shadow-[0_5px_0_#1e451b]"
            />
            <h1 className="text-5xl font-black text-yellow-400 mb-2 drop-shadow-md tracking-tight">
              GARDEN DEFENSE
            </h1>
            <p className="text-[#ccb4a1] mb-8 font-medium uppercase tracking-widest">
              Ultimate Edition v26.0
            </p>
            <button
              onClick={() => initLevel(userData.currentLevel || 1, "story")}
              className="bg-[#387d32] hover:bg-[#45963d] text-white px-10 py-4 rounded-2xl font-bold text-xl border-b-8 border-[#1e451b] transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-2 flex items-center gap-3 mx-auto relative z-10"
            >
              <Play size={28} fill="currentColor" />{" "}
              {userData.currentLevel > 1
                ? `TIẾP TỤC LEVEL ${userData.currentLevel}`
                : "BẮT ĐẦU"}
            </button>
          </div>
        </div>
      )}
      {gameState === "level_transition" && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-green-900/80 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="text-center p-10 bg-[#3d2b1f] border-4 border-yellow-500 rounded-[2rem] shadow-2xl max-w-md mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-overlay"></div>
            <div className="relative z-10">
              <Trophy
                size={80}
                className="mx-auto text-yellow-400 mb-6 animate-bounce drop-shadow-[0_5px_0_#854d0e]"
              />
              <h2 className="text-4xl font-black text-yellow-400 mb-2 drop-shadow-md">
                CHIẾN THẮNG!
              </h2>
              <p className="text-[#ccb4a1] mb-6">Khu vườn đã được an toàn.</p>
              {newlyUnlocked ? (
                <div className="bg-black/30 p-6 rounded-2xl border-2 border-green-500/50 mb-8 flex flex-col items-center shadow-inner">
                  <p className="text-xs text-green-400 uppercase font-bold mb-3 tracking-widest">
                    Mở Khóa Vũ Khí Mới
                  </p>
                  {(() => {
                    const Plant = PLANTS_DB[newlyUnlocked];
                    return (
                      <div className="flex flex-col items-center animate-in spin-in-3 duration-1000">
                        <div
                          className={`p-5 rounded-full ${Plant.color} mb-3 shadow-lg scale-110 border-4 border-white/20`}
                        >
                          <Plant.icon size={48} className="text-white" />
                        </div>
                        <span className="font-bold text-xl text-yellow-300 mb-1">
                          {Plant.name}
                        </span>
                        <span className="text-xs text-[#ccb4a1]">
                          {Plant.desc}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-6"></div>
              )}
              <button
                onClick={nextLevel}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-xl border-b-4 border-blue-800 flex items-center justify-center gap-3 transition-all active:border-b-0 active:translate-y-1"
              >
                MÀN TIẾP THEO <Forward size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="text-center p-8 bg-[#2a1d15] border-4 border-red-900 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay"></div>
            <Skull
              size={120}
              className="mx-auto text-red-600 mb-6 animate-pulse drop-shadow-[0_5px_0_#450a0a] relative z-10"
            />
            <h2 className="text-7xl font-black text-red-600 mb-4 drop-shadow-lg font-mono tracking-tighter relative z-10">
              GAME OVER
            </h2>
            <p className="text-[#ccb4a1] mb-10 text-xl relative z-10">
              Zombie đã vào nhà và ăn não của bạn!
            </p>
            <button
              onClick={() => initLevel(level, gameMode)}
              className="bg-[#5c4030] hover:bg-[#6b4b3a] text-white px-10 py-4 rounded-xl font-black text-xl border-b-8 border-[#2a1d15] transition-all active:border-b-0 active:translate-y-2 relative z-10"
            >
              THỬ LẠI
            </button>
          </div>
        </div>
      )}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#3d2b1f] p-8 rounded-3xl border-4 border-[#75523f] text-center shadow-2xl relative overflow-hidden min-w-[320px]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-overlay"></div>

            <h2 className="text-4xl font-black text-[#e3d4c1] mb-6 relative z-10 drop-shadow-md">
              TẠM DỪNG
            </h2>

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={() => setGameState("playing")}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 border-b-4 border-green-800"
              >
                <Play size={20} fill="currentColor" /> TIẾP TỤC
              </button>

              <button
                onClick={() => initLevel(level, gameMode)}
                className="bg-[#5c4030] hover:bg-[#6b4b3a] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 border-b-4 border-[#2a1d15]"
              >
                <RotateCcw size={20} /> CHƠI LẠI
              </button>

              <button
                onClick={() => {
                  setScreen("menu");
                  setGameState("idle");
                }}
                className="bg-red-900/50 hover:bg-red-800/80 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 border-2 border-red-900/30"
              >
                <Home size={20} /> THOÁT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
