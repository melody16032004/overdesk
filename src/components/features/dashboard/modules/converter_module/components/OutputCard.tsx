import { ChevronDown, Check, Copy } from "lucide-react";
import { RATES, UNIT_NAMES } from "../constants/converter_const";

export const OutputCard = ({
  result,
  toUnit,
  setToUnit,
  activeTab,
  handleCopy,
  copied,
}: any) => (
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
          className="w-full appearance-none bg-white dark:bg-black/30 text-right font-bold text-sm py-2 pl-3 pr-8 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition-all pointer hover:bg-slate-50 dark:hover:bg-black/50"
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
    <p className="text-xs text-slate-400 mt-1 truncate">{UNIT_NAMES[toUnit]}</p>

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
);
