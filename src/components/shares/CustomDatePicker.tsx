import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

export const CustomDatePicker = ({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // State hiển thị text trong ô input (định dạng VN: DD/MM/YYYY)
  const [inputValue, setInputValue] = useState("");

  // State để điều khiển lịch (tháng/năm đang xem)
  const [viewDate, setViewDate] = useState(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  // --- HELPER FORMAT DATE ---
  // Chuyển YYYY-MM-DD -> DD/MM/YYYY để hiển thị
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  // Sync state khi props value thay đổi từ bên ngoài
  useEffect(() => {
    if (value) {
      setInputValue(formatDisplayDate(value));
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        setViewDate(dateObj);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Đóng lịch khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Khi đóng, nếu input đang rác -> reset về value gốc
        if (value) setInputValue(formatDisplayDate(value));
        else setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // --- LOGIC LỊCH ---
  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );
  };

  const selectDate = (year: number, month: number, day: number) => {
    // Format YYYY-MM-DD chuẩn ISO để gửi ra ngoài
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setInputValue(formatDisplayDate(dateStr));
    setIsOpen(false);
  };

  const handleSelectDay = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    selectDate(year, month, day);
  };

  const handleJumpToday = () => {
    const today = new Date();
    selectDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    setViewDate(today); // Nhảy view về tháng hiện tại
  };

  // --- XỬ LÝ NHẬP TAY (MANUAL INPUT) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Regex check format DD/MM/YYYY
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = val.match(regex);

    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);

      // Validate ngày hợp lệ
      const dateObj = new Date(y, m - 1, d);
      if (
        dateObj.getFullYear() === y &&
        dateObj.getMonth() === m - 1 &&
        dateObj.getDate() === d
      ) {
        // Nếu ngày hợp lệ -> Update ngay lập tức mà không cần đóng lịch
        const isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        onChange(isoDate);
        setViewDate(dateObj); // Nhảy lịch tới ngày vừa nhập
      }
    } else if (val === "") {
      onChange(""); // Cho phép xóa trắng
    }
  };

  const renderCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const cells = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= daysCount; d++) {
      const currentStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSelected = value === currentStr;

      const today = new Date();
      const isToday =
        today.getDate() === d &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      cells.push(
        <button
          key={d}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectDay(d);
          }}
          className={`h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all
            ${
              isSelected
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-300 hover:bg-[#3e3e42] hover:text-white"
            }
            ${!isSelected && isToday ? "border border-blue-500/50 text-blue-400" : ""}
          `}
        >
          {d}
        </button>,
      );
    }
    return cells;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* TRIGGER AREA */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1 h-[28px] w-[130px]
          bg-[#1e1e1e] border border-[#3e3e42] rounded-lg transition-all
          ${isOpen ? "ring-1 ring-blue-500 border-blue-500" : "hover:bg-[#2a2a2a]"}
        `}
      >
        <CalendarIcon size={12} className="text-slate-400 shrink-0" />

        {/* INPUT CHO PHÉP NHẬP TAY */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none min-w-0"
        />

        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setInputValue("");
            }}
            className="p-0.5 rounded-full hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* POPUP DROPDOWN */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl p-3 w-[280px] animate-in fade-in zoom-in-95 duration-200 origin-top-left flex flex-col gap-2">
          {/* Header: Month/Year + Nav */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-200">
              {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="h-8 w-8 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">{renderCalendarGrid()}</div>

          {/* [NEW] FOOTER: TODAY BUTTON */}
          <div className="pt-2 border-t border-[#3e3e42] mt-1">
            <button
              onClick={handleJumpToday}
              className="w-full py-1.5 text-xs font-bold text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors bg-blue-500/10"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
