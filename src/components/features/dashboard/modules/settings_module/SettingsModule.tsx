import { useState, useRef, useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  Moon,
  Sun,
  Trash2,
  Github,
  Info,
  Check,
  Monitor,
  Download,
  Upload,
  Zap,
  Layout,
  AppWindow,
  MousePointer2,
  Image,
  Eye,
  MousePointerClick,
  Move,
  Loader2,
  ToggleRight,
  ToggleLeft,
  Maximize,
} from "lucide-react";
import { SectionHeader } from "./components/SectionHeader";
import { Switch } from "./components/Switch";
import { AppInfo } from "./components/AppInfo";
// import { CURSORS } from "./constants/setting_const";
import {
  compressImageSmart,
  fileToBase64,
  getBase64Size,
  resizeCursorImage,
} from "./helper/setting_helper";
import { useAppStore } from "../../../../../stores/useAppStore";
import { useDataStore } from "../../../../../stores/useDataStore";
import { useToastStore } from "../../../../../stores/useToastStore";
import { CursorType } from "./types/setting_type";
import { get, set } from "idb-keyval";

export const SettingsModule = () => {
  // --- A. STORE HOOKS ---
  const {
    theme,
    toggleTheme,
    opacity,
    setOpacity,
    timerSettings,
    multiWindowEnabled,
    toggleMultiWindow,
    customCursor,
    setCustomCursor,
    backgroundImage,
    setBackgroundImage,
    autoHideUI,
    toggleAutoHideUI,
  } = useAppStore();

  const { resetData, tasks, noteContent, importData } = useDataStore();
  const { showToast } = useToastStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const [rawFiles, setRawFiles] = useState<{
    normal: File | null;
    pointer: File | null;
    animated: File | null;
  }>({ normal: null, pointer: null, animated: null });

  // --- B. LOCAL STATE & REFS ---
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputNormalRef = useRef<HTMLInputElement>(null);
  const inputPointerRef = useRef<HTMLInputElement>(null);
  const inputAnimatedRef = useRef<HTMLInputElement>(null);

  // --- C. HANDLERS: DATA MANAGEMENT (Reset, Import, Export) ---

  const handleReset = () => {
    if (confirmReset) {
      resetData();
      setConfirmReset(false);
      showToast("All data has been wiped!", "error");
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ tasks, noteContent, timerSettings });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `overdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    showToast("Backup file downloaded!", "success", 3500);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importData(data);
        showToast("Data restored successfully!", "success");
      } catch (err) {
        showToast("Invalid backup file!", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleCursorUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: CursorType,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".ani")) {
      showToast(
        "Trình duyệt KHÔNG hỗ trợ file .ani. Hãy dùng .gif hoặc .png!",
        "error",
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("File quá lớn! Vui lòng chọn dưới 2MB.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Lưu file vào State (để dùng ngay)
      setRawFiles((prev) => ({ ...prev, [type]: file }));

      // 2. [MỚI] Lưu file gốc vào IndexedDB (để F5 không mất)
      await set(`cursor_raw_${type}`, file);

      // 3. Xử lý hiển thị (Logic cũ)
      let resultBase64 = "";
      if (type === "animated") {
        resultBase64 = await fileToBase64(file);
        showToast("Đã tải ảnh động (Giữ nguyên size gốc)", "success");
      } else {
        const currentSize = customCursor.size || 32;
        resultBase64 = await resizeCursorImage(file, currentSize);
        showToast(`Đã cập nhật ${type} cursor!`, "success");
      }

      setCustomCursor({ [type]: resultBase64 });
    } catch (error) {
      console.error(error);
      showToast("Lỗi xử lý file.", "error");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  // Xử lý thay đổi Size (cần debounce để tránh lag)
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setCustomCursor({ size: newSize });
  };

  // const isCustomCursor = !CURSORS.some((c) => c.css === cursorStyle);

  // --- D. HANDLERS: MEDIA & SYSTEM (Image, Window) ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cảnh báo nếu file gốc > 10MB
    if (file.size > 10 * 1024 * 1024) {
      showToast("Ảnh gốc rất lớn, đang xử lý tối ưu...", "info");
    }

    try {
      // 1. Nén lần đầu (chất lượng cao)
      let compressedBase64 = await compressImageSmart(file, 0.85);

      // 2. Kiểm tra kích thước sau nén
      const sizeInBytes = getBase64Size(compressedBase64);
      const SAFETY_LIMIT = 4.5 * 1024 * 1024; // 4.5 MB limit

      // 3. Nén mạnh hơn nếu vẫn quá to
      if (sizeInBytes > SAFETY_LIMIT) {
        console.warn("Ảnh vẫn lớn sau nén lần 1, áp dụng nén mạnh hơn.");
        compressedBase64 = await compressImageSmart(file, 0.65);
      }

      // 4. Lưu vào LocalStorage
      try {
        setBackgroundImage(compressedBase64);
        showToast("Đã cập nhật hình nền nét căng!", "success");
      } catch (storageError) {
        console.error(storageError);
        showToast(
          "Bộ nhớ đầy không thể lưu. Vui lòng chọn ảnh khác nhỏ hơn.",
          "error",
        );
      }
    } catch (error) {
      console.error("Lỗi xử lý ảnh:", error);
      showToast("Có lỗi khi xử lý ảnh này.", "error");
    }
  };

  const openExternalLink = async (url: string) => {
    try {
      const label = `ext-${Date.now()}`;
      new WebviewWindow(label, {
        url: url,
        title: "OverDesk Browser",
        width: 1000,
        height: 700,
        resizable: true,
        decorations: true,
        center: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // --- E. USEEFFECT ---
  useEffect(() => {
    // [FIX] Không return sớm nữa. Chúng ta sẽ tìm nguồn ảnh phù hợp bên dưới.

    const timer = setTimeout(async () => {
      // Xác định nguồn ảnh: Ưu tiên File gốc (rawFiles), nếu không có thì dùng ảnh trong Store (customCursor)
      const normalSource = rawFiles.normal || customCursor.normal;
      const pointerSource = rawFiles.pointer || customCursor.pointer;

      // Nếu cả 2 nguồn đều không có gì thì mới dừng
      if (!normalSource && !pointerSource) return;

      setIsProcessing(true);
      try {
        const updates: any = {};

        // Resize Normal
        if (normalSource) {
          updates.normal = await resizeCursorImage(
            normalSource,
            customCursor.size,
          );
        }

        // Resize Pointer
        if (pointerSource) {
          updates.pointer = await resizeCursorImage(
            pointerSource,
            customCursor.size,
          );
        }

        // Animated: KHÔNG RESIZE (để tránh mất animation)

        if (Object.keys(updates).length > 0) {
          setCustomCursor(updates);
        }
      } catch (error) {
        console.error("Auto resize error", error);
      } finally {
        setIsProcessing(false);
      }
    }, 100); // Debounce 100ms

    return () => clearTimeout(timer);

    // [QUAN TRỌNG] Thêm customCursor.normal/pointer vào dependency để effect nhận biết khi store thay đổi
  }, [customCursor.size, rawFiles, customCursor.normal, customCursor.pointer]);

  useEffect(() => {
    const restoreRawFiles = async () => {
      try {
        const normal = await get<File>("cursor_raw_normal");
        const pointer = await get<File>("cursor_raw_pointer");
        const animated = await get<File>("cursor_raw_animated");

        if (normal || pointer || animated) {
          setRawFiles({
            normal: normal || null,
            pointer: pointer || null,
            animated: animated || null,
          });
          console.log("♻️ Restored raw cursor files from DB");
        }
      } catch (error) {
        console.error("Failed to restore raw files:", error);
      }
    };
    restoreRawFiles();
  }, []);

  return (
    <div className="flex flex-col h-full gap-5 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pr-3">
      {/* --- SECTION: DISPLAY & SOUND --- */}
      <section className="animate-in slide-in-from-bottom-2 duration-300 delay-100">
        <SectionHeader icon={Layout} title="Display & Sound" />
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "bg-indigo-500 text-white"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Dark Mode
                </div>
                <div className="text-[10px] text-slate-400">
                  Adjust appearance
                </div>
              </div>
            </div>
            <Switch checked={theme === "dark"} onChange={toggleTheme} />
          </div>

          {/* Opacity Slider */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Monitor size={14} /> Window Opacity
              </span>
              <span className="text-xs font-bold text-indigo-500">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none pointer accent-indigo-500"
            />
          </div>

          {/* [MỚI] Auto-Hide UI Switch */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  autoHideUI
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                <Eye size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Auto-hide Interface
                </div>
                <div className="text-[10px] text-slate-400">
                  Hide icons when mouse leaves
                </div>
              </div>
            </div>
            <Switch checked={autoHideUI} onChange={toggleAutoHideUI} />
          </div>
        </div>
      </section>

      {/* --- SECTION: MULTI-WINDOW MODE --- */}
      <section className="animate-in slide-in-from-bottom-2 duration-300 delay-150">
        <SectionHeader icon={AppWindow} title="Multi-Window Mode" />
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  multiWindowEnabled
                    ? "bg-purple-500 text-white"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                <AppWindow size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Open in New Window
                </div>
                <div className="text-[10px] text-slate-400">
                  Launch apps in separate windows (Ctrl+F supported)
                </div>
              </div>
            </div>
            <Switch checked={multiWindowEnabled} onChange={toggleMultiWindow} />
          </div>
        </div>
      </section>

      {/* --- SECTION: CURSOR CUSTOMIZATION --- */}
      <section className="animate-in slide-in-from-bottom-2 duration-300 delay-250">
        <SectionHeader icon={MousePointer2} title="Cursor Customization" />
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 backdrop-blur-sm space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Maximize size={14} /> Cursor Size
                </span>
                <span className="text-xs font-bold text-indigo-500">
                  {customCursor.size}px
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="4"
                value={customCursor.size}
                onChange={handleSizeChange}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none pointer accent-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move
                  size={16}
                  className={
                    customCursor.enableAnimation
                      ? "text-indigo-500 animate-pulse"
                      : "text-slate-400"
                  }
                />
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Enable Animation
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Use animated cursor (GIF)
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setCustomCursor({
                    enableAnimation: !customCursor.enableAnimation,
                  })
                }
                className={`text-2xl transition-colors ${customCursor.enableAnimation ? "text-indigo-500" : "text-slate-600"}`}
              >
                {customCursor.enableAnimation ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Normal */}
            <div className="flex flex-col gap-2">
              <div
                onClick={() => inputNormalRef.current?.click()}
                className="relative h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-white/5 pointer flex flex-col items-center justify-center group transition-all"
              >
                {customCursor.normal ? (
                  <img
                    src={customCursor.normal}
                    alt="Normal"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <MousePointer2
                    size={24}
                    className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                  />
                )}
                <span className="text-[9px] text-slate-400 mt-2 font-medium group-hover:text-indigo-400">
                  Default (.png)
                </span>
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={inputNormalRef}
                className="hidden"
                accept="image/png,image/jpeg"
                onChange={(e) => handleCursorUpload(e, "normal")}
              />
            </div>
            {/* Animated */}
            <div className="flex flex-col gap-2">
              <div
                onClick={() => inputAnimatedRef.current?.click()}
                className={`relative h-24 rounded-xl border-2 border-dashed transition-all pointer flex flex-col items-center justify-center group ${customCursor.enableAnimation ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-white/5 opacity-60 hover:opacity-100"}`}
              >
                {customCursor.animated ? (
                  <img
                    src={customCursor.animated}
                    alt="Anim"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <Move
                    size={24}
                    className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                  />
                )}
                <span className="text-[9px] text-slate-400 mt-2 font-medium group-hover:text-indigo-400">
                  Animated (.gif)
                </span>
              </div>
              <input
                type="file"
                ref={inputAnimatedRef}
                className="hidden"
                accept="image/gif,image/png"
                onChange={(e) => handleCursorUpload(e, "animated")}
              />
            </div>
            {/* Pointer */}
            <div className="flex flex-col gap-2">
              <div
                onClick={() => inputPointerRef.current?.click()}
                className="relative h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-white/5 pointer flex flex-col items-center justify-center group transition-all"
              >
                {customCursor.pointer ? (
                  <img
                    src={customCursor.pointer}
                    alt="Pointer"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <MousePointerClick
                    size={24}
                    className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                  />
                )}
                <span className="text-[9px] text-slate-400 mt-2 font-medium group-hover:text-emerald-400">
                  Pointer (.png)
                </span>
              </div>
              <input
                type="file"
                ref={inputPointerRef}
                className="hidden"
                accept="image/png,image/jpeg"
                onChange={(e) => handleCursorUpload(e, "pointer")}
              />
            </div>
          </div>

          {/* Preview Area */}
          <div className="bg-slate-100 dark:bg-black/20 rounded-xl p-3 flex justify-around items-center border border-slate-200 dark:border-white/5">
            <div className="flex flex-col items-center gap-2">
              {/* Box này hiện cursor TĨNH (Normal) */}
              <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-sm text-[10px] text-slate-400 ">
                Hover Me
              </div>
              <span className="text-[9px] font-bold text-slate-500">
                Normal
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              {/* Button này hiện cursor POINTER */}
              <button className="w-20 h-20 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-colors pointer">
                <span className="text-[10px]">Button</span>
              </button>
              <span className="text-[9px] font-bold text-slate-500">
                Pointer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- PHẦN BACKGROUND SETTING MỚI --- */}
      <section className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-white/10">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Image size={16} /> Dashboard Wallpaper
        </h3>

        <div className="flex flex-col gap-3">
          {/* Preview Ảnh */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 flex items-center justify-center group">
            {backgroundImage ? (
              <>
                <img
                  src={backgroundImage}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => {
                      showToast("Trở về background mặc định", "info");
                      setBackgroundImage("./images/overdesk_logo.png");
                    }}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400">Default Theme</span>
            )}
          </div>

          {/* Nút Upload */}
          <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-bold pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
            <Upload size={14} /> Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </section>

      {/* --- SECTION: DATA & STORAGE --- */}
      <section className="animate-in slide-in-from-bottom-2 duration-300 delay-300">
        <SectionHeader icon={Zap} title="Data & Storage" />
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/5 border-b border-slate-100 dark:border-white/5">
            <button
              onClick={handleExport}
              className="p-3 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
            >
              <Download
                size={18}
                className="text-slate-500 group-hover:text-indigo-500 transition-colors"
              />
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-500">
                Backup
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
            >
              <Upload
                size={18}
                className="text-slate-500 group-hover:text-emerald-500 transition-colors"
              />
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">
                Restore
              </span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImport}
              />
            </button>
          </div>
          <div className="p-3">
            <button
              onClick={handleReset}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                confirmReset
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
              }`}
            >
              {confirmReset ? (
                <>
                  <Check size={14} /> Confirm Reset
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Reset Data
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <div className="py-6 flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold shadow-lg">
            O
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-white leading-none">
              OverDesk
            </div>
            <div className="text-[10px] text-indigo-500 font-mono mt-0.5">
              <AppInfo />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() =>
              openExternalLink("https://github.com/melody16032004")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <Github size={12} /> GitHub
          </button>
          <button
            onClick={() =>
              openExternalLink("https://opensource.org/licenses/MIT")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <Info size={12} /> License
          </button>
        </div>
        <div className="text-[9px] text-slate-400">
          Design by{" "}
          <span className="font-bold text-slate-500 dark:text-slate-300">
            Melody
          </span>
        </div>
      </div>
    </div>
  );
};
