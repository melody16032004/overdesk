import { useEffect, useRef } from "react";
import {
  Cast,
  StopCircle,
  Disc,
  Download,
  MonitorPlay,
  RefreshCcw,
  Mic,
  MicOff,
  Webcam,
  Settings2,
  Radio,
  PanelsLeftBottom,
  PanelsTopLeft,
  PanelsRightBottom,
} from "lucide-react";
import { useScreenShareStore } from "../../../../stores/useScreenShareStore";

type CamPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export const ScreenShareModule = () => {
  const store = useScreenShareStore();
  const { startStudio, stopStudio, toggleRecord, toggleMic } = store.actions;

  // Refs để preview
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const localCamStreamRef = useRef<MediaStream | null>(null);

  // --- EFFECT: BIND STREAM TO VIDEO ---
  // Mỗi khi bật lên lại, tự động gán stream từ Store vào video tag
  useEffect(() => {
    if (screenVideoRef.current && store.stream) {
      screenVideoRef.current.srcObject = store.stream;
      screenVideoRef.current.muted = true; // Mute preview
      screenVideoRef.current.play().catch(() => {});
    }
    // Webcam stream lấy từ đâu? Để đơn giản, ta tái tạo getUserMedia ở UI
    // HOẶC lưu camStream vào store luôn.
    // Cách tốt nhất: Ở bước này, để UI đơn giản, ta chỉ cần hiển thị màn hình chính.
    // Nếu muốn hiện cả webcam đè lên (Overlay), ta cần lưu camStream vào Store nữa.
    // -> Cập nhật: Giả sử store có camStream (bạn có thể thêm vào Store nếu muốn hiện overlay xịn ở UI).
    // Ở đây tôi demo phần màn hình chính, phần webcam bạn thêm vào Store tương tự 'stream' nhé.
  }, [store.stream, store.isLive]);

  // Lấy lại webcam stream riêng cho UI (để overlay zero latency)
  useEffect(() => {
    const manageCam = async () => {
      // TRƯỜNG HỢP 1: ĐANG LIVE & CHẾ ĐỘ STREAM -> BẬT CAM
      if (store.isLive && store.mode === "stream") {
        try {
          // Nếu đã có stream rồi thì không lấy lại để tránh nháy
          if (!localCamStreamRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 320, height: 240 }, // Preview nhỏ cho nhẹ
            });
            localCamStreamRef.current = stream;
          }

          // Gán vào thẻ video
          if (camVideoRef.current) {
            camVideoRef.current.srcObject = localCamStreamRef.current;
            camVideoRef.current.muted = true;
            await camVideoRef.current.play();
          }
        } catch (e) {
          console.error("Preview Cam Error:", e);
        }
      }
      // TRƯỜNG HỢP 2: KHÔNG LIVE HOẶC KHÔNG PHẢI STREAM MODE -> TẮT CAM NGAY
      else {
        if (localCamStreamRef.current) {
          localCamStreamRef.current.getTracks().forEach((t) => t.stop()); // 🛑 Tắt đèn camera
          localCamStreamRef.current = null;
        }
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = null;
        }
      }
    };

    manageCam();

    // CLEANUP: Khi component unmount (hoặc tab đóng) cũng phải tắt
    return () => {
      localCamStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [store.isLive, store.mode]);

  const getCamPositionClass = () => {
    switch (store.camPosition) {
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  const handleDownload = () => {
    if (!store.videoUrl) return;
    const a = document.createElement("a");
    a.href = store.videoUrl;
    a.download = `stream-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-white relative overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex-none p-6 flex justify-between items-center relative z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl shadow-lg transition-colors ${
              store.mode === "stream"
                ? "bg-gradient-to-br from-red-500 to-orange-600"
                : "bg-gradient-to-br from-cyan-500 to-blue-600"
            }`}
          >
            {store.mode === "stream" ? (
              <Radio size={24} className="animate-pulse" />
            ) : (
              <Cast size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {store.mode === "stream" ? "Stream Studio" : "Screen Share"}
            </h2>
            <p className="text-xs text-slate-400">
              {store.isLive ? "Running in background..." : "Ready"}
            </p>
          </div>
        </div>

        {/* Controls... (Giữ nguyên logic hiển thị nút như cũ, chỉ thay đổi hàm gọi thành store.actions...) */}
        {!store.isLive && !store.videoUrl && (
          <div className="bg-black/40 p-1 rounded-lg flex items-center border border-white/10">
            <button
              onClick={() => store.setMode("standard")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                store.mode === "standard"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => store.setMode("stream")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                store.mode === "stream"
                  ? "bg-red-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Webcam size={12} /> Stream
            </button>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden relative z-10 p-4 flex flex-col items-center justify-center">
        {/* STATE: IDLE */}
        {!store.isLive && !store.videoUrl && (
          <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div
              onClick={startStudio}
              className="relative mx-auto w-40 h-40 group cursor-pointer"
            >
              <div
                className={`absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${
                  store.mode === "stream" ? "bg-red-500" : "bg-cyan-500"
                }`}
              />
              <div className="relative w-full h-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                {store.mode === "stream" ? (
                  <Settings2
                    size={64}
                    className="text-slate-400 group-hover:text-red-400"
                  />
                ) : (
                  <MonitorPlay
                    size={64}
                    className="text-slate-400 group-hover:text-cyan-400"
                  />
                )}
              </div>
            </div>
            <button
              onClick={startStudio}
              className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
                store.mode === "stream"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-cyan-600 hover:bg-cyan-500"
              }`}
            >
              Start Now
            </button>
          </div>
        )}

        {/* STATE: LIVE (Hiển thị luồng từ Store) */}
        <div
          className={`w-full h-full flex flex-col gap-4 animate-in fade-in duration-500 ${
            store.isLive ? "flex" : "hidden"
          }`}
        >
          <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl group">
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            {/* Webcam Overlay (UI Only) */}
            <div
              className={`absolute ${getCamPositionClass()} w-[20%] aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-cyan-500 shadow-2xl transition-all duration-300 ${
                store.mode === "stream"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-0 pointer-events-none"
              }`}
            >
              <video
                ref={camVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 z-50">
              <button
                onClick={toggleRecord}
                className={`p-3 rounded-xl transition-all ${
                  store.isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-white/10 hover:bg-red-500 hover:text-white text-slate-200"
                }`}
              >
                {store.isRecording ? (
                  <StopCircle size={20} />
                ) : (
                  <Disc size={20} />
                )}
              </button>
              {store.mode === "stream" && (
                <>
                  <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-xl transition-all ${
                      !store.micEnabled
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10 hover:bg-white/20 text-slate-200"
                    }`}
                  >
                    {store.micEnabled ? (
                      <Mic size={20} />
                    ) : (
                      <MicOff size={20} />
                    )}
                  </button>
                  <div className="flex bg-white/10 rounded-lg p-1">
                    {(
                      [
                        "bottom-left",
                        "bottom-right",
                        "top-left",
                        "top-right",
                      ] as CamPosition[]
                    ).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => store.setCamPosition(pos)}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                          store.camPosition === pos
                            ? "bg-cyan-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {pos === "bottom-left" && (
                          <PanelsTopLeft className="scale-x-[-1]" size={14} />
                        )}
                        {pos === "bottom-right" && <PanelsTopLeft size={14} />}
                        {pos === "top-left" && <PanelsRightBottom size={14} />}
                        {pos === "top-right" && <PanelsLeftBottom size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
              <button
                onClick={stopStudio}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold text-sm border border-red-500/50"
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* STATE: REVIEW */}
        {!store.isLive && store.videoUrl && (
          <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 justify-center items-center">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <video
                src={store.videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => store.setVideoUrl(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCcw size={18} /> New
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                <Download size={18} /> Save Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
