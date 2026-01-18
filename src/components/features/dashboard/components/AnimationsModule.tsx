import React, { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import {
  Play,
  Pause,
  Upload,
  Trash2,
  Zap,
  Grid,
  Scissors,
  Video,
  Menu,
  X,
  MoreVertical,
  CheckSquare,
  Square,
  Edit,
  Crosshair,
  MousePointer2,
  PenTool,
  Eraser,
  Save,
  AlertTriangle,
  Grid3X3,
  PaintBucket,
  Pipette,
  Move,
  ZoomIn,
  RotateCcw,
  FileX,
  FileImage,
  Download,
  FolderOpen,
  CheckCircle,
  Hand, // Icon bàn tay cho Pan
} from "lucide-react";

// --- TYPES ---
type AnimGroupData = {
  id: string;
  name: string;
  imageBlobs: Blob[];
  sliceConfig?: { cols: number; rows: number };
};
type AnimGroupRuntime = AnimGroupData & { frames: PIXI.Texture[] };

// --- DB HELPER ---
const DB_NAME = "PixelStudioDB";
const STORE_NAME = "animations";
const dbHelper = {
  open: () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
  save: async (data: AnimGroupData) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await dbHelper.open();
    return new Promise<AnimGroupData[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id: string) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

// --- ALGORITHMS ---
const floodFill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  width: number,
  height: number
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixelData = imgData.data;
  const hex = fillColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const startPos = (y * width + x) * 4;
  const startR = pixelData[startPos];
  const startG = pixelData[startPos + 1];
  const startB = pixelData[startPos + 2];
  const startA = pixelData[startPos + 3];
  if (startR === r && startG === g && startB === b && startA === 255) return;
  const matchStartColor = (pos: number) =>
    pixelData[pos] === startR &&
    pixelData[pos + 1] === startG &&
    pixelData[pos + 2] === startB &&
    pixelData[pos + 3] === startA;
  const colorPixel = (pos: number) => {
    pixelData[pos] = r;
    pixelData[pos + 1] = g;
    pixelData[pos + 2] = b;
    pixelData[pos + 3] = 255;
  };
  const stack = [[x, y]];
  while (stack.length) {
    const newPos = stack.pop();
    if (!newPos) continue;
    const [cx, cy] = newPos;
    const pixelPos = (cy * width + cx) * 4;
    if (
      cx >= 0 &&
      cx < width &&
      cy >= 0 &&
      cy < height &&
      matchStartColor(pixelPos)
    ) {
      colorPixel(pixelPos);
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }
  }
  ctx.putImageData(imgData, 0, 0);
};

// --- COMPONENT: PIXEL DRAWER (V11 - MOVE TOOL) ---
const PixelDrawer = ({
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
      Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 20)
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
          canvas.height
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
              .slice(1)
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

// --- MAIN WRAPPER (No changes to logic below) ---
export const FrameAnimationUltimate = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesMapRef = useRef<Map<string, PIXI.AnimatedSprite>>(new Map());

  const [animGroups, setAnimGroups] = useState<AnimGroupRuntime[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [scale, setScale] = useState(2);
  const [bgColor, setBgColor] = useState("#18181b");
  const [loop /*, setLoop*/] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [showSlicer, setShowSlicer] = useState(false);
  const [showPixelDrawer, setShowPixelDrawer] = useState(false);
  const [slicerImage, setSlicerImage] = useState<string | null>(null);
  const [sliceConfig, setSliceConfig] = useState({ rows: 1, cols: 6 });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [modalRename, setModalRename] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
  }>({ isOpen: false, id: null, name: "" });
  const [modalDelete, setModalDelete] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!document.getElementById("gifshot-script")) {
      const script = document.createElement("script");
      script.id = "gifshot-script";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js";
      document.body.appendChild(script);
    }
    PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.ROUND_PIXELS = true;
    if (!containerRef.current) return;
    const parent = containerRef.current;
    const app = new PIXI.Application({
      resizeTo: parent,
      backgroundAlpha: 0,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
    });
    parent.appendChild(app.view as any);
    appRef.current = app;

    const loadData = async () => {
      try {
        const storedData = await dbHelper.getAll();
        if (storedData && storedData.length > 0) {
          const loadedGroups: AnimGroupRuntime[] = storedData.map((d) => ({
            ...d,
            frames: d.imageBlobs.map((blob) =>
              PIXI.Texture.from(URL.createObjectURL(blob))
            ),
          }));
          setAnimGroups(loadedGroups);
          if (loadedGroups.length > 0) {
            setActiveIds(new Set([loadedGroups[0].id]));
            setFocusedId(loadedGroups[0].id);
          }
        }
      } catch (e) {}
    };
    loadData();

    const canvas = app.view as HTMLCanvasElement;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("contextmenu", handleContextMenu);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      canvas.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", checkMobile);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  const saveGroupToDB = async (group: AnimGroupRuntime) => {
    const dataToSave: AnimGroupData = {
      id: group.id,
      name: group.name,
      imageBlobs: group.imageBlobs,
      sliceConfig: group.sliceConfig,
    };
    await dbHelper.save(dataToSave);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    if (files.length === 1 && files[0].type.startsWith("image/")) {
      const url = URL.createObjectURL(files[0]);
      setSlicerImage(url);
      setShowSlicer(true);
      setSliceConfig({ rows: 1, cols: 6 });
      return;
    }
    processMultipleFiles(files);
  };

  const processMultipleFiles = async (files: File[]) => {
    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
    const groups: Record<string, File[]> = {};
    files.forEach((f) => {
      const nameKey = f.name
        .replace(/[-_]?\d+\.(png|jpg|jpeg)$/i, "")
        .replace(/\.(png|jpg|jpeg)$/i, "");
      const key = nameKey || "Sequence";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    const newGroupsPromise = Object.keys(groups).map(async (key) => {
      const groupFiles = groups[key];
      const textures = groupFiles.map((f) =>
        PIXI.Texture.from(URL.createObjectURL(f))
      );
      const newGroup: AnimGroupRuntime = {
        id: key + "_" + Date.now(),
        name: key,
        frames: textures,
        imageBlobs: groupFiles,
      };
      await saveGroupToDB(newGroup);
      return newGroup;
    });
    const newGroups = await Promise.all(newGroupsPromise);
    setAnimGroups((prev) => [...prev, ...newGroups]);
    if (newGroups.length > 0) {
      setActiveIds((prev) => new Set(prev).add(newGroups[0].id));
      setFocusedId(newGroups[0].id);
    }
  };

  const handlePixelSave = async (blob: Blob) => {
    const texture = PIXI.Texture.from(URL.createObjectURL(blob));
    const newId = "Pixel_" + Date.now();
    const newGroup: AnimGroupRuntime = {
      id: newId,
      name: "Pixel Art",
      frames: [texture],
      imageBlobs: [blob],
    };
    await saveGroupToDB(newGroup);
    setAnimGroups((prev) => [...prev, newGroup]);
    setActiveIds((prev) => new Set(prev).add(newId));
    setFocusedId(newId);
    setShowPixelDrawer(false);
  };

  const handleSliceConfirm = async () => {
    if (!slicerImage || !appRef.current) return;
    const baseTexture = PIXI.BaseTexture.from(slicerImage);
    const tempImg = new Image();
    tempImg.src = slicerImage;
    tempImg.onload = async () => {
      const w = tempImg.width / sliceConfig.cols;
      const h = tempImg.height / sliceConfig.rows;
      const textures: PIXI.Texture[] = [];
      const blobs: Blob[] = [];
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext("2d");
      for (let r = 0; r < sliceConfig.rows; r++) {
        for (let c = 0; c < sliceConfig.cols; c++) {
          try {
            const rect = new PIXI.Rectangle(c * w, r * h, w, h);
            textures.push(new PIXI.Texture(baseTexture, rect));
          } catch (e) {}
          if (ctx) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(tempImg, c * w, r * h, w, h, 0, 0, w, h);
            await new Promise<void>((resolve) =>
              tempCanvas.toBlob((b) => {
                if (b) blobs.push(b);
                resolve();
              })
            );
          }
        }
      }
      if (editingGroupId) {
        const updatedGroup = animGroups.find((g) => g.id === editingGroupId);
        if (updatedGroup) {
          const newGroup = {
            ...updatedGroup,
            frames: textures,
            imageBlobs: blobs,
            sliceConfig,
          };
          await saveGroupToDB(newGroup);
          setAnimGroups((prev) =>
            prev.map((g) => (g.id === editingGroupId ? newGroup : g))
          );
          const sprite = spritesMapRef.current.get(editingGroupId);
          if (sprite) {
            sprite.textures = textures;
            sprite.play();
          }
        }
      } else {
        const newId = "Sheet_" + Date.now();
        const newGroup: AnimGroupRuntime = {
          id: newId,
          name: "Sliced Sheet",
          frames: textures,
          imageBlobs: blobs,
          sliceConfig,
        };
        await saveGroupToDB(newGroup);
        setAnimGroups((prev) => [...prev, newGroup]);
        setActiveIds((prev) => new Set(prev).add(newId));
        setFocusedId(newId);
      }
      setShowSlicer(false);
      setSlicerImage(null);
      setEditingGroupId(null);
    };
  };

  const confirmDelete = async () => {
    if (modalDelete.id) {
      await dbHelper.delete(modalDelete.id);
      setAnimGroups((prev) => prev.filter((g) => g.id !== modalDelete.id));
      setActiveIds((prev) => {
        const n = new Set(prev);
        n.delete(modalDelete.id!);
        return n;
      });
      if (focusedId === modalDelete.id) setFocusedId(null);
    }
    setModalDelete({ isOpen: false, id: null });
  };

  const confirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalRename.id && modalRename.name) {
      const group = animGroups.find((g) => g.id === modalRename.id);
      if (group) {
        const newGroup = { ...group, name: modalRename.name };
        await saveGroupToDB(newGroup);
        setAnimGroups((prev) =>
          prev.map((g) => (g.id === modalRename.id ? newGroup : g))
        );
      }
    }
    setModalRename({ isOpen: false, id: null, name: "" });
  };

  const exportStrip = () => {
    const group = animGroups.find((g) => g.id === focusedId);
    if (!group) return;
    const frames = group.frames;
    if (frames.length === 0) return;
    const frameW = frames[0].width;
    const frameH = frames[0].height;
    const canvas = document.createElement("canvas");
    canvas.width = frameW * frames.length;
    canvas.height = frameH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const renderTexture = (index: number) => {
      if (index >= frames.length) {
        const link = document.createElement("a");
        link.download = `${group.name}_strip.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
      }
      const tex = frames[index];
      const img = (tex.baseTexture.resource as any).source as HTMLImageElement;
      if (img)
        ctx.drawImage(
          img,
          tex.frame.x,
          tex.frame.y,
          tex.frame.width,
          tex.frame.height,
          index * frameW,
          0,
          frameW,
          frameH
        );
      renderTexture(index + 1);
    };
    renderTexture(0);
  };

  const exportGIF = () => {
    const group = animGroups.find((g) => g.id === focusedId);
    if (!group) return;
    // @ts-ignore
    if (typeof gifshot === "undefined") {
      alert("Loading GIF lib...");
      return;
    }
    const images: string[] = [];
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    tempCanvas.width = group.frames[0].width;
    tempCanvas.height = group.frames[0].height;
    group.frames.forEach((tex) => {
      ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      const img = (tex.baseTexture.resource as any).source as HTMLImageElement;
      if (img) {
        ctx.drawImage(
          img,
          tex.frame.x,
          tex.frame.y,
          tex.frame.width,
          tex.frame.height,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        images.push(tempCanvas.toDataURL());
      }
    });
    // @ts-ignore
    gifshot.createGIF(
      {
        images,
        interval: 1 / fps,
        gifWidth: tempCanvas.width * scale,
        gifHeight: tempCanvas.height * scale,
      },
      (obj: any) => {
        if (!obj.error) {
          const link = document.createElement("a");
          link.download = `${group.name}.gif`;
          link.href = obj.image;
          link.click();
        }
      }
    );
  };

  useEffect(() => {
    if (!appRef.current) return;
    const app = appRef.current;
    spritesMapRef.current.forEach((sprite, id) => {
      if (!activeIds.has(id)) {
        sprite.destroy();
        app.stage.removeChild(sprite);
        spritesMapRef.current.delete(id);
      }
    });
    activeIds.forEach((id) => {
      if (!spritesMapRef.current.has(id)) {
        const group = animGroups.find((g) => g.id === id);
        if (group) {
          const sprite = new PIXI.AnimatedSprite(group.frames);
          sprite.anchor.set(0.5);
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;
          sprite.animationSpeed = 12 / 60;
          sprite.play();
          group.frames.forEach(
            (t) => (t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST)
          );
          sprite.eventMode = "static";
          sprite.cursor = "grab";
          let dragData: any = null;
          sprite.on("pointerdown", (e) => {
            dragData = e.data;
            sprite.alpha = 0.6;
            sprite.cursor = "grabbing";
            setFocusedId(id);
          });
          sprite.on("pointermove", () => {
            if (dragData) {
              const newPos = dragData.getLocalPosition(sprite.parent);
              sprite.x = newPos.x;
              sprite.y = newPos.y;
            }
          });
          const end = () => {
            dragData = null;
            sprite.alpha = 1;
            sprite.cursor = "grab";
          };
          sprite.on("pointerup", end);
          sprite.on("pointerupoutside", end);
          sprite.on("rightdown", () => {
            sprite.x = app.screen.width / 2;
            sprite.y = app.screen.height / 2;
          });
          app.stage.addChild(sprite);
          spritesMapRef.current.set(id, sprite);
          sprite.scale.set(2);
        }
      }
    });
  }, [activeIds, animGroups]);

  useEffect(() => {
    if (!focusedId) return;
    const sprite = spritesMapRef.current.get(focusedId);
    if (sprite) {
      sprite.animationSpeed = fps / 60;
      sprite.scale.set(scale);
      sprite.loop = loop;
      if (isPlaying && !sprite.playing) sprite.play();
      if (!isPlaying && sprite.playing) sprite.stop();
    }
  }, [focusedId, fps, scale, loop, isPlaying]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!focusedId) return;
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) =>
          Math.max(0.1, Math.min(20, parseFloat((prev + delta).toFixed(1))))
        );
      }
    };
    const handleContext = (e: MouseEvent) => {
      if (!focusedId) return;
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        const sprite = spritesMapRef.current.get(focusedId);
        if (sprite && appRef.current) {
          sprite.x = appRef.current.screen.width / 2;
          sprite.y = appRef.current.screen.height / 2;
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("contextmenu", handleContext);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContext);
    };
  }, [focusedId]);

  return (
    <div
      className="relative flex h-full w-full bg-[#09090b] text-slate-200 font-sans overflow-hidden select-none"
      onClick={() => setMenuOpenId(null)}
    >
      {showPixelDrawer && (
        <PixelDrawer
          onClose={() => setShowPixelDrawer(false)}
          onSave={handlePixelSave}
        />
      )}
      {modalDelete.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle /> <h3 className="font-bold">Delete Animation?</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModalDelete({ isOpen: false, id: null })}
                className="flex-1 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-900/50 text-red-200 rounded hover:bg-red-900 text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {modalRename.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-white mb-4">Rename Animation</h3>
            <form onSubmit={confirmRename}>
              <input
                autoFocus
                type="text"
                value={modalRename.name}
                onChange={(e) =>
                  setModalRename((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-white mb-6 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setModalRename({ isOpen: false, id: null, name: "" })
                  }
                  className="flex-1 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 rounded hover:bg-indigo-500 text-white text-sm font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <aside
        className={`flex flex-col border-r border-white/10 bg-[#12121a] z-30 transition-all duration-300 h-full ${
          isMobile ? "absolute top-0 bottom-0 w-72 shadow-2xl" : "relative w-72"
        } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute"}`}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
          <span className="font-bold text-indigo-400 flex items-center gap-2">
            <Zap size={16} className="fill-current" /> Studio V11
          </span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)}>
              <X size={18} className="text-slate-400" />
            </button>
          )}
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col items-center justify-center h-16 border border-dashed border-zinc-600 rounded bg-zinc-900/50 hover:bg-zinc-800 cursor-pointer group">
            <Upload
              className="text-zinc-500 group-hover:text-indigo-400"
              size={16}
            />
            <span className="text-[10px] text-zinc-400 mt-1">Import</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowPixelDrawer(true)}
            className="flex flex-col items-center justify-center h-16 border border-dashed border-zinc-600 rounded bg-zinc-900/50 hover:bg-zinc-800 group"
          >
            <PenTool
              className="text-zinc-500 group-hover:text-emerald-400"
              size={16}
            />
            <span className="text-[10px] text-zinc-400 mt-1">Draw New</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {animGroups.map((group) => (
            <div
              key={group.id}
              className={`group p-2 rounded cursor-pointer flex items-center gap-2 relative border select-none ${
                focusedId === group.id
                  ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-100"
                  : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
              }`}
              onClick={() => setFocusedId(group.id)}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const newSet = new Set(activeIds);
                  if (newSet.has(group.id)) newSet.delete(group.id);
                  else newSet.add(group.id);
                  setActiveIds(newSet);
                }}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                {activeIds.has(group.id) ? (
                  <CheckSquare size={16} className="text-indigo-400" />
                ) : (
                  <Square size={16} />
                )}
              </div>
              <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                {group.frames.length > 0 && (
                  <img
                    src={(group.frames[0].baseTexture.resource as any).url}
                    className="w-full h-full object-contain pixelated"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{group.name}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === group.id ? null : group.id);
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpenId === group.id && (
                <div className="absolute right-0 top-8 bg-zinc-800 border border-white/10 rounded shadow-xl z-50 w-32 py-1 flex flex-col">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalRename({
                        isOpen: true,
                        id: group.id,
                        name: group.name,
                      });
                      setMenuOpenId(null);
                    }}
                    className="px-3 py-2 text-left text-xs hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Edit size={12} /> Rename
                  </button>
                  {group.sliceConfig && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlicerImage(
                          (group.frames[0].baseTexture.resource as any).url
                        );
                        setSliceConfig(group.sliceConfig!);
                        setEditingGroupId(group.id);
                        setShowSlicer(true);
                        setMenuOpenId(null);
                      }}
                      className="px-3 py-2 text-left text-xs hover:bg-zinc-700 flex items-center gap-2 text-yellow-400"
                    >
                      <Scissors size={12} /> Edit Sheet
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalDelete({ isOpen: true, id: group.id });
                      setMenuOpenId(null);
                    }}
                    className="px-3 py-2 text-left text-xs hover:bg-red-900/50 text-red-400 flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/5 space-y-2 bg-[#0e0e14] shrink-0">
          <button
            onClick={exportStrip}
            disabled={!focusedId}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 border border-white/5"
          >
            <Grid size={12} /> STRIP
          </button>
          <button
            onClick={exportGIF}
            disabled={!focusedId}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Video size={12} /> GIF
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b] shrink-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <Menu size={18} />
              </button>
            )}
            <span className="text-xs font-bold text-zinc-300 ml-2 border-l border-zinc-700 pl-3">
              {focusedId
                ? animGroups.find((g) => g.id === focusedId)?.name
                : "Select an animation"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1">
              <MousePointer2 size={12} /> <span>Drag</span>
            </div>
            <div className="flex items-center gap-1">
              <Crosshair size={12} /> <span>R-Click Center</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full px-2 py-0.5 border border-white/5">
              <span className="font-bold">BG</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-none p-0"
              />
            </div>
          </div>
        </header>
        <div
          className="flex-1 relative overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>
          <div ref={containerRef} className="w-full h-full absolute inset-0" />
        </div>
        <div className="h-16 bg-[#12121a] border-t border-white/5 px-4 flex items-center justify-between shrink-0 gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-indigo-400 transition shadow-lg shrink-0"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <div
            className={`flex-1 flex items-center gap-6 max-w-md transition-opacity ${
              focusedId ? "opacity-100" : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Speed</span>{" "}
                <span className="text-indigo-400">{fps}</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Zoom</span>{" "}
                <span className="text-indigo-400">{scale}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </main>
      {showSlicer && slicerImage && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90%]">
            <div className="p-3 border-b border-zinc-700 bg-[#202025] flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-2">
                <Scissors size={14} /> Slicer
              </span>
              <button
                onClick={() => {
                  setShowSlicer(false);
                  setEditingGroupId(null);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-black/50 overflow-auto p-4 flex items-center justify-center relative">
              <div className="relative inline-block">
                <img
                  src={slicerImage}
                  className="max-w-none pixelated"
                  style={{ imageRendering: "pixelated" }}
                />
                <div
                  className="absolute inset-0 pointer-events-none border border-indigo-500/50"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
                    backgroundSize: `${100 / sliceConfig.cols}% ${
                      100 / sliceConfig.rows
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="p-4 bg-[#18181b] border-t border-zinc-700 flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Cols
                </label>
                <input
                  type="number"
                  min="1"
                  value={sliceConfig.cols}
                  onChange={(e) =>
                    setSliceConfig({
                      ...sliceConfig,
                      cols: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  value={sliceConfig.rows}
                  onChange={(e) =>
                    setSliceConfig({
                      ...sliceConfig,
                      rows: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                onClick={handleSliceConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded h-9 mt-auto"
              >
                {editingGroupId ? "UPDATE" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
