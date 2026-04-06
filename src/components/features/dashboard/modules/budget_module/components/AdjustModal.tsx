import { X, RefreshCw } from "lucide-react";
import { formatMoney } from "../helpers/budget_help";
// 1. Import Framer Motion
import { motion, Variants } from "framer-motion";

// 2. Định nghĩa Variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const AdjustModal = ({
  setShowAdjustModal,
  setActualMoney,
  setAdjustWalletId,
  wallets,
  walletBalances,
  adjustWalletId,
  actualMoney,
  isValid,
  handleAdjustBalance,
}: any) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      {/* BACKDROP */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={() => {
          setShowAdjustModal(false);
          setActualMoney("");
          setAdjustWalletId("");
        }}
      />

      {/* MODAL CARD */}
      <motion.div
        className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* CLOSE BUTTON */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ rotate: 90 }}
          onClick={() => {
            setShowAdjustModal(false);
            setActualMoney("");
            setAdjustWalletId("");
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </motion.button>

        {/* --- CONTENT CONTAINER (Stagger Effect) --- */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
        >
          {/* HEADER */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cân bằng Số dư
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chọn ví và nhập số tiền thực tế.
            </p>
          </motion.div>

          {/* WALLET SELECTOR (Shared Layout Animation) */}
          <motion.div
            variants={itemVariants}
            className="flex gap-2 mb-4 bg-slate-100 dark:bg-black/40 p-1.5 rounded-xl overflow-x-auto scrollbar-hide" // Sửa ở đây
          >
            {wallets.map((w: any) => {
              const isSelected = adjustWalletId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setAdjustWalletId(w.id)}
                  // Thêm whitespace-nowrap để tên ví không bị xuống dòng
                  // Thêm min-w-fit hoặc flex-shrink-0 để nút không bị bóp méo
                  className={`relative flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors z-0 whitespace-nowrap ${
                    isSelected
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                  }`}
                >
                  {/* Hiệu ứng nền trượt qua lại */}
                  {isSelected && (
                    <motion.div
                      layoutId="adjust-wallet-bg"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm dark:shadow-md -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  {w.name}
                </button>
              );
            })}
          </motion.div>

          <motion.form
            variants={itemVariants}
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdjustBalance();
            }}
          >
            {/* CURRENT BALANCE DISPLAY */}
            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Trên App đang tính:
              </span>
              <motion.span
                // Animation số tiền thay đổi khi đổi ví
                key={adjustWalletId}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono font-bold text-slate-900 dark:text-white"
              >
                {formatMoney(walletBalances[adjustWalletId] || 0)}
              </motion.span>
            </div>

            {/* INPUT FIELD */}
            <motion.input
              type="number"
              min={1000}
              step={500}
              value={actualMoney}
              onChange={(e) => setActualMoney(e.target.value)}
              placeholder="0"
              autoFocus
              whileFocus={{ scale: 1.02 }} // Phóng to nhẹ khi focus
              className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-2xl font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none text-right transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
            />

            {/* CONFIRM BUTTON */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={!isValid}
              onClick={handleAdjustBalance}
              className={`
                w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-colors
                ${
                  !isValid
                    ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-400 shadow-none"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                }
              `}
            >
              Xác nhận
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
};
