import { ChevronRight } from "lucide-react";

export const PrivacyItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => (
  <div className="pb-3 border-b border-slate-100 dark:border-white/5 last:border-0">
    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
      <ChevronRight size={12} className="text-slate-400" /> {question}
    </h5>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
      {answer}
    </p>
  </div>
);
