import { RefreshCw } from "lucide-react";

export const TextUrlTab = ({
  activeType,
  textInput,
  setTextInput,
  generateRandom,
}: any) => (
  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase">
      Content
    </label>
    <textarea
      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 h-24 resize-none"
      placeholder={
        activeType === "url" ? "https://example.com" : "Type something..."
      }
      value={textInput}
      onChange={(e) => setTextInput(e.target.value)}
    />
    <button
      onClick={generateRandom}
      className="text-xs flex items-center gap-1 text-indigo-500 hover:underline"
    >
      <RefreshCw size={12} /> Generate Random String
    </button>
  </div>
);
