import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  GripVertical,
  Calendar as CalendarIcon,
  List as ListIcon,
  Flag,
  X,
  Inbox,
  Pencil,
  Check,
  ArrowUpDown,
  Clock,
  Search,
} from "lucide-react";
import { useDataStore, Task } from "../../../../stores/useDataStore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { MiniCalendar } from "./MiniCalendar";
import { format, isToday, isTomorrow } from "date-fns";
import { useToastStore } from "../../../../stores/useToastStore";
import { saveToDisk } from "../../../../utils/storage";

type SortType = "default" | "alpha" | "date" | "priority";

export const TaskModule = () => {
  const { showToast } = useToastStore();
  const { tasks, addTask, toggleTask, deleteTask, reorderTasks, updateTask } =
    useDataStore();

  // --- Form State ---
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | undefined
  >(undefined);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<"all" | "active">("all");
  const [view, setView] = useState<"list" | "calendar">("list");

  // --- SORT & SEARCH STATE ---
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 1. Thêm State cho Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    // Đặt hẹn giờ: Sau 300ms sẽ cập nhật giá trị debounced
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms là độ trễ chuẩn, đủ mượt

    // Dọn dẹp: Nếu người dùng gõ tiếp trong lúc đang chờ, hủy hẹn giờ cũ
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    saveToDisk("tasks", tasks);
    localStorage.setItem("dashboard_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (input.trim()) {
      addTask({ text: input, priority, dueDate });
      setInput("");
      setPriority(undefined);
      setDueDate(undefined);
      setIsExpanded(false);
      showToast("Task added successfully", "success", 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTask();
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderTasks(items);
  };

  // --- LOGIC XỬ LÝ DỮ LIỆU (Filter -> Search -> Sort) ---
  const processedTasks = useMemo(() => {
    // Bước 1: Lọc theo Tab (Active/All)
    let result = tasks.filter((t) => (filter === "all" ? true : !t.done));

    // Bước 2: Lọc theo Từ khóa DEBOUNCED (Thay vì searchQuery gốc)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter((t) => t.text.toLowerCase().includes(q));
    }

    // Bước 3: Sắp xếp
    if (sortBy === "default") return result;

    return result.sort((a, b) => {
      if (sortBy === "alpha") return a.text.localeCompare(b.text);
      if (sortBy === "date") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        const pMap: Record<string, number> = {
          high: 3,
          medium: 2,
          low: 1,
          undefined: 0,
        };
        return (
          pMap[b.priority || "undefined"] - pMap[a.priority || "undefined"]
        );
      }
      return 0;
    });
  }, [tasks, filter, sortBy, debouncedSearchQuery]); // Thêm searchQuery vào dependency

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-slate-300 dark:text-slate-700 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-3">
        <Inbox size={24} strokeWidth={1.5} />
      </div>
      <p className="text-xs font-medium">{message}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 1. Header Controls */}
      <div className="flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          {/* Filter Tabs (Ẩn khi đang mở search để đỡ chật chỗ) */}
          {!isSearchOpen && (
            <div className="flex gap-2 p-1 rounded-lg w-fit transition-colors bg-slate-200 dark:bg-black/20 animate-in fade-in duration-200">
              {["all", "active"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    filter === f
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* INPUT TÌM KIẾM (Hiện ra khi bấm kính lúp) */}
          {isSearchOpen && (
            <div className="relative animate-in slide-in-from-left-5 duration-200">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={12} />
              </div>
              <input
                name="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                autoFocus
                className="w-50 bg-slate-100 dark:bg-slate-800/50 text-xs py-1.5 pl-7 pr-7 rounded-lg focus:outline-none focus:ring-0 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Group Buttons (Sort & Search Toggle) */}
          <div className="flex items-center gap-1">
            {/* Nút bật Search (Chỉ hiện khi search chưa mở) */}
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                title="Search"
              >
                <Search size={14} />
              </button>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  sortBy !== "default"
                    ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                    : "text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
                title="Sort tasks"
              >
                <ArrowUpDown size={14} />
              </button>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { id: "default", label: "Default", icon: Clock },
                      { id: "priority", label: "Priority", icon: Flag },
                      { id: "date", label: "Due Date", icon: CalendarIcon },
                      { id: "alpha", label: "Name (A-Z)", icon: ListIcon },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id as SortType);
                          setShowSortMenu(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 text-[10px] rounded-lg transition-colors ${
                          sortBy === opt.id
                            ? "bg-indigo-500 text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <opt.icon size={12} /> {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setView(view === "list" ? "calendar" : "list")}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          {view === "list" ? (
            <CalendarIcon size={16} />
          ) : (
            <ListIcon size={16} />
          )}
        </button>
      </div>

      {/* 2. Main Content */}
      {view === "calendar" ? (
        <div className="animate-in fade-in zoom-in duration-200">
          <MiniCalendar />
        </div>
      ) : (
        <>
          {/* Input Area (Chỉ hiện khi KHÔNG TÌM KIẾM - Để tập trung) */}
          {/* Nếu bạn muốn vừa tìm vừa thêm được thì bỏ điều kiện !isSearchOpen đi, nhưng ẩn đi thì giao diện sạch hơn */}
          {!isSearchOpen && (
            <div
              className={`relative group rounded-xl border transition-all duration-200 ${
                isExpanded
                  ? "bg-white dark:bg-slate-800 border-indigo-500/50 shadow-lg p-3"
                  : "bg-slate-100 dark:bg-slate-800/40 border-transparent p-0"
              }`}
            >
              <div className={`relative ${isExpanded ? "mb-3" : ""}`}>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 transition-colors ${
                    isExpanded
                      ? "text-indigo-500 left-0"
                      : "text-slate-400 left-2"
                  }`}
                >
                  <Plus size={16} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onFocus={() => setIsExpanded(true)}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a new task..."
                  className={`w-full pl-7 pr-5 py-2.5 rounded-xl bg-transparent focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400`}
                />
                {isExpanded && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsExpanded(false);
                      setInput("");
                      setDueDate(undefined);
                      setPriority(undefined);
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        ref={dateInputRef}
                        type="date"
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        onChange={(e) => setDueDate(e.target.value)}
                        value={dueDate || ""}
                      />
                      <button
                        onClick={() => dateInputRef.current?.showPicker()}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer select-none ${
                          dueDate
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30"
                            : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        <CalendarIcon size={12} />
                        {dueDate ? format(new Date(dueDate), "MMM d") : "Date"}
                      </button>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-white/5 rounded-md p-0.5">
                      {[
                        { level: "low", color: "text-slate-400" },
                        { level: "medium", color: "text-orange-400" },
                        { level: "high", color: "text-red-500" },
                      ].map((p: any) => (
                        <button
                          key={p.level}
                          onClick={() =>
                            setPriority(
                              priority === p.level ? undefined : p.level
                            )
                          }
                          className={`p-1 rounded transition-all ${
                            priority === p.level
                              ? "bg-white dark:bg-slate-700 shadow-sm " +
                                p.color
                              : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
                          }`}
                          title={p.level}
                        >
                          <Flag
                            size={12}
                            fill={
                              priority === p.level ? "currentColor" : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddTask}
                    disabled={!input.trim()}
                    className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- LIST AREA --- */}
          {processedTasks.length === 0 ? (
            <div className="flex-1">
              {/* Thông báo khác nhau tùy ngữ cảnh */}
              <EmptyState
                message={
                  searchQuery
                    ? `No tasks found for "${searchQuery}"`
                    : filter === "active"
                    ? "No active tasks. Good job!"
                    : "No tasks yet. Add one above!"
                }
              />
            </div>
          ) : /* Logic: Chỉ Kéo Thả khi: (Default Sort) VÀ (Xem All) VÀ (Không đang Search) */
          sortBy === "default" && filter === "all" && !searchQuery ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="task-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                  >
                    {processedTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <TaskItem
                              task={task}
                              toggleTask={toggleTask}
                              deleteTask={deleteTask}
                              showToast={showToast}
                              updateTask={updateTask}
                              dragHandleProps={provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                              isDragEnabled={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            // Tắt Drag Drop khi đang Filter/Sort/Search
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {processedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  toggleTask={toggleTask}
                  deleteTask={deleteTask}
                  showToast={showToast}
                  updateTask={updateTask}
                  isDragEnabled={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Component TaskItem giữ nguyên như cũ
const TaskItem = ({
  task,
  toggleTask,
  deleteTask,
  showToast,
  updateTask,
  dragHandleProps,
  isDragging,
  isDragEnabled,
}: {
  task: Task;
  updateTask: any;
  [key: string]: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editDate, setEditDate] = useState<string | undefined>(task.dueDate);
  const [editPriority, setEditPriority] = useState<string | undefined>(
    task.priority
  );
  const editDateRef = useRef<HTMLInputElement>(null);
  const handleSave = () => {
    if (editText.trim()) {
      updateTask(task.id, {
        text: editText,
        dueDate: editDate,
        priority: editPriority as any,
      });
      setIsEditing(false);
      showToast("Task updated successfully", "success", 2000);
    }
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditText(task.text);
    setEditDate(task.dueDate);
    setEditPriority(task.priority);
  };
  const getPriorityColor = (p?: string) => {
    if (p === "high") return "text-red-500";
    if (p === "medium") return "text-orange-400";
    return "hidden";
  };
  const getDueDateLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);

    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";

    // Kiểm tra xem có cùng năm hiện tại không
    if (date.getFullYear() === new Date().getFullYear()) {
      return format(date, "MMM d"); // Cùng năm: "Dec 24"
    }

    return format(date, "MMM d, yyyy"); // Khác năm: "Dec 24, 2026"
  };
  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-indigo-500/50 rounded-lg p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100 cursor-default">
        {" "}
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white border-b border-indigo-500/20 pb-1 mb-2 focus:outline-none focus:border-indigo-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />{" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex gap-2">
            {" "}
            <div className="relative">
              {" "}
              <input
                ref={editDateRef}
                type="date"
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                onChange={(e) => setEditDate(e.target.value)}
                value={editDate || ""}
              />{" "}
              <button
                onClick={() => editDateRef.current?.showPicker()}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  editDate
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30"
                    : "text-slate-400 border-slate-200 dark:border-white/10"
                }`}
              >
                {" "}
                <CalendarIcon size={10} />{" "}
                {editDate ? format(new Date(editDate), "MMM d") : "Date"}{" "}
              </button>{" "}
            </div>{" "}
            <div className="flex bg-slate-100 dark:bg-white/5 rounded p-0.5 gap-0.5">
              {" "}
              {[
                { l: "low", c: "text-slate-400" },
                { l: "medium", c: "text-orange-400" },
                { l: "high", c: "text-red-500" },
              ].map((p: any) => (
                <button
                  key={p.l}
                  onClick={() =>
                    setEditPriority(editPriority === p.l ? undefined : p.l)
                  }
                  className={`p-0.5 rounded ${
                    editPriority === p.l
                      ? "bg-white dark:bg-slate-600 shadow-sm"
                      : ""
                  }`}
                >
                  <Flag
                    size={10}
                    className={p.c}
                    fill={editPriority === p.l ? "currentColor" : "none"}
                  />
                </button>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex gap-1">
            {" "}
            <button
              onClick={handleCancel}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>{" "}
            <button
              onClick={handleSave}
              className="p-1 text-indigo-500 hover:text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
            >
              <Check size={14} />
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
  const dateLabel = getDueDateLabel(task.dueDate);
  return (
    <div
      onClick={() => toggleTask(task.id)}
      className={`group flex items-center gap-3 p-2.5 rounded-lg border border-transparent transition-all cursor-pointer relative ${
        isDragging ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg z-50" : ""
      } ${
        task.done
          ? "opacity-50 hover:opacity-80 bg-transparent"
          : "bg-white hover:bg-slate-100 hover:border-slate-200 hover:shadow-sm dark:bg-slate-800/20 dark:hover:bg-slate-700/30 dark:hover:border-white/5"
      }`}
    >
      {" "}
      {isDragEnabled && (
        <div
          {...dragHandleProps}
          className="text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
        >
          {" "}
          <GripVertical size={14} />{" "}
        </div>
      )}{" "}
      <div
        className={`transition-colors shrink-0 ${
          task.done
            ? "text-indigo-500 dark:text-indigo-400"
            : "text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-300"
        }`}
      >
        {" "}
        {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}{" "}
      </div>{" "}
      <div className="flex-1 min-w-0 flex flex-col">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <span
            className={`text-sm truncate transition-colors ${
              task.done
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {" "}
            {task.text}{" "}
          </span>{" "}
          {task.priority && task.priority !== "low" && !task.done && (
            <Flag
              size={10}
              className={getPriorityColor(task.priority)}
              fill="currentColor"
            />
          )}{" "}
        </div>{" "}
        {dateLabel && !task.done && (
          <div
            className={`text-[9px] flex items-center gap-1 mt-0.5 ${
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              !isToday(new Date(task.dueDate))
                ? "text-red-400"
                : "text-slate-400"
            }`}
          >
            {" "}
            <CalendarIcon size={8} /> {dateLabel}{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {" "}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1.5 rounded transition-all text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:text-slate-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10"
          title="Edit task"
        >
          {" "}
          <Pencil size={14} />{" "}
        </button>{" "}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
            showToast("Task deleted successfully", "success", 2000);
          }}
          className="p-1.5 rounded transition-all text-slate-400 hover:text-red-500 hover:bg-red-100 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-400/10"
          title="Delete task"
        >
          {" "}
          <Trash2 size={14} />{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
};
