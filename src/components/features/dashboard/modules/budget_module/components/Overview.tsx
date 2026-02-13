import {
  Activity,
  AlertTriangle,
  Wallet,
  Edit3,
  EqualApproximately,
  Save,
  CreditCard,
  Banknote,
  Briefcase,
  Plus,
  PieChart,
  TrendingUp,
  Trash2,
  History,
} from "lucide-react";
import { CATEGORIES } from "../constants/budget_const";
import { formatMoney, formatUSD } from "../helpers/budget_help";

export const Overview = ({
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isNegativeBalance && (
        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
          <div className="p-2 bg-red-500 rounded-full text-white">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 className="text-red-400 font-bold text-sm">
              Cảnh báo tài chính!
            </h4>
            <p className="text-[10px] text-red-300">
              Tổng tài sản đang âm. Hãy kiểm tra lại các khoản chi.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet size={120} />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              Tổng tài sản{" "}
              <button
                onClick={() => setShowAdjustModal(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Edit3 size={12} />
              </button>
            </p>
            <div className="flex flex-col">
              <h3
                className={`text-3xl font-black font-mono tracking-tight drop-shadow-lg ${isNegativeBalance ? "text-red-400" : "text-white"}`}
              >
                {formatMoney(totalBalance)}
              </h3>
              <span className="text-sm font-mono text-emerald-400 font-bold flex items-center gap-1 opacity-80">
                <EqualApproximately size={12} /> {formatUSD(totalBalance)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Hạn mức tháng
            </p>
            {isEditingBudget ? (
              <div className="flex items-center gap-1 justify-end">
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-24 bg-black/30 text-white text-xs p-1 rounded border border-blue-500 outline-none font-mono text-right"
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingBudget(false)
                  }
                />
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="bg-blue-500 p-1 rounded text-white"
                >
                  <Save size={10} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingBudget(true)}
                className="flex items-center justify-end gap-1 pointer group/edit"
              >
                <span className="text-slate-400 text-sm font-mono font-bold group-hover/edit:text-white transition-colors">
                  {formatMoney(budgetLimit)}
                </span>
                <Edit3
                  size={10}
                  className="text-slate-600 group-hover/edit:text-slate-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* DYNAMIC WALLET LIST HORIZONTAL (SCROLL WITH MOUSE WHEEL) */}
        <div
          ref={overviewScrollRef} // Áp dụng scroll ngang
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2 relative z-10"
        >
          {walletDetails.map((w: any) => (
            <div
              key={w.id}
              className="min-w-[120px] bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2 flex-shrink-0"
            >
              <div className={`p-1.5 bg-white/10 ${w.color} rounded-lg`}>
                {w.type === "online" ? (
                  <CreditCard size={12} />
                ) : w.type === "cash" ? (
                  <Banknote size={12} />
                ) : (
                  <Briefcase size={12} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-400 uppercase font-bold truncate">
                  {w.name}
                </p>
                <p
                  className={`font-mono font-bold text-xs truncate ${w.currentBalance < 0 ? "text-red-400" : "text-white"}`}
                >
                  {formatMoney(w.currentBalance)}
                </p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowWalletDrawer(true)}
            className="min-w-[40px] flex items-center justify-center bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 flex-shrink-0"
          >
            <Plus size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between text-[10px] mb-1.5 font-bold">
            <span
              className={
                spendingPercent > 85 ? "text-red-400" : "text-emerald-400"
              }
            >
              {spendingPercent.toFixed(1)}% Hạn mức
            </span>
            <span className="text-slate-500">
              Còn lại: {formatMoney(leftBudget)}
            </span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${spendingPercent >= 100 ? "bg-red-500" : spendingPercent > 75 ? "bg-yellow-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}`}
              style={{ width: `${Math.min(spendingPercent, 100)}%` }}
            ></div>
          </div>
          {(spendingPercent > 50 || chartData.length > 0) && (
            <div className="mt-3 flex items-start gap-2 text-xs bg-white/5 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm">
              <AlertTriangle
                size={14}
                className={`shrink-0 ${spendingPercent > 85 ? "text-red-400" : "text-yellow-400"}`}
              />
              <p className="text-slate-300 leading-snug">{insight}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/5 rounded-3xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} /> Biến động (7 ngày)
          </h4>
          <div className="flex gap-3 text-[10px] font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>{" "}
              Thu
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Chi
            </span>
          </div>
        </div>
        <div className="h-24 w-full relative">
          {renderLineChart()}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[8px] text-slate-400 mt-1 px-1">
            {trendData.map((d: any, i: any) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[100px_1fr] gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="relative w-[100px] h-[100px]">
          <svg
            viewBox="0 0 100 100"
            className="-rotate-90 w-full h-full drop-shadow-xl"
          >
            {renderDonut()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <PieChart size={24} className="text-slate-600 opacity-50" />
          </div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-white/5">
            <span className="text-slate-500 font-bold uppercase">Chi tiêu</span>
            <span className="text-white font-mono font-bold">
              {formatMoney(totalExpense)}
            </span>
          </div>
          {chartData.length > 0 ? (
            chartData.slice(0, 3).map((item: any, idx: any) => (
              <div
                key={idx}
                className="flex justify-between items-center text-xs group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${item.color.replace("text-", "bg-")}`}
                  ></div>
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    {CATEGORIES.find((c) => c.id === item.cat)?.label}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-400">
                  {formatMoney(item.val)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic">
              Chưa có dữ liệu.
            </div>
          )}
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <History size={12} /> Gần đây
        </h4>
        <div className="space-y-2">
          {filteredTrans.length > 0 ? (
            filteredTrans.slice(0, 10).map((t: any) => {
              const cat = CATEGORIES.find((c) => c.id === t.category);
              const Icon = cat?.icon || Wallet;
              const wInfo = wallets.find((w: any) => w.id === t.walletId);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        t.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500"
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
                      <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        {t.type === "income" ? "Thu nhập" : cat?.label}   
                        {wInfo && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 bg-white/10 rounded ${wInfo.color.replace(
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
                        t.type === "income"
                          ? "text-emerald-400"
                          : "text-slate-200"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}     
                      {formatMoney(t.amount)}
                    </span>
                               
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />   
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              Chưa có giao dịch nào gần đây.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
