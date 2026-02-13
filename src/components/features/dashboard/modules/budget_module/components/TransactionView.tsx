import {
  Wallet,
  Plus,
  CreditCard,
  Banknote,
  Check,
  RefreshCw,
  Edit3,
  ArrowRight,
} from "lucide-react";
import { formatMoney } from "../helpers/budget_help";

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
  handleTransfer,
}: any) => {
  return (
    <div className="h-full flex flex-col relative animate-in slide-in-from-right-10 duration-300">
      {wallets.length < 2 ? (
        // --- TRƯỜNG HỢP KHÔNG ĐỦ VÍ ---
        <div className="flex flex-col items-center justify-center h-full text-center p-8 pb-20">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Wallet size={40} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">Cần thêm ví</h3>
          <p className="text-sm text-slate-500 max-w-[200px] mb-6">
            Bạn cần ít nhất 2 ví để thực hiện chuyển tiền qua lại.
          </p>
          <button
            onClick={() => setShowWalletDrawer(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={18} className="inline mr-2" /> Tạo ví mới
          </button>
        </div>
      ) : (
        // --- GIAO DIỆN CHUYỂN TIỀN (FIXED) ---
        <>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-15">
            {/* CONTAINER BỌC NGUỒN & ĐÍCH */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent border-r border-dashed border-slate-600/30 pointer-events-none hidden sm:block"></div>

              <div className="flex flex-col gap-6 relative z-10">
                {/* 1. FROM SECTION */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Nguồn tiền (Từ)
                    </label>
                  </div>

                  <div
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                    ref={transferFromRef}
                  >
                    {wallets
                      // --- THÊM ĐOẠN FILTER NÀY ---
                      .filter((w: any) => (walletBalances[w.id] || 0) > 0)
                      // ----------------------------
                      .map((w: any) => {
                        const isSelected = transferFromId === w.id;
                        const isDisabled = w.id === transferToId;
                        return (
                          <button
                            key={w.id}
                            onClick={() => setTransferFromId(w.id)}
                            disabled={isDisabled}
                            className={`
                                    relative flex-shrink-0 w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left
                                    ${
                                      isSelected
                                        ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10"
                                        : "bg-black/20 border-transparent hover:bg-white/5"
                                    }
                                    ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "pointer"}
                                  `}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div
                                className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"}`}
                              >
                                {w.type === "online" ? (
                                  <CreditCard size={14} />
                                ) : (
                                  <Banknote size={14} />
                                )}
                              </div>
                              {isSelected && (
                                <Check size={14} className="text-blue-400" />
                              )}
                            </div>
                            <div
                              className={`text-[10px] font-bold uppercase truncate mb-0.5 ${isSelected ? "text-white" : "text-slate-400"}`}
                            >
                              {w.name}
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-300 truncate">
                              {formatMoney(walletBalances[w.id] || 0)}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* SWAP BUTTON (CENTERED) */}
                <div className="relative h-4 flex items-center justify-center">
                  <div className="absolute w-full h-px bg-white/5"></div>
                  <button
                    onClick={handleSwapWallets}
                    className="relative z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/20 transition-all flex items-center justify-center shadow-lg active:rotate-180 duration-300"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* 2. TO SECTION */}
                <div>
                  <div className="flex items-center justify-end gap-2 mb-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                        <button
                          key={w.id}
                          onClick={() => setTransferToId(w.id)}
                          disabled={isDisabled}
                          className={`
                                  relative flex-shrink-0 w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left
                                  ${
                                    isSelected
                                      ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10"
                                      : "bg-black/20 border-transparent hover:bg-white/5"
                                  }
                                  ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "pointer"}
                                `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className={`p-1.5 rounded-lg ${isSelected ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"}`}
                            >
                              {w.type === "online" ? (
                                <CreditCard size={14} />
                              ) : (
                                <Banknote size={14} />
                              )}
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-emerald-400" />
                            )}
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase truncate mb-0.5 ${isSelected ? "text-white" : "text-slate-400"}`}
                          >
                            {w.name}
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-300 truncate">
                            {formatMoney(walletBalances[w.id] || 0)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. INPUT AREA */}
            <div className="mt-4 space-y-4">
              {/* Amount */}
              <div className="bg-black/20 rounded-3xl p-1 border border-white/5">
                <div className="bg-white/5 rounded-[20px] p-4 text-center relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Số tiền chuyển
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-2xl font-mono font-bold text-white text-center focus:outline-none placeholder:text-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-600 mt-1 block">
                    VND
                  </span>
                </div>
                {/* Quick select */}
                <div className="flex gap-1 overflow-x-auto p-2 scrollbar-hide justify-center">
                  {[
                    50000, 100000, 200000, 500000, 1000000, 5000000, 10000000,
                  ].map((val) => (
                    <button
                      key={val}
                      onClick={() => setTransferAmount(val.toString())}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      {val >= 1000000 ? val / 1000000 + "Tr" : val / 1000 + "k"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-500">
                  <Edit3 size={16} />
                </div>
                <input
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Nội dung chuyển tiền (tùy chọn)..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 focus:bg-white/10"
                />
              </div>
            </div>
          </div>

          {/* --- FIXED BOTTOM BUTTON --- */}
          <div className="absolute -bottom-24 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-40">
            <button
              onClick={handleTransfer}
              disabled={!transferAmount || !transferFromId || !transferToId}
              className={`
                        w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95
                        ${
                          !transferAmount || !transferFromId || !transferToId
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30"
                        }
                    `}
            >
              <div className="flex items-center gap-2">
                <span>Xác nhận</span>
                <ArrowRight size={18} />
              </div>
              {transferAmount && (
                <>
                  <div className="w-px h-4 bg-white/20"></div>
                  <span className="font-mono text-xs opacity-90">
                    {formatMoney(parseFloat(transferAmount))}
                  </span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
