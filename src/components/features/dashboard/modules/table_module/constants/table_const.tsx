export const TEMPLATES = {
  pricing: {
    headers: ["Gói dịch vụ", "Giá / Tháng", "Dung lượng", "Hỗ trợ"],
    rows: [
      ["Basic", "99k", "10GB", "Email"],
      ["Pro", "199k", "50GB", "24/7"],
      ["Enterprise", "Liên hệ", "Không giới hạn", "VIP Agent"],
    ],
  },
  schedule: {
    headers: ["Thời gian", "Thứ 2", "Thứ 4", "Thứ 6"],
    rows: [
      ["08:00 - 10:00", "Họp team", "Code Review", "Training"],
      ["10:00 - 12:00", "Dev Feature A", "Fix Bug", "Dev Feature B"],
      ["13:30 - 17:00", "Deploy", "Meeting Client", "Report"],
    ],
  },
  users: {
    headers: ["ID", "Họ tên", "Email", "Trạng thái"],
    rows: [
      ["#001", "Nguyễn Văn A", "a@gmail.com", "Active"],
      ["#002", "Trần Thị B", "b@hotmail.com", "Pending"],
      ["#003", "Lê Văn C", "c@yahoo.com", "Banned"],
    ],
  },
};
