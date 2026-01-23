import { icons } from "lucide-react";

export type IconName = keyof typeof icons;
export type Tab = "all" | "favorites" | "history";
export type CodeMode = "react" | "web";

export interface IconProps {
  size: number;
  strokeWidth: number;
  color: string;
}

export interface DetailContentProps {
  iconName: IconName | null;
  customProps: IconProps;
  setCustomProps: React.Dispatch<React.SetStateAction<IconProps>>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onReset: () => void;
}
