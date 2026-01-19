export const SQL_TEMPLATES = [
  {
    label: "Select All",
    query: "SELECT * FROM table_name",
    desc: "Lấy tất cả dữ liệu",
  },
  {
    label: "Select Columns",
    query: "SELECT id, name FROM table_name",
    desc: "Lấy cột cụ thể",
  },
  {
    label: "Filter (Where)",
    query: "SELECT * FROM table_name WHERE id = 1",
    desc: "Lọc theo điều kiện",
  },
  {
    label: "Search (Like)",
    query: "SELECT * FROM table_name WHERE name LIKE '%text%'",
    desc: "Tìm kiếm văn bản",
  },
  {
    label: "Sort (Order By)",
    query: "SELECT * FROM table_name ORDER BY id DESC",
    desc: "Sắp xếp dữ liệu",
  },
  {
    label: "Limit",
    query: "SELECT * FROM table_name LIMIT 5",
    desc: "Giới hạn số dòng",
  },
  {
    label: "Insert Row",
    query: "INSERT INTO table_name (name, active) VALUES ('New Item', true)",
    desc: "Thêm dòng mới",
  },
  {
    label: "Update Row",
    query: "UPDATE table_name SET active = false WHERE id = 1",
    desc: "Cập nhật dữ liệu",
  },
  {
    label: "Delete Row",
    query: "DELETE FROM table_name WHERE id = 1",
    desc: "Xóa dữ liệu",
  },
  { label: "Drop Table", query: "DROP TABLE table_name", desc: "Xóa bảng" },
];
