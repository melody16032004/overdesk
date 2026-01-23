import React, { useState } from "react";
import { icons } from "lucide-react";
import {
  ArrowLeft,
  Heart,
  X,
  Sliders,
  RotateCcw,
  FileCode,
  Braces,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { toKebabCase } from "../helper/icon_picker_helper";
import { DetailContentProps } from "../types/icon_picker_type";
import { CopyButton } from "./CopyButton";

// --- TYPES ---

export const DetailContent: React.FC<DetailContentProps> = ({
  iconName,
  customProps,
  setCustomProps,
  isFavorite,
  onToggleFavorite,
  onClose,
  onReset,
}) => {
  const [codeMode, setCodeMode] = useState<"react" | "web">("react");
  const [copied, setCopied] = useState("");

  const SelectedIconComponent = iconName ? icons[iconName] : null;

  // Logic tạo code
  const generateCode = (type: "jsx" | "import" | "html" | "url" | "svg") => {
    if (!iconName) return "";
    const kebabName = toKebabCase(iconName);

    switch (type) {
      case "import":
        return `import { ${iconName} } from 'lucide-react';`;
      case "jsx": {
        let props = "";
        if (customProps.size !== 24) props += ` size={${customProps.size}}`;
        if (customProps.color !== "#ffffff")
          props += ` color="${customProps.color}"`;
        if (customProps.strokeWidth !== 2)
          props += ` strokeWidth={${customProps.strokeWidth}}`;
        return `<${iconName}${props} />`;
      }
      case "html":
        return `<i data-lucide="${kebabName}"></i>`;
      case "url":
        return `https://unpkg.com/lucide-static@latest/icons/${kebabName}.svg`;
      case "svg":
        return `\n<svg xmlns="http://www.w3.org/2000/svg" width="${customProps.size}" height="${customProps.size}" viewBox="0 0 24 24" fill="none" stroke="${customProps.color}" stroke-width="${customProps.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">...</svg>`;
      default:
        return "";
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  if (!iconName)
    return (
      <div className="hidden lg:flex flex-col h-full items-center justify-center text-slate-500 bg-[#1e1e1e] border-l border-[#3e3e42] p-6 text-center">
        <div className="mb-4 p-4 rounded-full bg-[#252526]">
          <Sliders size={32} className="opacity-50" />
        </div>
        <p>Chọn một icon để xem chi tiết và lấy code</p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#3e3e42]">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 className="font-bold text-white truncate max-w-[180px] text-lg">
            {iconName}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-lg border transition-all ${
              isFavorite
                ? "bg-pink-500/10 border-pink-500 text-pink-500"
                : "bg-[#1e1e1e] border-[#3e3e42] text-slate-400 hover:text-white"
            }`}
          >
            <Heart size={18} className={isFavorite ? "fill-current" : ""} />
          </button>
          <button
            onClick={onClose}
            className="hidden lg:block p-2 text-slate-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PREVIEW BOX */}
      <div className="h-64 shrink-0 flex items-center justify-center bg-[#151515] relative overflow-hidden border-b border-[#3e3e42]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
        {SelectedIconComponent && (
          <SelectedIconComponent
            size={customProps.size}
            color={customProps.color}
            strokeWidth={customProps.strokeWidth}
            className="relative z-10 drop-shadow-2xl transition-all duration-200"
          />
        )}
        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-500 bg-[#1e1e1e] border border-[#3e3e42] px-2 py-1 rounded shadow-sm">
          {customProps.size}px
        </div>
      </div>

      {/* CONTROLS & CODE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20 lg:pb-6">
        {/* Customize Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <Sliders size={12} /> Customize
            </label>
            <button
              onClick={onReset}
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          {/* Size Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Size</span> <span>{customProps.size}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="128"
              step="4"
              value={customProps.size}
              onChange={(e) =>
                setCustomProps((p) => ({ ...p, size: Number(e.target.value) }))
              }
              className="w-full h-1.5 bg-[#3e3e42] rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Stroke Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Stroke</span> <span>{customProps.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.25"
              value={customProps.strokeWidth}
              onChange={(e) =>
                setCustomProps((p) => ({
                  ...p,
                  strokeWidth: Number(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-[#3e3e42] rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Color</span>
              <span className="uppercase font-mono">{customProps.color}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={customProps.color}
                onChange={(e) =>
                  setCustomProps((p) => ({ ...p, color: e.target.value }))
                }
                className="w-9 h-9 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={customProps.color}
                onChange={(e) =>
                  setCustomProps((p) => ({ ...p, color: e.target.value }))
                }
                className="flex-1 bg-[#252526] border border-[#3e3e42] rounded px-3 text-xs text-white outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Code Snippets Section */}
        <div className="pt-4 border-t border-[#3e3e42]">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
            <FileCode size={12} /> Copy Code
          </label>

          <div className="flex bg-[#252526] p-1 rounded-lg mb-4 border border-[#3e3e42]">
            <button
              onClick={() => setCodeMode("react")}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                codeMode === "react"
                  ? "bg-[#3e3e42] text-white shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Braces size={12} /> React
            </button>
            <button
              onClick={() => setCodeMode("web")}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                codeMode === "web"
                  ? "bg-[#3e3e42] text-white shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Globe size={12} /> Web / CDN
            </button>
          </div>

          <div className="space-y-3">
            {codeMode === "react" ? (
              <>
                <CopyButton
                  label="JSX Component"
                  code={generateCode("jsx")}
                  onCopy={() => handleCopy(generateCode("jsx"), "jsx")}
                  isCopied={copied === "jsx"}
                  color="text-blue-400"
                />
                <CopyButton
                  label="Import"
                  code={generateCode("import")}
                  onCopy={() => handleCopy(generateCode("import"), "import")}
                  isCopied={copied === "import"}
                  color="text-pink-400"
                />
              </>
            ) : (
              <>
                <CopyButton
                  label="CDN URL (SVG)"
                  code={generateCode("url")}
                  onCopy={() => handleCopy(generateCode("url"), "url")}
                  isCopied={copied === "url"}
                  color="text-teal-400"
                  Icon={LinkIcon}
                />
                <CopyButton
                  label="HTML Tag"
                  code={generateCode("html")}
                  onCopy={() => handleCopy(generateCode("html"), "html")}
                  isCopied={copied === "html"}
                  color="text-orange-400"
                />
                <CopyButton
                  label="SVG Code"
                  code={generateCode("svg")}
                  onCopy={() => handleCopy(generateCode("svg"), "svg")}
                  isCopied={copied === "svg"}
                  color="text-purple-400"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
