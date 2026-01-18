import { useState, useRef } from "react";
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  RotateCcw,
  MoveHorizontal,
  MoveVertical,
  Globe,
  ZoomIn,
  ZoomOut,
  Search,
  ExternalLink,
  SmartphoneNfc,
  Maximize,
  Scan,
} from "lucide-react";

// --- TYPES & CONFIG ---
type DeviceType = "mobile" | "tablet" | "desktop" | "custom";

interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  type: DeviceType;
  icon: any;
}

const DEVICES: Device[] = [
  {
    id: "iphone_se",
    name: "iPhone SE",
    width: 375,
    height: 667,
    type: "mobile",
    icon: Smartphone,
  },
  {
    id: "iphone_14",
    name: "iPhone 14",
    width: 390,
    height: 844,
    type: "mobile",
    icon: Smartphone,
  },
  {
    id: "iphone_14_pro",
    name: "14 Pro Max",
    width: 430,
    height: 932,
    type: "mobile",
    icon: SmartphoneNfc,
  },
  {
    id: "ipad_mini",
    name: "iPad Mini",
    width: 768,
    height: 1024,
    type: "tablet",
    icon: Tablet,
  },
  {
    id: "ipad_pro",
    name: "iPad Pro",
    width: 1024,
    height: 1366,
    type: "tablet",
    icon: Tablet,
  },
  {
    id: "laptop",
    name: "Laptop",
    width: 1366,
    height: 768,
    type: "desktop",
    icon: Laptop,
  },
  {
    id: "desktop_hd",
    name: "Desktop HD",
    width: 1920,
    height: 1080,
    type: "desktop",
    icon: Monitor,
  },
];

