import { Loader2, Check, Copy } from "lucide-react";

export const OutputArea = ({
  isLoading,
  translated,
  handleCopy,
  copied,
}: any) => (
  <div className="flex-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-indigo-100 dark:border-white/5 flex flex-col relative">
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    ) : (
      <textarea
        className="w-full h-full bg-transparent resize-none outline-none text-sm font-medium text-indigo-700 dark:text-indigo-300"
        placeholder="Translation..."
        value={translated}
        readOnly
      />
    )}

    <div className="absolute bottom-2 right-2">
      <button
        onClick={handleCopy}
        disabled={!translated}
        className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-indigo-400 transition-colors"
        title="Copy Result"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  </div>
);
