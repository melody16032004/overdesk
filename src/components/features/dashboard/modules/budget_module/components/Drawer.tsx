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
  return (
    <div className="absolute inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setShowWalletDrawer(false);
          setShowAdjustModal(false);
          setWName("");
          setWInitial("");
          setWType("online");
          setEditingWallet(null);
        }}
      ></div>
      <div className="w-80 bg-slate-900 border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 z-10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Wallet size={16} /> Quản lý Ví
          </h3>
          <button onClick={() => setShowWalletDrawer(false)}>
            <X size={18} className="text-slate-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {walletDetails.map((w: any) => (
            <div
              key={w.id}
              className="bg-white/5 rounded-xl border border-white/5 p-3 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-white/10 ${w.color}`}>
                    {w.type === "online" ? (
                      <CreditCard size={14} />
                    ) : w.type === "cash" ? (
                      <Banknote size={14} />
                    ) : (
                      <PiggyBank size={14} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{w.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      {WALLET_TYPES.find((t) => t.value === w.type)?.label}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditWalletBtn(w)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-white/10 rounded"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteWallet(w.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="text-[10px] text-slate-500">
                    Số dư hiện tại
                  </div>
                  <div
                    className={`font-mono font-bold ${w.currentBalance < 0 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {formatMoney(w.currentBalance)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400">
                    Đầu kỳ: {formatMoney(w.initialBalance)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FORM ADD/EDIT WALLET (Bottom Fixed) */}
        <div className="p-4 bg-[#0f172a] border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase">
            {editingWallet ? `Chỉnh sửa: ${editingWallet.name}` : "Thêm ví mới"}
          </p>
          <div className="space-y-2">
            <input
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Tên ví (VD: Vietcombank)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 text-white"
            />
            <div className="flex gap-2">
              {/* CUSTOM DROPDOWN HERE */}
              <WalletTypeSelect value={wType} onChange={setWType} />

              <input
                type="number"
                value={wInitial}
                onChange={(e) => setWInitial(e.target.value)}
                placeholder="Số dư đầu kỳ..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              {editingWallet && (
                <button
                  onClick={handleCancelEditWallet}
                  className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
              )}
              <button
                disabled={!wName.trim() || !isValidInit}
                onClick={handleSaveWallet}
                className={`
                      ${!wName.trim() || !isValidInit ? "opacity-50 cursor-not-allowed bg-slate-700" : ""}
                      flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-colors`}
              >
                {editingWallet ? "Cập nhật ví" : "Tạo ví ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
