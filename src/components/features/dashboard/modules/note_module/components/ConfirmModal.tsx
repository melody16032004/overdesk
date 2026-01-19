import clsx from "clsx";
import { ConfirmModalProps } from "../types/note_type";
import { AlertCircle } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "danger",
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua modal
      >
        <div className="p-5 text-center">
          <div
            className={clsx(
              "mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-500",
              type === "info" &&
                "bg-blue-100 dark:bg-blue-900/30 text-blue-500",
            )}
          >
            <AlertCircle size={24} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {message}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={clsx(
                "px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-all active:scale-95",
                type === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
