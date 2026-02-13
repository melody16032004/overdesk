import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Music,
  Github,
  Linkedin,
  MessageCircle,
  Search,
  Mail,
  Film,
  Gamepad2,
  LayoutGrid,
  Twitch,
  Figma,
  Slack,
  Globe,
} from "lucide-react";

export const getSocialStyle = (id: string) => {
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

export const openInWebview = async (url: string, title: string) => {
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
