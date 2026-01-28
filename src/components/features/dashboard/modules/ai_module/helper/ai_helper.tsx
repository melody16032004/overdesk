import { Copy } from "lucide-react";

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

export const renderContent = (content: string) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const match = part.match(/```(\w*)?([\s\S]*?)```/);
      const lang = match ? match[1] : "";
      const code = match ? match[2].trim() : part.slice(3, -3).trim();
      return (
        <div
          key={index}
          className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117]"
        >
          <div className="flex justify-between items-center px-3 py-1.5 bg-slate-800 border-b border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono uppercase">
              {lang || "CODE"}
            </span>
            <button
              onClick={() => copyToClipboard(code)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
            >
              <Copy size={10} /> Copy
            </button>
          </div>
          <pre className="p-3 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed custom-scrollbar">
            <code>{code}</code>
          </pre>
        </div>
      );
    } else {
      return (
        <div key={index} className="whitespace-pre-wrap font-sans">
          {part.split(/(\*\*.*?\*\*)/g).map((s, i) =>
            s.startsWith("**") ? (
              <strong key={i} className="text-indigo-200">
                {s.slice(2, -2)}
              </strong>
            ) : (
              s
            ),
          )}
        </div>
      );
    }
  });
};
