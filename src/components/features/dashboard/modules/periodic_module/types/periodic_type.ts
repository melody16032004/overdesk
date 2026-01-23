export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  xpos: number;
  ypos: number;
  melt?: number | null; // Nhiệt độ nóng chảy (Kelvin)
  boil?: number | null; // Nhiệt độ sôi (Kelvin)
  density?: number | null;
  summary: string;
  electron_configuration?: string;
}
