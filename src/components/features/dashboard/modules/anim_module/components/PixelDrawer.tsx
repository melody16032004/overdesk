import { useEffect, useRef, useState } from "react";
import { floodFill } from "../helper/anim_helper";
import {
  CheckCircle,
  Download,
  Eraser,
  FileImage,
  FileX,
  FolderOpen,
  Grid3X3,
  Hand,
  Move,
  PaintBucket,
  PenTool,
  Pipette,
  RotateCcw,
  Save,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";

export const PixelDrawer = ({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (blob: Blob) => void;
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [gridSize, setGridSize] = useState(32);
  const [color, setColor] = useState("#3b82f6");
  const [recentColors, setRecentColors] = useState<string[]>([
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#ffffff",
    "#000000",
  ]);
  const [tool, setTool] = useState<
    "pen" | "eraser" | "bucket" | "picker" | "move"
  >("pen");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Logic Flow State
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showImportPrompt, setShowImportPrompt] = useState(false);
  const [tempBlob, setTempBlob] = useState<Blob | null>(null);

  // Refs
  const isSpacePressed = useRef(false);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 }); // Dùng cho Pan View
  const dragStartPos = useRef({ x: 0, y: 0 }); // Dùng cho Move Tool
  const [history, setHistory] = useState<ImageData[]>([]);
  const clipboardRef = useRef<ImageData | null>(null);
  const pendingImportImage = useRef<HTMLImageElement | null>(null);

  // 🔥 NEW: Ref để lưu trạng thái ảnh trước khi di chuyển
  const moveSnapshot = useRef<ImageData | null>(null);

  // Init & Handle Grid Change
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (pendingImportImage.current) {
          ctx.drawImage(pendingImportImage.current, 0, 0);
          pendingImportImage.current = null;
        }
        saveHistory();
      }
    }
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      setPan({ x: (cw - 512) / 2, y: (ch - 512) / 2 });
    }
  }, [gridSize]);

  // History Logic
  const saveHistory = () => {
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (ctx)
      setHistory((prev) => [
        ...prev.slice(-19),
        ctx.getImageData(0, 0, gridSize, gridSize),
      ]);
    updateMiniMap();
  };
  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prev = newHistory[newHistory.length - 1];
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (ctx && prev) {
      ctx.putImageData(prev, 0, 0);
      setHistory(newHistory);
      updateMiniMap();
    }
  };
  const resetCanvas = () => {
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, gridSize, gridSize);
      saveHistory();
    }
  };
  const updateMiniMap = () => {
    const ctx = miniMapRef.current?.getContext("2d");
    if (ctx && mainCanvasRef.current) {
      ctx.fillStyle = "#333";
      ctx.fillRect(0, 0, gridSize, gridSize);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mainCanvasRef.current, 0, 0);
    }
  };

  // --- IMPORT FILE ---
  const triggerFileImport = () => fileInputRef.current?.click();
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = new Image();
      img.onload = () => {
        const maxDim = Math.max(img.width, img.height);
        pendingImportImage.current = img;
        setGridSize(maxDim);
        setZoom(1);
      };
      img.src = URL.createObjectURL(e.target.files[0]);
    }
  };

  // --- EXPORT FLOW ---
  const handleTriggerSave = () => setShowSaveOptions(true);
  const processDownload = (format: "png-trans" | "png-opaque" | "jpg") => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext("2d");
    if (!tCtx) return;
    if (format !== "png-trans") {
      tCtx.fillStyle = "#ffffff";
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    tCtx.drawImage(canvas, 0, 0);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const link = document.createElement("a");
    link.download = `pixel_art_${Date.now()}.${
      format === "jpg" ? "jpg" : "png"
    }`;
    link.href = tempCanvas.toDataURL(mime);
    link.click();
    tempCanvas.toBlob((blob) => {
      setTempBlob(blob);
      setShowSaveOptions(false);
      setShowImportPrompt(true);
    }, mime);
  };
  const handleImportDecision = (shouldImport: boolean) => {
    setShowImportPrompt(false);
    if (shouldImport && tempBlob) onSave(tempBlob);
  };

  // --- INPUT HANDLERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressed.current = true;
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "p":
            setTool("pen");
            break;
          case "e":
            setTool("eraser");
            break;
          case "b":
            setTool("bucket");
            break;
          case "v":
            setTool("move");
            break;
        }
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            undo();
            break;
          case "c":
            e.preventDefault();
            const ctx = mainCanvasRef.current?.getContext("2d");
            if (ctx)
              clipboardRef.current = ctx.getImageData(0, 0, gridSize, gridSize);
            break;
          case "v":
            e.preventDefault();
            const ctx2 = mainCanvasRef.current?.getContext("2d");
            if (ctx2 && clipboardRef.current) {
              ctx2.putImageData(clipboardRef.current, 0, 0);
              saveHistory();
            }
            break;
          case "d":
            e.preventDefault();
            resetCanvas();
            break;
          case "s":
            e.preventDefault();
            handleTriggerSave();
            break;
          case "x":
            e.preventDefault();
            onClose();
            break;
          case "q":
            e.preventDefault();
            setTool("picker");
            break;
          case "e":
            e.preventDefault();
            setTool("bucket");
            break;
          case "o":
            e.preventDefault();
            triggerFileImport();
            break;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [history, gridSize]);

  const handleWheel = (e: React.WheelEvent) =>
    setZoom((prev) =>
      Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 20),
    );

  // START INTERACTION
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { x: e.clientX, y: e.clientY }; // Lưu vị trí bắt đầu kéo

    // Nếu đang giữ Space -> Chế độ PAN (Di chuyển view)
    if (isSpacePressed.current) return;

    // Nếu công cụ là MOVE -> Lưu snapshot hình ảnh hiện tại
    if (tool === "move") {
      const canvas = mainCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        moveSnapshot.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
      return;
    }

    // Các công cụ vẽ
    paint(e);
  };

  // MOVE INTERACTION
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx_screen = e.clientX - lastMousePos.current.x;
    const dy_screen = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // 1. Logic Pan View (Space)
    if (isSpacePressed.current) {
      setPan((prev) => ({ x: prev.x + dx_screen, y: prev.y + dy_screen }));
      return;
    }

    // 2. Logic Move Tool (Di chuyển Pixels)
    if (tool === "move") {
      const canvas = mainCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !moveSnapshot.current) return;

      // Tính toán khoảng cách di chuyển theo Pixel Lưới
      // Công thức: Delta Screen / Scale = Delta Grid Pixel
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;

      const totalDxScreen = e.clientX - dragStartPos.current.x;
      const totalDyScreen = e.clientY - dragStartPos.current.y;

      const pixelDx = Math.round(totalDxScreen / scaleX);
      const pixelDy = Math.round(totalDyScreen / scaleY);

      // Xóa canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Vẽ lại snapshot tại vị trí mới (Tự động cắt nếu ra ngoài)
      ctx.putImageData(moveSnapshot.current, pixelDx, pixelDy);
      return;
    }

    // 3. Logic Vẽ
    if (tool === "pen" || tool === "eraser") paint(e);
  };

  // END INTERACTION
  const handlePointerUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      // Lưu history nếu có thay đổi
      if (!isSpacePressed.current && tool !== "picker") {
        saveHistory();
        moveSnapshot.current = null; // Clear snapshot sau khi move xong
      }
      if (tool === "picker") setTool("pen");
    }
  };

  const paint = (e: React.PointerEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
    const activeTool = e.buttons === 2 || e.button === 2 ? "eraser" : tool;
    if (activeTool === "pen") {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
      addToHistory(color);
    } else if (activeTool === "eraser") ctx.clearRect(x, y, 1, 1);
    else if (activeTool === "bucket")
      floodFill(ctx, x, y, color, canvas.width, canvas.height);
    else if (activeTool === "picker") {
      const p = ctx.getImageData(x, y, 1, 1).data;
      if (p[3] > 0)
        setColor(
          "#" +
            ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2])
              .toString(16)
              .slice(1),
        );
    }
  };
  const addToHistory = (c: string) => {
    if (!recentColors.includes(c))
      setRecentColors((prev) => [c, ...prev].slice(0, 8));
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#12121a] flex flex-col text-slate-200 font-sans select-none animate-in fade-in zoom-in-95">
      {showSaveOptions && (
        <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-4 text-indigo-400 font-bold text-lg">
              <Download /> Save & Download
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Choose format to download:
            </p>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => processDownload("png-trans")}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-between group"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FileImage size={16} className="text-emerald-400" /> PNG
                  (Transparent)
                </span>
                <CheckCircle
                  size={16}
                  className="opacity-0 group-hover:opacity-100 text-emerald-400"
                />
              </button>
              <button
                onClick={() => processDownload("png-opaque")}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-between group"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FileImage size={16} className="text-blue-400" /> PNG (White
                  BG)
                </span>
                <CheckCircle
                  size={16}
                  className="opacity-0 group-hover:opacity-100 text-blue-400"
                />
              </button>
              <button
                onClick={() => processDownload("jpg")}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-between group"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FileImage size={16} className="text-orange-400" /> JPG (White
                  BG)
                </span>
                <CheckCircle
                  size={16}
                  className="opacity-0 group-hover:opacity-100 text-orange-400"
                />
              </button>
            </div>
            <button
              onClick={() => setShowSaveOptions(false)}
              className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showImportPrompt && (
        <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <Zap size={32} />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">
              Import to Animation?
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              File downloaded. Add this sprite to your animation?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleImportDecision(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-sm text-zinc-300"
              >
                No, Keep Drawing
              </button>
              <button
                onClick={() => handleImportDecision(true)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-sm text-white"
              >
                Yes, Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#18181b] shrink-0">
        <div className="flex items-center gap-2 font-bold text-indigo-400">
          <PenTool size={18} /> Pixel Artist
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
            <span>Space: Pan</span>
            <div className="w-[1px] h-3 bg-zinc-600"></div>
            <span>V: Move Layer</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={triggerFileImport}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 border border-white/10"
          >
            <FolderOpen size={14} /> Open
          </button>
          <button
            onClick={handleTriggerSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-lg"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={onClose}
            className="hover:bg-red-500/20 hover:text-red-400 p-2 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-16 bg-[#18181b] border-r border-white/10 flex flex-col items-center py-4 gap-4 z-10 shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-2 w-full px-2">
            {[
              { id: "pen", icon: PenTool, label: "Pen (P)" },
              { id: "bucket", icon: PaintBucket, label: "Fill (B)" },
              { id: "picker", icon: Pipette, label: "Pick (Q)" },
              { id: "eraser", icon: Eraser, label: "Erase (E)" },
              { id: "move", icon: Move, label: "Move Pixels (V)" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as any)}
                className={`p-2.5 rounded-lg transition-all relative group ${
                  tool === t.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-zinc-500 hover:bg-zinc-800"
                }`}
                title={t.label}
              >
                <t.icon size={20} />
              </button>
            ))}
          </div>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <div className="flex flex-col gap-2 px-2">
            <button
              onClick={undo}
              className="p-2 rounded hover:bg-zinc-800 text-zinc-500"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={resetCanvas}
              className="p-2 rounded hover:bg-red-900/30 text-red-500"
              title="Reset (Ctrl+D)"
            >
              <FileX size={18} />
            </button>
          </div>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <div className="flex flex-col gap-3 items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/20 p-0 overflow-hidden bg-transparent"
            />
            <div className="grid grid-cols-2 gap-1">
              {recentColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-4 h-4 rounded-sm border border-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="text-[8px] text-zinc-500 uppercase font-bold">
                Grid
              </span>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="bg-zinc-900 text-white text-xs p-1 rounded border border-zinc-700 outline-none w-12 text-center"
              >
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
                <option value="128">128</option>
              </select>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 bg-[#09090b] relative overflow-hidden cursor-crosshair flex items-center justify-center"
        >
          <div
            className="relative shadow-2xl"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "512px",
              height: "512px",
            }}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "#202020",
                backgroundImage: showGrid
                  ? `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`
                  : undefined,
                backgroundSize: `${512 / gridSize}px ${512 / gridSize}px`,
                imageRendering: "pixelated",
              }}
            ></div>
            <canvas
              ref={mainCanvasRef}
              width={gridSize}
              height={gridSize}
              className="absolute inset-0 w-full h-full"
              style={{ imageRendering: "pixelated" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Grid3X3 size={14} /> {gridSize}x{gridSize}
            </div>
            <div className="w-[1px] h-3 bg-white/20"></div>
            <div className="flex items-center gap-1">
              <ZoomIn size={14} /> {Math.round(zoom * 100)}%
            </div>
            <div className="w-[1px] h-3 bg-white/20"></div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`font-bold ${
                showGrid ? "text-indigo-400" : "text-zinc-500"
              }`}
            >
              GRID
            </button>
          </div>
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-[#18181b] border-2 border-white/20 rounded shadow-2xl overflow-hidden pointer-events-none opacity-80">
            <canvas
              ref={miniMapRef}
              width={gridSize}
              height={gridSize}
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          {/* Tooltip for Space Pan */}
          {isSpacePressed.current && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <Hand size={14} /> Panning Mode
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
