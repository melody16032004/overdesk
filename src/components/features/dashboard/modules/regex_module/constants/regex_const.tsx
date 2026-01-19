export const REGEX_LIBRARY = [
  {
    label: "Email",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    desc: "Địa chỉ email chuẩn",
  },
  {
    label: "Phone (VN)",
    pattern: "(84|0[3|5|7|8|9])+([0-9]{8})\\b",
    desc: "Số điện thoại Việt Nam",
  },
  {
    label: "Date (DD/MM/YYYY)",
    pattern:
      "\\b(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\\d\\d\\b",
    desc: "Ngày tháng năm",
  },
  {
    label: "URL",
    pattern:
      "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    desc: "Đường dẫn liên kết",
  },
  {
    label: "IPv4",
    pattern:
      "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    desc: "Địa chỉ IP",
  },
  {
    label: "Hex Color",
    pattern: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})",
    desc: "Mã màu Hex",
  },
  {
    label: "Password Strong",
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    desc: "Mật khẩu mạnh",
  },
  {
    label: "Slug",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    desc: "URL slug an toàn",
  },
];
