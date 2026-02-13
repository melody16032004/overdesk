import { Minus, Plus, CreditCard, Banknote, Briefcase } from "lucide-react";
import { SUGGESTIONS, CATEGORIES } from "../constants/budget_const";

export const AddView = ({
  setType,
  type,
  addViewScrollRef,
  wallets,
  setSelectedWalletId,
  selectedWalletId,
  setShowWalletDrawer,
  amount,
  setAmount,
  category,
  setCategory,
  note,
  setNote,
}: any) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
      <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => setType("expense")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === "expense" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500"}`}
        >
          <Minus size={16} /> Chi tiêu
        </button>
        <button
          onClick={() => setType("income")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500"}`}
        >
          <Plus size={16} /> Thu nhập
        </button>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Chọn Ví
        </label>
        <div
          ref={addViewScrollRef} // Áp dụng scroll ngang
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {wallets.map((w: any) => (
            <button
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`flex-none p-3 min-w-[100px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedWalletId === w.id ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-white/5 border-transparent text-slate-500 opacity-60 hover:opacity-100"}`}
            >
              {w.type === "online" ? (
                <CreditCard size={18} />
              ) : w.type === "cash" ? (
                <Banknote size={18} />
              ) : (
                <Briefcase size={18} />
              )}
              <span className="text-xs font-bold truncate max-w-full">
                {w.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowWalletDrawer(true)}
            className="p-3 rounded-xl border border-dashed border-white/20 text-slate-500 flex items-center justify-center hover:text-white hover:border-white/40 flex-shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Số tiền (VND)
        </label>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-4xl font-mono font-bold text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all placeholder:text-slate-700"
        />

        {/* [MỚI] THANH GỢI Ý MỨC GIÁ */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-hide">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.value}
              onClick={() => setAmount(item.value.toString())}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 hover:border-blue-500/50 transition-all whitespace-nowrap active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {type === "expense" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            Danh mục
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              if (cat.id === "transfer") return;
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${isSelected ? `bg-slate-700 border-slate-500 text-white shadow-lg scale-105` : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300"}`}
                >
                  <Icon
                    size={20}
                    className={`mb-1.5 ${isSelected ? "text-white" : cat.color}`}
                  />
                  <span className="text-[9px] font-bold">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Ghi chú
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Ăn sáng..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
        />
      </div>
    </div>
  );
};
