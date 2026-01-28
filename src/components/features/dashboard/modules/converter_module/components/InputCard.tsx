import { ChevronDown, ArrowRightLeft } from "lucide-react";
import { RATES, UNIT_NAMES } from "../constants/converter_const";

export const InputCard = ({
  amount,
  setAmount,
  fromUnit,
  setFromUnit,
  activeTab,
  handleSwap,
}: any) => (
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
          className="w-full appearance-none bg-slate-100 dark:bg-black/30 text-right font-bold text-sm py-2 pl-3 pr-8 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition-all pointer hover:bg-slate-200 dark:hover:bg-black/50"
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
);
