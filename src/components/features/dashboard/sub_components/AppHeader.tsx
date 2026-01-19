import { ChevronLeft } from "lucide-react";

export const AppHeader = ({
  app,
  onBack,
}: {
  app: any;
  onBack: () => void;
}) => (
  <div className="shrink-0 h-11 flex items-center gap-2 px-1 border-b border-slate-200 dark:border-white/5 mb-2 bg-white dark:bg-[#0f172a] z-50">
    <button
      onClick={onBack}
      className="px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-400 transition-all flex items-center gap-1.5 group font-medium text-xs bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
    >
      <ChevronLeft
        size={14}
        className="group-hover:-translate-x-0.5 transition-transform"
      />
      Menu
    </button>
    <div className="flex-1 text-center pr-12">
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center justify-center gap-2">
        {app && <app.icon size={14} className="opacity-50" />}
        {app?.label}
      </span>
    </div>
    <div className="px-2 py-1.5 w-8"></div>
  </div>
);
