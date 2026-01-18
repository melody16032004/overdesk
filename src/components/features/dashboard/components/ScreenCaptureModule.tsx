import { useState } from "react";
import {
  Camera,
  Download,
  Copy,
  X,
  Monitor,
  Check,
  ChevronRight,
  Aperture,
} from "lucide-react";
import { useToastStore } from "../../../../stores/useToastStore";

export const ScreenCaptureModule = () => {
  const { showToast } = useToastStore();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // --- LOGIC GIỮ NGUYÊN ---
  const handleStartCapture = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore
          displaySurface: "monitor",
        },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/png");
            setCapturedImage(imageData);
            stream.getTracks().forEach((track) => track.stop());
            showToast("Screen captured successfully!", "success");
          }
          setIsCapturing(false);
          video.remove();
        }, 500);
      };
    } catch (err) {
      console.error("Error:", err);
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `screenshot-${Date.now()}.png`;
    link.click();
    showToast("Image downloaded", "success");
  };

  const handleCopyToClipboard = async () => {
    if (!capturedImage) return;
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      showToast("Copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy", "error");
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
  };

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-white relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex-none p-6 md:p-8 flex justify-between items-center relative z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Aperture size={24} className="text-white animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Screen Capture
            </h2>
            <p className="text-sm text-slate-400 hidden sm:block">
              Professional Screenshot Tool
            </p>
          </div>
        </div>
        {capturedImage && (
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check size={14} /> Captured
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto relative z-10 p-4 md:p-8 flex flex-col items-center justify-center">
        {!capturedImage ? (
          // --- EMPTY STATE ---
          <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Visual Icon */}
            <div
              className="relative mx-auto w-48 h-48 group cursor-pointer"
              onClick={handleStartCapture}
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500" />
              <div className="relative w-full h-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                <Monitor
                  size={80}
                  className="text-slate-400 group-hover:text-white transition-colors duration-300"
                />

                {/* Floating Elements */}
                <div className="absolute top-10 right-10 p-2 bg-indigo-600 rounded-lg shadow-lg animate-bounce">
                  <Camera size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold">
                Capture Anything
              </h3>
              <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg leading-relaxed">
                Select a{" "}
                <span className="text-indigo-400 font-semibold">Window</span>,{" "}
                <span className="text-indigo-400 font-semibold">Tab</span>, or
                the{" "}
                <span className="text-indigo-400 font-semibold">
                  Entire Screen
                </span>{" "}
                to create a high-quality screenshot instantly.
              </p>
            </div>

            <button
              onClick={handleStartCapture}
              disabled={isCapturing}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCapturing ? (
                <>
                  <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Capture{" "}
                  <ChevronRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        ) : (
          // --- PREVIEW STATE ---
          <div className="w-full max-w-6xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 h-full">
            {/* Image Container */}
            <div className="flex-1 bg-[#1e293b]/50 backdrop-blur-md rounded-2xl border border-white/10 p-2 shadow-2xl flex items-center justify-center relative overflow-hidden group">
              {/* Checkerboard pattern for transparency */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              />

              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl relative z-10 transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>

            {/* Action Bar (Responsive) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
              <div className="text-sm text-slate-400 font-medium hidden md:block">
                Preview Mode
              </div>

              <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                {/* Discard */}
                <button
                  onClick={handleReset}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white font-semibold transition-all flex items-center justify-center gap-2 min-w-[120px]"
                >
                  <X size={18} /> Discard
                </button>

                {/* Copy */}
                <button
                  onClick={handleCopyToClipboard}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                >
                  <Copy size={18} /> Copy Image
                </button>

                {/* Download */}
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                >
                  <Download size={18} /> Save PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
