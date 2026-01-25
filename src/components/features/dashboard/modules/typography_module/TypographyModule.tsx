import { useState, useMemo, useEffect } from "react";
import {
  Type,
  Code,
  Copy,
  Check,
  Scaling,
  MoveVertical,
  Settings2,
  ALargeSmall,
  Menu,
  X,
  MonitorPlay,
  Sparkles,
  AArrowUp,
} from "lucide-react";

// --- DATA: GOOGLE FONTS COLLECTION ---
const GOOGLE_FONTS = [
  { name: "Inter", category: "Sans Serif" },
  { name: "Roboto", category: "Sans Serif" },
  { name: "Open Sans", category: "Sans Serif" },
  { name: "Montserrat", category: "Sans Serif" },
  { name: "Playfair Display", category: "Serif" },
  { name: "Merriweather", category: "Serif" },
  { name: "Lora", category: "Serif" },
  { name: "Roboto Slab", category: "Serif" },
  { name: "Fira Code", category: "Monospace" },
  { name: "JetBrains Mono", category: "Monospace" },
  { name: "Oswald", category: "Display" },
  { name: "Raleway", category: "Sans Serif" },
  { name: "Nunito", category: "Sans Serif" },
  { name: "Rubik", category: "Sans Serif" },
  { name: "Work Sans", category: "Sans Serif" },
  { name: "Quicksand", category: "Sans Serif" },
  { name: "Barlow", category: "Sans Serif" },
  { name: "Crimson Text", category: "Serif" },
  { name: "Libre Baskerville", category: "Serif" },
  { name: "Space Mono", category: "Monospace" },
];

const TYPE_SCALES = [
  { name: "Minor Third", ratio: 1.2 },
  { name: "Major Third", ratio: 1.25 },
  { name: "Perfect Fourth", ratio: 1.333 },
  { name: "Augmented Fourth", ratio: 1.414 },
  { name: "Perfect Fifth", ratio: 1.5 },
  { name: "Golden Ratio", ratio: 1.618 },
];

const SMART_PAIRINGS = [
  { name: "Modern Clean", header: "Inter", body: "Inter" },
  { name: "Classic Editorial", header: "Playfair Display", body: "Lora" },
  { name: "Tech Blog", header: "Oswald", body: "Open Sans" },
  { name: "Developer", header: "Fira Code", body: "JetBrains Mono" },
  { name: "Elegant", header: "Libre Baskerville", body: "Montserrat" },
  { name: "Friendly", header: "Quicksand", body: "Nunito" },
];

