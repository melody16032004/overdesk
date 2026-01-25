import { MinusCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { TestStatus } from "../types/testcase_type";

export const STATUS_CONFIG: Record<
  TestStatus,
  { label: string; color: string; icon: any }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-400 bg-slate-800",
    icon: MinusCircle,
  },
  passed: {
    label: "Passed",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    icon: XCircle,
  },
  blocked: {
    label: "Blocked",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: AlertCircle,
  },
};

export const PRIORITY_COLORS = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-rose-500 font-bold",
};
