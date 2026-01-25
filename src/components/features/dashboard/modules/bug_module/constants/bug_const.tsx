import { BugData } from "../types/bug_type";

export const TEMPLATES = {
  ui: {
    title: "[UI] Giao diện bị vỡ trên màn hình nhỏ",
    severity: "Low",
    steps:
      "1. Mở trang chủ trên điện thoại (iPhone 12).\n2. Cuộn xuống phần footer.\n3. Quan sát các icon mạng xã hội.",
    expected: "Các icon phải thẳng hàng và cách đều nhau.",
    actual: "Các icon bị chồng chéo lên nhau.",
  },
  api: {
    title: "[API] Lỗi 500 khi gửi form liên hệ",
    severity: "High",
    steps:
      "1. Vào trang Liên hệ.\n2. Điền đầy đủ thông tin hợp lệ.\n3. Bấm nút Gửi.",
    expected: "Hiển thị thông báo thành công và API trả về 200 OK.",
    actual: "Hiển thị thông báo lỗi 'Server Error' và API trả về 500.",
  },
  crash: {
    title: "[CRASH] Ứng dụng bị thoát đột ngột khi upload ảnh",
    severity: "Critical",
    steps: "1. Vào phần Profile.\n2. Bấm đổi Avatar.\n3. Chọn một ảnh > 5MB.",
    expected: "Ảnh được upload hoặc thông báo dung lượng quá lớn.",
    actual: "Ứng dụng bị đơ và tự động thoát (Crash).",
  },
};

export const DEFAULT_DATA: BugData = {
  title: "",
  severity: "Medium",
  steps: "",
  expected: "",
  actual: "",
  env: "",
};
