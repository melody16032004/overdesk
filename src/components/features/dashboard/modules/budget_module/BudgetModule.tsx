import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  PieChart,
  ArrowRight,
  Calendar,
  Menu,
  Repeat,
  FileText,
  BrushCleaning,
} from "lucide-react";
import { useToastStore } from "../../../../../stores/useToastStore";
import { DEFAULT_WALLETS, CATEGORIES } from "./constants/budget_const";
import {
  WalletItem,
  Transaction,
  TimeFilter,
  TransactionType,
  WalletType,
} from "./types/budget_type";
import { useHorizontalScroll } from "./hooks/useScroll";
import { Drawer } from "./components/Drawer";
import { ConfirmModal } from "./components/ConfirmModal";
import { AdjustModal } from "./components/AdjustModal";
import { Overview } from "./components/Overview";
import { AddView } from "./components/AddView";
import { StatementView } from "./components/StatementView";
import { TransactionView } from "./components/TransactionView";

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
          className={`${slice.color} hover:opacity-80 transition-opacity pointer`}
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
        <ConfirmModal
          confirmConfig={confirmConfig}
          setConfirmConfig={setConfirmConfig}
        />
      )}

      {/* --- DRAWER: WALLET MANAGER --- */}
      {showWalletDrawer && (
        <Drawer
          setShowWalletDrawer={setShowWalletDrawer}
          setShowAdjustModal={setShowAdjustModal}
          setWName={setWName}
          setWInitial={setWInitial}
          setWType={setWType}
          setEditingWallet={setEditingWallet}
          walletDetails={walletDetails}
          handleEditWalletBtn={handleEditWalletBtn}
          handleDeleteWallet={handleDeleteWallet}
          editingWallet={editingWallet}
          wName={wName}
          wType={wType}
          wInitial={wInitial}
          handleCancelEditWallet={handleCancelEditWallet}
          isValidInit={isValidInit}
          handleSaveWallet={handleSaveWallet}
        />
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
              className="flex items-center gap-1 text-[10px] text-slate-400 pointer hover:text-white transition-colors"
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
          <AdjustModal
            setShowAdjustModal={setShowAdjustModal}
            setActualMoney={setActualMoney}
            setAdjustWalletId={setAdjustWalletId}
            wallets={wallets}
            walletBalances={walletBalances}
            adjustWalletId={adjustWalletId}
            actualMoney={actualMoney}
            isValid={isValid}
            handleAdjustBalance={handleAdjustBalance}
          />
        )}

        {/* OVERVIEW VIEW */}
        {view === "overview" && (
          <Overview
            isNegativeBalance={isNegativeBalance}
            setShowAdjustModal={setShowAdjustModal}
            totalBalance={totalBalance}
            isEditingBudget={isEditingBudget}
            budgetLimit={budgetLimit}
            setBudgetLimit={setBudgetLimit}
            setIsEditingBudget={setIsEditingBudget}
            overviewScrollRef={overviewScrollRef}
            walletDetails={walletDetails}
            setShowWalletDrawer={setShowWalletDrawer}
            spendingPercent={spendingPercent}
            leftBudget={leftBudget}
            chartData={chartData}
            insight={insight}
            renderLineChart={renderLineChart}
            trendData={trendData}
            renderDonut={renderDonut}
            totalExpense={totalExpense}
            filteredTrans={filteredTrans}
            wallets={wallets}
            handleDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <AddView
            setType={setType}
            type={type}
            addViewScrollRef={addViewScrollRef}
            wallets={wallets}
            setSelectedWalletId={setSelectedWalletId}
            selectedWalletId={selectedWalletId}
            setShowWalletDrawer={setShowWalletDrawer}
            amount={amount}
            setAmount={setAmount}
            category={category}
            setCategory={setCategory}
            note={note}
            setNote={setNote}
          />
        )}

        {/* TRANSACTION VIEW */}
        {view === "transaction" && (
          <TransactionView
            wallets={wallets}
            setShowWalletDrawer={setShowWalletDrawer}
            transferFromRef={transferFromRef}
            walletBalances={walletBalances}
            transferFromId={transferFromId}
            transferToId={transferToId}
            setTransferFromId={setTransferFromId}
            handleSwapWallets={handleSwapWallets}
            transferToRef={transferToRef}
            setTransferToId={setTransferToId}
            transferAmount={transferAmount}
            setTransferAmount={setTransferAmount}
            transferNote={transferNote}
            setTransferNote={setTransferNote}
            handleTransfer={handleTransfer}
          />
        )}

        {/* VIEW: SAO KÊ (STATEMENT) */}
        {view === "statement" && (
          <StatementView
            stmtWalletId={stmtWalletId}
            setStmtWalletId={setStmtWalletId}
            wallets={wallets}
            setStmtTime={setStmtTime}
            stmtTime={stmtTime}
            statementData={statementData}
            handleExportExcel={handleExportExcel}
          />
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
