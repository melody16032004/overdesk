import { useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import Editor from "react-simple-code-editor";
import {
  Send,
  Globe,
  Clock,
  Database,
  AlertCircle,
  Play,
  WifiOff,
  Copy,
  Plus,
  X,
  History,
  ChevronDown,
  Layout,
  Code,
  List,
} from "lucide-react";
import { HeaderItem, HistoryItem } from "./types/postman_type";
import { METHODS } from "./constants/postman_const";
import { formatSize, getStatusColor } from "./helper/postman_helper";

export const RequestModule = () => {
  // --- 1. STATE MANAGEMENT ---

  // A. Request Configuration
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("{\n  \n}");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: 1, key: "Content-Type", value: "application/json" },
  ]);

  // B. Response Data
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>("");
  const [time, setTime] = useState<number | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // C. UI & History State
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("request_history") || "[]");
    } catch {
      return [];
    }
  });

  // --- 2. HELPER FUNCTIONS ---

  // --- 3. STATE MODIFIERS (HANDLERS) ---

  // Header Handlers
  const addHeader = () => {
    setHeaders([...headers, { id: Date.now(), key: "", value: "" }]);
  };

  const removeHeader = (id: number) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const updateHeader = (id: number, field: "key" | "value", val: string) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  // History Handler
  const addToHistory = (currUrl: string, currMethod: string) => {
    const newItem = {
      url: currUrl,
      method: currMethod,
      date: new Date().toLocaleTimeString(),
    };
    // Add new, remove duplicates, keep last 10
    const newHistory = [
      newItem,
      ...history.filter((h) => h.url !== currUrl),
    ].slice(0, 10);

    setHistory(newHistory);
    localStorage.setItem("request_history", JSON.stringify(newHistory));
  };

  // --- 4. CORE LOGIC (HANDLE REQUEST) ---

  const handleSend = async () => {
    if (!url) return;

    // 1. Reset State
    setLoading(true);
    setResponse("");
    setStatus(null);
    setIsError(false);

    const startTime = performance.now();

    try {
      // 2. Prepare Options
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headerObj[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: headerObj,
      };

      if (method !== "GET" && method !== "HEAD") {
        try {
          JSON.parse(body); // Validate JSON
          options.body = body;
        } catch {
          throw new Error("Invalid JSON Body Format");
        }
      }

      // 3. Execute Fetch
      const res = await fetch(url, options);
      const endTime = performance.now();

      // 4. Process Meta Data
      setStatus(res.status);
      setStatusText(res.statusText);
      setTime(Math.round(endTime - startTime));
      setIsError(!res.ok);

      // 5. Process Body
      const blob = await res.blob();
      setSize(formatSize(blob.size));

      const text = await blob.text();
      try {
        // Try to format JSON
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        // Fallback to plain text/html
        setResponse(text);
      }

      // 6. Save History
      addToHistory(url, method);
    } catch (err: any) {
      setIsError(true);
      setResponse(
        err.message || "Network Error: Check CORS or Internet Connection",
      );
      setStatus(0);
      setStatusText("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans">
      {/* 1. TOP BAR (Responsive) */}
      <div className="flex-none p-3 bg-[#252526] border-b border-[#3e3e42] flex flex-col md:flex-row gap-2 z-20">
        <div className="flex gap-2 w-full md:w-auto">
          {/* Method Select */}
          <div className="relative min-w-[100px]">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-10 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg px-3 text-xs font-bold appearance-none outline-none pointer focus:border-blue-500"
              style={{
                color:
                  METHODS.find((m) => m.label === method)?.color?.replace(
                    "text-",
                    "",
                  ) || "#fff",
              }}
            >
              {METHODS.map((m) => (
                <option key={m.label} value={m.label}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-3 top-3.5 pointer-events-none opacity-50"
            />
          </div>

          {/* History Button (Mobile) */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="md:hidden p-2.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-slate-400"
          >
            <History size={18} />
          </button>
        </div>

        {/* URL Input */}
        <div className="flex-1 relative flex gap-2">
          <div className="relative flex-1">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL..."
              className="w-full h-10 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg pl-3 pr-10 text-sm text-white focus:border-blue-500 outline-none font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-2 top-2.5 text-slate-500 hover:text-white hidden md:block"
              title="History"
            >
              <History size={16} />
            </button>

            {/* History Dropdown */}
            {showHistory && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2d2d2d] border border-[#3e3e42] rounded-lg shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
                {history.length === 0 && (
                  <div className="p-3 text-xs text-center text-slate-500">
                    No history
                  </div>
                )}
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setUrl(h.url);
                      setMethod(h.method);
                      setShowHistory(false);
                    }}
                    className="px-3 py-2 hover:bg-[#3e3e42] pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className={`text-[10px] font-bold w-10 ${
                          METHODS.find((m) => m.label === h.method)?.color
                        }`}
                      >
                        {h.method}
                      </span>
                      <span className="text-xs truncate text-slate-300">
                        {h.url}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-600">{h.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden md:inline">Send</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN AREA (Responsive Grid) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* --- LEFT: REQUEST PANE --- */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#3e3e42] h-1/2 md:h-full">
          {/* Tabs */}
          <div className="flex-none flex items-center px-2 border-b border-[#3e3e42] bg-[#1e1e1e]">
            <button
              onClick={() => setActiveTab("body")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "body"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Code size={14} /> Body
            </button>
            <button
              onClick={() => setActiveTab("headers")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "headers"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <List size={14} /> Headers{" "}
              <span className="bg-[#3e3e42] px-1.5 rounded-full text-[9px]">
                {headers.length}
              </span>
            </button>
          </div>

          <div className="flex-1 relative bg-[#1e1e1e] overflow-auto custom-scrollbar">
            {activeTab === "body" ? (
              method === "GET" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 select-none">
                  <Globe size={48} className="opacity-20 mb-2" />
                  <p className="text-xs font-medium">
                    GET requests usually don't have a body.
                  </p>
                </div>
              ) : (
                <Editor
                  value={body}
                  onValueChange={setBody}
                  highlight={(code) =>
                    Prism.highlight(code, Prism.languages.json, "json")
                  }
                  padding={15}
                  className="font-mono text-sm min-h-full"
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 13,
                    color: "#d4d4d4",
                  }}
                  textareaClassName="focus:outline-none"
                />
              )
            ) : (
              /* Headers Form */
              <div className="p-4 space-y-2">
                {headers.map((h) => (
                  <div key={h.id} className="flex gap-2">
                    <input
                      placeholder="Key (e.g. Authorization)"
                      value={h.key}
                      onChange={(e) =>
                        updateHeader(h.id, "key", e.target.value)
                      }
                      className="flex-1 bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-1.5 text-xs text-purple-400 outline-none focus:border-blue-500"
                    />
                    <input
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) =>
                        updateHeader(h.id, "value", e.target.value)
                      }
                      className="flex-1 bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-1.5 text-xs text-emerald-400 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeHeader(h.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1.5 text-xs text-blue-400 font-bold mt-2 hover:underline"
                >
                  <Plus size={14} /> Add Header
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: RESPONSE PANE --- */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#1e1e1e] h-1/2 md:h-full">
          {/* Status Bar (Giữ nguyên) */}
          <div className="flex-none px-3 py-2 border-b border-[#3e3e42] bg-[#252526] flex justify-between items-center h-[41px]">
            {/* ... (Code Header giữ nguyên) ... */}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layout size={12} /> Response
            </span>
            {status !== null && (
              <div className="flex gap-3 text-[10px] font-mono">
                <span
                  className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-black/20 ${getStatusColor(
                    status,
                  )}`}
                >
                  {status === 0 ? (
                    <WifiOff size={10} />
                  ) : (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isError ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                  )}
                  {status} {statusText}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {time}ms
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Database size={10} /> {size}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {/* 👇 MỚI: HIỆN CẢNH BÁO NẾU LỖI */}
            {isError && status !== 0 && (
              <div className="flex-none bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-start gap-2">
                <AlertCircle
                  size={14}
                  className="text-red-400 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-red-400">
                    Request Failed ({status})
                  </p>
                  <p className="text-[10px] text-red-300/70">
                    Server returned an error. See body below for details.
                  </p>
                </div>
              </div>
            )}

            {response ? (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(response)}
                  className="absolute top-2 right-2 p-1.5 bg-[#3e3e42] hover:bg-white/20 rounded text-slate-300 transition-colors z-10"
                  title="Copy Response"
                >
                  <Copy size={14} />
                </button>
                <Editor
                  value={response}
                  onValueChange={() => {}}
                  highlight={(code) => {
                    try {
                      JSON.parse(response);
                      return Prism.highlight(
                        code,
                        Prism.languages.json,
                        "json",
                      );
                    } catch {
                      return code.replace(/</g, "&lt;");
                    }
                  }}
                  padding={15}
                  className="font-mono text-sm min-h-full"
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 13,
                    // Nếu lỗi thì cho text màu đỏ nhạt để dễ biết, còn không thì màu code chuẩn
                    color: isError ? "#fca5a5" : "#d4d4d4",
                  }}
                  textareaClassName="focus:outline-none"
                  disabled
                />
              </>
            ) : (
              // ... (Phần Empty State giữ nguyên)
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                <Play size={48} className="mb-2 text-slate-700" />
                <p className="text-xs uppercase font-bold tracking-widest">
                  Ready to send
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
