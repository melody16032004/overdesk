export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RouteInfo {
  geometry: [number, number][]; // Mảng tọa độ [lat, lng]
  distance: number; // mét
  duration: number; // giây
  summary: string; // <--- THÊM TRƯỜNG NÀY (Tên tuyến đường)
  isAlternative: boolean;
}
