import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  PieChart,
  History,
  Coffee,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Gift,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Edit3,
  Save,
  RefreshCw,
  X,
  HeartPulse,
  GraduationCap,
  Plane,
  PiggyBank,
  Sparkles,
  Gamepad2,
  Activity,
  CreditCard,
  Banknote,
  EqualApproximately,
  Menu,
  Briefcase,
  ChevronDown,
  Check,
  Repeat,
  FileText,
  BrushCleaning,
  Download,
} from "lucide-react";
import { useToastStore } from "../../../../stores/useToastStore";

// --- HOOK: SCROLL NGANG BẰNG CHUỘT ---
function useHorizontalScroll() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY,
          behavior: "smooth", // Cuộn mượt
        });
      };
      el.addEventListener("wheel", onWheel);
      return () => el.removeEventListener("wheel", onWheel);
    }
  }, []);
  return elRef;
}

// --- TYPES ---
type TransactionType = "income" | "expense";
type WalletType = "online" | "cash" | "savings";
type TimeFilter = "month" | "all";

interface WalletItem {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color: string;
}

interface Transaction {
  id: number;
  type: TransactionType;
  walletId: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  rawDate: number;
}

// --- CONFIG ---
const EXCHANGE_RATE = 25450;

const DEFAULT_WALLETS: WalletItem[] = [
  {
    id: "w_default_1",
    name: "Tiền mặt",
    type: "cash",
    initialBalance: 0,
    color: "text-emerald-400",
  },
  {
    id: "w_default_2",
    name: "Ngân hàng",
    type: "online",
    initialBalance: 0,
    color: "text-blue-400",
  },
];

const WALLET_TYPES = [
  {
    value: "online",
    label: "Online",
    icon: CreditCard,
    color: "text-blue-400",
  },
  {
    value: "cash",
    label: "Tiền mặt",
    icon: Banknote,
    color: "text-emerald-400",
  },
  {
    value: "savings",
    label: "Tiết kiệm",
    icon: PiggyBank,
    color: "text-purple-400",
  },
];

