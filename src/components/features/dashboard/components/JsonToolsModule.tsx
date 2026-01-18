import { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css"; // Theme tối

import {
  Braces,
  Split,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ArrowRightLeft,
  Minimize,
  Maximize,
} from "lucide-react";

// --- TYPES ---
type Mode = "format" | "diff";

interface DiffLine {
  type: "same" | "add" | "remove";
  content: string;
  lineNum?: number;
}

// --- HELPERS ---

const formatJson = (str: string, indent = 2) => {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

// Thuật toán so sánh đơn giản (Line-by-Line Diff)
const computeDiff = (textA: string, textB: string): DiffLine[] => {
  // 1. Format chuẩn trước khi so sánh
  let linesA: string[] = [];
  let linesB: string[] = [];

  try {
    linesA = formatJson(textA).split("\n");
  } catch {
    linesA = textA.split("\n");
  } // Fallback nếu không phải JSON

  try {
    linesB = formatJson(textB).split("\n");
  } catch {
    linesB = textB.split("\n");
  }

  // 2. So sánh (Naive Algorithm)
  const diffs: DiffLine[] = [];
  let i = 0,
    j = 0;

  while (i < linesA.length || j < linesB.length) {
    const lineA = linesA[i];
    const lineB = linesB[j];

    // Trường hợp giống nhau
    if (lineA === lineB) {
      diffs.push({ type: "same", content: lineA, lineNum: i + 1 });
      i++;
      j++;
    }
    // Khác nhau
    else {
      // Tìm xem dòng A có xuất hiện ở B tương lai gần không? (Để phát hiện Insert)
      let foundA_in_B = -1;
      for (let k = j + 1; k < Math.min(j + 5, linesB.length); k++) {
        if (linesB[k] === lineA) {
          foundA_in_B = k;
          break;
        }
      }

      if (foundA_in_B !== -1) {
        // Có vẻ như các dòng từ j đến foundA_in_B là mới thêm vào (ADD)
        while (j < foundA_in_B) {
          diffs.push({ type: "add", content: linesB[j] });
          j++;
        }
      } else {
        // Không thấy A trong B -> A đã bị xóa (REMOVE)
        // Hoặc là dòng modified (REMOVE A + ADD B)
        if (i < linesA.length) {
          diffs.push({ type: "remove", content: lineA, lineNum: i + 1 });
          i++;
        }
        // Nếu đây là modified, dòng B sẽ được xử lý ở vòng lặp sau hoặc coi như ADD ngay
        if (
          j < linesB.length &&
          (i >= linesA.length || linesA[i] === linesB[j + 1])
        ) {
          // Simple heuristic check
          diffs.push({ type: "add", content: lineB });
          j++;
        }
      }
    }
  }
  return diffs;
};

export const JsonToolsModule = () => {
  const [mode, setMode] = useState<Mode>("format");

  // Format State
  const [inputJson, setInputJson] = useState("");
  const [outputJson, setOutputJson] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Diff State
  const [diffLeft, setDiffLeft] = useState("");
  const [diffRight, setDiffRight] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);

  const [copied, setCopied] = useState(false);

  // --- ACTIONS ---
  const handleFormat = () => {
    try {
      const formatted = formatJson(inputJson);
      setOutputJson(formatted);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
      setOutputJson("");
    }
  };

  const handleMinify = () => {
    try {
      const obj = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(obj));
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDiff = () => {
    // Cho phép diff cả khi JSON lỗi (so sánh raw text)
    const res = computeDiff(diffLeft, diffRight);
    setDiffResult(res);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    if (mode === "format") {
      setInputJson("");
      setOutputJson("");
      setErrorMsg(null);
    } else {
      setDiffLeft("");
      setDiffRight("");
      setDiffResult([]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden">
      {/* 1. HEADER & TABS */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex justify-between items-center">
        <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42]">
          <button
            onClick={() => setMode("format")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              mode === "format"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Braces size={14} /> Formatter
          </button>
          <button
            onClick={() => setMode("diff")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              mode === "diff"
                ? "bg-orange-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Split size={14} /> Diff Checker
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="p-2 hover:bg-[#3e3e42] text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            title="Clear All"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 2. CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        {/* --- MODE: FORMATTER --- */}
        {mode === "format" && (
          <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#3e3e42]">
            {/* LEFT: INPUT */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
              <div className="flex-none p-2 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-2">
                  Input JSON
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={handleMinify}
                    className="px-3 py-1 bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-[10px] font-bold rounded flex items-center gap-1"
                  >
                    <Minimize size={10} /> Minify
                  </button>
                  <button
                    onClick={handleFormat}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-lg shadow-blue-900/20"
                  >
                    <Maximize size={10} /> Beautify
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <Editor
                  value={inputJson}
                  onValueChange={setInputJson}
                  highlight={(code) => highlight(code, languages.json, "json")}
                  padding={16}
                  className="font-mono text-xs min-h-full"
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    backgroundColor: "#1e1e1e",
                  }}
                  textareaClassName="focus:outline-none"
                  placeholder="Paste messy JSON here..."
                />
              </div>
            </div>

            {/* RIGHT: OUTPUT */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
              <div className="flex-none p-2 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-2">
                  Result
                </span>
                <button
                  onClick={copyResult}
                  disabled={!outputJson}
                  className="px-3 py-1 bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-[10px] font-bold rounded flex items-center gap-1 disabled:opacity-50"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex-1 relative overflow-auto custom-scrollbar">
                {errorMsg ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center animate-in zoom-in-95">
                    <AlertCircle size={48} className="mb-3 opacity-50" />
                    <h3 className="font-bold mb-1">Invalid JSON</h3>
                    <p className="text-xs font-mono bg-red-500/10 p-2 rounded border border-red-500/20">
                      {errorMsg}
                    </p>
                  </div>
                ) : (
                  <Editor
                    value={outputJson}
                    onValueChange={() => {}} // Readonly
                    highlight={(code) =>
                      highlight(code, languages.json, "json")
                    }
                    padding={16}
                    className="font-mono text-xs min-h-full"
                    disabled
                    style={{
                      fontFamily: '"Fira Code", monospace',
                      backgroundColor: outputJson ? "#1e1e1e" : "transparent",
                    }}
                  />
                )}
                {!outputJson && !errorMsg && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs pointer-events-none">
                    Result will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- MODE: DIFF --- */}
        {mode === "diff" && (
          <div className="h-full flex flex-col">
            {/* INPUTS AREA */}
            <div className="h-1/3 flex border-b border-[#3e3e42]">
              <div className="flex-1 flex flex-col border-r border-[#3e3e42]">
                <div className="p-2 bg-[#2d2d2d] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#3e3e42]">
                  Original (Left)
                </div>
                <textarea
                  value={diffLeft}
                  onChange={(e) => setDiffLeft(e.target.value)}
                  className="flex-1 bg-[#1e1e1e] text-slate-300 p-3 text-xs font-mono outline-none resize-none placeholder:text-slate-600"
                  placeholder='{"id": 1, "name": "A"}'
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="p-2 bg-[#2d2d2d] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#3e3e42]">
                  Modified (Right)
                </div>
                <textarea
                  value={diffRight}
                  onChange={(e) => setDiffRight(e.target.value)}
                  className="flex-1 bg-[#1e1e1e] text-slate-300 p-3 text-xs font-mono outline-none resize-none placeholder:text-slate-600"
                  placeholder='{"id": 1, "name": "B"}'
                />
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex-none p-2 bg-[#252526] border-b border-[#3e3e42] flex justify-center">
              <button
                onClick={handleDiff}
                className="px-6 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <ArrowRightLeft size={14} /> Compare Versions
              </button>
            </div>

            {/* DIFF OUTPUT */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e] custom-scrollbar p-4">
              {diffResult.length > 0 ? (
                <div className="font-mono text-xs bg-[#121212] rounded-lg border border-[#3e3e42] overflow-hidden">
                  {diffResult.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        line.type === "add"
                          ? "bg-green-500/10 text-green-400"
                          : line.type === "remove"
                          ? "bg-red-500/10 text-red-400 decoration-red-500/30"
                          : "text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-8 flex-none text-right pr-3 py-0.5 select-none border-r border-white/5 opacity-50 ${
                          line.type === "remove" ? "line-through" : ""
                        }`}
                      >
                        {line.type === "add"
                          ? "+"
                          : line.type === "remove"
                          ? "-"
                          : line.lineNum}
                      </div>
                      <div className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-all">
                        {line.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <Split size={48} className="mb-3 opacity-20" />
                  <p className="text-sm">
                    Enter JSON in both panels and click Compare
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
