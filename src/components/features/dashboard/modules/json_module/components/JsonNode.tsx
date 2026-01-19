import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export const JsonNode = ({
  name,
  value,
  isLast,
}: {
  name?: string;
  value: any;
  isLast: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;

  if (!isObject) {
    let valColor = "text-emerald-400";
    if (typeof value === "number") valColor = "text-orange-400";
    if (typeof value === "boolean") valColor = "text-rose-400";
    if (value === null) valColor = "text-slate-500";

    return (
      <div className="pl-4 font-mono text-sm leading-6 hover:bg-white/5 rounded">
        {name && <span className="text-purple-400">"{name}"</span>}
        <span className="text-slate-400">: </span>
        <span className={valColor}>{JSON.stringify(value)}</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  return (
    <div className="pl-4 font-mono text-sm leading-6">
      <div
        className="flex items-center gap-1 hover:bg-white/5 rounded cursor-pointer select-none"
        onClick={() => !isEmpty && setIsOpen(!isOpen)}
      >
        {isEmpty ? (
          <div className="w-4" />
        ) : isOpen ? (
          <ChevronDown size={14} className="text-slate-500" />
        ) : (
          <ChevronRight size={14} className="text-slate-500" />
        )}
        {name && <span className="text-purple-400">"{name}"</span>}
        <span className="text-slate-400">: </span>
        <span className="text-yellow-500">{isArray ? "[" : "{"}</span>
        {!isOpen && <span className="text-slate-600 text-xs px-1">...</span>}
        {!isOpen && (
          <span className="text-yellow-500">{isArray ? "]" : "}"}</span>
        )}
        {!isOpen && !isLast && <span className="text-slate-500">,</span>}
        {isArray && isOpen && (
          <span className="text-slate-600 text-xs ml-2">
            size: {value.length}
          </span>
        )}
      </div>

      {isOpen && !isEmpty && (
        <div className="border-l border-slate-700 ml-2">
          {Object.entries(value).map(([key, val], idx, arr) => (
            <JsonNode
              key={key}
              name={isArray ? undefined : key}
              value={val}
              isLast={idx === arr.length - 1}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div className="pl-6">
          <span className="text-yellow-500">{isArray ? "]" : "}"}</span>
          {!isLast && <span className="text-slate-500">,</span>}
        </div>
      )}
    </div>
  );
};
