export const GuideItem = ({
  title,
  syntax,
  ex,
}: {
  title: string;
  syntax: string;
  ex: string;
}) => (
  <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
    <div className="text-[10px] font-bold text-indigo-500 uppercase mb-1">
      {title}
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 mb-1">
      {syntax}
    </div>
    <div className="text-[10px] text-slate-400 italic">Ex: {ex}</div>
  </div>
);
