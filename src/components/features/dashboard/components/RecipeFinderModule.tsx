import { useState, useEffect } from "react";
import {
  ChefHat,
  Wine,
  Search,
  Heart,
  Utensils,
  X,
  ExternalLink,
  Flame,
  Dices,
  Copy,
  Check,
  History,
} from "lucide-react";

// --- TYPES ---
interface Recipe {
  id: string;
  title: string;
  thumb: string;
  category?: string;
  area?: string;
  instructions?: string;
  ingredients?: { item: string; measure: string }[];
  source?: string;
  youtube?: string;
  type: "meal" | "cocktail";
}

interface HistoryItem {
  term: string;
  mode: Mode;
  timestamp: number;
}

type Mode = "meal" | "cocktail";

// --- API HELPERS ---
const API_BASE = {
  meal: "https://www.themealdb.com/api/json/v1/1",
  cocktail: "https://www.thecocktaildb.com/api/json/v1/1",
};

export const RecipeFinderModule = () => {
  // State
  const [mode, setMode] = useState<Mode>("meal");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [view, setView] = useState<"search" | "favorites">("search");
  const [copied, setCopied] = useState(false);

  // Storage
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("my_recipes") || "[]");
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recipe_search_history") || "[]");
    } catch {
      return [];
    }
  });

  // --- FIX: RESET STATE KHI CHUYỂN TAB ---
  useEffect(() => {
    setResults([]);
    setQuery("");
  }, [mode]);

  // --- ACTIONS ---

  // 1. Search Logic (Updated to support History)
  const handleSearch = async (overrideQuery?: string, overrideMode?: Mode) => {
    const searchTerm = overrideQuery !== undefined ? overrideQuery : query;
    const searchMode = overrideMode !== undefined ? overrideMode : mode;

    if (!searchTerm.trim()) return;

    // Nếu gọi từ lịch sử (có overrideMode), cần setMode lại để UI đồng bộ
    if (overrideMode && overrideMode !== mode) {
      setMode(overrideMode);
    }
    if (overrideQuery) {
      setQuery(overrideQuery);
    }

    setLoading(true);
    setResults([]);
    setView("search");

    try {
      const endpoint = `${API_BASE[searchMode]}/filter.php?i=${searchTerm}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const list = searchMode === "meal" ? data.meals : data.drinks;

      if (list) {
        const formatted: Recipe[] = list.map((item: any) => ({
          id: item.idMeal || item.idDrink,
          title: item.strMeal || item.strDrink,
          thumb: item.strMealThumb || item.strDrinkThumb,
          type: searchMode,
        }));
        setResults(formatted);

        // Save to History if successful
        addToHistory(searchTerm, searchMode);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. History Logic
  const addToHistory = (term: string, searchMode: Mode) => {
    const newItem: HistoryItem = {
      term: term.trim(),
      mode: searchMode,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Xóa trùng lặp (nếu đã có từ khóa này + mode này rồi)
      const filtered = prev.filter(
        (h) =>
          !(
            h.term.toLowerCase() === newItem.term.toLowerCase() &&
            h.mode === newItem.mode
          )
      );
      // Thêm vào đầu danh sách, giữ tối đa 10 item
      const updated = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem("recipe_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation(); // Ngăn chặn kích hoạt tìm kiếm khi bấm xóa
    const updated = history.filter((h) => h.timestamp !== item.timestamp);
    setHistory(updated);
    localStorage.setItem("recipe_search_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (!confirm("Xóa toàn bộ lịch sử tìm kiếm?")) return;
    setHistory([]);
    localStorage.removeItem("recipe_search_history");
  };

  // 3. Random Logic
  const handleRandom = async () => {
    setLoadingDetails(true);
    setSelectedRecipe({
      id: "loading",
      title: "Đang chọn món...",
      thumb: "",
      type: mode,
    });

    try {
      const endpoint = `${API_BASE[mode]}/random.php`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const item = mode === "meal" ? data.meals[0] : data.drinks[0];

      const recipe = processRecipeData(item, mode);
      setSelectedRecipe(recipe);
    } catch (err) {
      alert("Lỗi kết nối server.");
      setSelectedRecipe(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const processRecipeData = (item: any, type: Mode): Recipe => {
    const ingredients: { item: string; measure: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = item[`strIngredient${i}`];
      const meas = item[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push({ item: ing, measure: meas || "" });
      }
    }
    return {
      id: item.idMeal || item.idDrink,
      title: item.strMeal || item.strDrink,
      thumb: item.strMealThumb || item.strDrinkThumb,
      category: item.strCategory,
      area: item.strArea,
      instructions: item.strInstructions,
      source: item.strSource,
      youtube: item.strYoutube,
      type: type,
      ingredients,
    };
  };

  // 4. Get Details
  const fetchDetails = async (recipe: Recipe) => {
    if (recipe.instructions) {
      setSelectedRecipe(recipe);
      return;
    }
    setLoadingDetails(true);
    setSelectedRecipe(recipe);
    try {
      const endpoint = `${API_BASE[recipe.type]}/lookup.php?i=${recipe.id}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const item = recipe.type === "meal" ? data.meals[0] : data.drinks[0];

      const fullRecipe = processRecipeData(item, recipe.type);
      setSelectedRecipe(fullRecipe);
    } catch (err) {
      // Silent fail
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    const exists = favorites.find((f) => f.id === recipe.id);
    let newFavs;
    if (exists) {
      newFavs = favorites.filter((f) => f.id !== recipe.id);
    } else {
      newFavs = [recipe, ...favorites];
    }
    setFavorites(newFavs);
    localStorage.setItem("my_recipes", JSON.stringify(newFavs));
  };

  const copyIngredients = () => {
    if (!selectedRecipe?.ingredients) return;
    const text =
      `🛒 MUA SẮM (${selectedRecipe.title}):\n` +
      selectedRecipe.ingredients
        .map((i) => `- ${i.item}: ${i.measure}`)
        .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isFav = (id: string) => favorites.some((f) => f.id === id);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex flex-wrap items-center justify-between z-20 gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl transition-all shadow-lg ${
              mode === "meal"
                ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                : "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
            }`}
          >
            {mode === "meal" ? <ChefHat size={20} /> : <Wine size={20} />}
          </div>
          <div className="font-bold text-white text-lg hidden sm:block">
            {mode === "meal" ? "Kitchen Pro" : "Bar Pro"}
          </div>
        </div>

        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setMode("meal")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              mode === "meal"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ChefHat size={14} /> Food
          </button>
          <button
            onClick={() => setMode("cocktail")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              mode === "cocktail"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wine size={14} /> Drink
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRandom}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all active:scale-95"
            title="Gợi ý ngẫu nhiên"
          >
            <Dices size={20} />
          </button>
          <button
            onClick={() => setView(view === "search" ? "favorites" : "search")}
            className={`p-2 rounded-xl transition-all border ${
              view === "favorites"
                ? "bg-rose-500/20 border-rose-500 text-rose-500"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400"
            }`}
            title="Yêu thích"
          >
            <Heart
              size={20}
              fill={view === "favorites" ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* VIEW: SEARCH & LIST */}
        {view === "search" && (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Search Bar (Fixed Top) */}
            <div className="flex-none p-4 md:p-6 pb-0">
              <div className="relative group max-w-2xl mx-auto w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={
                    mode === "meal"
                      ? "Nguyên liệu? (VD: Egg, Chicken...)"
                      : "Rượu gì? (VD: Vodka, Gin...)"
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-14 pr-24 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all shadow-inner"
                />
                <Search
                  size={22}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                />
                <button
                  onClick={() => handleSearch()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition-all active:scale-95"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* Search History Chips */}
              {history.length > 0 ? (
                <div className="max-w-2xl mx-auto w-full mt-3">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <History size={10} /> Lịch sử tìm kiếm
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] text-slate-500 hover:text-rose-400 hover:underline"
                    >
                      Xóa hết
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                    {history.map((h) => (
                      <div
                        key={h.timestamp}
                        onClick={() => handleSearch(h.term, h.mode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all shrink-0 group ${
                          h.mode === "meal"
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-200 hover:bg-orange-500/20"
                            : "bg-pink-500/10 border-pink-500/30 text-pink-200 hover:bg-pink-500/20"
                        }`}
                      >
                        <span>{h.term}</span>
                        <button
                          onClick={(e) => removeFromHistory(e, h)}
                          className="p-0.5 rounded-full hover:bg-black/20 text-slate-400 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Default Suggestions if no history */
                <div className="flex justify-center flex-wrap gap-2 mt-3">
                  {(mode === "meal"
                    ? ["Chicken", "Egg", "Beef", "Rice", "Potato"]
                    : ["Vodka", "Gin", "Lemon", "Rum", "Tequila"]
                  ).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSearch(tag)}
                      className="px-3 py-1 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Grid (Scrollable Area) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 pt-2">
              {loading ? (
                <div className="flex justify-center pt-20">
                  <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-indigo-500 rounded-full"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => fetchDetails(item)}
                      className="bg-[#1e293b] rounded-2xl overflow-hidden border border-slate-700/50 group cursor-pointer hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative"
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={item.thumb}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <ExternalLink size={12} /> Xem
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3
                          className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h3>
                      </div>
                      {isFav(item.id) && (
                        <div className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white shadow-lg animate-in zoom-in">
                          <Heart size={12} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60 pb-20">
                  <Utensils
                    size={64}
                    strokeWidth={1}
                    className="mb-4 text-slate-700"
                  />
                  <p className="text-sm">Bạn đang có nguyên liệu gì?</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: FAVORITES */}
        {view === "favorites" && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="text-rose-500" fill="currentColor" /> Món tủ của
              bạn ({favorites.length})
            </h2>
            {favorites.length === 0 ? (
              <div className="text-center text-slate-500 py-20 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                Chưa lưu món nào cả.
                <br />
                Hãy thả tim món bạn thích nhé!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => fetchDetails(item)}
                    className="bg-[#1e293b] rounded-2xl overflow-hidden border border-slate-700 group cursor-pointer hover:border-rose-500/30 transition-all relative"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-slate-200 line-clamp-1">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: RECIPE DETAILS (FIXED SCROLL) */}
        {selectedRecipe && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            {/* CARD CONTAINER */}
            <div className="w-full max-w-4xl bg-[#0f172a] rounded-3xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden max-h-full">
              {/* Close Btn */}
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg"
              >
                <X size={20} />
              </button>

              {/* SCROLLABLE CONTENT WRAPPER */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* HERO IMAGE */}
                <div className="h-64 md:h-80 w-full relative shrink-0">
                  {selectedRecipe.id !== "loading" && (
                    <>
                      <img
                        src={selectedRecipe.thumb}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div>
                            <div className="flex gap-2 mb-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${
                                  selectedRecipe.type === "meal"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    : "bg-pink-500/20 text-pink-400 border-pink-500/30"
                                }`}
                              >
                                {selectedRecipe.category || "Recipe"}
                              </span>
                              {selectedRecipe.area && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600">
                                  {selectedRecipe.area}
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-xl">
                              {selectedRecipe.title}
                            </h2>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => toggleFavorite(selectedRecipe)}
                              className={`p-3 rounded-full shadow-lg transition-all border ${
                                isFav(selectedRecipe.id)
                                  ? "bg-rose-500 border-rose-500 text-white"
                                  : "bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 backdrop-blur-md"
                              }`}
                            >
                              <Heart
                                size={24}
                                fill={
                                  isFav(selectedRecipe.id)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* CONTENT DETAILS */}
                <div className="p-6 md:p-10 bg-[#0f172a]">
                  {loadingDetails || selectedRecipe.id === "loading" ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="animate-spin w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full"></div>
                      <p className="text-slate-400 text-sm font-medium animate-pulse">
                        {selectedRecipe.title === "Đang chọn món..."
                          ? "Đang chọn ngẫu nhiên..."
                          : "Đang tải bí kíp..."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row gap-10">
                      {/* LEFT: INGREDIENTS */}
                      <div className="w-full lg:w-80 shrink-0 space-y-6">
                        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Utensils size={18} className="text-indigo-400" />{" "}
                              Nguyên liệu
                            </h3>
                            <button
                              onClick={copyIngredients}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Copy danh sách đi chợ"
                            >
                              {copied ? (
                                <Check size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                          <ul className="space-y-3">
                            {selectedRecipe.ingredients?.map((ing, i) => (
                              <li
                                key={i}
                                className="flex items-start justify-between text-sm pb-2 border-b border-slate-700/50 last:border-0 last:pb-0"
                              >
                                <span className="text-slate-300 font-medium">
                                  {ing.item}
                                </span>
                                <span className="text-indigo-300 text-right ml-4 font-bold">
                                  {ing.measure}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Youtube Embed */}
                        {selectedRecipe.youtube &&
                          getYoutubeId(selectedRecipe.youtube) && (
                            <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
                              <iframe
                                className="w-full aspect-video"
                                src={`https://www.youtube.com/embed/${getYoutubeId(
                                  selectedRecipe.youtube
                                )}`}
                                title="Recipe Video"
                                allowFullScreen
                                loading="lazy"
                              ></iframe>
                            </div>
                          )}
                      </div>

                      {/* RIGHT: INSTRUCTIONS */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Flame size={18} className="text-orange-500" /> Hướng
                          dẫn thực hiện
                        </h3>
                        <div className="text-slate-300 text-base leading-relaxed whitespace-pre-line font-light">
                          {selectedRecipe.instructions?.split("\r\n").map(
                            (step, idx) =>
                              step.trim() && (
                                <p key={idx} className="mb-4">
                                  {step}
                                </p>
                              )
                          )}
                        </div>

                        {selectedRecipe.source && (
                          <div className="mt-8 pt-6 border-t border-slate-800">
                            <a
                              href={selectedRecipe.source}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                            >
                              <ExternalLink size={14} /> Nguồn công thức gốc
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
