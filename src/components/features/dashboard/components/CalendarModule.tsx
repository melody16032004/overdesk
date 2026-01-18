import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  X,
  RefreshCw,
  Repeat,
} from "lucide-react";

// --- TYPES ---
type RepeatType = "none" | "daily" | "weekly" | "monthly" | "yearly";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (Ngày bắt đầu)
  type: "event" | "task";
  repeat?: RepeatType; // Thêm trường này
  color: string;
  desc?: string;
  completed?: boolean;
}

// --- HELPERS ---
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

// Hàm kiểm tra xem sự kiện có diễn ra vào ngày 'targetDateStr' không
const isEventOccurringOnDate = (evt: CalendarEvent, targetDateStr: string) => {
  // 1. Nếu ngày trùng khớp chính xác -> Có
  if (evt.date === targetDateStr) return true;

  // 2. Nếu không lặp lại -> Không
  if (!evt.repeat || evt.repeat === "none") return false;

  // 3. Logic lặp lại
  const start = new Date(evt.date);
  const current = new Date(targetDateStr);

  // Không lặp lại ngược về quá khứ
  if (current < start) return false;

  if (evt.repeat === "daily") return true;

  if (evt.repeat === "weekly") {
    // Cùng thứ trong tuần (0-6)
    return start.getDay() === current.getDay();
  }

  if (evt.repeat === "monthly") {
    // Cùng ngày trong tháng (1-31)
    return start.getDate() === current.getDate();
  }

  if (evt.repeat === "yearly") {
    // Cùng ngày và cùng tháng
    return (
      start.getDate() === current.getDate() &&
      start.getMonth() === current.getMonth()
    );
  }

  return false;
};

