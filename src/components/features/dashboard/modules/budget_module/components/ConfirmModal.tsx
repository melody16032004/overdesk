import { AlertTriangle } from "lucide-react";

export const ConfirmModal = ({ confirmConfig, setConfirmConfig }: any) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-[#1e293b] border border-white/10 rounded-2xl p-5 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {confirmConfig.title}
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {confirmConfig.message}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() =>
                setConfirmConfig({ ...confirmConfig, isOpen: false })
              }
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={confirmConfig.onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
