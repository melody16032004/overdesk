import {
  TrendingUp,
  FileText,
  Download,
  Wallet,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { CATEGORIES } from "../constants/budget_const";
import { formatMoney } from "../helpers/budget_help";
import { WalletFilterSelect } from "./WalletFilterSelect";
// 1. Import Framer Motion
import { motion, AnimatePresence, Variants } from "framer-motion";

// 2. Định nghĩa Variants (Kịch bản chuyển động)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
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

const FilterTimeButton = ({
  value,
  label,
  currentValue,
  onClick,
}: {
  value: string;
  label: string;
  currentValue: string;
  onClick: (val: string) => void;
}) => {
  const isActive = currentValue === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`relative px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors z-0 ${
        isActive
          ? "text-white"
          : "text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="active-time-bg"
          className="absolute inset-0 bg-purple-600 rounded-lg shadow-md shadow-purple-500/30 -z-10"
          // Thêm layoutDependency để chắc chắn nó tính toán lại khi giá trị thay đổi
          layoutDependency={currentValue}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
};

export const StatementView = ({
  stmtWalletId,
  setStmtWalletId,
  wallets,
  setStmtTime,
  stmtTime,
  statementData,
  handleExportExcel,
}: any) => {
  // Hàm render nút thời gian với hiệu ứng trượt nền (Shared Layout)

  return (
    <motion.div
      className="space-y-4 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. FILTER BAR */}
      <motion.div
        variants={itemVariants}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {/* Chọn Ví */}
        <WalletFilterSelect
          value={stmtWalletId}
          onChange={setStmtWalletId}
          wallets={wallets}
        />

        {/* Chọn Thời gian (Có hiệu ứng trượt) */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <FilterTimeButton
            value="this_month"
            label="Tháng này"
            currentValue={stmtTime}
            onClick={setStmtTime}
          />
          <FilterTimeButton
            value="last_month"
            label="Tháng trước"
            currentValue={stmtTime}
            onClick={setStmtTime}
          />
          <FilterTimeButton
            value="all"
            label="Tất cả"
            currentValue={stmtTime}
            onClick={setStmtTime}
          />
        </div>
      </motion.div>

      {/* 2. SUMMARY CARD */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 p-3 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
              <TrendingUp size={12} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Tổng thu
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
            {formatMoney(statementData.totalIn)}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 p-3 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
              <TrendingUp size={12} className="rotate-180" />
            </div>
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
              Tổng chi
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-red-700 dark:text-red-300">
            {formatMoney(statementData.totalOut)}
          </div>
        </motion.div>
      </motion.div>

      {/* 3. TRANSACTION LIST */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Chi tiết giao dịch
          </h4>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleExportExcel}
            disabled={statementData.data.length === 0}
            className="
              flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors
              bg-blue-50 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-100
              dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:text-blue-300 dark:hover:bg-blue-500/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200
              disabled:dark:bg-white/5 disabled:dark:text-slate-600 disabled:dark:border-white/5
            "
          >
            <Download size={12} /> Xuất Excel
          </motion.button>
        </div>

        {statementData.data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-slate-500 dark:text-slate-600 italic text-xs border border-dashed border-slate-300 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-transparent"
          >
            Không có phát sinh giao dịch trong kỳ này.
          </motion.div>
        ) : (
          // Render danh sách Group
          Object.entries(statementData.grouped).map(
            ([date, items]: any, index) => (
              <motion.div
                key={date}
                // Hiệu ứng xuất hiện từng Group một
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none"
              >
                {/* Group Header */}
                <div className="bg-slate-50 dark:bg-white/5 px-4 py-2 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {date}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-500">
                    {items.length} giao dịch
                  </span>
                </div>

                {/* Transactions Items */}
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {items.map((t: any) => {
                    const cat = CATEGORIES.find((c) => c.id === t.category);
                    const Icon = cat?.icon || Wallet;
                    const wInfo = wallets.find((w: any) => w.id === t.walletId);
                    // console.log(wInfo.type);
                    return (
                      <div
                        key={t.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              t.type === "transfer-in" || t.type === "income"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                                : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500"
                            }`}
                          >
                            {t.type === "transfer-in" ? (
                              <TrendingUp size={14} />
                            ) : t.type === "transfer-out" ? (
                              <TrendingDown size={14} />
                            ) : (
                              <Icon size={14} />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              {t.note ||
                                (t.type === "income" ? "Thu nhập" : cat?.label)}
                              {wInfo && (
                                <span
                                  className={`
                                  ${wInfo.type === "online" ? "text-blue-400" : wInfo.type === "cash" ? "text-emerald-400" : "text-purple-400"}
                                text-[8px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-normal border border-slate-200 dark:border-transparent`}
                                >
                                  {wInfo.name}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-500">
                              {t.type === "income" ? "Nguồn thu" : cat?.label}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xs font-mono font-bold ${
                              t.type === "transfer-in" || t.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {t.type === "transfer-in" || t.type === "income"
                              ? "+"
                              : "-"}
                            {formatMoney(t.amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ),
          )
        )}
      </motion.div>
    </motion.div>
  );
};
