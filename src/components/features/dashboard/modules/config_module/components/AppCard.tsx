import { Lock } from "lucide-react";

export const AppCard = ({ app, isHidden, onToggle, isMandatory }: any) => (
  <div
    onClick={onToggle}
    className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
      isHidden
        ? "bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500/50 hover:shadow-md dark:hover:border-indigo-400/50"
    }`}
  >
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
        isHidden
          ? "bg-slate-200 dark:bg-slate-700 border-transparent"
          : `${app.color} border-transparent`
      }`}
    >
      <app.icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
        <span className="truncate">{app.label}</span>
        {isMandatory && <Lock size={12} className="text-amber-500 shrink-0" />}
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate">
        {app.desc}
      </div>
    </div>
    <div
      className={`w-10 h-5 rounded-full relative transition-colors duration-300 shrink-0 ${
        !isHidden ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
      } ${isMandatory ? "opacity-50" : ""}`}
    >
      <div
        className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${
          !isHidden ? "left-6" : "left-1"
        }`}
      ></div>
    </div>
  </div>
);
