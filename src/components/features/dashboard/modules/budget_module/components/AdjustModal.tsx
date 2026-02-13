import { X, RefreshCw } from "lucide-react";
import { formatMoney } from "../helpers/budget_help";

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
    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={() => {
            setShowAdjustModal(false);
            setActualMoney("");
            setAdjustWalletId("");
          }}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <RefreshCw size={24} />
          </div>
          <h3 className="text-lg font-bold">Cân bằng Số dư</h3>
          <p className="text-xs text-slate-400 mt-1">
            Chọn ví và nhập số tiền thực tế.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 bg-black/40 p-1.5 rounded-xl">
          {wallets.map((w: any) => (
            <button
              key={w.id}
              onClick={() => setAdjustWalletId(w.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${adjustWalletId === w.id ? "bg-slate-700 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}
            >
              {w.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <span className="text-xs text-slate-400">Trên App đang tính:</span>
            <span className="font-mono font-bold">
              {formatMoney(walletBalances[adjustWalletId] || 0)}
            </span>
          </div>
          <input
            type="number"
            value={actualMoney}
            onChange={(e) => setActualMoney(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-2xl font-mono font-bold text-white focus:border-blue-500 outline-none text-right"
          />
          <button
            disabled={!isValid}
            onClick={handleAdjustBalance}
            className={`
                    w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all
                    ${
                      !isValid
                        ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 shadow-none" // Style khi Disabled
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" // Style khi Active
                    }
                  `}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
