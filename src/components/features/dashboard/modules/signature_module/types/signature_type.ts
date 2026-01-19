export interface SavedSignature {
  id: number;
  dataUrl: string;
  date: string;
  extension: "png" | "jpg";
}

// Định nghĩa kiểu dữ liệu lỏng lẻo để tránh lỗi TS khắt khe
export interface Point {
  x: number;
  y: number;
  time: number;
}
