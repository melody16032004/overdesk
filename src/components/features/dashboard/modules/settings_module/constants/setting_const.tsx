import { MousePointer2 } from "lucide-react";

export const CURSORS = [
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
];