const CATEGORIES = [
  {
    id: "food",
    label: "Ăn uống",
    icon: Coffee,
    color: "text-orange-400",
    bg: "bg-orange-500/20 border-orange-500/30",
  },
  {
    id: "shopping",
    label: "Mua sắm",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/30",
  },
  {
    id: "transport",
    label: "Di chuyển",
    icon: Car,
    color: "text-indigo-400",
    bg: "bg-indigo-500/20 border-indigo-500/30",
  },
  {
    id: "bills",
    label: "Hóa đơn",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
  {
    id: "home",
    label: "Nhà cửa",
    icon: Home,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/30",
  },
  {
    id: "health",
    label: "Sức khỏe",
    icon: HeartPulse,
    color: "text-rose-400",
    bg: "bg-rose-500/20 border-rose-500/30",
  },
  {
    id: "edu",
    label: "Giáo dục",
    icon: GraduationCap,
    color: "text-sky-400",
    bg: "bg-sky-500/20 border-sky-500/30",
  },
  {
    id: "travel",
    label: "Du lịch",
    icon: Plane,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20 border-cyan-500/30",
  },
  {
    id: "ent",
    label: "Giải trí",
    icon: Gamepad2,
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/30",
  },
  {
    id: "invest",
    label: "Đầu tư",
    icon: PiggyBank,
    color: "text-green-400",
    bg: "bg-green-500/20 border-green-500/30",
  },
  {
    id: "beauty",
    label: "Làm đẹp",
    icon: Sparkles,
    color: "text-pink-400",
    bg: "bg-pink-500/20 border-pink-500/30",
  },
  {
    id: "other",
    label: "Khác",
    icon: Gift,
    color: "text-slate-400",
    bg: "bg-slate-500/20 border-slate-500/30",
  },
  {
    id: "transfer",
    label: "Chuyển tiền",
    icon: Repeat,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
];

const SUGGESTIONS = [
  { label: "5k", value: 5000 },
  { label: "10k", value: 10000 },
  { label: "20k", value: 20000 },
  { label: "30k", value: 30000 },
  { label: "50k", value: 50000 },
  { label: "100k", value: 100000 },
  { label: "200k", value: 200000 },
  { label: "500k", value: 500000 },
  { label: "1Tr", value: 1000000 },
];

// --- COMPONENT: CUSTOM DROPDOWN ---
const WalletTypeSelect = ({
  value,
  onChange,
}: {
  value: WalletType;
  onChange: (val: WalletType) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected =
    WALLET_TYPES.find((t) => t.value === value) || WALLET_TYPES[0];

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <selected.icon size={14} className={selected.color} />
          <span className="text-white">{selected.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {WALLET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                onChange(type.value as WalletType);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 text-slate-300 hover:text-white text-left"
            >
              <type.icon size={14} className={type.color} />
              <span className="flex-1">{type.label}</span>
              {value === type.value && (
                <Check size={12} className="text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const BudgetModule = () => {
  const { showToast } = useToastStore();

  // --- REFS SCROLL ---
  const overviewScrollRef = useHorizontalScroll(); // Ref cho danh sách ví ở Overview
  const addViewScrollRef = useHorizontalScroll(); // Ref cho danh sách ví ở Add View
  const transferFromRef = useHorizontalScroll(); // Ref scroll cho list ví nguồn
  const transferToRef = useHorizontalScroll(); // Ref scroll cho list ví đích

  // --- STATE ---
  const [wallets, setWallets] = useState<WalletItem[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_budget_wallets_v2");
      return saved ? JSON.parse(saved) : DEFAULT_WALLETS;
    } catch {
      return DEFAULT_WALLETS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_budget_data");
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });
  // --- STATE CHO CHUYỂN TIỀN ---
  const [transferFromId, setTransferFromId] = useState<string>("");
  const [transferToId, setTransferToId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [stmtWalletId, setStmtWalletId] = useState<string>("all");
  const [stmtTime, setStmtTime] = useState<"this_month" | "last_month" | "all">(
    "this_month",
  );

  // Tự động chọn ví mặc định khi mở view
  useEffect(() => {
    if (wallets.length >= 2) {
      if (!transferFromId) setTransferFromId(wallets[0].id);
      if (!transferToId) setTransferToId(wallets[1].id);
    } else if (wallets.length === 1) {
      if (!transferFromId) setTransferFromId(wallets[0].id);
    }
  }, [wallets]);

  const [budgetLimit, setBudgetLimit] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard_budget_limit");
      return saved ? parseInt(saved) : 5000000;
    } catch {
      return 5000000;
    }
  });

  // UI States
  const [view, setView] = useState<
    "overview" | "add" | "transaction" | "statement"
  >("overview");
  const [filter, setFilter] = useState<TimeFilter>("month");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showWalletDrawer, setShowWalletDrawer] = useState(false);

  // [MỚI] Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Form Add Transaction
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    wallets[0]?.id || "",
  );
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");

  // Form Wallet (Create/Edit)
  const [editingWallet, setEditingWallet] = useState<WalletItem | null>(null);
  const [wName, setWName] = useState("");
  const [wType, setWType] = useState<WalletType>("online");
  const [wInitial, setWInitial] = useState("");

  // Balance Adjust
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustWalletId, setAdjustWalletId] = useState<string>("");
  const [actualMoney, setActualMoney] = useState("");

  // --- SAVE EFFECTS ---
  useEffect(() => {
    localStorage.setItem("dashboard_budget_data", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "dashboard_budget_wallets_v2",
      JSON.stringify(wallets),
    );
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem("dashboard_budget_limit", budgetLimit.toString());
  }, [budgetLimit]);

  useEffect(() => {
    if (wallets.length > 0 && !wallets.find((w) => w.id === selectedWalletId)) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets]);

  // --- CALCULATIONS ---
  const {
    filteredTrans,
    totalExpense,
    totalBalance,
    walletDetails,
    chartData,
    spendingPercent,
    insight,
    trendData,
    walletBalances,
    leftBudget,
    isNegativeBalance,
  } = useMemo(() => {
    const now = new Date();
    const wBalances: Record<string, number> = {};
    wallets.forEach((w) => (wBalances[w.id] = 0));

    // Tính số dư từng ví
    const wDetails = wallets.map((w) => {
      const walletTrans = transactions.filter((t) => t.walletId === w.id);
      const income = walletTrans
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = walletTrans
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const current = w.initialBalance + income - expense;

      wBalances[w.id] = current; // Cập nhật cho map balances

      return {
        ...w,
        currentBalance: current,
      };
    });

    const currentTotalBalance = wDetails.reduce(
      (sum, w) => sum + w.currentBalance,
      0,
    );

    const filtered = transactions
      .filter((t) => {
        if (filter === "all") return true;
        const tDate = new Date(t.rawDate);
        return (
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      })
      .sort((a, b) => b.rawDate - a.rawDate);

    const expensePeriod = filtered
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const catTotals: Record<string, number> = {};
    filtered
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });

    let startAngle = 0;
    const cData = Object.entries(catTotals)
      .map(([cat, val]) => {
        const percentage = val / expensePeriod;
        const angle = percentage * 360;
        const item = {
          cat,
          val,
          start: startAngle,
          end: startAngle + angle,
          color:
            CATEGORIES.find((c) => c.id === cat)?.color || "text-slate-500",
        };
        startAngle += angle;
        return item;
      })
      .sort((a, b) => b.val - a.val);

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("vi-VN");
    });
    const trends = last7Days.map((dateStr) => {
      const dailyTrans = transactions.filter((t) => t.date === dateStr);
      return {
        date: dateStr.slice(0, 5),
        inc: dailyTrans
          .filter((t) => t.type === "income")
          .reduce((a, b) => a + b.amount, 0),
        exp: dailyTrans
          .filter((t) => t.type === "expense")
          .reduce((a, b) => a + b.amount, 0),
      };
    });

    const percent = Math.min((expensePeriod / budgetLimit) * 100, 100);
    const left = budgetLimit - expensePeriod;
    let advice = "Tài chính ổn định.";

    if (currentTotalBalance < 0) advice = "🚨 BÁO ĐỘNG: TỔNG TÀI SẢN ÂM!";
    else if (percent >= 100) advice = "🛑 Đã vượt quá hạn mức chi tiêu!";
    else if (percent > 85) advice = "⚠️ Cảnh báo: Sắp chạm trần hạn mức.";

    return {
      filteredTrans: filtered,
      totalExpense: expensePeriod,
      totalBalance: currentTotalBalance,
      walletDetails: wDetails,
      walletBalances: wBalances,
      chartData: cData,
      spendingPercent: percent,
      insight: advice,
      trendData: trends,
      leftBudget: left,
      isNegativeBalance: currentTotalBalance < 0,
    };
  }, [transactions, filter, budgetLimit, wallets]);

  // --- ACTIONS ---

  // Custom Confirm Handler
  const confirmAction = (
    title: string,
    message: string,
    action: () => void,
  ) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      },
    });
  };

  // Wallet CRUD
  const handleSaveWallet = () => {
    if (!wName.trim()) {
      showToast("Vui lòng nhập tên ví", "error");
      return;
    }
    const initial = parseFloat(wInitial) || 0;

    if (editingWallet) {
      const updatedWallets = wallets.map((w) =>
        w.id === editingWallet.id
          ? {
              ...w,
              name: wName,
              type: wType,
              initialBalance: initial,
              color:
                wType === "online"
                  ? "text-blue-400"
                  : wType === "cash"
                    ? "text-emerald-400"
                    : "text-purple-400",
            }
          : w,
      );
      setWallets(updatedWallets);
      showToast("Đã cập nhật ví", "success");
    } else {
      const newWallet: WalletItem = {
        id: `w_${Date.now()}`,
        name: wName,
        type: wType,
        initialBalance: initial,
        color:
          wType === "online"
            ? "text-blue-400"
            : wType === "cash"
              ? "text-emerald-400"
              : "text-purple-400",
      };
      setWallets([...wallets, newWallet]);
      showToast("Đã tạo ví mới", "success");
    }
    setEditingWallet(null);
    setWName("");
    setWInitial("");
    setWType("online");
  };

  const handleEditWalletBtn = (w: WalletItem) => {
    setEditingWallet(w);
    setWName(w.name);
    setWType(w.type);
    setWInitial(w.initialBalance.toString());
  };

  const handleDeleteWallet = (id: string) => {
    if (wallets.length <= 1) {
      showToast("Phải giữ lại ít nhất 1 ví!", "error");
      return;
    }

    confirmAction(
      "Xóa ví?",
      "Hành động này sẽ xóa vĩnh viễn ví và tất cả giao dịch liên quan. Bạn có chắc chắn không?",
      () => {
        setWallets(wallets.filter((w) => w.id !== id));
        setTransactions(transactions.filter((t) => t.walletId !== id));
        showToast("Đã xóa ví", "success");
      },
    );
  };

  const handleCancelEditWallet = () => {
    setEditingWallet(null);
    setWName("");
    setWInitial("");
    setWType("online");
  };

  // Transaction Actions
  const handleAddTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!wallets.find((w) => w.id === selectedWalletId)) {
      showToast("Vui lòng chọn ví hợp lệ", "error");
      return;
    }

    const newTrans: Transaction = {
      id: Date.now(),
      type,
      walletId: selectedWalletId,
      amount: parseFloat(amount),
      category: type === "income" ? "salary" : category,
      note,
      date: new Date().toLocaleDateString("vi-VN"),
      rawDate: Date.now(),
    };
    setTransactions([newTrans, ...transactions]);
    setAmount("");
    setNote("");
    setView("overview");
    showToast("Giao dịch đã được lưu!", "success");
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    showToast("Đã xóa giao dịch", "success");
  };

  const handleClearAllData = () => {
    confirmAction(
      "Reset toàn bộ dữ liệu?",
      "Tất cả ví, giao dịch và cài đặt sẽ bị xóa sạch. Không thể khôi phục được.",
      () => {
        setTransactions([]);
        setWallets(DEFAULT_WALLETS);
        showToast("Đã reset về mặc định", "info");
      },
    );
  };

  const handleAdjustBalance = () => {
    const actual = parseFloat(actualMoney);
    if (isNaN(actual)) return;

    const currentTargetBalance = walletBalances[adjustWalletId] || 0;
    const diff = actual - currentTargetBalance;

    if (diff === 0) {
      setShowAdjustModal(false);
      return;
    }

    const wName = wallets.find((w) => w.id === adjustWalletId)?.name || "Ví";
    const adjustmentTrans: Transaction = {
      id: Date.now(),
      type: diff > 0 ? "income" : "expense",
      walletId: adjustWalletId,
      amount: Math.abs(diff),
      category: "other",
      note: `⚖️ Cân bằng ví ${wName}`,
      date: new Date().toLocaleDateString("vi-VN"),
      rawDate: Date.now(),
    };
    setTransactions([adjustmentTrans, ...transactions]);
    setShowAdjustModal(false);
    setActualMoney("");
    showToast("Cân bằng số dư thành công!", "success");
  };

  const formatMoney = (num: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  const formatUSD = (vnd: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(vnd / EXCHANGE_RATE);

  // --- TRANSFER LOGIC ---
  const handleTransfer = () => {
    // 1. Validate
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showToast("Vui lòng nhập số tiền hợp lệ", "error");
      return;
    }
    if (transferFromId === transferToId) {
      showToast("Ví nguồn và ví đích không được trùng nhau", "error");
      return;
    }
    if (!transferFromId || !transferToId) {
      showToast("Vui lòng chọn đầy đủ ví nguồn và đích", "error");
      return;
    }

    const amountNum = parseFloat(transferAmount);

    // Kiểm tra số dư ví nguồn (Tùy chọn, nếu muốn cho phép âm thì bỏ qua)
    const sourceBalance = walletBalances[transferFromId] || 0;
    if (sourceBalance < amountNum) {
      confirmAction(
        "Số dư không đủ",
        "Ví nguồn không đủ tiền. Ví sẽ bị âm sau khi chuyển. Bạn có muốn tiếp tục?",
        () => executeTransfer(amountNum),
      );
    } else {
      executeTransfer(amountNum);
    }
  };

  const executeTransfer = (amountNum: number) => {
    const fromWalletName = wallets.find((w) => w.id === transferFromId)?.name;
    const toWalletName = wallets.find((w) => w.id === transferToId)?.name;
    const timeNow = Date.now();
    const dateStr = new Date().toLocaleDateString("vi-VN");

    // Tạo 2 giao dịch: 1 Chi (Expense) ở ví nguồn, 1 Thu (Income) ở ví đích
    const expenseTrans: Transaction = {
      id: timeNow,
      type: "expense",
      walletId: transferFromId,
      amount: amountNum,
      category: "transfer", // Hoặc tạo category 'transfer' riêng
      note: `Chuyển tiền đến ${toWalletName} ${transferNote ? `(${transferNote})` : ""}`,
      date: dateStr,
      rawDate: timeNow,
    };

    const incomeTrans: Transaction = {
      id: timeNow + 1, // ID khác nhau chút xíu
      type: "income",
      walletId: transferToId,
      amount: amountNum,
      category: "other",
      note: `Nhận tiền từ ${fromWalletName} ${transferNote ? `(${transferNote})` : ""}`,
      date: dateStr,
      rawDate: timeNow,
    };

    setTransactions([incomeTrans, expenseTrans, ...transactions]);
    setTransferAmount("");
    setTransferNote("");
    setView("overview");
    showToast("Chuyển tiền thành công!", "success");
  };

  // Hàm hoán đổi vị trí 2 ví
  const handleSwapWallets = () => {
    setTransferFromId(transferToId);
    setTransferToId(transferFromId);
  };

  // --- LOGIC SAO KÊ (STATEMENT) ---
  const statementData = useMemo(() => {
    let data = [...transactions].sort((a, b) => b.rawDate - a.rawDate);

    // 1. Lọc theo Ví
    if (stmtWalletId !== "all") {
      data = data.filter((t) => t.walletId === stmtWalletId);
    }

    // 2. Lọc theo Thời gian
    const now = new Date();
    if (stmtTime === "this_month") {
      data = data.filter((t) => {
        const d = new Date(t.rawDate);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else if (stmtTime === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      data = data.filter((t) => {
        const d = new Date(t.rawDate);
        return (
          d.getMonth() === lastMonth.getMonth() &&
          d.getFullYear() === lastMonth.getFullYear()
        );
      });
    }

    // 3. Tính toán tổng
    const totalIn = data
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOut = data
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Group theo ngày (Để hiển thị đẹp)
    const grouped: Record<string, Transaction[]> = {};
    data.forEach((t) => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });

    return { data, totalIn, totalOut, grouped };
  }, [transactions, stmtWalletId, stmtTime]);

  // Hàm Xuất File Excel (.xlsx) - Cần cài: npm install xlsx
  const handleExportExcel = () => {
    if (statementData.data.length === 0) {
      showToast("Không có dữ liệu để xuất", "error");
      return;
    }

    // 1. Chuẩn bị dữ liệu (Map từ Transaction sang dạng bảng)
    const excelData = statementData.data.map((t) => {
      const wName = wallets.find((w) => w.id === t.walletId)?.name || "Đã xóa";
      const catName =
        CATEGORIES.find((c) => c.id === t.category)?.label || t.category;

      return {
        "Mã GD": t.id,
        Ngày: t.date,
        Loại: t.type === "income" ? "Thu nhập" : "Chi tiêu",
        "Số tiền": t.amount, // Giữ nguyên số để Excel tính toán được
        "Danh mục": catName,
        Ví: wName,
        "Ghi chú": t.note || "",
      };
    });

    // 2. Tạo Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 3. Cấu hình độ rộng cột (Optional - cho đẹp)
    worksheet["!cols"] = [
      { wch: 15 }, // Mã GD
      { wch: 12 }, // Ngày
      { wch: 10 }, // Loại
      { wch: 15 }, // Số tiền
      { wch: 15 }, // Danh mục
      { wch: 15 }, // Ví
      { wch: 30 }, // Ghi chú
    ];

    // 4. Tạo Workbook và thêm Sheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sao Kê Chi Tiêu");

    // 5. Xuất file (Tự động tải xuống)
    const fileName = `OverDesk_SaoKe_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast("Đã xuất file Excel (.xlsx) thành công!", "success");
  };

  // --- RENDER HELPERS ---
  const renderLineChart = () => {
    const maxVal = Math.max(
      ...trendData.map((d) => Math.max(d.inc, d.exp)),
      100,
    );
    const width = 100;
    const height = 50;
    const getPoints = (type: "inc" | "exp") =>
      trendData
        .map(
          (d, i) =>
            `${(i / (trendData.length - 1)) * width},${height - ((type === "inc" ? d.inc : d.exp) / maxVal) * height}`,
        )
        .join(" ");
    const getArea = (type: "inc" | "exp") =>
      `M ${getPoints(type).split(" ")[0]} L ${getPoints(type).replace(/ /g, " L ")} L ${width},${height} L 0,${height} Z`;
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="1" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={getArea("inc")} fill="url(#gInc)" />
        <polyline
          points={getPoints("inc")}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <path d={getArea("exp")} fill="url(#gExp)" />
        <polyline
          points={getPoints("exp")}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const renderDonut = () => {
    if (totalExpense === 0)
      return (
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
      );
    return chartData.map((slice, i) => {
      if (slice.val / totalExpense >= 0.999)
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={slice.color}
          />
        );
      const x1 = Math.cos(2 * Math.PI * (slice.start / 360));
      const y1 = Math.sin(2 * Math.PI * (slice.start / 360));
      const x2 = Math.cos(2 * Math.PI * (slice.end / 360));
      const y2 = Math.sin(2 * Math.PI * (slice.end / 360));
      const largeArc = slice.end - slice.start > 180 ? 1 : 0;
      const path = `M ${50 + 40 * x1} ${50 + 40 * y1} A 40 40 0 ${largeArc} 1 ${50 + 40 * x2} ${50 + 40 * y2}`;
      return (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className={`${slice.color} hover:opacity-80 transition-opacity cursor-pointer`}
        />
      );
    });
  };

  const numericValue = Number(actualMoney);
  const isValid =
    actualMoney.trim() !== "" && // Không được để trống
    !isNaN(numericValue) && // Phải là số
    numericValue >= 0 && // Phải lớn hơn hoặc bằng 0 (Tiền thực tế không thể âm)
    adjustWalletId !== ""; // Phải chọn ví

  const numericValueInit = Number(wInitial);
  const isValidInit =
    wInitial.trim() !== "" && // Không được để trống
    !isNaN(numericValueInit) && // Phải là số
    numericValueInit >= 1000; // Phải lớn hơn hoặc bằng 0 (Tiền thực tế không thể âm)

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans relative overflow-hidden select-none">
      {/* --- CONFIRM MODAL (CUSTOM POPUP) --- */}
      {confirmConfig.isOpen && (
        <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-[#1e293b] border border-white/10 rounded-2xl p-5 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {confirmConfig.title}
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {confirmConfig.message}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() =>
                    setConfirmConfig({ ...confirmConfig, isOpen: false })
                  }
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DRAWER: WALLET MANAGER --- */}
      {showWalletDrawer && (
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
              {walletDetails.map((w) => (
                <div
                  key={w.id}
                  className="bg-white/5 rounded-xl border border-white/5 p-3 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg bg-white/10 ${w.color}`}
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
                        <div className="font-bold text-sm text-white">
                          {w.name}
                        </div>
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
                {editingWallet
                  ? `Chỉnh sửa: ${editingWallet.name}`
                  : "Thêm ví mới"}
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
      )}

      {/* HEADER */}
      <div className="flex-none p-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWalletDrawer(true)}
            className="p-2 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20 text-white hover:scale-105 transition-transform"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="font-bold text-sm leading-tight">Budget Pro</h2>
            <div
              className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer hover:text-white transition-colors"
              onClick={() => setFilter(filter === "month" ? "all" : "month")}
            >
              <Calendar size={10} />{" "}
              {filter === "month" ? "Tháng này" : "Tất cả"}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 border border-white/5">
          <button
            onClick={handleClearAllData}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Reset toàn bộ"
          >
            <BrushCleaning size={18} />
          </button>
          <div className="w-[0.5px] h-6 bg-slate-600"></div>
          <button
            onClick={() => setView("overview")}
            className={`p-1.5 rounded-md transition-all  ${view === "overview" ? "bg-slate-700 text-white shadow-inner" : "text-slate-500 hover:text-slate-400 hover:bg-white/5"}`}
          >
            <PieChart size={18} />
          </button>
          <button
            onClick={() => setView("add")}
            className={`p-1.5 rounded-md transition-all  ${view === "add" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-500 hover:text-blue-400 hover:bg-white/5"}`}
          >
            <Plus size={18} />
          </button>
          <div className="w-[0.5px] h-6 bg-slate-600"></div>
          <button
            onClick={() => setView("transaction")}
            className={`p-1.5 rounded-md transition-all  ${view === "transaction" ? "bg-orange-600 text-white shadow-lg shadow-orage-500/30" : "text-slate-500 hover:text-orange-400 hover:bg-white/5"}`}
          >
            <Repeat size={18} />
          </button>
          <div className="w-[0.5px] h-6 bg-slate-600"></div>
          <button
            onClick={() => setView("statement")}
            className={`p-1.5 rounded-md transition-all  ${view === "statement" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-slate-500 hover:text-purple-400 hover:bg-white/5"}`}
            title="Sao kê giao dịch"
          >
            <FileText size={18} />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 ${showAdjustModal ? "overflow-y-hidden" : "overflow-y-auto"} custom-scrollbar p-4 relative z-10 pb-24`}
      >
        {/* ADJUST MODAL */}
        {showAdjustModal && !showWalletDrawer && (
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
                {wallets.map((w) => (
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
                  <span className="text-xs text-slate-400">
                    Trên App đang tính:
                  </span>
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
        )}

        {/* OVERVIEW VIEW */}
        {view === "overview" && (
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
                      className="flex items-center justify-end gap-1 cursor-pointer group/edit"
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
                {walletDetails.map((w) => (
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
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>{" "}
                    Chi
                  </span>
                </div>
              </div>
              <div className="h-24 w-full relative">
                {renderLineChart()}
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[8px] text-slate-400 mt-1 px-1">
                  {trendData.map((d, i) => (
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
                  <span className="text-slate-500 font-bold uppercase">
                    Chi tiêu
                  </span>
                  <span className="text-white font-mono font-bold">
                    {formatMoney(totalExpense)}
                  </span>
                </div>
                {chartData.length > 0 ? (
                  chartData.slice(0, 3).map((item, idx) => (
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
                  filteredTrans.slice(0, 10).map((t) => {
                    const cat = CATEGORIES.find((c) => c.id === t.category);
                    const Icon = cat?.icon || Wallet;
                    const wInfo = wallets.find((w) => w.id === t.walletId);
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
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setType("expense")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === "expense" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500"}`}
              >
                <Minus size={16} /> Chi tiêu
              </button>
              <button
                onClick={() => setType("income")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500"}`}
              >
                <Plus size={16} /> Thu nhập
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Chọn Ví
              </label>
              <div
                ref={addViewScrollRef} // Áp dụng scroll ngang
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              >
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`flex-none p-3 min-w-[100px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedWalletId === w.id ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-white/5 border-transparent text-slate-500 opacity-60 hover:opacity-100"}`}
                  >
                    {w.type === "online" ? (
                      <CreditCard size={18} />
                    ) : w.type === "cash" ? (
                      <Banknote size={18} />
                    ) : (
                      <Briefcase size={18} />
                    )}
                    <span className="text-xs font-bold truncate max-w-full">
                      {w.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowWalletDrawer(true)}
                  className="p-3 rounded-xl border border-dashed border-white/20 text-slate-500 flex items-center justify-center hover:text-white hover:border-white/40 flex-shrink-0"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="relative group">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Số tiền (VND)
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-4xl font-mono font-bold text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all placeholder:text-slate-700"
              />

              {/* [MỚI] THANH GỢI Ý MỨC GIÁ */}
              <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-hide">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setAmount(item.value.toString())}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 hover:border-blue-500/50 transition-all whitespace-nowrap active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {type === "expense" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Danh mục
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    if (cat.id === "transfer") return;
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${isSelected ? `bg-slate-700 border-slate-500 text-white shadow-lg scale-105` : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300"}`}
                      >
                        <Icon
                          size={20}
                          className={`mb-1.5 ${isSelected ? "text-white" : cat.color}`}
                        />
                        <span className="text-[9px] font-bold">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Ghi chú
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Ăn sáng..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* TRANSACTION VIEW */}
        {view === "transaction" && (
          <div className="h-full flex flex-col relative animate-in slide-in-from-right-10 duration-300">
            {wallets.length < 2 ? (
              // --- TRƯỜNG HỢP KHÔNG ĐỦ VÍ ---
              <div className="flex flex-col items-center justify-center h-full text-center p-8 pb-20">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Wallet size={40} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">
                  Cần thêm ví
                </h3>
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
                            .filter((w) => (walletBalances[w.id] || 0) > 0)
                            // ----------------------------
                            .map((w) => {
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
                                    ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"}
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
                                      <Check
                                        size={14}
                                        className="text-blue-400"
                                      />
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
                          {wallets.map((w) => {
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
                                  ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"}
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
                                    <Check
                                      size={14}
                                      className="text-emerald-400"
                                    />
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
                          50000, 100000, 200000, 500000, 1000000, 5000000,
                          10000000,
                        ].map((val) => (
                          <button
                            key={val}
                            onClick={() => setTransferAmount(val.toString())}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-400 hover:text-white transition-colors flex-shrink-0"
                          >
                            {val >= 1000000
                              ? val / 1000000 + "Tr"
                              : val / 1000 + "k"}
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
                    disabled={
                      !transferAmount || !transferFromId || !transferToId
                    }
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
        )}

        {/* VIEW: SAO KÊ (STATEMENT) */}
        {view === "statement" && (
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
                Object.entries(statementData.grouped).map(([date, items]) => (
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
                      {items.map((t) => {
                        const cat = CATEGORIES.find((c) => c.id === t.category);
                        const Icon = cat?.icon || Wallet;
                        const wInfo = wallets.find((w) => w.id === t.walletId);

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
                                    (t.type === "income"
                                      ? "Thu nhập"
                                      : cat?.label)}
                                  {wInfo && (
                                    <span className="text-[8px] px-1 bg-white/10 rounded text-slate-400 font-normal">
                                      {wInfo.name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {t.type === "income"
                                    ? "Nguồn thu"
                                    : cat?.label}
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
        )}
      </div>

      {/* --- FIXED BOTTOM BUTTON (Moved Outside Scrollable Area) --- */}
      {view === "add" && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-40">
          <button
            onClick={handleAddTransaction}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${type === "income" ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-400 shadow-red-500/20"}`}
          >
            {type === "income" ? "Lưu Thu Nhập" : "Lưu Chi Tiêu"}{" "}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT CUSTOM SELECT CHO FILTER ---
const WalletFilterSelect = ({
  value,
  onChange,
  wallets,
}: {
  value: string;
  onChange: (val: string) => void;
  wallets: WalletItem[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Thêm state lưu vị trí menu
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Xử lý click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // Thêm sự kiện scroll để đóng menu khi cuộn (tránh menu trôi lơ lửng)
    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true); // true để bắt sự kiện scroll ở mọi div
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  // Tính toán vị trí khi mở menu
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // Cách nút bấm 8px
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedLabel =
    value === "all"
      ? "Tất cả ví"
      : wallets.find((w) => w.id === value)?.name || "Chọn ví";

  return (
    <div className="relative min-w-[140px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-purple-500/50 ${isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Wallet size={14} className="text-purple-400 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* MENU DÙNG FIXED POSITION (Thoát khỏi overflow) */}
      {isOpen && (
        // Dùng createPortal nếu có thể, nhưng ở đây dùng fixed trực tiếp cũng ổn cho trường hợp đơn giản
        <div
          className="fixed z-[9999] bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <button
            onClick={() => {
              onChange("all");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors ${value === "all" ? "bg-purple-600/20 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
          >
            <span>Tất cả ví</span>
            {value === "all" && <Check size={12} />}
          </button>

          <div className="h-px bg-white/5 mx-2 my-1"></div>

          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                onChange(w.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors ${value === w.id ? "bg-purple-600/20 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${w.color.replace("text-", "bg-")}`}
                ></div>
                <span className="truncate">{w.name}</span>
              </div>
              {value === w.id && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
