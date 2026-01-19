// src/features/dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";

import { useAppStore } from "../../../stores/useAppStore";
import { ScreenShareModule } from "./components/ScreenShareModule";
import { MusicModule } from "./components/MusicModule";
import { useMusicStore } from "../../../stores/useMusicStore";
import { MiniPlayer } from "./components/MiniPlayer";
import { DatabaseModule } from "./modules/database_module/DatabaseModule";
import { ERDiagramModule } from "./modules/er_diagram_module/ERDiagramModule";
import { TesterModule } from "./components/TesterModule";
import { TestScriptModule } from "./components/TestScriptModule";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useToastStore } from "../../../stores/useToastStore";
import { UserWidget } from "./sub_components/UserWidget";
import { AppHeader } from "./sub_components/AppHeader";
import { DashboardApp } from "../../../types/dashboard";
import { INITIAL_APPS } from "./constants/INITIAL_APPS";
import { AppInfo } from "./sub_components/AppInfo";
import { ArrowUp, ChevronLeft, EyeOff, Grid, Search, X } from "lucide-react";
import { UpdatePopup } from "./sub_components/UpdatePopup";
import { APP_COMPONENTS } from "./constants/APP_COMPONENTS";
import { ConfigModule } from "./modules/config_module/ConfigModule";

// --- 1. CONFIG & HELPERS (Đặt bên ngoài Component để tránh khởi tạo lại) ---
// Hàm khôi phục Apps từ LocalStorage và map lại Icon
const getSavedApps = (defaultApps: typeof INITIAL_APPS) => {
  try {
    const savedData = localStorage.getItem("dashboard_app_order");
    const savedVersion = localStorage.getItem("layout_version");
    const LAYOUT_VERSION = "2.0";

    if (savedData && savedVersion === LAYOUT_VERSION) {
      const parsedApps = JSON.parse(savedData) as DashboardApp[];
      // Map lại icon từ INITIAL_APPS vì JSON không lưu được function component
      return parsedApps.map((savedApp) => {
        const original = defaultApps.find((a) => a.id === savedApp.id);
        return original ? { ...savedApp, icon: original.icon } : savedApp;
      });
    }
  } catch (e) {
    console.error("Lỗi load cache dashboard:", e);
  }
  return defaultApps;
};

// Hàm lấy Hidden Apps
const getHiddenApps = () => {
  try {
    return JSON.parse(localStorage.getItem("dashboard_hidden_apps") || "[]");
  } catch {
    return [];
  }
};

