import { Check, ChevronDown, Wallet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { WalletItem } from "../types/budget_type";

export const WalletFilterSelect = ({
  value,
  onChange,
  wallets,
}: {
  value: string;
  onChange: (val: string) => void;
  wallets: WalletItem[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Thêm state lưu vị trí menu
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Xử lý click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // Thêm sự kiện scroll để đóng menu khi cuộn (tránh menu trôi lơ lửng)
    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true); // true để bắt sự kiện scroll ở mọi div
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  // Tính toán vị trí khi mở menu
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // Cách nút bấm 8px
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedLabel =
    value === "all"
      ? "Tất cả ví"
      : wallets.find((w) => w.id === value)?.name || "Chọn ví";

  return (
    <div className="relative min-w-[140px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-purple-500/50 ${isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Wallet size={14} className="text-purple-400 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* MENU DÙNG FIXED POSITION (Thoát khỏi overflow) */}
      {isOpen && (
        // Dùng createPortal nếu có thể, nhưng ở đây dùng fixed trực tiếp cũng ổn cho trường hợp đơn giản
        <div
          className="fixed z-[9999] bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <button
            onClick={() => {
              onChange("all");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors ${value === "all" ? "bg-purple-600/20 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
          >
            <span>Tất cả ví</span>
            {value === "all" && <Check size={12} />}
          </button>

          <div className="h-px bg-white/5 mx-2 my-1"></div>

          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                onChange(w.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors ${value === w.id ? "bg-purple-600/20 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${w.color.replace("text-", "bg-")}`}
                ></div>
                <span className="truncate">{w.name}</span>
              </div>
              {value === w.id && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
