import { Email } from "../types/mail_type";

export const MOCK_EMAILS: Email[] = [
  {
    id: "1",
    sender: "Google Security",
    email: "no-reply@accounts.google.com",
    subject: "Cảnh báo bảo mật: Đăng nhập mới trên thiết bị lạ",
    preview: "Chúng tôi phát hiện một lần đăng nhập mới vào tài khoản...",
    body: "<p>Xin chào,</p><p>Chúng tôi phát hiện thiết bị lạ đăng nhập vào tài khoản của bạn tại <b>Hà Nội, Việt Nam</b>.</p><p>Nếu không phải là bạn, vui lòng đổi mật khẩu ngay.</p>",
    date: "2024-01-26T08:30:00",
    read: false,
    starred: true,
    folder: "inbox",
    avatarColor: "bg-red-500",
  },
  {
    id: "2",
    sender: "Github",
    email: "notifications@github.com",
    subject: "[OverDesk] Workflow run failed",
    preview: "Your workflow 'Build & Deploy' failed on branch main...",
    body: "<p>Hey Melody,</p><p>Your workflow run failed.</p><p>Check the logs for more details.</p>",
    date: "2024-01-25T14:15:00",
    read: true,
    starred: false,
    folder: "inbox",
    avatarColor: "bg-slate-700",
  },
  {
    id: "3",
    sender: "Melody",
    email: "melody@dev.com",
    subject: "Gửi sếp: Báo cáo tiến độ dự án",
    preview: "Em gửi anh báo cáo tuần này ạ...",
    body: "<p>Chào anh,</p><p>File đính kèm là báo cáo tiến độ tuần qua. Mọi thứ vẫn đang đúng tiến độ (On track).</p>",
    date: "2024-01-24T09:00:00",
    read: true,
    starred: false,
    folder: "sent",
    avatarColor: "bg-indigo-500",
  },
  // Thêm dữ liệu tùy ý...
];
