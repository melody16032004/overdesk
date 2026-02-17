import { AlertTriangle } from "lucide-react";

export const ConfirmModal = ({ confirmConfig, setConfirmConfig }: any) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 transition-colors">
        <div className="flex flex-col items-center text-center">
          {/* ICON ALERT */}
          <div className="w-12 h-12 bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500 rounded-full flex items-center justify-center mb-3 transition-colors">
            <AlertTriangle size={24} />
          </div>

          {/* TITLE */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors">
            {confirmConfig.title}
          </h3>

          {/* MESSAGE */}
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed transition-colors">
            {confirmConfig.message}
          </p>

          {/* BUTTONS */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() =>
                setConfirmConfig({ ...confirmConfig, isOpen: false })
              }
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={confirmConfig.onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 font-bold text-xs shadow-lg shadow-red-500/20 transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
