import {
  Wallet,
  Plus,
  CreditCard,
  Banknote,
  PiggyBank,
  Check,
  RefreshCw,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { formatMoney } from "../helpers/budget_help";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.1,
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

export const TransactionView = ({
  wallets,
  setShowWalletDrawer,
  transferFromRef,
  walletBalances,
  transferFromId,
  transferToId,
  setTransferFromId,
  handleSwapWallets,
  transferToRef,
  setTransferToId,
  transferAmount,
  setTransferAmount,
  transferNote,
  setTransferNote,
}: any) => {
  return (
    <motion.div
      className="h-full flex flex-col relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {wallets.length < 2 ? (
        // --- TRƯỜNG HỢP KHÔNG ĐỦ VÍ ---
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center h-full text-center p-8 pb-20"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Wallet size={40} className="text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            Cần thêm ví
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-[200px] mb-6">
            Bạn cần ít nhất 2 ví để thực hiện chuyển tiền qua lại.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWalletDrawer(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors"
          >
            <Plus size={18} className="inline mr-2" /> Tạo ví mới
          </motion.button>
        </motion.div>
      ) : (
        // --- GIAO DIỆN CHUYỂN TIỀN (CONTENT ONLY) ---
        <div>
          {/* Quan trọng: Padding đáy để nội dung không bị nút che */}
          {/* CONTAINER BỌC NGUỒN & ĐÍCH */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-4 relative overflow-hidden transition-colors shadow-sm dark:shadow-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent border-r border-dashed border-slate-300/30 dark:border-slate-600/30 pointer-events-none hidden sm:block"></div>

            <div className="flex flex-col gap-6 relative z-10">
              {/* 1. NGUỒN TIỀN */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Nguồn tiền (Từ)
                  </label>
                </div>

                <div
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                  ref={transferFromRef}
                >
                  {wallets
                    .filter((w: any) => (walletBalances[w.id] || 0) > 0)
                    .map((w: any) => {
                      const isSelected = transferFromId === w.id;
                      const isDisabled = w.id === transferToId;
                      return (
                        <motion.button
                          key={w.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTransferFromId(w.id)}
                          disabled={isDisabled}
                          className={`
                            relative flex-shrink-0 w-[130px] p-3 rounded-2xl border transition-colors duration-300 text-left
                            ${
                              isSelected
                                ? "bg-blue-50 border-blue-500 dark:bg-blue-600/20 shadow-lg shadow-blue-500/10"
                                : "bg-slate-50 dark:bg-black/20 border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                            }
                            ${
                              isDisabled
                                ? "opacity-30 grayscale cursor-not-allowed"
                                : "pointer"
                            }
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-500 text-white" : "bg-white dark:bg-white/10 text-slate-400 dark:text-slate-400"}`}
                            >
                              {w.type === "online" ? (
                                <CreditCard size={14} />
                              ) : w.type === "cash" ? (
                                <Banknote size={14} />
                              ) : (
                                <PiggyBank size={14} />
                              )}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Check
                                  size={14}
                                  className="text-blue-600 dark:text-blue-400"
                                />
                              </motion.div>
                            )}
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase truncate mb-0.5 ${isSelected ? "text-blue-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            {w.name}
                          </div>
                          <div
                            className={`text-xs font-mono font-bold truncate ${isSelected ? "text-blue-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-300"}`}
                          >
                            {formatMoney(walletBalances[w.id] || 0)}
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </div>

              {/* SWAP BUTTON */}
              <div className="relative h-4 flex items-center justify-center">
                <div className="absolute w-full h-px bg-slate-200 dark:bg-white/5"></div>
                <motion.button
                  whileTap={{ rotate: 180, scale: 0.9 }}
                  onClick={handleSwapWallets}
                  className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 dark:hover:text-white hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-600/20 transition-colors flex items-center justify-center shadow-md dark:shadow-lg"
                >
                  <RefreshCw size={14} />
                </motion.button>
              </div>

              {/* 2. ĐÍCH ĐẾN */}
              <div>
                <div className="flex items-center justify-end gap-2 mb-3">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Đích đến (Vào)
                  </label>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>

                <div
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-row-reverse"
                  ref={transferToRef}
                >
                  {wallets.map((w: any) => {
                    const isSelected = transferToId === w.id;
                    const isDisabled = w.id === transferFromId;
                    return (
                      <motion.button
                        key={w.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTransferToId(w.id)}
                        disabled={isDisabled}
                        className={`
                            relative flex-shrink-0 w-[130px] p-3 rounded-2xl border transition-colors duration-300 text-left
                            ${isSelected ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-500/20 shadow-lg shadow-emerald-500/10" : "bg-slate-50 dark:bg-black/20 border-transparent hover:bg-slate-100 dark:hover:bg-white/5"}
                            ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "pointer"}
                          `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div
                            className={`p-1.5 rounded-lg ${isSelected ? "bg-emerald-500 text-white" : "bg-white dark:bg-white/10 text-slate-400 dark:text-slate-400"}`}
                          >
                            {w.type === "online" ? (
                              <CreditCard size={14} />
                            ) : (
                              <Banknote size={14} />
                            )}
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check
                                size={14}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                            </motion.div>
                          )}
                        </div>
                        <div
                          className={`text-[10px] font-bold uppercase truncate mb-0.5 ${isSelected ? "text-emerald-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {w.name}
                        </div>
                        <div
                          className={`text-xs font-mono font-bold truncate ${isSelected ? "text-emerald-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-300"}`}
                        >
                          {formatMoney(walletBalances[w.id] || 0)}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
          {/* 3. INPUT AREA */}
          <motion.div variants={itemVariants} className="mt-4 space-y-4">
            <div className="bg-slate-50 dark:bg-black/20 rounded-3xl p-1 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-white/5 rounded-[20px] p-4 relative shadow-sm dark:shadow-none transition-colors">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase block mb-1">
                  Số tiền chuyển
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={transferAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentBalance = walletBalances[transferFromId] || 0;

                    // Logic chặn nhập liệu:
                    // 1. Cho phép xóa trắng ô input (val === "")
                    // 2. Chỉ cập nhật nếu giá trị nhập vào <= Số dư hiện tại
                    if (val === "" || parseFloat(val) <= currentBalance) {
                      setTransferAmount(val);
                    }
                    // Nếu nhập số lớn hơn currentBalance, hàm setTransferAmount sẽ KHÔNG chạy
                    // => Giá trị input sẽ giữ nguyên số cũ (React State không đổi)
                  }}
                  placeholder="0.000"
                  className="w-full bg-transparent text-2xl font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
                <span className="text-xs font-bold text-slate-400 dark:text-slate-600 mt-1 block">
                  VND
                </span>
              </div>
              <div className="flex justify-center items-center my-1.5">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }} // Xuất hiện sau cùng
                  className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20"
                >
                  <AlertTriangle size={10} />
                  <span className="font-medium">Tắt Telex/VNI để nhập</span>
                </motion.div>
              </div>
              <div className="flex gap-1 overflow-x-auto p-2 scrollbar-hide justify-center">
                {[
                  50000, 100000, 200000, 500000, 1000000, 5000000, 10000000,
                ].map((val, idx) => {
                  // 1. Tính toán logic disable
                  const currentBalance = walletBalances[transferFromId] || 0;
                  const isDisabled = val > currentBalance;

                  return (
                    <motion.button
                      key={val}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      whileTap={isDisabled ? {} : { scale: 0.9 }} // Không scale khi disable
                      // 2. Set thuộc tính disable
                      disabled={isDisabled}
                      onClick={() => setTransferAmount(val.toString())}
                      className={`
                        px-3 py-1.5 rounded-xl border text-[10px] font-mono transition-colors flex-shrink-0
                        ${
                          isDisabled
                            ? // Style khi Disabled: Mờ đi, chữ xám nhạt, không cho bấm
                              "bg-slate-100 dark:bg-white/5 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
                            : // Style khi Active: Nền trắng/tối, hover xanh, bóng đổ
                              "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white cursor-pointer shadow-sm dark:shadow-none"
                        }
                      `}
                    >
                      {val >= 1000000 ? val / 1000000 + "Tr" : val / 1000 + "k"}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500">
                <Edit3 size={16} />
              </div>
              <input
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Nội dung chuyển tiền (tùy chọn)..."
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-white/10 shadow-sm dark:shadow-none"
              />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
