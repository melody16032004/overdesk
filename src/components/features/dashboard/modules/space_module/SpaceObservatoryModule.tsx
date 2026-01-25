import React, { useState, useRef, useEffect } from "react";
import { X, Maximize, Plus, Minus, Telescope, Play, Pause } from "lucide-react";

// --- DỮ LIỆU HÀNH TINH ---
interface PlanetData {
  id: string;
  name: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  description: string;
  moons?: number;
  temp?: string;
  type?: "Terrestrial" | "Gas Giant" | "Ice Giant" | "Star";
}

const planets: PlanetData[] = [
  // Tăng khoảng cách (distance) lên một chút để các hành tinh không bị dính vào nhau khi zoom xa
  {
    id: "sun",
    name: "Sun",
    color: "bg-yellow-500 shadow-[0_0_100px_#fbbf24]",
    size: 80,
    distance: 0,
    speed: 0,
    description: "Ngôi sao trung tâm, chiếm 99.86% khối lượng hệ mặt trời.",
    temp: "5,500°C",
    type: "Star",
  },
  {
    id: "mercury",
    name: "Mercury",
    color: "bg-stone-400",
    size: 12,
    distance: 100,
    speed: 8,
    description: "Hành tinh nhỏ nhất, bề mặt đầy hố thiên thạch.",
    moons: 0,
    temp: "167°C",
    type: "Terrestrial",
  },
  {
    id: "venus",
    name: "Venus",
    color: "bg-orange-300",
    size: 22,
    distance: 150,
    speed: 12,
    description: "Hành tinh nóng nhất, bầu khí quyển dày đặc CO2.",
    moons: 0,
    temp: "464°C",
    type: "Terrestrial",
  },
  {
    id: "earth",
    name: "Earth",
    color: "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    size: 24,
    distance: 210,
    speed: 18,
    description: "Hành tinh xanh, cái nôi của sự sống.",
    moons: 1,
    temp: "15°C",
    type: "Terrestrial",
  },
  {
    id: "mars",
    name: "Mars",
    color: "bg-red-500",
    size: 18,
    distance: 270,
    speed: 25,
    description: "Hành tinh Đỏ, có ngọn núi cao nhất hệ mặt trời.",
    moons: 2,
    temp: "-65°C",
    type: "Terrestrial",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    color: "bg-orange-200 border-4 border-orange-300/20",
    size: 60,
    distance: 380,
    speed: 45,
    description: "Vua của các hành tinh, bão tố vĩnh cửu.",
    moons: 95,
    temp: "-110°C",
    type: "Gas Giant",
  },
  {
    id: "saturn",
    name: "Saturn",
    color: "bg-yellow-200",
    size: 52,
    distance: 500,
    speed: 60,
    description: "Vành đai băng đá tuyệt đẹp bao quanh.",
    moons: 146,
    temp: "-140°C",
    type: "Gas Giant",
  },
  {
    id: "uranus",
    name: "Uranus",
    color: "bg-cyan-300",
    size: 34,
    distance: 620,
    speed: 80,
    description: "Lăn trên quỹ đạo của nó, bầu trời màu lục lam.",
    moons: 27,
    temp: "-195°C",
    type: "Ice Giant",
  },
  {
    id: "neptune",
    name: "Neptune",
    color: "bg-blue-700",
    size: 32,
    distance: 740,
    speed: 100,
    description: "Gió siêu thanh và màu xanh thẫm bí ẩn.",
    moons: 14,
    temp: "-200°C",
    type: "Ice Giant",
  },
];

