import { CheckCircle2 } from "lucide-react";

export const Toast = ({ msg }: { msg: string }) => {
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 right-5 bg-slate-800 text-white px-4 py-3 rounded shadow-lg z-[9999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 size={16} className="text-green-400" /> {msg}
    </div>
  );
};
