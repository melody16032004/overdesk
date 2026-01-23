import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Calendar,
  Info,
  Maximize2,
  Compass,
  WifiOff,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Loader,
  Satellite,
  Telescope,
  Newspaper,
  Hd,
  Plus, // Icon Zoom In
  Minus, // Icon Zoom Out
  RefreshCcw, // Icon Reset
} from "lucide-react";

// --- KHO ẢNH PANORAMA ULTRA HD (4K+) ---
const REAL_VIEWS = [
  {
    id: "milkyway",
    title: "Milky Way Arch",
    location: "Atacama Desert, Chile (ESO)",
    url: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=100&w=3840&auto=format&fit=crop",
    desc: "Góc nhìn toàn cảnh Dải Ngân Hà sắc nét tuyệt đối từ sa mạc Atacama.",
  },
  {
    id: "mars",
    title: "Martian Surface",
    location: "Gale Crater (Curiosity Rover)",
    url: "https://images.unsplash.com/photo-1614728853911-006395548053?q=100&w=3840&auto=format&fit=crop",
    desc: "Bề mặt đầy bụi đỏ và đá của Sao Hỏa, chi tiết từng vết nứt.",
  },
  {
    id: "orion",
    title: "Orion Nebula",
    location: "Deep Space (Hubble)",
    url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=100&w=3840&auto=format&fit=crop",
    desc: "Vườn ươm sao khổng lồ, hiển thị rõ các đám mây khí hydro phát sáng.",
  },
  {
    id: "andromeda",
    title: "Andromeda Galaxy",
    location: "Local Group",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=100&w=3840&auto=format&fit=crop",
    desc: "Thiên hà Tiên Nữ với độ phân giải cao, nhìn rõ cấu trúc xoắn ốc.",
  },
];

