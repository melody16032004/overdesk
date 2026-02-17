import {
  Activity,
  AlertTriangle,
  Wallet,
  Edit3,
  EqualApproximately,
  Save,
  CreditCard,
  Banknote,
  Plus,
  PieChart,
  TrendingUp,
  Trash2,
  History,
  PiggyBank,
  MoreVertical,
} from "lucide-react";
import { CATEGORIES } from "../constants/budget_const";
import {
  formatMoney,
  formatUSD,
  playSoundEffect,
} from "../helpers/budget_help";
import write from "/sounds/budget/write.mp3";
// 1. Import Framer Motion
import { motion, Variants, AnimatePresence } from "framer-motion";

// 2. Định nghĩa Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Thời gian trễ giữa các khối
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

export const Overview = ({
  handleEditTransaction,
  isNegativeBalance,
  setShowAdjustModal,
  totalBalance,
  isEditingBudget,
  budgetLimit,
  setBudgetLimit,
  setIsEditingBudget,
  overviewScrollRef,
  walletDetails,
  setShowWalletDrawer,
  spendingPercent,
  leftBudget,
  chartData,
  insight,
  renderLineChart,
  trendData,
  renderDonut,
  totalExpense,
  filteredTrans,
  wallets,
  handleDeleteTransaction,
}: any) => {
  return (
    <motion.div
      className="space-y-4 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- CẢNH BÁO TÀI SẢN ÂM --- */}
      <AnimatePresence>
        {isNegativeBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl flex items-center gap-3 overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-2 bg-red-500 rounded-full text-white"
            >
              <AlertTriangle size={16} />
            </motion.div>
            <div>
              <h4 className="text-red-600 dark:text-red-400 font-bold text-sm">
                Cảnh báo tài chính!
              </h4>
              <p className="text-[10px] text-red-500 dark:text-red-300">
                Tổng tài sản đang âm. Hãy kiểm tra lại các khoản chi.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CARD (Tổng tài sản) --- */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-5 group-hover:opacity-10 dark:group-hover:opacity-10 transition-opacity">
          <Wallet size={120} className="text-slate-900 dark:text-white" />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              Tổng tài sản
              <motion.button
                whileHover={{ scale: 1.2, rotate: 15 }}
                onClick={() => setShowAdjustModal(true)}
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Edit3 size={12} />
              </motion.button>
            </p>
            <div className="flex flex-col">
              <motion.h3
                // Hiệu ứng số tiền thay đổi (cần key thay đổi để trigger animation)
                key={totalBalance}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-3xl font-black font-mono tracking-tight drop-shadow-sm dark:drop-shadow-lg ${
                  isNegativeBalance
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {formatMoney(totalBalance)}
              </motion.h3>
              <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 opacity-80">
                <EqualApproximately size={12} /> {formatUSD(totalBalance)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Hạn mức tháng
            </p>
            {isEditingBudget ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 justify-end"
              >
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-24 bg-white dark:bg-black/30 text-slate-900 dark:text-white text-xs p-1 rounded border border-blue-500 outline-none font-mono text-right shadow-sm"
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingBudget(false)
                  }
                />
                <button
                  onClick={() => {
                    setIsEditingBudget(false);
                    playSoundEffect(write);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded shadow-sm"
                >
                  <Save size={10} />
                </button>
              </motion.div>
            ) : (
              <div
                onClick={() => setIsEditingBudget(true)}
                className="flex items-center justify-end gap-1 pointer group/edit cursor-pointer"
              >
                <span className="text-slate-600 dark:text-slate-400 text-sm font-mono font-bold group-hover/edit:text-slate-900 dark:group-hover/edit:text-white transition-colors">
                  {formatMoney(budgetLimit)}
                </span>
                <Edit3
                  size={10}
                  className="text-slate-400 dark:text-slate-600 group-hover/edit:text-slate-600 dark:group-hover/edit:text-slate-400 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* --- DYNAMIC WALLET LIST --- */}
        <div
          ref={overviewScrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2 relative z-10"
        >
          {walletDetails.map((w: any) => (
            <motion.div
              key={w.id}
              whileHover={{ y: -5 }} // Nổi lên khi hover
              className="min-w-[120px] bg-white/60 dark:bg-black/20 p-2 rounded-xl border border-slate-200 dark:border-white/5 flex items-center gap-2 flex-shrink-0 shadow-sm dark:shadow-none backdrop-blur-sm cursor-default"
            >
              <div
                className={`p-1.5 bg-white dark:bg-white/10 ${w.color} rounded-lg shadow-sm dark:shadow-none`}
              >
                {w.type === "online" ? (
                  <CreditCard size={12} />
                ) : w.type === "cash" ? (
                  <Banknote size={12} />
                ) : (
                  <PiggyBank size={12} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-bold truncate">
                  {w.name}
                </p>
                <p
                  className={`font-mono font-bold text-xs truncate ${
                    w.currentBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {formatMoney(w.currentBalance)}
                </p>
              </div>
            </motion.div>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowWalletDrawer(true)}
            className="min-w-[40px] flex items-center justify-center bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 flex-shrink-0 shadow-sm dark:shadow-none"
          >
            <Plus size={16} className="text-slate-400 dark:text-slate-400" />
          </motion.button>
        </div>

        {/* Progress Bar & Insight */}
        <div className="relative z-10">
          <div className="flex justify-between text-[10px] mb-1.5 font-bold">
            <span
              className={
                spendingPercent > 85
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {spendingPercent.toFixed(1)}% Hạn mức
            </span>
            <span className="text-slate-500 dark:text-slate-500">
              Còn lại: {formatMoney(leftBudget)}
            </span>
          </div>

          <div className="h-2 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spendingPercent, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                spendingPercent >= 100
                  ? "bg-red-500"
                  : spendingPercent > 75
                    ? "bg-yellow-500"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500"
              }`}
            ></motion.div>
          </div>

          <AnimatePresence>
            {(spendingPercent > 50 || chartData.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-start gap-2 text-xs bg-white/80 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none"
              >
                <AlertTriangle
                  size={14}
                  className={`shrink-0 ${
                    spendingPercent > 85
                      ? "text-red-500 dark:text-red-400"
                      : "text-yellow-500 dark:text-yellow-400"
                  }`}
                />
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  {insight}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* --- CHART 1: BIẾN ĐỘNG --- */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-3xl p-4 shadow-sm dark:shadow-none"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} /> Biến động (7 ngày)
          </h4>
          <div className="flex gap-3 text-[10px] font-bold">
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
              Thu
            </span>
            <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></div>
              Chi
            </span>
          </div>
        </div>
        <div className="h-24 w-full relative">
          {renderLineChart()}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-1 px-1">
            {trendData.map((d: any, i: any) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* --- CHART 2: DONUT --- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-[100px_1fr] gap-4 items-center bg-white dark:bg-white/5 p-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
      >
        <div className="relative w-[100px] h-[100px]">
          <svg
            viewBox="0 0 100 100"
            className="-rotate-90 w-full h-full drop-shadow-xl"
          >
            {renderDonut()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <PieChart
              size={24}
              className="text-slate-400 dark:text-slate-600 opacity-50"
            />
          </div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-slate-500 font-bold uppercase">Chi tiêu</span>
            <span className="text-slate-800 dark:text-white font-mono font-bold">
              {formatMoney(totalExpense)}
            </span>
          </div>
          {chartData.length > 0 ? (
            chartData.slice(0, 3).map((item: any, idx: any) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex justify-between items-center text-xs group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${item.color.replace(
                      "text-",
                      "bg-",
                    )}`}
                  ></div>
                  <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {CATEGORIES.find((c) => c.id === item.cat)?.label}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                  {formatMoney(item.val)}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic">
              Chưa có dữ liệu.
            </div>
          )}
        </div>
      </motion.div>

      {/* --- RECENT TRANSACTIONS --- */}
      <motion.div variants={itemVariants}>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <History size={12} /> Gần đây
        </h4>
        <div className="space-y-2">
          {filteredTrans.length > 0 ? (
            filteredTrans.slice(0, 10).map((t: any, index: number) => {
              const cat = CATEGORIES.find((c) => c.id === t.category);
              const Icon = cat?.icon || Wallet;
              const wInfo = wallets.find((w: any) => w.id === t.walletId);
              return (
                <motion.div
                  key={t.id}
                  // Hiệu ứng xuất hiện từng dòng (waterfall)
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors group shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        t.type === "income"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                          : `${cat?.bg} ${cat?.color}`
                      }`}
                    >
                      {t.type === "income" ? (
                        <TrendingUp size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {t.type === "income" ? "Thu nhập" : cat?.label}
                        {wInfo && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded ${wInfo.color.replace(
                              "text-",
                              "text-opacity-80 text-",
                            )}`}
                          >
                            {wInfo.name}
                          </span>
                        )}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        {t.date} • {t.note || "Không có ghi chú"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold text-sm ${
                        t.type === "transfer-in" || t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.type === "transfer-in" || t.type === "income"
                        ? "+"
                        : "-"}
                      {formatMoney(t.amount)}
                    </span>

                    {/* --- ACTION MENU BUTTON (GOM 2 NÚT) --- */}
                    <motion.div
                      initial="idle"
                      whileHover="hover"
                      className="relative flex items-center justify-end"
                    >
                      {/* 1. Nút 3 chấm (Hiện khi bình thường, ẩn khi hover) */}
                      <motion.div
                        variants={{
                          idle: { opacity: 1, scale: 1, display: "flex" },
                          hover: { opacity: 0, scale: 0.5, display: "none" },
                        }}
                        transition={{ duration: 0.1 }}
                        className="p-1.5 text-slate-400 dark:text-slate-600"
                      >
                        <MoreVertical size={16} />
                      </motion.div>

                      {/* 2. Container chứa Edit/Delete (Ẩn khi bình thường, hiện khi hover) */}
                      <motion.div
                        variants={{
                          idle: { opacity: 0, width: 0, scale: 0.8 },
                          hover: { opacity: 1, width: "auto", scale: 1 },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="flex gap-1 overflow-hidden"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditTransaction(t)}
                          className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm"
                          title="Sửa giao dịch"
                        >
                          <Edit3 size={14} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 shadow-sm"
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              Chưa có giao dịch nào gần đây.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
