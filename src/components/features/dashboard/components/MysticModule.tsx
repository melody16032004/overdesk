import { useState } from "react";
import {
  Sparkles,
  Sun,
  Star,
  Shuffle,
  RotateCcw,
  Heart,
  Briefcase,
  Zap,
  HeartHandshake,
  ArrowRight,
  X,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Search,
  Calendar as CalendarIcon,
} from "lucide-react";

// --- DATA ---
const ZODIAC_SIGNS = [
  {
    id: "aries",
    name: "Bạch Dương",
    date: "21/3 - 19/4",
    icon: "♈",
    element: "fire",
  },
  {
    id: "taurus",
    name: "Kim Ngưu",
    date: "20/4 - 20/5",
    icon: "♉",
    element: "earth",
  },
  {
    id: "gemini",
    name: "Song Tử",
    date: "21/5 - 21/6",
    icon: "♊",
    element: "air",
  },
  {
    id: "cancer",
    name: "Cự Giải",
    date: "22/6 - 22/7",
    icon: "♋",
    element: "water",
  },
  {
    id: "leo",
    name: "Sư Tử",
    date: "23/7 - 22/8",
    icon: "♌",
    element: "fire",
  },
  {
    id: "virgo",
    name: "Xử Nữ",
    date: "23/8 - 22/9",
    icon: "♍",
    element: "earth",
  },
  {
    id: "libra",
    name: "Thiên Bình",
    date: "23/9 - 22/10",
    icon: "♎",
    element: "air",
  },
  {
    id: "scorpio",
    name: "Bọ Cạp",
    date: "23/10 - 21/11",
    icon: "♏",
    element: "water",
  },
  {
    id: "sagittarius",
    name: "Nhân Mã",
    date: "22/11 - 21/12",
    icon: "♐",
    element: "fire",
  },
  {
    id: "capricorn",
    name: "Ma Kết",
    date: "22/12 - 19/1",
    icon: "♑",
    element: "earth",
  },
  {
    id: "aquarius",
    name: "Bảo Bình",
    date: "20/1 - 18/2",
    icon: "♒",
    element: "air",
  },
  {
    id: "pisces",
    name: "Song Ngư",
    date: "19/2 - 20/3",
    icon: "♓",
    element: "water",
  },
];

const TAROT_DECK = [
  {
    id: 0,
    name: "The Fool",
    meaning: "Một khởi đầu đầy ngẫu hứng. Hãy dám mạo hiểm.",
    icon: "🤡",
  },
  {
    id: 1,
    name: "The Magician",
    meaning: "Bạn có đủ mọi nguồn lực để thành công.",
    icon: "🧙",
  },
  {
    id: 2,
    name: "High Priestess",
    meaning: "Lắng nghe trực giác mách bảo.",
    icon: "🌙",
  },
  {
    id: 3,
    name: "The Empress",
    meaning: "Sự trù phú và sáng tạo đang đến.",
    icon: "👸",
  },
  {
    id: 6,
    name: "The Lovers",
    meaning: "Một mối quan hệ quan trọng hoặc sự lựa chọn.",
    icon: "❤️",
  },
  {
    id: 9,
    name: "The Hermit",
    meaning: "Thời gian để suy ngẫm và tìm về nội tâm.",
    icon: "🕯️",
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    meaning: "Vận mệnh đang xoay chuyển. Hãy đón nhận.",
    icon: "🎡",
  },
  {
    id: 13,
    name: "Death",
    meaning: "Sự kết thúc cần thiết để tái sinh.",
    icon: "💀",
  },
  {
    id: 17,
    name: "The Star",
    meaning: "Niềm hy vọng và sự chữa lành.",
    icon: "⭐",
  },
  {
    id: 19,
    name: "The Sun",
    meaning: "Niềm vui, thành công rực rỡ.",
    icon: "☀️",
  },
  {
    id: 21,
    name: "The World",
    meaning: "Sự trọn vẹn và hoàn thành một chu kỳ.",
    icon: "🌍",
  },
];

