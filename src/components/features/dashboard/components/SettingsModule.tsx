import { useState, useRef, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useAppStore } from "../../../../stores/useAppStore";
import { useDataStore } from "../../../../stores/useDataStore";
import { useToastStore } from "../../../../stores/useToastStore";
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
  Eye, // <--- 1. Thêm icon Terminal
} from "lucide-react";

// --- DỮ LIỆU CURSOR (SVG DATA URIs) ---
const CURSORS = [
  {
    id: "default",
    name: "System",
    css: "auto", // Mặc định của hệ điều hành
    preview: <MousePointer2 size={20} />,
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    // SVG mũi tên xanh neon
    css: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="%23000000" stroke="%2300f2ff" stroke-width="1.5" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>') 0 0, auto`,
    preview: (
      <div
        className="w-4 h-4 bg-black border border-[#00f2ff] rotate-[-45deg]"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      ></div>
    ),
  },
  {
    id: "amber-glow",
    name: "Amber",
    // SVG mũi tên vàng
    css: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="%2327272a" stroke="%23f59e0b" stroke-width="1.5" d="M5.5 3.5l6 15 2-6.5 6.5-2-14.5-6.5z"/></svg>') 0 0, auto`,
    preview: (
      <div
        className="w-4 h-4 bg-zinc-800 border border-amber-500 rotate-[-45deg]"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      ></div>
    ),
  },
  {
    id: "pixel",
    name: "Pixel Retro",
    // SVG dạng pixel
    css: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="white" stroke="black" stroke-width="1" d="M2 2h2v2h2v2h2v2h2v2h-2v2h-2v2H4v-2H2V2z"/></svg>') 0 0, auto`,
    preview: (
      <div className="w-4 h-4 bg-white border border-black transform -rotate-12"></div>
    ),
  },
  {
    id: "crosshair",
    name: "Gamer",
    css: "crosshair",
    preview: <div className="text-xl">+</div>,
  },
];

// --- HELPER: Nén ảnh để lưu vào LocalStorage ---
const compressImageSmart = (file: File, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Giới hạn Full HD là đủ nét cho hầu hết màn hình
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        // Chỉ resize nếu ảnh lớn hơn giới hạn
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Không thể tạo Canvas Context"));
          return;
        }

        // Dùng thuật toán nội suy chất lượng cao để giữ nét khi resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx?.drawImage(img, 0, 0, width, height);

        // Nén với chất lượng cao (0.85)
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AppInfo = () => {
  const [appVersion, setAppVersion] = useState("");
  useEffect(() => {
    // Lấy version từ tauri.conf.json
    getVersion().then((v) => setAppVersion(v));
  }, []);
  return (
    <div className="text-xs text-slate-500">
      v{appVersion} <span className="text-slate-400">• Pro</span>
    </div>
  );
};

export const SettingsModule = () => {
  const {
    theme,
    toggleTheme,
    opacity,
    setOpacity,
    timerSettings,
    multiWindowEnabled,
    toggleMultiWindow,
    cursorStyle, // Lấy từ store
    setCursorStyle, // Lấy từ store
    backgroundImage,
    setBackgroundImage,
    autoHideUI, // Lấy từ store
    toggleAutoHideUI, // Lấy hàm toggle
  } = useAppStore();
  const { resetData, tasks, noteContent, importData } = useDataStore();
  const { showToast } = useToastStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cảnh báo nhẹ nếu file gốc quá lớn (> 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("Ảnh gốc rất lớn, đang xử lý tối ưu...", "info");
    }

    try {
      // LẦN 1: Nén nhẹ nhàng, giữ chất lượng cao (0.85)
      let compressedBase64 = await compressImageSmart(file, 0.85);

      // Tính toán kích thước file sau nén (ước lượng từ base64 string)
      const sizeInBytes =
        Math.ceil((compressedBase64.length * 3) / 4) -
        (compressedBase64.indexOf("=") > 0
          ? compressedBase64.length - compressedBase64.indexOf("=")
          : 0);

      // LẦN 2 (Cứu cánh): Nếu sau nén lần 1 vẫn > 4.5MB (gần ngưỡng crash 5MB)
      // Thì buộc phải nén mạnh hơn xuống 0.65 để tránh lỗi
      const SAFETY_LIMIT = 4.5 * 1024 * 1024; // 4.5 MB
      if (sizeInBytes > SAFETY_LIMIT) {
        console.warn("Ảnh vẫn lớn sau nén lần 1, áp dụng nén mạnh hơn.");
        compressedBase64 = await compressImageSmart(file, 0.65);
      }

      // Thử lưu vào LocalStorage
      try {
        setBackgroundImage(compressedBase64);
        showToast("Đã cập nhật hình nền nét căng!", "success");
      } catch (storageError) {
        console.error(storageError);
        // Nếu vẫn lỗi thì đành chịu, báo user chọn ảnh khác
        showToast(
          "Bộ nhớ đầy không thể lưu. Vui lòng chọn ảnh khác nhỏ hơn.",
          "error"
        );
      }
    } catch (error) {
      console.error("Lỗi xử lý ảnh:", error);
      showToast("Có lỗi khi xử lý ảnh này.", "error");
    }
  };

  // --- HANDLERS ---
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
    a.download = `overdesk-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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

      {/* --- [MỚI] SECTION: CURSOR CUSTOMIZATION --- */}
      <section className="animate-in slide-in-from-bottom-2 duration-300 delay-250">
        <SectionHeader icon={MousePointer2} title="Cursor Style" />
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-3">
            {CURSORS.map((cursor) => (
              <button
                key={cursor.id}
                onClick={() => setCursorStyle(cursor.css)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  cursorStyle === cursor.css
                    ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500"
                    : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-300 dark:hover:border-white/10"
                }`}
              >
                <div className="text-slate-700 dark:text-slate-200">
                  {cursor.preview}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    cursorStyle === cursor.css
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500"
                  }`}
                >
                  {cursor.name}
                </span>
              </button>
            ))}
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
                    onClick={() => setBackgroundImage(null)}
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
          <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
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

// --- SUB COMPONENTS ---
const SectionHeader = ({ icon: Icon, title }: any) => (
  <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wider flex items-center gap-1.5 ml-1">
    <Icon size={12} /> {title}
  </h3>
);

const Switch = ({ checked, onChange }: any) => (
  <button
    onClick={onChange}
    className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
      checked
        ? "bg-indigo-500 shadow-indigo-500/50"
        : "bg-slate-200 dark:bg-slate-700"
    }`}
  >
    <div
      className={`w-3.5 h-3.5 bg-white rounded-full shadow-md absolute top-0.5 transition-all duration-300 ${
        checked ? "left-[22px]" : "left-[4px]"
      }`}
    />
  </button>
);
