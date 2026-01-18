import { useState, useEffect, useRef } from "react";
import {
  ArrowRightLeft,
  Coins,
  Ruler,
  Weight,
  FlaskConical,
  ChevronDown,
  Copy,
  Check,
  History,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// --- CONFIG ---
type Category = "currency" | "length" | "weight" | "volume";

const CATEGORIES = [
  {
    id: "currency",
    label: "Currency",
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  {
    id: "length",
    label: "Length",
    icon: Ruler,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
  },
  {
    id: "weight",
    label: "Weight",
    icon: Weight,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10 border-fuchsia-400/20",
  },
  {
    id: "volume",
    label: "Volume",
    icon: FlaskConical,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
];

const RATES: Record<string, Record<string, number>> = {
  currency: {
    USD: 1,
    VND: 25450,
    EUR: 0.92,
    JPY: 155.5,
    GBP: 0.79,
    KRW: 1380,
    BTC: 0.000015,
  }, // BTC giả lập
  length: {
    m: 1,
    km: 0.001,
    cm: 100,
    mm: 1000,
    inch: 39.3701,
    ft: 3.28084,
    mile: 0.000621371,
    yd: 1.09361,
  },
  weight: {
    g: 1,
    kg: 0.001,
    mg: 1000,
    oz: 0.035274,
    lb: 0.00220462,
    ton: 0.000001,
  },
  volume: {
    ml: 1,
    l: 0.001,
    "fl oz": 0.033814,
    gal: 0.000264172,
    cup: 0.00416667,
    pint: 0.00211338,
  },
};

const UNIT_NAMES: Record<string, string> = {
  USD: "US Dollar",
  VND: "Vietnam Dong",
  EUR: "Euro",
  JPY: "Yen",
  GBP: "Pound",
  KRW: "Won",
  BTC: "Bitcoin",
  m: "Meters",
  km: "Kilometers",
  cm: "Centimeters",
  mm: "Millimeters",
  inch: "Inches",
  ft: "Feet",
  mile: "Miles",
  yd: "Yards",
  g: "Grams",
  kg: "Kilograms",
  mg: "Milligrams",
  oz: "Ounces",
  lb: "Pounds",
  ton: "Tonnes",
  ml: "Milliliters",
  l: "Liters",
  "fl oz": "Fluid Oz",
  gal: "Gallons",
  cup: "Cups",
  pint: "Pints",
};

// --- COMPONENT ---
export const ConverterModule = () => {
  const [activeTab, setActiveTab] = useState<Category>("currency");
  const [amount, setAmount] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("USD");
  const [toUnit, setToUnit] = useState<string>("VND");
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Smart History: Lưu 3 kết quả gần nhất
  const [history, setHistory] = useState<
    { from: string; to: string; val: string; res: string }[]
  >([]);

  // Animation Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Init Defaults
  useEffect(() => {
    const keys = Object.keys(RATES[activeTab]);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  }, [activeTab]);

  // Calculation Logic
  useEffect(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || !fromUnit || !toUnit) {
      setResult("---");
      return;
    }

    const rates = RATES[activeTab];
    const baseValue = val / rates[fromUnit];
    const finalValue = baseValue * rates[toUnit];

    // Format thông minh: Số nhỏ thì nhiều số thập phân, số lớn thì ít
    const formatted = finalValue.toLocaleString("en-US", {
      maximumFractionDigits: finalValue < 0.01 ? 8 : 2,
      minimumFractionDigits: 0,
    });

    setResult(formatted);

    // Debounce save history (chỉ lưu sau 1s không gõ phím)
    const timeout = setTimeout(() => {
      if (val > 0) {
        setHistory((prev) => {
          const newItem = {
            from: fromUnit,
            to: toUnit,
            val: amount,
            res: formatted,
          };
          // Tránh trùng lặp item đầu tiên
          if (
            prev[0]?.val === newItem.val &&
            prev[0]?.from === newItem.from &&
            prev[0]?.to === newItem.to
          )
            return prev;
          return [newItem, ...prev].slice(0, 3);
        });
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [amount, fromUnit, toUnit, activeTab]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const handleCopy = () => {
    if (result === "---") return;
    navigator.clipboard.writeText(result.replace(/,/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden text-slate-800 dark:text-slate-100"
    >
      {/* Dynamic Background Glow */}
      <div
        className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 transition-colors duration-700 ${CATEGORIES.find(
          (c) => c.id === activeTab
        )?.color.replace("text-", "bg-")}`}
      ></div>
      <div
        className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-10 transition-colors duration-700 ${CATEGORIES.find(
          (c) => c.id === activeTab
        )?.color.replace("text-", "bg-")}`}
      ></div>

      {/* HEADER & TABS */}
      <div className="flex-none p-4 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" /> Converter
          </h2>
          {activeTab === "currency" && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-200 dark:bg-white/5 px-2 py-1 rounded-full">
              <TrendingUp size={12} /> Live Rates
            </div>
          )}
        </div>

        {/* Scrollable Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as Category)}
                className={`snap-start flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 border ${
                  isActive
                    ? `${cat.bg} ${cat.color} shadow-sm font-bold`
                    : "bg-white dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Icon size={16} />
                <span className="text-xs uppercase tracking-wide">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-2 z-10 overflow-y-auto custom-scrollbar">
        {/* INPUT CARD */}
        <div className="relative bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-5 border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            From
          </label>
          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 w-full bg-transparent text-3xl md:text-4xl font-mono font-bold outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-white"
              placeholder="0"
            />
            <div className="relative min-w-[110px]">
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full appearance-none bg-slate-100 dark:bg-black/30 text-right font-bold text-sm py-2 pl-3 pr-8 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-black/50"
              >
                {Object.keys(RATES[activeTab]).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {UNIT_NAMES[fromUnit]}
          </p>

          {/* SWAP BUTTON (Absolute Center) */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-20">
            <button
              onClick={handleSwap}
              className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/40 transition-all hover:rotate-180 hover:scale-110 active:scale-95 border-4 border-slate-50 dark:border-slate-900"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>
        </div>

        {/* OUTPUT CARD */}
        <div className="relative mt-2 bg-indigo-500/5 dark:bg-white/5 rounded-3xl p-5 border border-indigo-500/20 dark:border-white/10 group">
          <label className="text-[10px] font-bold text-indigo-500/70 dark:text-slate-400 uppercase tracking-widest mb-1 block">
            To
          </label>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-3xl md:text-4xl font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
              {result}
            </div>
            <div className="relative min-w-[110px]">
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-black/30 text-right font-bold text-sm py-2 pl-3 pr-8 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-black/50"
              >
                {Object.keys(RATES[activeTab]).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {UNIT_NAMES[toUnit]}
          </p>

          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 text-slate-400 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            title="Copy Result"
          >
            {copied ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>

        {/* SMART HISTORY */}
        {history.length > 0 && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <History size={12} /> Recent
            </h3>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setAmount(item.val);
                    setFromUnit(item.from);
                    setToUnit(item.to);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/10 group"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold">{item.val}</span>
                    <span className="opacity-50">{item.from}</span>
                    <ArrowRightLeft size={10} className="text-slate-400" />
                    <span className="font-bold text-indigo-500">
                      {item.res}
                    </span>
                    <span className="opacity-50">{item.to}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={12} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
