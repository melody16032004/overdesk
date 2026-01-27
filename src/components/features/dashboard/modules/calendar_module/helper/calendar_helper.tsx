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

export const countTomorrowEvents = (): number => {
  try {
    const localEvents = JSON.parse(
      localStorage.getItem("dashboard_calendar_events") || "[]",
    );
    const tasksRaw = JSON.parse(
      localStorage.getItem("dashboard_tasks") || "[]",
    );

    // --- FIX LOGIC NGÀY MAI THEO GIỜ ĐỊA PHƯƠNG ---
    const d = new Date();

    // 1. Cộng 1 ngày vào thời gian hiện tại của máy tính
    d.setDate(d.getDate() + 1);

    // 2. Tự format thành chuỗi YYYY-MM-DD để giữ nguyên ngày địa phương
    // (Không dùng toISOString vì nó sẽ convert ngược về UTC gây lệch ngày)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const day = String(d.getDate()).padStart(2, "0");

    const tomorrowStr = `${year}-${month}-${day}`;
    // Kết quả sẽ là "2026-01-28" bất kể bạn đang ở múi giờ nào
    // -----------------------------------------------

    // Đếm Event
    const eventCount = localEvents.filter((e: any) => {
      // Cắt chuỗi nếu dữ liệu lưu dạng ISO đầy đủ
      const eventDate = e.date.includes("T") ? e.date.split("T")[0] : e.date;
      return eventDate === tomorrowStr;
    }).length;

    // Đếm Task (deadline ngày mai và chưa xong)
    const taskCount = tasksRaw.filter((t: any) => {
      const taskDate = t.dueDate.includes("T")
        ? t.dueDate.split("T")[0]
        : t.dueDate;
      return taskDate === tomorrowStr && !t.done;
    }).length;

    return eventCount + taskCount;
  } catch (e) {
    console.error("Lỗi đếm task/event:", e);
    return 0;
  }
};
