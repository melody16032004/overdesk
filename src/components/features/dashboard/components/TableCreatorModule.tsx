import { useState, useEffect } from "react";
import {
  Table,
  Plus,
  Trash2,
  Copy,
  Check,
  Code,
  FileJson,
  FileText,
  Settings2,
  Wand2,
  RefreshCw,
  Grid3X3,
  Eraser,
  ArrowUpNarrowWide,
  X,
  LayoutTemplate,
  Sparkles,
  Menu,
  Save,
  Database,
  FolderOpen,
  Clock,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Loader2,
  Pencil,
} from "lucide-react";
import { useToastStore } from "../../../../stores/useToastStore";

// --- TYPES ---
type ExportFormat = "html" | "markdown" | "csv" | "json";

interface SavedTable {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  lastModified: number;
}

const TEMPLATES = {
  pricing: {
    headers: ["Gói dịch vụ", "Giá / Tháng", "Dung lượng", "Hỗ trợ"],
    rows: [
      ["Basic", "99k", "10GB", "Email"],
      ["Pro", "199k", "50GB", "24/7"],
      ["Enterprise", "Liên hệ", "Không giới hạn", "VIP Agent"],
    ],
  },
  schedule: {
    headers: ["Thời gian", "Thứ 2", "Thứ 4", "Thứ 6"],
    rows: [
      ["08:00 - 10:00", "Họp team", "Code Review", "Training"],
      ["10:00 - 12:00", "Dev Feature A", "Fix Bug", "Dev Feature B"],
      ["13:30 - 17:00", "Deploy", "Meeting Client", "Report"],
    ],
  },
  users: {
    headers: ["ID", "Họ tên", "Email", "Trạng thái"],
    rows: [
      ["#001", "Nguyễn Văn A", "a@gmail.com", "Active"],
      ["#002", "Trần Thị B", "b@hotmail.com", "Pending"],
      ["#003", "Lê Văn C", "c@yahoo.com", "Banned"],
    ],
  },
};

