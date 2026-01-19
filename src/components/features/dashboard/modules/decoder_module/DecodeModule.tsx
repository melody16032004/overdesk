import { useState, useEffect, useRef } from "react";
import { Eye, Copy, Play, Square, Volume2, Info, X } from "lucide-react";
import {
  REVERSE_MORSE_MAP,
  MORSE_MAP,
  REVERSE_BRAILLE_MAP,
  BRAILLE_MAP,
  BRAILLE_DOTS_MAP,
  MODES,
} from "./constants/decode_const";

export const DecodeModule = () => {
  // --- 1. STATE & REFS ---

  // UI State
  const [mode, setMode] = useState("morse");
  const [showTable, setShowTable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Data State
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dotExplanation, setDotExplanation] = useState<string[]>([]);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- 2. CONVERSION LOGIC ---

  useEffect(() => {
    if (!input) {
      setOutput("");
      setDotExplanation([]);
      return;
    }

    if (mode === "morse") {
      const isMorseInput = /^[.\- /]+$/.test(input);
      if (isMorseInput) {
        // Morse -> Text
        const decoded = input
          .split(" ")
          .map((code) => REVERSE_MORSE_MAP[code] || "?")
          .join("")
          .replace(/\//g, " ");
        setOutput(decoded);
      } else {
        // Text -> Morse
        const encoded = input
          .toUpperCase()
          .split("")
          .map((char) => MORSE_MAP[char] || char)
          .join(" ");
        setOutput(encoded);
      }
    } else if (mode === "braille") {
      const isBrailleInput = /[⠀-⣿]/.test(input);

      if (isBrailleInput) {
        // Braille -> Text
        let res = "";
        for (const char of input) {
          res += REVERSE_BRAILLE_MAP[char] || char;
        }
        setOutput(res);
        setDotExplanation([]);
      } else {
        // Text -> Braille
        const lowerInput = input.toLowerCase();
        let res = "";
        const explanationList: string[] = [];

        for (const char of lowerInput) {
          res += BRAILLE_MAP[char] || char;
          if (BRAILLE_DOTS_MAP[char]) {
            explanationList.push(
              `${char.toUpperCase()}: [${BRAILLE_DOTS_MAP[char]}]`,
            );
          } else if (char !== " ") {
            explanationList.push(`${char}: ?`);
          }
        }
        setOutput(res);
        setDotExplanation(explanationList);
      }
    }
  }, [input, mode]);

  // --- 3. AUDIO HANDLERS (MORSE) ---

  const playDot = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, time);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const playDash = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, time);
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const handlePlayMorse = async () => {
    // Toggle Off
    if (isPlaying) {
      if (audioContextRef.current) audioContextRef.current.close();
      setIsPlaying(false);
      return;
    }

    // Prepare Text
    const textToPlay = /^[.\- /]+$/.test(input) ? input : output;
    if (!textToPlay) return;

    // Start Playing
    setIsPlaying(true);
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    audioContextRef.current = ctx;

    let startTime = ctx.currentTime + 0.1;
    for (const char of textToPlay) {
      if (char === ".") {
        playDot(ctx, startTime);
        startTime += 0.2;
      } else if (char === "-") {
        playDash(ctx, startTime);
        startTime += 0.4;
      } else if (char === " " || char === "/") {
        startTime += 0.4;
      }
    }

    // Auto Stop
    setTimeout(
      () => {
        setIsPlaying(false);
        ctx.close();
      },
      (startTime - ctx.currentTime) * 1000,
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden relative">
      {/* SIDEBAR */}
      <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 shrink-0">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setInput("");
              setOutput("");
              setShowTable(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              mode === m.id
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <m.icon size={18} />
            <div>
              <div className="text-xs font-bold">{m.label}</div>
              <div className="text-[9px] opacity-70">{m.desc}</div>
            </div>
          </button>
        ))}

        {/* 👇 HÌNH MINH HỌA VỊ TRÍ CHẤM BRAILLE */}
        {mode === "braille" && (
          <div className="mt-auto hidden md:block bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">
              Dot Positions
            </div>
            <div className="flex justify-center gap-4">
              {/* Grid 6 chấm */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-2 bg-slate-200 dark:bg-black/30 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  5
                </div>
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                  6
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto relative">
        {/* HEADER & HELP TOGGLE */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 uppercase tracking-wide">
            {mode === "morse" ? <Volume2 size={16} /> : <Eye size={16} />}
            {mode === "morse" ? "Translator & Player" : "Braille Converter"}
          </h3>
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              showTable
                ? "bg-indigo-100 text-indigo-600"
                : "bg-slate-100 dark:bg-white/10 text-slate-500"
            }`}
          >
            {showTable ? <X size={12} /> : <Info size={12} />} Table
          </button>
        </div>

        {showTable && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-3 rounded-xl grid grid-cols-4 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {Object.entries(mode === "morse" ? MORSE_MAP : BRAILLE_MAP).map(
              ([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col items-center bg-slate-50 dark:bg-white/5 p-1 rounded border border-slate-100 dark:border-white/5"
                >
                  <span className="text-[10px] font-bold text-slate-400">
                    {k}
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-500">
                    {v}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        {/* INPUT AREA */}
        <div className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col shadow-sm max-h-[150px]">
          <textarea
            className="flex-1 w-full bg-transparent resize-none outline-none text-xs font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
            placeholder={
              mode === "morse"
                ? "Type text (HELLO) or Morse (.... .)"
                : "Type text to convert to Braille..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Input
            </span>
            {mode === "morse" && (
              <button
                onClick={handlePlayMorse}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isPlaying
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                }`}
              >
                {isPlaying ? (
                  <Square size={12} fill="currentColor" />
                ) : (
                  <Play size={12} fill="currentColor" />
                )}
                {isPlaying ? "STOP" : "PLAY"}
              </button>
            )}
          </div>
        </div>

        {/* OUTPUT AREA */}
        <div className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col shadow-inner">
          {/* Kết quả chính (Chữ nổi hoặc Morse) */}
          <div className="flex-1 w-full overflow-y-auto">
            <textarea
              readOnly
              className="w-full bg-transparent resize-none outline-none text-2xl font-mono text-slate-800 dark:text-white font-bold tracking-wider h-full"
              value={output}
              placeholder="..."
            />
          </div>

          {/* 👇 PHẦN HIỂN THỊ VỊ TRÍ CHẤM (CHỈ CHO BRAILLE) */}
          {mode === "braille" && dotExplanation.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Dot Breakdown
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                {dotExplanation.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-white dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Result
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
