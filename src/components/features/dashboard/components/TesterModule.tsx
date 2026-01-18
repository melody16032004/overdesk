import { useState, useEffect } from "react";
import {
  Copy,
  RefreshCw,
  User,
  Mail,
  Phone,
  CreditCard,
  Fingerprint,
  Calendar,
  Check,
  Settings,
  Trash2,
  List,
  Code2,
  CheckCircle2,
  MapPin,
  Shield,
  ShieldCheck,
  Play,
  Plus,
  XCircle,
  Ruler,
  ArrowRightLeft,
  HandshakeIcon,
  Globe2Icon,
  ClipboardList,
  Braces, // Icon cho nút Format JSON
  RotateCcw, // Icon để reset
} from "lucide-react";

// --- FAKER ENGINE (Giữ nguyên) ---
const DB = {
  first: [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
  ],
  last: [
    "Văn A",
    "Thị B",
    "Minh",
    "Hùng",
    "Lan",
    "Hương",
    "Tuấn",
    "Kiệt",
    "Linh",
    "Thảo",
    "Huy",
    "Nam",
  ],
  domains: ["gmail.com", "yahoo.com", "outlook.com", "dev.io", "test.vn"],
  streets: [
    "Nguyễn Huệ",
    "Lê Lợi",
    "Hàm Nghi",
    "Pasteur",
    "Điện Biên Phủ",
    "Cách Mạng Tháng 8",
  ],
  cities: ["HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"],
  roles: ["Admin", "User", "Editor", "Viewer", "Tester"],
  status: ["Active", "Inactive", "Pending", "Banned"],
};

const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randNum = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const Generators: Record<string, () => any> = {
  id: () => randNum(1000, 9999),
  uuid: () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) =>
      (c === "x"
        ? (Math.random() * 16) | 0
        : (((Math.random() * 16) | 0) & 0x3) | 0x8
      ).toString(16)
    ),
  name: () => `${rand(DB.first)} ${rand(DB.last)}`,
  email: () => `user.${randNum(1000, 9999)}@${rand(DB.domains)}`,
  phone: () => `0${randNum(900, 999)}${randNum(1000000, 9999999)}`,
  role: () => rand(DB.roles),
  status: () => rand(DB.status),
  card: () =>
    `4${randNum(100, 999)} ${randNum(1000, 9999)} ${randNum(
      1000,
      9999
    )} ${randNum(1000, 9999)}`,
  address: () => `${randNum(1, 999)} ${rand(DB.streets)}, ${rand(DB.cities)}`,
  date: () =>
    new Date(Date.now() - randNum(0, 10000000000)).toISOString().split("T")[0],
  boolean: () => Math.random() > 0.5,
};

const FIELD_OPTIONS = [
  { id: "id", label: "ID (Int)", icon: List },
  { id: "uuid", label: "UUID", icon: Fingerprint },
  { id: "name", label: "Full Name", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "role", label: "Role", icon: Shield },
  { id: "card", label: "Credit Card", icon: CreditCard },
  { id: "address", label: "Address", icon: MapPin },
  { id: "date", label: "Date", icon: Calendar },
  { id: "status", label: "Status", icon: CheckCircle2 },
];

// --- VALIDATOR CONFIG ---
type RuleType =
  | "required"
  | "email"
  | "number"
  | "string_length"
  | "number_range"
  | "enum"
  | "regex"
  | "date"
  | "url";

const RULE_DEFINITIONS: Record<
  RuleType,
  { label: string; icon: any; hasParams?: boolean; placeholder?: string }
> = {
  required: { label: "Bắt buộc có", icon: CheckCircle2, hasParams: false },
  email: { label: "Là Email", icon: Mail, hasParams: false },
  number: { label: "Là Số", icon: HandshakeIcon, hasParams: false },
  string_length: {
    label: "Độ dài chuỗi",
    icon: Ruler,
    hasParams: true,
    placeholder: "min,max (VD: 3,20)",
  },
  number_range: {
    label: "Khoảng giá trị",
    icon: ArrowRightLeft,
    hasParams: true,
    placeholder: "min,max (VD: 18,100)",
  },
  enum: {
    label: "Trong danh sách",
    icon: List,
    hasParams: true,
    placeholder: "A,B,C (VD: Admin,User)",
  },
  regex: {
    label: "Regex (Tùy chỉnh)",
    icon: Code2,
    hasParams: true,
    placeholder: "Biểu thức (VD: ^[A-Z]+$)",
  },
  date: { label: "Là Ngày (ISO)", icon: Calendar, hasParams: false },
  url: { label: "Là URL", icon: Globe2Icon, hasParams: false },
};

interface ValidationRule {
  id: string;
  field: string;
  type: RuleType;
  params?: string;
  active: boolean;
}