export const TableCreatorModule = () => {
  const { showToast } = useToastStore();
  // --- STATE: EDITOR CONTENT ---
  const [tableName, setTableName] = useState("Bảng chưa đặt tên");
  const [currentId, setCurrentId] = useState<string | null>(null); // ID của bảng đang mở (null = bảng mới)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "unsaved"
  );

  const [headers, setHeaders] = useState<string[]>(["Cột 1", "Cột 2", "Cột 3"]);
  const [rows, setRows] = useState<string[][]>([
    ["Dữ liệu 1", "Dữ liệu 2", "Dữ liệu 3"],
  ]);

  const [config, setConfig] = useState({
    striped: true,
    bordered: true,
    compact: false,
    hover: true,
    darkHeader: true,
  });

  // --- STATE: LIBRARY ---
  const [savedTables, setSavedTables] = useState<SavedTable[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("saved_tables") || "[]");
    } catch {
      return [];
    }
  });

  // --- STATE: UI ---
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportFormat>("html");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);

  // Persistence for Library
  useEffect(() => {
    localStorage.setItem("saved_tables", JSON.stringify(savedTables));
  }, [savedTables]);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    // Chỉ tự động lưu nếu bảng đã có ID (đã được lưu lần đầu)
    if (currentId) {
      setSaveStatus("saving");
      const timer = setTimeout(() => {
        setSavedTables((prev) =>
          prev.map((t) =>
            t.id === currentId
              ? {
                  ...t,
                  name: tableName,
                  headers,
                  rows,
                  lastModified: Date.now(),
                }
              : t
          )
        );
        setSaveStatus("saved");
      }, 1000); // Debounce 1s
      return () => clearTimeout(timer);
    } else {
      setSaveStatus("unsaved");
    }
  }, [headers, rows, tableName, currentId]); // Chạy khi nội dung hoặc tên thay đổi

  // --- ACTIONS: EDITOR ---
  const updateHeader = (idx: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[idx] = val;
    setHeaders(newHeaders);
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = [...rows];
    newRows[rowIdx][colIdx] = val;
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, new Array(headers.length).fill("")]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));
  const addCol = () => {
    setHeaders([...headers, "New Col"]);
    setRows(rows.map((r) => [...r, ""]));
  };
  const removeCol = (idx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== idx));
    setRows(rows.map((r) => r.filter((_, i) => i !== idx)));
  };

  const applyTemplate = (type: keyof typeof TEMPLATES) => {
    setHeaders(TEMPLATES[type].headers);
    setRows(TEMPLATES[type].rows);
    setTableName(
      type === "pricing"
        ? "Bảng giá dịch vụ"
        : type === "schedule"
        ? "Lịch làm việc"
        : "Danh sách nhân sự"
    );
    if (window.innerWidth < 1024) setShowSettings(false);
    showToast(
      `Áp dụng TEMPLATE [${
        type === "pricing"
          ? "Bảng giá dịch vụ"
          : type === "schedule"
          ? "Lịch làm việc"
          : "Danh sách nhân sự"
      }]`
    );
  };

  const resetTable = () => {
    setHeaders(["Header 1", "Header 2"]);
    setRows([["", ""]]);
    setTableName("Bảng chưa đặt tên");
    setCurrentId(null); // Reset ID để thành bảng mới
    setSaveStatus("unsaved");
    showToast("Bảng đã được làm mới", "success");
  };

  // --- ACTIONS: LIBRARY ---
  const handleSaveNew = () => {
    // Lưu lần đầu (Tạo mới)
    const newId = Date.now().toString();
    const newTable: SavedTable = {
      id: newId,
      name: tableName,
      headers,
      rows,
      lastModified: Date.now(),
    };
    setSavedTables([newTable, ...savedTables]);
    setCurrentId(newId); // Gán ID để kích hoạt Auto-save cho các lần sau
    setSaveStatus("saved");
    showToast(
      "Đã lưu bảng thành công! Từ giờ mọi thay đổi sẽ được tự động lưu.",
      "success"
    );
  };

  const handleLoadTable = (table: SavedTable) => {
    if (saveStatus === "unsaved" && rows.length > 1) {
      return;
    }
    setHeaders(table.headers);
    setRows(table.rows);
    setTableName(table.name);
    setCurrentId(table.id);
    setSaveStatus("saved");
    setShowLibrary(false);
    showToast(`Bảng đã được load`, "success");
  };

  const handleDeleteTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTables(savedTables.filter((t) => t.id !== id));
    if (id === currentId) {
      setCurrentId(null); // Nếu xóa bảng đang mở, chuyển về chế độ chưa lưu
      setSaveStatus("unsaved");
    }
    showToast("Đã xóa", "success");
  };

  // --- SMART TOOLS ---
  const cleanEmptyRows = () => {
    const newRows = rows.filter((row) =>
      row.some((cell) => cell.trim() !== "")
    );
    setRows(
      newRows.length === 0 ? [new Array(headers.length).fill("")] : newRows
    );
    showToast("Đã xóa các dòng thừa", "success");
  };
  const uppercaseHeaders = () =>
    setHeaders(headers.map((h) => h.toUpperCase()));
  const handleMagicGenerate = () => {
    const p = aiPrompt.toLowerCase();
    let template = TEMPLATES.users;
    let name = "Danh sách được tạo";
    if (p.includes("giá") || p.includes("price")) {
      template = TEMPLATES.pricing;
      name = "Bảng giá";
    } else if (p.includes("lịch") || p.includes("thời gian")) {
      template = TEMPLATES.schedule;
      name = "Lịch trình";
    }

    setHeaders(template.headers);
    setRows(template.rows);
    setTableName(name);
    setShowAiModal(false);
    setAiPrompt("");
  };

  // --- EXPORT ---
  const handleDownloadFile = (type: "csv" | "excel") => {
    let content = "",
      mimeType = "",
      extension = "";
    if (type === "csv") {
      content =
        "\uFEFF" +
        [headers, ...rows]
          .map((e) => e.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
          .join("\n");
      mimeType = "text/csv;charset=utf-8;";
      extension = "csv";
    } else {
      content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headers
        .map(
          (h) =>
            `<th style="background-color:#f0f0f0;font-weight:bold">${h}</th>`
        )
        .join("")}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></body></html>`;
      mimeType = "application/vnd.ms-excel";
      extension = "xls";
    }
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}.${extension}`;
    link.click();
    showToast("Đã xuất file ở thư mục /Download", "success");
  };

  const generateCode = () => {
    switch (activeTab) {
      case "html":
        const tableClass = `w-full text-sm text-left ${
          config.bordered ? "border border-slate-700" : ""
        }`;
        const thClass = `${
          config.compact ? "px-4 py-2" : "px-6 py-3"
        } font-bold ${
          config.darkHeader
            ? "bg-slate-800 text-white"
            : "bg-slate-100 text-slate-700"
        } ${config.bordered ? "border-b border-slate-700" : ""}`;
        const tdClass = `${config.compact ? "px-4 py-2" : "px-6 py-4"} ${
          config.bordered ? "border-b border-slate-700" : ""
        }`;
        const trClass = (idx: number) =>
          `${
            config.striped && idx % 2 !== 0
              ? "bg-slate-800/50"
              : "bg-transparent"
          } ${config.hover ? "hover:bg-slate-700/50" : ""}`;
        return `<table class="${tableClass}">\n  <thead>\n    <tr>\n${headers
          .map((h) => `      <th class="${thClass}">${h}</th>`)
          .join("\n")}\n    </tr>\n  </thead>\n  <tbody>\n${rows
          .map(
            (row, i) =>
              `    <tr class="${trClass(i)}">\n${row
                .map((c) => `      <td class="${tdClass}">${c}</td>`)
                .join("\n")}\n    </tr>`
          )
          .join("\n")}\n  </tbody>\n</table>`;
      case "markdown":
        return `| ${headers.join(" | ")} |\n| ${headers
          .map(() => "---")
          .join(" | ")} |\n${rows
          .map((r) => `| ${r.join(" | ")} |`)
          .join("\n")}`;
      case "json":
        return JSON.stringify(
          rows.map((row) => {
            const obj: any = {};
            headers.forEach((h, i) => (obj[h] = row[i]));
            return obj;
          }),
          null,
          2
        );
      case "csv":
        return `${headers.join(",")}\n${rows
          .map((r) => r.join(","))
          .join("\n")}`;
      default:
        return "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Copied!", "success");
  };

  // --- UI COMPONENTS ---
  const LibraryDrawer = () => (
    <div className="flex flex-col h-full bg-[#1e293b] border-r border-slate-700 w-full sm:w-80 shadow-2xl">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Database size={18} className="text-emerald-500" /> Thư viện
        </h3>
        <button
          onClick={() => setShowLibrary(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {savedTables.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-xs italic">
            Chưa có bảng nào.
          </div>
        ) : (
          savedTables.map((t) => (
            <div
              key={t.id}
              onClick={() => handleLoadTable(t)}
              className={`group border rounded-xl p-3 cursor-pointer transition-all ${
                currentId === t.id
                  ? "bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/30"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div
                  className={`flex items-center gap-2 font-bold text-sm ${
                    currentId === t.id ? "text-emerald-400" : "text-white"
                  }`}
                >
                  <Table size={14} /> {t.name}
                </div>
                <button
                  onClick={(e) => handleDeleteTable(t.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Grid3X3 size={10} /> {t.headers.length}x{t.rows.length}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />{" "}
                  {new Date(t.lastModified).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="flex flex-col h-full bg-[#1e293b]">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center lg:hidden">
        <span className="font-bold text-white flex items-center gap-2">
          <Settings2 size={16} /> Cài đặt & Xuất
        </span>
        <button
          onClick={() => setShowSettings(false)}
          className="text-slate-400"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
          <h3 className="text-xs font-bold text-indigo-300 uppercase mb-3 flex items-center gap-2">
            <Download size={14} /> Tải xuống File
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadFile("excel")}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button
              onClick={() => handleDownloadFile("csv")}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Grid3X3 size={16} /> CSV
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Wand2 size={14} /> Công cụ xử lý
          </h3>
          <div className="space-y-2">
            <button
              onClick={cleanEmptyRows}
              className="w-full flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
            >
              <span className="flex items-center gap-2">
                <Eraser size={14} className="text-rose-400" /> Xóa hàng trống
              </span>
              <span className="text-[10px] bg-slate-700 px-1.5 rounded">
                Auto
              </span>
            </button>
            <button
              onClick={uppercaseHeaders}
              className="w-full flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
            >
              <span className="flex items-center gap-2">
                <ArrowUpNarrowWide size={14} className="text-emerald-400" />{" "}
                Viết hoa tiêu đề
              </span>
              <span className="text-[10px] bg-slate-700 px-1.5 rounded">
                Aa
              </span>
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <LayoutTemplate size={14} /> Mẫu bảng nhanh
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyTemplate("pricing")}
              className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-400 transition-all border border-slate-700 flex flex-col items-center gap-1"
            >
              <span className="text-lg">💲</span> Bảng giá
            </button>
            <button
              onClick={() => applyTemplate("schedule")}
              className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-400 transition-all border border-slate-700 flex flex-col items-center gap-1"
            >
              <span className="text-lg">📅</span> Lịch trình
            </button>
            <button
              onClick={() => applyTemplate("users")}
              className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-400 transition-all border border-slate-700 flex flex-col items-center gap-1"
            >
              <span className="text-lg">👥</span> Nhân sự
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Settings2 size={14} /> Giao diện
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Toggle
              label="Sọc (Striped)"
              checked={config.striped}
              onChange={() =>
                setConfig({ ...config, striped: !config.striped })
              }
            />
            <Toggle
              label="Viền (Bordered)"
              checked={config.bordered}
              onChange={() =>
                setConfig({ ...config, bordered: !config.bordered })
              }
            />
            <Toggle
              label="Gọn (Compact)"
              checked={config.compact}
              onChange={() =>
                setConfig({ ...config, compact: !config.compact })
              }
            />
            <Toggle
              label="Dark Header"
              checked={config.darkHeader}
              onChange={() =>
                setConfig({ ...config, darkHeader: !config.darkHeader })
              }
            />
          </div>
        </div>
        <div className="flex flex-col h-64 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex bg-slate-800 border-b border-slate-700">
            <TabButton
              icon={<Code size={14} />}
              label="HTML"
              active={activeTab === "html"}
              onClick={() => setActiveTab("html")}
            />
            <TabButton
              icon={<FileText size={14} />}
              label="MD"
              active={activeTab === "markdown"}
              onClick={() => setActiveTab("markdown")}
            />
            <TabButton
              icon={<FileJson size={14} />}
              label="JSON"
              active={activeTab === "json"}
              onClick={() => setActiveTab("json")}
            />
            <TabButton
              icon={<Grid3X3 size={14} />}
              label="CSV"
              active={activeTab === "csv"}
              onClick={() => setActiveTab("csv")}
            />
          </div>
          <div className="flex-1 relative bg-[#0f172a] p-3 group">
            <textarea
              readOnly
              value={generateCode()}
              className="w-full h-full bg-transparent text-[10px] font-mono text-indigo-300 outline-none resize-none custom-scrollbar"
            />
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 rounded-lg shadow-lg transition-all bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-3 lg:p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex items-center justify-between z-20 gap-3">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setShowLibrary(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title="Mở thư viện"
          >
            <FolderOpen size={20} />
          </button>

          {/* TITLE INPUT AREA */}
          <div className="flex items-center gap-2 group flex-1">
            <Table size={20} className="text-indigo-400 shrink-0" />
            <div className="relative h-8 flex-1 max-w-sm">
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full h-full bg-transparent text-white font-bold text-lg outline-none border-b border-transparent focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                placeholder="Đặt tên bảng..."
              />
              <Pencil
                size={12}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              />
            </div>

            {/* SAVE STATUS INDICATOR */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono ml-2 transition-all">
              {saveStatus === "saved" && (
                <>
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-slate-500">Đã lưu</span>
                </>
              )}
              {saveStatus === "saving" && (
                <>
                  <Loader2 size={12} className="text-indigo-500 animate-spin" />
                  <span className="text-indigo-400">Đang lưu...</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-slate-600">Chưa lưu</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveNew}
            disabled={!!currentId}
            className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              currentId
                ? "bg-slate-800 border-slate-700 text-slate-500 cursor-default"
                : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg active:scale-95"
            }`}
          >
            <Save size={14} /> {currentId ? "Auto-Save ON" : "Lưu Mới"}
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 border border-indigo-400/50"
          >
            <Sparkles size={14} /> <span className="hidden sm:inline">AI</span>
          </button>
          <button
            onClick={resetTable}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-800 transition-all"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="lg:hidden p-2 text-slate-300 bg-slate-800 border border-slate-700 rounded-lg"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col relative overflow-hidden order-1">
          <div className="absolute inset-0 bg-slate-900/50 pointer-events-none"></div>
          <div className="flex-1 overflow-auto custom-scrollbar p-4 lg:p-8 z-10">
            <div className="inline-block min-w-full">
              <div
                className={`border rounded-lg overflow-hidden shadow-2xl ${
                  config.bordered ? "border-slate-700" : "border-transparent"
                }`}
              >
                <table className="w-full text-sm text-left border-collapse">
                  <thead
                    className={`${
                      config.darkHeader
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <tr>
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          className={`group relative p-0 min-w-[140px] ${
                            config.bordered
                              ? "border-b border-r border-slate-600"
                              : ""
                          } last:border-r-0`}
                        >
                          <input
                            value={h}
                            onChange={(e) => updateHeader(i, e.target.value)}
                            className={`w-full h-full bg-transparent px-4 py-3 font-bold outline-none focus:bg-indigo-500/20 transition-colors ${
                              config.compact ? "py-2" : "py-3"
                            }`}
                          />
                          <button
                            onClick={() => removeCol(i)}
                            className="absolute top-0 right-0 h-full px-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </th>
                      ))}
                      <th
                        className="w-10 p-0 bg-slate-800/50 hover:bg-indigo-500/20 transition-colors cursor-pointer border-b border-slate-600"
                        onClick={addCol}
                      >
                        <div className="flex items-center justify-center h-full text-slate-500 hover:text-indigo-400">
                          <Plus size={16} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0f172a]">
                    {rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`group ${
                          config.striped && rIdx % 2 !== 0
                            ? "bg-slate-800/30"
                            : ""
                        } ${config.hover ? "hover:bg-indigo-500/5" : ""}`}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-0 ${
                              config.bordered
                                ? "border-b border-r border-slate-800"
                                : "border-b border-slate-800/50"
                            } last:border-r-0`}
                          >
                            <input
                              value={cell}
                              onChange={(e) =>
                                updateCell(rIdx, cIdx, e.target.value)
                              }
                              className={`w-full h-full bg-transparent outline-none focus:bg-indigo-500/10 text-slate-300 px-4 transition-colors placeholder:text-slate-700 ${
                                config.compact ? "py-2" : "py-3"
                              }`}
                              placeholder="..."
                            />
                          </td>
                        ))}
                        <td className="w-10 text-center border-b border-slate-800/0">
                          <button
                            onClick={() => removeRow(rIdx)}
                            className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addRow}
                className="mt-4 w-full py-3 border border-dashed border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-400 hover:border-indigo-500 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Thêm hàng mới
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-96 border-l border-slate-800 shadow-2xl z-20">
          <SettingsPanel />
        </div>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            ></div>
            <div className="relative w-80 bg-[#1e293b] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-700">
              <SettingsPanel />
            </div>
          </div>
        )}
        {showLibrary && (
          <div className="fixed inset-0 z-50 flex justify-start">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLibrary(false)}
            ></div>
            <div className="relative h-full animate-in slide-in-from-left duration-300">
              <LibraryDrawer />
            </div>
          </div>
        )}
      </div>
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">AI Magic Table</h3>
              <p className="text-xs text-slate-400 mt-1">
                Nhập mô tả bảng (Ví dụ: "Bảng giá", "Lịch làm việc")
              </p>
            </div>
            <input
              autoFocus
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMagicGenerate()}
              placeholder="VD: Danh sách nhân viên..."
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleMagicGenerate}
                className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all active:scale-95"
              >
                Tạo ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <div
    onClick={onChange}
    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all select-none ${
      checked
        ? "bg-indigo-500/10 border-indigo-500/50"
        : "bg-slate-800 border-slate-700"
    }`}
  >
    <span
      className={`text-[10px] font-bold ${
        checked ? "text-indigo-400" : "text-slate-400"
      }`}
    >
      {label}
    </span>
    <div
      className={`w-6 h-3 rounded-full relative transition-colors ${
        checked ? "bg-indigo-500" : "bg-slate-600"
      }`}
    >
      <div
        className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${
          checked ? "left-3.5" : "left-0.5"
        }`}
      ></div>
    </div>
  </div>
);
const TabButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors border-b-2 ${
      active
        ? "bg-slate-800 text-indigo-400 border-indigo-500"
        : "text-slate-500 border-transparent hover:text-white hover:bg-slate-800/50"
    }`}
  >
    {icon} {label}
  </button>
);
