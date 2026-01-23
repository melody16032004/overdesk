export type ActiveElement = {
  id: number;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  scale: number;
};

// Kiểu dữ liệu ảnh trong Gallery
export type GalleryItem = {
  id: number;
  data: string; // Base64 string
};
