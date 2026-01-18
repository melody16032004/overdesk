import { useState, useEffect, useMemo } from "react";
import {
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Trophy,
  X,
  Save,
  Layout,
  ListTodo,
  Award,
  Sparkles,
  BarChart3,
  BrainCircuit,
} from "lucide-react";

// --- TYPES ---
interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  deadline: string;
  milestones: Milestone[];
  createdAt: number;
}

type GoalCategory = "career" | "finance" | "health" | "learn" | "life";

const CATEGORIES: Record<
  GoalCategory,
  { label: string; color: string; icon: string; bg: string }
> = {
  career: {
    label: "Sự nghiệp",
    color: "text-blue-400",
    icon: "💼",
    bg: "bg-blue-500",
  },
  finance: {
    label: "Tài chính",
    color: "text-emerald-400",
    icon: "💰",
    bg: "bg-emerald-500",
  },
  health: {
    label: "Sức khỏe",
    color: "text-rose-400",
    icon: "❤️",
    bg: "bg-rose-500",
  },
  learn: {
    label: "Học tập",
    color: "text-indigo-400",
    icon: "📚",
    bg: "bg-indigo-500",
  },
  life: {
    label: "Đời sống",
    color: "text-amber-400",
    icon: "🌟",
    bg: "bg-amber-500",
  },
};

// --- AI TEMPLATES ---
const AI_SUGGESTIONS: Record<GoalCategory, string[]> = {
  career: [
    "Cập nhật CV/Portfolio",
    "Học kỹ năng mới (AI, Code...)",
    "Mở rộng Network (LinkedIn)",
    "Hoàn thành dự án trọng điểm",
    "Đề xuất tăng lương/thăng chức",
  ],
  finance: [
    "Tiết kiệm 20% thu nhập",
    "Cắt giảm chi tiêu",
    "Tìm hiểu đầu tư",
    "Tạo quỹ dự phòng",
    "Trả hết nợ xấu",
  ],
  health: [
    "Uống đủ 2 lít nước/ngày",
    "Tập thể dục 30p",
    "Ngủ trước 11h đêm",
    "Ăn nhiều rau xanh",
    "Khám sức khỏe",
  ],
  learn: [
    "Đọc 1 cuốn sách/tháng",
    "Hoàn thành khóa học Online",
    "Luyện nghe Podcast",
    "Viết blog chia sẻ",
    "Tham gia Workshop",
  ],
  life: [
    "Dọn dẹp nhà cửa",
    "Đi du lịch 1 nơi mới",
    "Dành thời gian gia đình",
    "Học thiền/Yoga",
    "Viết nhật ký",
  ],
};

// --- HELPER: FORMAT DATE ---
const formatDateDisplay = (isoDate: string) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

