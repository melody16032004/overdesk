import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Smartphone,
  ZoomIn,
} from "lucide-react";
import { FILTERS } from "../constants/camera_const";

export const Control = ({
  capturedImage,
  recordedVideoUrl,
  retake,
  handleShareToMobile,
  downloadMedia,
  isRecording,
  zoom,
  setZoom,
  mode,
  setMode,
  setActiveFilter,
  activeFilter,
  triggerPhoto,
  stopRecording,
  startRecording,
}: any) => {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 ${
        capturedImage || recordedVideoUrl ? "h-[90px]" : "h-[200px]"
      } flex flex-col items-center justify-center z-20 px-6 bg-gradient-to-t from-black/80 to-transparent`}
    >
      {capturedImage || recordedVideoUrl ? (
        <div className="flex gap-8 animate-in slide-in-from-bottom-4 mb-4">
          <button
            onClick={retake}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white group-hover:bg-red-500 transition-all">
              <RefreshCw size={20} />
            </div>
            <span className="text-[9px] font-bold text-white/80">Discard</span>
          </button>
          <button
            onClick={handleShareToMobile}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white group-hover:bg-indigo-500 transition-all">
              <Smartphone size={20} />
            </div>
            <span className="text-[9px] font-bold text-white/80">To Phone</span>
          </button>
          <button
            onClick={downloadMedia}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 bg-white text-indigo-600 rounded-full hover:scale-110 transition-transform shadow-lg shadow-indigo-500/50">
              <Download size={20} />
            </div>
            <span className="text-[9px] font-bold text-white/80">Save</span>
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3 pb-4">
          {!isRecording && (
            <>
              <div className="flex items-center justify-center gap-3 text-white/80">
                <ZoomIn size={14} />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-48 h-1 bg-white/30 rounded-lg appearance-none pointer accent-white"
                />
              </div>
              {mode === "photo" && (
                <div className="flex items-center justify-between w-full bg-black/40 backdrop-blur-md rounded-2xl p-2 gap-2">
                  <button
                    onClick={() =>
                      setActiveFilter(
                        (prev: any) =>
                          (prev - 1 + FILTERS.length) % FILTERS.length,
                      )
                    }
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1 flex justify-center gap-2 overflow-hidden">
                    {FILTERS.map((f, idx) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(idx)}
                        className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${
                          activeFilter === idx
                            ? "border-indigo-500 scale-110"
                            : "border-transparent opacity-50"
                        }`}
                        style={{
                          background: idx === 0 ? "#fff" : "gray",
                          filter: f.css !== "none" ? f.css : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setActiveFilter(
                        (prev: any) => (prev + 1) % FILTERS.length,
                      )
                    }
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-center gap-8 mt-1">
            <button
              onClick={
                mode === "photo"
                  ? triggerPhoto
                  : isRecording
                    ? stopRecording
                    : startRecording
              }
              className={`w-16 h-16 rounded-full border-4 border-white/80 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm ${
                isRecording
                  ? "bg-red-500/20"
                  : "bg-white/10 hover:scale-105 active:scale-95"
              }`}
            >
              <div
                className={`transition-all duration-300 ${
                  mode === "photo" ? "w-10 h-10 bg-white rounded-full" : ""
                } ${
                  mode === "video" && !isRecording
                    ? "w-10 h-10 bg-red-500 rounded-full"
                    : ""
                } ${
                  mode === "video" && isRecording
                    ? "w-6 h-6 bg-red-500 rounded-sm"
                    : ""
                }`}
              />
            </button>
          </div>
          {!isRecording && (
            <div className="flex justify-center -mt-1">
              <div className="bg-black/50 backdrop-blur-md rounded-full p-1 flex relative scale-75 origin-top">
                <div
                  className={`absolute top-1 bottom-1 w-[60px] bg-white/20 rounded-full transition-all duration-300 ${
                    mode === "photo" ? "left-1" : "left-[65px]"
                  }`}
                ></div>
                <button
                  onClick={() => setMode("photo")}
                  className={`w-[60px] text-[10px] font-bold py-1.5 rounded-full z-10 transition-colors ${
                    mode === "photo" ? "text-white" : "text-white/50"
                  }`}
                >
                  PHOTO
                </button>
                <button
                  onClick={() => setMode("video")}
                  className={`w-[60px] text-[10px] font-bold py-1.5 rounded-full z-10 transition-colors ${
                    mode === "video" ? "text-white" : "text-white/50"
                  }`}
                >
                  VIDEO
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
