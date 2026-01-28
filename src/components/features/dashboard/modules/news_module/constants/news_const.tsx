import {
  Clock,
  Globe,
  TrendingUp,
  Cpu,
  Award,
  Tv,
  BookOpen,
} from "lucide-react";
import { Activity } from "react";

export const CATEGORIES = [
  { id: "tin-moi-nhat", label: "Mới nhất", icon: Clock },
  { id: "the-gioi", label: "Thế giới", icon: Globe },
  { id: "kinh-doanh", label: "Kinh doanh", icon: TrendingUp },
  { id: "so-hoa", label: "Công nghệ", icon: Cpu },
  { id: "the-thao", label: "Thể thao", icon: Award },
  { id: "giai-tri", label: "Giải trí", icon: Tv },
  { id: "suc-khoe", label: "Sức khỏe", icon: Activity },
  { id: "giao-duc", label: "Giáo dục", icon: BookOpen },
];
