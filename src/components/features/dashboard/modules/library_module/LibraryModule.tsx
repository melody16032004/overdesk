import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Search,
  Copy,
  Check,
  ExternalLink,
  Star,
  ShoppingBag,
  PanelLeft,
  Trash2,
  Plus,
  Edit,
  Save,
  AlertTriangle,
} from "lucide-react";
import { CategoryId, Library, PkgManager } from "./types/library_type";
import { CATEGORIES, LIBRARIES } from "./constants/library_const";

export const LibraryModule = () => {
  // --- STATE & EFFECTS ---

  // Basic UI State
  const [activeCat, setActiveCat] = useState<CategoryId>("react");
  const [searchTerm, setSearchTerm] = useState("");
  const [pkgManager, setPkgManager] = useState<PkgManager>("npm");
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data State
  const [selectedLibs, setSelectedLibs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lib_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [customLibs, setCustomLibs] = useState<Library[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lib_custom") || "[]");
    } catch {
      return [];
    }
  });

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit" | "delete";
    data: Partial<Library>;
  }>({ isOpen: false, mode: "add", data: {} });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("lib_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("lib_custom", JSON.stringify(customLibs));
  }, [customLibs]);

  // --- LOGIC & HELPERS ---
  const allLibraries = useMemo(
    () => [...customLibs, ...LIBRARIES],
    [customLibs],
  );

  const isJSContext = [
    "react",
    "vue",
    "node",
    "utils",
    "css",
    "test",
    "db",
    "favorites",
  ].includes(activeCat);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedLibs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // --- COMMAND GENERATION ---
  const getSingleCommand = (lib: Library) => {
    if (lib.category === "python") return `pip install ${lib.cmdName}`;
    if (lib.category === "flutter") return `flutter pub add ${lib.cmdName}`;
    if (lib.category === "go") return `go get ${lib.cmdName}`;
    if (lib.category === "rust") return `cargo add ${lib.cmdName}`;

    const devFlag = lib.isDev ? " -D" : "";
    switch (pkgManager) {
      case "yarn":
        return `yarn add ${lib.cmdName}${devFlag}`;
      case "pnpm":
        return `pnpm add ${lib.cmdName}${devFlag}`;
      case "bun":
        return `bun add ${lib.cmdName}${devFlag}`;
      default:
        return `npm i ${lib.cmdName}${lib.isDev ? " --save-dev" : ""}`;
    }
  };

  const getBulkCommand = () => {
    const libs = allLibraries.filter((l) => selectedLibs.includes(l.id));
    if (libs.length === 0) return "";
    const isJS = libs.some((l) =>
      ["react", "vue", "node", "css", "utils", "test", "db"].includes(
        l.category,
      ),
    );

    if (!isJS) return libs.map((l) => getSingleCommand(l)).join(" && ");

    const regular = libs
      .filter((l) => !l.isDev)
      .map((l) => l.cmdName)
      .join(" ");
    const dev = libs
      .filter((l) => l.isDev)
      .map((l) => l.cmdName)
      .join(" ");

    let cmd = "";
    if (regular) {
      switch (pkgManager) {
        case "yarn":
          cmd += `yarn add ${regular}`;
          break;
        case "pnpm":
          cmd += `pnpm add ${regular}`;
          break;
        case "bun":
          cmd += `bun add ${regular}`;
          break;
        default:
          cmd += `npm i ${regular}`;
          break;
      }
    }
    if (dev) {
      if (cmd) cmd += " && ";
      switch (pkgManager) {
        case "yarn":
          cmd += `yarn add -D ${dev}`;
          break;
        case "pnpm":
          cmd += `pnpm add -D ${dev}`;
          break;
        case "bun":
          cmd += `bun add -D ${dev}`;
          break;
        default:
          cmd += `npm i -D ${dev}`;
          break;
      }
    }
    return cmd;
  };

  // --- CRUD & ACTIONS ---
  const handleSaveLib = () => {
    if (!modal.data.name || !modal.data.cmdName || !modal.data.category) {
      alert("Vui lòng nhập Tên, Tên gói và Danh mục!");
      return;
    }

    if (modal.mode === "add") {
      const newLib: Library = {
        ...(modal.data as Library),
        id: `custom_${Date.now()}`,
        isCustom: true,
      };
      setCustomLibs([newLib, ...customLibs]);
    } else if (modal.mode === "edit") {
      setCustomLibs((prev) =>
        prev.map((l) =>
          l.id === modal.data.id ? { ...(modal.data as Library) } : l,
        ),
      );
    }
    setModal({ isOpen: false, mode: "add", data: {} });
  };

  const openEditModal = (lib: Library) => {
    setModal({ isOpen: true, mode: "edit", data: { ...lib } });
  };

  const confirmDelete = (lib: Library) => {
    setModal({ isOpen: true, mode: "delete", data: lib });
  };

  const handleExecuteDelete = () => {
    if (modal.data.id) {
      const id = modal.data.id;
      setCustomLibs((prev) => prev.filter((l) => l.id !== id));
      setFavorites((prev) => prev.filter((f) => f !== id));
      setSelectedLibs((prev) => prev.filter((s) => s !== id));
    }
    setModal({ isOpen: false, mode: "add", data: {} });
  };

  // --- COMPUTED DATA ---
  const filteredLibs = useMemo(() => {
    let data = allLibraries;
    if (activeCat === "favorites") {
      data = allLibraries.filter((l) => favorites.includes(l.id));
    } else {
      data = allLibraries.filter((l) => l.category === activeCat);
    }

    if (!searchTerm) return data;
    return data.filter(
      (lib) =>
        lib.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lib.cmdName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [activeCat, searchTerm, favorites, allLibraries]);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md z-20 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm ">Library Hub</h3>
              <p className="text-[10px] text-slate-400">
                {allLibraries.length} Items
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 text-slate-400 hover:text-white 
            hover:bg-slate-700 transition-all duration-300 bg-slate-800 rounded-lg"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-2.5 top-2.5 text-slate-500"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm thư viện..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
          {isJSContext && (
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 shrink-0">
              {(["npm", "yarn", "pnpm", "bun"] as const).map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPkgManager(pm)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    pkgManager === pm
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() =>
              setModal({
                isOpen: true,
                mode: "add",
                data: {
                  category: activeCat !== "favorites" ? activeCat : "react",
                },
              })
            }
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg active:scale-95"
            title="Thêm thư viện mới"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR */}
        <div
          className={`absolute md:static inset-y-0 left-0 z-40 w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-300 ${
            showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCat(cat.id);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border ${
                  activeCat === cat.id
                    ? `bg-slate-800 ${cat.color} border-slate-700`
                    : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <cat.icon size={18} />
                <span className="text-xs font-bold">{cat.label}</span>
                {cat.id === "favorites" && favorites.length > 0 && (
                  <span className="ml-auto text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT GRID */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredLibs.map((lib) => {
                const isSelected = selectedLibs.includes(lib.id);
                const isFav = favorites.includes(lib.id);
                return (
                  <div
                    key={lib.id}
                    className={`relative bg-[#262626] border rounded-xl p-4 transition-all group flex flex-col ${
                      isSelected
                        ? "border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-900/10"
                        : "border-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg"
                    }`}
                  >
                    <button
                      onClick={() => toggleSelection(lib.id)}
                      className={`absolute top-3 right-3 w-5 h-5 rounded border flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-600 hover:border-indigo-400 text-transparent"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(lib.id, e)}
                          className={`transition-all ${
                            isFav
                              ? "text-yellow-400"
                              : "text-slate-600 hover:text-yellow-400"
                          }`}
                        >
                          <Star
                            size={16}
                            fill={isFav ? "currentColor" : "none"}
                          />
                        </button>
                        <h4
                          className="font-bold text-slate-200 text-sm truncate max-w-[150px]"
                          title={lib.name}
                        >
                          {lib.name}
                        </h4>
                        {lib.isCustom && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                            User
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 flex-1 min-h-[32px]">
                      {lib.desc}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div
                        onClick={() =>
                          handleCopy(getSingleCommand(lib), lib.id)
                        }
                        className="flex-1 bg-[#0f172a] rounded-lg px-2 py-1.5 flex items-center justify-between pointer group/cmd border border-slate-700 hover:border-indigo-500 transition-colors"
                      >
                        <code className="text-[10px] font-mono text-emerald-400 truncate mr-2 flex-1">
                          <span className="text-slate-500 select-none">$ </span>
                          {lib.cmdName}
                        </code>
                        {copiedId === lib.id ? (
                          <Check size={10} className="text-emerald-500" />
                        ) : (
                          <Copy
                            size={10}
                            className="text-slate-500 group-hover/cmd:text-white"
                          />
                        )}
                      </div>
                      {lib.isCustom ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(lib)}
                            className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                            title="Sửa"
                          >
                            <Edit size={14} />
                          </button>
                          {/* Thay handleDeleteLib bằng confirmDelete */}
                          <button
                            onClick={() => confirmDelete(lib)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <a
                          href={lib.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700"
                          title="Docs"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedLibs.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl p-3 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-bottom-4 z-50">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm whitespace-nowrap">
                <ShoppingBag size={18} />{" "}
                <span>{selectedLibs.length} Selected</span>
              </div>
              <div
                className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-700 px-3 py-2 flex items-center justify-between group pointer hover:border-indigo-500 transition-colors"
                onClick={() => handleCopy(getBulkCommand(), "bulk")}
              >
                <code className="text-xs font-mono text-emerald-400 truncate mr-2">
                  <span className="text-slate-500 select-none">$ </span>
                  {getBulkCommand()}
                </code>
                <div className="flex items-center gap-2">
                  {copiedId === "bulk" ? (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <Check size={12} /> Copied!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 group-hover:text-white transition-colors">
                      Click to copy
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedLibs([])}
                className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700 hover:border-rose-500"
                title="Clear selection"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- UNIVERSAL MODAL (ADD / EDIT / DELETE) --- */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModal({ ...modal, isOpen: false })}
        >
          <div
            className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODE: DELETE */}
            {modal.mode === "delete" ? (
              <>
                <div className="flex items-center gap-3 mb-4 text-rose-500">
                  <div className="p-2 bg-rose-500/10 rounded-full">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-white">Xác nhận xóa</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  Bạn có chắc chắn muốn xóa thư viện{" "}
                  <span className="text-white font-bold">
                    {modal.data.name}
                  </span>{" "}
                  không?
                  <br />
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleExecuteDelete}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors"
                  >
                    Xóa bỏ
                  </button>
                </div>
              </>
            ) : (
              /* MODE: ADD / EDIT */
              <>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  {modal.mode === "add" ? (
                    <Plus size={20} className="text-indigo-500" />
                  ) : (
                    <Edit size={20} className="text-indigo-500" />
                  )}
                  {modal.mode === "add"
                    ? "Thêm Thư viện"
                    : "Chỉnh sửa Thư viện"}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={modal.data.name || ""}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, name: e.target.value },
                        })
                      }
                      placeholder="VD: My Library"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Tên gói (Package Name)
                    </label>
                    <input
                      type="text"
                      value={modal.data.cmdName || ""}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, cmdName: e.target.value },
                        })
                      }
                      placeholder="VD: react-router-dom"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Danh mục
                      </label>
                      <select
                        value={modal.data.category || "react"}
                        onChange={(e) =>
                          setModal({
                            ...modal,
                            data: {
                              ...modal.data,
                              category: e.target.value as any,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        {CATEGORIES.filter((c) => c.id !== "favorites").map(
                          (c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Link Docs
                      </label>
                      <input
                        type="text"
                        value={modal.data.url || ""}
                        onChange={(e) =>
                          setModal({
                            ...modal,
                            data: { ...modal.data, url: e.target.value },
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Mô tả ngắn
                    </label>
                    <textarea
                      value={modal.data.desc || ""}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, desc: e.target.value },
                        })
                      }
                      placeholder="Thư viện này dùng để..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white outline-none focus:border-indigo-500 h-20 resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 pointer p-2 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all">
                    <input
                      type="checkbox"
                      checked={modal.data.isDev || false}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, isDev: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded border-slate-500 accent-indigo-500"
                    />
                    <span className="text-sm text-slate-300">
                      Đây là Dev Dependency (VD: -D, --save-dev)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveLib}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-2"
                  >
                    <Save size={14} /> Lưu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
