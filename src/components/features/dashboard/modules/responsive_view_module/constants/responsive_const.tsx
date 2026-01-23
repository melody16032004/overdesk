import {
  Smartphone,
  SmartphoneNfc,
  Tablet,
  Laptop,
  Monitor,
} from "lucide-react";
import { Device } from "../types/responsive_type";

export const DEFAULT_DEVICES: Device[] = [
  // Phones
  {
    id: "iphone_se",
    name: "iPhone SE",
    width: 375,
    height: 667,
    type: "mobile",
    icon: Smartphone,
  },
  {
    id: "iphone_14",
    name: "iPhone 14",
    width: 390,
    height: 844,
    type: "mobile",
    icon: Smartphone,
  },
  {
    id: "iphone_14_pro",
    name: "iPhone 14 Pro Max",
    width: 430,
    height: 932,
    type: "mobile",
    icon: SmartphoneNfc,
  },
  {
    id: "pixel_7",
    name: "Pixel 7",
    width: 412,
    height: 915,
    type: "mobile",
    icon: Smartphone,
  },

  // Tablets
  {
    id: "ipad_mini",
    name: "iPad Mini",
    width: 768,
    height: 1024,
    type: "tablet",
    icon: Tablet,
  },
  {
    id: "ipad_air",
    name: "iPad Air",
    width: 820,
    height: 1180,
    type: "tablet",
    icon: Tablet,
  },
  {
    id: "ipad_pro",
    name: "iPad Pro 12.9",
    width: 1024,
    height: 1366,
    type: "tablet",
    icon: Tablet,
  },

  // Desktops
  {
    id: "laptop",
    name: "Laptop (1366)",
    width: 1366,
    height: 768,
    type: "desktop",
    icon: Laptop,
  },
  {
    id: "macbook",
    name: "MacBook Pro",
    width: 1512,
    height: 982,
    type: "desktop",
    icon: Laptop,
  },
  {
    id: "desktop_hd",
    name: "Desktop HD",
    width: 1920,
    height: 1080,
    type: "desktop",
    icon: Monitor,
  },
];

export const STORAGE_KEY_CUSTOM = "rv_custom_size";
export const STORAGE_KEY_SAVED_DEVICES = "rv_saved_devices";
export const WEB_URL =
  "https://animehay.bar/xem-phim/tokyo-ghoul-tap-9-2392.html";
