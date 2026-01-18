import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Disc, ChevronLeft, ChevronRight, Wind } from "lucide-react";

// --- CONFIGURATION ---
// Chỉ định nghĩa danh sách nốt cơ bản, logic vị trí sẽ tính toán riêng
const NOTES_DEF = [
  { note: "C", type: "white" },
  { note: "C#", type: "black" },
  { note: "D", type: "white" },
  { note: "D#", type: "black" },
  { note: "E", type: "white" },
  { note: "F", type: "white" },
  { note: "F#", type: "black" },
  { note: "G", type: "white" },
  { note: "G#", type: "black" },
  { note: "A", type: "white" },
  { note: "A#", type: "black" },
  { note: "B", type: "white" },
];

const KEY_MAP_LOWER = [
  "z",
  "s",
  "x",
  "d",
  "c",
  "v",
  "g",
  "b",
  "h",
  "n",
  "j",
  "m",
];
const KEY_MAP_UPPER = [
  "q",
  "2",
  "w",
  "3",
  "e",
  "r",
  "5",
  "t",
  "6",
  "y",
  "7",
  "u",
];

// CẤU HÌNH VỊ TRÍ PHÍM ĐEN (QUAN TRỌNG)
// Giá trị này là % offset so với phím trắng liền trước nó
// VD: C# nằm sau C. Offset 0.55 nghĩa là nó nằm ở 55% chiều rộng của phím C (lệch phải)
const BLACK_KEY_POSITIONS: Record<string, number> = {
  "C#": 0.6, // Lệch phải C một chút
  "D#": 0.8, // Lệch phải D nhiều hơn (gần E)
  "F#": 0.55, // Lệch phải F một chút
  "G#": 0.7, // Khá cân giữa G và A
  "A#": 0.85, // Lệch phải A nhiều (gần B)
};

type OscillatorType = "sine" | "triangle" | "sawtooth" | "square";

interface VisualParticle {
  id: string;
  color: string;
  left: string;
  width: string;
  bottom: number | string;
  height: number | string;
  animation: string;
  startTime: number;
  isGrowing: boolean;
  noteId: string; // Để định danh khi thả phím
}

interface DemoNote {
  note: string;
  type: string;
  octOffset: number;
  delay: number;
  duration: number;
}

