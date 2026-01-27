export interface Email {
  id: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  body: string; // Nội dung HTML hoặc text
  date: string;
  read: boolean;
  starred: boolean;
  folder: "inbox" | "sent" | "trash" | "spam";
  avatarColor?: string; // Màu avatar ngẫu nhiên
}

export type MailFolder = "inbox" | "sent" | "trash" | "spam";
