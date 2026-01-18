import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  PieChart as PieIcon,
  DollarSign,
  Eye,
  EyeOff,
  Download,
  Coins,
  Banknote,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

// --- TYPES ---
type AssetType = "crypto" | "stock" | "cash";

interface Asset {
  id: string;
  symbol: string;
  apiId: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  manualPrice?: number;
  type: AssetType;
}

interface MarketData {
  [key: string]: {
    price: number;
    change24h: number;
  };
}

// --- CONFIG ---
const COLORS = [
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

const TYPE_COLORS: Record<AssetType, string> = {
  crypto: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  stock: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  cash: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

const INITIAL_ASSETS: Asset[] = [
  {
    id: "1",
    symbol: "BTC",
    apiId: "bitcoin",
    name: "Bitcoin",
    quantity: 0.15,
    avgBuyPrice: 42000,
    type: "crypto",
  },
  {
    id: "2",
    symbol: "ETH",
    apiId: "ethereum",
    name: "Ethereum",
    quantity: 2.5,
    avgBuyPrice: 2100,
    type: "crypto",
  },
  {
    id: "3",
    symbol: "USDT",
    apiId: "tether",
    name: "Tether",
    quantity: 5000,
    avgBuyPrice: 1,
    type: "cash",
  },
];

export const PortfolioModule = () => {
  // --- STATE ---
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_portfolio");
      return saved ? JSON.parse(saved) : INITIAL_ASSETS;
    } catch (e) {
      return INITIAL_ASSETS;
    }
  });

  const [marketData, setMarketData] = useState<MarketData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // New States
  const [hideBalance, setHideBalance] = useState(false); // Privacy Mode
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: "crypto",
    apiId: "",
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("dashboard_portfolio", JSON.stringify(assets));
  }, [assets]);

  // --- API FETCHING ---
  const fetchPrices = async () => {
    setIsLoading(true);
    const cryptoIds = assets
      .filter((a) => a.type === "crypto" && a.apiId !== "manual")
      .map((a) => a.apiId)
      .join(",");

    if (!cryptoIds) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await res.json();

      const newMarketData: MarketData = {};
      Object.keys(data).forEach((key) => {
        newMarketData[key] = {
          price: data[key].usd,
          change24h: data[key].usd_24h_change,
        };
      });

      setMarketData((prev) => ({ ...prev, ...newMarketData }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [assets.length]);

  // --- LOGIC & CALCULATIONS ---
  const stats = useMemo(() => {
    let totalBalance = 0;
    let totalCost = 0;
    let chartData: { name: string; value: number }[] = [];
    let typeAllocation = { crypto: 0, stock: 0, cash: 0 };

    assets.forEach((asset) => {
      const currentPrice =
        asset.apiId === "manual"
          ? asset.manualPrice || asset.avgBuyPrice
          : marketData[asset.apiId]?.price || asset.avgBuyPrice;

      const value = currentPrice * asset.quantity;
      const cost = asset.avgBuyPrice * asset.quantity;

      totalBalance += value;
      totalCost += cost;

      // Tính allocation theo loại tài sản
      if (asset.type in typeAllocation) {
        typeAllocation[asset.type] += value;
      }

      chartData.push({ name: asset.symbol, value });
    });

    const totalPnL = totalBalance - totalCost;
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    chartData.sort((a, b) => b.value - a.value);

    return {
      totalBalance,
      totalCost,
      totalPnL,
      pnlPercent,
      chartData,
      typeAllocation,
    };
  }, [assets, marketData]);

  // --- FORMATTERS ---
  const formatCurrency = (val: number) => {
    if (hideBalance) return "******";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatPercent = (val: number) => {
    const icon =
      val >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />;
    const color = val >= 0 ? "text-emerald-400" : "text-rose-400";
    return (
      <span className={`flex items-center gap-0.5 ${color}`}>
        {icon} {Math.abs(val).toFixed(2)}%
      </span>
    );
  };

  // --- ACTIONS ---
  const handleAddAsset = () => {
    if (!newAsset.symbol || !newAsset.quantity || !newAsset.avgBuyPrice) return;

    const asset: Asset = {
      id: Date.now().toString(),
      symbol: newAsset.symbol.toUpperCase(),
      name: newAsset.name || newAsset.symbol.toUpperCase(),
      apiId: newAsset.apiId || "manual",
      quantity: Number(newAsset.quantity),
      avgBuyPrice: Number(newAsset.avgBuyPrice),
      type: (newAsset.type as AssetType) || "crypto",
      manualPrice: newAsset.manualPrice
        ? Number(newAsset.manualPrice)
        : undefined,
    };

    setAssets([...assets, asset]);
    setShowAddModal(false);
    setNewAsset({ type: "crypto", apiId: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove asset?")) setAssets(assets.filter((a) => a.id !== id));
  };

  // Feature: Export CSV
  const handleExportCSV = () => {
    const headers =
      "Symbol,Name,Type,Quantity,AvgPrice,CurrentPrice,Value,PnL\n";
    const rows = assets.map((a) => {
      const price =
        a.apiId === "manual"
          ? a.manualPrice || a.avgBuyPrice
          : marketData[a.apiId]?.price || a.avgBuyPrice;
      const value = price * a.quantity;
      const pnl = value - a.avgBuyPrice * a.quantity;
      return `${a.symbol},${a.name},${a.type},${a.quantity},${a.avgBuyPrice},${price},${value},${pnl}`;
    });
    const csvContent =
      "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfolio_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div>
          <div className="font-bold text-white flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Wallet size={20} className="text-blue-500" />
            </div>
            <span>Portfolio</span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
            <span className={isLoading ? "animate-pulse text-blue-400" : ""}>
              {lastUpdated
                ? `Sync: ${lastUpdated.toLocaleTimeString()}`
                : "Offline"}
            </span>
            <button
              onClick={fetchPrices}
              className="p-1 hover:bg-slate-700 rounded-full transition-all"
            >
              <RefreshCw
                size={10}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
            title="Toggle Privacy"
          >
            {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all hidden md:flex"
            title="Export CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={16} />{" "}
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </div>

      {/* 2. BODY SCROLL */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NET WORTH CARD */}
          <div className="bg-[#1e293b] p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 bg-blue-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
              Net Worth
              <DollarSign size={16} className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(stats.totalBalance)}
            </div>

            {/* Feature: Allocation Bar */}
            <div
              className="flex h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden"
              title="Orange: Crypto | Blue: Stock | Green: Cash"
            >
              <div
                className="h-full bg-orange-500"
                style={{
                  width: `${
                    (stats.typeAllocation.crypto / stats.totalBalance) * 100
                  }%`,
                }}
              ></div>
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${
                    (stats.typeAllocation.stock / stats.totalBalance) * 100
                  }%`,
                }}
              ></div>
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${
                    (stats.typeAllocation.cash / stats.totalBalance) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* PROFIT/LOSS CARD */}
          <div className="bg-[#1e293b] p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div
              className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-all ${
                stats.totalPnL >= 0
                  ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                  : "bg-rose-500/10 group-hover:bg-rose-500/20"
              }`}
            ></div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
              24h Profit/Loss
              {stats.totalPnL >= 0 ? (
                <TrendingUp size={16} className="text-emerald-500" />
              ) : (
                <TrendingDown size={16} className="text-rose-500" />
              )}
            </div>
            <div
              className={`text-3xl font-bold tracking-tight ${
                stats.totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {stats.totalPnL >= 0 ? "+" : ""}
              {formatCurrency(stats.totalPnL)}
            </div>
            <div className="mt-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  stats.totalPnL >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {stats.totalPnL >= 0 ? "+" : ""}
                {stats.pnlPercent.toFixed(2)}% All Time
              </span>
            </div>
          </div>

          {/* TOP HOLDING CARD */}
          <div className="bg-[#1e293b] p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Dominance
            </div>
            <div className="text-2xl font-bold text-white truncate flex items-center gap-2">
              {stats.chartData[0]?.name || "N/A"}
              <span className="text-lg text-slate-500 font-medium">
                {stats.totalBalance > 0
                  ? (
                      (stats.chartData[0]?.value / stats.totalBalance) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Largest single asset allocation
            </div>
          </div>
        </div>

        {/* CHART & LIST SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ASSET LIST (Responsive: Table on Desktop, Cards on Mobile) */}
          <div className="xl:col-span-2 bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center gap-2">
              <Coins size={18} className="text-yellow-500" /> Your Assets
            </div>

            <div className="flex-1 overflow-x-auto">
              {/* DESKTOP TABLE */}
              <table className="w-full text-left border-collapse min-w-[600px] hidden md:table">
                <thead className="bg-[#0f172a] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 rounded-tl-lg">Asset</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-right">Holdings</th>
                    <th className="p-4 text-right">Total Value</th>
                    <th className="p-4 text-center rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {assets.map((asset) => {
                    const price =
                      asset.apiId === "manual"
                        ? asset.manualPrice || asset.avgBuyPrice
                        : marketData[asset.apiId]?.price || asset.avgBuyPrice;
                    const change24h = marketData[asset.apiId]?.change24h || 0;
                    const value = price * asset.quantity;
                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                TYPE_COLORS[asset.type]
                              }`}
                            >
                              {asset.type === "crypto" ? (
                                <Coins size={16} />
                              ) : asset.type === "stock" ? (
                                <Building2 size={16} />
                              ) : (
                                <Banknote size={16} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white">
                                {asset.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {asset.symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-medium text-white">
                            {formatCurrency(price)}
                          </div>
                          {asset.apiId !== "manual" && formatPercent(change24h)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-white">{asset.quantity}</div>
                          <div className="text-xs text-slate-500">
                            Avg: {formatCurrency(asset.avgBuyPrice)}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-white">
                          {formatCurrency(value)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden p-4 space-y-3">
                {assets.map((asset) => {
                  const price =
                    asset.apiId === "manual"
                      ? asset.manualPrice || asset.avgBuyPrice
                      : marketData[asset.apiId]?.price || asset.avgBuyPrice;
                  const change24h = marketData[asset.apiId]?.change24h || 0;
                  const value = price * asset.quantity;
                  return (
                    <div
                      key={asset.id}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                            TYPE_COLORS[asset.type]
                          }`}
                        >
                          {asset.type === "crypto" ? (
                            <Coins size={20} />
                          ) : asset.type === "stock" ? (
                            <Building2 size={20} />
                          ) : (
                            <Banknote size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {asset.symbol}
                          </div>
                          <div className="text-xs text-slate-400">
                            {asset.quantity} • {formatCurrency(price)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {formatCurrency(value)}
                        </div>
                        {asset.apiId !== "manual" && (
                          <div className="flex justify-end">
                            {formatPercent(change24h)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="ml-2 p-2 text-slate-600 hover:text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {assets.length === 0 && (
                <div className="p-10 text-center text-slate-500 italic">
                  No assets. Click 'Add Asset' to start.
                </div>
              )}
            </div>
          </div>

          {/* CHART */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl p-6 flex flex-col h-[350px] xl:h-auto">
            <div className="font-bold text-white mb-2 flex items-center gap-2">
              <PieIcon size={18} className="text-purple-500" /> Allocation
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#1e293b"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* CENTER LABEL */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                  <div className="text-xs text-slate-500 font-bold uppercase">
                    Total
                  </div>
                  <div className="text-sm font-bold text-white">
                    {stats.chartData.length} Assets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={20} className="text-blue-500" /> Add Asset
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Symbol
                  </label>
                  <input
                    value={newAsset.symbol || ""}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, symbol: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="BTC"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Type
                  </label>
                  <select
                    value={newAsset.type}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, type: e.target.value as any })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
                  <span>CoinGecko ID (For Auto-Sync)</span>
                  <a
                    href="https://www.coingecko.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Search size={10} /> Search ID
                  </a>
                </label>
                <input
                  value={newAsset.apiId || ""}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, apiId: e.target.value })
                  }
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. bitcoin"
                />
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Leave empty to use manual price.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newAsset.quantity || ""}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Avg Buy Price ($)
                  </label>
                  <input
                    type="number"
                    value={newAsset.avgBuyPrice || ""}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        avgBuyPrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all"
              >
                Save Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
