import { Copy, RefreshCw } from "lucide-react";

export const UuidTab = ({ uuidValue, regenerateUUID }: any) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
        Generated UUID (v4)
      </label>
      <div className="flex gap-2">
        <div className="flex-1 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 break-all select-all">
          {uuidValue}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(uuidValue)}
          className="p-2 bg-slate-200 dark:bg-white/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-500 rounded-lg transition-colors"
          title="Copy to Clipboard"
        >
          <Copy size={18} />
        </button>
      </div>
    </div>

    <button
      onClick={regenerateUUID}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-xs font-bold"
    >
      <RefreshCw size={14} /> Generate New UUID
    </button>
  </div>
);
