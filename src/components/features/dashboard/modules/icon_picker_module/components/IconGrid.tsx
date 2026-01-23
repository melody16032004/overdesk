import { Grid, icons, Heart } from "lucide-react";
import { IconName } from "../types/icon_picker_type";

export const IconGrid = ({
  listRef,
  onScroll,
  icons: iconList,
  selectedIcon,
  favorites,
  onSelect,
  onToggleFav,
}: any) => {
  if (iconList.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
        <Grid size={48} strokeWidth={1} className="mb-2" />
        <p className="text-xs">No icons found</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#1e1e1e]"
    >
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-11 xl:grid-cols-14 gap-3 pb-20">
        {iconList.map((name: IconName) => {
          const Icon = icons[name];
          const isSelected = selectedIcon === name;
          const isFav = favorites.includes(name);

          return (
            <div key={name} className="relative group">
              <button
                onClick={() => onSelect(name)}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500 text-blue-400"
                    : "bg-[#252526] border-[#3e3e42] hover:bg-[#3e3e42] hover:border-slate-500 text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={24} strokeWidth={1.5} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFav(name);
                }}
                className={`absolute top-1 right-1 p-1.5 rounded-full bg-[#1e1e1e] border border-[#3e3e42] hover:border-pink-500 transition-all ${
                  isFav
                    ? "opacity-100 text-pink-500"
                    : "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-pink-500"
                }`}
              >
                <Heart size={10} className={isFav ? "fill-current" : ""} />
              </button>

              <div
                className="text-[10px] text-center mt-1 truncate opacity-50 w-full px-1 select-none cursor-default"
                title={name}
              >
                {name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
