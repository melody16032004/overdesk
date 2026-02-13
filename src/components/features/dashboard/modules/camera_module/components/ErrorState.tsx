import { AlertCircle } from "lucide-react";

export const ErrorState = ({ error, startCamera }: any) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 p-6 text-center">
      <AlertCircle size={40} className="mb-2 opacity-50" />
      <span className="font-bold mb-2">Error</span>
      <span className="text-xs mb-4">{error}</span>
      <button
        onClick={startCamera}
        className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold"
      >
        Retry
      </button>
    </div>
  );
};
