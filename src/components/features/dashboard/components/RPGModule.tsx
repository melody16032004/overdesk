import { useState, useEffect } from "react";
import {
  Swords,
  Shield,
  Zap,
  Skull,
  Coins,
  Heart,
  ShoppingBag,
  Users,
  UserPlus,
  Flame,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRightCircle,
  LogOut,
  Info,
  RefreshCw,
  X,
  Shirt,
  Briefcase,
  Activity,
  Package,
  Crown,
  PlusCircle,
} from "lucide-react";

// --- 1. CONFIG & TYPES ---

type EffectType =
  | "lifesteal"
  | "crit"
  | "stun"
  | "heal"
  | "aoe_boost"
  | "thorn"
  | "mp_regen"
  | "none";
type SkillType = "dmg" | "heal" | "buff" | "aoe" | "dot";
type TurnPhase = "player" | "enemy" | "victory" | "defeat";
type Rarity = "common" | "rare" | "epic" | "legendary";
type JobName =
  | "Warrior"
  | "Knight"
  | "Paladin"
  | "Mage"
  | "Rogue"
  | "Ranger"
  | "Cleric"
  | "Bard"
  | "Druid"
  | "Berserker"
  | "Assassin"
  | "Elementalist"
  | "Warlock"
  | "Summoner";

const RARITY_COLORS: Record<Rarity, string> = {
  common: "border-slate-600 text-slate-300 bg-slate-800/50",
  rare: "border-blue-500 text-blue-400 bg-blue-900/20",
  epic: "border-purple-500 text-purple-400 bg-purple-900/20",
  legendary:
    "border-amber-500 text-amber-400 bg-amber-900/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
};

// const RARITY_BG: Record<Rarity, string> = {
//   common: "bg-slate-700",
//   rare: "bg-blue-900",
//   epic: "bg-purple-900",
//   legendary: "bg-amber-700",
// };

const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2.0,
};

interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
}

interface Skill {
  name: string;
  type: SkillType;
  power: number;
  cost: number;
  desc: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  stats: Partial<Stats>;
  effect: EffectType;
  jobs?: JobName[];
  rarity: Rarity;
  desc: string;
  type: "weapon" | "armor" | "acc";
}

interface Character {
  id: string;
  name: string;
  job: JobName;
  rarity: Rarity;
  level: number;
  exp: number;
  maxExp: number;
  stats: Stats;
  baseStats: Stats;
  skill: Skill;
  equipment: Item[];
  isDead: boolean;
  hasActed: boolean;
  buffs: { type: string; turns: number; val: number }[];
}

interface Enemy {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  expReward: number;
  goldReward: number;
  isBoss?: boolean;
}

// --- DATABASE ---
const JOBS: Record<JobName, { name: string; role: string; skill: Skill }> = {
  Warrior: {
    name: "Chiến Binh",
    role: "Tank/DPS",
    skill: {
      name: "Chém Xoáy",
      type: "dmg",
      power: 1.5,
      cost: 15,
      desc: "150% sát thương vật lý",
    },
  },
  Knight: {
    name: "Hiệp Sĩ",
    role: "Tank",
    skill: {
      name: "Khiên Thánh",
      type: "buff",
      power: 0.5,
      cost: 25,
      desc: "Giảm 50% ST nhận vào (2 lượt)",
    },
  },
  Paladin: {
    name: "Thánh Kỵ Sĩ",
    role: "Tank/Heal",
    skill: {
      name: "Phán Quyết",
      type: "heal",
      power: 30,
      cost: 30,
      desc: "Hồi 30 HP & Tăng thủ",
    },
  },
  Berserker: {
    name: "Cuồng Chiến",
    role: "DPS",
    skill: {
      name: "Cuồng Nộ",
      type: "dmg",
      power: 2.2,
      cost: 20,
      desc: "220% ST, tự mất 10% HP",
    },
  },
  Assassin: {
    name: "Sát Thủ",
    role: "Burst",
    skill: {
      name: "Đâm Lén",
      type: "dmg",
      power: 3.0,
      cost: 35,
      desc: "300% ST bạo kích",
    },
  },
  Rogue: {
    name: "Đạo Tặc",
    role: "DPS",
    skill: {
      name: "Ám Sát",
      type: "dmg",
      power: 2.6,
      cost: 30,
      desc: "260% ST vật lý",
    },
  },
  Ranger: {
    name: "Xạ Thủ",
    role: "Ranged",
    skill: {
      name: "Mưa Tên",
      type: "aoe",
      power: 0.8,
      cost: 25,
      desc: "80% ST toàn địch",
    },
  },
  Mage: {
    name: "Pháp Sư",
    role: "Magic",
    skill: {
      name: "Cầu Lửa",
      type: "dmg",
      power: 2.5,
      cost: 30,
      desc: "250% ST phép",
    },
  },
  Elementalist: {
    name: "Nguyên Tố Sư",
    role: "AOE",
    skill: {
      name: "Bão Tố",
      type: "aoe",
      power: 1.2,
      cost: 40,
      desc: "120% ST phép toàn địch",
    },
  },
  Warlock: {
    name: "Thuật Sĩ",
    role: "DOT",
    skill: {
      name: "Lời Nguyền",
      type: "dot",
      power: 40,
      cost: 35,
      desc: "Gây 40 ST mỗi lượt (3 lượt)",
    },
  },
  Summoner: {
    name: "Triệu Hồi",
    role: "Summon",
    skill: {
      name: "Gọi Thú",
      type: "buff",
      power: 20,
      cost: 40,
      desc: "Tăng 20 ATK toàn đội",
    },
  },
  Cleric: {
    name: "Mục Sư",
    role: "Healer",
    skill: {
      name: "Thánh Ca",
      type: "heal",
      power: 50,
      cost: 40,
      desc: "Hồi 50 HP toàn đội",
    },
  },
  Bard: {
    name: "Nhạc Sĩ",
    role: "Buff",
    skill: {
      name: "Khúc Ca",
      type: "buff",
      power: 0.2,
      cost: 30,
      desc: "Tăng 20% ST toàn đội",
    },
  },
  Druid: {
    name: "Druid",
    role: "Hybrid",
    skill: {
      name: "Rễ Trói",
      type: "dot",
      power: 30,
      cost: 25,
      desc: "DOT + Giảm tốc",
    },
  },
};

const BASE_STATS = { hp: 100, mp: 50, atk: 15, def: 5, spd: 10 };

