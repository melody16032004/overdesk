import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Trash2,
  Smile,
  X,
  VideoOff,
  Grid3X3,
  FlipHorizontal,
  Zap,
  Maximize2,
  Minimize2,
  Timer as TimerIcon,
  Image as ImageIcon,
  Layers,
  ChevronLeft,
} from "lucide-react";

// --- 1. INDEXED DB HELPER (LƯU ẢNH VĨNH VIỄN) ---
const DB_NAME = "OverdeskCameraDB";
const STORE_NAME = "gallery";

const cameraDB = {
  open: () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
  add: async (photo: { id: number; data: string }) => {
    const db = await cameraDB.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(photo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await cameraDB.open();
    return new Promise<{ id: number; data: string }[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () =>
        resolve(request.result ? request.result.reverse() : []); // Mới nhất lên đầu
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id: number) => {
    const db = await cameraDB.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

// --- CONFIG ---
const AR_MASKS = [
  {
    id: "cat_ears",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/1067/1067357.png",
    label: "Cat Ears",
  },
  {
    id: "dog_nose",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/6667/6667509.png",
    label: "Doggy",
  },
  {
    id: "glasses",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/616/616574.png",
    label: "Thug Life",
  },
  {
    id: "blush",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/9463/9463956.png",
    label: "UwU Blush",
  },
  {
    id: "crown",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/168/168233.png",
    label: "Queen",
  },
  {
    id: "mask",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/2061/2061803.png",
    label: "Mask",
  },
];

const EMOJI_LIST = [
  "😎",
  "🥰",
  "👽",
  "👻",
  "🔥",
  "✨",
  "🌈",
  "🦋",
  "🍄",
  "🍕",
  "🍑",
  "💦",
];

const FILTERS = [
  { id: "normal", label: "Normal", css: "none", color: "bg-zinc-500" },
  {
    id: "cream",
    label: "Cream",
    css: "contrast(90%) brightness(110%) saturate(80%) sepia(20%)",
    color: "bg-orange-200",
  },
  {
    id: "dramatic",
    label: "Drama",
    css: "contrast(120%) saturate(120%)",
    color: "bg-indigo-900",
  },
  {
    id: "noir",
    label: "Noir",
    css: "grayscale(100%) contrast(110%)",
    color: "bg-black",
  },
  {
    id: "vivid",
    label: "Vivid",
    css: "saturate(160%) contrast(105%)",
    color: "bg-rose-500",
  },
  {
    id: "cyber",
    label: "Cyber",
    css: "hue-rotate(190deg) saturate(150%)",
    color: "bg-cyan-500",
  },
];

type ActiveElement = {
  id: number;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  scale: number;
};

// Kiểu dữ liệu ảnh trong Gallery
type GalleryItem = {
  id: number;
  data: string; // Base64 string
};

export const PhotoBoothModule = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]); // Đổi thành mảng object
  const [showGalleryView, setShowGalleryView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Controls
  const [tab, setTab] = useState<"filters" | "effects">("effects");
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [elements, setElements] = useState<ActiveElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);

  // Pro Tools
  const [isMirrored, setIsMirrored] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [flashMode, setFlashMode] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Dragging Refs
  const isDragging = useRef(false);
  const dragTargetId = useRef<number | null>(null);

  // --- INIT ---
  useEffect(() => {
    startCamera();
    loadGallery(); // Load ảnh cũ từ DB khi mở app
    return () => stopCamera();
  }, []);

  const loadGallery = async () => {
    try {
      const items = await cameraDB.getAll();
      setGallery(items);
    } catch (e) {
      console.error("Failed to load gallery", e);
    }
  };

  // Re-attach stream logic
  useEffect(() => {
    if (!photo && !showGalleryView && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [photo, showGalleryView]);

  const startCamera = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError(null);
    } catch (err) {
      setError("Camera error. Please allow permissions.");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // --- EDITING LOGIC ---
  const addElement = (type: "text" | "image", content: string) => {
    const newEl: ActiveElement = {
      id: Date.now(),
      type,
      content,
      x: 50,
      y: 50,
      scale: 1,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };
  const removeElement = (id: number) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    isDragging.current = true;
    dragTargetId.current = id;
    setSelectedId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      !isDragging.current ||
      dragTargetId.current === null ||
      !containerRef.current
    )
      return;
    const rect = containerRef.current.getBoundingClientRect();
    setElements((prev) =>
      prev.map((el) =>
        el.id === dragTargetId.current
          ? {
              ...el,
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            }
          : el
      )
    );
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    dragTargetId.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const handleWheel = (e: React.WheelEvent, id: number) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, scale: Math.max(0.2, Math.min(5, el.scale + delta)) }
          : el
      )
    );
  };

  const handleCapture = () => {
    if (countdown) return;
    if (timerDuration > 0) {
      setCountdown(timerDuration);
      let c = timerDuration;
      const t = setInterval(() => {
        c--;
        if (c > 0) setCountdown(c);
        else {
          clearInterval(t);
          setCountdown(null);
          takePhoto();
        }
      }, 1000);
    } else {
      takePhoto();
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.filter = activeFilter.css;
    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    const dw = canvas.width / zoom;
    const dh = canvas.height / zoom;
    ctx.drawImage(
      video,
      (canvas.width - dw) / 2,
      (canvas.height - dh) / 2,
      dw,
      dh,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
    ctx.filter = "none";

    const drawPromises = elements.map(async (el) => {
      ctx.save();
      const pixelX = (el.x / 100) * canvas.width;
      const pixelY = (el.y / 100) * canvas.height;
      ctx.translate(pixelX, pixelY);
      ctx.scale(el.scale, el.scale);
      if (el.type === "text") {
        ctx.font = `${canvas.height * 0.15}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.content, 0, 0);
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.content;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        const size = canvas.height * 0.3;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    });
    await Promise.all(drawPromises);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "right";
    ctx.fillText("Overdesk Cam", canvas.width - 20, canvas.height - 20);
    setPhoto(canvas.toDataURL("image/png", 1.0));
  };

  // --- SAVE LOGIC (UPDATED WITH DB) ---
  const savePhoto = async () => {
    if (!photo) return;

    // 1. Download
    const a = document.createElement("a");
    a.download = `snap_${Date.now()}.png`;
    a.href = photo;
    a.click();

    // 2. Save to IndexedDB & Update State
    const newItem = { id: Date.now(), data: photo };
    await cameraDB.add(newItem);
    setGallery((prev) => [newItem, ...prev]);
  };

  const deletePhoto = async (id: number) => {
    await cameraDB.delete(id);
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="h-full w-full bg-[#09090b] flex flex-col lg:flex-row relative overflow-hidden font-sans text-slate-200 select-none">
      {/* --- VIEWFINDER --- */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black flex items-center justify-center overflow-hidden group touch-none"
      >
        {loading && (
          <div className="text-pink-500 animate-bounce font-bold tracking-widest">
            LOADING LENS...
          </div>
        )}
        {error && (
          <div className="bg-zinc-900 p-6 rounded-xl text-center">
            <VideoOff className="mx-auto text-red-500 mb-2" />
            <p>{error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-pink-600 rounded-full font-bold text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* LIVE VIEW */}
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
            photo || showGalleryView ? "hidden" : "block"
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
            style={{
              filter: activeFilter.css,
              transform: `scale(${zoom}) ${
                isMirrored ? "scaleX(-1)" : "scaleX(1)"
              }`,
            }}
          />
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3 z-10">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/50" />
              ))}
            </div>
          )}

          {elements.map((el) => (
            <div
              key={el.id}
              onPointerDown={(e) => handlePointerDown(e, el.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={(e) => handleWheel(e, el.id)}
              className={`absolute cursor-move select-none z-30 flex items-center justify-center ${
                selectedId === el.id ? "ring-2 ring-pink-500 rounded-lg" : ""
              }`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: `translate(-50%, -50%) scale(${el.scale})`,
                width: el.type === "image" ? "150px" : "auto",
              }}
            >
              {el.type === "text" ? (
                <span style={{ fontSize: "5rem", lineHeight: 1 }}>
                  {el.content}
                </span>
              ) : (
                <img
                  src={el.content}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                />
              )}
              {selectedId === el.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(el.id);
                  }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center scale-[0.5] hover:scale-100 transition-transform"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {countdown && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
              <span className="text-[12rem] font-black text-white animate-ping">
                {countdown}
              </span>
            </div>
          )}

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/10 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`p-2 rounded-full hover:bg-white/10 ${
                isMirrored ? "text-pink-400" : "text-white"
              }`}
            >
              <FlipHorizontal size={18} />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-full hover:bg-white/10 ${
                showGrid ? "text-pink-400" : "text-white"
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setFlashMode(!flashMode)}
              className={`p-2 rounded-full hover:bg-white/10 ${
                flashMode ? "text-yellow-400" : "text-zinc-400"
              }`}
            >
              <Zap size={18} fill={flashMode ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() =>
                setTimerDuration((t) => (t === 0 ? 3 : t === 3 ? 5 : 0))
              }
              className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-xs hover:bg-white/10 ${
                timerDuration > 0 ? "text-pink-400" : "text-zinc-400"
              }`}
            >
              {timerDuration > 0 ? (
                `${timerDuration}s`
              ) : (
                <TimerIcon size={18} />
              )}
            </button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-md py-4 px-2 rounded-full border border-white/10 z-20 flex flex-col gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
              className="p-1 hover:text-pink-400"
            >
              <Maximize2 size={14} />
            </button>
            <div className="h-32 w-1 bg-white/20 rounded-full relative">
              <div
                className="absolute bottom-0 left-0 right-0 bg-pink-500 rounded-full transition-all"
                style={{ height: `${((zoom - 1) / 2) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.1, 1))}
              className="p-1 hover:text-pink-400"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        </div>

        {/* --- REVIEW MODE --- */}
        {photo && !showGalleryView && (
          <div className="relative w-full h-full bg-[#050505] flex items-center justify-center p-4 z-40 animate-in zoom-in-95">
            <img
              src={photo}
              className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10 object-contain"
            />
          </div>
        )}

        {/* --- GALLERY VIEW (UPDATED) --- */}
        {showGalleryView && (
          <div className="relative w-full h-full bg-[#09090b] z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#12121a]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGalleryView(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <ChevronLeft />
                </button>
                <span className="font-bold text-lg">
                  My Gallery ({gallery.length})
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center text-zinc-500 gap-4 h-full min-h-[300px]">
                  <ImageIcon size={48} className="opacity-20" />
                  <p>No photos yet. Capture something!</p>
                </div>
              ) : (
                gallery.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10"
                  >
                    <img
                      src={item.data}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.download = `gallery_${item.id}.png`;
                          a.href = item.data;
                          a.click();
                        }}
                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deletePhoto(item.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/50 rounded-full text-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div
          className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 z-[60] ${
            isFlashing ? "opacity-100" : "opacity-0"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* --- CONTROLS --- */}
      <div className="w-full lg:w-[360px] bg-[#12121a] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col z-30 shadow-2xl shrink-0 h-[45vh] lg:h-full">
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setTab("effects")}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${
              tab === "effects"
                ? "text-pink-500 border-b-2 border-pink-500 bg-pink-500/5"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Effects
          </button>
          <button
            onClick={() => setTab("filters")}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${
              tab === "filters"
                ? "text-cyan-500 border-b-2 border-cyan-500 bg-cyan-500/5"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Filters
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {tab === "effects" && (
            <>
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                  <Layers size={12} /> Masks
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {AR_MASKS.map((mask) => (
                    <button
                      key={mask.id}
                      onClick={() => addElement("image", mask.src)}
                      className="aspect-square rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-transparent hover:border-pink-500 transition-all p-2 group"
                    >
                      <img
                        src={mask.src}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                  <Smile size={12} /> Emojis
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_LIST.map((e) => (
                    <button
                      key={e}
                      onClick={() => addElement("text", e)}
                      className="aspect-square rounded-lg bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {tab === "filters" && (
            <div className="grid grid-cols-2 gap-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f)}
                  className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeFilter.id === f.id
                      ? "border-cyan-500 ring-2 ring-cyan-500/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`absolute inset-0 ${f.color} opacity-50`}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-white uppercase text-xs drop-shadow-md z-10">
                    {f.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-[#0e0e12]">
          {!photo ? (
            <div className="flex items-center gap-6 justify-center">
              <button
                onClick={() => {
                  setElements([]);
                  setActiveFilter(FILTERS[0]);
                }}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
              >
                <Trash2 size={20} /> CLEAR
              </button>
              <button
                onClick={handleCapture}
                disabled={loading}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
              >
                <div
                  className={`w-16 h-16 rounded-full ${
                    countdown ? "bg-red-500 animate-pulse" : "bg-white"
                  }`}
                ></div>
              </button>
              <button
                onClick={() => setShowGalleryView(true)}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors relative"
              >
                <ImageIcon size={20} /> GALLERY
                {gallery.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black"></span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setPhoto(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Retake
              </button>
              <button
                onClick={savePhoto}
                className="flex-[2] py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20"
              >
                <Download size={18} /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
