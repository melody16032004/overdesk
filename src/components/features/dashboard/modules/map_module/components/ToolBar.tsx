import {
  Loader2,
  Locate,
  MapPin,
  Navigation,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

export const ToolBar = ({
  query,
  setQuery,
  handleSearch,
  setDestPos,
  setRoutes,
  isSearching,
  handleGetLocation,
  setShowSaved,
  showSaved,
  showResults,
  results,
  selectLocation,
  savedLocs,
  deleteLocation,
}: any) => (
  <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-1">
        <div className="pl-3 text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search destination..."
          className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-slate-700 dark:text-white placeholder:text-slate-400 min-w-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setDestPos(null);
              setRoutes([]);
            }}
            className="p-2 text-slate-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
        <button
          onClick={handleSearch}
          className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Navigation size={16} />
          )}
        </button>
      </div>

      <button
        onClick={handleGetLocation}
        className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-white/10"
        title="My Location"
      >
        <Locate size={18} />
      </button>

      <button
        onClick={() => setShowSaved(!showSaved)}
        className={`p-3 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 transition-colors ${showSaved ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200"}`}
        title="Saved Locations"
      >
        <Star size={18} />
      </button>
    </div>

    {showResults && results.length > 0 && (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
        {results.map((item: any, idx: any) => (
          <button
            key={idx}
            onClick={() =>
              selectLocation(item.lat, item.lon, item.display_name)
            }
            className="w-full text-left p-3 text-xs border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 flex items-start gap-2 last:border-0"
          >
            <MapPin size={14} className="shrink-0 mt-0.5 text-indigo-500" />
            <span className="line-clamp-2">{item.display_name}</span>
          </button>
        ))}
      </div>
    )}

    {showSaved && (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 p-1">
        {savedLocs.length === 0 && (
          <div className="text-xs text-slate-400 p-3 text-center">
            No saved locations yet.
          </div>
        )}
        {savedLocs.map((loc: any) => (
          <div
            key={loc.id}
            onClick={() =>
              selectLocation(loc.lat.toString(), loc.lon.toString(), loc.name)
            }
            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg pointer group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Star
                size={14}
                className="text-amber-400 fill-amber-400 shrink-0"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {loc.name}
              </span>
            </div>
            <button
              onClick={(e) => deleteLocation(loc.id, e)}
              className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