const ITEM_TEMPLATES = [
  // Weapons
  {
    name: "Kiếm",
    type: "weapon",
    baseAtk: 12,
    jobs: ["Warrior", "Knight", "Paladin", "Berserker"],
  },
  {
    name: "Dao",
    type: "weapon",
    baseAtk: 10,
    jobs: ["Rogue", "Assassin"],
    effect: "crit",
  },
  {
    name: "Gậy",
    type: "weapon",
    baseAtk: 15,
    baseMp: 30,
    jobs: ["Mage", "Warlock", "Elementalist", "Summoner"],
    effect: "mp_regen",
  },
  {
    name: "Trượng",
    type: "weapon",
    baseAtk: 8,
    baseMp: 40,
    jobs: ["Cleric", "Druid", "Bard"],
    effect: "heal",
  },
  { name: "Cung", type: "weapon", baseAtk: 14, jobs: ["Ranger"] },

  // Armors
  {
    name: "Giáp Sắt",
    type: "armor",
    baseDef: 12,
    baseHp: 60,
    jobs: ["Warrior", "Knight", "Paladin", "Berserker"],
  },
  {
    name: "Giáp Da",
    type: "armor",
    baseDef: 8,
    baseHp: 40,
    baseSpd: 2,
    jobs: ["Rogue", "Assassin", "Ranger"],
  },
  {
    name: "Áo Vải",
    type: "armor",
    baseDef: 5,
    baseMp: 60,
    jobs: [
      "Mage",
      "Warlock",
      "Elementalist",
      "Summoner",
      "Cleric",
      "Druid",
      "Bard",
    ],
  },

  // Accessories
  { name: "Nhẫn Lực", type: "acc", baseAtk: 5, baseHp: 20 },
  { name: "Dây Chuyền", type: "acc", baseDef: 5, baseMp: 20 },
  { name: "Giày", type: "acc", baseSpd: 5 },
];

const MONSTERS = [
  { name: "Slime", hp: 60, atk: 10, exp: 30, gold: 15 },
  { name: "Sói Hoang", hp: 120, atk: 15, exp: 60, gold: 30 },
  { name: "Orc", hp: 250, atk: 25, exp: 120, gold: 60 },
  { name: "Rồng Lửa", hp: 600, atk: 40, exp: 300, gold: 120 },
  { name: "Ma Vương", hp: 2000, atk: 80, exp: 1000, gold: 500 },
];

// --- LOGIC HELPERS ---

const getRandomRarity = (): Rarity => {
  const r = Math.random();
  if (r < 0.6) return "common";
  if (r < 0.85) return "rare";
  if (r < 0.95) return "epic";
  return "legendary";
};

const generateRandomItem = (): Item => {
  const tpl = ITEM_TEMPLATES[Math.floor(Math.random() * ITEM_TEMPLATES.length)];
  const rarity = getRandomRarity();
  const mult = RARITY_MULTIPLIER[rarity];
  return {
    id: crypto.randomUUID(),
    name: `${tpl.name} ${
      rarity === "legendary"
        ? "Thần"
        : rarity === "epic"
        ? "Cổ"
        : rarity === "rare"
        ? "Tinh"
        : "Thường"
    }`,
    price: Math.floor(100 * mult),
    rarity,
    effect: (tpl.effect as EffectType) || "none",
    jobs: tpl.jobs as JobName[],
    desc: rarity.toUpperCase(),
    type: tpl.type as any,
    stats: {
      atk: tpl.baseAtk ? Math.floor(tpl.baseAtk * mult) : 0,
      def: tpl.baseDef ? Math.floor(tpl.baseDef * mult) : 0,
      hp: tpl.baseHp ? Math.floor(tpl.baseHp * mult) : 0,
      mp: tpl.baseMp ? Math.floor(tpl.baseMp * mult) : 0,
      spd: tpl.baseSpd ? Math.floor(tpl.baseSpd * mult) : 0,
    },
  };
};

// CẬP NHẬT: Thêm tham số fixedJob để ép kiểu nhân vật (cho Warrior khởi đầu)
const generateRandomHero = (fixedJob?: JobName): Character => {
  const jobKeys = Object.keys(JOBS) as JobName[];
  const jobName =
    fixedJob || jobKeys[Math.floor(Math.random() * jobKeys.length)];
  const jobInfo = JOBS[jobName];
  const rarity = fixedJob ? "legendary" : getRandomRarity(); // Starter is always common
  const mult = RARITY_MULTIPLIER[rarity];

  const maxHp = Math.floor(BASE_STATS.hp * mult * (Math.random() + 0.5));
  const maxMp = Math.floor(BASE_STATS.mp * mult * (Math.random() + 0.5));

  const stats: Stats = {
    hp: maxHp,
    maxHp: maxHp,
    mp: maxMp,
    maxMp: maxMp,
    atk: Math.floor(BASE_STATS.atk * mult * (Math.random() + 0.5)),
    def: Math.floor(BASE_STATS.def * mult * (Math.random() + 0.5)),
    spd: Math.floor(BASE_STATS.spd * mult),
  };

  return {
    id: crypto.randomUUID(),
    name: jobInfo.name,
    job: jobName,
    rarity,
    level: 1,
    exp: 0,
    maxExp: 100,
    stats: { ...stats },
    baseStats: { ...stats },
    skill: jobInfo.skill,
    equipment: [],
    isDead: false,
    hasActed: false,
    buffs: [],
  };
};

const calculateTotalStats = (hero: Character): Stats => {
  const total = { ...hero.baseStats };
  hero.equipment.forEach((item) => {
    if (item.stats.atk) total.atk += item.stats.atk;
    if (item.stats.def) total.def += item.stats.def;
    if (item.stats.hp) total.maxHp += item.stats.hp;
    if (item.stats.mp) total.maxMp += item.stats.mp;
    if (item.stats.spd) total.spd += item.stats.spd;
  });
  total.hp = Math.min(hero.stats.hp, total.maxHp);
  total.mp = Math.min(hero.stats.mp, total.maxMp);
  return total;
};

const calculateDamage = (
  attacker: Character,
  def: number,
  multiplier: number = 1,
  isCritEffect: boolean = false
) => {
  let isCrit = false;
  if (isCritEffect && Math.random() < 0.35) {
    isCrit = true;
    multiplier *= 1.5;
  }
  attacker.equipment.forEach((item) => {
    if (item.effect === "crit" && Math.random() < 0.2) {
      isCrit = true;
      multiplier *= 1.2;
    }
  });
  const rawDmg = attacker.stats.atk * multiplier - def * 0.5;
  return { damage: Math.max(1, Math.floor(rawDmg)), isCrit };
};

const getLevelExp = (lvl: number) => lvl * 200;

// --- MAIN COMPONENT ---

