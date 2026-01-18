import { useState, useEffect, useMemo } from "react";
import {
  Droplets,
  Activity,
  Scale,
  Utensils,
  Sun,
  Flame,
  Plus,
  Minus,
  Info,
  ChevronLeft,
  ChevronRight,
  Trophy,
  History,
} from "lucide-react";

// --- TYPES ---
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";

interface BodyStats {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: Gender;
  activity: ActivityLevel;
}

// Lưu lịch sử: Key là "YYYY-MM-DD", Value là số ml đã uống
interface WaterHistory {
  [date: string]: number;
}

interface DailyContext {
  weatherHot: boolean;
  workout: boolean;
}

// --- CONSTANTS ---
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const INITIAL_BODY: BodyStats = {
  weight: 70,
  height: 170,
  age: 25,
  gender: "male",
  activity: "sedentary",
};

export const WaterBodyModule = () => {
  // --- STATE ---
  const [body, setBody] = useState<BodyStats>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("dashboard_body_stats") || "") ||
        INITIAL_BODY
      );
    } catch {
      return INITIAL_BODY;
    }
  });

  // History State (Lưu tất cả dữ liệu các ngày)
  const [history, setHistory] = useState<WaterHistory>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("dashboard_water_history") || "{}"
      );
    } catch {
      return {};
    }
  });

  // Context State (Hot/Workout - Reset daily technically, but simple state here)
  const [context, setContext] = useState<DailyContext>({
    weatherHot: false,
    workout: false,
  });

  // Calendar View State
  const [viewDate, setViewDate] = useState(new Date());

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("dashboard_body_stats", JSON.stringify(body));
  }, [body]);
  useEffect(() => {
    localStorage.setItem("dashboard_water_history", JSON.stringify(history));
  }, [history]);

  // --- HELPERS ---
  // ✅ Đúng: Lấy giờ Local (Việt Nam)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayKey = getTodayString();

  // --- CALCULATIONS ---
  const metrics = useMemo(() => {
    // 1. BMI
    const heightM = body.height / 100;
    const bmi = body.weight / (heightM * heightM);
    let bmiStatus = "Normal";
    let bmiColor = "text-emerald-400";
    if (bmi < 18.5) {
      bmiStatus = "Underweight";
      bmiColor = "text-blue-400";
    } else if (bmi >= 25 && bmi < 29.9) {
      bmiStatus = "Overweight";
      bmiColor = "text-yellow-400";
    } else if (bmi >= 30) {
      bmiStatus = "Obese";
      bmiColor = "text-rose-400";
    }

    // 2. BMR & TDEE
    let bmr = 10 * body.weight + 6.25 * body.height - 5 * body.age;
    bmr += body.gender === "male" ? 5 : -161;
    const tdee = bmr * ACTIVITY_MULTIPLIERS[body.activity];

    // 3. Water Goal
    let baseGoal = body.weight * 35;
    let extra = 0;
    if (context.weatherHot) extra += 500;
    if (context.workout) extra += body.gender === "male" ? 700 : 500;
    const totalGoal = Math.round(baseGoal + extra);

    return {
      bmi: bmi.toFixed(1),
      bmiStatus,
      bmiColor,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      waterGoal: totalGoal,
    };
  }, [body, context]);

  const currentWater = history[todayKey] || 0;
  const percentage = Math.min((currentWater / metrics.waterGoal) * 100, 100);

  // --- HANDLERS ---
  const addWater = (amount: number) => {
    setHistory((prev) => ({
      ...prev,
      [todayKey]: (prev[todayKey] || 0) + amount,
    }));
  };

  const undoWater = () => {
    setHistory((prev) => ({
      ...prev,
      [todayKey]: Math.max(0, (prev[todayKey] || 0) - 250),
    }));
  };

  // --- CALENDAR GENERATOR ---
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    // Empty slots for prev month
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  }, [viewDate]);

  const changeMonth = (delta: number) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1)
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Droplets size={20} className="text-blue-500" />
          </div>
          <span>Hydro & Body</span>
        </div>

        {/* Smart Context Chip */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full text-xs">
          <Trophy size={12} className="text-yellow-500" />
          <span className="text-slate-400">
            Goal:{" "}
            <span className="text-white font-bold">{metrics.waterGoal}ml</span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* === COLUMN 1: WATER TRACKER (4 cols) === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Main Tank */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-800 shadow-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {/* Animation Layer */}
            <div className="absolute inset-0 z-0">
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-600/20 transition-all duration-1000 ease-in-out"
                style={{ height: `${percentage}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-blue-400/50 blur-md animate-pulse"></div>
              </div>
              {/* Grid Pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>

            {/* Info Layer */}
            <div className="relative z-10 text-center w-full">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                Today
              </div>
              <div className="text-6xl font-black text-white mb-2 drop-shadow-2xl">
                {Math.round(percentage)}
                <span className="text-2xl text-blue-400">%</span>
              </div>
              <div className="text-sm font-medium text-slate-300 bg-slate-900/60 px-4 py-1.5 rounded-full backdrop-blur-sm inline-block mb-8 border border-slate-700">
                <span className="text-blue-400 font-bold">{currentWater}</span>{" "}
                / {metrics.waterGoal} ml
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => addWater(250)}
                  className="group flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span className="text-xs font-bold opacity-80">+250ml</span>
                </button>
                <button
                  onClick={() => addWater(500)}
                  className="group flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <div className="relative">
                    <Plus size={20} />
                    <Plus size={12} className="absolute -top-1 -right-2" />
                  </div>
                  <span className="text-xs font-bold opacity-80">+500ml</span>
                </button>
              </div>

              <button
                onClick={undoWater}
                className="mt-4 text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 w-full opacity-60 hover:opacity-100 transition-opacity"
              >
                <Minus size={12} /> Undo last
              </button>
            </div>

            {/* Context Toggles */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button
                onClick={() =>
                  setContext((prev) => ({
                    ...prev,
                    weatherHot: !prev.weatherHot,
                  }))
                }
                className={`p-2.5 rounded-xl transition-all ${
                  context.weatherHot
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                }`}
                title="Trời nóng (+500ml)"
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() =>
                  setContext((prev) => ({ ...prev, workout: !prev.workout }))
                }
                className={`p-2.5 rounded-xl transition-all ${
                  context.workout
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                }`}
                title="Tập luyện (+Calo & Nước)"
              >
                <Flame size={18} />
              </button>
            </div>
          </div>

          {/* Smart Advice */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3 items-start">
            <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-blue-300 block mb-1">Smart Tip:</strong>
              {percentage < 30
                ? "Mới bắt đầu ngày mới? Hãy uống ngay 1 cốc nước lớn để kích hoạt trao đổi chất!"
                : percentage < 70
                ? "Bạn đang làm tốt! Duy trì đều đặn để tránh mệt mỏi vào buổi chiều."
                : "Tuyệt vời! Bạn sắp đạt mục tiêu. Đừng uống quá nhiều nước sát giờ đi ngủ nhé."}
            </div>
          </div>
        </div>

        {/* === COLUMN 2: CALENDAR & HISTORY (4 cols) === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1e293b] rounded-3xl border border-slate-800 shadow-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History size={18} className="text-purple-500" /> History
              </h3>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-mono font-bold w-16 text-center">
                  {viewDate.toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-slate-600 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 content-start">
              {calendarDays.map((dateStr, i) => {
                if (!dateStr)
                  return (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  );

                const val = history[dateStr] || 0;
                // Tính % dựa trên goal hiện tại (tương đối)
                const pct = Math.min((val / metrics.waterGoal) * 100, 100);

                let bgClass = "bg-slate-800/50 text-slate-500"; // 0%
                if (pct > 0) bgClass = "bg-blue-900/30 text-blue-200"; // Started
                if (pct >= 50) bgClass = "bg-blue-600/40 text-blue-100"; // Half
                if (pct >= 100)
                  bgClass =
                    "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold"; // Done

                const isToday = dateStr === todayKey;

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-default transition-all relative group ${bgClass} ${
                      isToday
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]"
                        : ""
                    }`}
                  >
                    <span>{parseInt(dateStr.split("-")[2])}</span>
                    {isToday && (
                      <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>
                    )}

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-[10px] text-white px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {val} ml
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 px-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-slate-800"></div> 0%
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-blue-900/50"></div> &lt;50%
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-blue-600/50"></div> &gt;50%
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-emerald-500"></div> 100%
              </div>
            </div>
          </div>
        </div>

        {/* === COLUMN 3: BODY STATS (4 cols) === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1e293b] rounded-3xl border border-slate-800 shadow-xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
              <Scale size={16} className="text-emerald-500" /> Body Metrics
            </h3>

            <div className="space-y-5">
              {/* Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5 group-focus-within:text-blue-400">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={body.weight}
                    onChange={(e) =>
                      setBody({ ...body, weight: Number(e.target.value) })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="group">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5 group-focus-within:text-blue-400">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={body.height}
                    onChange={(e) =>
                      setBody({ ...body, height: Number(e.target.value) })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5 group-focus-within:text-blue-400">
                    Age
                  </label>
                  <input
                    type="number"
                    value={body.age}
                    onChange={(e) =>
                      setBody({ ...body, age: Number(e.target.value) })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">
                    Gender
                  </label>
                  <div className="flex bg-[#0f172a] rounded-xl p-1 border border-slate-700">
                    <button
                      onClick={() => setBody({ ...body, gender: "male" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        body.gender === "male"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-white"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setBody({ ...body, gender: "female" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        body.gender === "female"
                          ? "bg-pink-600 text-white"
                          : "text-slate-500 hover:text-white"
                      }`}
                    >
                      Fem
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">
                  Activity
                </label>
                <select
                  value={body.activity}
                  onChange={(e) =>
                    setBody({
                      ...body,
                      activity: e.target.value as ActivityLevel,
                    })
                  }
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                >
                  <option value="sedentary">
                    Người làm văn phòng, ít vận động
                  </option>
                  <option value="light">Tập nhẹ 1-3 buổi/tuần</option>
                  <option value="moderate">Tập vừa phải 3-5 buổi/tuần</option>
                  <option value="active">Tập nặng 6-7 buổi/tuần</option>
                  <option value="athlete">
                    Vận động viên, lao động chân tay nặng
                  </option>
                </select>
              </div>
            </div>

            <div className="h-px bg-slate-800 my-6"></div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  BMI Score
                </div>
                <div className={`text-3xl font-black ${metrics.bmiColor}`}>
                  {metrics.bmi}
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${metrics.bmiColor} bg-white/5 inline-block px-2 py-0.5 rounded`}
                >
                  {metrics.bmiStatus}
                </div>
                <Activity className="absolute right-[-5px] bottom-[-5px] text-slate-800 w-16 h-16 -z-0 opacity-50 group-hover:scale-110 transition-transform" />
              </div>

              <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  TDEE (Calories)
                </div>
                <div className="text-3xl font-black text-orange-400">
                  {metrics.tdee}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  BMR: {metrics.bmr} kcal
                </div>
                <Utensils className="absolute right-[-5px] bottom-[-5px] text-slate-800 w-16 h-16 -z-0 opacity-50 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
