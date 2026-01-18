import { useState, useMemo } from "react";
import Editor from "react-simple-code-editor";
import {
  Regex,
  Book,
  ChevronRight,
  AlertTriangle,
  Info,
  X,
  ArrowRightLeft,
  Copy,
  Settings2,
} from "lucide-react";

// --- LIBRARY DATA ---
const REGEX_LIBRARY = [
  {
    label: "Email",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    desc: "Địa chỉ email chuẩn",
  },
  {
    label: "Phone (VN)",
    pattern: "(84|0[3|5|7|8|9])+([0-9]{8})\\b",
    desc: "Số điện thoại Việt Nam",
  },
  {
    label: "Date (DD/MM/YYYY)",
    pattern:
      "\\b(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\\d\\d\\b",
    desc: "Ngày tháng năm",
  },
  {
    label: "URL",
    pattern:
      "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    desc: "Đường dẫn liên kết",
  },
  {
    label: "IPv4",
    pattern:
      "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    desc: "Địa chỉ IP",
  },
  {
    label: "Hex Color",
    pattern: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})",
    desc: "Mã màu Hex",
  },
  {
    label: "Password Strong",
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    desc: "Mật khẩu mạnh",
  },
  {
    label: "Slug",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    desc: "URL slug an toàn",
  },
];

