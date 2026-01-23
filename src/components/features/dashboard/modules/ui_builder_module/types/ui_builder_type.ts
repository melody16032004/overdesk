export type ComponentType =
  | "button"
  | "input"
  | "card"
  | "badge"
  | "alert"
  | "custom";
export type Size = "xs" | "sm" | "md" | "lg" | "xl";
export type Radius = "none" | "sm" | "md" | "lg" | "full";
export type Shadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";
export type LayoutMode = "horizontal" | "vertical";

export interface ComponentConfig {
  id: string;
  name: string;
  type: ComponentType;
  text: string;
  color: string;
  variant: "solid" | "outline" | "ghost" | "soft";
  size: Size;
  radius: Radius;
  shadow: Shadow;
  fullWidth: boolean;
  withIcon: boolean;
  disabled: boolean;
  customCode?: string;
  customClasses?: string;
}
