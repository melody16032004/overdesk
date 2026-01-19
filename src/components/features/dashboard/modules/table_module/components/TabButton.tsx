export const TabButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors border-b-2 ${
      active
        ? "bg-slate-800 text-indigo-400 border-indigo-500"
        : "text-slate-500 border-transparent hover:text-white hover:bg-slate-800/50"
    }`}
  >
    {icon} {label}
  </button>
);
