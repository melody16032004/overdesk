import { useState, useMemo } from "react";
import {
  Calculator,
  Home,
  DollarSign,
  Table2,
  BarChart3,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --- TYPES ---
type Tab = "loan" | "buy-vs-rent";

interface LoanSchedule {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

// --- COMPONENT ---
export const LoanModule = () => {
  const [activeTab, setActiveTab] = useState<Tab>("loan");

  // --- STATE: LOAN CALCULATOR ---
  const [loanAmount, setLoanAmount] = useState(200000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(1);

  // --- STATE: BUY VS RENT ---
  const [homePrice, setHomePrice] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [monthlyRent, setMonthlyRent] = useState(1500);
  const [investmentReturn, setInvestmentReturn] = useState(8);
  const [homeAppreciation, setHomeAppreciation] = useState(3);

  // --- HELPERS ---
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  // --- LOGIC 1: LOAN SCHEDULE (EMI) ---
  const loanData = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;

    const emi =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - loanAmount;

    let balance = loanAmount;
    const schedule: LoanSchedule[] = [];
    const chartData = [];

    for (let i = 1; i <= totalMonths; i++) {
      const interest = balance * monthlyRate;
      const principal = emi - interest;
      balance -= principal;
      if (balance < 0) balance = 0;

      schedule.push({ month: i, payment: emi, interest, principal, balance });

      if (i % 12 === 0 || i === 1) {
        chartData.push({
          year: Math.ceil(i / 12),
          balance: Math.round(balance),
          paidPrincipal: Math.round(loanAmount - balance),
          paidInterest: Math.round(emi * i - (loanAmount - balance)),
        });
      }
    }

    return { emi, totalPayment, totalInterest, schedule, chartData };
  }, [loanAmount, interestRate, loanTerm]);

  // --- LOGIC 2: BUY VS RENT SIMULATION ---
  const compareData = useMemo(() => {
    const years = 30;
    const data = [];

    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanPrincipal = homePrice - downPayment;

    const r = mortgageRate / 100 / 12;
    const n = 30 * 12;
    const emi =
      (loanPrincipal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const maintenanceRate = 0.01;

    let rentInvestment = downPayment;

    let currentHomeValue = homePrice;
    let currentRent = monthlyRent;
    let loanBalance = loanPrincipal;

    for (let i = 1; i <= years; i++) {
      currentHomeValue = currentHomeValue * (1 + homeAppreciation / 100);

      const monthsPassed = i * 12;
      const remainingN = n - monthsPassed;
      if (remainingN > 0) {
        loanBalance =
          (emi * (Math.pow(1 + r, remainingN) - 1)) /
          (r * Math.pow(1 + r, remainingN));
      } else {
        loanBalance = 0;
      }

      const buyNetWorth = currentHomeValue - loanBalance;

      const yearlyBuyCost = emi * 12 + currentHomeValue * maintenanceRate;
      const yearlyRentCost = currentRent * 12;

      const difference = yearlyBuyCost - yearlyRentCost;

      rentInvestment =
        rentInvestment * (1 + investmentReturn / 100) + difference;

      currentRent = currentRent * 1.03;

      data.push({
        year: i,
        BuyNetWorth: Math.round(buyNetWorth),
        RentNetWorth: Math.round(rentInvestment),
      });
    }

    return data;
  }, [
    homePrice,
    downPaymentPercent,
    mortgageRate,
    monthlyRent,
    investmentReturn,
    homeAppreciation,
  ]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <Calculator size={24} className="text-emerald-500" /> Financial
          Simulator
        </div>
        <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#3e3e42]">
          <button
            onClick={() => setActiveTab("loan")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "loan"
                ? "bg-emerald-600 text-white"
                : "hover:text-white"
            }`}
          >
            <DollarSign size={14} /> EMI Loan
          </button>
          <button
            onClick={() => setActiveTab("buy-vs-rent")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "buy-vs-rent"
                ? "bg-blue-600 text-white"
                : "hover:text-white"
            }`}
          >
            <Home size={14} /> Buy vs Rent
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        {/* === TAB 1: LOAN CALCULATOR === */}
        {activeTab === "loan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* INPUTS */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#252526] p-5 rounded-2xl border border-[#3e3e42] shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-500" /> Loan
                  Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Loan Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Interest (%)
                      </label>
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) =>
                          setInterestRate(Number(e.target.value))
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Term (Years)
                      </label>
                      <input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* RESULT SUMMARY */}
                <div className="mt-6 pt-6 border-t border-[#3e3e42] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      Monthly Payment
                    </span>
                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(loanData.emi)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      Total Interest
                    </span>
                    <span className="text-sm font-bold text-rose-400">
                      {formatCurrency(loanData.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      Total Payment
                    </span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(loanData.totalPayment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="bg-[#252526] p-5 rounded-2xl border border-[#3e3e42] shadow-xl h-[250px] flex flex-col">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-500" /> Amortization
                  Curve
                </h3>
                <div className="flex-1 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loanData.chartData}>
                      <defs>
                        <linearGradient
                          id="colorBal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#333"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        stroke="#666"
                        tick={{ fontSize: 10 }}
                      />
                      {/* FIX: Cast value to number explicitly or use any */}
                      <YAxis
                        stroke="#666"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: any) => `$${Number(val) / 1000}k`}
                      />
                      {/* FIX: Use any for formatter to bypass strict type checking */}
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e1e1e",
                          borderColor: "#3e3e42",
                        }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(val: any) => formatCurrency(Number(val))}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorBal)"
                        name="Balance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SCHEDULE TABLE */}
            <div className="lg:col-span-8 bg-[#252526] rounded-2xl border border-[#3e3e42] shadow-xl overflow-hidden flex flex-col h-[600px] lg:h-auto">
              <div className="p-4 border-b border-[#3e3e42] font-bold text-white flex items-center gap-2 bg-[#1e293b]">
                <Table2 size={18} className="text-purple-500" /> Amortization
                Schedule
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#1e1e1e] text-xs font-bold text-slate-500 uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3 text-right">Principal</th>
                      <th className="p-3 text-right">Interest</th>
                      <th className="p-3 text-right">Total Pay</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3e3e42]">
                    {loanData.schedule.map((row) => (
                      <tr
                        key={row.month}
                        className="hover:bg-[#2d2d2d] transition-colors"
                      >
                        <td className="p-3 text-slate-400">{row.month}</td>
                        <td className="p-3 text-right text-emerald-400 font-medium">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="p-3 text-right text-rose-400">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="p-3 text-right text-white">
                          {formatCurrency(row.payment)}
                        </td>
                        <td className="p-3 text-right text-blue-300 font-bold">
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 2: BUY VS RENT === */}
        {activeTab === "buy-vs-rent" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* CONFIG */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#252526] p-5 rounded-2xl border border-[#3e3e42] shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Home size={16} className="text-blue-500" /> Scenario Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Home Price
                    </label>
                    <input
                      type="number"
                      value={homePrice}
                      onChange={(e) => setHomePrice(Number(e.target.value))}
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Down Payment %
                      </label>
                      <input
                        type="number"
                        value={downPaymentPercent}
                        onChange={(e) =>
                          setDownPaymentPercent(Number(e.target.value))
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Loan Rate %
                      </label>
                      <input
                        type="number"
                        value={mortgageRate}
                        onChange={(e) =>
                          setMortgageRate(Number(e.target.value))
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-[#3e3e42] my-2"></div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Monthly Rent (Alternative)
                    </label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5"
                        title="Expected annual return if you invest cash instead"
                      >
                        Invest Return %
                      </label>
                      <input
                        type="number"
                        value={investmentReturn}
                        onChange={(e) =>
                          setInvestmentReturn(Number(e.target.value))
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Home Appr. %
                      </label>
                      <input
                        type="number"
                        value={homeAppreciation}
                        onChange={(e) =>
                          setHomeAppreciation(Number(e.target.value))
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <HelpCircle
                    size={20}
                    className="text-blue-400 mt-0.5 shrink-0"
                  />
                  <div className="text-xs text-blue-200 leading-relaxed">
                    <strong>Logic:</strong> This simulation compares Net Worth
                    after 30 years.
                    <ul className="list-disc ml-4 mt-1 space-y-1 text-blue-300/80">
                      <li>
                        <strong>Buy:</strong> Asset = Home Value (Appreciated) -
                        Remaining Loan.
                      </li>
                      <li>
                        <strong>Rent:</strong> You invest the Down Payment + any
                        monthly savings (if Rent &lt; Mortgage).
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* VISUALIZATION */}
            <div className="lg:col-span-8 bg-[#252526] rounded-2xl border border-[#3e3e42] shadow-xl p-6 flex flex-col min-h-[500px]">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-500" /> Net Worth
                Projection (30 Years)
              </h3>

              <div className="flex-1 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={compareData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorRent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ec4899"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ec4899"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Years",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    {/* FIX: Cast to any or number */}
                    <YAxis
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val: any) => `$${Number(val) / 1000}k`}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#333"
                      vertical={false}
                    />
                    {/* FIX: Cast to any for formatter */}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e1e",
                        borderColor: "#3e3e42",
                      }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(val: any) => formatCurrency(Number(val))}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="BuyNetWorth"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorBuy)"
                      name="Net Worth (Buying)"
                    />
                    <Area
                      type="monotone"
                      dataKey="RentNetWorth"
                      stroke="#ec4899"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRent)"
                      name="Net Worth (Renting)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-[#1e1e1e] p-4 rounded-xl border border-blue-500/20">
                  <div className="text-xs text-slate-400 mb-1">
                    Final Net Worth (Buy)
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatCurrency(
                      compareData[compareData.length - 1].BuyNetWorth
                    )}
                  </div>
                </div>
                <div className="bg-[#1e1e1e] p-4 rounded-xl border border-pink-500/20">
                  <div className="text-xs text-slate-400 mb-1">
                    Final Net Worth (Rent & Invest)
                  </div>
                  <div className="text-2xl font-bold text-pink-400">
                    {formatCurrency(
                      compareData[compareData.length - 1].RentNetWorth
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
