import { useState, useEffect, useRef } from "react";
import {
  ArrowRightLeft,
  Copy,
  History,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { RATES, CATEGORIES } from "./constants/converter_const";
import { Category } from "./types/converter_type";
import { InputCard } from "./components/InputCard";
import { OutputCard } from "./components/OutputCard";

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
          (c) => c.id === activeTab,
        )?.color.replace("text-", "bg-")}`}
      ></div>
      <div
        className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-10 transition-colors duration-700 ${CATEGORIES.find(
          (c) => c.id === activeTab,
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
        <InputCard
          amount={amount}
          setAmount={setAmount}
          fromUnit={fromUnit}
          setFromUnit={setFromUnit}
          activeTab={activeTab}
          handleSwap={handleSwap}
        />

        {/* OUTPUT CARD */}
        <OutputCard
          result={result}
          toUnit={toUnit}
          setToUnit={setToUnit}
          activeTab={activeTab}
          handleCopy={handleCopy}
          copied={copied}
        />

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
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 pointer transition-all hover:bg-slate-50 dark:hover:bg-white/10 group"
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
