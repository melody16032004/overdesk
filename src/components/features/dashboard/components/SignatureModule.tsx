import { useState, useRef, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  PenTool,
  Download,
  Copy,
  Check,
  Eraser,
  Undo,
  Save,
  History,
  Trash2,
  Settings2,
  Palette,
  CheckCircle2,
  Move,
  ZoomIn,
  Focus,
  Grid,
} from "lucide-react";
import { useToastStore } from "../../../../stores/useToastStore";

// --- CONFIG ---
const PRESET_COLORS = [
  { id: "black", hex: "#000000" },
  { id: "blue", hex: "#0000FF" },
  { id: "red", hex: "#FF0000" },
  { id: "green", hex: "#059669" },
];

interface SavedSignature {
  id: number;
  dataUrl: string;
  date: string;
  extension: "png" | "jpg";
}

// Định nghĩa kiểu dữ liệu lỏng lẻo để tránh lỗi TS khắt khe
interface Point {
  x: number;
  y: number;
  time: number;
}

export const SignatureModule = () => {
  const { showToast } = useToastStore();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null); // Ref để bắt sự kiện zoom

  const tempStrokes = useRef<any[]>([]);

  // State
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(2.5);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCopied, setIsCopied] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [canUndo, setCanUndo] = useState(false);

  // View Transform State (Zoom/Pan)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Export Settings
  const [exportBg, setExportBg] = useState<"transparent" | "white">(
    "transparent"
  );
  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");

  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("my_signatures") || "[]");
    } catch {
      return [];
    }
  });

  // --- 1. FIX: PASSIVE EVENT LISTENER (ZOOM) ---
  useEffect(() => {
    const node = scrollWrapperRef.current;
    if (!node) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Chỉ chặn cuộn nếu đang giữ Ctrl (hoặc logic zoom của bạn)
      // Ở đây ta chặn luôn để ưu tiên Zoom canvas
      if (e.ctrlKey || e.metaKey || !e.ctrlKey) {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        setTransform((prev) => ({
          ...prev,
          scale: Math.min(Math.max(0.5, prev.scale + scaleAmount), 3),
        }));
      }
    };

    // Quan trọng: passive: false để cho phép e.preventDefault()
    node.addEventListener("wheel", handleWheelNative, { passive: false });

    return () => {
      node.removeEventListener("wheel", handleWheelNative);
    };
  }, [activeTab]); // Re-bind khi chuyển tab

  // --- 2. RESIZE HANDLER ---
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            tempStrokes.current = sigCanvas.current.toData();
          }
          setCanvasSize({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (
      canvasSize.width > 0 &&
      canvasSize.height > 0 &&
      sigCanvas.current &&
      tempStrokes.current.length > 0
    ) {
      sigCanvas.current.fromData(tempStrokes.current);
      setIsEmpty(false);
      setCanUndo(true);
    }
  }, [canvasSize]);

  // --- PAN HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      // Chuột phải
      e.preventDefault();
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // --- 3. FIX: CENTER SIGNATURE (SAFETY CHECK) ---
  const centerSignature = () => {
    if (!sigCanvas.current || isEmpty) return;

    // Ép kiểu any để bỏ qua lỗi check type mảng lồng nhau
    const data = sigCanvas.current.toData() as any[];

    // Safety Check: Kiểm tra dữ liệu hợp lệ
    if (!data || !Array.isArray(data) || data.length === 0) return;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    let hasPoints = false;

    // Duyệt qua từng nét vẽ
    data.forEach((stroke) => {
      // Kiểm tra stroke và stroke.points có tồn tại không
      if (stroke && Array.isArray(stroke.points)) {
        stroke.points.forEach((p: Point) => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
          hasPoints = true;
        });
      }
    });

    if (!hasPoints) return;

    const sigCenterX = (minX + maxX) / 2;
    const sigCenterY = (minY + maxY) / 2;
    const canvasCenterX = canvasSize.width / 2;
    const canvasCenterY = canvasSize.height / 2;

    const dx = canvasCenterX - sigCenterX;
    const dy = canvasCenterY - sigCenterY;

    const newData = data.map((stroke) => {
      if (!stroke.points) return stroke;
      return {
        ...stroke,
        points: stroke.points.map((p: Point) => ({
          ...p,
          x: p.x + dx,
          y: p.y + dy,
        })),
      };
    });

    sigCanvas.current.fromData(newData);
    handleEndDrawing();
    resetView();
  };

  // --- ACTIONS ---
  const handleEndDrawing = () => {
    setIsEmpty(false);
    if (sigCanvas.current) {
      const data = sigCanvas.current.toData();
      setCanUndo(data.length > 0);
      tempStrokes.current = data;
    }
  };

  const handleUndo = () => {
    if (!sigCanvas.current) return;
    const data = sigCanvas.current.toData();
    if (data.length > 0) {
      data.pop();
      sigCanvas.current.fromData(data);
      tempStrokes.current = data;
      setCanUndo(data.length > 0);
      setIsEmpty(data.length === 0);
    }
  };

  const clearPad = () => {
    sigCanvas.current?.clear();
    tempStrokes.current = [];
    setCanUndo(false);
    setIsEmpty(true);
    resetView();
  };

  // --- HELPERS (Export) ---
  const getTrimmedDataURL = () => {
    if (!sigCanvas.current) return null;
    const canvas = sigCanvas.current.getCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL();

    const w = canvas.width;
    const h = canvas.height;
    const pix = ctx.getImageData(0, 0, w, h).data;

    let top = null,
      bottom = null,
      left = null,
      right = null;
    let x, y;

    for (let i = 0; i < pix.length; i += 4) {
      if (pix[i + 3] !== 0) {
        x = (i / 4) % w;
        y = Math.floor(i / 4 / w);
        if (top === null) top = y;
        if (bottom === null || y > bottom) bottom = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }

    if (top === null || bottom === null || left === null || right === null)
      return null;

    const trimW = right - left + 1;
    const trimH = bottom - top + 1;
    const copy = document.createElement("canvas");
    copy.width = trimW;
    copy.height = trimH;
    const copyCtx = copy.getContext("2d");
    if (!copyCtx) return null;

    copyCtx.drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
    return copy.toDataURL("image/png");
  };

  const processExportImage = useCallback(async (): Promise<string | null> => {
    const rawData = getTrimmedDataURL();
    if (!rawData) return null;

    if (exportBg === "transparent" && exportFormat === "png") {
      return rawData;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = rawData;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);

        const format = exportFormat === "jpg" ? "image/jpeg" : "image/png";
        resolve(canvas.toDataURL(format, 1.0));
      };
    });
  }, [exportBg, exportFormat]);

  const saveToGallery = async () => {
    const processedUrl = await processExportImage();
    if (!processedUrl) return;

    const newSig: SavedSignature = {
      id: Date.now(),
      dataUrl: processedUrl,
      date: new Date().toLocaleDateString("vi-VN"),
      extension: exportFormat,
    };

    setSavedSigs([newSig, ...savedSigs]);
    localStorage.setItem(
      "my_signatures",
      JSON.stringify([newSig, ...savedSigs])
    );
    setActiveTab("gallery");
    clearPad();
    showToast("Chữ ký của bạn đã được lưu trong thư viện!", "success");
  };

  const deleteFromGallery = (id: number) => {
    showToast("Chữ ký này đã được xóa", "success");
    const newGallery = savedSigs.filter((s) => s.id !== id);
    setSavedSigs(newGallery);
    localStorage.setItem("my_signatures", JSON.stringify(newGallery));
  };

  const handleDownload = async () => {
    const url = await processExportImage();
    if (url) downloadImage(url, exportFormat);
  };

  const downloadFromGallery = (sig: SavedSignature) => {
    downloadImage(sig.dataUrl, sig.extension);
  };

  const downloadImage = (dataURL: string, ext: string) => {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `chuky_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống chữ kí của bạn ở thư mục /Download", "success");
  };

  const handleCopy = async () => {
    const url = await processExportImage();
    if (url) copyToClipboard(url);
  };

  const copyToClipboard = async (url: string) => {
    try {
      const blob = await (await fetch(url)).blob();
      const pngBlob =
        blob.type === "image/png"
          ? blob
          : await new Promise<Blob | null>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                c.getContext("2d")?.drawImage(img, 0, 0);
                c.toBlob(resolve, "image/png");
              };
              img.src = url;
            });

      if (pngBlob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      alert("Trình duyệt không hỗ trợ copy ảnh này.");
    }
  };

  const getCanvasClass = () => {
    return "bg-white rounded-xl shadow-inner cursor-crosshair touch-none bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px]";
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20 gap-3">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <PenTool size={20} className="text-indigo-500" />
          </div>
          <span className="hidden sm:inline">E-Signature Pro</span>
          <span className="sm:hidden">E-Sign</span>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "draw"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PenTool size={14} /> Vẽ
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "gallery"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History size={14} /> Thư viện{" "}
            <span className="bg-slate-900 px-1.5 rounded-full text-[10px] text-indigo-300 ml-1">
              {savedSigs.length}
            </span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* === TAB: DRAW === */}
        {activeTab === "draw" && (
          <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
            {/* 1. CANVAS AREA */}
            {/* Mobile: flex-1 để chiếm hết không gian còn lại */}
            {/* Desktop: Vẫn flex-1 nhưng sắp xếp row */}
            <div className="flex-1 bg-[#0f172a] p-4 flex flex-col relative overflow-hidden h-full">
              {/* SCROLL WRAPPER CHO ZOOM */}
              <div
                ref={scrollWrapperRef}
                className="flex-1 flex flex-col relative border-2 border-slate-700 rounded-2xl overflow-hidden bg-slate-800 shadow-2xl"
              >
                {/* CONTAINER CHO CANVAS RESIZE */}
                <div ref={containerRef} className="absolute inset-0 z-0">
                  {/* Transform Wrapper */}
                  <div
                    style={{
                      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                      transformOrigin: "center center",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    className="transition-transform duration-75 ease-out"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {canvasSize.width > 0 && canvasSize.height > 0 && (
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor={penColor}
                        minWidth={penWidth}
                        maxWidth={penWidth + 1.5}
                        velocityFilterWeight={0.7}
                        canvasProps={{
                          width: canvasSize.width,
                          height: canvasSize.height,
                          className: getCanvasClass(),
                        }}
                        onEnd={handleEndDrawing}
                      />
                    )}
                  </div>
                </div>

                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <span className="text-3xl md:text-5xl font-cursive text-slate-500/30 font-bold italic tracking-wider">
                      Ký tên ở đây
                    </span>
                  </div>
                )}

                {/* Floating Tools (Left Side: View Control) */}
                <div className="absolute bottom-4 left-4 flex gap-2 z-10 pointer-events-auto">
                  <div className="bg-slate-900/80 backdrop-blur text-slate-300 text-[10px] px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
                    <ZoomIn size={12} /> {Math.round(transform.scale * 100)}%
                  </div>
                  {transform.scale !== 1 && (
                    <button
                      onClick={resetView}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 border border-slate-600"
                      title="Reset View"
                    >
                      <Move size={12} />
                    </button>
                  )}
                </div>

                {/* Floating Tools (Top Right: Actions) */}
                <div className="absolute top-3 right-3 flex gap-2 z-10 pointer-events-auto">
                  <button
                    onClick={centerSignature}
                    disabled={isEmpty}
                    className="p-2.5 bg-white text-slate-700 hover:text-blue-600 rounded-xl shadow-lg border border-slate-100 disabled:opacity-50 transition-all active:scale-95"
                    title="Căn giữa chữ ký"
                  >
                    <Focus size={18} />
                  </button>
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-2.5 bg-white text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg border border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    title="Hoàn tác"
                  >
                    <Undo size={18} />
                  </button>
                  <button
                    onClick={clearPad}
                    className="p-2.5 bg-white text-slate-700 hover:text-rose-600 rounded-xl shadow-lg border border-slate-100 transition-all active:scale-95"
                    title="Xóa trắng"
                  >
                    <Eraser size={18} />
                  </button>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 mt-2 opacity-60">
                Mẹo: Lăn chuột để Zoom • Giữ chuột phải để Kéo
              </div>
            </div>

            {/* 2. SETTINGS SIDEBAR */}
            {/* Mobile: Height auto (hoặc fixed nhỏ), nằm dưới cùng */}
            {/* Desktop: Width cố định, height full */}
            <div className="w-full lg:w-[320px] bg-[#1e293b] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col gap-4 shrink-0 z-10 shadow-xl overflow-y-auto lg:h-full max-h-[40vh] lg:max-h-full">
              {/* Color & Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Palette size={14} /> Màu mực
                  </label>
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                  />
                </div>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPenColor(c.hex)}
                      className={`flex-1 h-8 rounded-lg border-2 transition-all ${
                        penColor === c.hex
                          ? "border-white ring-2 ring-indigo-500/50"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <div className="pt-1">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Độ dày
                    </label>
                    <span className="text-xs text-indigo-400 font-mono">
                      {penWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>
              <div className="h-px bg-slate-700/50"></div>
              {/* Export Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Settings2 size={14} /> Tùy chọn xuất
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setExportFormat("png")}
                    className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      exportFormat === "png"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => {
                      setExportFormat("jpg");
                      setExportBg("white");
                    }}
                    className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      exportFormat === "jpg"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    JPG
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportBg("transparent")}
                    disabled={exportFormat === "jpg"}
                    className={`border rounded-xl p-2 flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative ${
                      exportBg === "transparent"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"
                    } ${
                      exportFormat === "jpg"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="w-4 h-4 rounded border border-slate-600 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[size:4px_4px] bg-[position:0_0,2px_2px]"></div>
                    Trong suốt
                    {exportBg === "transparent" && (
                      <CheckCircle2
                        size={14}
                        className="absolute top-1 right-1 text-indigo-500"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setExportBg("white")}
                    className={`border rounded-xl p-2 flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative ${
                      exportBg === "white"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    <div className="w-4 h-4 rounded border border-slate-600 bg-white"></div>
                    Nền trắng
                    {exportBg === "white" && (
                      <CheckCircle2
                        size={14}
                        className="absolute top-1 right-1 text-indigo-500"
                      />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1 lg:block hidden"></div>{" "}
              {/* Spacer chỉ hiện trên desktop */}
              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={saveToGallery}
                  disabled={isEmpty}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save size={16} /> Lưu Thư viện
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={isEmpty}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                    }`}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}{" "}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isEmpty}
                    className="py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Download size={16} /> Tải về
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: GALLERY --- */}
        {activeTab === "gallery" && (
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto custom-scrollbar w-full">
            {savedSigs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <Grid size={48} className="mb-4" />
                <p>Chưa có chữ ký nào được lưu.</p>
                <button
                  onClick={() => setActiveTab("draw")}
                  className="mt-4 text-indigo-400 hover:underline"
                >
                  Tạo ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-20">
                {savedSigs.map((sig) => (
                  <div
                    key={sig.id}
                    className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-700 group relative flex flex-col animate-in fade-in zoom-in-95 duration-200"
                  >
                    {/* 3. FIX OVERLAY: Chỉ hiện overlay trên phần ẢNH */}
                    <div className="relative h-32 lg:h-40 w-full flex items-center justify-center bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]">
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img
                          src={sig.dataUrl}
                          alt="Sig"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-indigo-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => downloadFromGallery(sig)}
                          className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg"
                          title="Tải xuống"
                        >
                          <Download size={20} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(sig.dataUrl)}
                          className="p-3 bg-indigo-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                          title="Copy"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                    </div>
                    {/* FOOTER */}
                    <div className="p-3 bg-[#1e293b] border-t border-slate-200 flex justify-between items-center mt-auto z-10 relative">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <History size={10} /> {sig.date}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {sig.extension}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteFromGallery(sig.id)}
                        className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