const SpaceObservatoryModule = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [scale, setScale] = useState(0.6); // Zoom out mặc định một chút để thấy nhiều hơn
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [isTouring, setIsTouring] = useState(false);
  const tourIndexRef = useRef(0);
  const tourIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ZOOM ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => Math.min(Math.max(0.1, prev - e.deltaY * 0.001), 4));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // --- LOGIC TOUR ---
  const startTour = () => {
    if (isTouring) {
      stopTour();
      return;
    }
    setIsTouring(true);
    tourIndexRef.current = 0;
    focusOnPlanet(planets[0]);
    tourIntervalRef.current = setInterval(() => {
      tourIndexRef.current = (tourIndexRef.current + 1) % planets.length;
      focusOnPlanet(planets[tourIndexRef.current]);
    }, 4000);
  };

  const stopTour = () => {
    setIsTouring(false);
    if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
    resetView();
  };

  const focusOnPlanet = (planet: PlanetData) => {
    setSelectedPlanet(planet);
    setScale(1.2);
    // Vẫn giữ center view vì tính toán tọa độ (x,y) khi đang animation xoay rất phức tạp
    // với CSS thuần. Ở mode simple này ta chỉ zoom vào.
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTouring) stopTour();
    // Chỉ drag khi click vào nền (không phải click vào hành tinh/drawer)
    if ((e.target as HTMLElement).closest(".planet-clickable, .ui-panel"))
      return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(0.6);
    setPosition({ x: 0, y: 0 });
    setSelectedPlanet(null);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-slate-300 relative overflow-hidden font-sans select-none">
      {/* HEADER UI */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none flex justify-between items-start ui-panel">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl pointer-events-auto max-w-xs transition-opacity hover:opacity-100 opacity-80">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Telescope className="text-indigo-400" size={24} />
            <span>
              Cosmos <span className="text-indigo-400">Pro</span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Hệ mặt trời thời gian thực. Kéo để di chuyển, lăn chuột để phóng to.
          </p>
        </div>

        <button
          onClick={startTour}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-all border border-white/10
            ${isTouring ? "bg-red-500/90 text-white animate-pulse" : "bg-indigo-600/90 hover:bg-indigo-500 text-white"}
          `}
        >
          {isTouring ? (
            <>
              <Pause size={16} /> Stop Tour
            </>
          ) : (
            <>
              <Play size={16} /> Start Tour
            </>
          )}
        </button>
      </div>

      {/* SPACE VIEWPORT */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full cursor-move bg-black relative overflow-hidden active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, #1B2735 0%, #090A0F 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `radial-gradient(white, rgba(255,255,255,.2) 1px, transparent 1.5px)`,
            backgroundSize: "350px 350px",
          }}
        />

        {/* SOLAR SYSTEM CENTER */}
        <div
          className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center will-change-transform transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {planets.map((planet) => (
            <React.Fragment key={planet.id}>
              {/* --- 1. ORBIT RING (Vẽ quỹ đạo) --- */}
              {planet.distance > 0 && (
                <div
                  className="absolute rounded-full border border-white/20 pointer-events-none"
                  style={{
                    width: planet.distance * 2,
                    height: planet.distance * 2,
                    // Dùng translate thay vì margin để căn giữa chính xác tuyệt đối
                    transform: "translate(-50%, -50%)",
                    top: 0,
                    left: 0,
                  }}
                />
              )}

              {/* --- 2. PLANET CONTAINER (Xoay quanh tâm 0,0) --- */}
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: planet.distance * 2,
                  height: planet.distance * 2,
                  transform: "translate(-50%, -50%)", // Căn giữa container vào tâm 0,0
                  animation:
                    planet.speed > 0
                      ? `orbit ${planet.speed}s linear infinite`
                      : "none",
                }}
              >
                {/* --- 3. PLANET BODY (Nằm trên đường tròn container) --- */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanet(planet);
                  }}
                  className={`
                    planet-clickable
                    absolute top-1/2 right-0 
                    -translate-y-1/2 translate-x-1/2 
                    rounded-full pointer transition-all z-10 pointer-events-auto group
                    ${planet.color}
                    ${selectedPlanet?.id === planet.id ? "ring-4 ring-white/40 scale-110 z-50" : "hover:scale-110 hover:z-20"}
                  `}
                  style={{
                    width: planet.size,
                    height: planet.size,
                    // Xoay ngược hành tinh để giữ hướng bóng đổ/vành đai (nếu có)
                    animation:
                      planet.speed > 0
                        ? `counter-orbit ${planet.speed}s linear infinite`
                        : "none",
                    // Hiệu ứng bóng đổ 3D bên trong
                    boxShadow:
                      planet.id === "sun"
                        ? undefined
                        : "inset -4px -4px 8px rgba(0,0,0,0.7)",
                  }}
                >
                  {/* Special Effect: Saturn Rings */}
                  {planet.id === "saturn" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] rounded-full border-[8px] border-slate-500/40 rotate-12 pointer-events-none"></div>
                  )}

                  {/* Label (Hover) */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                      {planet.name}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-3 ui-panel">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-2xl p-1.5 shadow-xl flex flex-col gap-1">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 4))}
            className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            <Maximize size={18} />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.1))}
            className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* INFO DRAWER */}
      <div
        className={`
          ui-panel absolute bottom-0 right-0 w-full md:w-96 md:h-full bg-[#0B0C15]/95 backdrop-blur-2xl md:border-l border-t md:border-t-0 border-slate-800 shadow-2xl 
          transform transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) z-30 flex flex-col
          ${selectedPlanet ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
        style={{ maxHeight: "80vh" }}
      >
        {selectedPlanet && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <button
              onClick={() => setSelectedPlanet(null)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 bg-slate-800 text-indigo-400 border border-indigo-500/30`}
              >
                {selectedPlanet.type}
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {selectedPlanet.name}
              </h3>

              <div className="flex gap-4 mb-8">
                <div
                  className={`w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl ${selectedPlanet.color} relative overflow-hidden shrink-0 border border-white/10`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/60"></div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed py-2">
                  {selectedPlanet.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <InfoCard
                  label="Distance from Sun"
                  value={
                    selectedPlanet.distance === 0
                      ? "0"
                      : `${selectedPlanet.distance}M km`
                  }
                />
                <InfoCard
                  label="Surface Temp"
                  value={selectedPlanet.temp || "N/A"}
                />
                <InfoCard
                  label="Moons"
                  value={selectedPlanet.moons?.toString() || "0"}
                />
                <InfoCard
                  label="Orbital Period"
                  value={
                    selectedPlanet.id === "sun"
                      ? "N/A"
                      : `${(selectedPlanet.speed * 10).toFixed(0)} days`
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes orbit { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes counter-orbit { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-wider">
      {label}
    </span>
    <span className="text-white font-mono text-sm md:text-base">{value}</span>
  </div>
);

export default SpaceObservatoryModule;
