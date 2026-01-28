import { X } from "lucide-react";

export const HistoryMode = ({
  historyList,
  setActiveTab,
  setHistoryList,
  restoreHistoryItem,
}: any) => (
  <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 p-2 flex flex-col backdrop-blur-sm animate-in fade-in zoom-in-95">
    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("calc")}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
        >
          <X size={16} />
        </button>
        <span className="text-xs font-bold text-slate-500 uppercase">
          History
        </span>
      </div>
      <button
        onClick={() => setHistoryList([])}
        className="text-[10px] text-red-500 hover:underline px-2"
      >
        Clear
      </button>
    </div>
    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      {historyList.length === 0 && (
        <div className="text-center text-xs text-slate-400 mt-10">
          No history yet
        </div>
      )}
      {historyList.map((item: any, i: any) => (
        <button
          key={i}
          onClick={() => restoreHistoryItem(item)}
          className="w-full text-right text-xs p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 truncate border border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-300"
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);
