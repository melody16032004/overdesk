import { Search, X, Grid, Heart, History } from "lucide-react";
import { TabButton } from "./TabButton.";

export const PickerHeader = ({
  query,
  setQuery,
  activeTab,
  setActiveTab,
  counts,
}: any) => {
  return (
    <div className="p-4 border-b border-[#3e3e42] bg-[#252526] space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Search icons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-[#3e3e42] pl-10 pr-4 py-2 rounded-lg text-sm text-white focus:border-blue-500 outline-none transition-colors placeholder:text-slate-600"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        <TabButton
          isActive={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          icon={<Grid size={14} />}
          label="All"
          count={counts.all}
          color="blue"
        />
        <TabButton
          isActive={activeTab === "favorites"}
          onClick={() => setActiveTab("favorites")}
          icon={
            <Heart
              size={14}
              className={activeTab === "favorites" ? "fill-current" : ""}
            />
          }
          label="Saved"
          count={counts.favorites}
          color="pink"
        />
        <TabButton
          isActive={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={<History size={14} />}
          label="Recent"
          count={null}
          color="orange"
        />
      </div>
    </div>
  );
};
