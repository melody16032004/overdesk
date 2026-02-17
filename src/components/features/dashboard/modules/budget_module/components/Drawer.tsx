import {
  Wallet,
  X,
  CreditCard,
  Banknote,
  PiggyBank,
  Edit3,
  Trash2,
} from "lucide-react";
import { WALLET_TYPES } from "../constants/budget_const";
import { formatMoney } from "../helpers/budget_help";
import { WalletTypeSelect } from "./WalletTypeSelect";
import { motion, AnimatePresence, Variants } from "framer-motion";

// --- VARIANTS ĐƯỢC TỐI ƯU ---

// 1. Backdrop: Mờ dần khi mở/đóng
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// 2. Drawer Panel: Trượt từ phải sang
const drawerVariants: Variants = {
  hidden: { x: "100%" }, // Bắt đầu ở ngoài màn hình bên phải
  visible: {
    x: 0, // Trượt vào vị trí 0
    transition: { type: "spring", stiffness: 300, damping: 30 }, // Hiệu ứng lò xo khi mở
  },
  exit: {
    x: "100%", // Trượt ra lại bên phải
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 }, // Hiệu ứng trượt êm khi đóng
  },
};

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }, // Khi item bị xóa
};

export const Drawer = ({
  setShowWalletDrawer,
  setShowAdjustModal,
  setWName,
  setWInitial,
  setWType,
  setEditingWallet,
  walletDetails,
  handleEditWalletBtn,
  handleDeleteWallet,
  editingWallet,
  wName,
  wType,
  wInitial,
  handleCancelEditWallet,
  isValidInit,
  handleSaveWallet,
}: any) => {
  // Hàm đóng Drawer
  const closeDrawer = () => {
    setShowWalletDrawer(false);
    setShowAdjustModal(false);
    setWName("");
    setWInitial("");
    setWType("online");
    setEditingWallet(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden pointer-events-none">
      {/* pointer-events-none ở cha để click xuyên qua nếu drawer chưa full, 
         nhưng con phải pointer-events-auto 
      */}

      {/* BACKDROP */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={closeDrawer}
      ></motion.div>

      {/* DRAWER CONTAINER (Để canh phải) */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        {/* DRAWER CONTENT PANEL */}
        <motion.div
          className="w-96 max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 h-full shadow-2xl flex flex-col pointer-events-auto"
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* HEADER */}
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Wallet size={16} /> Quản lý Ví
            </h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={closeDrawer}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-slate-400 dark:text-slate-500" />
            </motion.button>
          </div>

          {/* WALLET LIST */}
          <motion.div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900 custom-scrollbar"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {walletDetails.map((w: any) => (
                <motion.div
                  key={w.id}
                  layout
                  variants={itemVariants}
                  exit="exit" // Animation khi xóa ví
                  className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 p-3 group relative overflow-hidden shadow-sm dark:shadow-none transition-colors"
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${w.color
                          .replace("text-", "bg-")
                          .replace("400", "100")} dark:bg-white/10 ${w.color}`}
                      >
                        {w.type === "online" ? (
                          <CreditCard size={14} />
                        ) : w.type === "cash" ? (
                          <Banknote size={14} />
                        ) : (
                          <PiggyBank size={14} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {w.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">
                          {WALLET_TYPES.find((t) => t.value === w.type)?.label}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditWalletBtn(w)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-white/10 rounded transition-colors"
                      >
                        <Edit3 size={14} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteWallet(w.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-white/10 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-500">
                        Số dư hiện tại
                      </div>
                      <div
                        className={`font-mono font-bold ${
                          w.currentBalance < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatMoney(w.currentBalance)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 dark:text-slate-400">
                        Đầu kỳ: {formatMoney(w.initialBalance)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* FORM (Bottom Fixed) */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (wName.trim() && isValidInit) {
                handleSaveWallet();
              }
            }}
            className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20"
          >
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mb-3 uppercase">
              {editingWallet
                ? `Chỉnh sửa: ${editingWallet.name}`
                : "Thêm ví mới"}
            </p>
            <div className="space-y-2">
              <input
                value={wName}
                onChange={(e) => setWName(e.target.value)}
                placeholder="Tên ví (VD: Vietcombank)"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
              />
              <div className="flex gap-2">
                <WalletTypeSelect value={wType} onChange={setWType} />

                <input
                  type="number"
                  value={wInitial}
                  onChange={(e) => setWInitial(e.target.value)}
                  placeholder="Số dư đầu kỳ..."
                  className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-1">
                {editingWallet && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCancelEditWallet}
                    className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold transition-colors"
                  >
                    Hủy
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!wName.trim() || !isValidInit}
                  className={`
                    ${
                      !wName.trim() || !isValidInit
                        ? "opacity-50 cursor-not-allowed bg-slate-400 dark:bg-slate-700"
                        : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                    }
                    flex-1 py-2.5 rounded-lg text-white text-xs font-bold transition-colors`}
                >
                  {editingWallet ? "Cập nhật ví" : "Tạo ví ngay"}
                </motion.button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};
