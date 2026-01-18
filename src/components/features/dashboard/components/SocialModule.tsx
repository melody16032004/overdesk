import { useState, useRef, useEffect } from "react";
import {
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Github,
  Linkedin,
  MessageCircle,
  Music,
  Globe,
  Plus,
  X,
  Trash2,
  ChevronDown,
  Mail,
  Gamepad2,
  Twitch,
  Film,
  Search,
  LayoutGrid,
  Figma,
  Slack,
} from "lucide-react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useAppStore, SocialItem } from "../../../../stores/useAppStore";

// --- 1. DANH SÁCH ĐỀ XUẤT (PRESETS) ---
const PRESETS = [
  {
    label: "Google",
    url: "https://google.com",
    icon: Search,
    idPrefix: "google",
  },
  {
    label: "Gmail",
    url: "https://mail.google.com",
    icon: Mail,
    idPrefix: "gmail",
  },
  {
    label: "Netflix",
    url: "https://netflix.com",
    icon: Film,
    idPrefix: "netflix",
  },
  {
    label: "Spotify",
    url: "https://open.spotify.com",
    icon: Music,
    idPrefix: "spotify",
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com",
    icon: Music,
    idPrefix: "tiktok",
  },
  {
    label: "Discord",
    url: "https://discord.com/app",
    icon: Gamepad2,
    idPrefix: "discord",
  },
  {
    label: "Reddit",
    url: "https://reddit.com",
    icon: LayoutGrid,
    idPrefix: "reddit",
  },
  {
    label: "Twitch",
    url: "https://twitch.tv",
    icon: Twitch,
    idPrefix: "twitch",
  },
  { label: "Figma", url: "https://figma.com", icon: Figma, idPrefix: "figma" },
  { label: "Slack", url: "https://slack.com", icon: Slack, idPrefix: "slack" },
];

// --- 2. HÀM STYLE (Cập nhật để nhận diện ID thông minh hơn) ---
const getSocialStyle = (id: string) => {
  // Chuẩn hóa ID để dễ so sánh (vd: netflix-123 -> netflix)
  const key = id.split("-")[0];

  switch (key) {
    // Các app mặc định cũ
    case "fb":
      return {
        icon: Facebook,
        color: "text-blue-600",
        bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
      };
    case "yt":
      return {
        icon: Youtube,
        color: "text-red-600",
        bg: "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40",
      };
    case "ig":
      return {
        icon: Instagram,
        color: "text-pink-600",
        bg: "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/40",
      };
    case "tw":
      return {
        icon: Twitter,
        color: "text-sky-500",
        bg: "bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/40",
      };
    case "tiktok":
      return {
        icon: Music,
        color: "text-slate-800 dark:text-white",
        bg: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700",
      };
    case "gh":
      return {
        icon: Github,
        color: "text-slate-900 dark:text-white",
        bg: "bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20",
      };
    case "li":
      return {
        icon: Linkedin,
        color: "text-blue-700",
        bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
      };
    case "gpt":
      return {
        icon: MessageCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40",
      };

    // Các app mới thêm từ Preset
    case "google":
      return {
        icon: Search,
        color: "text-blue-500",
        bg: "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10",
      };
    case "gmail":
      return {
        icon: Mail,
        color: "text-red-500",
        bg: "bg-red-50 hover:bg-red-100 dark:bg-red-500/10",
      };
    case "netflix":
      return {
        icon: Film,
        color: "text-red-600",
        bg: "bg-black text-white hover:bg-gray-900 dark:bg-black dark:border-red-600/50",
      };
    case "spotify":
      return {
        icon: Music,
        color: "text-green-500",
        bg: "bg-green-50 hover:bg-green-100 dark:bg-green-500/10",
      };

    case "discord":
      return {
        icon: Gamepad2,
        color: "text-indigo-500",
        bg: "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10",
      };
    case "reddit":
      return {
        icon: LayoutGrid,
        color: "text-orange-600",
        bg: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10",
      };
    case "twitch":
      return {
        icon: Twitch,
        color: "text-purple-600",
        bg: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10",
      };
    case "figma":
      return {
        icon: Figma,
        color: "text-pink-500",
        bg: "bg-slate-50 hover:bg-slate-100 dark:bg-white/5",
      };
    case "slack":
      return {
        icon: Slack,
        color: "text-amber-600",
        bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10",
      };

    // Mặc định (Custom link)
    default:
      return {
        icon: Globe,
        color: "text-indigo-500",
        bg: "bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10",
      };
  }
};

