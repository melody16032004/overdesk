import { CalendarEvent } from "../types/calendar_type";

export const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

// Hàm kiểm tra xem sự kiện có diễn ra vào ngày 'targetDateStr' không
export const isEventOccurringOnDate = (
  evt: CalendarEvent,
  targetDateStr: string,
) => {
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
