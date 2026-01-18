import { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import {
  Lock,
  Unlock,
  Hash,
  FileCode,
  Copy,
  ShieldCheck,
  KeyRound,
  ArrowRightLeft,
  HelpCircle,
  X,
  Check,
  ChevronDown,
} from "lucide-react";

const MODES = [
  {
    id: "aes",
    label: "AES Encryption",
    icon: ShieldCheck,
    desc: "Encrypt with password",
  },
  { id: "hash", label: "Hashing", icon: Hash, desc: "MD5, SHA-1, SHA-256" },
  { id: "base64", label: "Base64", icon: FileCode, desc: "Encode / Decode" },
];

const GUIDES: Record<string, any> = {
  aes: (
    <div className="text-xs space-y-2">
      <p>
        <strong>AES (Advanced Encryption Standard)</strong> là tiêu chuẩn mã hóa
        bảo mật cao.
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
        <li>
          <strong>Encrypt (Mã hóa):</strong> Biến văn bản thành chuỗi ký tự ngẫu
          nhiên. Bắt buộc phải có <em>Secret Key</em> (Mật khẩu).
        </li>
        <li>
          <strong>Decrypt (Giải mã):</strong> Dán chuỗi đã mã hóa vào Input,
          nhập đúng <em>Secret Key</em> đã dùng lúc mã hóa, rồi bấm Decrypt.
        </li>
        <li>
          <span className="text-red-500">Lưu ý:</span> Nếu quên Secret Key, dữ
          liệu sẽ không thể phục hồi.
        </li>
      </ul>
    </div>
  ),
  hash: (
    <div className="text-xs space-y-2">
      <p>
        <strong>Hashing (Băm dữ liệu)</strong> là quá trình một chiều, tạo ra
        "dấu vân tay" duy nhất cho dữ liệu.
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
        <li>
          Dùng để kiểm tra tính toàn vẹn (xem file/text có bị sửa đổi không).
        </li>
        <li>
          <strong>Không thể giải mã</strong> (Không thể dịch ngược từ mã Hash về
          văn bản gốc).
        </li>
        <li>SHA-256 an toàn hơn MD5.</li>
      </ul>
    </div>
  ),
  base64: (
    <div className="text-xs space-y-2">
      <p>
        <strong>Base64</strong> dùng để chuyển đổi dữ liệu dạng nhị phân hoặc
        văn bản sang dạng ký tự ASCII an toàn.
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
        <li>Thường dùng để mã hóa mã nguồn, email, hoặc nhúng ảnh vào web.</li>
        <li>Hỗ trợ tiếng Việt (UTF-8) không bị lỗi font.</li>
        <li>
          Đây là <strong>Encoding</strong>, không phải Encryption (không cần mật
          khẩu).
        </li>
      </ul>
    </div>
  ),
};

// --- COMPONENT: CUSTOM ALGO SELECT ---
const AlgoSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: "MD5", value: "MD5" },
    { label: "SHA-1", value: "SHA1" },
    { label: "SHA-256", value: "SHA256" },
    { label: "SHA-512", value: "SHA512" },
  ];

  // Logic đóng menu khi click ra ngoài (Chuẩn)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button" // Quan trọng
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all min-w-[90px] justify-between
          ${
            isOpen
              ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20"
              : "bg-slate-100 dark:bg-black/20 border-transparent hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
          }
        `}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 text-[10px] font-medium flex items-center justify-between transition-colors
                ${
                  value === opt.value
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }
              `}
            >
              {opt.label}
              {value === opt.value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CryptoModule = () => {
  const [activeMode, setActiveMode] = useState("aes");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // State cho AES
  const [secretKey, setSecretKey] = useState("");

  // State cho Hash
  const [hashAlgo, setHashAlgo] = useState("SHA256");

  // State cho Base64
  const [isBase64Encode, setIsBase64Encode] = useState(true);

  const handleProcess = () => {
    if (!input) {
      setOutput("");
      return;
    }
    try {
      let result = "";
      if (activeMode === "aes") {
        if (!secretKey) {
          setOutput("Error: Please enter a Secret Key");
          return;
        }
        result = CryptoJS.AES.encrypt(input, secretKey).toString();
      } else if (activeMode === "hash") {
        switch (hashAlgo) {
          case "MD5":
            result = CryptoJS.MD5(input).toString();
            break;
          case "SHA1":
            result = CryptoJS.SHA1(input).toString();
            break;
          case "SHA256":
            result = CryptoJS.SHA256(input).toString();
            break;
          case "SHA512":
            result = CryptoJS.SHA512(input).toString();
            break;
          default:
            result = "";
        }
      } else if (activeMode === "base64") {
        if (isBase64Encode) {
          const utf8Words = CryptoJS.enc.Utf8.parse(input);
          result = CryptoJS.enc.Base64.stringify(utf8Words);
        } else {
          const parsedWords = CryptoJS.enc.Base64.parse(input);
          result = CryptoJS.enc.Utf8.stringify(parsedWords);
        }
      }
      setOutput(result);
    } catch (error) {
      setOutput("Error: Invalid Input or Key");
    }
  };

  const handleAesDecrypt = () => {
    if (!input || !secretKey) return;
    try {
      const bytes = CryptoJS.AES.decrypt(input, secretKey);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (originalText) setOutput(originalText);
      else setOutput("Error: Wrong Key or Corrupted Data");
    } catch (e) {
      setOutput("Error: Decryption Failed");
    }
  };

  useEffect(() => {
    if (activeMode !== "aes") handleProcess();
  }, [input, activeMode, hashAlgo, isBase64Encode]);

  const copyToClipboard = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden relative">
      {/* SIDEBAR */}
      <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              setActiveMode(mode.id);
              setInput("");
              setOutput("");
              setShowHelp(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              activeMode === mode.id
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <mode.icon size={18} />
            <div>
              <div className="text-xs font-bold">{mode.label}</div>
              <div
                className={`text-[9px] ${
                  activeMode === mode.id ? "text-indigo-200" : "opacity-60"
                }`}
              >
                {mode.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto relative">
        {/* HEADER INPUT AREA */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-sm flex-1 flex flex-col relative">
          {/* Nút Help Toggle */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`p-1.5 rounded-full transition-colors ${
                showHelp
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
              title="How to use"
            >
              {showHelp ? <X size={16} /> : <HelpCircle size={16} />}
            </button>
          </div>

          {/* KHUNG HƯỚNG DẪN */}
          {showHelp && (
            <div className="mb-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                <HelpCircle size={12} /> How to use {activeMode.toUpperCase()}
              </h4>
              {GUIDES[activeMode]}
            </div>
          )}

          {/* Thay thẻ <label> thành <div> để tránh lỗi focus khi click Dropdown */}
          <div className="mb-2 flex justify-between items-end pr-8">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Input Text
            </label>
            <div className="flex gap-2">
              {activeMode === "base64" && (
                <button
                  onClick={() => setIsBase64Encode(!isBase64Encode)}
                  className="flex items-center gap-1 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg text-[10px] hover:bg-indigo-100 transition-colors font-bold"
                >
                  <ArrowRightLeft size={12} />
                  {isBase64Encode ? "Encode" : "Decode"}
                </button>
              )}
              {activeMode === "hash" && (
                <AlgoSelect value={hashAlgo} onChange={setHashAlgo} />
              )}
            </div>
          </div>

          <textarea
            className="flex-1 w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm font-mono outline-none focus:border-indigo-500 resize-none transition-all"
            placeholder={
              showHelp
                ? "Read the guide above..."
                : "Type or paste content here..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {/* CONTROLS CHO AES */}
          {activeMode === "aes" && (
            <div className="mt-3 flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Secret Key
                </label>
                <div className="relative">
                  <KeyRound
                    size={14}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    type="password"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono transition-all"
                    placeholder="Password..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleProcess}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors h-9 shadow-sm"
              >
                <Lock size={14} /> Encrypt
              </button>
              <button
                onClick={handleAesDecrypt}
                className="px-3 py-2 bg-slate-100 dark:bg-white/10 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors h-9"
              >
                <Unlock size={14} /> Decrypt
              </button>
            </div>
          )}
        </div>

        {/* OUTPUT AREA */}
        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-inner flex-1 flex flex-col min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Result
            </label>
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="flex-1 w-full p-2 text-sm font-mono text-slate-700 dark:text-slate-300 break-all overflow-y-auto max-h-[150px] select-all">
            {output || (
              <span className="text-slate-400 italic opacity-50 text-xs">
                Waiting for input...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
