import { Mic, Monitor, Square, Laptop2, Activity } from "lucide-react";

export const Visualizer = ({
  isRecording,
  canvasRef,
  setSourceType,
  sourceType,
  stopRecording,
  startRecording,
}: any) => {
  return (
    <div className="flex-none h-56 relative flex flex-col items-center justify-center border-b border-white/5 bg-black/20 z-10">
      <div className="absolute inset-0 w-full h-full opacity-60">
        {isRecording ? (
          <canvas ref={canvasRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
            <Activity size={40} strokeWidth={1} />
          </div>
        )}
      </div>

      {!isRecording && (
        <div className="relative z-20 flex bg-slate-800/50 p-1 rounded-full border border-white/5 mb-6">
          <button
            onClick={() => setSourceType("mic")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              sourceType === "mic"
                ? "bg-red-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic size={14} /> Mic
          </button>
          <button
            onClick={() => setSourceType("system")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              sourceType === "system"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor size={14} /> System
          </button>
        </div>
      )}

      <div className="relative z-20">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ring-4 ring-offset-4 ring-offset-slate-900 animate-pulse ${
            isRecording
              ? "bg-white ring-red-500 text-red-500 scale-90"
              : `${
                  sourceType === "mic" ? "bg-red-500" : "bg-blue-500"
                } ring-slate-800 text-white hover:scale-105`
          }`}
        >
          {isRecording ? (
            <Square size={32} fill="currentColor" />
          ) : sourceType === "mic" ? (
            <Mic size={40} />
          ) : (
            <Laptop2 size={40} />
          )}
        </button>
      </div>
    </div>
  );
};
