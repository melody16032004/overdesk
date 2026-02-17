import {
  Minus,
  Plus,
  CreditCard,
  Banknote,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";
import { SUGGESTIONS, CATEGORIES } from "../constants/budget_const";
// 1. Import Framer Motion
import { motion, Variants } from "framer-motion";

// 2. Định nghĩa các Variants (kịch bản chuyển động)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

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
  editingTransaction,
}: any) => {
  return (
    // Thay div thường bằng motion.div
    <motion.div
      className={`space-y-6 ${editingTransaction ? "pb-28" : "pb-16"}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- 1. LOẠI GIAO DỊCH --- */}
      <motion.div
        variants={itemVariants}
        className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-2xl border border-slate-200 dark:border-white/5"
      >
        <button
          onClick={() => setType("expense")}
          className={`relative flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all z-10 ${
            type === "expense" ? "text-white" : "text-slate-500"
          }`}
        >
          {/* Hiệu ứng nền di chuyển (Optional nâng cao) hoặc giữ nguyên logic cũ */}
          {type === "expense" && (
            <motion.div
              layoutId="type-bg"
              className="absolute inset-0 bg-red-500 rounded-xl shadow-lg shadow-red-500/20 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Minus size={16} /> Chi tiêu
        </button>

        <button
          onClick={() => setType("income")}
          className={`relative flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all z-10 ${
            type === "income" ? "text-white" : "text-slate-500"
          }`}
        >
          {type === "income" && (
            <motion.div
              layoutId="type-bg"
              className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Plus size={16} /> Thu nhập
        </button>
      </motion.div>

      {/* --- 2. CHỌN VÍ --- */}
      <motion.div variants={itemVariants}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Chọn Ví
        </label>
        <div
          ref={addViewScrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {wallets.map((w: any) => (
            <motion.button
              key={w.id}
              whileTap={{ scale: 0.95 }} // Hiệu ứng nhấn xuống
              whileHover={{ scale: 1.05 }} // Hiệu ứng hover
              onClick={() => setSelectedWalletId(w.id)}
              className={`flex-none p-3 min-w-[100px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                selectedWalletId === w.id
                  ? "bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400"
                  : "bg-white dark:bg-white/5 border-slate-200 dark:border-transparent text-slate-500 opacity-80 hover:opacity-100"
              }`}
            >
              {w.type === "online" ? (
                <CreditCard size={18} />
              ) : w.type === "cash" ? (
                <Banknote size={18} />
              ) : (
                <PiggyBank size={18} />
              )}
              <span className="text-xs font-bold truncate max-w-full">
                {w.name}
              </span>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowWalletDrawer(true)}
            className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:text-slate-600 hover:border-slate-400 dark:hover:text-white dark:hover:border-white/40 flex-shrink-0 bg-white dark:bg-transparent"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* --- 3. NHẬP SỐ TIỀN --- */}
      <motion.div variants={itemVariants} className="relative group">
        <div className="flex justify-between items-end mb-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Số tiền (VND)
          </label>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }} // Xuất hiện sau cùng
            className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20"
          >
            <AlertTriangle size={10} />
            <span className="font-medium">Tắt Telex/VNI</span>
          </motion.div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={amount ? Number(amount).toLocaleString("vi-VN") : ""}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/\./g, "");
            if (rawValue === "" || /^\d+$/.test(rawValue)) {
              setAmount(rawValue);
            }
          }}
          onKeyDown={(e) => {
            const allowedKeys = [
              "Backspace",
              "Delete",
              "ArrowLeft",
              "ArrowRight",
              "Tab",
              "Enter",
            ];
            if (
              !/\d/.test(e.key) &&
              !allowedKeys.includes(e.key) &&
              !e.ctrlKey
            ) {
              e.preventDefault();
            }
          }}
          placeholder="0"
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 text-4xl font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:bg-white/10 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm dark:shadow-none"
        />

        {/* GỢI Ý MỨC GIÁ */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-hide">
          {SUGGESTIONS.map((item, index) => (
            <motion.button
              key={item.value}
              // Animation xuất hiện domino cho từng nút nhỏ
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setAmount(item.value.toString())}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500 dark:text-slate-400 hover:bg-white hover:text-blue-600 hover:border-blue-500 dark:hover:text-white dark:hover:bg-white/10 dark:hover:border-blue-500/50 transition-colors whitespace-nowrap shadow-sm dark:shadow-none"
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* --- 4. DANH MỤC --- */}
      {type === "expense" && (
        <motion.div variants={itemVariants}>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            Danh mục
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat, index) => {
              if (cat.id === "transfer") return;
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  // Hiệu ứng domino cho lưới danh mục
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.03 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${
                    isSelected
                      ? `bg-slate-800 border-slate-600 text-white shadow-lg dark:bg-slate-700 dark:border-slate-500`
                      : "bg-white dark:bg-white/5 border-slate-100 dark:border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-300 shadow-sm dark:shadow-none"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mb-1.5 ${
                      isSelected ? "text-white" : cat.color
                    }`}
                  />
                  <span className="text-[9px] font-bold">{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* --- 5. GHI CHÚ --- */}
      <motion.div variants={itemVariants}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Ghi chú
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Ăn sáng..."
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 shadow-sm dark:shadow-none"
        />
      </motion.div>
    </motion.div>
  );
};
