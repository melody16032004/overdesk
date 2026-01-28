import { CATEGORIES } from "../constants/news_const";

export const Sidebar = ({ setActiveCategory, activeCategory }: any) => (
  <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
    {CATEGORIES.map((cat: any) => (
      <button
        key={cat.id}
        onClick={() => setActiveCategory(cat.id)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap ${
          activeCategory === cat.id
            ? "bg-indigo-500 text-white shadow-md"
            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
        }`}
      >
        <cat.icon size={18} />
        <span className="text-xs font-bold">{cat.label}</span>
      </button>
    ))}
  </div>
);
