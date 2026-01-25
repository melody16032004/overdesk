import { useState, useMemo, useEffect, useRef } from "react";
import {
  Palette,
  Layers,
  Copy,
  Check,
  Plus,
  Trash2,
  Contrast,
  Pipette,
  Wand2,
  LayoutGrid,
  Menu,
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Loader2,
  Grid,
  Code,
  ArrowRightLeft,
  Eye,
  ThumbsUp,
  Square,
  Circle,
  Type,
  RefreshCw,
} from "lucide-react";
import { GRADIENT_PRESETS } from "./constants/design_const";
import {
  rgbToHex,
  extractDominantColors,
  extractFullPalette,
  findSafeColor,
  hexToRgb,
  rgbToHsl,
  findNearestTailwind,
  getHarmonies,
  getContrastRatio,
} from "./helper/design_helper";

// ==========================================
// COMPONENT
// ==========================================
export const DesignModule = () => {
  // --- 1. STATE: GLOBAL UI & UTILS ---
  const [activeTab, setActiveTab] = useState("converter");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState("");

  // --- 2. STATE: DATA PERSISTENCE (SAVED COLORS) ---
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_design_saved_colors");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- 3. STATE: COLOR CONVERTER ---
  const [baseColor, setBaseColor] = useState("#3b82f6");

  // --- 4. STATE: CONTRAST CHECKER ---
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#3b82f6");

  // --- 5. STATE: GRADIENT GENERATOR ---
  const [gradientStops, setGradientStops] = useState(["#3b82f6", "#9333ea"]);
  const [angle, setAngle] = useState(90);
  const [gradientType, setGradientType] = useState<
    "linear" | "radial" | "conic"
  >("linear");
  const [previewShape, setPreviewShape] = useState<
    "square" | "circle" | "text"
  >("square");

  // --- 6. STATE: IMAGE EXTRACTOR ---
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [dominantPalette, setDominantPalette] = useState<string[]>([]);
  const [fullPalette, setFullPalette] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ========================================================================
  // COMPUTED VALUES (USE MEMO)
  // ========================================================================

  // Converter Data
  const colorData = useMemo(() => {
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const tailwind = findNearestTailwind(baseColor);
    const harmonies = getHarmonies(baseColor);
    return { rgb, hsl, tailwind, harmonies };
  }, [baseColor]);

  // Contrast Data
  const contrastData = useMemo(() => {
    const ratio = getContrastRatio(fgColor, bgColor);
    let colorClass = "text-red-500";
    if (ratio >= 7) colorClass = "text-green-400";
    else if (ratio >= 4.5) colorClass = "text-green-500";
    else if (ratio >= 3) colorClass = "text-yellow-500";

    return {
      ratio: ratio.toFixed(2),
      score:
        ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA+" : "Fail",
      color: colorClass,
      isPass: ratio >= 4.5,
    };
  }, [fgColor, bgColor]);

  // Gradient CSS
  const gradientCss = useMemo(() => {
    const colors = gradientStops.join(", ");
    if (gradientType === "radial")
      return `radial-gradient(circle at center, ${colors})`;
    if (gradientType === "conic")
      return `conic-gradient(from ${angle}deg, ${colors})`;
    return `linear-gradient(${angle}deg, ${colors})`;
  }, [gradientStops, angle, gradientType]);

  // ========================================================================
  // SIDE EFFECTS (USE EFFECT)
  // ========================================================================

  // Sync Saved Colors to LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "dashboard_design_saved_colors",
      JSON.stringify(savedColors),
    );
  }, [savedColors]);

  // Handle Image Canvas Drawing
  useEffect(() => {
    if (activeTab === "image" && uploadedImage) {
      setTimeout(drawImageToCanvas, 100);
    }
  }, [activeTab, uploadedImage]);

  // ========================================================================
  // EVENT HANDLERS & HELPERS
  // ========================================================================

  // --- General Helpers ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1500);
  };

  const randomizeColor = () => {
    const r = () => Math.floor(Math.random() * 256);
    setBaseColor(rgbToHex(r(), r(), r()));
  };

  // --- Saved Colors Handlers ---
  const saveColorDirectly = (colorToSave: string) => {
    setSavedColors((prev) => {
      if (prev.includes(colorToSave)) return prev;
      return [...prev, colorToSave];
    });
  };

  const removeSavedColor = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedColors(savedColors.filter((c) => c !== color));
  };

  // --- Gradient Handlers ---
  const randomizeGradient = () => {
    const r = () => Math.floor(Math.random() * 256);
    const count = Math.random() > 0.5 ? 2 : 3;
    const newStops = Array(count)
      .fill(0)
      .map(() => rgbToHex(r(), r(), r()));
    setGradientStops(newStops);
    setAngle(Math.floor(Math.random() * 360));
  };

  const applyPreset = (preset: (typeof GRADIENT_PRESETS)[0]) => {
    setGradientStops(preset.stops);
    setGradientType(preset.type as any);
    if (preset.type === "linear" || preset.type === "conic") setAngle(135);
  };

  // --- Contrast Handlers ---
  const swapColors = () => {
    setBgColor(fgColor);
    setFgColor(bgColor);
  };

  const autoFixContrast = () => {
    setFgColor(findSafeColor(fgColor, bgColor));
  };

  // --- Image Extraction Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setFullPalette([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawImageToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = uploadedImage;
    img.onload = () => {
      const MAX_WIDTH = 600;
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (ctx) {
        const domPalette = extractDominantColors(
          ctx,
          canvas.width,
          canvas.height,
        );
        setDominantPalette(domPalette);
      }
    };
  };

  const handleExtractAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsExtracting(true);
    setTimeout(() => {
      const allColors = extractFullPalette(ctx, canvas.width, canvas.height);
      setFullPalette(allColors);
      setIsExtracting(false);
    }, 50);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext("2d");
    const pixel = ctx?.getImageData(x, y, 1, 1).data;
    if (pixel) setBaseColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
  };

  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext("2d");
    const pixel = ctx?.getImageData(x, y, 1, 1).data;
    if (pixel) setHoverColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* SIDEBAR */}
      <div
        className={`absolute md:relative inset-y-0 left-0 z-30 w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-white">
            <Palette size={18} className="text-pink-500" /> Design Studio
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-3 space-y-1 border-b border-[#3e3e42]">
          {["converter", "image", "contrast", "gradient"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-pink-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              {tab === "converter" ? (
                <Pipette size={16} />
              ) : tab === "image" ? (
                <ImageIcon size={16} />
              ) : tab === "contrast" ? (
                <Contrast size={16} />
              ) : (
                <Layers size={16} />
              )}
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Saved
            </span>
            <span className="text-[9px] text-slate-600">
              {savedColors.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {savedColors.map((color, idx) => (
              <div
                key={idx}
                onClick={() => setBaseColor(color)}
                className="aspect-square rounded-lg pointer border border-[#3e3e42] relative group overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    onClick={(e) => removeSavedColor(color, e)}
                    className="text-white hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => saveColorDirectly(baseColor)}
              className="aspect-square rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-400"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        <div className="md:hidden flex items-center justify-between p-3 border-b border-[#3e3e42] bg-[#252526]">
          <div className="flex items-center gap-2 font-bold text-white">
            <Palette size={18} className="text-pink-500" /> Studio
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          {/* TAB: CONVERTER */}
          {activeTab === "converter" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="relative group shrink-0 mx-auto md:mx-0">
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-40 h-40 rounded-3xl pointer opacity-0 absolute inset-0 z-10"
                  />
                  <div
                    className="w-40 h-40 rounded-3xl shadow-2xl border-4 border-[#3e3e42]"
                    style={{ backgroundColor: baseColor }}
                  ></div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2d2d2d] border border-[#3e3e42] px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg pointer-events-none whitespace-nowrap">
                    Edit Color
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Color Info</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveColorDirectly(baseColor)}
                        className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 active:scale-95"
                      >
                        <Save size={12} /> Save
                      </button>
                      <button
                        onClick={randomizeColor}
                        className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 active:scale-95"
                      >
                        <Wand2 size={12} /> Random
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => copyToClipboard(baseColor)}
                      className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] pointer hover:bg-[#2d2d2d] transition-colors relative group"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        HEX
                      </div>
                      <div className="text-lg font-mono text-white font-bold">
                        {baseColor.toUpperCase()}
                      </div>
                      {copied === baseColor && (
                        <div className="absolute right-3 top-3 text-green-500">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <div
                      onClick={() =>
                        copyToClipboard(
                          `rgb(${colorData.rgb.r}, ${colorData.rgb.g}, ${colorData.rgb.b})`,
                        )
                      }
                      className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] pointer hover:bg-[#2d2d2d] transition-colors"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        RGB
                      </div>
                      <div className="text-lg font-mono text-slate-200">
                        {colorData.rgb.r}, {colorData.rgb.g}, {colorData.rgb.b}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Code size={14} /> Code Export
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. CSS Variable */}
                  <div className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] relative group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CSS Variable
                    </div>
                    <code className="text-xs font-mono text-blue-300 block bg-[#1e1e1e] p-2 rounded border border-white/5 truncate">
                      --color-brand: {baseColor};
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(`--color-brand: ${baseColor};`)
                      }
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* 2. Tailwind Config */}
                  <div className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] relative group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Tailwind Config
                    </div>
                    <code className="text-xs font-mono text-pink-300 block bg-[#1e1e1e] p-2 rounded border border-white/5 truncate">
                      colors: &#123; brand: '{baseColor}' &#125;
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(`colors: { brand: '${baseColor}' }`)
                      }
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* 3. Tailwind JIT (Arbitrary) - Mới */}
                  <div className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] relative group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Tailwind JIT
                    </div>
                    <code className="text-xs font-mono text-teal-300 block bg-[#1e1e1e] p-2 rounded border border-white/5 truncate">
                      bg-[{baseColor}]
                    </code>
                    <button
                      onClick={() => copyToClipboard(`bg-[${baseColor}]`)}
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* 4. SCSS Variable - Mới */}
                  <div className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42] relative group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      SCSS
                    </div>
                    <code className="text-xs font-mono text-purple-300 block bg-[#1e1e1e] p-2 rounded border border-white/5 truncate">
                      $color-brand: {baseColor};
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(`$color-brand: ${baseColor};`)
                      }
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid size={14} /> Harmonies
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(colorData.harmonies).map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-[#252526] p-3 rounded-xl border border-[#3e3e42]"
                    >
                      <div className="text-[10px] text-slate-500 font-bold mb-2 uppercase">
                        {key}
                      </div>
                      <div className="flex h-10 rounded-lg overflow-hidden">
                        {Array.isArray(val) ? (
                          val.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1 pointer hover:opacity-80"
                              style={{ backgroundColor: c }}
                              onClick={() => setBaseColor(c)}
                            ></div>
                          ))
                        ) : (
                          <div
                            className="flex-1 pointer hover:opacity-80"
                            style={{ backgroundColor: val as string }}
                            onClick={() => setBaseColor(val as string)}
                          ></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: IMAGE PICKER */}
          {activeTab === "image" && (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Smart Picker</h2>
                  <p className="text-xs text-slate-500">
                    Pick pixels or use auto-extracted palette
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {hoverColor && (
                    <div className="flex items-center gap-2 bg-[#252526] border border-[#3e3e42] px-3 py-1.5 rounded-lg animate-in slide-in-from-right-2">
                      <div
                        className="w-4 h-4 rounded shadow-sm border border-white/20"
                        style={{ backgroundColor: hoverColor }}
                      ></div>
                      <span className="text-xs font-mono text-white font-bold">
                        {hoverColor}
                      </span>
                    </div>
                  )}
                  <label className="flex items-center gap-2 pointer bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg">
                    <Upload size={14} /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
              <div className="flex-1 bg-[#151515] border border-[#3e3e42] rounded-xl overflow-hidden relative flex flex-col group">
                {!uploadedImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Upload an image to start</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#101010]">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasHover}
                        className="max-w-full cursor-crosshair shadow-2xl rounded-lg"
                      />
                    </div>
                    <div className="flex-none p-4 bg-[#252526] border-t border-[#3e3e42] space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                          <Wand2 size={12} /> Dominant Colors
                        </div>
                        <div className="flex gap-3">
                          {dominantPalette.map((color, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setBaseColor(color);
                                saveColorDirectly(color);
                              }}
                              className="group flex-1 h-12 rounded-lg pointer relative transition-transform hover:scale-105 hover:shadow-lg"
                              style={{ backgroundColor: color }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 text-white font-mono text-[10px] backdrop-blur-sm rounded-lg transition-opacity">
                                <Plus size={14} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Grid size={12} /> Full Palette Analysis
                          </div>
                          {fullPalette.length === 0 && (
                            <button
                              onClick={handleExtractAll}
                              disabled={isExtracting}
                              className="text-[10px] bg-[#3e3e42] hover:bg-[#4e4e52] text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                              {isExtracting ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Wand2 size={10} />
                              )}{" "}
                              Extract All Colors
                            </button>
                          )}
                        </div>
                        {fullPalette.length > 0 ? (
                          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
                            {fullPalette.map((color, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setBaseColor(color);
                                  saveColorDirectly(color);
                                }}
                                className="aspect-square rounded-sm pointer hover:scale-125 transition-transform border border-white/5"
                                style={{ backgroundColor: color }}
                                title={color}
                              ></div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 italic">
                            Click "Extract All Colors" to find every distinct
                            hue in the image.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONTRAST */}
          {activeTab === "contrast" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#252526] p-4 rounded-xl border border-[#3e3e42]">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                        Foreground (Text)
                      </label>
                      <div className="flex gap-3 items-center">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <input
                            type="color"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] pointer p-0 border-0"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#3e3e42] px-3 py-1.5 rounded text-xs text-white font-mono uppercase mb-1 focus:border-pink-500 outline-none"
                          />
                          <div className="text-[9px] text-slate-500">
                            {findNearestTailwind(fgColor)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#252526] p-4 rounded-xl border border-[#3e3e42]">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                        Background
                      </label>
                      <div className="flex gap-3 items-center">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] pointer p-0 border-0"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#3e3e42] px-3 py-1.5 rounded text-xs text-white font-mono uppercase mb-1 focus:border-pink-500 outline-none"
                          />
                          <div className="text-[9px] text-slate-500">
                            {findNearestTailwind(bgColor)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={swapColors}
                      className="flex-1 bg-[#252526] hover:bg-[#3e3e42] border border-[#3e3e42] text-slate-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <ArrowRightLeft size={14} /> Swap Colors
                    </button>
                    <button
                      onClick={() => {
                        saveColorDirectly(fgColor);
                        saveColorDirectly(bgColor);
                      }}
                      className="flex-1 bg-[#252526] hover:bg-[#3e3e42] border border-[#3e3e42] text-slate-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Save size={14} /> Save Pair
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-5 bg-[#252526] rounded-2xl border border-[#3e3e42] p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                          Contrast Ratio
                        </div>
                        <div
                          className={`text-6xl font-black tracking-tighter ${contrastData.color}`}
                        >
                          {contrastData.ratio}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-black border ${
                          contrastData.isPass
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {contrastData.score}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        {Number(contrastData.ratio) >= 4.5 ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <X size={14} className="text-red-500" />
                        )}
                        <span className="text-slate-400">Normal Text (AA)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {Number(contrastData.ratio) >= 3 ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <X size={14} className="text-red-500" />
                        )}
                        <span className="text-slate-400">
                          Large Text (AA Large)
                        </span>
                      </div>
                    </div>
                  </div>
                  {!contrastData.isPass && (
                    <div className="relative z-10 mt-4 animate-in slide-in-from-bottom-2">
                      <button
                        onClick={autoFixContrast}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
                      >
                        <Wand2 size={14} /> Auto Fix Contrast
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Eye size={16} /> Live Preview
                </h3>
                <div
                  className="rounded-2xl border border-[#3e3e42] overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div
                      className="rounded-xl border p-6 flex flex-col gap-4 shadow-sm"
                      style={{
                        borderColor: fgColor + "30",
                        backgroundColor: bgColor,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full opacity-20"
                          style={{ backgroundColor: fgColor }}
                        ></div>
                        <div>
                          <div
                            className="h-4 w-32 rounded mb-2 opacity-80"
                            style={{ backgroundColor: fgColor }}
                          ></div>
                          <div
                            className="h-3 w-20 rounded opacity-40"
                            style={{ backgroundColor: fgColor }}
                          ></div>
                        </div>
                      </div>
                      <div
                        className="h-px w-full my-1 opacity-10"
                        style={{ backgroundColor: fgColor }}
                      ></div>
                      <div>
                        <h4
                          className="text-2xl font-bold mb-2 transition-colors"
                          style={{ color: fgColor }}
                        >
                          Article Title
                        </h4>
                        <p
                          className="text-sm leading-relaxed opacity-80 transition-colors"
                          style={{ color: fgColor }}
                        >
                          This is how your text looks like in a real paragraph.
                          Good contrast improves readability for everyone.
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span
                          className="text-[10px] px-2 py-1 rounded font-bold border opacity-60"
                          style={{ borderColor: fgColor, color: fgColor }}
                        >
                          #Tag1
                        </span>
                        <span
                          className="text-[10px] px-2 py-1 rounded font-bold border opacity-60"
                          style={{ borderColor: fgColor, color: fgColor }}
                        >
                          #Tag2
                        </span>
                      </div>
                    </div>
                    <div className="space-y-6 flex flex-col justify-center">
                      <div className="space-y-2">
                        <div
                          className="text-[10px] font-bold opacity-50 uppercase"
                          style={{ color: fgColor }}
                        >
                          Buttons
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <button
                            className="px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-transform active:scale-95"
                            style={{ backgroundColor: fgColor, color: bgColor }}
                          >
                            Primary Action
                          </button>
                          <button
                            className="px-6 py-2.5 rounded-lg font-bold text-sm border-2 transition-transform active:scale-95"
                            style={{ borderColor: fgColor, color: fgColor }}
                          >
                            Outline Button
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div
                          className="text-[10px] font-bold opacity-50 uppercase"
                          style={{ color: fgColor }}
                        >
                          Form Input
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type something..."
                            className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none font-medium"
                            style={{
                              borderColor: fgColor + "40",
                              color: fgColor,
                            }}
                          />
                          <div
                            className="absolute right-3 top-3.5 opacity-50"
                            style={{ color: fgColor }}
                          >
                            <Check size={16} />
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 rounded-lg flex items-center gap-3 border"
                        style={{
                          backgroundColor: fgColor + "10",
                          borderColor: fgColor + "20",
                        }}
                      >
                        <div style={{ color: fgColor }}>
                          <ThumbsUp size={18} />
                        </div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: fgColor }}
                        >
                          Successfully updated design!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GRADIENT */}
          {activeTab === "gradient" && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Preview</h2>
                    <div className="flex bg-[#252526] rounded-lg p-1 border border-[#3e3e42]">
                      <button
                        onClick={() => setPreviewShape("square")}
                        className={`p-1.5 rounded ${
                          previewShape === "square"
                            ? "bg-[#3e3e42] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        <Square size={16} />
                      </button>
                      <button
                        onClick={() => setPreviewShape("circle")}
                        className={`p-1.5 rounded ${
                          previewShape === "circle"
                            ? "bg-[#3e3e42] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        <Circle size={16} />
                      </button>
                      <button
                        onClick={() => setPreviewShape("text")}
                        className={`p-1.5 rounded ${
                          previewShape === "text"
                            ? "bg-[#3e3e42] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        <Type size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video w-full rounded-2xl border border-[#3e3e42] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#151515] flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <div
                      className={`transition-all duration-500 ease-in-out shadow-2xl flex items-center justify-center ${
                        previewShape === "square"
                          ? "w-full h-full"
                          : previewShape === "circle"
                            ? "w-64 h-64 rounded-full"
                            : "w-full"
                      }`}
                      style={{
                        background: gradientCss,
                        WebkitBackgroundClip:
                          previewShape === "text" ? "text" : undefined,
                        backgroundClip:
                          previewShape === "text" ? "text" : undefined,
                        color:
                          previewShape === "text" ? "transparent" : undefined,
                      }}
                    >
                      {previewShape === "text" && (
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight p-4 text-center">
                          Gradient
                          <br />
                          Studio.
                        </h1>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={randomizeGradient}
                        className="bg-black/50 backdrop-blur text-white p-2.5 rounded-xl font-bold hover:bg-black/70 transition-all border border-white/10"
                        title="Randomize"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(`background: ${gradientCss};`)
                        }
                        className="bg-white text-black px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                        {copied ? "Copied!" : "Copy CSS"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#252526] p-4 rounded-xl border border-[#3e3e42] font-mono text-[10px] text-slate-400 break-all">
                    background: {gradientCss};
                  </div>
                </div>

                <div className="lg:w-1/2 space-y-6">
                  <div className="bg-[#252526] p-5 rounded-2xl border border-[#3e3e42] space-y-5">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                          Type
                        </label>
                        <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42]">
                          {["linear", "radial", "conic"].map((t) => (
                            <button
                              key={t}
                              onClick={() => setGradientType(t as any)}
                              className={`flex-1 py-1.5 rounded text-xs font-bold capitalize transition-all ${
                                gradientType === t
                                  ? "bg-[#3e3e42] text-white shadow"
                                  : "text-slate-500"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {gradientType !== "radial" && (
                        <div className="w-1/3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                            Angle ({angle}°)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={angle}
                            onChange={(e) => setAngle(Number(e.target.value))}
                            className="w-full h-1.5 bg-[#1e1e1e] rounded-lg accent-white pointer mt-2"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Color Stops
                        </label>
                        <button
                          onClick={() =>
                            setGradientStops([...gradientStops, "#ffffff"])
                          }
                          className="text-[10px] bg-[#3e3e42] hover:bg-[#4e4e52] text-white px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {gradientStops.map((stop, i) => (
                          <div
                            key={i}
                            className="flex gap-3 items-center bg-[#1e1e1e] p-2 rounded-lg border border-[#3e3e42] animate-in slide-in-from-left-2"
                          >
                            <input
                              type="color"
                              value={stop}
                              onChange={(e) => {
                                const n = [...gradientStops];
                                n[i] = e.target.value;
                                setGradientStops(n);
                              }}
                              className="w-8 h-8 rounded pointer border-0 bg-transparent"
                            />
                            <input
                              value={stop}
                              onChange={(e) => {
                                const n = [...gradientStops];
                                n[i] = e.target.value;
                                setGradientStops(n);
                              }}
                              className="flex-1 bg-transparent border-none text-xs text-white font-mono uppercase outline-none"
                            />
                            <button
                              onClick={() => {
                                if (gradientStops.length > 2) {
                                  const n = gradientStops.filter(
                                    (_, idx) => idx !== i,
                                  );
                                  setGradientStops(n);
                                }
                              }}
                              disabled={gradientStops.length <= 2}
                              className="text-slate-500 hover:text-red-400 disabled:opacity-30 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#252526] p-5 rounded-2xl border border-[#3e3e42]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      <LayoutGrid size={12} /> Trendy Presets
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className="group relative aspect-video rounded-lg overflow-hidden border border-[#3e3e42] hover:border-white/50 transition-all"
                        >
                          <div
                            className="absolute inset-0 transition-transform group-hover:scale-110 duration-500"
                            style={{
                              background:
                                preset.type === "radial"
                                  ? `radial-gradient(circle at center, ${preset.stops.join(
                                      ", ",
                                    )})`
                                  : preset.type === "conic"
                                    ? `conic-gradient(from 135deg, ${preset.stops.join(
                                        ", ",
                                      )})`
                                    : `linear-gradient(135deg, ${preset.stops.join(
                                        ", ",
                                      )})`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-[10px] font-bold text-white transition-opacity">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
