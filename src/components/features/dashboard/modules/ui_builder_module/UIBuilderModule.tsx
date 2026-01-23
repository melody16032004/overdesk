import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Copy,
  Code,
  Save,
  Trash2,
  Check,
  RefreshCcw,
  LayoutTemplate,
  MousePointer2,
  Box,
  Type,
  Square,
  Wand2,
  Sun,
  Moon,
  Grid,
  X,
  Menu,
  AlertCircle,
  BoxSelect,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Edit3,
  AlertTriangle,
  FilePlus,
  Layers,
  Terminal,
  Lock,
  Move,
  Maximize2,
  Minimize2,
} from "lucide-react";
import clsx from "clsx";
import {
  ComponentConfig,
  ComponentType,
  LayoutMode,
  Radius,
  Shadow,
  Size,
} from "./types/ui_builder_type";
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SIZES,
  STORAGE_KEY,
} from "./constants/ui_builder_const";
import {
  formatCode,
  generateClasses,
  generateReactCode,
} from "./helper/ui_builder_helper";
import { ControlSection } from "./components/ControlSection";
import { useToastStore } from "../../../../../stores/useToastStore";

export const UIBuilderModule = () => {
  // ==================================================================================
  // 1. STATE MANAGEMENT
  // ==================================================================================

  // --- UI & Tabs ---
  const [activeTab, setActiveTab] = useState<"editor" | "library">("editor");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark");
  const [showGrid, setShowGrid] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("vertical");
  const [splitRatio, setSplitRatio] = useState(80);
  const { showToast } = useToastStore();

  // --- Data & Storage ---
  const [savedComponents, setSavedComponents] = useState<ComponentConfig[]>(
    () => {
      try {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(STORAGE_KEY);
          return saved ? JSON.parse(saved) : [];
        }
        return [];
      } catch (e) {
        showToast(`Lỗi đọc dữ liệu LocalStorage: ${e}`, "error");
        return [];
      }
    },
  );

  // --- Interaction (Pan/Zoom) ---
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInteractMode, setIsInteractMode] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // --- Component Configuration ---
  const [config, setConfig] = useState<ComponentConfig>({
    id: "draft",
    name: "New Component",
    type: "custom",
    text: "Content here...",
    color: "slate",
    variant: "solid",
    size: "md",
    radius: "md",
    shadow: "sm",
    fullWidth: false,
    withIcon: true,
    disabled: false,
    customClasses: "",
  });

  // --- Code Generation & Editing ---
  const [generatedCode, setGeneratedCode] = useState("");
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [copied, setCopied] = useState(false);

  // --- Modals ---
  const [modalType, setModalType] = useState<
    "save_option" | "delete" | "edit_info" | null
  >(null);
  const [targetItem, setTargetItem] = useState<ComponentConfig | null>(null);
  const [inputName, setInputName] = useState("");

  // ==================================================================================
  // 2. EFFECTS
  // ==================================================================================

  // Init Tailwind
  useEffect(() => {
    if (!document.getElementById("tw-cdn")) {
      const script = document.createElement("script");
      script.id = "tw-cdn";
      script.src = "https://cdn.tailwindcss.com";
      script.async = true;
      script.onload = () => {
        if ((window as any).tailwind)
          (window as any).tailwind.config = { darkMode: "class" };
      };
      document.head.appendChild(script);
    }
  }, []);

  // Handle Resize Window
  useEffect(() => {
    const handleResize = () =>
      setLayoutMode(window.innerWidth >= 1024 ? "horizontal" : "vertical");
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Generate Code from Config
  useEffect(() => {
    if (config.type === "custom" && isManualEditing) return;
    const newClasses = generateClasses(config);
    if (!isManualEditing) {
      const rawCode = generateReactCode(config);
      setGeneratedCode(formatCode(rawCode));
    } else {
      setGeneratedCode((prevCode) =>
        prevCode.replace(
          /(className=["'])([\s\S]*?)(["'])/,
          `$1${newClasses}$3`,
        ),
      );
    }
  }, [config]);

  // Update Preview HTML
  useEffect(() => {
    updateHTMLPreview(generatedCode);
  }, [generatedCode]);

  // Handle Split Resize
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const container = document.getElementById("split-wrapper");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let newRatio;
      if (layoutMode === "horizontal")
        newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      else newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      if (newRatio > 20 && newRatio < 80) setSplitRatio(newRatio);
    };
    const handleResizeUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeUp);
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeUp);
    };
  }, [layoutMode]);

  // ==================================================================================
  // 3. HELPER FUNCTIONS
  // ==================================================================================

  const updateHTMLPreview = (code: string) => {
    try {
      if (!code) return;
      let clean = code
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/<>/g, "<div>")
        .replace(/<\/>/g, "</div>");
      clean = clean
        .replace(/<React\.Fragment>/g, "<div>")
        .replace(/<\/React\.Fragment>/g, "</div>");
      clean = clean.replace(/className=(["'])([\s\S]*?)\1/g, 'class="$2"');
      clean = clean
        .replace(/on[A-Z][a-zA-Z]+=\{[^}]+\}/g, "")
        .replace(/style=\{\{[^}]+\}\}/g, "");
      clean = clean
        .replace(/\{children\}/g, "Custom Content")
        .replace(/>\s*\{[^}]+\}\s*</g, "><");
      setPreviewHTML(clean);
    } catch (e) {
      console.error("Preview Error:", e);
    }
  };

  const handleSmartReset = () => {
    if (!containerRef.current || !contentRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentWidth = contentRef.current.offsetWidth || 300;
    const contentHeight = contentRef.current.offsetHeight || 200;
    const padding = 80;
    const scaleX = (containerRect.width - padding) / contentWidth;
    const scaleY = (containerRect.height - padding) / contentHeight;
    setTransform({ x: 0, y: 0, scale: Math.min(scaleX, scaleY, 1) });
  };

  // ==================================================================================
  // 4. EVENT HANDLERS
  // ==================================================================================

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isInteractMode && e.button === 0) return;
    if (e.button === 2 || (e.button === 0 && !isInteractMode)) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - transform.x,
        y: e.clientY - transform.y,
      };
    } else if (e.button === 1) {
      e.preventDefault();
      handleSmartReset();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      }));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (isInteractMode) return;
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.1, prev.scale + scaleAmount), 5),
    }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isInteractMode) {
      e.preventDefault();
      return false;
    }
  };

  // ==================================================================================
  // 5. CRUD ACTIONS
  // ==================================================================================

  const requestSave = () => {
    setInputName(config.name);
    setModalType("save_option");
  };
  const requestDelete = (comp: ComponentConfig) => {
    setTargetItem(comp);
    setModalType("delete");
  };
  const requestEditInfo = (comp: ComponentConfig) => {
    setTargetItem(comp);
    setInputName(comp.name);
    setModalType("edit_info");
  };

  const executeSaveAsNew = () => {
    if (!inputName.trim()) return;
    const newId = Date.now().toString();
    const payload: ComponentConfig = {
      ...config,
      id: newId,
      name: inputName,
      customCode: isManualEditing ? generatedCode : undefined,
    };
    const updatedList = [payload, ...savedComponents];
    setSavedComponents(updatedList);
    setConfig((prev) => ({ ...prev, id: newId, name: inputName }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setModalType(null);
  };

  const executeOverwrite = () => {
    if (config.id === "draft") return;
    const payload: ComponentConfig = {
      ...config,
      name: inputName,
      customCode: isManualEditing ? generatedCode : undefined,
    };
    const updatedList = savedComponents.map((c) =>
      c.id === config.id ? payload : c,
    );
    setSavedComponents(updatedList);
    setConfig((prev) => ({ ...prev, name: inputName }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setModalType(null);
  };

  const executeDelete = () => {
    if (!targetItem) return;
    const updated = savedComponents.filter((c) => c.id !== targetItem.id);
    setSavedComponents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setModalType(null);
    if (config.id === targetItem.id) setConfig({ ...config, id: "draft" });
  };

  const executeEditInfo = () => {
    if (!targetItem || !inputName.trim()) return;
    const updated = savedComponents.map((c) =>
      c.id === targetItem.id ? { ...c, name: inputName } : c,
    );
    setSavedComponents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (config.id === targetItem.id)
      setConfig((prev) => ({ ...prev, name: inputName }));
    setModalType(null);
  };

  const handleLoad = (comp: ComponentConfig) => {
    if (comp.customCode) {
      setGeneratedCode(comp.customCode);
      setIsManualEditing(true);
      updateHTMLPreview(comp.customCode);
      setConfig(comp);
    } else {
      setConfig(comp);
      setIsManualEditing(false);
    }
    setActiveTab("editor");
  };

  const handleRandomize = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomVariant = ["solid", "outline", "ghost", "soft"][
      Math.floor(Math.random() * 4)
    ] as any;
    setConfig((prev) => ({
      ...prev,
      color: randomColor,
      variant: randomVariant,
    }));
  };

  // ==================================================================================
  // 6. RENDER
  // ==================================================================================
  return (
    <div className="h-full flex flex-col bg-[#09090b] text-slate-200 font-sans overflow-hidden relative">
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-[#09090b] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Palette size={18} className="text-white" />
          </div>
          <div className="sm:block">
            <div className="flex flex-col items-start justify-center leading-tight">
              <span className="font-bold text-xs ">UI Factory </span>
              <span className="font-normal opacity-50 bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
                Ultimate
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "library" && (
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 mr-2">
              <button
                onClick={() => setIsInteractMode(false)}
                className={clsx(
                  "p-1.5 rounded-md transition-all",
                  !isInteractMode
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white",
                )}
                title="Chế độ Di chuyển (Pan/Zoom)"
              >
                <Move size={16} />
              </button>
              <button
                onClick={() => setIsInteractMode(true)}
                className={clsx(
                  "p-1.5 rounded-md transition-all",
                  isInteractMode
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white",
                )}
                title="Chế độ Tương tác (Click)"
              >
                <MousePointer2 size={16} />
              </button>
            </div>
          )}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveTab("editor")}
              className={clsx(
                "px-3 py-1 rounded-md text-xs font-bold transition-all",
                activeTab === "editor"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={clsx(
                "px-3 py-1 rounded-md text-xs font-bold transition-all",
                activeTab === "library"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Library
            </button>
          </div>

          {activeTab !== "library" && (
            <button
              disabled={isFullscreen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === "editor" && (
          <div
            className={clsx(
              "w-80 bg-[#09090b] border-r border-white/10 flex flex-col transition-all duration-300 z-[100] absolute inset-y-0 left-0",
              // LOGIC MỚI: Nếu Fullscreen -> Ẩn ngay lập tức
              isFullscreen
                ? "-translate-x-full hidden"
                : clsx(
                    "lg:static", // Chỉ chiếm vị trí trong layout (static) khi KHÔNG Fullscreen
                    isMobileMenuOpen
                      ? "translate-x-0 shadow-2xl"
                      : "-translate-x-full lg:translate-x-0",
                  ),
            )}
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <span className="font-bold text-sm">Cài đặt</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              {isManualEditing && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />{" "}
                  {config.type === "custom"
                    ? "Custom Mode: Sidebar bị khóa."
                    : "Sidebar chỉ cập nhật Class."}
                </div>
              )}
              <ControlSection title="Component">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "custom", icon: BoxSelect, label: "Custom" },
                    { id: "button", icon: MousePointer2, label: "Button" },
                    { id: "input", icon: Type, label: "Input" },
                    { id: "card", icon: LayoutTemplate, label: "Card" },
                    { id: "badge", icon: Square, label: "Badge" },
                    { id: "alert", icon: Layers, label: "Alert" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setConfig({ ...config, type: t.id as ComponentType });
                        setIsManualEditing(false);
                      }}
                      className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                        config.type === t.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                          : "bg-white/5 border-transparent hover:bg-white/10 text-slate-400",
                      )}
                    >
                      <t.icon size={16} />
                      <span className="text-[10px] font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </ControlSection>
              {config.type !== "custom" ? (
                <>
                  <ControlSection title="Custom Code">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        <Terminal size={12} /> TAILWIND CLASSES
                      </label>
                      <textarea
                        value={config.customClasses || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customClasses: e.target.value,
                          })
                        }
                        placeholder="e.g. w-[300px] border-l-4 rotate-3"
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 font-mono resize-y min-h-[80px]"
                      />
                    </div>
                  </ControlSection>
                  <ControlSection title="Styles">
                    <div className="space-y-4">
                      {(config.type === "button" ||
                        config.type === "badge") && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500">
                            VARIANT
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {["solid", "outline", "ghost", "soft"].map((v) => (
                              <button
                                key={v}
                                onClick={() =>
                                  setConfig({ ...config, variant: v as any })
                                }
                                className={clsx(
                                  "py-1.5 text-xs font-bold rounded-lg capitalize border",
                                  config.variant === v
                                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                    : "border-white/5 bg-white/5 text-slate-400",
                                )}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>SIZE</span>
                          <span>{config.size.toUpperCase()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={Object.keys(SIZES).indexOf(config.size)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              size: Object.keys(SIZES)[
                                Number(e.target.value)
                              ] as Size,
                            })
                          }
                          className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>RADIUS</span>
                          <span>{config.radius.toUpperCase()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={Object.keys(RADIUS).indexOf(config.radius)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              radius: Object.keys(RADIUS)[
                                Number(e.target.value)
                              ] as Radius,
                            })
                          }
                          className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>SHADOW</span>
                          <span>{config.shadow.toUpperCase()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          value={Object.keys(SHADOWS).indexOf(config.shadow)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              shadow: Object.keys(SHADOWS)[
                                Number(e.target.value)
                              ] as Shadow,
                            })
                          }
                          className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </ControlSection>
                  <ControlSection title="Color">
                    <div className="grid grid-cols-6 gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setConfig({ ...config, color: c })}
                          className={clsx(
                            "w-8 h-8 rounded-full transition-all duration-300",
                            `bg-${c}-500`,
                            config.color === c
                              ? "ring-2 ring-white scale-110 shadow-lg"
                              : "opacity-40 hover:opacity-100 hover:scale-105",
                          )}
                          title={c}
                        />
                      ))}
                    </div>
                  </ControlSection>
                </>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                  <Lock size={24} className="mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">
                    Chế độ Custom: Chỉnh code trực tiếp bên dưới.
                  </p>
                </div>
              )}
            </div>
            {config.type !== "custom" && (
              <div className="p-4 border-t border-white/10 bg-[#09090b]">
                <button
                  onClick={handleRandomize}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                  <Wand2 size={14} /> Magic Randomize
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "editor" && (
          <div
            id="split-wrapper"
            className={clsx(
              "flex-1 flex overflow-hidden bg-[#0c0a09] relative",
              layoutMode === "vertical" ? "flex-col" : "flex-row",
            )}
          >
            <div
              ref={containerRef} // [NEW] Gắn Ref để đo kích thước vùng chứa
              className={clsx(
                "relative flex-1 overflow-hidden transition-colors duration-500",
                // [NEW] Logic Fullscreen: Nếu full, nó sẽ đè lên mọi thứ bằng fixed z-100
                isFullscreen ? "fixed inset-0 z-[100]" : "",
                isDragging
                  ? "cursor-grabbing"
                  : isInteractMode
                    ? "cursor-auto"
                    : "cursor-grab",
              )}
              style={
                isFullscreen
                  ? { flex: `0 0 100%` }
                  : { flex: `0 0 ${splitRatio}%` }
              }
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={handleContextMenu}
            >
              <div
                className={clsx(
                  "absolute inset-0 pointer-events-none transition-colors duration-500",
                  previewMode === "dark" ? "bg-[#0c0a09]" : "bg-slate-100",
                )}
              >
                {showGrid && (
                  <div
                    className={clsx(
                      "absolute inset-0 opacity-20",
                      previewMode === "dark" ? "opacity-10" : "opacity-30",
                    )}
                    style={{
                      backgroundImage: `radial-gradient(${
                        previewMode === "dark" ? "#fff" : "#000"
                      } 1px, transparent 1px)`,
                      backgroundSize: "24px 24px",
                    }}
                  ></div>
                )}
              </div>

              <div
                className={clsx(
                  "absolute top-1/2 left-1/2 transition-transform duration-75 origin-center flex items-center justify-center",
                  previewMode === "dark" && "dark",
                  !isInteractMode
                    ? "pointer-events-none"
                    : "pointer-events-auto",
                )}
                style={{
                  transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) e.stopPropagation();
                }}
              >
                {/* [NEW] Gắn Ref vào div bọc nội dung để đo kích thước thật */}
                <div ref={contentRef} className="w-max h-max">
                  {isManualEditing && previewHTML ? (
                    <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
                  )}
                </div>
              </div>

              {/* TOOLBAR */}
              {showToolbar && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl animate-in slide-in-from-right-4 pointer-events-auto">
                  {/* [NEW] Full Screen Toggle */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={clsx(
                      "p-2 rounded-lg transition-colors text-white/50 hover:bg-white/10 hover:text-white",
                      isFullscreen && "text-indigo-400 bg-indigo-500/10",
                    )}
                    title={
                      isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize2 size={14} />
                    ) : (
                      <Maximize2 size={14} />
                    )}
                  </button>
                  <div className="h-[1px] w-full bg-white/10 my-0.5"></div>

                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      showGrid
                        ? "bg-indigo-500 text-white"
                        : "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                    title="Lưới"
                  >
                    <Grid size={14} />
                  </button>
                  <div className="h-[1px] w-full bg-white/10 my-0.5"></div>
                  <button
                    onClick={() => setPreviewMode("light")}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      previewMode === "light"
                        ? "bg-white text-black"
                        : "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                    title="Sáng"
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewMode("dark")}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      previewMode === "dark"
                        ? "bg-indigo-500 text-white"
                        : "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                    title="Tối"
                  >
                    <Moon size={14} />
                  </button>
                  <div className="h-[1px] w-full bg-white/10 my-0.5"></div>
                  <button
                    onClick={() =>
                      setTransform((prev) => ({
                        ...prev,
                        scale: Math.min(prev.scale + 0.1, 4),
                      }))
                    }
                    className="p-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                    title="Phóng to"
                  >
                    <ZoomIn size={14} />
                  </button>

                  {/* [NEW] Smart Reset Button */}
                  <button
                    onClick={handleSmartReset}
                    className="p-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white group relative"
                    title="Reset & Auto Fit (Chuột giữa)"
                  >
                    <RotateCcw size={14} />
                    <span className="absolute right-full mr-2 bg-black px-1.5 py-0.5 rounded text-[9px] opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {Math.round(transform.scale * 100)}%
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      setTransform((prev) => ({
                        ...prev,
                        scale: Math.max(prev.scale - 0.1, 0.2),
                      }))
                    }
                    className="p-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                    title="Thu nhỏ"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <div className="h-[1px] w-full bg-white/10 my-0.5"></div>
                  <button
                    onClick={() => setShowToolbar(false)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                    title="Ẩn Menu"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              {!showToolbar && (
                <button
                  onClick={() => setShowToolbar(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-l-xl text-white shadow-lg hover:pr-3 transition-all z-50"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>

            <div
              className={clsx(
                "bg-[#1e293b] flex items-center justify-center hover:bg-indigo-500 transition-colors z-30 group",
                layoutMode === "horizontal"
                  ? "w-1 cursor-col-resize h-full"
                  : "h-1 cursor-row-resize w-full",
              )}
              onMouseDown={() => {
                isResizing.current = true;
                document.body.style.cursor =
                  layoutMode === "horizontal" ? "col-resize" : "row-resize";
              }}
            />

            <div className="flex-1 bg-[#0a0a0a] flex flex-col min-h-0 min-w-0">
              <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Code size={14} />{" "}
                  {isManualEditing ? "Editing Code" : "Generated Code"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsManualEditing(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[10px] font-bold transition-colors"
                  >
                    <RefreshCcw size={12} /> Reset
                  </button>
                  <button
                    onClick={requestSave}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30 rounded text-[10px] font-bold transition-colors"
                  >
                    <Save size={12} /> LƯU
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded text-[10px] font-bold transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} COPY
                  </button>
                </div>
              </div>
              <div className="flex-1 relative group">
                <textarea
                  value={generatedCode}
                  onChange={(e) => {
                    setGeneratedCode(e.target.value);
                    setIsManualEditing(true);
                  }}
                  onBlur={() => setGeneratedCode(formatCode(generatedCode))}
                  className="w-full h-full bg-[#0a0a0a] text-slate-300 font-mono text-xs p-4 outline-none resize-none selection:bg-indigo-500/30 leading-relaxed border-none focus:ring-0"
                  spellCheck={false}
                />
                <div className="absolute top-2 right-4 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity">
                  <Sparkles size={16} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
            {/* --- LIBRARY HEADER & SEARCH --- */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Thư viện của bạn
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Quản lý và tái sử dụng các component đã lưu.
                  </p>
                </div>
                <div className="text-xs font-medium px-3 py-1 bg-white/5 rounded-full text-slate-400 border border-white/5">
                  {savedComponents.length} items
                </div>
              </div>

              {/* Search Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm component..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-[#18181b] text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-black/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* --- COMPONENT LIST --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
              {savedComponents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Box size={32} />
                  </div>
                  <p className="font-medium text-lg">Chưa có component nào</p>
                  <p className="text-sm">
                    Hãy tạo và lưu component đầu tiên của bạn!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {savedComponents.map((comp) => (
                    <div
                      key={comp.id}
                      // [UPDATE] Thêm onClick vào đây để click toàn bộ card
                      onClick={() => handleLoad(comp)}
                      className="group relative bg-[#18181b] hover:bg-[#1f1f23] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 flex flex-col overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer"
                    >
                      {/* Card Header & Actions */}
                      <div className="p-4 flex items-start justify-between gap-3 relative z-10">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-white truncate group-hover:text-indigo-400 transition-colors">
                            {comp.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={clsx(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                comp.type === "custom"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : "bg-white/5 text-slate-400 border border-white/5",
                              )}
                            >
                              {comp.type}
                            </span>
                            <span className="text-[10px] text-slate-500 capitalize">
                              • {comp.color}
                            </span>
                          </div>
                        </div>

                        {/* Action Menu (Giữ stopPropagation để không kích hoạt Load khi bấm Sửa/Xóa) */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestEditInfo(comp);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Đổi tên"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(comp);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Preview Area (Miniature) */}
                      <div className="flex-1 mx-4 mb-4 h-32 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden group-hover:border-indigo-500/20 transition-colors">
                        {/* Background Grid Pattern */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage:
                              "radial-gradient(#fff 1px, transparent 1px)",
                            backgroundSize: "8px 8px",
                          }}
                        ></div>

                        {/* Content Representation */}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          {comp.type === "custom" ? (
                            <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                              <Code
                                size={24}
                                className="mx-auto mb-2 text-indigo-500"
                              />
                              <span className="text-[10px] font-mono text-indigo-300">
                                Custom JSX Code
                              </span>
                            </div>
                          ) : (
                            <div
                              className={clsx(
                                "transform scale-75 origin-center pointer-events-none select-none",
                                `bg-${comp.color}-600`,
                                comp.variant === "outline" &&
                                  `bg-transparent border border-${comp.color}-600 text-${comp.color}-600`,
                                "px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg",
                              )}
                            >
                              {comp.text || "Preview"}
                            </div>
                          )}
                        </div>

                        {/* Load Button Overlay (Hiệu ứng Hover đẹp hơn) */}
                        <div className="absolute inset-0 bg-indigo-600/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <FilePlus size={14} /> CLICK ĐỂ MỞ
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalType === "save_option" && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Lưu Component</h3>
            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Tên Component
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid gap-3">
              {config.id !== "draft" && (
                <button
                  onClick={executeOverwrite}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-600/30 font-bold text-xs transition-all"
                >
                  <Save size={16} /> Cập nhật bản cũ (Ghi đè)
                </button>
              )}
              <button
                onClick={executeSaveAsNew}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                <FilePlus size={16} /> Lưu thành bản mới
              </button>
              <button
                onClick={() => setModalType(null)}
                className="py-2 text-xs text-slate-500 hover:text-slate-300 mt-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {modalType === "delete" && targetItem && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Xóa Component?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
              >
                Không
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
      {modalType === "edit_info" && targetItem && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Edit3 size={18} /> Đổi Tên
            </h3>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 mb-6 mt-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={executeEditInfo}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
