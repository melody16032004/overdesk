import { Radius, Shadow, Size } from "../types/ui_builder_type";

export const COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
export const SIZES: Record<Size, string> = {
  xs: "p-2 text-xs",
  sm: "p-3 text-sm",
  md: "p-4 text-base",
  lg: "p-6 text-lg",
  xl: "p-8 text-xl",
};
export const ELEMENT_SIZES: Record<Size, string> = {
  xs: "px-2.5 py-1.5 text-xs",
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
  xl: "px-6 py-3.5 text-lg",
};
export const RADIUS: Record<Radius, string> = {
  none: "rounded-none",
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};
export const SHADOWS: Record<Shadow, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow",
  lg: "shadow-md",
  xl: "shadow-lg",
  "2xl": "shadow-xl",
  inner: "shadow-inner",
};
export const STORAGE_KEY = "ui_builder_library";