export const GoalTrackerModule = () => {
  // --- STATE ---
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("my_goals") || "[]");
    } catch {
      return [];
    }
  });

  const [xp, setXp] = useState(() =>
    Number(localStorage.getItem("my_xp") || 0)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "all"
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCat, setFormCat] = useState<GoalCategory>("career");
  const [formDate, setFormDate] = useState("");
  const [formMilestones, setFormMilestones] = useState<string[]>([""]);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("my_goals", JSON.stringify(goals));
  }, [goals]);
  useEffect(() => {
    localStorage.setItem("my_xp", String(xp));
  }, [xp]);

  // --- LOGIC ---
  const calculateProgress = (milestones: Milestone[]) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.isCompleted).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getDaysLeft = (deadline: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpForNextLevel = level * level * 100;
  const currentLevelXpBase = (level - 1) * (level - 1) * 100;
  const xpProgress = Math.min(
    100,
    Math.max(
      0,
      ((xp - currentLevelXpBase) / (xpForNextLevel - currentLevelXpBase)) * 100
    )
  );

  // --- ACTIONS ---
  const handleAddGoal = () => {
    if (!formTitle.trim()) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: formTitle,
      category: formCat,
      deadline: formDate,
      createdAt: Date.now(),
      milestones: formMilestones
        .filter((t) => t.trim() !== "")
        .map((t, i) => ({
          id: `${Date.now()}-${i}`,
          title: t,
          isCompleted: false,
        })),
    };
    setGoals([newGoal, ...goals]);
    closeModal();
  };

  const deleteGoal = (id: string) => {
    if (confirm("Xóa mục tiêu này sẽ mất XP tương ứng?")) {
      setGoals(goals.filter((g) => g.id !== id));
    }
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((g) => {
        if (g.id !== goalId) return g;
        let xpChange = 0;
        const newMilestones = g.milestones.map((m) => {
          if (m.id === milestoneId) {
            xpChange = !m.isCompleted ? 50 : -50;
            return { ...m, isCompleted: !m.isCompleted };
          }
          return m;
        });
        const oldProgress = calculateProgress(g.milestones);
        const newProgress = calculateProgress(newMilestones);
        if (oldProgress < 100 && newProgress === 100) {
          xpChange += 200;
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        if (oldProgress === 100 && newProgress < 100) xpChange -= 200;
        setXp((prev) => Math.max(0, prev + xpChange));
        return { ...g, milestones: newMilestones };
      })
    );
  };

  const handleAiSuggest = () => {
    const shuffled = [...AI_SUGGESTIONS[formCat]]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setFormMilestones(shuffled);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormTitle("");
    setFormDate("");
    setFormMilestones([""]);
  };

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    goals.forEach((g) => {
      stats[g.category] = (stats[g.category] || 0) + 1;
    });
    const total = goals.length || 1;
    return Object.entries(CATEGORIES)
      .map(([key, val]) => ({
        key,
        ...val,
        count: stats[key] || 0,
        percent: ((stats[key] || 0) / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [goals]);

  const filteredGoals = goals.filter((g) => {
    const progress = calculateProgress(g.milestones);
    if (activeTab === "completed") return progress === 100;
    if (activeTab === "active") return progress < 100;
    return true;
  });

  // --- RENDER HELPERS ---
  const SidebarContent = () => (
    <div className="flex flex-col gap-6 h-full">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden group shrink-0">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Trophy size={64} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase opacity-80 mb-1">
            Cấp độ hiện tại
          </div>
          <div className="text-4xl font-black mb-2 flex items-baseline gap-1">
            {level}{" "}
            <span className="text-sm font-normal opacity-60">Master</span>
          </div>
          <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono opacity-70">
            <span>{xp} XP</span>
            <span>{Math.round(xpForNextLevel)} XP Next</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <BarChart3 size={14} /> Phân bố mục tiêu
        </h3>
        <div className="space-y-3">
          {categoryStats.map((cat) => (
            <div key={cat.key} className="group">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-2">
                  {cat.icon} {cat.label}
                </span>
                <span className="font-mono opacity-60">{cat.count}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cat.bg} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                  style={{ width: `${cat.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-xs text-slate-400 italic shrink-0">
        <Sparkles size={14} className="inline mr-1 text-yellow-500" />
        "Mỗi bước nhỏ đều được tính. Hoàn thành 1 cột mốc nhận 50XP!"
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex items-center justify-between z-20 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg text-white shadow-lg">
            <Target size={20} />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none hidden xs:block">
              Goal Master
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Lv.{level} • {xp}XP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileStats(true)}
            className="lg:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 border border-rose-500/50"
          >
            <Plus size={16} />{" "}
            <span className="hidden sm:inline">Mục tiêu</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-slate-700 text-white border-slate-600"
                    : "bg-transparent text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                {tab === "all"
                  ? "Tất cả"
                  : tab === "active"
                  ? "Đang làm"
                  : "Đã xong"}
              </button>
            ))}
          </div>

          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <ListTodo size={48} className="text-slate-600" />
              </div>
              <p>Danh sách trống. Hãy bắt đầu ngay!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const progress = calculateProgress(goal.milestones);
                const daysLeft = getDaysLeft(goal.deadline);
                const isDone = progress === 100;

                return (
                  <div
                    key={goal.id}
                    className={`group relative bg-[#1e293b] border ${
                      isDone ? "border-emerald-500/30" : "border-slate-700"
                    } rounded-2xl p-5 shadow-lg transition-all hover:border-slate-600 overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase text-white ${
                        CATEGORIES[goal.category].bg
                      }`}
                    >
                      {CATEGORIES[goal.category].label}
                    </div>

                    <div className="flex gap-4">
                      <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-slate-700"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className={`${
                              isDone ? "text-emerald-500" : "text-rose-500"
                            } transition-all duration-1000`}
                            strokeDasharray={`${progress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute text-[10px] font-bold">
                          {progress}%
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-bold text-white text-base truncate ${
                            isDone ? "line-through opacity-50" : ""
                          }`}
                          title={goal.title}
                        >
                          {goal.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          {isDone ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Award size={12} /> Hoàn thành
                            </span>
                          ) : (
                            <span
                              className={`${
                                daysLeft !== null && daysLeft < 0
                                  ? "text-rose-400"
                                  : ""
                              }`}
                            >
                              {daysLeft === null
                                ? "Vô thời hạn"
                                : daysLeft < 0
                                ? `Trễ ${Math.abs(daysLeft)} ngày`
                                : `${daysLeft} ngày còn lại`}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="self-start text-slate-600 hover:text-rose-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleMilestone(goal.id, m.id)}
                          className="flex items-center gap-3 cursor-pointer group/item hover:bg-white/5 p-1 rounded-lg transition-colors"
                        >
                          <div
                            className={`transition-all ${
                              m.isCompleted
                                ? "text-emerald-500 scale-110"
                                : "text-slate-600 group-hover/item:text-slate-400"
                            }`}
                          >
                            {m.isCompleted ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>
                          <span
                            className={`text-sm flex-1 truncate transition-all ${
                              m.isCompleted
                                ? "text-slate-500 line-through decoration-slate-600"
                                : "text-slate-300"
                            }`}
                          >
                            {m.title}
                          </span>
                          {m.isCompleted && (
                            <span className="text-[9px] font-bold text-emerald-500/50">
                              +50XP
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:flex w-80 bg-[#1e293b] border-l border-slate-800 p-6 flex-col gap-6 shrink-0 z-10 shadow-xl overflow-y-auto">
          <SidebarContent />
        </div>

        {showMobileStats && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setShowMobileStats(false)}
            ></div>
            <div className="relative w-80 bg-[#1e293b] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col p-6 border-l border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg">Thống kê</h3>
                <button
                  onClick={() => setShowMobileStats(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL (UPDATED DATE INPUT) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layout size={18} className="text-rose-500" /> Mục tiêu mới
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                  Tôi muốn đạt được...
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Mua nhà, Học IELTS..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                    Lĩnh vực
                  </label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-rose-500"
                  >
                    {Object.entries(CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.icon} {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                    Hạn chót
                  </label>
                  <div className="relative">
                    {/* Custom Date Input Overlay */}
                    <div className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white flex items-center justify-between">
                      <span className={!formDate ? "text-slate-500" : ""}>
                        {formDate ? formatDateDisplay(formDate) : "dd/mm/yyyy"}
                      </span>
                      <Calendar size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex justify-between items-center">
                  <span>Lộ trình (Milestones)</span>
                  <button
                    onClick={handleAiSuggest}
                    className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-1"
                  >
                    <BrainCircuit size={12} /> AI Gợi ý
                  </button>
                </label>
                <div className="space-y-2">
                  {formMilestones.map((ms, idx) => (
                    <div key={idx} className="flex gap-2 group">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={ms}
                          onChange={(e) => {
                            const newMs = [...formMilestones];
                            newMs[idx] = e.target.value;
                            setFormMilestones(newMs);
                          }}
                          placeholder={`Bước ${idx + 1}...`}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-8 text-sm text-white outline-none focus:border-rose-500 focus:bg-slate-900 transition-all"
                        />
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                          {idx + 1}.
                        </div>
                      </div>
                      {formMilestones.length > 1 && (
                        <button
                          onClick={() =>
                            setFormMilestones(
                              formMilestones.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setFormMilestones([...formMilestones, ""])}
                    className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus size={14} /> Thêm bước tiếp theo
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAddGoal}
                className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Save size={18} /> Lưu & Bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-start pt-20">
          <div className="text-6xl animate-bounce drop-shadow-2xl">🎉🏆✨</div>
        </div>
      )}
    </div>
  );
};
