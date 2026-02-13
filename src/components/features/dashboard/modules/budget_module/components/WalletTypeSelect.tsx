import { useEffect, useRef, useState } from "react";
import { WalletType } from "../types/budget_type";
import { WALLET_TYPES } from "../constants/budget_const";
import { Check, ChevronDown } from "lucide-react";

export const WalletTypeSelect = ({
  value,
  onChange,
}: {
  value: WalletType;
  onChange: (val: WalletType) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected =
    WALLET_TYPES.find((t) => t.value === value) || WALLET_TYPES[0];

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <selected.icon size={14} className={selected.color} />
          <span className="text-white">{selected.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {WALLET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                onChange(type.value as WalletType);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 text-slate-300 hover:text-white text-left"
            >
              <type.icon size={14} className={type.color} />
              <span className="flex-1">{type.label}</span>
              {value === type.value && (
                <Check size={12} className="text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
