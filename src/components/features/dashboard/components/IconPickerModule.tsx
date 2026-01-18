import { useState, useMemo, useEffect, useRef } from "react";
import { icons } from "lucide-react";
import {
  Search,
  Copy,
  Check,
  X,
  Grid,
  Heart,
  History,
  Sliders,
  RotateCcw,
  FileCode,
  ArrowLeft,
  Globe,
  Braces,
  Link as LinkIcon,
} from "lucide-react";

// --- TYPES & DEFAULTS ---
type IconName = keyof typeof icons;
type Tab = "all" | "favorites" | "history";
type CodeMode = "react" | "web";

interface IconProps {
  size: number;
  strokeWidth: number;
  color: string;
}

const DEFAULT_PROPS: IconProps = {
  size: 24,
  strokeWidth: 2,
  color: "#ffffff",
};

const toKebabCase = (str: string) => {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
};

export const IconPickerModule = () => {
  // --- STATE ---
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedIcon, setSelectedIcon] = useState<IconName | null>(null);
  const [customProps, setCustomProps] = useState<IconProps>(DEFAULT_PROPS);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [favorites, setFavorites] = useState<IconName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("icon_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<IconName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("icon_history") || "[]");
    } catch {
      return [];
    }
  });

  const listRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 60;

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("icon_favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("icon_history", JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    setPage(1);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query, activeTab]);

  // --- LOGIC ---
  const allIconNames = useMemo(() => Object.keys(icons) as IconName[], []);
  const filteredIcons = useMemo(() => {
    let source = allIconNames;
    if (activeTab === "favorites") source = favorites;
    if (activeTab === "history") source = history;
    if (!query) return source;
    return source.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, allIconNames, activeTab, favorites, history]);

  const visibleIcons = useMemo(() => {
    return filteredIcons.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredIcons, page]);

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (visibleIcons.length < filteredIcons.length)
          setPage((prev) => prev + 1);
      }
    }
  };

  const handleSelectIcon = (name: IconName) => {
    setSelectedIcon(name);
    setIsMobileOpen(true);
    setHistory((prev) => {
      const newHist = [name, ...prev.filter((i) => i !== name)].slice(0, 50);
      return newHist;
    });
  };

  const toggleFavorite = (name: IconName) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [name, ...prev]
    );
  };

  const resetCustomization = () => setCustomProps(DEFAULT_PROPS);

  const SelectedIconComponent = selectedIcon ? icons[selectedIcon] : null;

  // --- SUB-COMPONENT: DETAIL CONTENT ---
  const DetailContent = () => {
    const [copied, setCopied] = useState("");
    const [codeMode, setCodeMode] = useState<CodeMode>("react");

    const generateCode = (type: "jsx" | "import" | "html" | "url" | "svg") => {
      if (!selectedIcon) return "";
      const kebabName = toKebabCase(selectedIcon);

      switch (type) {
        case "import":
          return `import { ${selectedIcon} } from 'lucide-react';`;
        case "jsx": {
          let props = "";
          if (customProps.size !== 24) props += ` size={${customProps.size}}`;
          if (customProps.color !== "#ffffff")
            props += ` color="${customProps.color}"`;
          if (customProps.strokeWidth !== 2)
            props += ` strokeWidth={${customProps.strokeWidth}}`;
          return `<${selectedIcon}${props} />`;
        }
        case "html":
          return `<i data-lucide="${kebabName}"></i>`;
        case "url":
          return `https://unpkg.com/lucide-static@latest/icons/${kebabName}.svg`;
        case "svg":
          return `<svg xmlns="http://www.w3.org/2000/svg" width="${customProps.size}" height="${customProps.size}" viewBox="0 0 24 24" fill="none" stroke="${customProps.color}" stroke-width="${customProps.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">...</svg>`;
        default:
          return "";
      }
    };

    const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    };

    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 -ml-2 text-slate-400"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-bold text-white truncate max-w-[180px] text-lg">
              {selectedIcon}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selectedIcon && toggleFavorite(selectedIcon)}
              className={`p-2 rounded-lg border transition-all ${
                selectedIcon && favorites.includes(selectedIcon)
                  ? "bg-pink-500/10 border-pink-500 text-pink-500"
                  : "bg-[#1e1e1e] border-[#3e3e42] text-slate-400 hover:text-white"
              }`}
            >
              <Heart
                size={18}
                className={
                  selectedIcon && favorites.includes(selectedIcon)
                    ? "fill-current"
                    : ""
                }
              />
            </button>
            <button
              onClick={() => setSelectedIcon(null)}
              className="hidden lg:block p-2 text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="h-64 shrink-0 flex items-center justify-center bg-[#151515] relative overflow-hidden border-b border-[#3e3e42]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          {SelectedIconComponent && (
            <SelectedIconComponent
              size={customProps.size}
              color={customProps.color}
              strokeWidth={customProps.strokeWidth}
              className="relative z-10 drop-shadow-2xl transition-all duration-200"
            />
          )}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-500 bg-[#1e1e1e] border border-[#3e3e42] px-2 py-1 rounded shadow-sm">
            {customProps.size}px
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20 lg:pb-6">
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Sliders size={12} /> Customize
              </label>
              <button
                onClick={resetCustomization}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Size</span> <span>{customProps.size}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="4"
                value={customProps.size}
                onChange={(e) =>
                  setCustomProps((p) => ({
                    ...p,
                    size: Number(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-[#3e3e42] rounded-lg accent-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Stroke</span> <span>{customProps.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.25"
                value={customProps.strokeWidth}
                onChange={(e) =>
                  setCustomProps((p) => ({
                    ...p,
                    strokeWidth: Number(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-[#3e3e42] rounded-lg accent-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Color</span>{" "}
                <span className="uppercase font-mono">{customProps.color}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customProps.color}
                  onChange={(e) =>
                    setCustomProps((p) => ({ ...p, color: e.target.value }))
                  }
                  className="w-9 h-9 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={customProps.color}
                  onChange={(e) =>
                    setCustomProps((p) => ({ ...p, color: e.target.value }))
                  }
                  className="flex-1 bg-[#252526] border border-[#3e3e42] rounded px-3 text-xs text-white outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#3e3e42]">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
              <FileCode size={12} /> Copy Code
            </label>

            <div className="flex bg-[#252526] p-1 rounded-lg mb-4 border border-[#3e3e42]">
              <button
                onClick={() => setCodeMode("react")}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                  codeMode === "react"
                    ? "bg-[#3e3e42] text-white shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Braces size={12} /> React
              </button>
              <button
                onClick={() => setCodeMode("web")}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                  codeMode === "web"
                    ? "bg-[#3e3e42] text-white shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Globe size={12} /> Web / CDN
              </button>
            </div>

            <div className="space-y-3">
              {codeMode === "react" ? (
                <>
                  <button
                    onClick={() => copyToClipboard(generateCode("jsx"), "jsx")}
                    className="w-full text-left bg-[#252526] hover:bg-[#2d2d2d] border border-[#3e3e42] rounded-lg p-3 group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-blue-400">
                        JSX Component
                      </span>
                      {copied === "jsx" ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                        />
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-slate-300 break-all block">
                      {generateCode("jsx")}
                    </code>
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(generateCode("import"), "import")
                    }
                    className="w-full text-left bg-[#252526] hover:bg-[#2d2d2d] border border-[#3e3e42] rounded-lg p-3 group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-pink-400">
                        Import
                      </span>
                      {copied === "import" ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                        />
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-slate-300 break-all block">
                      {generateCode("import")}
                    </code>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => copyToClipboard(generateCode("url"), "url")}
                    className="w-full text-left bg-[#252526] hover:bg-[#2d2d2d] border border-[#3e3e42] rounded-lg p-3 group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-teal-400">
                        CDN URL (SVG)
                      </span>
                      {copied === "url" ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <LinkIcon
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                        />
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-slate-300 break-all block truncate">
                      {generateCode("url")}
                    </code>
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(generateCode("html"), "html")
                    }
                    className="w-full text-left bg-[#252526] hover:bg-[#2d2d2d] border border-[#3e3e42] rounded-lg p-3 group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-orange-400">
                        HTML Tag
                      </span>
                      {copied === "html" ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                        />
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-slate-300 break-all block">
                      {generateCode("html")}
                    </code>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* === LEFT: LIST === */}
      {/* FIX: Dùng lg:pr-80 (padding right) thay vì lg:mr-80 (margin right).
          Padding giữ cho element chiếm full width container, chỉ đẩy nội dung bên trong (grid) sang trái 
          để tránh bị Sidebar che mất.
      */}
      <div
        className={`flex-1 flex flex-col min-w-0 border-r border-[#3e3e42] transition-all duration-300 ease-in-out ${
          selectedIcon ? "lg:pr-80" : ""
        }`}
      >
        <div className="p-4 border-b border-[#3e3e42] bg-[#252526] space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={16}
            />
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
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-[#3e3e42] hover:bg-[#4e4e52]"
              }`}
            >
              <Grid size={14} /> All{" "}
              <span className="opacity-60 text-[10px]">
                {allIconNames.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "favorites"
                  ? "bg-pink-600 text-white"
                  : "bg-[#3e3e42] hover:bg-[#4e4e52]"
              }`}
            >
              <Heart
                size={14}
                className={activeTab === "favorites" ? "fill-current" : ""}
              />{" "}
              Saved{" "}
              <span className="opacity-60 text-[10px]">{favorites.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-orange-600 text-white"
                  : "bg-[#3e3e42] hover:bg-[#4e4e52]"
              }`}
            >
              <History size={14} /> Recent
            </button>
          </div>
        </div>
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#1e1e1e]"
        >
          {visibleIcons.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
              <Grid size={48} strokeWidth={1} className="mb-2" />
              <p className="text-xs">No icons found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 gap-3 pb-20">
              {visibleIcons.map((name) => {
                const Icon = icons[name];
                const isSelected = selectedIcon === name;
                const isFav = favorites.includes(name);
                return (
                  <div key={name} className="relative group">
                    <button
                      onClick={() => handleSelectIcon(name)}
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
                        toggleFavorite(name);
                      }}
                      className={`absolute top-1 right-1 p-1.5 rounded-full bg-[#1e1e1e] border border-[#3e3e42] hover:border-pink-500 transition-all ${
                        isFav
                          ? "opacity-100 text-pink-500"
                          : "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-pink-500"
                      }`}
                    >
                      <Heart
                        size={10}
                        className={isFav ? "fill-current" : ""}
                      />
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
          )}
        </div>
      </div>

      {/* === MOBILE OVERLAY === */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* === RIGHT: DETAILS PANEL === */}
      {/* FIX: Thêm `lg:left-auto` để override `left-0` của mobile.
          Điều này đảm bảo Sidebar dính sát lề PHẢI (right-0) trên Desktop.
      */}
      <div
        className={`bg-[#1e1e1e] shadow-2xl border-[#3e3e42] flex flex-col z-50 transition-transform duration-300 ease-in-out fixed bottom-0 left-0 w-full h-[85vh] rounded-t-2xl border-t ${
          isMobileOpen ? "translate-y-0" : "translate-y-full"
        } lg:absolute lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-80 lg:rounded-none lg:border-t-0 lg:border-l lg:translate-y-0 ${
          selectedIcon ? "lg:translate-x-0" : "lg:translate-x-full"
        }`}
      >
        {selectedIcon && <DetailContent />}
      </div>
    </div>
  );
};
