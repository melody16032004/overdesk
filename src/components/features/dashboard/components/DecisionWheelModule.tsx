import { useState, useRef } from "react";
import {
  Dices,
  Plus,
  Trash2,
  MapPin,
  Volume2,
  VolumeX,
  Skull,
  Save,
  Shuffle,
  Edit2,
  Check,
  X,
  FolderOpen,
  ChevronRight,
  FilePlus2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useToastStore } from "../../../../stores/useToastStore";

// --- COLORS ---
const WHEEL_COLORS = [
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

const DEFAULT_PRESETS = [
  {
    id: "food",
    label: "Ăn gì?",
    items: ["Phở", "Bún bò", "Cơm tấm", "Pizza", "Sushi", "Bánh mì", "Salad"],
  },
  {
    id: "drink",
    label: "Uống gì?",
    items: ["Trà sữa", "Cafe đá", "Sinh tố", "Nước ép", "Bia", "Nước lọc"],
  },
  {
    id: "who",
    label: "Ai trả tiền?",
    items: ["Bạn", "Tôi", "Chia đôi", "Người đến sau", "Sếp"],
  },
];

interface SavedCollection {
  id: string;
  label: string;
  items: string[];
  date: string;
}

export const DecisionWheelModule = () => {
  const { showToast } = useToastStore();
  // --- STATE ---
  const [items, setItems] = useState<string[]>(DEFAULT_PRESETS[0].items);
  const [newItem, setNewItem] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  // Edit & Settings
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [volume, setVolume] = useState(0.5);
  const [eliminationMode, setEliminationMode] = useState(false);

  // Drawer & Modal
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false); // Modal lưu riêng biệt
  const [collectionName, setCollectionName] = useState("");

  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem("wheel_collections") || "[]");
      } catch {
        return [];
      }
    }
  );

  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- AUDIO ENGINE ---
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playTickSound = () => {
    if (volume <= 0) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playWinSound = () => {
    if (volume <= 0) return;
    const ctx = getAudioContext();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.1 + 0.8
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.8);
    });
  };

  // --- LOGIC: WHEEL ---
  const spinWheel = () => {
    if (isSpinning || items.length < 2) return;
    setIsSpinning(true);
    setWinner(null);

    const extraSpins = 1800;
    const randomDegree = Math.floor(Math.random() * 360);
    const newRotation = rotation + extraSpins + randomDegree;

    setRotation(newRotation);

    if (volume > 0) {
      let count = 0;
      const totalTime = 4000;
      const playTicks = (delay: number) => {
        if (count * delay > totalTime) return;
        playTickSound();
        count++;
        setTimeout(() => playTicks(delay * 1.1), delay);
      };
      playTicks(50);
    }

    setTimeout(() => {
      setIsSpinning(false);
      calculateWinner(newRotation);
      if (volume > 0) playWinSound();
      triggerConfetti();
    }, 4000);
  };

  const calculateWinner = (finalRotation: number) => {
    const sliceAngle = 360 / items.length;
    const currentRotation = finalRotation % 360;
    const effectiveAngle = (360 - currentRotation) % 360;
    const winningIndex = Math.floor(effectiveAngle / sliceAngle);

    const winningItem = items[winningIndex];
    setWinner(winningItem);

    if (eliminationMode) {
      setTimeout(
        () => setItems((prev) => prev.filter((i) => i !== winningItem)),
        3000
      );
    }
  };

  // --- LOGIC: ITEMS ---
  const addItem = () => {
    if (!newItem.trim()) return;
    if (newItem.includes(",") || newItem.includes("\n")) {
      const splitItems = newItem
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter((s) => s !== "");
      setItems((prev) => [...prev, ...splitItems]);
    } else {
      setItems([...items, newItem.trim()]);
    }
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number, val: string) => {
    setEditIndex(idx);
    setEditText(val);
  };

  const saveEdit = () => {
    if (editIndex !== null && editText.trim()) {
      const newItems = [...items];
      newItems[editIndex] = editText.trim();
      setItems(newItems);
    }
    setEditIndex(null);
  };

  const shuffleItems = () =>
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));

  // --- LOGIC: COLLECTIONS ---
  const createNew = () => {
    setItems([]);
    setWinner(null);
    setRotation(0);
    showToast("Đã làm mới danh sách!", "info");
  };

  const saveCollection = () => {
    if (!collectionName.trim()) {
      showToast("Vui lòng nhập tên!", "warning");
      return;
    }
    if (items.length < 2) {
      showToast("Vui lòng thêm các lựa chọn trước khi lưu!", "warning");
      return;
    }

    const newCollection: SavedCollection = {
      id: Date.now().toString(),
      label: collectionName.trim(),
      items: [...items],
      date: new Date().toLocaleDateString("vi-VN"),
    };

    const updated = [newCollection, ...savedCollections];
    setSavedCollections(updated);
    localStorage.setItem("wheel_collections", JSON.stringify(updated));

    setShowSaveModal(false);
    setCollectionName("");
    showToast("Đã lưu bộ sưu tập thành công!", "success");
  };

  const loadCollection = (colItems: string[]) => {
    setItems(colItems);
    setWinner(null);
    setRotation(0);
    setShowDrawer(false);
  };

  const deleteCollection = (id: string) => {
    const updated = savedCollections.filter((c) => c.id !== id);
    setSavedCollections(updated);
    localStorage.setItem("wheel_collections", JSON.stringify(updated));
    showToast("Đã xóa bộ sưu tập này!", "success");
  };

  // --- RENDER HELPERS ---
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: WHEEL_COLORS,
    });
  };

  const getWheelSegments = () => {
    const total = items.length;
    const radius = 50;
    const center = 50;
    return items.map((item, i) => {
      const startAngle = (i * 360) / total;
      const endAngle = ((i + 1) * 360) / total;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
      const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const midAngle = startAngle + 360 / total / 2;
      return (
        <g key={i}>
          <path
            d={d}
            fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
            stroke="#1e293b"
            strokeWidth="0.2"
          />
          <text
            x="50"
            y="50"
            fill="white"
            fontSize={Math.max(2, 4.5 - total * 0.15)}
            fontWeight="bold"
            alignmentBaseline="middle"
            textAnchor="end"
            transform={`rotate(${midAngle - 90}, 50, 50) translate(48)`}
          >
            {item.length > 18 ? item.substring(0, 16) + ".." : item}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-3 md:p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-rose-500/20 rounded-lg">
            <Dices size={20} className="text-rose-500" />
          </div>
          <span className="hidden sm:inline">Magic Wheel</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700">
            <button
              onClick={() => setVolume((v) => (v === 0 ? 0.5 : 0))}
              className="text-slate-400 hover:text-white"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          <button
            onClick={() => setEliminationMode(!eliminationMode)}
            className={`p-2 rounded-lg border transition-all ${
              eliminationMode
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                : "bg-slate-800 text-slate-500 border-transparent"
            }`}
            title="Loại trừ người thắng"
          >
            <Skull size={18} />
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg ml-2"
          >
            <FolderOpen size={16} />{" "}
            <span className="hidden md:inline">Bộ sưu tập</span>
          </button>
        </div>
      </div>

      {/* MAIN BODY: Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* TOP/LEFT: WHEEL AREA (Mobile: 50%, PC: 60%) */}
        <div className="flex-1 bg-[#0f172a] p-4 flex flex-col items-center justify-center relative overflow-hidden h-1/2 lg:h-full lg:w-3/5 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="relative w-[260px] h-[260px] md:w-[350px] md:h-[350px] lg:w-[480px] lg:h-[480px] z-10 scale-90 md:scale-100">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-xl">
              <MapPin size={48} className="fill-white text-rose-600" />
            </div>
            <div
              className="w-full h-full rounded-full border-4 border-slate-700 shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)"
                  : "none",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {items.length > 0 ? (
                  getWheelSegments()
                ) : (
                  <circle cx="50" cy="50" r="50" fill="#334155" />
                )}
                <circle
                  cx="50"
                  cy="50"
                  r="3"
                  fill="#fff"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <button
                onClick={spinWheel}
                disabled={isSpinning || items.length < 2}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white border-[5px] border-slate-200 shadow-lg flex items-center justify-center text-slate-900 font-black text-[10px] md:text-sm uppercase tracking-widest hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? "..." : "QUAY"}
              </button>
            </div>
          </div>
          {winner && !isSpinning && (
            <div className="absolute bottom-4 lg:bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 text-center">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 zoom-in duration-300">
                <div className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">
                  Kết quả
                </div>
                <div className="text-2xl md:text-4xl font-black text-white drop-shadow-lg break-words leading-tight">
                  {winner}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM/RIGHT: LIST MANAGER (Mobile: 50%, PC: 40%) */}
        <div className="bg-[#1e293b] flex flex-col shrink-0 h-1/2 lg:h-full lg:w-2/5 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          {/* Toolbar */}
          <div className="p-3 bg-slate-800/50 flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-700">
            <span className="flex items-center gap-2">
              Danh sách ({items.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={shuffleItems}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                title="Trộn"
              >
                <Shuffle size={14} />
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Lưu danh sách hiện tại"
              >
                <Save size={14} />
              </button>
              <button
                onClick={createNew}
                className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors"
                title="Xóa trắng để tạo mới"
              >
                <FilePlus2 size={14} /> Tạo mới
              </button>
            </div>
          </div>

          {/* Items List (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-[#1e293b]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                <Dices size={32} className="mb-2" />
                <p className="text-xs">Nhập lựa chọn bên dưới để bắt đầu.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg group hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-600"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          WHEEL_COLORS[idx % WHEEL_COLORS.length],
                      }}
                    ></div>
                    {editIndex === idx ? (
                      <div className="flex flex-1 gap-1">
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="flex-1 bg-slate-900 text-xs text-white px-1 py-0.5 rounded outline-none border border-indigo-500"
                        />
                        <button onClick={saveEdit} className="text-emerald-500">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-sm text-slate-300 truncate cursor-pointer hover:text-indigo-400"
                        onClick={() => startEdit(idx, item)}
                      >
                        {item}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => startEdit(idx, item)}
                      className="p-1 text-slate-500 hover:text-indigo-400"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area (Fixed Bottom) */}
          <div className="p-3 border-t border-slate-800 bg-[#1e293b]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Thêm lựa chọn..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-rose-500 outline-none transition-colors"
              />
              <button
                onClick={addItem}
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* --- DRAWER: COLLECTIONS --- */}
        {showDrawer && (
          <div className="absolute inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
              onClick={() => setShowDrawer(false)}
            ></div>
            <div className="relative w-full max-w-xs bg-[#1e293b] border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FolderOpen size={18} className="text-indigo-500" /> Bộ sưu
                  tập
                </h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">
                    Mẫu có sẵn
                  </h4>
                  <div className="grid gap-2">
                    {DEFAULT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => loadCollection(p.items)}
                        className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group"
                      >
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                          {p.label}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-slate-600 group-hover:text-white"
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">
                    Đã lưu ({savedCollections.length})
                  </h4>
                  {savedCollections.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs italic bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                      Chưa có bộ sưu tập nào.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedCollections.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-indigo-900/10 border border-indigo-500/20 hover:border-indigo-500/50 rounded-xl flex items-center justify-between group transition-all"
                        >
                          <div
                            onClick={() => loadCollection(c.items)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="text-sm font-bold text-indigo-200 group-hover:text-white">
                              {c.label}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {c.items.length} lựa chọn • {c.date}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteCollection(c.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: SAVE COLLECTION --- */}
        {showSaveModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#1e293b] w-full max-w-sm p-6 rounded-2xl border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Save size={20} className="text-indigo-500" /> Lưu bộ sưu tập
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Lưu danh sách hiện tại ({items.length} lựa chọn) để dùng lại sau
                này.
              </p>
              <input
                autoFocus
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveCollection()}
                placeholder="Nhập tên (VD: Quán nhậu)..."
                className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={saveCollection}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg"
                >
                  Lưu ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
