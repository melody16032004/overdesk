import { useState, useEffect } from "react";
import {
  Bug,
  Copy,
  RefreshCw,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Eraser,
  LayoutTemplate,
  Eye,
  PenTool,
} from "lucide-react";
import { BugData } from "./types/bug_type";
import { DEFAULT_DATA, TEMPLATES } from "./constants/bug_const";

export const BugReportModule = () => {
  // =========================================
  // 1. STATE MANAGEMENT
  // =========================================

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);

  const [data, setData] = useState<BugData>(() => {
    // Auto-load saved draft
    try {
      const saved = localStorage.getItem("bug_report_draft");
      return saved ? JSON.parse(saved) : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  // =========================================
  // 2. EFFECTS
  // =========================================

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem("bug_report_draft", JSON.stringify(data));
  }, [data]);

  // Initial Detect (only if env is empty)
  useEffect(() => {
    if (!data.env) detectEnvironment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================
  // 3. LOGIC & HELPERS
  // =========================================

  const detectEnvironment = () => {
    const ua = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const windowSize = `${window.innerWidth}x${window.innerHeight}`;

    let os = "Unknown";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    const isMobile = /Mobi|Android/i.test(ua);
    const deviceIcon = isMobile ? "📱 Mobile" : "💻 Desktop";

    // FIX: Add (navigator as any) to avoid TS error
    const browserName =
      (navigator as any).userAgentData?.brands?.[0]?.brand || navigator.appName;

    const envString = `- Device: ${deviceIcon}
- OS: ${os}
- Browser: ${browserName}
- Screen: ${screenRes} (Window: ${windowSize})
- Time: ${new Date().toLocaleString("vi-VN")}`;

    setData((prev) => ({ ...prev, env: envString }));
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-500/20 text-rose-400 border-rose-500/50";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const generateMarkdown = () => {
    return `### 🐞 Bug: ${data.title || "Untitled"}
**Severity:** ${data.severity}

#### 🌍 Environment:
\`\`\`text
${data.env}
\`\`\`

#### 👣 Steps to Reproduce:
${data.steps || "- (Chưa nhập)"}

#### ✅ Expected Result:
> ${data.expected || "(Chưa nhập)"}

#### ❌ Actual Result:
> ${data.actual || "(Chưa nhập)"}`;
  };

  // =========================================
  // 4. ACTIONS
  // =========================================

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    if (data.title && !confirm("Ghi đè nội dung hiện tại bằng mẫu?")) return;
    setData((prev) => ({ ...prev, ...(TEMPLATES[key] as any) }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateMarkdown()], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bug_report_${Date.now()}.md`;
    link.click();
  };

  const handleReset = () => {
    if (confirm("Xóa trắng form?")) {
      const resetData: BugData = {
        ...DEFAULT_DATA,
        steps: "1. \n2. \n3. ",
      };
      setData(resetData);
      setTimeout(detectEnvironment, 100); // Re-detect env after clear
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-600 rounded-lg text-white shadow-lg">
            <Bug size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm hidden sm:block">
              Bug Hunter Pro
            </h3>
            <h3 className="font-bold text-white text-sm sm:hidden">
              Bug Report
            </h3>
            <p className="text-[10px] text-slate-400">v2.0 • Auto-Save</p>
          </div>
        </div>

        {/* Actions Desktop */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all border border-slate-700"
            title="Reset"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-all border border-slate-700 hidden sm:flex"
            title="Tải file .md"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            <span className="hidden sm:inline">
              {copied ? "Copied" : "Copy MD"}
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE TABS */}
      <div className="lg:hidden flex border-b border-slate-800 bg-[#1e293b]/50">
        <button
          onClick={() => setActiveTab("write")}
          className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${
            activeTab === "write"
              ? "text-rose-400 border-b-2 border-rose-500 bg-rose-500/5"
              : "text-slate-500"
          }`}
        >
          <PenTool size={14} /> Viết lỗi
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${
            activeTab === "preview"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5"
              : "text-slate-500"
          }`}
        >
          <Eye size={14} /> Xem trước
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* LEFT: INPUT FORM */}
          <div
            className={`space-y-5 ${
              activeTab === "write" ? "block" : "hidden lg:block"
            }`}
          >
            {/* Templates */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[10px] font-bold text-slate-500 uppercase self-center shrink-0 mr-1">
                <LayoutTemplate size={12} className="inline mr-1" /> Mẫu:
              </span>
              {Object.keys(TEMPLATES).map((key) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key as any)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-full text-[10px] font-bold text-slate-300 whitespace-nowrap transition-all"
                >
                  {key === "ui"
                    ? "🎨 UI"
                    : key === "api"
                      ? "🔌 API"
                      : "💥 Crash"}
                </button>
              ))}
            </div>

            {/* Main Inputs */}
            <div className="space-y-4">
              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Tiêu đề lỗi
                  </label>
                  <input
                    value={data.title}
                    onChange={(e) =>
                      setData({ ...data, title: e.target.value })
                    }
                    placeholder="VD: Nút Login không phản hồi..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-rose-500 outline-none transition-colors font-medium"
                  />
                </div>
                <div className="sm:w-32 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Mức độ
                  </label>
                  <select
                    value={data.severity}
                    onChange={(e) =>
                      setData({ ...data, severity: e.target.value as any })
                    }
                    className={`w-full p-3 rounded-lg text-sm font-bold outline-none border appearance-none pointer ${getSeverityColor(
                      data.severity,
                    )}`}
                  >
                    <option value="Low" className="bg-slate-900 text-slate-300">
                      Low
                    </option>
                    <option
                      value="Medium"
                      className="bg-slate-900 text-slate-300"
                    >
                      Medium
                    </option>
                    <option
                      value="High"
                      className="bg-slate-900 text-slate-300"
                    >
                      High
                    </option>
                    <option
                      value="Critical"
                      className="bg-slate-900 text-slate-300"
                    >
                      Critical
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Monitor size={12} /> Môi trường
                  </label>
                  <button
                    onClick={detectEnvironment}
                    className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <RefreshCw size={10} /> Quét lại
                  </button>
                </div>
                <textarea
                  value={data.env}
                  onChange={(e) => setData({ ...data, env: e.target.value })}
                  className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Các bước tái hiện (Steps)
                </label>
                <textarea
                  value={data.steps}
                  onChange={(e) => setData({ ...data, steps: e.target.value })}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  placeholder={
                    "1. Vào màn hình...\n2. Click nút...\n3. Quan sát..."
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold  uppercase text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Kết quả mong đợi
                  </label>
                  <textarea
                    value={data.expected}
                    onChange={(e) =>
                      setData({ ...data, expected: e.target.value })
                    }
                    className="w-full h-24 bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-slate-300 focus:border-emerald-500 outline-none resize-none"
                    placeholder="Hệ thống hoạt động bình thường..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> Kết quả thực tế
                  </label>
                  <textarea
                    value={data.actual}
                    onChange={(e) =>
                      setData({ ...data, actual: e.target.value })
                    }
                    className="w-full h-24 bg-rose-900/10 border border-rose-500/20 rounded-lg p-3 text-sm text-slate-300 focus:border-rose-500 outline-none resize-none"
                    placeholder="Hệ thống báo lỗi..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: PREVIEW */}
          <div
            className={`flex flex-col h-full bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden shadow-2xl ${
              activeTab === "preview" ? "block" : "hidden lg:flex"
            }`}
          >
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <FileText size={14} /> Markdown Preview
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-500/30">
                Jira / GitHub Ready
              </span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-5 bg-[#0d1117]">
              {/* Render giả lập Markdown */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white break-words">
                    {data.title || (
                      <span className="text-slate-600 italic">
                        Tiêu đề lỗi...
                      </span>
                    )}
                  </h2>
                  <div className="mt-2 flex gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityColor(
                        data.severity,
                      )}`}
                    >
                      {data.severity}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                    🌍 Environment
                  </h4>
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                    {data.env}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-indigo-400 mb-1">
                    👣 Steps to Reproduce
                  </h4>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed pl-2 border-l-2 border-slate-700">
                    {data.steps || "..."}
                  </pre>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">
                      ✅ Expected Result
                    </h4>
                    <div className="text-sm text-slate-300 pl-3 border-l-2 border-emerald-500/50 italic">
                      {data.expected || "..."}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-400 mb-1">
                      ❌ Actual Result
                    </h4>
                    <div className="text-sm text-slate-300 pl-3 border-l-2 border-rose-500/50 italic">
                      {data.actual || "..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom Actions for Mobile */}
            <div className="p-3 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-2 lg:hidden">
              <button
                onClick={handleDownload}
                className="p-2 bg-slate-700 text-blue-400 rounded-lg"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 w-full justify-center"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Đã sao chép" : "Sao chép Markdown"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
