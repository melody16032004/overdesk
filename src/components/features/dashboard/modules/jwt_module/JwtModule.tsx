import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Key,
  Lock,
  AlertTriangle,
  History,
  Trash2,
  Zap,
  Clipboard,
  X,
  Menu,
} from "lucide-react";
import { useToastStore } from "../../../../../stores/useToastStore";
import { CLAIM_DESCRIPTIONS } from "./constants/jwt_const";
import {
  base64UrlDecode,
  formatTime,
  getRelativeTime,
} from "./helper/jwt_helper";
import { JwtHistoryItem } from "./types/jwt_type";

export const JwtModule = () => {
  // --- 1. STATE MANAGEMENT ---

  const { showToast } = useToastStore();

  // A. JWT Data & Validation State
  const [token, setToken] = useState("");
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // B. History State
  const [history, setHistory] = useState<JwtHistoryItem[]>([]);

  // C. UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"input" | "decoded">(
    "input",
  );

  // --- 2. EFFECTS (LIFECYCLE & LOGIC) ---

  // Effect 1: Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_jwt_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Effect 2: Parse Token & Update History
  useEffect(() => {
    // 2.1. Reset if empty
    if (!token.trim()) {
      setHeader(null);
      setPayload(null);
      setIsValid(false);
      setError(null);
      return;
    }

    // 2.2. Validate Format
    const parts = token.split(".");
    if (parts.length !== 3) {
      setIsValid(false);
      setError("Invalid JWT format (must have 3 parts)");
      return;
    }

    // 2.3. Decode Base64
    const decodedHeader = base64UrlDecode(parts[0]);
    const decodedPayload = base64UrlDecode(parts[1]);

    if (!decodedHeader || !decodedPayload) {
      setIsValid(false);
      setError("Base64 decoding failed");
      return;
    }

    // 2.4. Parse JSON & Save
    try {
      const parsedHeader = JSON.parse(decodedHeader);
      const parsedPayload = JSON.parse(decodedPayload);

      setHeader(parsedHeader);
      setPayload(parsedPayload);
      setIsValid(true);
      setError(null);
      setActiveMobileTab("decoded");

      // Auto-save to history
      addToHistory(token, parsedPayload, true);
    } catch (e) {
      setIsValid(false);
      setError("JSON parsing failed");
    }
  }, [token]);

  // --- 3. HISTORY HANDLERS ---

  const addToHistory = (tokenVal: string, payloadVal: any, valid: boolean) => {
    setHistory((prev) => {
      // Prevent duplicates at the top
      if (prev.length > 0 && prev[0].token === tokenVal) return prev;

      const label =
        payloadVal?.sub ||
        payloadVal?.email ||
        payloadVal?.name ||
        tokenVal.substring(0, 15) + "...";

      const newItem: JwtHistoryItem = {
        id: Date.now().toString(),
        token: tokenVal,
        label: String(label),
        timestamp: Date.now(),
        isValid: valid,
      };

      const newHistory = [newItem, ...prev].slice(0, 20);
      localStorage.setItem("dashboard_jwt_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("dashboard_jwt_history", JSON.stringify(newHistory));
    showToast("Removed JWT from history", "success");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.setItem("dashboard_jwt_history", "[]");
    showToast("Cleared JWT history", "success");
  };

  // --- 4. CLIPBOARD HANDLERS ---

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
    } catch (err) {
      alert("Failed to read clipboard");
    }
  };

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- 5. COMPUTED VALUES ---

  const isExpired = payload?.exp ? Date.now() / 1000 > payload.exp : false;

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* 1. SIDEBAR HISTORY */}
      <div
        className={`
          absolute md:relative inset-y-0 left-0 z-30
          w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
      `}
      >
        <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
          <div className="font-bold text-white flex items-center gap-2">
            <History size={16} className="text-orange-500" /> Recent
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {history.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-4">
              No history yet
            </div>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setToken(item.token);
                setIsSidebarOpen(false);
              }}
              className={`group relative p-3 rounded-lg pointer border border-transparent hover:bg-[#3e3e42] transition-all pr-8 ${
                token === item.token ? "bg-[#3e3e42] border-slate-600" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`font-bold text-xs truncate w-28 ${
                    item.isValid ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[9px] text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 truncate font-mono opacity-60">
                {item.token}
              </div>

              {/* DELETE BUTTON - Hiện khi hover */}
              <button
                onClick={(e) => deleteHistoryItem(item.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#2d2d2d] rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Remove item"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {history.length > 0 && (
          <div className="p-3 border-t border-[#3e3e42]">
            <button
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-2 py-2 rounded text-slate-500 hover:text-red-400 hover:bg-[#3e3e42] text-xs transition-colors"
            >
              <Trash2 size={12} /> Clear All History
            </button>
          </div>
        )}
      </div>

      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* HEADER (Mobile Toggle) */}
        <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center md:hidden">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck size={18} className="text-purple-500" /> JWT Debugger
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* MOBILE TABS */}
        <div className="flex md:hidden border-b border-[#3e3e42] bg-[#1e1e1e]">
          <button
            onClick={() => setActiveMobileTab("input")}
            className={`flex-1 py-3 text-xs font-bold uppercase ${
              activeMobileTab === "input"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-slate-500"
            }`}
          >
            Encoded
          </button>
          <button
            onClick={() => setActiveMobileTab("decoded")}
            className={`flex-1 py-3 text-xs font-bold uppercase ${
              activeMobileTab === "decoded"
                ? "text-green-400 border-b-2 border-green-500"
                : "text-slate-500"
            }`}
            disabled={!isValid}
          >
            Decoded
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: INPUT */}
          <div
            className={`flex-1 flex flex-col border-r border-[#3e3e42] transition-all ${
              activeMobileTab === "input" ? "block" : "hidden md:flex"
            }`}
          >
            <div className="p-4 flex justify-between items-center bg-[#252526] border-b border-[#3e3e42]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Encoded Token
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePaste}
                  className="text-[10px] bg-[#3e3e42] hover:bg-[#4e4e52] text-white px-2 py-1 rounded flex items-center gap-1"
                >
                  <Clipboard size={10} /> Paste
                </button>
                <button
                  onClick={() => setToken("")}
                  className="text-[10px] text-slate-500 hover:text-red-400 px-2 py-1"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste JWT here (eyJ...)"
              className={`flex-1 w-full bg-[#1e1e1e] p-4 text-xs font-mono outline-none resize-none focus:bg-[#1a1a1a] transition-colors ${
                error ? "text-red-300" : "text-slate-300"
              }`}
            />
            {error && (
              <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
          </div>

          {/* RIGHT: DECODED */}
          <div
            className={`flex-[2] flex flex-col bg-[#1e1e1e] overflow-hidden ${
              activeMobileTab === "decoded" ? "block" : "hidden md:flex"
            }`}
          >
            {isValid ? (
              <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#3e3e42] overflow-hidden">
                {/* 1. INFO COLUMN */}
                <div className="md:w-5/12 flex flex-col overflow-y-auto custom-scrollbar bg-[#202022]">
                  {/* Header Section */}
                  <div className="p-4 border-b border-[#3e3e42]">
                    <div className="flex items-center gap-2 mb-3 text-red-400 font-bold text-xs uppercase tracking-wider">
                      <Key size={14} /> Header
                    </div>
                    <pre className="text-[10px] font-mono text-slate-300 bg-[#151515] p-2 rounded border border-[#3e3e42]">
                      {JSON.stringify(header, null, 2)}
                    </pre>
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                      Algorithm:{" "}
                      <span className="text-white font-bold">{header.alg}</span>
                      {header.alg === "none" && (
                        <span className="text-red-500 flex items-center gap-1 ml-1">
                          <AlertTriangle size={8} /> Unsecured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time Analysis */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-xs uppercase tracking-wider">
                      <Clock size={14} /> Timeline
                    </div>
                    <div className="space-y-4">
                      {payload.iat && (
                        <div className="relative pl-3 border-l-2 border-slate-600">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">
                            Issued At (iat)
                          </div>
                          <div className="text-xs text-white font-mono">
                            {formatTime(payload.iat)}
                          </div>
                        </div>
                      )}
                      {payload.exp && (
                        <div
                          className={`relative pl-3 border-l-2 ${
                            isExpired ? "border-red-500" : "border-green-500"
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase font-bold">
                            Expiration (exp)
                          </div>
                          <div className="text-xs text-white font-mono">
                            {formatTime(payload.exp)}
                          </div>
                          <div
                            className={`text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${
                              isExpired
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {getRelativeTime(payload.exp)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. PAYLOAD COLUMN */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
                  <div className="flex-none p-2 border-b border-[#3e3e42] bg-[#252526] flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 pl-2 flex items-center gap-2">
                      <Lock size={14} /> Payload
                    </span>
                    <button
                      onClick={() => copyJson(payload)}
                      className="px-3 py-1 bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-[10px] font-bold rounded flex items-center gap-1"
                    >
                      {copied ? <Check size={10} /> : <Copy size={10} />} Copy
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <Editor
                      value={JSON.stringify(payload, null, 2)}
                      onValueChange={() => {}}
                      highlight={(code) =>
                        highlight(code, languages.json, "json")
                      }
                      padding={20}
                      className="font-mono text-xs min-h-full"
                      disabled
                      style={{
                        fontFamily: '"Fira Code", monospace',
                        backgroundColor: "#1e1e1e",
                        color: "#d4d4d4",
                      }}
                    />
                  </div>

                  {/* Smart Claims Legend */}
                  <div className="flex-none p-3 border-t border-[#3e3e42] bg-[#202022] max-h-32 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <Zap size={10} /> Detected Standard Claims
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.keys(payload).map((key) => {
                        if (CLAIM_DESCRIPTIONS[key]) {
                          return (
                            <div key={key} className="flex gap-2 text-[10px]">
                              <span className="font-mono text-purple-400 font-bold min-w-[30px]">
                                {key}
                              </span>
                              <span className="text-slate-400">
                                - {CLAIM_DESCRIPTIONS[key]}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                <div className="bg-[#252526] p-6 rounded-full mb-4 shadow-xl border border-[#3e3e42] animate-in zoom-in">
                  <ShieldCheck
                    size={48}
                    className="text-purple-600 opacity-50"
                  />
                </div>
                <h3 className="text-lg font-medium text-slate-300">
                  JWT Inspector
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-xs">
                  Enter a token on the left to decode header, payload and verify
                  timestamps securely.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
