export type DeviceType = "mobile" | "tablet" | "desktop" | "custom";

export interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  type: DeviceType;
  icon?: any;
}
