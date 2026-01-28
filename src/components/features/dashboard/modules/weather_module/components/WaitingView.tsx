import { ArrowLeft, Search, Loader2, MapPin, Star, Trash2 } from "lucide-react";

export const WaitingView = ({
  weatherLocation,
  setIsSearching,
  searchQuery,
  setSearchQuery,
  handleSearch,
  loading,
  searchResults,
  setWeatherLocation,
  setSearchResults,
  savedWeatherLocations,
  toggleSavedWeatherLocation,
}: any) => (
  <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-800/50">
    <div className="flex items-center gap-2 mb-4">
      {weatherLocation && (
        <button
          onClick={() => setIsSearching(false)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <h3 className="font-bold text-lg text-slate-700 dark:text-white">
        Locations
      </h3>
    </div>

    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Search city..."
        className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 outline-none focus:ring-2 ring-indigo-500 text-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        autoFocus
      />
      <button
        onClick={handleSearch}
        className="p-2 bg-indigo-500 text-white rounded-xl"
      >
        <Search size={20} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* LOGIC HIỂN THỊ LIST */}
      {/* Nếu ĐANG tìm kiếm -> Hiện kết quả tìm kiếm */}
      {searchResults.length > 0 ? (
        searchResults.map((city: any, idx: any) => (
          <button
            key={idx}
            onClick={() => {
              setWeatherLocation(city);
              setSearchResults([]);
              setSearchQuery("");
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-indigo-500/30 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <MapPin
                size={18}
                className="text-slate-400 group-hover:text-indigo-500"
              />
              <div>
                <div className="font-bold text-slate-700 dark:text-white">
                  {city.name}
                </div>
                <div className="text-xs text-slate-400">{city.country}</div>
              </div>
            </div>
          </button>
        ))
      ) : (
        /* Nếu KHÔNG tìm kiếm -> Hiện danh sách ĐÃ LƯU */
        <>
          {savedWeatherLocations.length > 0 && searchQuery === "" && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">
              Saved Locations
            </div>
          )}
          {savedWeatherLocations.map((city: any, idx: any) => (
            <div key={idx} className="flex items-center gap-2 group">
              <button
                onClick={() => {
                  setWeatherLocation(city);
                  setIsSearching(false);
                }}
                className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all text-left"
              >
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <div>
                  <div className="font-bold text-slate-700 dark:text-white text-sm">
                    {city.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {city.country}
                  </div>
                </div>
              </button>
              <button
                onClick={() => toggleSavedWeatherLocation(city)}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {savedWeatherLocations.length === 0 && searchQuery === "" && (
            <div className="text-center text-slate-400 text-xs mt-10">
              No saved locations yet.
              <br />
              Search and star your favorite cities!
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