const RealSpaceModule = () => {
  // State Data
  const [apod, setApod] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // State UI
  const [currentViewIdx, setCurrentViewIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mobileTab, setMobileTab] = useState<"view" | "info">("view");

  // --- STATE ZOOM & PAN MỚI ---
  const [viewPos, setViewPos] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(1); // Mặc định scale 1x
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentView = REAL_VIEWS[currentViewIdx];

  // 1. RESET ZOOM KHI ĐỔI ẢNH
  useEffect(() => {
    setImgLoaded(false);
    setScale(1); // Reset Zoom
    setViewPos({ x: 50, y: 50 }); // Reset Pan
    const img = new Image();
    img.src = currentView.url;
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgLoaded(true);
  }, [currentViewIdx]);

  // 2. FETCH DATA (Giữ nguyên)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(
          `https://raw.githubusercontent.com/nasa/apod-api/master/apod.json`,
        );
        if (!res.ok) throw new Error("API Limit");
        const data = await res.json();
        setApod(data);
        setIsOffline(false);
      } catch (err) {
        console.warn("Using Offline Data");
        setIsOffline(true);
        setApod({
          title: "CTB 1: The Medulla Nebula",
          url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=100&w=2400&auto=format&fit=crop",
          explanation:
            "Một hình ảnh tuyệt đẹp về Tinh vân Medulla, tàn dư của một vụ nổ siêu tân tinh.",
          date: new Date().toISOString().split("T")[0],
          media_type: "image",
          copyright: "NASA/Hubble",
        });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // 3. ZOOM LOGIC
  const handleWheel = (e: React.WheelEvent) => {
    // Ngăn chặn cuộn trang mặc định nếu đang trong vùng view
    // e.preventDefault() không hoạt động trực tiếp trong React synthetic event passive,
    // nhưng ta xử lý logic zoom ở đây là đủ.

    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(1, scale + delta), 5); // Max zoom 5x, Min 1x
    setScale(newScale);
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.5, 1));
  const resetZoom = () => {
    setScale(1);
    setViewPos({ x: 50, y: 50 });
  };

  // 4. PAN LOGIC (Kéo thả)
  const handleMouseDown = () => (isDragging.current = true);
  const handleMouseUp = () => (isDragging.current = false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    // Khi zoom càng to, tốc độ kéo càng phải chậm lại để chính xác
    const dragSpeed = 0.15 / scale;

    setViewPos((prev) => ({
      x: Math.max(0, Math.min(100, prev.x - e.movementX * dragSpeed)),
      y: Math.max(0, Math.min(100, prev.y - e.movementY * dragSpeed)),
    }));
  };

  const nextView = () =>
    setCurrentViewIdx((prev) => (prev + 1) % REAL_VIEWS.length);
  const prevView = () =>
    setCurrentViewIdx(
      (prev) => (prev - 1 + REAL_VIEWS.length) % REAL_VIEWS.length,
    );

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Maximize2 className="text-blue-400 hidden sm:block" size={20} />
            <span>Stargazer</span>
            <span className="text-[10px] bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono flex items-center gap-1">
              <Hd size={10} /> 4K
            </span>
            {isOffline && <WifiOff size={14} className="text-red-400" />}
          </h2>

          {/* MOBILE TABS */}
          <div className="flex lg:hidden bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setMobileTab("view")}
              className={`px-3 py-1 text-xs rounded-md flex items-center gap-2 transition-all ${mobileTab === "view" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Telescope size={12} /> View
            </button>
            <button
              onClick={() => setMobileTab("info")}
              className={`px-3 py-1 text-xs rounded-md flex items-center gap-2 transition-all ${mobileTab === "info" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Newspaper size={12} /> Info
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <MapPin size={14} /> <span>{currentView.location}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT: IMMERSIVE VIEWER (ZOOMABLE) */}
        <div
          ref={containerRef}
          className={`
            relative bg-black border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden cursor-move group select-none
            lg:flex-1 lg:h-full lg:block
            ${mobileTab === "view" ? "flex-1 h-full block" : "hidden"} 
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel} // Thêm sự kiện lăn chuột
        >
          {/* Loader */}
          {!imgLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90 text-blue-400 gap-3">
              <Loader className="animate-spin" size={32} />
              <span className="text-xs font-mono tracking-wider">
                DOWNLOADING ULTRA HD DATA...
              </span>
            </div>
          )}

          {/* Image Layer (Zoom & Pan) */}
          <div
            className="absolute w-[250%] h-[250%] will-change-transform"
            style={{
              backgroundImage: `url(${currentView.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              // Kết hợp Pan (translate) và Zoom (scale)
              transform: `translate(-${viewPos.x / 2.5}%, -${viewPos.y / 2.5}%) scale(${scale})`,
              // Thêm transition cho scale để zoom mượt, nhưng tắt transition cho pan (translate) để kéo không bị lag
              transition: isDragging.current
                ? "none"
                : "transform 0.2s ease-out",
              opacity: imgLoaded ? 1 : 0,
              filter: "contrast(1.1) saturate(1.1)",
            }}
          />

          {/* Info Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-none shadow-2xl">
            <p className="text-sm text-white flex items-center gap-2 font-bold shadow-black drop-shadow-md">
              <Compass size={16} className="text-blue-400" />
              {currentView.title}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span>Zoom: {scale.toFixed(1)}x</span>
            </p>
          </div>

          {/* ZOOM CONTROLS (Thêm mới) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto z-30">
            <button
              onClick={zoomIn}
              className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 hover:bg-white/10 text-white transition-colors"
              title="Zoom In"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 hover:bg-white/10 text-white transition-colors"
              title="Zoom Out"
            >
              <Minus size={20} />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 hover:bg-white/10 text-white transition-colors"
              title="Reset View"
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-xl rounded-full px-6 py-3 border border-white/10 pointer-events-auto shadow-2xl z-20 hover:bg-black/80 transition-colors">
            <button
              onClick={prevView}
              className="hover:text-white text-slate-400 transition-colors transform active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-xs font-mono text-slate-300 w-24 text-center tracking-widest">
              {currentViewIdx + 1} / {REAL_VIEWS.length}
            </span>
            <button
              onClick={nextView}
              className="hover:text-white text-slate-400 transition-colors transform active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* RIGHT: NASA INFO (Giữ nguyên) */}
        <div
          className={`
            lg:w-96 bg-[#0B0C15] flex-col shadow-2xl z-20 lg:h-full lg:flex border-l border-slate-800
            ${mobileTab === "info" ? "flex-1 h-full flex" : "hidden"}
          `}
        >
          <div className="p-4 border-b border-slate-800 bg-[#0f172a]/50 sticky top-0 backdrop-blur-sm z-10 shrink-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Satellite className="text-orange-500" size={16} />
              <span>NASA Daily Discovery</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {loadingData ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-56 bg-slate-800/50 rounded-2xl" />
                <div className="h-4 bg-slate-800/50 rounded w-3/4" />
                <div className="h-4 bg-slate-800/50 rounded w-1/2" />
              </div>
            ) : apod ? (
              <div className="flex flex-col gap-6 pb-10 lg:pb-0">
                <div className="rounded-2xl overflow-hidden border border-slate-700/50 relative group bg-black shadow-xl shrink-0">
                  {apod.media_type === "video" ? (
                    <iframe
                      src={apod.url}
                      className="w-full aspect-video"
                      title="NASA Video"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={apod.hdurl || apod.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block cursor-zoom-in"
                    >
                      <img
                        src={apod.url}
                        alt={apod.title}
                        className="w-full h-auto object-cover min-h-[220px] bg-slate-900"
                      />
                    </a>
                  )}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
                    <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-md w-fit border border-white/10">
                      <Calendar size={10} /> {apod.date}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h4 className="text-xl lg:text-2xl font-bold text-white leading-tight font-serif tracking-wide">
                      {apod.title}
                    </h4>
                    <a
                      href={apod.hdurl || apod.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-blue-400 p-1 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50 text-sm text-slate-300 leading-relaxed text-justify relative group hover:border-slate-700 transition-colors">
                    <Info
                      size={18}
                      className="absolute top-5 left-5 text-orange-500"
                    />
                    <p className="pl-8">{apod.explanation}</p>
                    {apod.copyright && (
                      <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-right font-mono tracking-wider uppercase">
                        &copy; {apod.copyright}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealSpaceModule;
