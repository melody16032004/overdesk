import { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import {
  ShieldCheck,
  Lock,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CreditCard,
  Key,
  Unlock,
  ArrowRight,
  Settings, // Icon cài đặt
  ArrowLeft, // Icon quay lại
  Save,
} from "lucide-react";

// Key dùng để mã hóa dữ liệu (Item)
const DATA_ENCRYPTION_KEY = "OVERDESK_SECRET_VAULT_KEY_2025";

interface VaultItem {
  id: string;
  type: "bank" | "password";
  title: string;
  value: string;
  username?: string;
}

// Thêm trạng thái 'change_password'
type VaultState = "loading" | "setup" | "locked" | "open" | "change_password";

export const VaultModule = () => {
  const [vaultState, setVaultState] = useState<VaultState>("loading");
  const [inputPassword, setInputPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State cho đổi mật khẩu
  const [changePassData, setChangePassData] = useState({ old: "", new: "" });

  // Data
  const [items, setItems] = useState<VaultItem[]>([]);
  const [showValue, setShowValue] = useState<string | null>(null);

  // Add Form
  const [newItem, setNewItem] = useState<{
    type: "bank" | "password";
    title: string;
    value: string;
    username: string;
  }>({ type: "password", title: "", value: "", username: "" });
  const [isAdding, setIsAdding] = useState(false);

  // --- 1. KHỞI TẠO ---
  useEffect(() => {
    const savedHash = localStorage.getItem("vault_master_hash");
    if (savedHash) {
      setVaultState("locked");
    } else {
      setVaultState("setup");
    }
  }, []);

  // --- 2. XỬ LÝ LOGIC MẬT KHẨU ---

  // Đăng ký mới
  const handleSetupPassword = () => {
    if (inputPassword.length < 4) {
      setErrorMsg("Password too short (min 4 chars)");
      return;
    }
    const hash = CryptoJS.SHA256(inputPassword).toString();
    localStorage.setItem("vault_master_hash", hash);
    setInputPassword("");
    setVaultState("open");
    loadData();
  };

  // Đăng nhập
  const handleLogin = () => {
    const savedHash = localStorage.getItem("vault_master_hash");
    const inputHash = CryptoJS.SHA256(inputPassword).toString();

    if (inputHash === savedHash) {
      setInputPassword("");
      setErrorMsg("");
      setVaultState("open");
      loadData();
    } else {
      setErrorMsg("Incorrect password");
      const input = document.getElementById("pass-input");
      input?.classList.add("animate-pulse", "border-red-500");
      setTimeout(
        () => input?.classList.remove("animate-pulse", "border-red-500"),
        500
      );
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = () => {
    const savedHash = localStorage.getItem("vault_master_hash");
    const oldHash = CryptoJS.SHA256(changePassData.old).toString();

    // 1. Kiểm tra mật khẩu cũ
    if (oldHash !== savedHash) {
      setErrorMsg("Old password is incorrect");
      return;
    }

    // 2. Kiểm tra mật khẩu mới
    if (changePassData.new.length < 4) {
      setErrorMsg("New password is too short");
      return;
    }

    // 3. Lưu mật khẩu mới
    const newHash = CryptoJS.SHA256(changePassData.new).toString();
    localStorage.setItem("vault_master_hash", newHash);

    alert("Password changed successfully!");
    setChangePassData({ old: "", new: "" });
    setErrorMsg("");
    setVaultState("open");
  };

  // --- 3. QUẢN LÝ DỮ LIỆU ---
  const loadData = () => {
    const encryptedData = localStorage.getItem("userVaultData");
    if (encryptedData) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, DATA_ENCRYPTION_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        setItems(decryptedData);
      } catch (e) {
        console.error("Vault corrupted", e);
      }
    }
  };

  const saveToVault = (newItems: VaultItem[]) => {
    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(newItems),
      DATA_ENCRYPTION_KEY
    ).toString();
    localStorage.setItem("userVaultData", ciphertext);
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (!newItem.title || !newItem.value) return;
    const item: VaultItem = {
      id: Date.now().toString(),
      type: newItem.type,
      title: newItem.title,
      value: newItem.value,
      username: newItem.username,
    };
    saveToVault([...items, item]);
    setIsAdding(false);
    setNewItem({ type: "password", title: "", value: "", username: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this item?")) {
      saveToVault(items.filter((i) => i.id !== id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (vaultState === "setup") handleSetupPassword();
      if (vaultState === "locked") handleLogin();
      if (vaultState === "change_password") handleChangePassword();
    }
  };

  // --- VIEW 1: SETUP ---
  if (vaultState === "setup") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 text-indigo-400 animate-in zoom-in">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Create Master Password</h2>
        <p className="text-slate-400 text-sm mb-6 text-center max-w-[250px]">
          Protect your data with a secure password.
        </p>

        <div className="w-full max-w-[280px]">
          <input
            autoFocus
            type="password"
            placeholder="New Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center outline-none focus:border-indigo-500 transition-all mb-2"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {errorMsg && (
            <div className="text-red-400 text-xs text-center mb-2">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleSetupPassword}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Create Vault <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: LOCKED ---
  if (vaultState === "locked") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-700/50">
          <Lock size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold mb-6">Vault Locked</h2>

        <div className="w-full max-w-[280px]">
          <input
            id="pass-input"
            autoFocus
            type="password"
            placeholder="Enter Master Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all mb-2"
            value={inputPassword}
            onChange={(e) => {
              setInputPassword(e.target.value);
              setErrorMsg("");
            }}
            onKeyDown={handleKeyDown}
          />
          {errorMsg && (
            <div className="text-red-400 text-xs text-center mb-2 animate-pulse">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Unlock size={18} /> Unlock
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 3: CHANGE PASSWORD (MỚI) ---
  if (vaultState === "change_password") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white relative">
        <button
          onClick={() => {
            setVaultState("open");
            setErrorMsg("");
            setChangePassData({ old: "", new: "" });
          }}
          className="absolute top-6 left-6 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 text-orange-400">
          <Settings size={32} />
        </div>
        <h2 className="text-xl font-bold mb-6">Change Password</h2>

        <div className="w-full max-w-[280px] space-y-3">
          <input
            autoFocus
            type="password"
            placeholder="Current Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center outline-none focus:border-orange-500 transition-all"
            value={changePassData.old}
            onChange={(e) =>
              setChangePassData({ ...changePassData, old: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="New Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center outline-none focus:border-orange-500 transition-all"
            value={changePassData.new}
            onChange={(e) =>
              setChangePassData({ ...changePassData, new: e.target.value })
            }
            onKeyDown={handleKeyDown}
          />

          {errorMsg && (
            <div className="text-red-400 text-xs text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Save size={18} /> Update Password
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 4: MAIN VAULT (OPEN) ---
  return (
    <div className="h-full flex flex-col p-6 bg-slate-900 text-white relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">My Vault</h2>
            <p className="text-xs text-slate-400">Encrypted Storage</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Nút đổi mật khẩu */}
          <button
            onClick={() => {
              setVaultState("change_password");
              setErrorMsg("");
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
            title="Change Password"
          >
            <Settings size={20} />
          </button>

          {/* Nút Lock */}
          <button
            onClick={() => {
              setVaultState("locked");
              setItems([]); // Clear RAM data for security
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
            title="Lock Vault"
          >
            <Lock size={20} />
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {/* Form thêm mới */}
          {isAdding && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-indigo-500/30 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setNewItem({ ...newItem, type: "password" })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded ${
                    newItem.type === "password"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => setNewItem({ ...newItem, type: "bank" })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded ${
                    newItem.type === "bank"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  Bank Account
                </button>
              </div>

              <input
                placeholder={
                  newItem.type === "bank"
                    ? "Bank Name (e.g. TPBank)"
                    : "Service (e.g. Facebook)"
                }
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-2 text-sm outline-none focus:border-indigo-500"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />

              {newItem.type === "password" && (
                <input
                  placeholder="Username / Email"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-2 text-sm outline-none focus:border-indigo-500"
                  value={newItem.username}
                  onChange={(e) =>
                    setNewItem({ ...newItem, username: e.target.value })
                  }
                />
              )}

              <input
                placeholder={
                  newItem.type === "bank" ? "Account Number" : "Password"
                }
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-3 text-sm outline-none focus:border-indigo-500"
                value={newItem.value}
                onChange={(e) =>
                  setNewItem({ ...newItem, value: e.target.value })
                }
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* List Items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === "bank"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}
                >
                  {item.type === "bank" ? (
                    <CreditCard size={18} />
                  ) : (
                    <Key size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{item.title}</div>
                  {item.username && (
                    <div className="text-xs text-slate-400 truncate">
                      {item.username}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                    {showValue === item.id ? (
                      <span className="text-white bg-slate-700 px-1 rounded">
                        {item.value}
                      </span>
                    ) : (
                      <span>••••••••••••</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    setShowValue(showValue === item.id ? null : item.id)
                  }
                  className="p-2 hover:bg-slate-700 rounded text-slate-300"
                >
                  {showValue === item.id ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.value);
                    alert("Copied!");
                  }}
                  className="p-2 hover:bg-slate-700 rounded text-slate-300"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && !isAdding && (
            <div className="text-center text-slate-600 text-sm mt-10">
              Vault is empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
