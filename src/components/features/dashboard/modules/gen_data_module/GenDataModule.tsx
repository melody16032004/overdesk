import { useState, useEffect } from "react";
import {
  Type,
  Copy,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Check,
  AlignLeft,
  Fingerprint,
  FileText,
} from "lucide-react";
import { WORDS, NAMES, DOMAINS } from "./constants/gen_data_const";
import {
  randomInt,
  randomItem,
  removeVietnameseTones,
} from "./helper/gen_data_helper";
import { GenType, LangType } from "./types/gen_data_type";

export const GenDataModule = () => {
  const [type, setType] = useState<GenType>("paragraph");
  const [lang, setLang] = useState<LangType>("vi");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // --- GENERATORS ---

  const generate = () => {
    let output = [];
    const wordList = WORDS[lang];

    switch (type) {
      case "word":
        for (let i = 0; i < count; i++) output.push(randomItem(wordList));
        setResult(output.join(" "));
        break;

      case "sentence":
        for (let i = 0; i < count; i++) {
          const len = randomInt(8, 20); // Câu dài hơn chút
          const words = Array.from({ length: len }, () => randomItem(wordList));
          // Viết hoa chữ cái đầu + dấu chấm
          const sentence = words.join(" ");
          output.push(
            sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".",
          );
        }
        setResult(output.join(" "));
        break;

      case "paragraph":
        for (let i = 0; i < count; i++) {
          const sentencesCount = randomInt(4, 10);
          const sentences = [];
          for (let j = 0; j < sentencesCount; j++) {
            const len = randomInt(10, 25);
            const words = Array.from({ length: len }, () =>
              randomItem(wordList),
            );
            const s = words.join(" ");
            sentences.push(s.charAt(0).toUpperCase() + s.slice(1) + ".");
          }
          output.push(sentences.join(" "));
        }
        setResult(output.join("\n\n"));
        break;

      case "email":
        for (let i = 0; i < count; i++) {
          let emailPrefix = "";
          if (lang === "vi") {
            // Tạo tên thật -> Xóa dấu -> Ghép email
            const family = randomItem(NAMES.vi.family);
            const given = randomItem(NAMES.vi.given);
            // Format: ten.ho (binh.nguyen)
            emailPrefix = `${removeVietnameseTones(
              given,
            )}.${removeVietnameseTones(family)}`;
          } else {
            const fname = randomItem(NAMES.en.first).toLowerCase();
            const lname = randomItem(NAMES.en.last).toLowerCase();
            emailPrefix = `${fname}.${lname}`;
          }

          // Thêm số ngẫu nhiên 30% cơ hội để trông thật hơn
          if (Math.random() > 0.7) emailPrefix += randomInt(1, 99);

          output.push(`${emailPrefix}@${randomItem(DOMAINS)}`);
        }
        setResult(output.join("\n"));
        break;

      case "name":
        for (let i = 0; i < count; i++) {
          if (lang === "vi") {
            // Cấu trúc: Họ + Đệm + Tên (Tỉ lệ 80% có đệm)
            const hasMiddle = Math.random() > 0.2;
            const middle = hasMiddle ? ` ${randomItem(NAMES.vi.middle)}` : "";
            output.push(
              `${randomItem(NAMES.vi.family)}${middle} ${randomItem(
                NAMES.vi.given,
              )}`,
            );
          } else {
            // Cấu trúc: First + Last
            output.push(
              `${randomItem(NAMES.en.first)} ${randomItem(NAMES.en.last)}`,
            );
          }
        }
        setResult(output.join("\n"));
        break;

      case "uuid":
        for (let i = 0; i < count; i++) output.push(crypto.randomUUID());
        setResult(output.join("\n"));
        break;

      case "date":
        for (let i = 0; i < count; i++) {
          const start = new Date(2015, 0, 1);
          const end = new Date();
          const date = new Date(
            start.getTime() + Math.random() * (end.getTime() - start.getTime()),
          );
          // Format theo ngôn ngữ
          if (lang === "vi") {
            // VN: DD/MM/YYYY
            output.push(date.toLocaleDateString("vi-VN"));
          } else {
            // EN: YYYY-MM-DD
            output.push(date.toISOString().split("T")[0]);
          }
        }
        setResult(output.join("\n"));
        break;
    }
  };

  useEffect(() => {
    generate();
  }, [type, count, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans relative overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg">
            <FileText size={18} />
          </div>
          <h2 className="font-bold text-white tracking-tight text-sm md:text-base">
            Data Generator
          </h2>
        </div>

        <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42]">
          <button
            onClick={() => setLang("vi")}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              lang === "vi"
                ? "bg-red-500 text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            VN
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              lang === "en"
                ? "bg-blue-500 text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("lorem")}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              lang === "lorem"
                ? "bg-gray-500 text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            Lorem
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: CONTROLS */}
        <div className="w-1/3 min-w-[140px] border-r border-[#3e3e42] bg-[#252526] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">
              Text
            </div>
            <button
              onClick={() => setType("paragraph")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "paragraph"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <AlignLeft size={14} /> Paragraphs
            </button>
            <button
              onClick={() => setType("sentence")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "sentence"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <Type size={14} /> Sentences
            </button>
            <button
              onClick={() => setType("word")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "word"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <Type size={14} /> Words
            </button>
          </div>

          <div className="h-px bg-[#3e3e42] mx-2"></div>

          <div className="p-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">
              Entity
            </div>
            <button
              onClick={() => setType("email")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "email"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <Mail size={14} /> Email
            </button>
            <button
              onClick={() => setType("name")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "name"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <User size={14} /> Full Name
            </button>
            <button
              onClick={() => setType("uuid")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "uuid"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <Fingerprint size={14} /> UUID
            </button>
            <button
              onClick={() => setType("date")}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${
                type === "date"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-[#3e3e42]"
              }`}
            >
              <Calendar size={14} /> Date
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-[#3e3e42] bg-[#1e1e1e]">
            <div className="flex justify-between text-xs mb-2 font-bold text-slate-400">
              <span>Quantity</span>
              <span className="text-white">{count}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full h-1 bg-[#3e3e42] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={generate}
                className="p-2 bg-[#3e3e42] hover:bg-indigo-600 text-white rounded transition-colors flex-1 mr-2 flex justify-center"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex-1 flex justify-center"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
          <div className="flex-none px-4 py-2 border-b border-[#3e3e42] bg-[#252526] text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
            <span>Output Result</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                lang === "vi"
                  ? "bg-red-500/20 text-red-400"
                  : lang === "en"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-500/20 text-slate-400"
              }`}
            >
              {lang === "lorem"
                ? "LOREM IPSUM"
                : lang === "vi"
                  ? "VIETNAMESE"
                  : "ENGLISH"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <textarea
              value={result}
              readOnly
              className="w-full h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm resize-none outline-none custom-scrollbar leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
