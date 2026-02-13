import {
  CreditCard,
  Banknote,
  PiggyBank,
  Coffee,
  ShoppingCart,
  Car,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Plane,
  Gamepad2,
  Sparkles,
  Gift,
  Repeat,
} from "lucide-react";
import { WalletItem } from "../types/budget_type";

export const EXCHANGE_RATE = 25450;

export const DEFAULT_WALLETS: WalletItem[] = [
  {
    id: "w_default_1",
    name: "Tiền mặt",
    type: "cash",
    initialBalance: 0,
    color: "text-emerald-400",
  },
  {
    id: "w_default_2",
    name: "Ngân hàng",
    type: "online",
    initialBalance: 0,
    color: "text-blue-400",
  },
];

export const WALLET_TYPES = [
  {
    value: "online",
    label: "Online",
    icon: CreditCard,
    color: "text-blue-400",
  },
  {
    value: "cash",
    label: "Tiền mặt",
    icon: Banknote,
    color: "text-emerald-400",
  },
  {
    value: "savings",
    label: "Tiết kiệm",
    icon: PiggyBank,
    color: "text-purple-400",
  },
];

export const CATEGORIES = [
  {
    id: "food",
    label: "Ăn uống",
    icon: Coffee,
    color: "text-orange-400",
    bg: "bg-orange-500/20 border-orange-500/30",
  },
  {
    id: "shopping",
    label: "Mua sắm",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/30",
  },
  {
    id: "transport",
    label: "Di chuyển",
    icon: Car,
    color: "text-indigo-400",
    bg: "bg-indigo-500/20 border-indigo-500/30",
  },
  {
    id: "bills",
    label: "Hóa đơn",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
  {
    id: "home",
    label: "Nhà cửa",
    icon: Home,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/30",
  },
  {
    id: "health",
    label: "Sức khỏe",
    icon: HeartPulse,
    color: "text-rose-400",
    bg: "bg-rose-500/20 border-rose-500/30",
  },
  {
    id: "edu",
    label: "Giáo dục",
    icon: GraduationCap,
    color: "text-sky-400",
    bg: "bg-sky-500/20 border-sky-500/30",
  },
  {
    id: "travel",
    label: "Du lịch",
    icon: Plane,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20 border-cyan-500/30",
  },
  {
    id: "ent",
    label: "Giải trí",
    icon: Gamepad2,
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/30",
  },
  {
    id: "invest",
    label: "Đầu tư",
    icon: PiggyBank,
    color: "text-green-400",
    bg: "bg-green-500/20 border-green-500/30",
  },
  {
    id: "beauty",
    label: "Làm đẹp",
    icon: Sparkles,
    color: "text-pink-400",
    bg: "bg-pink-500/20 border-pink-500/30",
  },
  {
    id: "other",
    label: "Khác",
    icon: Gift,
    color: "text-slate-400",
    bg: "bg-slate-500/20 border-slate-500/30",
  },
  {
    id: "transfer",
    label: "Chuyển tiền",
    icon: Repeat,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
];

export const SUGGESTIONS = [
  { label: "5k", value: 5000 },
  { label: "10k", value: 10000 },
  { label: "20k", value: 20000 },
  { label: "30k", value: 30000 },
  { label: "50k", value: 50000 },
  { label: "100k", value: 100000 },
  { label: "200k", value: 200000 },
  { label: "500k", value: 500000 },
  { label: "1Tr", value: 1000000 },
];