export const SocialModule = () => {
  const { socialApps, addSocialApp, removeSocialApp } = useAppStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [idPrefix, setIdPrefix] = useState("custom"); // Dùng để xác định icon

  // State cho Dropdown
  const [showPresets, setShowPresets] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPresets(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openInWebview = async (url: string, title: string) => {
    try {
      const label = `social-${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}-${Date.now()}`;
      const webview = new WebviewWindow(label, {
        url: url,
        title: title,
        width: 1000,
        height: 700,
        resizable: true,
        decorations: true,
        center: true,
      });
      webview.once("tauri://error", (e) => console.error("Webview error:", e));
    } catch (error) {
      console.error("Cannot create window:", error);
    }
  };

  const handleAdd = () => {
    if (newLabel.trim() && newUrl.trim()) {
      let finalUrl = newUrl.trim();
      if (!finalUrl.startsWith("http")) {
        finalUrl = `https://${finalUrl}`;
      }

      // Tạo ID dạng: "prefix-timestamp" (vd: "netflix-17823612")
      // Điều này giúp hàm getSocialStyle nhận diện được loại app
      const newItem: SocialItem = {
        id: `${idPrefix}-${Date.now()}`,
        label: newLabel.trim(),
        url: finalUrl,
        isCustom: true,
      };

      addSocialApp(newItem);

      setNewLabel("");
      setNewUrl("");
      setIdPrefix("custom"); // Reset về custom
      setIsAdding(false);
    }
  };

  const selectPreset = (preset: any) => {
    setNewLabel(preset.label);
    setNewUrl(preset.url);
    setIdPrefix(preset.idPrefix); // Lưu prefix để lát tạo ID đúng
    setShowPresets(false);
  };

  return (
    <div className="h-full p-4 overflow-y-auto scrollbar-thin">
      <div className="flex items-end gap-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Socials
        </h2>
        <p className="text-[10px] mb-0.5 text-slate-400">v0.0</p>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Quick access to your favorite sites
      </p>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {socialApps.map((item) => {
          const style = getSocialStyle(item.id);
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              className="relative group animate-in zoom-in duration-200"
            >
              <button
                onClick={() => openInWebview(item.url, item.label)}
                className={`
                    w-full flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200
                    ${style.bg} hover:scale-105 hover:shadow-md border border-transparent hover:border-black/5 dark:hover:border-white/10
                    `}
              >
                <Icon size={32} className={`mb-2 ${style.color}`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full text-center px-1">
                  {item.label}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSocialApp(item.id);
                }}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-white/80 dark:bg-black/50 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-black opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 shadow-sm"
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}

        {/* --- FORM THÊM MỚI --- */}
        {isAdding ? (
          <div className="flex flex-col p-3 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-800 shadow-lg animate-in fade-in zoom-in duration-200 relative overflow-visible">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-indigo-500 uppercase">
                New Link
              </span>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>

            {/* 3. DROPDOWN ĐỀ XUẤT */}
            <div className="relative mb-2" ref={dropdownRef}>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-full flex items-center justify-between text-xs bg-slate-100 dark:bg-white/5 rounded px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
              >
                <span>Choose from popular apps...</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    showPresets ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPresets && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto scrollbar-thin p-1">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectPreset(preset)}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
                    >
                      <div className="p-1 rounded bg-slate-100 dark:bg-white/5">
                        <preset.icon
                          size={14}
                          className="text-slate-600 dark:text-slate-300"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inputs */}
            <input
              type="text"
              placeholder="Name (e.g. My Blog)"
              className="w-full text-xs bg-slate-100 dark:bg-white/5 rounded px-2 py-1.5 mb-2 outline-none focus:ring-1 ring-indigo-500"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />

            <input
              type="text"
              placeholder="URL (mysite.com)"
              className="w-full text-xs bg-slate-100 dark:bg-white/5 rounded px-2 py-1.5 mb-3 outline-none focus:ring-1 ring-indigo-500"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />

            <button
              onClick={handleAdd}
              disabled={!newLabel || !newUrl}
              className="w-full bg-indigo-500 text-white text-xs font-bold py-1.5 rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Link
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group h-full min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
              <Plus
                size={20}
                className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500"
              />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-500">
              Add Link
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
