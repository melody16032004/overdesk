import { TrendingUp, FileText, Download, Wallet } from "lucide-react";
import { CATEGORIES } from "../constants/budget_const";
import { formatMoney } from "../helpers/budget_help";
import { WalletFilterSelect } from "./WalletFilterSelect";

export const StatementView = ({
  stmtWalletId,
  setStmtWalletId,
  wallets,
  setStmtTime,
  stmtTime,
  statementData,
  handleExportExcel,
}: any) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 1. FILTER BAR */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Chọn Ví */}
        <WalletFilterSelect
          value={stmtWalletId}
          onChange={setStmtWalletId}
          wallets={wallets}
        />

        {/* Chọn Thời gian */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setStmtTime("this_month")}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${stmtTime === "this_month" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setStmtTime("last_month")}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${stmtTime === "last_month" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}
          >
            Tháng trước
          </button>
          <button
            onClick={() => setStmtTime("all")}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${stmtTime === "all" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARD */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <TrendingUp size={12} />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">
              Tổng thu
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-300">
            {formatMoney(statementData.totalIn)}
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <TrendingUp size={12} className="rotate-180" />
            </div>
            <span className="text-[10px] font-bold text-red-400 uppercase">
              Tổng chi
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-red-300">
            {formatMoney(statementData.totalOut)}
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION LIST (GROUPED) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Chi tiết giao dịch
          </h4>
          <button
            onClick={handleExportExcel}
            className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20"
          >
            <Download size={12} /> Xuất Excel
          </button>
        </div>

        {statementData.data.length === 0 ? (
          <div className="text-center py-12 text-slate-600 italic text-xs border border-dashed border-white/5 rounded-2xl">
            Không có phát sinh giao dịch trong kỳ này.
          </div>
        ) : (
          Object.entries(statementData.grouped).map(([date, items]: any) => (
            <div
              key={date}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="bg-white/5 px-4 py-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300">
                  {date}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {items.length} giao dịch
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((t: any) => {
                  const cat = CATEGORIES.find((c) => c.id === t.category);
                  const Icon = cat?.icon || Wallet;
                  const wInfo = wallets.find((w: any) => w.id === t.walletId);

                  return (
                    <div
                      key={t.id}
                      className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${t.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-700/50 text-slate-400"}`}
                        >
                          {t.type === "income" ? (
                            <TrendingUp size={14} />
                          ) : (
                            <Icon size={14} />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            {t.note ||
                              (t.type === "income" ? "Thu nhập" : cat?.label)}
                            {wInfo && (
                              <span className="text-[8px] px-1 bg-white/10 rounded text-slate-400 font-normal">
                                {wInfo.name}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {t.type === "income" ? "Nguồn thu" : cat?.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xs font-mono font-bold ${t.type === "income" ? "text-emerald-400" : "text-slate-300"}`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatMoney(t.amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