interface ValidationResult {
  rowIndex: number;
  errors: string[];
}

type Tab = "generator" | "validator" | "testcase";
type OutputFormat = "json" | "csv" | "sql";

// Default Data for Reset
const DEFAULT_JSON =
  '[\n  {"name": "Nguyen A", "age": 15, "role": "Admin"},\n  {"name": "Tran B", "age": 200, "role": "Guest"},\n  {"name": "", "age": "abc", "role": "User"}\n]';
const DEFAULT_RULES: ValidationRule[] = [
  { id: "1", field: "name", type: "required", active: true },
  {
    id: "2",
    field: "age",
    type: "number_range",
    params: "18,100",
    active: true,
  },
  { id: "3", field: "role", type: "enum", params: "Admin,User", active: true },
];

export const TesterModule = ({
  onSwitchApp,
}: {
  onSwitchApp?: (appId: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("validator");

  // Generator State
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "id",
    "name",
    "email",
    "role",
  ]);
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [genData, setGenData] = useState<any[]>([]);
  const [outputString, setOutputString] = useState("");
  const [copied, setCopied] = useState(false);
  const [tableName, setTableName] = useState("users");
  const [showResetModal, setShowResetModal] = useState(false);

  // --- VALIDATOR STATE (WITH PERSISTENCE) ---
  const [jsonInput, setJsonInput] = useState(() => {
    try {
      return localStorage.getItem("tester_val_input") || DEFAULT_JSON;
    } catch {
      return DEFAULT_JSON;
    }
  });

  const [rules, setRules] = useState<ValidationRule[]>(() => {
    try {
      const saved = localStorage.getItem("tester_val_rules");
      return saved ? JSON.parse(saved) : DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  });

  const [valResults, setValResults] = useState<ValidationResult[]>(() => {
    try {
      const saved = localStorage.getItem("tester_val_results");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [detectedFields, setDetectedFields] = useState<string[]>([]);

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem("tester_val_input", jsonInput);
    localStorage.setItem("tester_val_rules", JSON.stringify(rules));
    localStorage.setItem("tester_val_results", JSON.stringify(valResults));
  }, [jsonInput, rules, valResults]);

  // --- LOGIC: GENERATOR ---
  const generateData = () => {
    const newData = Array.from({ length: count }).map(() => {
      const row: any = {};
      selectedFields.forEach((field) => (row[field] = Generators[field]()));
      return row;
    });
    setGenData(newData);
    formatOutput(newData, format);
  };

  const formatOutput = (rawData: any[], fmt: OutputFormat) => {
    let result = "";
    if (fmt === "json") result = JSON.stringify(rawData, null, 2);
    else if (fmt === "csv") {
      const header = selectedFields.join(",") + "\n";
      const rows = rawData
        .map((row) =>
          selectedFields.map((field) => `"${row[field]}"`).join(",")
        )
        .join("\n");
      result = header + rows;
    } else if (fmt === "sql") {
      result = rawData
        .map((row) => {
          const values = selectedFields
            .map((field) => {
              const val = row[field];
              return typeof val === "number" ? val : `'${val}'`;
            })
            .join(", ");
          return `INSERT INTO ${tableName} (${selectedFields.join(
            ", "
          )}) VALUES (${values});`;
        })
        .join("\n");
    }
    setOutputString(result);
  };

  useEffect(() => {
    if (genData.length > 0) formatOutput(genData, format);
  }, [format, tableName]);
  useEffect(() => {
    generateData();
  }, []);

  // --- LOGIC: VALIDATOR ---
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDetectedFields(Object.keys(parsed[0]));
      }
    } catch {}
  }, [jsonInput]);

  const handleFormatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {
      alert("JSON không hợp lệ, không thể format. Vui lòng kiểm tra cú pháp.");
    }
  };

  const validateValue = (value: any, rule: ValidationRule): string | null => {
    const strVal = String(
      value !== undefined && value !== null ? value : ""
    ).trim();

    if (rule.type === "required")
      return strVal === "" ? "Thiếu dữ liệu bắt buộc" : null;
    if (strVal === "") return null;

    switch (rule.type) {
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)
          ? null
          : "Email không hợp lệ";
      case "number":
        return !isNaN(Number(value)) ? null : "Phải là số";
      case "url":
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
          strVal
        )
          ? null
          : "URL không hợp lệ";
      case "date":
        return !isNaN(Date.parse(strVal)) ? null : "Ngày không hợp lệ";
      case "string_length":
        const [minL, maxL] = (rule.params || "0,255").split(",").map(Number);
        if (strVal.length < minL) return `Quá ngắn (< ${minL} ký tự)`;
        if (strVal.length > maxL) return `Quá dài (> ${maxL} ký tự)`;
        return null;
      case "number_range":
        const num = Number(value);
        if (isNaN(num)) return "Không phải số";
        const [minN, maxN] = (rule.params || "0,100").split(",").map(Number);
        if (num < minN) return `Giá trị quá nhỏ (< ${minN})`;
        if (num > maxN) return `Giá trị quá lớn (> ${maxN})`;
        return null;
      case "enum":
        const options = (rule.params || "").split(",").map((s) => s.trim());
        return options.includes(strVal)
          ? null
          : `Giá trị không hợp lệ (Chỉ chấp nhận: ${rule.params})`;
      case "regex":
        try {
          const regex = new RegExp(rule.params || "");
          return regex.test(strVal) ? null : "Sai định dạng (Regex không khớp)";
        } catch {
          return "Lỗi cấu hình Regex";
        }
      default:
        return null;
    }
  };

  const runValidation = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) {
        alert("Dữ liệu phải là mảng JSON []");
        return;
      }

      const results: ValidationResult[] = [];
      data.forEach((item, index) => {
        const errors: string[] = [];
        rules.forEach((rule) => {
          if (!rule.active) return;
          const error = validateValue(item[rule.field], rule);
          if (error) errors.push(`[${rule.field}] ${error}`);
        });
        if (errors.length > 0) results.push({ rowIndex: index, errors });
      });

      setValResults(results);
      if (results.length === 0) alert("✅ Dữ liệu hợp lệ 100%!");
    } catch (e) {
      alert("❌ JSON không hợp lệ.");
    }
  };

  const addRule = () => {
    const field = detectedFields.length > 0 ? detectedFields[0] : "name";
    setRules([
      ...rules,
      { id: Date.now().toString(), field, type: "required", active: true },
    ]);
  };

  const updateRule = (id: string, key: keyof ValidationRule, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Hàm này chỉ có nhiệm vụ mở Modal
  const handleResetValidator = () => {
    setShowResetModal(true);
  };

  // 2. Hàm này mới thực sự Reset dữ liệu (gọi khi bấm nút "Đồng ý" trong Modal)
  const confirmReset = () => {
    setJsonInput(DEFAULT_JSON);
    setRules(DEFAULT_RULES);
    setValResults([]);
    setShowResetModal(false); // Đóng modal
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-end gap-1">
              <h3 className="font-bold text-white text-sm">Tester Studio </h3>
              <p className="text-[10px] text-slate-400">v0.0</p>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
              <button
                onClick={() => setActiveTab("generator")}
                className={`hover:text-white transition-colors ${
                  activeTab === "generator"
                    ? "text-orange-400 underline decoration-2 underline-offset-4"
                    : ""
                }`}
              >
                Data Gen
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setActiveTab("validator")}
                className={`hover:text-white transition-colors ${
                  activeTab === "validator"
                    ? "text-orange-400 underline decoration-2 underline-offset-4"
                    : ""
                }`}
              >
                Validator
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => onSwitchApp && onSwitchApp("testcase")}
                className={`hover:text-white transition-colors flex items-center gap-1 ${
                  activeTab === "testcase"
                    ? "text-orange-400 underline decoration-2 underline-offset-4"
                    : ""
                }`}
              >
                <ClipboardList size={10} /> Test Case
              </button>
            </div>
          </div>
        </div>
        {activeTab === "generator" ? (
          <button
            onClick={generateData}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={14} />{" "}
            <span className="hidden sm:inline">Tạo lại</span>
          </button>
        ) : (
          <button
            onClick={runValidation}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Play size={14} />{" "}
            <span className="hidden sm:inline">Chạy Test</span>
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        {/* --- GENERATOR VIEW (Giữ nguyên) --- */}
        {activeTab === "generator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <List size={14} /> Chọn trường
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_OPTIONS.map((field) => (
                    <button
                      key={field.id}
                      onClick={() =>
                        setSelectedFields((p) =>
                          p.includes(field.id)
                            ? p.filter((f) => f !== field.id)
                            : [...p, field.id]
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selectedFields.includes(field.id)
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <field.icon size={12} /> {field.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Settings size={14} /> Cấu hình
                </h4>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Số lượng ({count})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Định dạng
                  </label>
                  <div className="flex bg-slate-800 p-1 rounded-lg">
                    {(["json", "csv", "sql"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                          format === f
                            ? "bg-slate-600 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {format === "sql" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                      Tên bảng SQL
                    </label>
                    <input
                      type="text"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col h-[500px] lg:h-full bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden relative group">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400 uppercase">
                  {format} Preview
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-all"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
                <pre
                  className={`font-mono text-xs leading-relaxed ${
                    format === "sql"
                      ? "text-blue-300"
                      : format === "csv"
                      ? "text-emerald-300"
                      : "text-yellow-100"
                  }`}
                >
                  {outputString}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* --- VALIDATOR VIEW --- */}
        {activeTab === "validator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* LEFT: INPUT */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex-1 flex flex-col bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden relative">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase flex justify-between items-center">
                  <span>Dữ liệu đầu vào (JSON)</span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleResetValidator}
                      className="p-1 text-slate-500 hover:text-white bg-slate-700 hover:bg-rose-600 rounded transition-all"
                      title="Khôi phục mặc định"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={handleFormatJSON}
                      className="flex items-center gap-1 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                      title="Format JSON"
                    >
                      <Braces size={10} /> Làm đẹp
                    </button>
                  </div>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="flex-1 w-full bg-transparent p-4 text-xs font-mono text-blue-200 outline-none resize-none custom-scrollbar"
                  spellCheck={false}
                  placeholder="Paste JSON array here..."
                />
              </div>
            </div>

            {/* RIGHT: RULES CONFIG & RESULT */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Rules Config Panel */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Settings size={14} /> Cấu hình Rules
                  </h4>
                  <button
                    onClick={addRule}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-bold flex items-center gap-1 shadow"
                  >
                    <Plus size={12} /> Thêm Rule
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex flex-wrap items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700 shadow-sm animate-in slide-in-from-left-2"
                    >
                      <select
                        value={rule.field}
                        onChange={(e) =>
                          updateRule(rule.id, "field", e.target.value)
                        }
                        className="bg-slate-900 text-white text-xs border border-slate-600 rounded px-2 py-1.5 outline-none focus:border-indigo-500 font-mono"
                      >
                        {detectedFields.length > 0 ? (
                          detectedFields.map((f) => (
                            <option key={f} value={f} className="bg-slate-900">
                              {f}
                            </option>
                          ))
                        ) : (
                          <option value={rule.field}>{rule.field}</option>
                        )}
                      </select>
                      <div className="relative group">
                        <select
                          value={rule.type}
                          onChange={(e) =>
                            updateRule(rule.id, "type", e.target.value)
                          }
                          className="bg-slate-900 text-white text-xs border border-slate-600 rounded px-2 py-1.5 pl-7 outline-none focus:border-indigo-500 appearance-none cursor-pointer min-w-[120px]"
                        >
                          {Object.entries(RULE_DEFINITIONS).map(
                            ([key, def]) => (
                              <option
                                key={key}
                                value={key}
                                className="bg-slate-900"
                              >
                                {def.label}
                              </option>
                            )
                          )}
                        </select>
                        <div className="absolute left-2 top-1.5 text-indigo-400 pointer-events-none">
                          {(() => {
                            const Icon = RULE_DEFINITIONS[rule.type].icon;
                            return <Icon size={12} />;
                          })()}
                        </div>
                      </div>
                      {RULE_DEFINITIONS[rule.type].hasParams && (
                        <input
                          type="text"
                          placeholder={RULE_DEFINITIONS[rule.type].placeholder}
                          value={rule.params || ""}
                          onChange={(e) =>
                            updateRule(rule.id, "params", e.target.value)
                          }
                          className="flex-1 min-w-[100px] bg-slate-900 text-white text-xs border border-slate-600 rounded px-2 py-1.5 outline-none placeholder:text-slate-600"
                        />
                      )}
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="text-slate-500 hover:text-rose-500 p-1.5 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result Panel */}
              <div className="flex-1 bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase flex justify-between items-center">
                  <span>Kết quả kiểm tra</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      valResults.length > 0
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {valResults.length > 0
                      ? `${valResults.length} Lỗi`
                      : "Sẵn sàng"}
                  </span>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                  {valResults.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                      <CheckCircle2 size={48} className="mb-2" />
                      <p className="text-sm">
                        Không tìm thấy lỗi (Hoặc chưa chạy)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {valResults.map((res, i) => (
                        <div
                          key={i}
                          className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 animate-in slide-in-from-right-2"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle size={14} className="text-rose-500" />
                            <span className="text-xs font-bold text-rose-400">
                              Index {res.rowIndex} (Dòng {res.rowIndex + 1})
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-xs text-slate-300 pl-1 space-y-0.5">
                            {res.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CUSTOM RESET MODAL --- */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-indigo-400">
              <div className="p-2 bg-indigo-500/10 rounded-full">
                <RotateCcw size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">
                Xác nhận khôi phục
              </h3>
            </div>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Hành động này sẽ xóa toàn bộ dữ liệu JSON hiện tại và đưa cấu hình
              Rules về mặc định.
              <br />
              <br />
              Bạn có chắc chắn muốn tiếp tục không?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} /> Khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