// --- 2. COMPONENT CHÍNH ---
export const Dashboard = () => {
  // --- A. STORE & GLOBAL VARIABLES ---
  const {
    lastActiveApp,
    setLastActiveApp,
    multiWindowEnabled,
    cursorStyle,
    backgroundImage,
    autoHideUI,
  } = useAppStore();
  const { showToast } = useToastStore();
  const { playlist } = useMusicStore();

  // Alias variables (giữ nguyên theo yêu cầu)
  const activeApp = lastActiveApp;
  const setActiveApp = setLastActiveApp;
  const currentAppInfo = INITIAL_APPS.find((app) => app.id === activeApp);
  const shareAppInfo = INITIAL_APPS.find((app) => app.id === "share");

  // --- B. LOCAL STATE ---
  const [isWindowHovered, setIsWindowHovered] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);

  // State quản lý Apps & Hidden Apps
  const [apps] = useState(() => getSavedApps(INITIAL_APPS));
  const [hiddenAppIds, setHiddenAppIds] = useState<string[]>(getHiddenApps);

  // State tìm kiếm
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<typeof INITIAL_APPS>([]);

  // --- C. REFS ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- D. EFFECTS (LIFECYCLE) ---

  // 1. Kiểm tra Update định kỳ
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) setUpdateAvailable(update);
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 3600000); // 1h
    return () => clearInterval(interval);
  }, []);

  // 2. Xử lý Scroll Position khi chuyển App
  useLayoutEffect(() => {
    if (!activeApp && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [activeApp]);

  // 3. Xử lý phím tắt (Search Ctrl+F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.select(), 50);
      }
      if (e.key === "Escape" && isSearchOpen) handleCloseSearch();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  // 4. Update Cursor Style
  useEffect(() => {
    document.body.style.cursor = cursorStyle;
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [cursorStyle]);

  // --- E. HANDLERS (LOGIC XỬ LÝ) ---

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAppVisibility = (id: string) => {
    if (id === "config" || id === "settings") return;
    setHiddenAppIds((prev) => {
      const newHidden = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      localStorage.setItem("dashboard_hidden_apps", JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const handleBulkUpdate = (newHiddenIds: string[]) => {
    const safeHiddenIds = newHiddenIds.filter(
      (id) => id !== "config" && id !== "settings",
    );
    setHiddenAppIds(safeHiddenIds);
    localStorage.setItem(
      "dashboard_hidden_apps",
      JSON.stringify(safeHiddenIds),
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setHighlightedIds([]);
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    setHighlightedIds(
      apps
        .filter((app) => app.label.toLowerCase().includes(lowerQuery))
        .map((a) => a.id),
    );
    setSearchResults(
      INITIAL_APPS.filter((app) =>
        app.label.toLowerCase().includes(lowerQuery),
      ),
    );
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setHighlightedIds([]);
    setSearchResults([]);
  };

  const openExternalModule = async (moduleId: string) => {
    const appLabel =
      INITIAL_APPS.find((a) => a.id === moduleId)?.label || "Module";
    const windowLabel = `win-${moduleId}-${Date.now()}`;
    try {
      const webview = new WebviewWindow(windowLabel, {
        url: `index.html?app=${moduleId}`,
        title: `OverDesk - ${appLabel}`,
        width: 770,
        height: window.screen.availHeight - 200,
        resizable: true,
        decorations: true,
        center: true,
        focus: true,
      });
      webview.once("tauri://error", (e) => {
        console.error("Error creating window:", e);
        showToast("Failed to launch window", "error");
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLaunchApp = (appId: string) => {
    if (!appId) return;
    const appInfo = INITIAL_APPS.find((a) => a.id === appId);
    if (appInfo?.disabled) return;

    if (
      multiWindowEnabled &&
      !["config", "settings", "socials", "music"].includes(appId)
    ) {
      openExternalModule(appId);
    } else {
      setActiveApp(appId);
    }
    handleCloseSearch();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (searchQuery.trim() === "/") {
      handleCloseSearch();
      setActiveApp(null);
    } else if (searchResults.length > 0) {
      handleLaunchApp(searchResults[0].id);
    }
  };

  const handleBackFromShare = async () => setActiveApp(null);

  // --- F. RENDER HELPERS ---

  const renderStandardApp = () => {
    if (!activeApp) return null;

    // 1. Xử lý các App đặc biệt cần Props truyền vào
    if (activeApp === "config") {
      return (
        <ConfigModule
          allApps={INITIAL_APPS}
          hiddenAppIds={hiddenAppIds}
          onToggleApp={handleToggleAppVisibility}
          onBulkUpdate={handleBulkUpdate}
        />
      );
    }
    if (activeApp === "database")
      return <DatabaseModule onSwitchToDatabase={() => setActiveApp("erd")} />;
    if (activeApp === "erd")
      return (
        <ERDiagramModule onSwitchToDatabase={() => setActiveApp("database")} />
      );
    if (activeApp === "tester")
      return <TesterModule onSwitchApp={setActiveApp} />;
    if (activeApp === "testcase")
      return <TestScriptModule onSwitchApp={setActiveApp} />;

    // 2. Xử lý các App tiêu chuẩn bằng Map (Thay thế switch/case)
    const Component = APP_COMPONENTS[activeApp];
    return Component ? <Component /> : null;
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      onMouseEnter={() => setIsWindowHovered(true)}
      onMouseLeave={() => setIsWindowHovered(false)}
    >
      {updateAvailable && (
        <UpdatePopup
          updateInfo={updateAvailable}
          onClose={() => setUpdateAvailable(null)}
        />
      )}

      {/* --- [MỚI] BACKGROUND LAYER --- */}
      <div
        className="absolute inset-0 z-0 transition-all duration-500"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: backgroundImage ? 1 : 0, // Ẩn nếu không có ảnh
        }}
      >
        {/* Lớp phủ tối nhẹ để icon dễ nhìn hơn trên nền ảnh sáng */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
      </div>

      {/* --- [MỚI] DEFAULT BACKGROUND LAYER --- */}
      {/* Lớp nền mặc định (Gradient/Màu) chỉ hiện khi KHÔNG có ảnh nền */}
      {!backgroundImage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0f172a] dark:to-[#1e293b]" />
      )}

      {/* LAYER 1: PERSISTENT APPS */}
      <div
        className={`absolute inset-0 z-50 flex flex-col bg-slate-900 transition-opacity duration-300 
        ${
          activeApp === "share" || activeApp === "music"
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none invisible"
        }`}
      >
        <div
          className={activeApp === "share" ? "block h-full" : "hidden h-full"}
        >
          <AppHeader app={shareAppInfo} onBack={handleBackFromShare} />
          <div className="flex-1 overflow-hidden">
            <ScreenShareModule />
          </div>
        </div>

        <div
          className={activeApp === "music" ? "block h-full" : "hidden h-full"}
        >
          <AppHeader
            app={INITIAL_APPS.find((a) => a.id === "music")}
            onBack={() => setActiveApp(null)}
          />
          <div className="flex-1 overflow-hidden">
            <MusicModule />
          </div>
        </div>
      </div>

      {/* LAYER 2: STANDARD APPS */}
      {activeApp && activeApp !== "share" && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-5 duration-300 relative z-40 bg-slate-50 dark:bg-[#0f172a]">
          <AppHeader app={currentAppInfo} onBack={() => setActiveApp(null)} />
          <div className="flex-1 overflow-hidden">{renderStandardApp()}</div>
        </div>
      )}

      {/* LAYER 3: GRID MENU (DRAGGABLE) */}
      {!activeApp && (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          {/* Header Dashboard */}
          <div className="mb-5 mt-3 px-3 shrink-0 flex items-center justify-between overflow-visible">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              {/* Logo box: Thêm backdrop-blur để đẹp hơn trên nền ảnh */}
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900/90 dark:bg-white/90 backdrop-blur-md flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
                <Grid size={20} />
              </div>
              <div className="truncate drop-shadow-sm">
                <div className="inline-flex items-end gap-1">
                  <h2 className="text-base font-bold text-slate-300 dark:text-white leading-tight truncate">
                    OverDesk
                  </h2>
                  <AppInfo />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 dark:text-slate-400 truncate">
                  Dashboard{" "}
                  <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-[9px] font-mono text-black dark:text-white select-none">
                    Ctrl+F
                  </span>
                </div>
              </div>
            </div>
            <UserWidget />
          </div>

          {/* Grid Apps */}
          <div
            ref={scrollContainerRef}
            // [MỚI] Sửa sự kiện onScroll để cập nhật cả ref và state
            onScroll={(e) => {
              scrollPositionRef.current = e.currentTarget.scrollTop;
              setShowScrollTop(e.currentTarget.scrollTop > 100);
            }}
            className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide mt-3 "
          >
            <div
              className={`grid gap-3 grid-cols-[repeat(auto-fill,minmax(100px,1fr))] pb-10 transition-opacity duration-800 ease-in-out
            ${isWindowHovered || isSearchOpen || !autoHideUI ? "opacity-100" : "opacity-0"} `}
            >
              {apps.map((app: DashboardApp) => {
                if (hiddenAppIds.includes(app.id)) return null;

                const isHighlighted = highlightedIds.includes(app.id);
                // Nếu đang tìm kiếm mà không match thì làm mờ đi
                const isDimmed = highlightedIds.length > 0 && !isHighlighted;

                return (
                  <button
                    key={app.id}
                    draggable={!app.disabled}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => handleLaunchApp(app.id)}
                    disabled={app.disabled}
                    className={`
                      relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300 group h-28 justify-center
                      cursor-grab active:cursor-grabbing
                      ${
                        backgroundImage
                          ? "bg-white/60 dark:bg-slate-900/10 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-900/80 shadow-sm"
                          : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-lg"
                      }
                      ${
                        app.disabled
                          ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-white/5 border-transparent grayscale-[0.8]"
                          : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
                      }
                      ${
                        isHighlighted
                          ? "ring-4 ring-yellow-400/80 dark:ring-yellow-400 scale-105 z-10 shadow-xl !opacity-100"
                          : ""
                      }
                      ${isDimmed ? "opacity-20 scale-95 blur-[1px]" : ""}
                    `}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-2 transition-transform group-hover:scale-110 pointer-events-none ${app.color}`}
                    >
                      {app.icon ? (
                        <app.icon size={20} strokeWidth={2} />
                      ) : (
                        <span
                          title={`Lỗi Icon: ${app.id}`}
                          className="text-red-500 font-bold text-xs"
                        >
                          ?
                          {/* CÁCH FIX: Dùng hàm tự chạy để log xong trả về null */}
                          {(() => {
                            console.error(`MISSING ICON FOR APP: ${app.label}`);
                            return null;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="text-center w-full pointer-events-none">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-100 mb-0.5">
                        {app.label}
                      </div>
                      <div className="text-[9px] text-slate-600 dark:text-slate-300 font-medium">
                        {app.desc}
                      </div>
                    </div>
                    {app.disabled && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"
                        title="Coming soon"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* [MỚI] NÚT SCROLL TO TOP */}
          <button
            onClick={scrollToTop}
            className={`
              absolute bottom-20 right-6  p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-300 z-50
              ${
                showScrollTop && isWindowHovered && !isSearchOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10 pointer-events-none"
              }
            `}
            title="Scroll to Top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      )}

      {/* --- SEARCH MODAL (NON-BLOCKING) --- */}
      {isSearchOpen && (
        // 1. pointer-events-none: Cho phép click xuyên qua vùng trống
        // 2. Bỏ bg-slate-900 và backdrop-blur để nhìn rõ bên dưới
        // 3. Đổi items-center thành items-start pt-24 để thanh search nằm trên cao, không che app giữa màn hình
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pointer-events-none animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 m-4 border border-slate-200 dark:border-slate-700 pointer-events-auto ring-1 ring-black/5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400" size={20} />
              <input
                autoFocus // Tự động focus khi mở
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={handleInputKeyDown}
                placeholder="Gõ tên ứng dụng..."
                className="w-full h-12 pl-10 pr-10 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setHighlightedIds([]);
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* --- LIST KẾT QUẢ TÌM KIẾM --- */}
            {searchResults.length > 0 ? (
              <div className="mt-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0 max-h-[50vh]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kết quả ({searchResults.length})
                </div>
                <div className="space-y-1">
                  {searchResults.map((app) => {
                    const isHidden = hiddenAppIds.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleLaunchApp(app.id)}
                        disabled={app.disabled as boolean}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all group text-left
                            ${
                              app.disabled
                                ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
                                : "hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                            }
                        `}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${app.color}`}
                        >
                          <app.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {app.label}
                            </span>
                            {isHidden && (
                              <span
                                className="flex items-center gap-1 text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400"
                                title="Ứng dụng này đang bị ẩn"
                              >
                                <EyeOff size={10} /> Ẩn
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {app.desc}
                          </div>
                        </div>
                        {!app.disabled && (
                          <ChevronLeft
                            size={16}
                            className="text-slate-300 group-hover:text-indigo-400 rotate-180 transition-colors"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="mt-8 mb-4 text-center text-slate-400 text-xs">
                Không tìm thấy ứng dụng nào khớp với "{searchQuery}"
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium">
                <span>Tìm thấy tất cả ứng dụng</span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px] border border-slate-300 dark:border-slate-600">
                    Esc
                  </kbd>{" "}
                  để đóng
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MINI PLAYER */}
      {playlist.length > 0 &&
        activeApp !== "music" &&
        activeApp !== "settings" &&
        activeApp !== "license" &&
        activeApp !== "about" &&
        activeApp !== "calendar" &&
        activeApp !== "share" &&
        activeApp !== "record" &&
        activeApp !== "system" &&
        activeApp !== "speedtest" &&
        activeApp !== "shutdown" &&
        activeApp !== "code" &&
        activeApp !== "git" &&
        activeApp !== "budget" &&
        activeApp !== "regex" &&
        activeApp !== "json_tools" &&
        activeApp !== "design" &&
        activeApp !== "erd" &&
        activeApp !== "database" &&
        activeApp !== "devops" &&
        activeApp !== "portfolio" &&
        activeApp !== "loan" &&
        activeApp !== "breathe" &&
        activeApp !== "reader" &&
        activeApp !== "sign" &&
        activeApp !== "wheel" &&
        activeApp !== "mystic" &&
        activeApp !== "dice" &&
        activeApp !== "goals" &&
        activeApp !== "table" &&
        activeApp !== "fb-tools" &&
        activeApp !== "ai" &&
        activeApp !== "tester" &&
        activeApp !== "testcase" &&
        activeApp !== "bug-report" &&
        activeApp !== "library" &&
        activeApp !== "piano" &&
        activeApp !== "rpg" &&
        activeApp !== "def" &&
        activeApp !== "pvz" &&
        activeApp !== "config" &&
        activeApp !== "manga" &&
        activeApp !== "novel" &&
        activeApp !== "uibuilder" &&
        activeApp !== "space3d" &&
        activeApp !== "anim" &&
        activeApp !== "clock" &&
        activeApp !== "photo-booth" &&
        activeApp !== "phone" &&
        activeApp !== "mirror" &&
        activeApp !== "hourglass" &&
        activeApp !== "excel" &&
        activeApp !== "word" &&
        activeApp !== "gen" &&
        activeApp !== "qrcode" && (
          <div
            className={`transition-opacity duration-500 ${isWindowHovered || !autoHideUI ? "opacity-100" : "opacity-0"}`}
          >
            <MiniPlayer />
          </div>
        )}
    </div>
  );
};
