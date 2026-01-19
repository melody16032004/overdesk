export type RepeatType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (Ngày bắt đầu)
  type: "event" | "task";
  repeat?: RepeatType; // Thêm trường này
  color: string;
  desc?: string;
  completed?: boolean;
}
