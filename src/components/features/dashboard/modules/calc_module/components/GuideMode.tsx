import { HelpCircle, X } from "lucide-react";
import { GuideItem } from "./GuideItem";

export const GuideMode = ({ setActiveTab }: any) => (
  <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 p-3 flex flex-col backdrop-blur-sm animate-in fade-in zoom-in-95">
    <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-white/10 pb-2">
      <span className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2">
        <HelpCircle size={14} /> Syntax Guide
      </span>
      <button
        onClick={() => setActiveTab("calc")}
        className="text-slate-400 hover:text-red-500"
      >
        <X size={16} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      <GuideItem
        title="Derivative (Đạo hàm)"
        syntax="diff(fx, x)"
        ex="diff(x^2, x) → 2x"
      />
      <GuideItem
        title="Integral (Nguyên hàm)"
        syntax="integrate(fx, x)"
        ex="integrate(2x, x) → x^2"
      />
      <GuideItem
        title="Limit (Giới hạn)"
        syntax="limit(fx, x, val)"
        ex="limit(sin(x)/x, x, 0) → 1"
      />
      <GuideItem
        title="Combinations (Tổ hợp)"
        syntax="nCr(n, k)"
        ex="nCr(5, 2) → 10"
      />
      <GuideItem
        title="Permutations (Chỉnh hợp)"
        syntax="nPr(n, k)"
        ex="nPr(5, 2) → 20"
      />
      <GuideItem
        title="Solve Equation (Tìm x)"
        syntax="eqn"
        ex="x^2 - 4 = 0 (Click =)"
      />
      <GuideItem
        title="Graphing (Vẽ đồ thị)"
        syntax="fx"
        ex="sin(x), x^2, e^x"
      />
    </div>
  </div>
);
