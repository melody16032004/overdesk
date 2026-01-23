import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  X,
  Info,
  FlaskConical,
  Thermometer,
  Box,
  Droplets,
  Wind,
  Maximize,
  Minus,
  Plus,
} from "lucide-react";
import { ElementData } from "./types/periodic_type";
import { CATEGORY_STYLES, elements } from "./constants/periodic_const";
import { AtomVisualizer } from "./components/AtomVisualizer";

// --- MAIN MODULE ---
export const PeriodicTableModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEl, setSelectedEl] = useState<ElementData | null>(null);
  const [temperature, setTemperature] = useState<number>(298);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // --- PAN & ZOOM STATE ---
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic Phase
  const getStateOfMatter = (el: ElementData, temp: number) => {
    if (!el.melt && !el.boil) return "unknown";
    if (el.melt && temp < el.melt) return "solid";
    if (el.boil && temp >= el.boil) return "gas";
    return "liquid";
  };

  // Logic Filter
  const filteredElements = useMemo(() => {
    let res = elements;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      res = res.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.symbol.toLowerCase().includes(lower) ||
          e.number.toString().includes(lower),
      );
    }
    if (activeCategory) {
      res = res.filter((e) => e.category === activeCategory);
    }
    return res;
  }, [searchTerm, activeCategory]);

  const getElementStyle = (cat: string) => {
    const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES["unknown"];
    return `${style.bg} ${style.border} ${style.text}`;
  };

  const getPhaseIcon = (state: string) => {
    switch (state) {
      case "solid":
        return <Box size={10} className="text-slate-400" />;
      case "liquid":
        return <Droplets size={10} className="text-blue-400" />;
      case "gas":
        return <Wind size={10} className="text-gray-300" />;
      default:
        return null;
    }
  };

  // --- PAN & ZOOM HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const newScale = scale - e.deltaY * 0.001;
      setScale(Math.min(Math.max(0.5, newScale), 3));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on background, not elements
    if ((e.target as HTMLElement).closest(".periodic-element")) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(0.5);
    setPosition({ x: 50, y: 0 });
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 overflow-hidden relative">
      {/* HEADER */}
      <div className="p-4 md:p-6 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-sm z-10 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-emerald-500" /> Periodic Table{" "}
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Pro
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Interactive Simulation & Data
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700 w-full md:w-auto">
            <Thermometer
              size={18}
              className={temperature > 373 ? "text-red-500" : "text-blue-400"}
            />
            <div className="flex flex-col w-32">
              <input
                type="range"
                min="0"
                max="6000"
                step="10"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <span className="text-sm font-mono w-16 text-right text-white">
              {temperature} K
            </span>
          </div>

          <div className="relative w-full md:w-64">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-all text-white placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* --- PAN & ZOOM AREA --- */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-[#020617] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.1, 3))}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 text-white shadow-lg"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={resetView}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 text-white shadow-lg"
            >
              <Maximize size={16} />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 text-white shadow-lg"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Transform Container */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear origin-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            {/* Content Container - Not full width to allow centering */}
            <div className="p-20">
              {/* Legend Filter */}
              <div
                className="flex flex-wrap gap-2 mb-12 justify-center max-w-5xl mx-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {Object.keys(CATEGORY_STYLES).map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setActiveCategory(activeCategory === cat ? null : cat)
                    }
                    className={`text-[10px] px-2 py-1 rounded border transition-all uppercase font-bold
                            ${activeCategory === cat ? "ring-2 ring-white scale-105" : "opacity-60 hover:opacity-100"}
                            ${CATEGORY_STYLES[cat].bg} ${CATEGORY_STYLES[cat].border} ${CATEGORY_STYLES[cat].text}
                            `}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div
                className="grid gap-1.5 mx-auto select-none"
                style={{
                  width: "fit-content",
                  gridTemplateColumns: "repeat(18, minmax(3.5rem, 1fr))",
                  gridTemplateRows: "repeat(10, minmax(3.5rem, 1fr))",
                }}
              >
                {filteredElements.map((el) => {
                  const state = getStateOfMatter(el, temperature);
                  const isDimmed =
                    activeCategory && el.category !== activeCategory;

                  return (
                    <div
                      key={el.number}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEl(el);
                      }}
                      className={`
                                periodic-element
                                relative aspect-square flex flex-col justify-between p-1.5 rounded-md cursor-pointer border transition-all duration-300
                                hover:scale-125 hover:z-10 hover:shadow-xl hover:ring-1 hover:ring-white/50
                                ${getElementStyle(el.category)}
                                ${isDimmed ? "opacity-20 grayscale scale-90" : "opacity-100"}
                                ${state === "gas" ? "animate-pulse" : ""}
                            `}
                      style={{
                        gridColumnStart: el.xpos,
                        gridRowStart: el.ypos,
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] opacity-70 font-mono">
                          {el.number}
                        </span>
                        <span className="opacity-70">
                          {getPhaseIcon(state)}
                        </span>
                      </div>
                      <span className="text-sm md:text-base font-bold text-center">
                        {el.symbol}
                      </span>
                      <span className="text-[8px] truncate text-center opacity-80 hidden sm:block">
                        {el.name}
                      </span>
                    </div>
                  );
                })}

                {/* Label placeholders */}
                <div className="col-start-3 row-start-6 flex items-center justify-center text-xs text-slate-600 font-bold border border-slate-700 rounded-md bg-slate-800/50 pointer-events-none">
                  57-71
                </div>
                <div className="col-start-3 row-start-7 flex items-center justify-center text-xs text-slate-600 font-bold border border-slate-700 rounded-md bg-slate-800/50 pointer-events-none">
                  89-103
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAIL DRAWER */}
        <div
          className={`
            absolute top-0 right-0 h-full w-full md:w-96 bg-[#1e293b]/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl 
            transform transition-transform duration-300 ease-in-out z-20 overflow-y-auto
            ${selectedEl ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {selectedEl && (
            <div className="p-6">
              <button
                onClick={() => setSelectedEl(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-700 rounded-full transition-colors z-30"
              >
                <X size={20} className="text-slate-400" />
              </button>

              <div className="mt-2 text-center">
                <h3 className="text-2xl font-bold text-white">
                  {selectedEl.name}
                </h3>
                <span
                  className={`text-xs uppercase tracking-widest px-2 py-0.5 rounded ${getElementStyle(selectedEl.category)}`}
                >
                  {selectedEl.category}
                </span>
              </div>

              {/* ATOM VISUALIZER */}
              <div className="relative">
                <AtomVisualizer
                  element={selectedEl}
                  temperature={temperature}
                />
                <div className="text-center text-[10px] text-slate-500 -mt-2 italic">
                  *Simplified Bohr Model • Speed x
                  {(temperature / 300).toFixed(1)}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 mt-6">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Atomic Mass
                  </span>
                  <span className="text-lg font-mono text-white">
                    {selectedEl.atomic_mass}
                  </span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Density
                  </span>
                  <span className="text-lg font-mono text-white">
                    {selectedEl.density || "N/A"}{" "}
                    <span className="text-xs text-slate-500">g/cm³</span>
                  </span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Melting Point
                  </span>
                  <span className="text-sm font-mono text-white">
                    {selectedEl.melt ? `${selectedEl.melt} K` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Boiling Point
                  </span>
                  <span className="text-sm font-mono text-white">
                    {selectedEl.boil ? `${selectedEl.boil} K` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <Info size={14} /> Summary
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                  {selectedEl.summary || "No description available."}
                </p>
              </div>

              {/* State Indicator */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-200 mb-2">
                  State at {temperature} K
                </h4>
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  {getPhaseIcon(getStateOfMatter(selectedEl, temperature))}
                  <span className="capitalize font-medium text-emerald-400">
                    {getStateOfMatter(selectedEl, temperature)}
                  </span>
                </div>
              </div>

              <a
                href={`https://en.wikipedia.org/wiki/${selectedEl.name}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Read more on Wikipedia
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
