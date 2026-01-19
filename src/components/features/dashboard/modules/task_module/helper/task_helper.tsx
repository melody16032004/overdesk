import { Inbox } from "lucide-react";

export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-slate-300 dark:text-slate-700 animate-in fade-in zoom-in duration-300">
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-3">
      <Inbox size={24} strokeWidth={1.5} />
    </div>
    <p className="text-xs font-medium">{message}</p>
  </div>
);