export const PianoModule = () => {
  // --- STATE ---
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [volume] = useState(0.5);
  const [oscType] = useState<OscillatorType>("triangle");
  const [reverb, setReverb] = useState(0.0);
  const [octave, setOctave] = useState(5);
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  // Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const compressor = useRef<DynamicsCompressorNode | null>(null);

  // --- CORE: CALCULATE EXACT POSITION ---
  // Hàm này dùng chung cho cả Phím Đàn và Cột Sáng để đảm bảo thẳng hàng 100%
  const getNoteGeometry = (
    noteName: string,
    type: string,
    octOffset: number
  ) => {
    // 1. Xác định đây là phím trắng thứ mấy trong tổng số 14 phím (0-13)
    // C=0, D=1, E=2, F=3, G=4, A=5, B=6
    const whiteNoteIndices = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    // Lấy tên gốc (bỏ dấu #)
    const baseName = noteName.replace("#", "") as keyof typeof whiteNoteIndices;

    let baseIndex = whiteNoteIndices[baseName];
    // Nếu ở octave 2 thì cộng thêm 7
    const globalIndex = baseIndex + octOffset * 7;

    const totalWhiteKeys = 14;
    const unitPercent = 100 / totalWhiteKeys; // ~7.14%

    if (type === "white") {
      return {
        left: `${globalIndex * unitPercent}%`,
        width: `${unitPercent}%`,
        zIndex: 10,
      };
    } else {
      // Phím đen: Tính vị trí dựa trên phím trắng gốc + offset
      const offset = BLACK_KEY_POSITIONS[noteName] || 0.6;
      const leftPercent = (globalIndex + offset) * unitPercent;

      return {
        left: `${leftPercent}%`,
        width: `${unitPercent * 0.65}%`, // Phím đen rộng bằng 65% phím trắng
        zIndex: 20,
      };
    }
  };

  // --- AUDIO LOGIC (Giữ nguyên logic chống rè) ---
  const initAudio = () => {
    if (!audioCtx.current) {
      const CtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new CtxClass();
      compressor.current = audioCtx.current.createDynamicsCompressor();
      compressor.current.threshold.value = -20;
      masterGain.current = audioCtx.current.createGain();
      masterGain.current.connect(compressor.current);
      compressor.current.connect(audioCtx.current.destination);
    }
    if (audioCtx.current.state === "suspended") audioCtx.current.resume();
  };

  const playSound = useCallback(
    (note: string, octOffset: number) => {
      initAudio();
      if (!audioCtx.current || !masterGain.current) return;

      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      // Calculate Freq
      const allNotes = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const semitone = allNotes.indexOf(note) + octOffset * 12;
      // C4 (Base) is usually MIDI 60. A4 is 69 (440Hz).
      // Let's assume C4 is base. Index of C is 0.
      // A4 is at index 9 (in C scale).
      // Formula relative to A4: (n - 9) + (oct - 4)*12
      const totalSemitonesFromA4 = semitone - 9 + (octave - 4) * 12;
      const freq = 440 * Math.pow(2, totalSemitonesFromA4 / 12);

      masterGain.current.gain.value = volume;
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const now = ctx.currentTime;
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.8, now + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      if (reverb > 0) {
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.25;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.25;
        osc.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(masterGain.current);
      }

      osc.connect(noteGain);
      noteGain.connect(masterGain.current);
      osc.start(now);
      osc.stop(now + 1.0);
    },
    [volume, oscType, reverb, octave]
  );

  // --- DEMO FUNCTION: FULL SONG "PHÉP MÀU" (LỜI CHUẨN) ---
  const handlePlayDemo = () => {
    if (isPlayingDemo) return;
    setIsPlayingDemo(true);

    const song: DemoNote[] = [];
    let currentTime = 0;

    // Helper thêm nốt nhạc
    const addNote = (
      n: string,
      t: string,
      o: number,
      d: number,
      gap: number = 0
    ) => {
      song.push({
        note: n,
        type: t,
        octOffset: o,
        delay: currentTime,
        duration: d,
      });
      currentTime += d + gap;
    };

    // --- INTRO (Dạo đầu nhẹ nhàng - Tone G Major) ---
    // --- VERSE 1: "Ngày thay đêm, vội trôi giấc mơ êm đềm" ---
    addNote("D", "white", 0, 1800);
    addNote("G", "white", 0, 450);
    addNote("A", "white", 0, 1350, 450);

    // "Vội trôi giấc mơ êm đềm"
    addNote("D", "white", 0, 300);
    addNote("B", "white", 0, 450);
    addNote("C", "white", 1, 450);
    addNote("B", "white", 0, 450);
    addNote("A", "white", 0, 450);
    addNote("G", "white", 0, 900, 1050);

    // "Tôi lênh đênh trên biển vắng"
    addNote("G", "white", 0, 600);
    addNote("G", "white", 0, 300);
    addNote("G", "white", 0, 450);
    addNote("E", "white", 0, 450);
    addNote("D", "white", 0, 900);
    addNote("B", "white", 0, 750);

    // "Hoàng hôn chờ em chưa buông nắng" (A G E G A B A)
    addNote("B", "white", 0, 300);
    addNote("C", "white", 1, 600);
    addNote("B", "white", 0, 300);
    addNote("C", "white", 1, 450);
    addNote("C", "white", 1, 450);
    addNote("C", "white", 1, 450);
    addNote("D", "white", 1, 900, 600);

    // --- VERSE 2: "Đừng tìm nhau..." ---
    // "Đừng tìm nhau vào hôm gió mưa tơi bời" (G A B A G E G A)
    addNote("D", "white", 0, 900);
    addNote("G", "white", 0, 900);
    addNote("A", "white", 0, 900, 600);

    addNote("D", "white", 0, 300);
    addNote("B", "white", 0, 450);
    addNote("C", "white", 1, 450);
    addNote("B", "white", 0, 450);
    addNote("A", "white", 0, 450);
    addNote("G", "white", 0, 900, 750);

    // "Sợ lời sắp nói vỡ tan thương đau" (D G A B A G E)
    addNote("G", "white", 0, 300);
    addNote("G", "white", 0, 450);
    addNote("E", "white", 1, 300);
    addNote("E", "white", 1, 600);

    addNote("F#", "black", 1, 450);
    addNote("E", "white", 1, 450);
    addNote("D", "white", 1, 300);
    addNote("D", "white", 1, 750);

    // "Hẹn kiếp sau... có nhau trọn đời" (D E G... E D)
    addNote("B", "white", 0, 450);
    addNote("D", "white", 1, 300);
    addNote("C", "white", 1, 600, 300);

    addNote("C", "white", 1, 300);
    addNote("A", "white", 0, 600);
    addNote("G", "white", 0, 600);
    addNote("G", "white", 0, 900, 1200);

    // --- BRIDGE: "Liệu người có còn ở đây..." ---
    // "Liệu người có còn ở đây với tôi thật lâu"
    addNote("G", "white", 0, 600);
    addNote("G", "white", 0, 600);
    addNote("D", "white", 1, 900);
    addNote("G", "white", 0, 450, 600);

    addNote("D", "white", 0, 300);
    addNote("G", "white", 0, 600);
    addNote("B", "white", 0, 300);
    addNote("A", "white", 0, 600);
    addNote("G", "white", 0, 600);
    addNote("A", "white", 0, 900, 1500);

    // "Ngày rộng tháng dài, sợ mai không còn thấy nhau"
    addNote("G", "white", 0, 600);
    addNote("G", "white", 0, 600);
    addNote("D", "white", 1, 900);
    addNote("G", "white", 0, 450, 600);

    addNote("D", "white", 0, 300);
    addNote("G", "white", 0, 600);
    addNote("B", "white", 0, 300);
    addNote("A", "white", 0, 600);
    addNote("E", "white", 1, 600);
    addNote("D", "white", 1, 900, 300);
    //----------------------------------
    addNote("C", "white", 1, 600, 450);
    addNote("B", "white", 0, 300, 750);

    // "Ngày em đến, áng mây xanh thêm" (G G D5, B A G)
    addNote("B", "white", 0, 600);
    addNote("D", "white", 1, 600);
    addNote("E", "white", 1, 600);
    addNote("E", "white", 1, 600);
    addNote("B", "white", 0, 600);
    addNote("A", "white", 0, 600);
    addNote("A", "white", 0, 600, 1200);

    // "Ngày em đi, nắng vương cuối thềm"
    addNote("G", "white", 0, 300);
    addNote("A", "white", 0, 300);
    addNote("B", "white", 0, 600);
    addNote("D", "white", 1, 600);
    addNote("A", "white", 0, 600);
    addNote("B", "white", 0, 600);
    addNote("G", "white", 0, 900, 450);

    // "Thiếu em tôi sợ bơ vơ... Vắng em như tàn cơn mơ" (Cao trào tột đỉnh để vào ĐK)
    addNote("B", "white", 0, 300);
    addNote("A", "white", 0, 600);
    addNote("G", "white", 0, 300);
    addNote("E", "white", 0, 600);
    addNote("G", "white", 0, 600);
    addNote("G", "white", 0, 900, 1200);

    addNote("B", "white", 0, 300);
    addNote("A", "white", 0, 600);
    addNote("G", "white", 0, 300);
    addNote("D", "white", 0, 600);
    addNote("D", "white", 1, 600);
    addNote("D", "white", 1, 900);

    addNote("E", "white", 1, 300);
    addNote("D", "white", 1, 900, 300);

    addNote("G", "white", 0, 1050, 1200);

    // --- CHORUS: "Chẳng phải phép màu..." (Quãng cao - Octave 1) ---

    addNote("G", "white", 1, 600);
    addNote("G", "white", 1, 600);
    addNote("D", "white", 2, 900);
    addNote("G", "white", 1, 450, 600);

    addNote("D", "white", 1, 300);
    addNote("G", "white", 1, 600);
    addNote("B", "white", 1, 300);
    addNote("A", "white", 1, 600);
    addNote("G", "white", 1, 600);
    addNote("A", "white", 1, 900, 1500);

    // "Một người khẽ cười" (G G D5 G)
    addNote("G", "white", 1, 600);
    addNote("G", "white", 1, 600);
    addNote("D", "white", 2, 900);
    addNote("G", "white", 1, 450, 600);

    addNote("D", "white", 1, 300);
    addNote("G", "white", 1, 600);
    addNote("B", "white", 1, 300);
    addNote("A", "white", 1, 600);
    addNote("E", "white", 2, 600);
    addNote("D", "white", 2, 900, 300);
    // ----------------------------------
    addNote("C", "white", 2, 600, 450);
    addNote("B", "white", 1, 300, 750);

    // "Gọi tôi thức giấc cơn ngủ mê"
    addNote("B", "white", 1, 600);
    addNote("D", "white", 2, 600);
    addNote("E", "white", 2, 600);
    addNote("E", "white", 2, 600);
    addNote("B", "white", 1, 600);
    addNote("A", "white", 1, 600);
    addNote("A", "white", 1, 600, 1200);

    // "Dìu tôi đi lúc quên lối về"
    addNote("G", "white", 1, 300);
    addNote("A", "white", 1, 300);
    addNote("B", "white", 1, 600);
    addNote("D", "white", 2, 600);
    addNote("A", "white", 1, 600);
    addNote("B", "white", 1, 600);
    addNote("G", "white", 1, 900, 450);

    // "Quãng đời mai sau... luôn cạnh nhau" (Kết bài)
    addNote("D", "white", 1, 600);
    addNote("C", "white", 1, 600);
    addNote("G", "white", 1, 600);
    addNote("G", "white", 1, 600, 1050);
    addNote("E", "white", 1, 600);
    addNote("D", "white", 1, 900);
    addNote("G", "white", 1, 1200, 450);

    addNote("G", "white", 0, 150);
    addNote("A", "white", 0, 150);
    addNote("A#", "black", 0, 300);

    addNote("A", "white", 0, 150);
    addNote("G", "white", 0, 150);
    addNote("C", "white", 1, 150);
    addNote("A#", "black", 0, 150);
    addNote("A", "white", 0, 150);
    addNote("A#", "black", 0, 300);
    addNote("A", "white", 0, 450);

    addNote("G", "white", 0, 300);
    addNote("G", "white", 0, 900, 900);

    // --- EXECUTE ---
    song.forEach((n, index) => {
      setTimeout(() => {
        handleNoteStart(n.note, n.type, n.octOffset);
        setTimeout(() => {
          handleNoteEnd(n.note, n.octOffset);
          if (index === song.length - 1) setIsPlayingDemo(false);
        }, n.duration);
      }, n.delay);
    });
  };

  // --- HANDLERS ---
  const handleNoteStart = (note: string, type: string, octOffset: number) => {
    const keyId = `${note}-${octOffset}`;
    if (activeNotes.includes(keyId)) return;

    setActiveNotes((prev) => [...prev, keyId]);
    playSound(note, octOffset);

    // Spawn Particle
    const geo = getNoteGeometry(note, type, octOffset);
    const newParticle: VisualParticle = {
      id: `${keyId}-${Date.now()}`,
      noteId: keyId,
      color:
        type === "black"
          ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]"
          : "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]",
      left: geo.left,
      width: geo.width,
      bottom: 0,
      height: "auto",
      animation: "grow-height 100s linear forwards", // Mọc lên khi nhấn giữ
      startTime: Date.now(),
      isGrowing: true,
    };
    setParticles((prev) => [...prev, newParticle]);
  };

  const handleNoteEnd = (note: string, octOffset: number) => {
    const keyId = `${note}-${octOffset}`;
    setActiveNotes((prev) => prev.filter((n) => n !== keyId));

    // Release Particle (Stop growing, fly up)
    setParticles((prev) =>
      prev.map((p) => {
        if (p.isGrowing && p.noteId === keyId) {
          const duration = Date.now() - p.startTime;
          const finalHeight = (duration / 1000) * 250; // Speed 250px/s
          return {
            ...p,
            isGrowing: false,
            height: `${Math.max(20, finalHeight)}px`, // Min height 20px
            animation: "fly-up 5s linear forwards",
          };
        }
        return p;
      })
    );
  };

  // Keyboard Mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      // Check Octaves
      [KEY_MAP_LOWER, KEY_MAP_UPPER].forEach((map, octIdx) => {
        const idx = map.indexOf(k);
        if (idx !== -1) {
          const noteDef = NOTES_DEF[idx];
          handleNoteStart(noteDef.note, noteDef.type, octIdx);
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      [KEY_MAP_LOWER, KEY_MAP_UPPER].forEach((map, octIdx) => {
        const idx = map.indexOf(k);
        if (idx !== -1) {
          const noteDef = NOTES_DEF[idx];
          handleNoteEnd(noteDef.note, octIdx);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [octave, volume, oscType, reverb]); // Dependencies

  // Render Helper
  const renderKeys = (octOffset: number) => {
    return NOTES_DEF.map((n, idx) => {
      const keyId = `${n.note}-${octOffset}`;
      const isActive = activeNotes.includes(keyId);
      const geo = getNoteGeometry(n.note, n.type, octOffset);
      const label = octOffset === 0 ? KEY_MAP_LOWER[idx] : KEY_MAP_UPPER[idx];

      if (n.type === "white") {
        return (
          <button
            key={keyId}
            onMouseDown={() => handleNoteStart(n.note, "white", octOffset)}
            onMouseUp={() => handleNoteEnd(n.note, octOffset)}
            onMouseLeave={() => handleNoteEnd(n.note, octOffset)}
            className={`
                        absolute top-0 bottom-0 border-x border-b border-slate-300 rounded-b-lg
                        active:scale-[0.98] transition-transform origin-top z-10 flex items-end justify-center pb-2
                        ${
                          isActive
                            ? "bg-gradient-to-b from-slate-100 to-cyan-200"
                            : "bg-gradient-to-b from-white to-slate-200"
                        }
                      `}
            style={{ left: geo.left, width: geo.width }}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-4 pointer-events-none">
              {label}
            </span>
          </button>
        );
      } else {
        return (
          <button
            key={keyId}
            onMouseDown={() => handleNoteStart(n.note, "black", octOffset)}
            onMouseUp={() => handleNoteEnd(n.note, octOffset)}
            onMouseLeave={() => handleNoteEnd(n.note, octOffset)}
            className={`
                        absolute top-0 h-[60%] border-x border-b border-black/50 rounded-b-lg shadow-xl
                        active:scale-y-95 transition-transform origin-top z-20 flex items-end justify-center pb-2
                        ${
                          isActive
                            ? "bg-gradient-to-b from-slate-800 to-rose-600"
                            : "bg-gradient-to-b from-slate-800 to-black"
                        }
                      `}
            style={{ left: geo.left, width: geo.width }}
          >
            <span className="text-[8px] text-slate-500 font-bold uppercase pointer-events-none">
              {label}
            </span>
          </button>
        );
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md z-30 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
            <Music size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Piano Studio</h3>
            <p className="text-[10px] text-slate-400">Synthesia V2.4</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayDemo}
            disabled={isPlayingDemo}
            className={`p-2 rounded-md transition-all ${
              isPlayingDemo
                ? "text-sky-400 animate-pulse"
                : "text-slate-400 hover:text-sky-400"
            }`}
            title="Demo: Phép màu"
          >
            <Disc size={14} />
          </button>
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setOctave((o) => Math.max(1, o - 1))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-bold w-6 text-center text-pink-400">
              C{octave}
            </span>
            <button
              onClick={() => setOctave((o) => Math.min(7, o + 1))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={() => setReverb((r) => (r === 0 ? 0.3 : 0))}
            className={`p-2 rounded-lg border transition-all ${
              reverb > 0
                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                : "bg-slate-900 border-slate-700 text-slate-500"
            }`}
          >
            <Wind size={16} />
          </button>
        </div>
      </div>

      {/* VISUALIZER */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden perspective-1000 z-10 border-b-4 border-slate-800">
        <div className="absolute inset-0 flex opacity-20 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-slate-700"></div>
          ))}
        </div>
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-t-md opacity-90 blur-[0.5px] ${p.color}`}
            style={{
              left: p.left,
              width: p.width,
              bottom: p.bottom,
              height: p.height,
              animation: p.animation,
            }}
          />
        ))}
      </div>

      {/* PIANO KEYS CONTAINER */}
      <div className="flex-none h-40 sm:h-52 relative bg-[#1e1e1e] flex justify-center px-2 pb-4 pt-1 z-20 shadow-2xl">
        <div className="relative flex w-full max-w-5xl h-full">
          {/* Render keys using absolute positioning */}
          {renderKeys(0)}
          {renderKeys(1)}
        </div>
      </div>

      <style>{`
        @keyframes grow-height { 0% { height: 0px; } 100% { height: 25000px; } }
        @keyframes fly-up { 0% { bottom: 0px; opacity: 0.9; } 100% { bottom: 1250px; opacity: 0; } }
      `}</style>
    </div>
  );
};