export const RegexModule = () => {
  // --- STATE ---
  const [pattern, setPattern] = useState("\\b\\w+\\b");
  const [flags, setFlags] = useState("gm");
  const [text, setText] = useState(
    "Hello World! This is a Regex Tester.\nContact: dev@overdesk.app\nPhone: 0901234567"
  );
  const [replaceStr, setReplaceStr] = useState("REPLACED");

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);

  // --- LOGIC ---
  const { matchCount, error, resultText } = useMemo(() => {
    try {
      if (!pattern) return { matchCount: 0, error: null, resultText: text };
      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex);
      const count = matches ? (flags.includes("g") ? matches.length : 1) : 0;
      const replaced = text.replace(regex, replaceStr);
      return { matchCount: count, error: null, resultText: replaced };
    } catch (e: any) {
      return { matchCount: 0, error: e.message, resultText: text };
    }
  }, [pattern, flags, text, replaceStr]);

  // --- HIGHLIGHTER ---
  const highlightCode = (code: string) => {
    if (!pattern)
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    try {
      const regex = new RegExp(
        pattern,
        flags + (flags.includes("g") ? "" : "g")
      );
      let lastIndex = 0;
      let result = "";
      let match;
      const escape = (str: string) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      while ((match = regex.exec(code)) !== null) {
        result += escape(code.slice(lastIndex, match.index));
        const color = isReplaceMode
          ? "rgba(249, 115, 22, 0.4)"
          : "rgba(236, 72, 153, 0.4)";
        const borderColor = isReplaceMode
          ? "rgba(249, 115, 22, 0.6)"
          : "rgba(236, 72, 153, 0.6)";
        result += `<span style="background-color: ${color}; color: white; border-radius: 3px; box-shadow: 0 0 0 1px ${borderColor};">${escape(
          match[0]
        )}</span>`;
        lastIndex = regex.lastIndex;
        if (!flags.includes("g")) break;
        if (match[0].length === 0) regex.lastIndex++;
      }
      result += escape(code.slice(lastIndex));
      return result;
    } catch (e) {
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  };

  const toggleFlag = (f: string) =>
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f));

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans relative overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="text-pink-500 bg-pink-500/10 p-1.5 rounded-lg">
            <Regex size={18} />
          </div>
          <h2 className="font-bold text-white tracking-tight text-sm md:text-base">
            Regex Lab
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsReplaceMode(!isReplaceMode)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
              isReplaceMode
                ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                : "bg-[#1e1e1e] border border-[#3e3e42] text-slate-400 hover:text-white"
            }`}
          >
            <ArrowRightLeft size={14} />{" "}
            <span className="hidden md:inline">Replace</span>
          </button>
          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
              isLibraryOpen
                ? "bg-pink-600 text-white shadow-lg shadow-pink-900/20"
                : "bg-[#1e1e1e] border border-[#3e3e42] text-slate-400 hover:text-white"
            }`}
          >
            <Book size={14} /> <span className="hidden md:inline">Library</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* CONTROL PANEL */}
          <div className="p-3 md:p-4 border-b border-[#3e3e42] bg-[#1e1e1e] space-y-3 shadow-lg z-10">
            {/* Pattern & Flags Row */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Pattern Input */}
              <div className="flex-1 relative group flex items-center gap-2">
                <span className="text-slate-600 font-mono text-xl font-light hidden md:block">
                  /
                </span>
                <div className="relative flex-1">
                  <input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Insert regex pattern..."
                    className={`w-full bg-[#252526] border ${
                      error
                        ? "border-red-500"
                        : "border-[#3e3e42] group-hover:border-pink-500/50"
                    } rounded-lg pl-3 pr-20 py-2.5 text-sm md:text-base font-mono text-pink-400 outline-none focus:border-pink-500 transition-colors shadow-inner`}
                  />
                  <div
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      matchCount > 0
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {matchCount} Matches
                  </div>
                </div>
                <span className="text-slate-600 font-mono text-xl font-light hidden md:block">
                  /
                </span>
              </div>

              {/* Flags Toggles */}
              <div className="flex gap-1 items-center justify-end md:justify-start">
                <div className="text-[10px] font-bold text-slate-500 mr-1 md:hidden">
                  <Settings2 size={12} />
                </div>
                {["g", "i", "m"].map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFlag(f)}
                    className={`w-8 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all border ${
                      flags.includes(f)
                        ? "bg-pink-600 border-pink-500 text-white shadow"
                        : "bg-[#252526] border-[#3e3e42] text-slate-500 hover:text-slate-300"
                    }`}
                    title={
                      f === "g"
                        ? "Global"
                        : f === "i"
                        ? "Case Insensitive"
                        : "Multiline"
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Replace Input (Collapsible) */}
            {isReplaceMode && (
              <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <span className="text-slate-500 hidden md:block">
                  <ArrowRightLeft size={16} />
                </span>
                <input
                  value={replaceStr}
                  onChange={(e) => setReplaceStr(e.target.value)}
                  placeholder="Replacement string (supports $1, $2...)"
                  className="flex-1 bg-[#252526] border border-[#3e3e42] rounded-lg px-3 py-2 text-sm font-mono text-orange-400 outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 animate-in fade-in">
                <AlertTriangle size={14} className="shrink-0" />{" "}
                <span className="truncate">{error}</span>
              </div>
            )}
          </div>

          {/* EDITOR AREA (SPLIT VIEW) */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* INPUT EDITOR */}
            <div
              className={`flex-1 flex flex-col min-h-0 bg-[#1e1e1e] ${
                isReplaceMode
                  ? "border-b md:border-b-0 md:border-r border-[#3e3e42] h-1/2 md:h-full"
                  : "h-full"
              }`}
            >
              <div className="flex-none px-4 py-1.5 border-b border-[#3e3e42] bg-[#252526] text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
                <span>Input Text</span>
                {text && (
                  <button
                    onClick={() => setText("")}
                    className="hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden relative">
                <Editor
                  value={text}
                  onValueChange={setText}
                  highlight={highlightCode}
                  padding={20}
                  className="font-mono text-sm min-h-full"
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 13,
                    backgroundColor: "#1e1e1e",
                    color: "#d4d4d4",
                    lineHeight: "1.6",
                  }}
                  textareaClassName="focus:outline-none"
                />
                {!text && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none opacity-30">
                    <Info size={32} className="mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Type to test
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* OUTPUT EDITOR (ONLY IN REPLACE MODE) */}
            {isReplaceMode && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] animate-in fade-in h-1/2 md:h-full">
                <div className="flex-none px-4 py-1.5 border-b border-[#3e3e42] bg-[#2d2d2d] text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
                  <span className="text-orange-400">Result</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(resultText)}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-5 bg-[#1b1b1b]">
                  <pre
                    className="text-sm text-slate-300 whitespace-pre-wrap font-[inherit] break-words"
                    style={{
                      fontFamily: '"Fira Code", monospace',
                      lineHeight: "1.6",
                    }}
                  >
                    {resultText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIBRARY DRAWER */}
        <div
          className={`absolute md:relative inset-y-0 right-0 z-30 md:z-0 border-l border-[#3e3e42] bg-[#252526] flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${
            isLibraryOpen
              ? "w-64 translate-x-0"
              : "w-0 translate-x-full md:translate-x-0 md:w-0 opacity-0 md:opacity-100 overflow-hidden"
          }`}
        >
          <div className="flex-none p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d2d]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Templates
            </span>
            <button onClick={() => setIsLibraryOpen(false)}>
              <X size={16} className="text-slate-500 hover:text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {REGEX_LIBRARY.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setPattern(item.pattern);
                  if (window.innerWidth < 768) setIsLibraryOpen(false);
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-[#3e3e42] group border border-transparent hover:border-[#454545] transition-all relative"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200 text-xs group-hover:text-pink-400">
                    {item.label}
                  </span>
                  <ChevronRight
                    size={12}
                    className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
                  />
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono bg-[#1e1e1e] p-1.5 rounded border border-[#3e3e42] text-pink-300/80 mb-1">
                  {item.pattern}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Backdrop for Mobile Drawer */}
        {isLibraryOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsLibraryOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
};
