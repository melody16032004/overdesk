export const TAILWIND_COLORS: Record<string, string> = {
  "#ef4444": "red-500",
  "#f97316": "orange-500",
  "#f59e0b": "amber-500",
  "#eab308": "yellow-500",
  "#84cc16": "lime-500",
  "#22c55e": "green-500",
  "#10b981": "emerald-500",
  "#14b8a6": "teal-500",
  "#06b6d4": "cyan-500",
  "#0ea5e9": "sky-500",
  "#3b82f6": "blue-500",
  "#6366f1": "indigo-500",
  "#8b5cf6": "violet-500",
  "#a855f7": "purple-500",
  "#d946ef": "fuchsia-500",
  "#ec4899": "pink-500",
  "#f43f5e": "rose-500",
  "#0f172a": "slate-900",
  "#ffffff": "white",
  "#000000": "black",
};

export const GRADIENT_PRESETS = [
  // --- TRENDY & POPULAR ---
  { name: "Hyper", stops: ["#ec4899", "#8b5cf6"], type: "linear" },
  { name: "Ocean", stops: ["#06b6d4", "#3b82f6"], type: "linear" },
  { name: "Sunset", stops: ["#f97316", "#eab308"], type: "linear" },
  { name: "Insta", stops: ["#833ab4", "#fd1d1d", "#fcb045"], type: "linear" },
  { name: "Spotify", stops: ["#1db954", "#191414"], type: "radial" },

  // --- NATURE & EARTH ---
  { name: "Forest", stops: ["#059669", "#10b981", "#86efac"], type: "linear" },
  { name: "Sky", stops: ["#38bdf8", "#bae6fd", "#f0f9ff"], type: "linear" },
  { name: "Fire", stops: ["#ef4444", "#f59e0b"], type: "linear" },
  { name: "Sand", stops: ["#d6d3d1", "#a8a29e", "#78716c"], type: "conic" },

  // --- VIBRANT & NEON ---
  { name: "Cyber", stops: ["#ef4444", "#3b82f6"], type: "linear" },
  { name: "Lemon", stops: ["#facc15", "#a3e635"], type: "linear" },
  { name: "Toxic", stops: ["#ccff00", "#00ff00", "#003300"], type: "radial" },
  { name: "Purple", stops: ["#c084fc", "#6366f1"], type: "linear" },

  // --- DARK & ELEGANT ---
  { name: "Midnight", stops: ["#0f172a", "#334155"], type: "linear" },
  { name: "Obsidian", stops: ["#18181b", "#27272a", "#3f3f46"], type: "conic" },
  {
    name: "Gold",
    stops: ["#BF953F", "#FCF6BA", "#B38728", "#FBF5B7", "#AA771C"],
    type: "linear",
  },
  { name: "Dracula", stops: ["#282a36", "#44475a", "#6272a4"], type: "radial" },

  // --- PASTEL & SOFT ---
  { name: "Cotton", stops: ["#fce7f3", "#e0e7ff"], type: "linear" },
  { name: "Peach", stops: ["#ffedd5", "#fdba74"], type: "linear" },
  { name: "Mint", stops: ["#d1fae5", "#6ee7b7"], type: "linear" },

  // --- SPECIAL EFFECTS ---
  { name: "Aurora", stops: ["#34d399", "#3b82f6", "#a855f7"], type: "conic" },
  {
    name: "Rainbow",
    stops: [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#a855f7",
      "#ef4444",
    ],
    type: "linear",
  },
  { name: "Radar", stops: ["#10b981", "#064e3b"], type: "conic" },
  {
    name: "Chrome",
    stops: ["#e5e7eb", "#9ca3af", "#4b5563", "#e5e7eb"],
    type: "linear",
  },
];