// --- HELPER: FORMAT DATE YYYY-MM-DD -> DD/MM/YYYY ---
const formatDateDisplay = (isoDate: string) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

export const MysticModule = () => {
  const [activeTab, setActiveTab] = useState<"tarot" | "zodiac" | "chart">(
    "tarot"
  );

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* Mystic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-[#0f172a] to-[#0f172a]"></div>
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/60 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={20} />
          </div>
          <span className="font-bold text-white text-lg tracking-wide hidden sm:block">
            Mystic Space
          </span>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 backdrop-blur-md">
          {[
            { id: "tarot", label: "Tarot", color: "bg-purple-600" },
            { id: "zodiac", label: "Cung Hoàng Đạo", color: "bg-indigo-600" },
            { id: "chart", label: "Bản Đồ Sao", color: "bg-amber-600" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 md:px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-lg`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden relative z-10">
        {activeTab === "tarot" && <TarotView />}
        {activeTab === "zodiac" && <ZodiacView />}
        {activeTab === "chart" && <StarChartView />}
      </div>
    </div>
  );
};

// --- 1. TAROT VIEW (Giữ nguyên) ---
const TarotView = () => {
  const [cards, setCards] = useState<((typeof TAROT_DECK)[0] | null)[]>([
    null,
    null,
    null,
  ]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [revealed, setRevealed] = useState([false, false, false]);
  const [advice, setAdvice] = useState("");

  const handleDraw = () => {
    setIsShuffling(true);
    setRevealed([false, false, false]);
    setCards([null, null, null]);
    setAdvice("");

    setTimeout(() => {
      const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random());
      const selected = [shuffled[0], shuffled[1], shuffled[2]];
      setCards(selected);
      setIsShuffling(false);
      setTimeout(() => {
        setAdvice(
          `Vũ trụ đang nhắn gửi: Sự kết hợp giữa ${selected[0].name} và ${selected[2].name} cho thấy một sự chuyển biến lớn. ${selected[1].meaning} Hãy tin tưởng vào trực giác của bạn lúc này.`
        );
      }, 1000);
    }, 1500);
  };

  const revealCard = (index: number) => {
    if (!cards[index] || revealed[index]) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
          Thông điệp Vũ trụ
        </h2>
        <p className="text-sm text-indigo-300/60 font-medium">
          Tĩnh tâm và nghĩ về vấn đề của bạn
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-5xl justify-center items-center perspective-1000">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            onClick={() => !isShuffling && revealCard(i)}
            className={`relative w-40 h-64 md:w-56 md:h-80 cursor-pointer group transition-all duration-500 ${
              isShuffling ? "animate-pulse scale-95" : "hover:-translate-y-2"
            }`}
          >
            <div
              className={`w-full h-full transition-transform duration-700 transform-style-3d ${
                revealed[i] ? "rotate-y-180" : ""
              } shadow-2xl`}
            >
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border-2 border-indigo-500/30 rounded-xl flex items-center justify-center shadow-black/50">
                <div className="absolute inset-2 border border-dashed border-indigo-400/20 rounded-lg"></div>
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles
                    size={32}
                    className="text-indigo-400 animate-spin-slow"
                  />
                </div>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex flex-col">
                {cards[i] && (
                  <>
                    <div className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center relative p-4">
                      <div className="text-6xl mb-4 filter drop-shadow-lg animate-in zoom-in duration-500">
                        {cards[i]!.icon}
                      </div>
                      <span className="text-lg font-bold text-white font-serif">
                        {cards[i]!.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-purple-400 mt-1 font-bold">
                        {i === 0
                          ? "Quá khứ"
                          : i === 1
                          ? "Hiện tại"
                          : "Tương lai"}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0f172a] text-center border-t border-slate-800">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {cards[i]!.meaning}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {revealed.every(Boolean) && advice && (
        <div className="mt-8 max-w-2xl bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-indigo-300 font-bold mb-2 flex items-center gap-2 text-sm uppercase">
            <Sparkles size={14} /> Lời khuyên tổng hợp
          </h3>
          <p className="text-slate-200 text-sm leading-relaxed italic">
            "{advice}"
          </p>
        </div>
      )}

      <button
        onClick={handleDraw}
        disabled={isShuffling}
        className="mt-8 px-10 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
      >
        <Shuffle size={18} className={isShuffling ? "animate-spin" : ""} />
        {isShuffling ? "Đang kết nối vũ trụ..." : "Trải bài mới"}
      </button>
    </div>
  );
};

// --- 2. ZODIAC VIEW ---
const ZodiacView = () => {
  const [subTab, setSubTab] = useState<"daily" | "love" | "find">("daily");
  const [selectedSign, setSelectedSign] = useState<
    (typeof ZODIAC_SIGNS)[0] | null
  >(null);

  // Find Sign State
  const [birthDate, setBirthDate] = useState("");
  const [foundSign, setFoundSign] = useState<(typeof ZODIAC_SIGNS)[0] | null>(
    null
  );

  // Love Match State
  const [sign1, setSign1] = useState<(typeof ZODIAC_SIGNS)[0] | null>(null);
  const [sign2, setSign2] = useState<(typeof ZODIAC_SIGNS)[0] | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);

  const findZodiac = () => {
    if (!birthDate) return;
    const date = new Date(birthDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    let signId = "";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
      signId = "aries";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      signId = "taurus";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
      signId = "gemini";
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
      signId = "cancer";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
      signId = "leo";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      signId = "virgo";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
      signId = "libra";
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
      signId = "scorpio";
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
      signId = "sagittarius";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
      signId = "capricorn";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
      signId = "aquarius";
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      signId = "pisces";

    const found = ZODIAC_SIGNS.find((s) => s.id === signId);
    setFoundSign(found || null);
  };

  const calculateMatch = () => {
    if (!sign1 || !sign2) return;
    const score = Math.floor(Math.random() * 40) + 60;
    setMatchResult({
      score,
      text:
        score > 80
          ? "Cặp đôi hoàn hảo! Hai bạn sinh ra để dành cho nhau."
          : "Cần sự thấu hiểu. Hãy kiên nhẫn với đối phương.",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub Navigation */}
      <div className="flex justify-center p-4 pb-0">
        <div className="bg-slate-800/50 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setSubTab("daily")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              subTab === "daily"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tử vi ngày
          </button>
          <button
            onClick={() => setSubTab("love")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              subTab === "love"
                ? "bg-rose-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Heart size={12} /> Bói tình duyên
          </button>
          <button
            onClick={() => setSubTab("find")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              subTab === "find"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Search size={12} /> Tra cứu
          </button>
        </div>
      </div>

      {subTab === "daily" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ZODIAC_SIGNS.map((sign) => (
                <button
                  key={sign.id}
                  onClick={() => setSelectedSign(sign)}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group ${
                    selectedSign?.id === sign.id
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg"
                      : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {sign.icon}
                  </span>
                  <div className="text-center">
                    <div className="text-xs font-bold">{sign.name}</div>
                    <div className="text-[10px] opacity-60">{sign.date}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedSign && (
            <div className="w-full md:w-80 bg-slate-900/80 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col animate-in slide-in-from-right duration-300 absolute md:relative inset-0 md:inset-auto z-20 backdrop-blur-xl md:backdrop-blur-none">
              <button
                onClick={() => setSelectedSign(null)}
                className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-full"
              >
                <X size={16} />
              </button>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-4xl shadow-inner border border-slate-700">
                  {selectedSign.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedSign.name}
                </h3>
                <p className="text-indigo-400 text-xs font-medium uppercase tracking-wider">
                  {selectedSign.date}
                </p>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-xs font-bold text-yellow-500 uppercase mb-2 flex items-center gap-2">
                    <Sun size={14} /> Thông điệp hôm nay
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Năng lượng của vũ trụ đang ủng hộ những quyết định táo bạo.
                    Đừng ngần ngại bước ra khỏi vùng an toàn.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-rose-400 font-bold mb-1 flex items-center gap-1">
                      <Heart size={10} /> Tình cảm
                    </div>
                    <div className="text-sm font-bold text-white">85%</div>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                      <Briefcase size={10} /> Sự nghiệp
                    </div>
                    <div className="text-sm font-bold text-white">Ổn định</div>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-yellow-400 font-bold mb-1 flex items-center gap-1">
                      <Zap size={10} /> Con số
                    </div>
                    <div className="text-sm font-bold text-white">
                      {Math.floor(Math.random() * 99)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "love" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <HeartHandshake className="text-rose-500" /> Bói Tình Duyên
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8 w-full max-w-2xl">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block text-center">
                Bạn là...
              </label>
              <select
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-rose-500 appearance-none text-center font-bold"
                onChange={(e) => {
                  setSign1(
                    ZODIAC_SIGNS.find((s) => s.id === e.target.value) || null
                  );
                  setMatchResult(null);
                }}
              >
                <option value="">-- Chọn cung --</option>
                {ZODIAC_SIGNS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-rose-500 animate-pulse text-4xl">❤</div>
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block text-center">
                Người ấy là...
              </label>
              <select
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-rose-500 appearance-none text-center font-bold"
                onChange={(e) => {
                  setSign2(
                    ZODIAC_SIGNS.find((s) => s.id === e.target.value) || null
                  );
                  setMatchResult(null);
                }}
              >
                <option value="">-- Chọn cung --</option>
                {ZODIAC_SIGNS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={calculateMatch}
            disabled={!sign1 || !sign2}
            className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Xem kết quả
          </button>
          {matchResult && (
            <div className="mt-8 w-full max-w-md bg-slate-800/50 border border-rose-500/30 p-6 rounded-2xl backdrop-blur-sm text-center animate-in zoom-in slide-in-from-bottom-4 duration-500">
              <div className="text-5xl font-black text-rose-400 mb-2 drop-shadow-lg">
                {matchResult.score}%
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${matchResult.score}%` }}
                ></div>
              </div>
              <p className="text-slate-200 italic">"{matchResult.text}"</p>
            </div>
          )}
        </div>
      )}

      {/* --- CUSTOM DATE PICKER (FIXED) --- */}
      {subTab === "find" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            Tra cứu Cung Hoàng Đạo
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Nhập ngày sinh của bạn để xem bạn thuộc cung nào
          </p>

          <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700 w-full max-w-md backdrop-blur-md">
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
              Ngày sinh của bạn
            </label>
            <div className="flex gap-2 relative">
              {/* Overlay Input Technique */}
              <div className="flex-1 relative">
                {/* Visual Input (Formatted) */}
                <div className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white flex items-center justify-between">
                  <span>
                    {birthDate ? formatDateDisplay(birthDate) : "dd/mm/yyyy"}
                  </span>
                  <CalendarIcon size={16} className="text-slate-500" />
                </div>

                {/* Actual Date Input (Hidden but clickable) */}
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    setFoundSign(null);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <button
                onClick={findZodiac}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 font-bold transition-all shadow-lg active:scale-95"
              >
                Tra cứu
              </button>
            </div>

            {/* Result */}
            {foundSign && (
              <div className="mt-6 pt-6 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-500 text-center">
                <div className="text-sm text-emerald-400 font-bold uppercase mb-2">
                  Kết quả:
                </div>
                <div className="text-6xl mb-2 animate-bounce">
                  {foundSign.icon}
                </div>
                <h3 className="text-3xl font-black text-white">
                  {foundSign.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{foundSign.date}</p>

                <div className="flex justify-center gap-2 text-xs font-bold mb-4">
                  <span
                    className={`px-2 py-1 rounded bg-slate-700 text-slate-300`}
                  >
                    Nguyên tố:{" "}
                    {foundSign.element === "fire"
                      ? "🔥 Lửa"
                      : foundSign.element === "water"
                      ? "💧 Nước"
                      : foundSign.element === "air"
                      ? "🌬️ Khí"
                      : "🏔️ Đất"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedSign(foundSign);
                    setSubTab("daily");
                  }}
                  className="text-indigo-400 hover:text-white hover:underline text-sm font-medium flex items-center justify-center gap-1"
                >
                  Xem tử vi hôm nay <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3. CHART VIEW (Updated Input Style) ---
const StarChartView = () => {
  const [info, setInfo] = useState({ name: "", date: "", time: "", place: "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    if (!info.name || !info.date) return;
    setLoading(true);
    setTimeout(() => {
      const date = new Date(info.date);
      const month = date.getMonth();
      setResult({
        sun: ZODIAC_SIGNS[month % 12],
        moon: ZODIAC_SIGNS[(month + 2) % 12],
        rising: ZODIAC_SIGNS[(month + 4) % 12],
        elements: { fire: 40, water: 30, air: 20, earth: 10 },
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row p-4 lg:p-8 gap-8 overflow-y-auto custom-scrollbar">
      {/* Input */}
      <div className="w-full lg:w-1/3 space-y-5">
        <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="text-amber-500" size={18} /> Nhập thông tin
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                Họ tên
              </label>
              <input
                type="text"
                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Ngày sinh
                </label>
                <div className="relative">
                  {/* Custom Date Overlay */}
                  <div className="w-full bg-slate-900/80 border border-slate-600 rounded-lg p-2.5 text-white text-sm flex items-center justify-between">
                    <span className={!info.date ? "text-slate-500" : ""}>
                      {info.date ? formatDateDisplay(info.date) : "dd/mm/yyyy"}
                    </span>
                    <CalendarIcon size={14} className="text-slate-500" />
                  </div>
                  <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={info.date}
                    onChange={(e) => setInfo({ ...info, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Giờ sinh
                </label>
                <input
                  type="time"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                  value={info.time}
                  onChange={(e) => setInfo({ ...info, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                Nơi sinh
              </label>
              <input
                type="text"
                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                value={info.place}
                onChange={(e) => setInfo({ ...info, place: e.target.value })}
                placeholder="Thành phố..."
              />
            </div>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RotateCcw className="animate-spin" /> : <Sparkles />}
              {loading ? "Đang phân tích..." : "Lập bản đồ"}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="flex-1 flex flex-col items-center relative min-h-[400px]">
        {result ? (
          <div className="w-full max-w-2xl animate-in zoom-in duration-500 space-y-6">
            {/* Main Placements */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Sun Sign",
                  sign: result.sun,
                  color: "text-amber-500",
                  sub: "Cốt lõi",
                },
                {
                  label: "Moon Sign",
                  sign: result.moon,
                  color: "text-slate-300",
                  sub: "Cảm xúc",
                },
                {
                  label: "Ascendant",
                  sign: result.rising,
                  color: "text-rose-400",
                  sub: "Vẻ ngoài",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 text-center relative overflow-hidden group hover:bg-slate-800/60 transition-colors"
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {item.label}
                  </div>
                  <div className={`text-4xl mb-2 ${item.color}`}>
                    {item.sign.icon}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {item.sign.name}
                  </div>
                  <div className="text-xs text-slate-400">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Elements Analysis */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                Phân bố nguyên tố
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Lửa (Nhiệt huyết)",
                    val: result.elements.fire,
                    color: "bg-rose-500",
                    icon: <Flame size={14} />,
                  },
                  {
                    label: "Nước (Cảm xúc)",
                    val: result.elements.water,
                    color: "bg-blue-500",
                    icon: <Droplets size={14} />,
                  },
                  {
                    label: "Khí (Trí tuệ)",
                    val: result.elements.air,
                    color: "bg-teal-400",
                    icon: <Wind size={14} />,
                  },
                  {
                    label: "Đất (Thực tế)",
                    val: result.elements.earth,
                    color: "bg-amber-700",
                    icon: <Mountain size={14} />,
                  },
                ].map((el, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        {el.icon} {el.label}
                      </span>
                      <span>{el.val}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${el.color} transition-all duration-1000`}
                        style={{ width: `${el.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full opacity-60">
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4 animate-spin-slow">
              <Star size={32} />
            </div>
            <p>Vũ trụ đang chờ thông tin từ bạn...</p>
          </div>
        )}
      </div>
    </div>
  );
};
