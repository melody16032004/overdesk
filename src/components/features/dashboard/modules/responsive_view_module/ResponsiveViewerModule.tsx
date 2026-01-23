import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  RotateCcw,
  MoveHorizontal,
  MoveVertical,
  Globe,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Maximize,
  Scan,
  ChevronLeft,
  ChevronRight,
  Camera,
  RefreshCw,
  Layout,
  Smartphone as PhoneIcon,
  Monitor as DesktopIcon,
  Tablet as TabletIcon,
  Check,
  Scaling,
  Save,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import {
  DEFAULT_DEVICES,
  STORAGE_KEY_CUSTOM,
  STORAGE_KEY_SAVED_DEVICES,
  WEB_URL,
} from "./constants/responsive_const";
import { Device, DeviceType } from "./types/responsive_type";

export const ResponsiveViewerModule = () => {
  // --- STATE ---
  const [url, setUrl] = useState(WEB_URL);
  const [inputUrl, setInputUrl] = useState(WEB_URL);
  const [selectedDevice, setSelectedDevice] = useState<Device>(
    DEFAULT_DEVICES[1],
  );
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  // Transform State
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [showFrame, setShowFrame] = useState(true);
  const [isCustom, setIsCustom] = useState(false);

  // [FIX] Thêm Type Definition cho useState để tránh lỗi 'implicitly any'
  const [customSize, setCustomSize] = useState<{
    width: number;
    height: number;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
      return saved ? JSON.parse(saved) : { width: 375, height: 667 };
    } catch {
      return { width: 375, height: 667 };
    }
  });

  // Saved Devices State
  const [savedDevices, setSavedDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_DEVICES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<DeviceType | "all">(
    "all",
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- EFFECTS ---
  useEffect(() => {
    if (isCustom) {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customSize));
    }
  }, [customSize, isCustom]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_SAVED_DEVICES,
      JSON.stringify(savedDevices),
    );
  }, [savedDevices]);

  // --- ACTIONS ---
  const handleLoadUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    if (finalUrl.includes("localhost") && !finalUrl.startsWith("http://")) {
      finalUrl = finalUrl.replace("https://", "http://");
    }

    setInputUrl(finalUrl);
    if (finalUrl !== url) {
      setIsLoading(true);
      setUrl(finalUrl);
    }
  };

  const handleDeviceSelect = (device: Device) => {
    setIsCustom(false);
    setSelectedDevice(device);
    setPan({ x: 0, y: 0 });
    handleZoomToFit(device.width, device.height);
  };

  const handleZoomToFit = (w?: number, h?: number) => {
    if (!containerRef.current) return;
    const targetW = w || (isCustom ? customSize.width : selectedDevice.width);
    const targetH = h || (isCustom ? customSize.height : selectedDevice.height);

    const availableW = containerRef.current.clientWidth - 100;
    const availableH = containerRef.current.clientHeight - 100;

    const scaleW =
      availableW / (orientation === "portrait" ? targetW : targetH);
    const scaleH =
      availableH / (orientation === "portrait" ? targetH : targetW);

    const newScale = Math.min(scaleW, scaleH, 1);

    setScale(parseFloat(newScale.toFixed(2)));
    setPan({ x: 0, y: 0 });
  };

  const switchToCustom = () => {
    setIsCustom(true);
  };

  const handleSavePreset = () => {
    if (!newDeviceName.trim()) return;
    const newDevice: Device = {
      id: `custom_${Date.now()}`,
      name: newDeviceName,
      width: customSize.width,
      height: customSize.height,
      type: "custom",
      // icon: HardDriveDownload,
    };
    setSavedDevices((prev) => [...prev, newDevice]);
    setSaveModalOpen(false);
    setNewDeviceName("");
    handleDeviceSelect(newDevice);
  };

  const handleDeletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedDevices((prev) => prev.filter((d) => d.id !== id));
    if (selectedDevice.id === id) {
      handleDeviceSelect(DEFAULT_DEVICES[0]);
    }
  };

  // --- MOUSE INTERACTION ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => {
      const newScale = Math.min(Math.max(0.1, s + delta), 3);
      return parseFloat(newScale.toFixed(2));
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      handleZoomToFit();
      return;
    }
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // --- COMPUTED ---
  const displayW = isCustom
    ? customSize.width
    : orientation === "portrait"
      ? selectedDevice.width
      : selectedDevice.height;
  const displayH = isCustom
    ? customSize.height
    : orientation === "portrait"
      ? selectedDevice.height
      : selectedDevice.width;

  const filteredDevices = useMemo(() => {
    const all = [...savedDevices, ...DEFAULT_DEVICES];
    if (activeCategory === "all") return all;
    if (activeCategory === "custom") return savedDevices;
    return all.filter((d) => d.type === activeCategory);
  }, [activeCategory, savedDevices]);

  return (
    <div className="h-full flex flex-col bg-[#09090b] text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* 1. HEADER BAR */}
      <header className="h-16 border-b border-white/10 bg-[#09090b] flex items-center px-4 gap-4 shrink-0 z-30">
        <div className="flex items-center gap-2 font-bold text-white text-lg tracking-tight mr-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layout size={18} className="text-white" />
          </div>
          <span className="hidden sm:inline">Resp.Viewer</span>
        </div>

        <form
          onSubmit={handleLoadUrl}
          className="flex-1 max-w-2xl relative group"
        >
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {isLoading ? (
              <RefreshCw className="animate-spin text-indigo-400" size={14} />
            ) : (
              <Globe
                className="text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                size={14}
              />
            )}
          </div>
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono shadow-sm"
            placeholder="Enter website URL..."
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button
              type="submit"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              setIsLoading(true);
              const u = url;
              setUrl("");
              setTimeout(() => setUrl(u), 50);
            }}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Reload Frame"
          >
            <RotateCcw size={18} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <ExternalLink size={18} />
            <span className="hidden lg:inline">Open New Tab</span>
          </a>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR */}
        <aside
          className={clsx(
            "w-72 bg-[#0c0a09] border-r border-white/10 flex flex-col transition-all duration-300 absolute z-20 h-full lg:relative",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-none",
          )}
        >
          {/* Tabs */}
          <div className="p-2 grid grid-cols-5 gap-1 border-b border-white/5">
            {[
              { id: "all", icon: Layout },
              { id: "custom", icon: Scan },
              { id: "mobile", icon: PhoneIcon },
              { id: "tablet", icon: TabletIcon },
              { id: "desktop", icon: DesktopIcon },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={clsx(
                  "p-2 rounded-lg flex items-center justify-center transition-all",
                  activeCategory === cat.id
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
                )}
                title={cat.id}
              >
                <cat.icon size={16} />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {/* Mode Custom Button */}
            <button
              onClick={switchToCustom}
              className={clsx(
                "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all border group",
                isCustom
                  ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-100"
                  : "bg-transparent border-transparent hover:bg-white/5 text-slate-400",
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:text-white transition-colors">
                <Scan size={16} />
              </div>
              <div>
                <div className="text-xs font-bold">Custom Size</div>
                <div className="text-[10px] opacity-60 font-mono">
                  {customSize.width} x {customSize.height}
                </div>
              </div>
              {isCustom && (
                <Check size={14} className="ml-auto text-indigo-400" />
              )}
            </button>

            {/* Section: Saved Presets */}
            {savedDevices.length > 0 && activeCategory === "all" && (
              <div className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Saved Presets
              </div>
            )}

            {/* Devices Loop */}
            {filteredDevices.map((device) => {
              const isSelected = !isCustom && selectedDevice.id === device.id;

              // [FIX] Logic chọn Icon an toàn:
              // 1. Ưu tiên icon có sẵn (đối với DEFAULT_DEVICES)
              // 2. Nếu không có (Saved Presets), tự động chọn icon dựa trên type
              let Icon = Scan; // Icon mặc định

              switch (device.type) {
                case "mobile":
                  Icon = PhoneIcon;
                  break;
                case "tablet":
                  Icon = TabletIcon;
                  break;
                case "desktop":
                  Icon = DesktopIcon;
                  break;
                case "custom":
                  Icon = Scan;
                  break; // Icon cho custom preset
                default:
                  Icon = Scan;
              }
              return (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device)}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all border group relative",
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-100"
                      : "bg-transparent border-transparent hover:bg-white/5 text-slate-400",
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:text-white transition-colors">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{device.name}</div>
                    <div className="text-[10px] opacity-60 font-mono">
                      {device.width} x {device.height}
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="ml-auto text-indigo-400" />
                  )}

                  {/* Delete button for custom devices */}
                  {device.type === "custom" && (
                    <div
                      onClick={(e) => handleDeletePreset(e, device.id)}
                      className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* SIDEBAR TOGGLE */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 left-0 z-30 -translate-y-1/2 bg-[#18181b] border border-white/10 border-l-0 rounded-r-lg p-1 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {/* CANVAS */}
        <main
          className={clsx(
            "flex-1 bg-[#050505] relative flex flex-col min-w-0 overflow-hidden",
            isPanning ? "cursor-grabbing" : "cursor-default",
          )}
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Hints */}
          <div className="absolute top-4 right-4 pointer-events-none opacity-30 text-[10px] font-mono text-right hidden sm:block z-10">
            <div>Right-Click + Drag to Pan</div>
            <div>Scroll to Zoom</div>
            <div>Middle-Click to Auto Fit</div>
          </div>

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              transform: `translate(${pan.x % 40}px, ${pan.y % 40}px)`,
            }}
          />

          {/* TRANSFORM CONTAINER */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear origin-center will-change-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
          >
            <div
              className={clsx(
                "relative transition-all duration-300",
                showFrame && !isCustom && selectedDevice.type !== "desktop"
                  ? "bg-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-[8px] border-[#1f1f23]"
                  : "bg-white shadow-xl",
              )}
              style={{
                width: displayW,
                height: displayH,
                borderRadius:
                  showFrame && !isCustom
                    ? selectedDevice.type === "mobile"
                      ? 44
                      : selectedDevice.type === "tablet"
                        ? 24
                        : 8
                    : 0,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Notch */}
              {showFrame && !isCustom && selectedDevice.type === "mobile" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-1/3 bg-[#1f1f23] rounded-b-xl z-20 pointer-events-none flex justify-center items-center">
                  <div className="w-12 h-1 bg-black/50 rounded-full" />
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={url}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full bg-white block"
                style={{
                  borderRadius:
                    showFrame && !isCustom
                      ? selectedDevice.type === "mobile"
                        ? 36
                        : selectedDevice.type === "tablet"
                          ? 16
                          : 0
                      : 0,
                }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Viewer"
              />

              {/* Loading */}
              {isLoading && (
                <div className="absolute inset-0 bg-[#09090b] z-30 flex flex-col items-center justify-center rounded-[inherit]">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <div className="text-xs font-bold text-slate-500 animate-pulse">
                    LOADING PAGE...
                  </div>
                </div>
              )}

              {/* Size Label */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 translate-y-full px-3 py-1.5 bg-[#18181b]/90 backdrop-blur border border-white/10 rounded-full text-[10px] font-mono text-slate-400 whitespace-nowrap shadow-xl flex items-center gap-2 pointer-events-none">
                <span className="font-bold text-white">
                  {displayW} x {displayH}
                </span>
                <span className="w-px h-3 bg-white/10" />
                <span>{Math.round(scale * 100)}%</span>
              </div>
            </div>
          </div>

          {/* FLOATING TOOLBAR */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#18181b]/80 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
            {/* Custom Inputs */}
            {isCustom && (
              <>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1 mr-2 border border-white/5">
                  <input
                    type="number"
                    value={customSize.width}
                    onChange={(e) =>
                      setCustomSize((p: { width: number; height: number }) => ({
                        ...p,
                        width: +e.target.value,
                      }))
                    }
                    className="w-10 bg-transparent text-center text-xs font-bold text-white outline-none"
                  />
                  <span className="text-slate-600 text-xs">x</span>
                  <input
                    type="number"
                    value={customSize.height}
                    onChange={(e) =>
                      setCustomSize((p: { width: number; height: number }) => ({
                        ...p,
                        height: +e.target.value,
                      }))
                    }
                    className="w-10 bg-transparent text-center text-xs font-bold text-white outline-none"
                  />
                </div>
                {/* SAVE BUTTON */}
                <button
                  onClick={() => setSaveModalOpen(true)}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
                  title="Save as Preset"
                >
                  <Save size={16} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
              </>
            )}

            {/* [FIX] Typed parameter 'p' */}
            <button
              onClick={() =>
                setOrientation((p: "portrait" | "landscape") =>
                  p === "portrait" ? "landscape" : "portrait",
                )
              }
              disabled={isCustom}
              className={clsx(
                "p-2 rounded-xl transition-all",
                isCustom
                  ? "opacity-30"
                  : "hover:bg-white/10 text-slate-300 hover:text-white",
              )}
              title="Rotate Device"
            >
              {orientation === "portrait" ? (
                <MoveVertical size={18} />
              ) : (
                <MoveHorizontal size={18} />
              )}
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <ZoomOut size={18} />
            </button>
            <div
              className="w-12 text-center text-xs font-bold text-indigo-400 cursor-pointer hover:underline"
              onClick={() => handleZoomToFit()}
              title="Reset Zoom & Pan"
            >
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <ZoomIn size={18} />
            </button>

            <button
              onClick={() => handleZoomToFit()}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
              title="Auto Fit (Middle Click)"
            >
              <Scaling size={18} />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={() => setShowFrame(!showFrame)}
              className={clsx(
                "p-2 rounded-xl transition-all",
                showFrame
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-white/10 text-slate-300",
              )}
              title="Toggle Device Frame"
            >
              <Maximize size={18} />
            </button>

            <button
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
              title="Screenshot (Coming Soon)"
            >
              <Camera size={18} />
            </button>
          </div>
        </main>
      </div>

      {/* 3. SAVE PRESET MODAL */}
      {isSaveModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">
              Save Custom Preset
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Save current size ({customSize.width}x{customSize.height}) to your
              library.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. My Phone, Test Monitor..."
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
