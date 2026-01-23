import { Check, Copy } from "lucide-react";

export const CopyButton = ({
  label,
  code,
  onCopy,
  isCopied,
  color,
  Icon = Copy,
}: any) => (
  <button
    onClick={onCopy}
    className="w-full text-left bg-[#252526] hover:bg-[#2d2d2d] border border-[#3e3e42] rounded-lg p-3 group transition-all"
  >
    <div className="flex justify-between items-center mb-1">
      <span className={`text-[10px] font-bold ${color}`}>{label}</span>
      {isCopied ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <Icon
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
        />
      )}
    </div>
    <code className="text-[10px] font-mono text-slate-300 break-all block truncate">
      {code}
    </code>
  </button>
);
