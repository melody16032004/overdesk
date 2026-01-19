import { format, isToday, isTomorrow } from "date-fns";
import {
  CalendarIcon,
  Flag,
  X,
  Check,
  GripVertical,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, useRef } from "react";
import { Task } from "../../../../../../stores/useDataStore";

export const TaskItem = ({
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
    task.priority,
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
