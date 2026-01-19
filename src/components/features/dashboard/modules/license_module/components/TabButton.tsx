export const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all
            ${
              active
                ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            }
        `}
  >
    <Icon size={14} /> {label}
  </button>
);
