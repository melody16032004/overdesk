import { Code2, Coffee, Palette, RotateCcw, Settings } from "lucide-react";

export const SYSTEM_PRESETS = [
  {
    id: "default",
    label: "Default",
    icon: RotateCcw,
    color: "bg-slate-600",
    desc: "Khôi phục trạng thái gốc",
    keep: ["tasks", "notes", "calendar", "weather", "music", "news", "ai"],
  },
  {
    id: "system_only", // <--- MẪU MỚI BẠN YÊU CẦU
    label: "System Only",
    icon: Settings,
    color: "bg-gray-700",
    desc: "Chỉ hiện Config & Settings",
    keep: ["system"], // Mảng rỗng = Ẩn tất cả (trừ MANDATORY_APPS)
  },
  {
    id: "dev",
    label: "Developer",
    icon: Code2,
    color: "bg-blue-600",
    desc: "Code, Git, Terminal, DB",
    keep: [
      "terminal",
      "code",
      "git",
      "database",
      "erd",
      "json",
      "json_tools",
      "request",
      "jwt",
      "regex",
      "decode",
      "snippets",
      "library",
      "devops",
      "tree",
      "tester",
      "testcase",
      "bug-report",
    ],
  },
  {
    id: "creative",
    label: "Creator",
    icon: Palette,
    color: "bg-pink-600",
    desc: "Design, Music, Colors",
    keep: [
      "design",
      "typography",
      "icons",
      "whiteboard",
      "music",
      "camera",
      "img-compress",
      "fb-tools",
    ],
  },
  {
    id: "minimal",
    label: "Focus",
    icon: Coffee,
    color: "bg-emerald-600",
    desc: "Chỉ giữ lại cái cần thiết",
    keep: ["tasks", "notes", "timer", "breathe", "music"],
  },
];

export const MANDATORY_APPS = ["config", "settings", "about", "license"];