export const ResponsiveViewerModule = () => {
  // State
  const [url, setUrl] = useState("https://wikipedia.org");
  const [inputUrl, setInputUrl] = useState("https://wikipedia.org");
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[1]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [scale, setScale] = useState(0.6); // Default 60%
  const [showFrame, setShowFrame] = useState(true);
  const [customSize, setCustomSize] = useState({ width: 375, height: 667 });
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- ACTIONS ---
  const handleLoadUrl = () => {
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    // Check if localhost
    if (finalUrl.includes("localhost") && !finalUrl.startsWith("http://")) {
      finalUrl = finalUrl.replace("https://", "http://");
    }

    setInputUrl(finalUrl);
    if (finalUrl !== url) {
      setIsLoading(true);
      setUrl(finalUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLoadUrl();
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  const handleDeviceSelect = (device: Device) => {
    setIsCustom(false);
    setSelectedDevice(device);
    // Auto adjust scale for larger devices
    if (device.width > 1000) setScale(0.4);
    else if (device.width > 500) setScale(0.5);
    else setScale(0.7);
  };

  const switchToCustom = () => {
    setIsCustom(true);
    setCustomSize({
      width:
        orientation === "portrait"
          ? selectedDevice.width
          : selectedDevice.height,
      height:
        orientation === "portrait"
          ? selectedDevice.height
          : selectedDevice.width,
    });
  };

  // Tính toán kích thước hiển thị
  const displayW = isCustom
    ? customSize.width
    : orientation === "portrait"
    ? selectedDevice.width
    : selectedDevice.height;
  const displayH = isCustom
    ? customSize.height
    : orientation === "portrait"
    ? selectedDevice.height
    : selectedDevice.width;

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* 1. TOP BAR: URL & GLOBAL ACTIONS */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md z-20 flex flex-col sm:flex-row gap-3 items-center">
        {/* URL Input */}
        <div className="flex gap-2 w-full sm:w-auto sm:flex-1">
          <div className="flex-1 relative group">
            <Globe
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
            />
            <input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono transition-all shadow-sm"
              placeholder="Enter URL (localhost:3000)..."
            />
          </div>
          <button
            onClick={handleLoadUrl}
            className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              setIsLoading(true);
              const u = url;
              setUrl("");
              setTimeout(() => setUrl(u), 100);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700"
            title="Reload Frame"
          >
            <RotateCcw size={16} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700 flex items-center gap-2 text-xs font-bold no-underline"
          >
            <ExternalLink size={16} />{" "}
            <span className="hidden sm:inline">Mở tab mới</span>
          </a>
        </div>
      </div>

      {/* 2. SECONDARY BAR: DEVICE TOOLS */}
      <div className="flex-none px-3 py-2 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
        {/* Device List */}
        <div className="flex items-center gap-1">
          {DEVICES.map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceSelect(device)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                !isCustom && selectedDevice.id === device.id
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <device.icon size={14} /> {device.name}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-800 mx-1"></div>
          <button
            onClick={switchToCustom}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
              isCustom
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Scan size={14} /> Custom
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Custom Size Inputs (Only Show when Custom Mode) */}
          {isCustom && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-right-2">
              <input
                type="number"
                value={customSize.width}
                onChange={(e) =>
                  setCustomSize({
                    ...customSize,
                    width: Number(e.target.value),
                  })
                }
                className="w-12 bg-transparent text-center text-[10px] text-white outline-none border-b border-slate-700 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500">x</span>
              <input
                type="number"
                value={customSize.height}
                onChange={(e) =>
                  setCustomSize({
                    ...customSize,
                    height: Number(e.target.value),
                  })
                }
                className="w-12 bg-transparent text-center text-[10px] text-white outline-none border-b border-slate-700 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Frame Toggle */}
          <button
            onClick={() => setShowFrame(!showFrame)}
            className={`p-1.5 rounded-lg transition-all ${
              showFrame
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-slate-500 hover:text-slate-300"
            }`}
            title="Bật/Tắt Khung thiết bị"
          >
            <Maximize size={16} />
          </button>

          {/* Orientation */}
          <button
            onClick={toggleOrientation}
            disabled={isCustom}
            className={`p-1.5 rounded-lg transition-all ${
              isCustom
                ? "opacity-30 cursor-not-allowed"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Xoay thiết bị"
          >
            {orientation === "portrait" ? (
              <MoveVertical size={16} />
            ) : (
              <MoveHorizontal size={16} />
            )}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setScale((s) => Math.max(0.2, s - 0.1))}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-mono text-indigo-300 w-8 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN AREA: IFRAME CONTAINER */}
      <div className="flex-1 overflow-auto bg-[#09090b] relative flex items-start justify-center p-8 custom-scrollbar">
        {/* Grid Background Effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div
          className={`transition-all duration-500 ease-in-out relative origin-top mt-4 ${
            showFrame && !isCustom && selectedDevice.type !== "desktop"
              ? "bg-black shadow-2xl"
              : "bg-white shadow-lg"
          }`}
          style={{
            width: displayW,
            height: displayH,
            transform: `scale(${scale})`,
            borderRadius:
              showFrame && !isCustom
                ? selectedDevice.type === "mobile"
                  ? "40px"
                  : selectedDevice.type === "tablet"
                  ? "24px"
                  : "8px"
                : "0px",
            border:
              showFrame && !isCustom
                ? selectedDevice.type === "desktop"
                  ? "none"
                  : "12px solid #1e293b"
                : "none",
          }}
        >
          {/* Notch / Camera Decoration (Chỉ hiện khi bật Frame + Mobile) */}
          {showFrame && !isCustom && selectedDevice.type === "mobile" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-[#1e293b] rounded-b-xl z-20 pointer-events-none flex justify-center items-center">
              <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
            </div>
          )}

          {/* Status Bar Fake (Optional) */}
          {showFrame && !isCustom && selectedDevice.type === "mobile" && (
            <div className="absolute top-2 right-5 z-20 pointer-events-none flex gap-1">
              <div className="w-4 h-2 bg-slate-800 rounded-sm"></div>
              <div className="w-3 h-2 bg-slate-800 rounded-sm"></div>
            </div>
          )}

          {/* The Iframe */}
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={() => setIsLoading(false)}
            className="w-full h-full bg-white relative z-10"
            style={{
              borderRadius:
                showFrame && !isCustom
                  ? selectedDevice.type === "mobile"
                    ? "30px"
                    : selectedDevice.type === "tablet"
                    ? "14px"
                    : "0px"
                  : "0px",
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="Responsive Viewer"
          />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col items-center justify-center gap-2 rounded-[inherit]">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium animate-pulse">
                Loading...
              </p>
            </div>
          )}

          {/* Size Label (Bottom) */}
          <div className="absolute -bottom-10 left-0 right-0 text-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 backdrop-blur rounded-full text-[10px] text-slate-300 border border-slate-700 shadow-lg">
              <span className="font-bold text-white">
                {displayW} x {displayH}
              </span>
              <span className="text-slate-500">|</span>
              <span>{selectedDevice.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