export const RPGModule = () => {
  const [screen, setScreen] = useState<
    "town" | "battle" | "shop" | "recruit" | "characters" | "inventory"
  >("town");
  const [gold, setGold] = useState(500);
  const [party, setParty] = useState<Character[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [stage, setStage] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  const [shopStock, setShopStock] = useState<Item[]>([]);
  const [recruitStock, setRecruitStock] = useState<Character[]>([]);
  const [selectedHero, setSelectedHero] = useState<Character | null>(null);

  const [viewingItem, setViewingItem] = useState<{
    item: Item;
    mode: "buy" | "sell" | "equip" | "view";
    callback?: () => void;
  } | null>(null);
  const [viewingRecruit, setViewingRecruit] = useState<Character | null>(null);
  const [inspectEntity, setInspectEntity] = useState<Character | Enemy | null>(
    null
  );

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("player");
  const [activeHeroId, setActiveHeroId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("rpg_save_v18");
    if (saved) {
      const data = JSON.parse(saved);
      setGold(data.gold);
      setParty(
        data.party.map((p: any) => ({
          ...p,
          hasActed: false,
          buffs: p.buffs || [],
          equipment: p.equipment || [],
        }))
      );
      setInventory(data.inventory);
      setStage(data.stage);
    } else {
      // CẬP NHẬT: Luôn khởi đầu bằng Warrior
      setParty([generateRandomHero("Warrior")]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const data = { gold, party, inventory, stage };
      localStorage.setItem("rpg_save_v18", JSON.stringify(data));
    }
  }, [gold, party, inventory, stage, isLoaded]);

  useEffect(() => {
    if (shopStock.length === 0) refreshShop(true);
    if (recruitStock.length === 0) refreshRecruit(true);
  }, []);

  const addLog = (msg: string) => setLogs((p) => [msg, ...p].slice(0, 8));

  // --- ACTIONS ---

  const refreshShop = (free: boolean = false) => {
    if (!free) {
      if (gold < 5) {
        addLog("Thiếu 5G!");
        return;
      }
      setGold((g) => g - 5);
    }
    setShopStock(Array.from({ length: 5 }, generateRandomItem));
  };

  const refreshRecruit = (free: boolean = false) => {
    if (!free) {
      if (gold < 5) {
        addLog("Thiếu 5G!");
        return;
      }
      setGold((g) => g - 5);
    }
    setRecruitStock(Array.from({ length: 6 }, () => generateRandomHero()));
  };

  const buyItem = (item: Item) => {
    if (gold >= item.price) {
      setGold((g) => g - item.price);
      setInventory((inv) => [...inv, item]);
      setShopStock((prev) => prev.filter((i) => i.id !== item.id));
      addLog(`Đã mua ${item.name}`);
      setViewingItem(null);
    } else addLog("Không đủ tiền!");
  };

  const recruitHero = (hero: Character) => {
    const cost = Math.floor(200 * RARITY_MULTIPLIER[hero.rarity]);
    if (gold >= cost) {
      setGold((g) => g - cost);
      const newHero = {
        ...hero,
        stats: { ...hero.stats, hp: hero.stats.maxHp, mp: hero.stats.maxMp },
      };
      setParty((p) => [...p, newHero]);
      setRecruitStock((prev) => prev.filter((h) => h.id !== hero.id));
      setViewingRecruit(null);
      addLog(`Đã chiêu mộ ${hero.name}`);
    } else addLog(`Cần ${cost}G!`);
  };

  const sellInventoryItem = (item: Item, index: number) => {
    const sellPrice = Math.floor(item.price * 0.5);
    setGold((g) => g + sellPrice);
    setInventory((prev) => prev.filter((_, i) => i !== index));
    addLog(`Đã bán ${item.name} nhận ${sellPrice}G`);
    setViewingItem(null);
  };

  const equipItem = (hero: Character, item: Item) => {
    if (hero.equipment.length >= 6) {
      addLog("Túi đồ nhân vật đã đầy (6/6)!");
      return;
    }

    const newParty = party.map((p) => {
      if (p.id === hero.id) {
        const newEquip = [...p.equipment, item];
        const updated = { ...p, equipment: newEquip };
        const newStats = calculateTotalStats(updated);
        return { ...updated, stats: newStats };
      }
      return p;
    });
    setParty(newParty);
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedHero(newParty.find((p) => p.id === hero.id) || null);
    setViewingItem(null);
    addLog("Đã trang bị!");
  };

  const unequipItem = (hero: Character, itemIndex: number) => {
    const item = hero.equipment[itemIndex];
    const newParty = party.map((p) => {
      if (p.id === hero.id) {
        const newEquip = p.equipment.filter((_, i) => i !== itemIndex);
        const updated = { ...p, equipment: newEquip };
        const newStats = calculateTotalStats(updated);
        return { ...updated, stats: newStats };
      }
      return p;
    });
    setParty(newParty);
    setInventory((prev) => [...prev, item]);
    setSelectedHero(newParty.find((p) => p.id === hero.id) || null);
    addLog("Đã tháo trang bị!");
  };

  const sellHero = (hero: Character) => {
    const refund = Math.floor(100 * RARITY_MULTIPLIER[hero.rarity]);
    setGold((g) => g + refund);
    setParty((p) => p.filter((h) => h.id !== hero.id));
    setSelectedHero(null);
    addLog(`Đã sa thải ${hero.name}`);
  };

  const returnToTown = () => {
    setScreen("town");
    setParty((prev) =>
      prev.map((p) => ({
        ...p,
        isDead: false,
        hasActed: false,
        buffs: [],
        stats: { ...p.stats, hp: p.stats.maxHp, mp: p.stats.maxMp },
      }))
    );
    addLog("Về thành. Đội hình đã hồi phục!");
  };

  // --- BATTLE LOGIC ---

  const startBattle = () => {
    const newParty = party.map((p) => ({
      ...p,
      isDead: false,
      hasActed: false,
      buffs: [],
      stats: { ...p.stats, hp: p.stats.maxHp, mp: p.stats.maxMp },
    }));
    setParty(newParty);

    const isBossLevel = stage % 5 === 0;
    const baseMobIndex = Math.min(
      Math.floor((stage - 1) / 5),
      MONSTERS.length - 1
    );
    const template = MONSTERS[baseMobIndex];
    const scale = 1 + stage * 0.1;

    const enemy: Enemy = {
      id: "e1",
      name: `${isBossLevel ? "Thủ Lĩnh " : ""}${template.name} (Lv.${stage})`,
      level: stage,
      expReward: Math.floor(template.exp * scale * (isBossLevel ? 2 : 1)),
      goldReward: Math.floor(template.gold * scale * (isBossLevel ? 2 : 1)),
      isBoss: isBossLevel,
      stats: {
        hp: Math.floor(template.hp * scale * (isBossLevel ? 1.5 : 1)),
        maxHp: Math.floor(template.hp * scale * (isBossLevel ? 1.5 : 1)),
        atk: Math.floor(template.atk * scale * (isBossLevel ? 1.2 : 1)),
        def: Math.floor(stage * 1.0),
        spd: 10,
        mp: 0,
        maxMp: 0,
      },
    };

    setEnemies([enemy]);
    setScreen("battle");
    setTurnPhase("player");
    setLogs([`Đụng độ ${enemy.name}!`, `Lượt của bạn.`]);
    setActiveHeroId(newParty[0].id);
  };

  const handleHeroAction = (useSkill: boolean) => {
    if (turnPhase !== "player" || !activeHeroId) return;
    const heroIndex = party.findIndex((p) => p.id === activeHeroId);
    const hero = party[heroIndex];
    let target = enemies[0];
    if (!hero || hero.isDead || hero.hasActed) {
      addLog("Không thể hành động!");
      return;
    }

    let atkMultiplier = 1;
    hero.buffs.forEach((b) => {
      if (b.type === "atk_up") atkMultiplier += 0.2;
    });

    let dmg = 0;
    let logMsg = "";

    if (useSkill) {
      if (hero.stats.mp >= hero.skill.cost) {
        hero.stats.mp -= hero.skill.cost;
        const skill = hero.skill;

        if (skill.type === "heal") {
          const heal = skill.power;
          const isAoeHeal = hero.job === "Cleric";
          setParty((prev) =>
            prev.map((p) => {
              if (!p.isDead && (isAoeHeal || p.id === hero.id))
                return {
                  ...p,
                  stats: {
                    ...p.stats,
                    hp: Math.min(p.stats.maxHp, p.stats.hp + heal),
                  },
                };
              return p;
            })
          );
          logMsg = `${hero.name} ${
            isAoeHeal ? "hồi máu toàn đội" : "tự hồi phục"
          }.`;
        } else if (skill.type === "buff") {
          const isAoeBuff = ["Bard", "Summoner"].includes(hero.job);
          setParty((prev) =>
            prev.map((p) => {
              if (!p.isDead && (isAoeBuff || p.id === hero.id))
                return {
                  ...p,
                  buffs: [
                    ...p.buffs,
                    { type: "atk_up", turns: 3, val: skill.power },
                  ],
                };
              return p;
            })
          );
          logMsg = `${hero.name} buff sức mạnh!`;
        } else if (skill.type === "aoe") {
          const res = calculateDamage(
            hero,
            target.stats.def,
            skill.power * atkMultiplier
          );
          dmg = res.damage;
          logMsg = `${hero.name} dùng ${skill.name} (AOE): ${dmg} st!`;
        } else if (skill.type === "dot") {
          dmg = 10 + skill.power;
          logMsg = `${hero.name} ếm bùa chú!`;
        } else {
          const isBerserk = hero.job === "Berserker";
          if (isBerserk)
            hero.stats.hp = Math.max(
              1,
              hero.stats.hp - Math.floor(hero.stats.maxHp * 0.1)
            );
          const res = calculateDamage(
            hero,
            target.stats.def,
            skill.power * atkMultiplier
          );
          dmg = res.damage;
          logMsg = `${hero.name} tung ${skill.name}: ${dmg} st!`;
        }
      } else {
        addLog("Thiếu Mana!");
        return;
      }
    } else {
      const res = calculateDamage(hero, target.stats.def, 1 * atkMultiplier);
      dmg = res.damage;
      logMsg = `${hero.name} tấn công: ${dmg} st.`;
      if (res.isCrit) logMsg += " (BẠO KÍCH!)";

      let lifestealAmt = 0;
      hero.equipment.forEach((i) => {
        if (i.effect === "lifesteal") lifestealAmt += 0.2;
      });
      if (lifestealAmt > 0) {
        const heal = Math.floor(dmg * lifestealAmt);
        hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + heal);
        logMsg += ` (+${heal} HP)`;
      }
    }

    if (dmg > 0) target.stats.hp = Math.max(0, target.stats.hp - dmg);
    hero.hasActed = true;
    addLog(logMsg);
    setParty([...party]);

    if (target.stats.hp <= 0) {
      handleEndBattle(target, true);
      return;
    }

    if (party.every((p) => p.isDead || p.hasActed)) {
      setTurnPhase("enemy");
      setActiveHeroId(null);
    } else {
      const nextHero = party.find((p) => !p.isDead && !p.hasActed);
      if (nextHero) setActiveHeroId(nextHero.id);
    }
  };

  useEffect(() => {
    if (turnPhase === "enemy") {
      const timer = setTimeout(() => {
        enemyAction();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turnPhase]);

  const enemyAction = () => {
    const target = enemies[0];
    const livingHeroes = party.filter((p) => !p.isDead);

    if (target.stats.hp > 0 && livingHeroes.length > 0) {
      const isBossAoe = target.isBoss && Math.random() < 0.3;

      if (isBossAoe) {
        addLog(`>> ${target.name} dùng TUYỆT CHIÊU diện rộng!`);
        livingHeroes.forEach((victim) => {
          const rawDmg = target.stats.atk * 0.7 - victim.stats.def * 0.5;
          const dmg = Math.max(1, Math.floor(rawDmg));
          victim.stats.hp = Math.max(0, victim.stats.hp - dmg);
          if (victim.stats.hp === 0) victim.isDead = true;
        });
      } else {
        const tankHeroes = livingHeroes.filter((h) =>
          ["Warrior", "Knight", "Paladin"].includes(h.job)
        );
        const victim =
          tankHeroes.length > 0
            ? tankHeroes[Math.floor(Math.random() * tankHeroes.length)]
            : livingHeroes[Math.floor(Math.random() * livingHeroes.length)];
        const rawDmg = target.stats.atk - victim.stats.def * 0.5;
        const damage = Math.max(1, Math.floor(rawDmg));

        victim.stats.hp = Math.max(0, victim.stats.hp - damage);
        addLog(`>> ${target.name} đánh ${victim.name}: -${damage} HP`);
        if (victim.stats.hp === 0) {
          victim.isDead = true;
          addLog(`>> ${victim.name} gục ngã!`);
        }
      }
    }

    const resetParty = party.map((p) => {
      const newBuffs = p.buffs
        .map((b) => ({ ...b, turns: b.turns - 1 }))
        .filter((b) => b.turns > 0);
      return { ...p, hasActed: false, buffs: newBuffs };
    });
    setParty(resetParty);

    if (resetParty.every((p) => p.isDead)) {
      handleEndBattle(target, false);
    } else {
      setTurnPhase("player");
      const firstHero = resetParty.find((p) => !p.isDead);
      if (firstHero) setActiveHeroId(firstHero.id);
    }
  };

  const handleEndBattle = (target: Enemy, isWin: boolean) => {
    if (isWin) {
      setTurnPhase("victory");
      setGold((g) => g + target.goldReward);
      setStage((s) => s + 1);
      addLog(`CHIẾN THẮNG! +${target.goldReward}G`);
    } else {
      setTurnPhase("defeat");
      addLog("THẤT BẠI!");
    }
    const expGain = isWin
      ? target.expReward
      : Math.floor(target.expReward * 0.2);
    const newParty = party.map((h) => {
      let { exp, level, maxExp, stats, baseStats } = h;
      exp += expGain;
      let msg = "";
      if (exp >= maxExp) {
        exp -= maxExp;
        level++;
        maxExp = getLevelExp(level);
        baseStats.maxHp += 20;
        baseStats.hp = baseStats.maxHp;
        baseStats.maxMp += 10;
        baseStats.mp = baseStats.maxMp;
        baseStats.atk += 5;
        stats = { ...calculateTotalStats({ ...h, baseStats }) };
        msg = `${h.name} lên cấp ${level}!`;
      }
      if (msg) addLog(msg);
      return { ...h, exp, level, maxExp, stats, baseStats };
    });
    setParty(newParty);
    if (!isWin) addLog(`Nhận an ủi: +${expGain} Exp`);
  };

  const surrender = () => {
    if (turnPhase !== "player") return;
    handleEndBattle(enemies[0], false);
    addLog("Đã rút lui!");
  };

  // --- UI COMPONENTS ---

  const ItemDetailModal = () => {
    if (!viewingItem) return null;
    const { item, mode, callback } = viewingItem;
    const btnText =
      mode === "buy"
        ? `Mua (${item.price}G)`
        : mode === "sell"
        ? `Bán (${Math.floor(item.price * 0.5)}G)`
        : "Trang bị";
    const btnColor =
      mode === "buy"
        ? "bg-emerald-600"
        : mode === "sell"
        ? "bg-red-600"
        : "bg-blue-600";

    return (
      <div
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={() => setViewingItem(null)}
      >
        <div
          className={`bg-slate-900 border w-full max-w-sm rounded-xl p-5 shadow-2xl relative ${
            RARITY_COLORS[item.rarity]
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setViewingItem(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto bg-slate-800 rounded-xl flex items-center justify-center mb-2 border border-slate-600">
              {item.type === "weapon" ? (
                <Swords size={32} />
              ) : item.type === "armor" ? (
                <Shield size={32} />
              ) : (
                <Star size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <p className="text-xs uppercase tracking-widest opacity-80">
              {item.rarity} {item.type}
            </p>
          </div>
          <div className="space-y-3 mb-6 bg-slate-950/50 p-3 rounded-lg">
            <div className="text-xs flex justify-between border-b border-slate-700 pb-1">
              <span>ATK</span>{" "}
              <span className="text-emerald-400">+{item.stats.atk || 0}</span>
            </div>
            <div className="text-xs flex justify-between border-b border-slate-700 pb-1">
              <span>DEF</span>{" "}
              <span className="text-blue-400">+{item.stats.def || 0}</span>
            </div>
            <div className="text-xs flex justify-between border-b border-slate-700 pb-1">
              <span>HP/MP</span>{" "}
              <span className="text-yellow-400">
                +{item.stats.hp || 0} / +{item.stats.mp || 0}
              </span>
            </div>
            <div className="text-xs pt-1">
              <span className="text-slate-500">Hiệu ứng:</span>{" "}
              <span className="text-indigo-400">
                {item.effect !== "none" ? item.effect : "Không"}
              </span>
            </div>
            <div className="text-xs pt-1">
              <span className="text-slate-500">Dành cho:</span>{" "}
              <span className="text-slate-300 italic">
                {item.jobs ? item.jobs.join(", ") : "Tất cả"}
              </span>
            </div>
          </div>
          {mode !== "view" && callback && (
            <button
              onClick={callback}
              className={`w-full py-3 rounded-lg font-bold text-white shadow-lg ${btnColor} hover:brightness-110 active:scale-95 transition-all`}
            >
              {btnText}
            </button>
          )}
        </div>
      </div>
    );
  };

  const CharacterDetailModal = ({
    hero,
    onClose,
    isRecruit = false,
  }: {
    hero: Character;
    onClose: () => void;
    isRecruit?: boolean;
  }) => {
    if (!hero) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Thêm flex và max-h để modal không bị tràn màn hình */}
        <div
          className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Giữ nguyên kích thước (shrink-0) */}
          <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4 shrink-0">
            <div className="flex gap-4">
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold border-2 ${
                  RARITY_COLORS[hero.rarity]
                } shadow-lg`}
              >
                {hero.name[0]}
              </div>
              <div>
                <div
                  className={`text-2xl font-bold ${
                    RARITY_COLORS[hero.rarity].split(" ")[1]
                  }`}
                >
                  {hero.name}
                </div>
                <div className="text-slate-500 text-sm">
                  {hero.job} - Lv.{hero.level}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`px-2 py-1 rounded text-xs font-bold border ${
                  RARITY_COLORS[hero.rarity]
                } uppercase inline-block`}
              >
                {hero.rarity}
              </div>
              {!isRecruit && (
                <button
                  onClick={() => {
                    sellHero(hero);
                    onClose();
                  }}
                  className="block mt-2 text-red-500 text-xs hover:underline ml-auto"
                >
                  Sa thải
                </button>
              )}
            </div>
          </div>

          {/* Body - Phần này sẽ co giãn và có scroll nếu cần */}
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Top Section: Stats & Skill - Không cuộn, luôn hiện */}
            <div className="flex gap-4 shrink-0">
              <div className="w-1/2 space-y-4">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                    <Activity size={12} /> Chỉ số
                  </div>
                  <div className="flex justify-between">
                    <span>HP</span>{" "}
                    <span className="text-white font-bold">
                      {hero.stats.maxHp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MP</span>{" "}
                    <span className="text-white font-bold">
                      {hero.stats.maxMp}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>ATK</span>{" "}
                    <span className="font-bold">{hero.stats.atk}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>DEF</span>{" "}
                    <span className="font-bold">{hero.stats.def}</span>
                  </div>
                  <div className="flex justify-between text-yellow-400">
                    <span>SPD</span>{" "}
                    <span className="font-bold">{hero.stats.spd}</span>
                  </div>
                </div>

                <div className="bg-indigo-900/20 p-3 rounded-xl border border-indigo-900/50">
                  <div className="font-bold text-indigo-300 mb-1 uppercase text-xs flex items-center gap-1">
                    <Zap size={12} /> {hero.skill.name}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-relaxed">
                    {hero.skill.desc}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1 font-mono">
                    Cost: {hero.skill.cost} MP
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {!isRecruit ? (
                  <>
                    <div className="font-bold text-slate-400 mb-2 uppercase text-xs flex items-center gap-1">
                      <Shirt size={12} /> Trang bị ({hero.equipment.length}/6)
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {hero.equipment.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => unequipItem(hero, idx)}
                          className={`aspect-square bg-slate-800 border ${
                            RARITY_COLORS[item.rarity].split(" ")[0]
                          } rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 relative group overflow-hidden`}
                        >
                          <div
                            className={`text-[9px] text-center px-1 truncate w-full ${
                              RARITY_COLORS[item.rarity].split(" ")[1]
                            }`}
                          >
                            {item.name}
                          </div>
                          <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center text-[10px] text-red-400 font-bold">
                            GỠ
                          </div>
                        </div>
                      ))}
                      {Array.from({ length: 6 - hero.equipment.length }).map(
                        (_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="aspect-square bg-slate-900/50 border border-slate-400 border-dashed rounded-lg flex items-center justify-center opacity-30"
                          ></div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-full justify-center items-center text-center text-slate-500 text-xs italic p-4 border border-slate-800 border-dashed rounded-xl">
                    <Info size={32} className="mb-2 opacity-50" />
                    Chiêu mộ để mở khóa trang bị
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Inventory List - Phần này sẽ SCROLL */}
            {!isRecruit && (
              <div className="flex-1 bg-slate-950 rounded-xl p-2 border border-slate-800 flex flex-col min-h-0 overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1 shrink-0">
                  <Briefcase size={10} /> Kho đồ
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
                  <div className="grid grid-cols-1 gap-1">
                    {inventory.filter(
                      (i) => !i.jobs || i.jobs.includes(hero.job)
                    ).length === 0 ? (
                      <div className="text-center text-slate-600 text-[10px] py-4">
                        Trống
                      </div>
                    ) : (
                      inventory
                        .filter((i) => !i.jobs || i.jobs.includes(hero.job))
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => equipItem(hero, item)}
                            className={`w-full p-1.5 bg-slate-900 border rounded flex justify-between items-center group hover:bg-slate-800 shrink-0 ${
                              RARITY_COLORS[item.rarity]
                            }`}
                          >
                            <div className="text-left truncate w-24">
                              <div className="font-bold text-[10px] truncate">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              ĐEO
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action - Luôn nằm dưới cùng */}
          <div className="shrink-0 pt-4">
            {isRecruit ? (
              <button
                onClick={() => {
                  recruitHero(hero);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
              >
                <UserPlus size={20} /> CHIÊU MỘ NGAY (
                {Math.floor(200 * RARITY_MULTIPLIER[hero.rarity])}G)
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BattleInspectModal = () => {
    if (!inspectEntity) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setInspectEntity(null)}
      >
        <div
          className="bg-slate-900 border border-slate-600 w-full max-w-xs rounded-xl p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="text-xl font-bold text-white">
              {inspectEntity.name}
            </div>
            <div className="text-sm text-slate-400">
              Lv.{inspectEntity.level}
            </div>
          </div>
          <div className="space-y-2 bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between text-xs">
              <span>HP</span>{" "}
              <span className="text-red-400">
                {inspectEntity.stats.hp}/{inspectEntity.stats.maxHp}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>ATK</span>{" "}
              <span className="text-emerald-400">
                {inspectEntity.stats.atk}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>DEF</span>{" "}
              <span className="text-blue-400">{inspectEntity.stats.def}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>SPD</span>{" "}
              <span className="text-yellow-400">{inspectEntity.stats.spd}</span>
            </div>
          </div>
          <button
            onClick={() => setInspectEntity(null)}
            className="mt-4 w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  };

  // --- RENDER ---

  const renderTown = () => (
    <div className="p-4 space-y-4 pb-20 h-full flex flex-col justify-center">
      <div className="text-center space-y-2 mb-8 animate-in fade-in zoom-in duration-500">
        <div className="inline-block p-3 rounded-full bg-slate-900 border border-slate-700 shadow-xl mb-2">
          <Crown size={32} className="text-amber-400" />
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
          ETERNITY
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">
          Legendary RPG
        </p>
      </div>

      <button
        onClick={() => setScreen("characters")}
        className="w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl flex items-center justify-between px-6 group transition-all shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-sm">QUẢN LÝ NHÂN VẬT</div>
            <div className="text-[10px] text-slate-500">
              {party.length} Anh hùng
            </div>
          </div>
        </div>
        <ArrowRightCircle
          size={20}
          className="text-slate-600 group-hover:text-white transition-colors"
        />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={startBattle}
          className="col-span-2 py-5 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 active:scale-95 transition-transform border border-red-500/30"
        >
          <Swords size={20} /> VÀO HẦM NGỤC{" "}
          <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">
            Ải {stage}
          </span>
        </button>
        <button
          onClick={() => setScreen("shop")}
          className="py-4 bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-slate-300 font-bold hover:bg-slate-800 border border-slate-800"
        >
          <ShoppingBag size={20} className="text-emerald-400" /> Cửa Hàng
        </button>
        <button
          onClick={() => setScreen("recruit")}
          className="py-4 bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-slate-300 font-bold hover:bg-slate-800 border border-slate-800"
        >
          <UserPlus size={20} className="text-blue-400" /> Chiêu Mộ
        </button>
        <button
          onClick={() => setScreen("inventory")}
          className="col-span-2 py-4 bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-slate-300 font-bold hover:bg-slate-800 border border-slate-800"
        >
          <Package size={20} className="text-amber-400" /> Túi Đồ
        </button>
      </div>
    </div>
  );

  const renderCharactersList = () => (
    <div className="h-full p-4 flex flex-col bg-slate-950">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setScreen("town")}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowRightCircle className="rotate-180" size={20} />
        </button>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Danh sách nhân vật
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar flex-1 pb-4 content-start">
        {party.map((hero) => (
          <div
            key={hero.id}
            onClick={() => setSelectedHero(hero)}
            className={`relative p-2 rounded-xl border flex flex-col items-center cursor-pointer hover:brightness-110 transition-all active:scale-95 ${
              RARITY_COLORS[hero.rarity]
            } ${
              hero.rarity === "legendary" ? "bg-amber-900/10" : "bg-slate-900"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border mb-2 shadow-inner ${
                RARITY_COLORS[hero.rarity]
              }`}
            >
              <span className="font-black text-sm">{hero.name[0]}</span>
            </div>

            {/* Info */}
            <div className="text-center w-full mb-2">
              <div
                className={`font-bold text-[10px] truncate w-full leading-tight ${
                  RARITY_COLORS[hero.rarity].split(" ")[1]
                }`}
              >
                {hero.name}
              </div>
              <div className="text-[8px] text-slate-500 font-mono">
                Lv.{hero.level} {hero.job}
              </div>
            </div>

            {/* Mini Stats Grid (New Feature) */}
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 w-full bg-black/20 p-1.5 rounded-lg">
              <div className="flex items-center gap-0.5">
                <Heart size={8} className="text-red-500" />
                <span className="text-[8px] text-slate-300 font-mono">
                  {hero.stats.maxHp}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Swords size={8} className="text-emerald-500" />
                <span className="text-[8px] text-slate-300 font-mono">
                  {hero.stats.atk}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Shield size={8} className="text-blue-500" />
                <span className="text-[8px] text-slate-300 font-mono">
                  {hero.stats.def}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Activity size={8} className="text-yellow-500" />
                <span className="text-[8px] text-slate-300 font-mono">
                  {hero.stats.spd}
                </span>
              </div>
            </div>

            {/* Equipment Dots */}
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    i < hero.equipment.length
                      ? "bg-current opacity-80"
                      : "bg-slate-800"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        ))}

        {/* Add Slot Placeholder (Optional visual) */}
        <button
          onClick={() => setScreen("recruit")}
          className="border border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-4 opacity-50 hover:opacity-100 hover:bg-slate-900 transition-all"
        >
          <PlusCircle size={24} className="text-slate-600" />
          <span className="text-[9px] text-slate-500 font-bold uppercase">
            Tuyển thêm
          </span>
        </button>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="h-full p-4 flex flex-col bg-slate-950">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen("town")}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowRightCircle className="rotate-180" size={20} />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package size={18} /> Túi Đồ
          </h2>
        </div>
        <div className="text-xs text-yellow-400 font-bold flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
          <Coins size={12} /> {gold}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {inventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs gap-3">
            <Package size={48} strokeWidth={1} className="opacity-20" />
            <span>Túi đồ trống rỗng</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 content-start">
            {inventory.map((item, i) => (
              <div
                key={i}
                onClick={() =>
                  setViewingItem({
                    item,
                    mode: "sell",
                    callback: () => sellInventoryItem(item, i),
                  })
                }
                className={`p-3 bg-slate-900 border rounded-xl flex flex-col justify-between cursor-pointer hover:brightness-110 active:scale-95 transition-all ${
                  RARITY_COLORS[item.rarity]
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div
                      className={`font-bold text-xs truncate flex-1 ${
                        RARITY_COLORS[item.rarity].split(" ")[1]
                      }`}
                    >
                      {item.name}
                    </div>
                    {item.type === "weapon" && (
                      <Swords size={10} className="text-slate-500" />
                    )}
                    {item.type === "armor" && (
                      <Shield size={10} className="text-slate-500" />
                    )}
                    {item.type === "acc" && (
                      <Star size={10} className="text-slate-500" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 mb-2 line-clamp-1">
                    {item.desc}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.stats.atk ? (
                      <span className="text-[8px] bg-slate-950/50 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-900/30">
                        ATK+{item.stats.atk}
                      </span>
                    ) : null}
                    {item.stats.def ? (
                      <span className="text-[8px] bg-slate-950/50 px-1.5 py-0.5 rounded text-blue-400 border border-blue-900/30">
                        DEF+{item.stats.def}
                      </span>
                    ) : null}
                    {item.stats.hp ? (
                      <span className="text-[8px] bg-slate-950/50 px-1.5 py-0.5 rounded text-red-400 border border-red-900/30">
                        HP+{item.stats.hp}
                      </span>
                    ) : null}
                    {item.stats.mp ? (
                      <span className="text-[8px] bg-slate-950/50 px-1.5 py-0.5 rounded text-blue-400 border border-blue-900/30">
                        MP+{item.stats.mp}
                      </span>
                    ) : null}
                    {item.stats.spd ? (
                      <span className="text-[8px] bg-slate-950/50 px-1.5 py-0.5 rounded text-yellow-400 border border-yellow-900/30">
                        SPD+{item.stats.spd}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden select-none">
      <CharacterDetailModal
        hero={selectedHero!}
        onClose={() => setSelectedHero(null)}
        isRecruit={false}
      />
      <CharacterDetailModal
        hero={viewingRecruit!}
        onClose={() => setViewingRecruit(null)}
        isRecruit={true}
      />
      <ItemDetailModal />
      <BattleInspectModal />

      {/* HEADER (Only show in Town & Battle) */}
      <div className="flex-none h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">
              Eternity
            </h3>
            <span className="text-[9px] text-slate-500 font-bold">
              AUTO-SAVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
          <Coins size={12} /> {gold}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {screen === "town" && renderTown()}
        {screen === "characters" && renderCharactersList()}
        {screen === "inventory" && renderInventory()}

        {screen === "battle" && (
          <div className="h-full flex flex-col">
            <div className="h-10 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-800">
              <div className="w-8"></div>
              <div className="flex items-center justify-center">
                {turnPhase === "player" && (
                  <div className="text-emerald-400 font-bold text-xs flex items-center gap-2 animate-pulse">
                    <Swords size={14} /> LƯỢT CỦA BẠN
                  </div>
                )}
                {turnPhase === "enemy" && (
                  <div className="text-red-500 font-bold text-xs flex items-center gap-2 animate-pulse">
                    <Hourglass size={14} /> LƯỢT QUÁI VẬT
                  </div>
                )}
                {turnPhase === "victory" && (
                  <div className="text-yellow-400 font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} /> CHIẾN THẮNG
                  </div>
                )}
                {turnPhase === "defeat" && (
                  <div className="text-gray-400 font-bold text-xs flex items-center gap-2">
                    <AlertCircle size={14} /> THẤT BẠI
                  </div>
                )}
              </div>
              <div className="w-8 flex justify-end">
                {turnPhase === "player" && (
                  <button
                    onClick={surrender}
                    className="text-slate-500 hover:text-red-500 transition-colors p-1"
                    title="Thoát trận"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6">
              {enemies.map((e) => (
                <div
                  key={e.id}
                  className="text-center w-full max-w-xs animate-in zoom-in duration-300 cursor-pointer"
                  onDoubleClick={() => setInspectEntity(e)}
                >
                  <div
                    className={`relative mx-auto w-28 h-28 mb-4 transition-transform duration-300 ${
                      turnPhase === "enemy" ? "scale-110" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl animate-pulse"></div>
                    <div
                      className={`relative bg-slate-900 border-4 ${
                        e.isBoss
                          ? "border-amber-500 shadow-amber-900/50"
                          : "border-red-900"
                      } rounded-full w-full h-full flex items-center justify-center shadow-2xl`}
                    >
                      <Skull
                        size={56}
                        className={e.isBoss ? "text-amber-500" : "text-red-500"}
                      />
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      e.isBoss ? "text-amber-400" : "text-red-100"
                    }`}
                  >
                    {e.name}
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full mt-2 border border-slate-700 overflow-hidden relative">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (e.stats.hp / e.stats.maxHp) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {e.stats.hp}/{e.stats.maxHp} HP
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border-t border-slate-800 p-2">
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x px-1">
                {party.map((hero) => {
                  const isSelected = hero.id === activeHeroId;
                  const canAct =
                    !hero.isDead && !hero.hasActed && turnPhase === "player";
                  return (
                    <div
                      key={hero.id}
                      onClick={() => canAct && setActiveHeroId(hero.id)}
                      onDoubleClick={() => setInspectEntity(hero)}
                      className={`flex-shrink-0 w-28 sm:w-32 md:flex-1 md:min-w-[120px] md:max-w-[200px] p-2 rounded-lg border-2 transition-all cursor-pointer select-none relative snap-start ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : canAct
                          ? "border-slate-600 bg-slate-800 hover:border-slate-500"
                          : "border-slate-800 bg-slate-900 opacity-60"
                      }`}
                    >
                      {hero.hasActed && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10">
                          <CheckCircle2 size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="text-[10px] font-bold truncate mb-1 text-white flex items-center justify-between">
                        <span>{hero.name}</span>
                        {isSelected && (
                          <ArrowRightCircle
                            size={10}
                            className="text-emerald-400"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (hero.stats.hp / hero.stats.maxHp) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (hero.stats.mp / hero.stats.maxMp) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-20 bg-black p-2 overflow-y-auto font-mono text-[10px] text-slate-400 border-t border-slate-800">
              {logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-2">
              {turnPhase === "player" ? (
                activeHeroId ? (
                  <>
                    <button
                      onClick={() => handleHeroAction(false)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                    >
                      <Swords size={18} />
                      <span className="text-[10px]">TẤN CÔNG</span>
                    </button>
                    {(() => {
                      const h = party.find((p) => p.id === activeHeroId);
                      if (!h) return null;
                      const canSkill = h.stats.mp >= h.skill.cost;
                      return (
                        <button
                          onClick={() => handleHeroAction(true)}
                          disabled={!canSkill}
                          className={`py-3 text-white font-bold rounded-lg flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform ${
                            canSkill
                              ? "bg-indigo-700 hover:bg-indigo-600 shadow-indigo-500/20"
                              : "bg-slate-800 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <Zap size={18} />
                          <span className="text-[10px]">
                            {h.skill.name} ({h.skill.cost} MP)
                          </span>
                        </button>
                      );
                    })()}
                  </>
                ) : (
                  <div className="col-span-2 text-center text-xs text-slate-500 py-3 italic">
                    Hãy chọn tướng để ra lệnh...
                  </div>
                )
              ) : turnPhase === "victory" || turnPhase === "defeat" ? (
                <button
                  onClick={returnToTown}
                  className="col-span-2 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg"
                >
                  Quay Về Thành (Hồi Phục)
                </button>
              ) : (
                <button
                  disabled
                  className="col-span-2 py-3 bg-slate-800 text-slate-500 font-bold rounded-lg cursor-not-allowed"
                >
                  Đang chờ lượt địch...
                </button>
              )}
            </div>
          </div>
        )}

        {screen === "recruit" && (
          <div className="h-full p-4 flex flex-col bg-slate-950">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("town")}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ArrowRightCircle className="rotate-180" size={20} />
                </button>
                <h2 className="text-lg font-bold text-white">Chiêu Mộ</h2>
              </div>
              <button
                onClick={() => refreshRecruit()}
                className="flex items-center gap-1 text-[10px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300"
              >
                <RefreshCw size={12} /> Làm mới (5G)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 content-start">
              {recruitStock.map((hero, i) => (
                <div
                  key={i}
                  onClick={() => setViewingRecruit(hero)}
                  className={`p-3 bg-slate-900 border rounded-xl flex flex-col justify-between cursor-pointer hover:bg-slate-800 ${
                    RARITY_COLORS[hero.rarity].split(" ")[0]
                  }`}
                >
                  <div>
                    <div
                      className={`font-bold text-xs mb-1 flex justify-between ${
                        RARITY_COLORS[hero.rarity].split(" ")[1]
                      }`}
                    >
                      {hero.name}{" "}
                      <span className="text-[9px] uppercase opacity-70">
                        {hero.rarity}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {hero.job} - {hero.skill.name}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[9px] font-mono text-slate-500">
                      <div>HP: {hero.stats.maxHp}</div>
                      <div>ATK: {hero.stats.atk}</div>
                    </div>
                  </div>
                  <div className="mt-2 w-full py-1.5 bg-slate-950 text-slate-400 rounded text-[10px] font-bold border border-slate-800 flex items-center justify-center gap-1">
                    <Coins size={10} />{" "}
                    {Math.floor(200 * RARITY_MULTIPLIER[hero.rarity])} G
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === "shop" && (
          <div className="h-full p-4 flex flex-col bg-slate-950">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("town")}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ArrowRightCircle className="rotate-180" size={20} />
                </button>
                <h2 className="text-lg font-bold text-white">Cửa Hàng</h2>
              </div>
              <button
                onClick={() => refreshShop()}
                className="flex items-center gap-1 text-[10px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300"
              >
                <RefreshCw size={12} /> Làm mới (5G)
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {shopStock.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setViewingItem({
                      item,
                      mode: "buy",
                      callback: () => buyItem(item),
                    })
                  }
                  className={`bg-slate-900 p-3 rounded-xl border flex justify-between items-center cursor-pointer hover:brightness-110 ${
                    RARITY_COLORS[item.rarity].split(" ")[0]
                  }`}
                >
                  <div>
                    <div
                      className={`font-bold text-sm ${
                        RARITY_COLORS[item.rarity].split(" ")[1]
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.desc}
                    </div>
                    {item.jobs && (
                      <div className="text-[9px] text-slate-600 mt-1 italic">
                        Chỉ dành cho: {item.jobs.slice(0, 2).join(", ")}...
                      </div>
                    )}
                  </div>
                  <button className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-bold text-yellow-400 flex items-center gap-1">
                    <Coins size={10} /> {item.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
