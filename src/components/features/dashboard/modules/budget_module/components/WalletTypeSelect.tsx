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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
        w-full flex items-center justify-between 
        px-3 py-2 rounded-lg text-xs transition-colors border
        bg-slate-50 dark:bg-white/5 
        border-slate-200 dark:border-white/10 
        hover:bg-slate-100 dark:hover:bg-white/10
    `}
      >
        <div className="flex items-center gap-2">
          {/* Icon giữ nguyên class màu từ props, thường các màu này hiển thị tốt trên cả 2 nền */}
          <selected.icon size={14} className={selected.color} />
          <span className="text-slate-700 dark:text-white font-medium">
            {selected.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {WALLET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                onChange(type.value as WalletType);
                setIsOpen(false);
              }}
              className={`
              w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors
              text-slate-600 hover:text-slate-900 hover:bg-slate-50
              dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5
          `}
            >
              <type.icon size={14} className={type.color} />
              <span className="flex-1">{type.label}</span>
              {value === type.value && (
                <Check
                  size={12}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