export const TypographyModule = () => {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scale" | "preview">("scale");

  // Font Settings
  const [headerFont, setHeaderFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");

  // Metrix
  const [baseSize, setBaseSize] = useState(16);
  const [scaleRatio, setScaleRatio] = useState(1.25);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing] = useState(0);
  const [headerWeight, setHeaderWeight] = useState(700);
  const [bodyWeight] = useState(400);

  // Content
  const [editableText, setEditableText] = useState(
    "Typography is the art of arranging type.",
  );
  const [copied, setCopied] = useState(false);

  // --- EFFECT: LOAD GOOGLE FONTS DYNAMICALLY ---
  useEffect(() => {
    const fontsToLoad = Array.from(new Set([headerFont, bodyFont]));
    const linkId = "dynamic-google-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    const fontQuery = fontsToLoad
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;700`)
      .join("&");
    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
  }, [headerFont, bodyFont]);

  // --- ACTIONS ---
  const applyPairing = (pairing: (typeof SMART_PAIRINGS)[0]) => {
    setHeaderFont(pairing.header);
    setBodyFont(pairing.body);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- MEMOS ---
  const typeScale = useMemo(() => {
    const sizes = [];
    // Body (Base)
    sizes.push({ label: "Body", px: baseSize, rem: 1, val: baseSize });
    // Headings (H6 -> H1)
    for (let i = 1; i <= 6; i++) {
      const sizePx = baseSize * Math.pow(scaleRatio, i);
      sizes.push({
        label: `H${7 - i}`,
        px: Math.round(sizePx),
        rem: (sizePx / baseSize).toFixed(3),
        val: sizePx,
      });
    }
    return sizes.reverse();
  }, [baseSize, scaleRatio]);

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* 1. SIDEBAR CONTROLS */}
      <div
        className={`
          absolute md:relative inset-y-0 left-0 z-30
          w-80 border-r border-[#3e3e42] bg-[#252526] flex flex-col shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-white">
            <Type size={18} className="text-yellow-500" /> Typography
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* SMART PAIRINGS */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <Sparkles size={12} /> Smart Pairings
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SMART_PAIRINGS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPairing(p)}
                  className={`text-[10px] p-2 rounded border text-left hover:bg-[#3e3e42] transition-all ${
                    headerFont === p.header && bodyFont === p.body
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                      : "bg-[#1e1e1e] border-[#3e3e42] text-slate-400"
                  }`}
                >
                  <div className="font-bold">{p.name}</div>
                  <div className="opacity-50 text-[9px] truncate">
                    {p.header} + {p.body}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FONT FAMILY SELECTORS */}
          <div className="space-y-4 pt-4 border-t border-[#3e3e42]">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                Heading Font
              </label>
              <select
                value={headerFont}
                onChange={(e) => setHeaderFont(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-yellow-500"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                Body Font
              </label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-yellow-500"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* METRICS */}
          <div className="space-y-5 pt-4 border-t border-[#3e3e42]">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <ALargeSmall size={12} /> Base Size
                </span>{" "}
                <span className="text-white">{baseSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="24"
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1e1e1e] rounded-lg accent-yellow-500 pointer"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <Scaling size={12} /> Scale Ratio
                </span>{" "}
                <span className="text-white">{scaleRatio}</span>
              </div>
              <select
                value={scaleRatio}
                onChange={(e) => setScaleRatio(Number(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-white text-xs px-3 py-2 rounded-lg outline-none"
              >
                {TYPE_SCALES.map((s) => (
                  <option key={s.name} value={s.ratio}>
                    {s.name} ({s.ratio})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <MoveVertical size={12} /> Line Height
                </span>{" "}
                <span className="text-white">{lineHeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1e1e1e] rounded-lg accent-yellow-500 pointer"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <Settings2 size={12} /> Weight (Header)
                </span>{" "}
                <span className="text-white">{headerWeight}</span>
              </div>
              <input
                type="range"
                min="100"
                max="900"
                step="100"
                value={headerWeight}
                onChange={(e) => setHeaderWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1e1e1e] rounded-lg accent-yellow-500 pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-[#3e3e42] bg-[#252526]">
          <div className="flex items-center gap-2 font-bold text-white">
            <Type size={18} className="text-yellow-500" /> Typography
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#3e3e42] bg-[#252526] px-4">
          <button
            onClick={() => setActiveTab("scale")}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "scale"
                ? "border-yellow-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <AArrowUp size={14} /> Type Scale
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "preview"
                ? "border-yellow-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <MonitorPlay size={14} /> Live Preview
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          {/* TAB: SCALE */}
          {activeTab === "scale" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
              {/* Visual Scale */}
              <div className="bg-[#252526] rounded-2xl border border-[#3e3e42] overflow-hidden">
                {typeScale.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 p-6 border-b border-[#3e3e42] last:border-0 hover:bg-[#3e3e42]/30 transition-colors group"
                  >
                    <div className="w-24 shrink-0 flex flex-row md:flex-col gap-2 md:gap-0 items-center md:items-start">
                      <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                        {t.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.px}px / {t.rem}rem
                      </span>
                    </div>
                    <input
                      value={
                        t.label === "Body"
                          ? "The quick brown fox jumps over the lazy dog."
                          : editableText
                      }
                      onChange={(e) => setEditableText(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-white w-full"
                      style={{
                        fontFamily: t.label === "Body" ? bodyFont : headerFont,
                        fontSize: `${t.px}px`,
                        lineHeight: lineHeight,
                        fontWeight:
                          t.label === "Body" ? bodyWeight : headerWeight,
                        letterSpacing: `${letterSpacing}em`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Export Config */}
              <div className="bg-[#151515] p-5 rounded-2xl border border-[#3e3e42] relative group">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Code size={14} /> Tailwind Config
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      fontFamily: {\n        sans: ['"${bodyFont}"', ...defaultTheme.fontFamily.sans],\n        heading: ['"${headerFont}"', ...defaultTheme.fontFamily.sans],\n      },\n      fontSize: {\n${typeScale
                          .map(
                            (t) =>
                              `        '${t.label.toLowerCase()}': ['${
                                t.rem
                              }rem', { lineHeight: '${lineHeight}' }],`,
                          )
                          .join("\n")}\n      }\n    }\n  }\n}`,
                      )
                    }
                    className="text-[10px] bg-[#3e3e42] hover:bg-[#4e4e52] text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} Copy
                  </button>
                </div>
                <div className="font-mono text-[10px] text-blue-300 overflow-x-auto whitespace-pre p-3 bg-[#1e1e1e] rounded border border-[#3e3e42]">
                  {`fontSize: {
${typeScale
  .map(
    (t) =>
      `  '${t.label.toLowerCase()}': ['${
        t.rem
      }rem', { lineHeight: '${lineHeight}' }],`,
  )
  .join("\n")}
},
fontFamily: {
  sans: ['"${bodyFont}"', 'sans-serif'],
  heading: ['"${headerFont}"', 'serif'],
}`}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PREVIEW */}
          {activeTab === "preview" && (
            <div className="max-w-3xl mx-auto bg-white text-black rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 min-h-[80vh]">
              <div
                className="p-12 md:p-16 space-y-8"
                style={{ fontFamily: bodyFont }}
              >
                <header className="space-y-4 text-center">
                  <span className="text-xs font-bold tracking-widest uppercase text-blue-600">
                    The Collection
                  </span>
                  <h1
                    style={{
                      fontFamily: headerFont,
                      fontSize: `${typeScale[0].px}px`,
                      fontWeight: headerWeight,
                      lineHeight: 1.1,
                    }}
                  >
                    The Art of Typography
                  </h1>
                  <p
                    className="text-gray-500 text-lg max-w-lg mx-auto"
                    style={{ lineHeight: lineHeight }}
                  >
                    Exploration of shape, spacing, and hierarchy in modern web
                    design.
                  </p>
                </header>

                <div className="h-px w-20 bg-gray-200 mx-auto"></div>

                <article className="prose prose-lg mx-auto text-gray-700 space-y-6">
                  <h2
                    style={{
                      fontFamily: headerFont,
                      fontSize: `${typeScale[2].px}px`,
                      fontWeight: headerWeight,
                      color: "#111",
                    }}
                  >
                    Why Type Matters
                  </h2>
                  <p
                    style={{
                      fontSize: `${baseSize}px`,
                      lineHeight: lineHeight,
                    }}
                  >
                    Typography is not just about choosing a font; it is about
                    establishing a visual hierarchy that guides the reader's
                    eye. A good type system creates{" "}
                    <strong style={{ color: "#111" }}>
                      rhythm and balance
                    </strong>{" "}
                    on the page.
                  </p>

                  <blockquote
                    className="border-l-4 border-blue-500 pl-4 italic text-gray-900 my-8"
                    style={{
                      fontSize: `${typeScale[3].px}px`,
                      fontFamily: headerFont,
                    }}
                  >
                    "Good design is obvious. Great design is transparent."
                  </blockquote>

                  <h3
                    style={{
                      fontFamily: headerFont,
                      fontSize: `${typeScale[3].px}px`,
                      fontWeight: headerWeight,
                      color: "#111",
                    }}
                  >
                    The Role of Scale
                  </h3>
                  <p
                    style={{
                      fontSize: `${baseSize}px`,
                      lineHeight: lineHeight,
                    }}
                  >
                    Using a modular scale ensures that all your font sizes
                    relate to each other in a harmonious way. Whether you use a{" "}
                    <strong>Major Third ({scaleRatio})</strong> or a{" "}
                    <strong>Golden Ratio</strong>, consistency is key.
                  </p>

                  <div className="flex gap-4 pt-6">
                    <button
                      className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                      style={{ fontSize: `${baseSize}px` }}
                    >
                      Read More
                    </button>
                    <button
                      className="border border-gray-300 text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                      style={{ fontSize: `${baseSize}px` }}
                    >
                      Subscribe
                    </button>
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
