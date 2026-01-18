import { useToastStore, ToastType } from '../../stores/useToastStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

// Icon mapping cho từng loại thông báo
const icons = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <AlertCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-indigo-500" />,
};

const borderColors = {
  success: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-900/20',
  error: 'border-red-500/20 bg-red-50/90 dark:bg-red-900/20',
  warning: 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-900/20',
  info: 'border-indigo-500/20 bg-indigo-50/90 dark:bg-indigo-900/20',
};

export const ToastSystem = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    // Container cố định ở góc dưới cùng, đè lên mọi thứ (z-50)
    <div className="fixed bottom-4 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Component con hiển thị từng thẻ Toast
const ToastItem = ({ toast, onRemove }: { toast: any; onRemove: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Hiệu ứng Fade In khi mới xuất hiện
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform
        max-w-xs w-full
        ${borderColors[toast.type as ToastType]}
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
      `}
    >
      {/* Icon */}
      <div className="shrink-0">
        {icons[toast.type as ToastType]}
      </div>

      {/* Message */}
      <div className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
        {toast.message}
      </div>

      {/* Close Button */}
      <button 
        onClick={onRemove}
        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};