export const CalendarModule = () => {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString(new Date())
  );

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "event" | "task">("all");

  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventRepeat, setNewEventRepeat] = useState<RepeatType>("none"); // State cho Repeat

  // --- DATA LOADING ---
  const loadData = () => {
    const localEvents = JSON.parse(
      localStorage.getItem("dashboard_calendar_events") || "[]"
    );
    const tasksRaw = JSON.parse(
      localStorage.getItem("dashboard_tasks") || "[]"
    );

    const taskEvents: CalendarEvent[] = tasksRaw
      .filter((t: any) => t.dueDate)
      .map((t: any) => ({
        id: t.id,
        title: t.text,
        date: t.dueDate,
        type: "task",
        repeat: "none", // Task thường không lặp lại (theo logic hiện tại)
        color: t.done
          ? "bg-slate-500"
          : t.priority === "high"
          ? "bg-red-500"
          : t.priority === "medium"
          ? "bg-orange-500"
          : "bg-indigo-500",
        completed: t.done,
        desc: t.priority ? `Priority: ${t.priority}` : undefined,
      }));

    setEvents([...localEvents, ...taskEvents]);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // --- ACTIONS ---
  const changeMonth = (offset: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  const jumpToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const dateStr = getLocalDateString(now);
    setSelectedDate(dateStr);
    if (window.innerWidth < 768) setShowMobileDetail(true);
  };

  const saveEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEvent: CalendarEvent = {
      id: `evt_${Date.now()}`,
      title: newEventTitle,
      date: selectedDate,
      type: "event",
      repeat: newEventRepeat, // Lưu cấu hình lặp
      color: "bg-emerald-500",
      desc: newEventDesc,
    };

    const currentLocal = JSON.parse(
      localStorage.getItem("dashboard_calendar_events") || "[]"
    );
    localStorage.setItem(
      "dashboard_calendar_events",
      JSON.stringify([...currentLocal, newEvent])
    );

    // Reset Form
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventRepeat("none");
    setShowModal(false);
    loadData();
  };

  const deleteEvent = (id: string, type: "event" | "task") => {
    if (type === "task") {
      if (confirm("Xóa deadline của Task này?")) {
        const tasksRaw = JSON.parse(
          localStorage.getItem("dashboard_tasks") || "[]"
        );
        const updatedTasks = tasksRaw.map((t: any) =>
          t.id === id ? { ...t, dueDate: null } : t
        );
        localStorage.setItem("dashboard_tasks", JSON.stringify(updatedTasks));
        loadData();
      }
      return;
    }
    // Cảnh báo đặc biệt cho sự kiện lặp lại
    const targetEvent = events.find((e) => e.id === id);
    const isRecurring =
      targetEvent && targetEvent.repeat && targetEvent.repeat !== "none";
    const msg = isRecurring
      ? "Đây là sự kiện lặp lại. Hành động này sẽ xóa TOÀN BỘ chuỗi sự kiện. Tiếp tục?"
      : "Xóa sự kiện này?";

    if (confirm(msg)) {
      const currentLocal = JSON.parse(
        localStorage.getItem("dashboard_calendar_events") || "[]"
      );
      localStorage.setItem(
        "dashboard_calendar_events",
        JSON.stringify(currentLocal.filter((e: any) => e.id !== id))
      );
      loadData();
    }
  };

  const toggleTaskCompletion = (id: string, currentStatus: boolean) => {
    const tasksRaw = JSON.parse(
      localStorage.getItem("dashboard_tasks") || "[]"
    );
    const updatedTasks = tasksRaw.map((t: any) =>
      t.id === id ? { ...t, done: !currentStatus } : t
    );
    localStorage.setItem("dashboard_tasks", JSON.stringify(updatedTasks));
    loadData();
  };

  // --- RENDER LOGIC (NÂNG CẤP) ---
  const filteredEvents = events.filter(
    (e) => filterType === "all" || e.type === filterType
  );

  // Logic lấy sự kiện cho ngày được chọn (bao gồm cả lặp lại)
  const selectedDayEvents = filteredEvents.filter((e) =>
    isEventOccurringOnDate(e, selectedDate)
  );

  const renderGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const todayStr = getLocalDateString(new Date());

    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="bg-[#1e1e1e]/50 border-r border-b border-[#3e3e42] backdrop-blur-sm"
        ></div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = getLocalDateString(new Date(year, month, d));
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      // LỌC SỰ KIỆN CHO Ô NÀY (Hỗ trợ lặp lại)
      const dayEvents = filteredEvents.filter((e) =>
        isEventOccurringOnDate(e, dateStr)
      );

      cells.push(
        <div
          key={d}
          onClick={() => {
            setSelectedDate(dateStr);
            if (window.innerWidth < 768) setShowMobileDetail(true);
          }}
          className={`min-h-[80px] md:min-h-[100px] border-r border-b border-[#3e3e42] p-1 transition-all relative group cursor-pointer 
                      ${
                        isSelected
                          ? "bg-[#2d2d2d] shadow-inner"
                          : "hover:bg-[#252526]"
                      }
                      ${isToday ? "bg-blue-500/5" : ""}
                  `}
        >
          <div
            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-transform ${
              isToday
                ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                : "text-slate-400"
            }`}
          >
            {d}
          </div>

          <div className="flex flex-col gap-1">
            {dayEvents.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className={`
                                  text-[10px] px-1.5 py-0.5 rounded-md truncate text-white 
                                  flex items-center gap-1 shadow-sm
                                  ${evt.color} ${
                  evt.completed
                    ? "opacity-40 line-through decoration-slate-400"
                    : ""
                }
                              `}
              >
                {/* Icon phân biệt */}
                {evt.type === "task" ? (
                  <CheckCircle2 size={8} className="shrink-0" />
                ) : evt.repeat && evt.repeat !== "none" ? (
                  <Repeat size={8} className="shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                )}
                <span className="truncate">{evt.title}</span>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[9px] text-slate-500 pl-1 font-medium">
                +{dayEvents.length - 3} nữa
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(dateStr);
              setShowModal(true);
            }}
            className="absolute bottom-1 right-1 p-1 rounded bg-[#3e3e42] text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hidden md:block"
          >
            <Plus size={12} />
          </button>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* LEFT: CALENDAR GRID */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        <div className="flex-none p-3 md:p-4 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between z-20 shadow-md">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex bg-[#1e1e1e] rounded-lg p-0.5 border border-[#3e3e42]">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 hover:text-white rounded hover:bg-[#3e3e42]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 hover:text-white rounded hover:bg-[#3e3e42]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-500 mb-0.5" />
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-[#1e1e1e] rounded-lg p-0.5 border border-[#3e3e42] text-[10px] font-bold">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2 py-1 rounded transition-colors ${
                  filterType === "all"
                    ? "bg-[#3e3e42] text-white"
                    : "hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("task")}
                className={`px-2 py-1 rounded transition-colors ${
                  filterType === "task"
                    ? "bg-[#3e3e42] text-white"
                    : "hover:text-white"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setFilterType("event")}
                className={`px-2 py-1 rounded transition-colors ${
                  filterType === "event"
                    ? "bg-[#3e3e42] text-white"
                    : "hover:text-white"
                }`}
              >
                Events
              </button>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#3e3e42] rounded-lg"
              title="Refresh Data"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={jumpToday}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/20"
            >
              Today
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-[#3e3e42] bg-[#252526]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-bold uppercase text-slate-500 tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1e1e1e] relative">
          <div className="grid grid-cols-7 auto-rows-fr min-h-full">
            {renderGrid()}
          </div>
        </div>
      </div>

      {/* RIGHT: SIDEBAR */}
      <div
        className={`
          absolute md:relative inset-0 md:inset-auto z-40 md:z-0 
          md:w-80 md:flex flex-col border-l border-[#3e3e42] bg-[#252526] shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${
            showMobileDetail
              ? "translate-y-0"
              : "translate-y-full md:translate-y-0"
          }
          flex flex-col mt-20 md:mt-0 rounded-t-2xl md:rounded-none
      `}
      >
        <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] relative rounded-t-2xl md:rounded-none">
          <button
            onClick={() => setShowMobileDetail(false)}
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {new Date(selectedDate).getDate()}
          </div>
          <div className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">
            {new Date(selectedDate).toLocaleString("default", {
              weekday: "long",
            })}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#252526]">
          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 opacity-60">
              <Clock size={32} className="mb-2" />
              <p className="text-xs">No events today</p>
            </div>
          ) : (
            selectedDayEvents.map((evt) => (
              <div
                key={evt.id}
                className="group p-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-xl hover:border-slate-500 transition-all relative shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {evt.type === "task" ? (
                    <button
                      onClick={() =>
                        toggleTaskCompletion(evt.id, !!evt.completed)
                      }
                      className={`mt-1 transition-colors ${
                        evt.completed
                          ? "text-blue-500"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {evt.completed ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${evt.color}`}
                    ></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-bold text-slate-200 leading-snug ${
                        evt.completed ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {evt.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3e3e42] text-slate-400 font-bold uppercase tracking-wider">
                        {evt.type}
                      </span>
                      {evt.completed && (
                        <span className="text-[10px] text-green-500 font-bold">
                          Done
                        </span>
                      )}
                      {evt.repeat && evt.repeat !== "none" && (
                        <span className="text-[10px] flex items-center gap-1 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          <Repeat size={10} /> {evt.repeat}
                        </span>
                      )}
                    </div>
                    {evt.desc && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {evt.desc}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteEvent(evt.id, evt.type)}
                  className="absolute top-3 right-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#3e3e42] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3e3e42] bg-[#252526] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-500" /> New Event
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} className="text-slate-400 hover:text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Title
                </label>
                <input
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Title..."
                  autoFocus
                  className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Repeat
                  </label>
                  <select
                    value={newEventRepeat}
                    onChange={(e) =>
                      setNewEventRepeat(e.target.value as RepeatType)
                    }
                    className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Note
                </label>
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Description..."
                  rows={3}
                  className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <button
                onClick={saveEvent}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all mt-2"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
      {showMobileDetail && (
        <div
          className="absolute inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowMobileDetail(false)}
        ></div>
      )}
    </div>
  );
};
