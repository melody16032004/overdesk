import { useState, useEffect, useRef } from "react";
import Peer, { MediaConnection, DataConnection } from "peerjs";
import {
  Cast,
  Loader2,
  Monitor,
  Video,
  Smartphone,
  RefreshCw,
  Camera,
  FlipHorizontal,
  RotateCw,
} from "lucide-react";

export const MobileMirror = () => {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "streaming" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [streamType, setStreamType] = useState<"screen" | "camera" | null>(
    null
  );
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  const [isSwitching, setIsSwitching] = useState(false);
  const [isFlash, setIsFlash] = useState(false);

  // Transform States (Giao diện)
  const [rotation, setRotation] = useState(0);
  const [isMirrored, setIsMirrored] = useState(false);

  // 👇 QUAN TRỌNG: Dùng Ref để lưu trạng thái mới nhất cho hàm captureFrame truy cập
  const rotationRef = useRef(0);
  const mirrorRef = useRef(false);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostId = params.get("hostId");
    if (!hostId) {
      setStatus("error");
      setErrorMsg("Thiếu Host ID");
      return;
    }
    const peer = new Peer();
    peerRef.current = peer;
    peer.on("open", () => setStatus("idle"));
    peer.on("error", (err) => {
      console.error(err);
      setStatus("idle");
    });

    window.addEventListener("beforeunload", stopSharing);
    return () => {
      window.removeEventListener("beforeunload", stopSharing);
      stopSharing();
    };
  }, []);

  // Sync Transform: Cập nhật cả State (để render UI) và Ref (để logic chụp ảnh dùng)
  const updateTransform = (newRotation: number, newMirror: boolean) => {
    setRotation(newRotation);
    setIsMirrored(newMirror);

    // Cập nhật vào hộp Ref ngay lập tức
    rotationRef.current = newRotation;
    mirrorRef.current = newMirror;

    if (connRef.current && connRef.current.open) {
      connRef.current.send({
        type: "transform",
        rotate: newRotation,
        flip: newMirror,
      });
    }
  };

  const handleRotate = () => updateTransform((rotation + 90) % 360, isMirrored);
  const handleFlip = () => updateTransform(rotation, !isMirrored);

  // --- HÀM CHỤP ẢNH (Dùng Ref thay vì State) ---
  const captureFrame = () => {
    if (!hiddenVideoRef.current || !connRef.current) return;

    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 200);

    const video = hiddenVideoRef.current;
    if (video.readyState < 2) return;

    // 👇 Lấy giá trị từ Ref để đảm bảo luôn mới nhất
    const currentRotation = rotationRef.current;
    const currentMirror = mirrorRef.current;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Đặt kích thước Canvas
    if (currentRotation === 90 || currentRotation === 270) {
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 2. Transform Matrix
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((currentRotation * Math.PI) / 180);
    if (currentMirror) {
      ctx.scale(-1, 1);
    }

    // 3. Vẽ
    ctx.drawImage(
      video,
      -video.videoWidth / 2,
      -video.videoHeight / 2,
      video.videoWidth,
      video.videoHeight
    );

    canvas.toBlob((blob) => {
      if (blob) {
        connRef.current?.send({
          type: "photo",
          file: blob,
          name: `photo_${Date.now()}.png`,
        });
      }
    }, "image/png");
  };

  const getMediaStream = async (
    type: "screen" | "camera",
    mode: "user" | "environment"
  ) => {
    if (type === "screen") {
      if (!navigator.mediaDevices.getDisplayMedia)
        throw new Error("Không hỗ trợ quay màn hình.");
      return await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });
    } else {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: false,
      });
    }
  };

  const startStream = async (type: "screen" | "camera") => {
    const params = new URLSearchParams(window.location.search);
    const hostId = params.get("hostId");
    if (!hostId || !peerRef.current) return;

    try {
      const mode = "environment";
      setFacingMode(mode);

      // Reset transform khi bắt đầu
      setRotation(0);
      setIsMirrored(false);
      rotationRef.current = 0;
      mirrorRef.current = false;

      const stream = await getMediaStream(type, mode);
      streamRef.current = stream;
      setStreamType(type);

      stream.getVideoTracks()[0].onended = () => {
        if (!isSwitching) stopSharing();
      };

      setStatus("connecting");
      const call = peerRef.current.call(hostId, stream);
      callRef.current = call;

      const conn = peerRef.current.connect(hostId);
      connRef.current = conn;

      conn.on("open", () => {
        conn.send({ type: "transform", rotate: 0, flip: false });
      });

      conn.on("data", (data: any) => {
        if (data && data.type === "take-photo") captureFrame();
        if (data && data.type === "stop") stopSharing();
      });

      conn.on("close", () => stopSharing());
      call.on("close", () => stopSharing());
      call.on("error", () => {
        setStatus("error");
        setErrorMsg("Lỗi P2P");
      });

      setTimeout(() => setStatus("streaming"), 1000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const switchCamera = async () => {
    if (streamType !== "camera" || status !== "streaming" || isSwitching)
      return;
    setIsSwitching(true);

    const newMode = facingMode === "environment" ? "user" : "environment";

    try {
      const newStream = await getMediaStream("camera", newMode);
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((t) => {
          t.onended = null;
          t.stop();
        });
      }

      if (callRef.current && callRef.current.peerConnection) {
        const sender = callRef.current.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        } else {
          throw new Error("Lost connection track");
        }
      }

      streamRef.current = newStream;
      setFacingMode(newMode);

      // Cập nhật lại video ẩn
      if (hiddenVideoRef.current) hiddenVideoRef.current.srcObject = newStream;

      newVideoTrack.onended = () => stopSharing();
    } catch (e) {
      console.error("Switch error:", e);
      stopSharing();
    } finally {
      setIsSwitching(false);
    }
  };

  const stopSharing = () => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: "closing" });
    }
    setTimeout(() => {
      if (connRef.current) connRef.current.close();
      if (callRef.current) callRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.onended = null;
          t.stop();
        });
        streamRef.current = null;
      }
      setStatus("idle");
      setStreamType(null);
      setIsSwitching(false);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div
        className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 ${
          isFlash ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      <video
        // ref={hiddenVideoRef}
        ref={(el) => {
          hiddenVideoRef.current = el;
          if (el && streamRef.current) el.srcObject = streamRef.current;
        }}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 10,
          height: 10,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center border-b border-white/10 bg-zinc-900/50 backdrop-blur-md z-10">
        <h1 className="font-bold text-orange-500 tracking-wider flex items-center gap-2">
          <Cast size={20} /> MIRROR CAST
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md text-center pt-16">
        {status === "idle" && (
          <div className="animate-in zoom-in w-full">
            <div className="mb-8 p-6 bg-zinc-900 rounded-2xl border border-white/10">
              <Smartphone size={32} className="text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold">Sẵn sàng phát</h3>
            </div>
            <button
              onClick={() => startStream("camera")}
              className="w-full py-4 bg-orange-600 rounded-xl font-bold flex items-center justify-center gap-3"
            >
              <Video size={24} /> CHIA SẺ CAMERA
            </button>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 size={64} className="animate-spin text-orange-500 mb-4" />
            <p className="text-xl font-bold">Đang kết nối...</p>
          </div>
        )}

        {status === "streaming" && (
          <div className="animate-in fade-in w-full h-full flex flex-col justify-center">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="w-48 h-48 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-green-500/30 shadow-2xl overflow-hidden relative">
                  <div
                    style={{
                      transform: `rotate(${rotation}deg) scaleX(${
                        isMirrored ? -1 : 1
                      })`,
                      transition: "transform 0.3s",
                    }}
                  >
                    {streamType === "camera" ? (
                      <Camera size={80} className="text-green-500" />
                    ) : (
                      <Monitor size={80} className="text-green-500" />
                    )}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">ĐANG PHÁT</h2>
            </div>

            <div className="pb-8 w-full flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleFlip}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isMirrored
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <FlipHorizontal size={20} /> {isMirrored ? "ĐÃ LẬT" : "LẬT"}
                </button>
                <button
                  onClick={handleRotate}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <RotateCw size={20} /> {rotation}°
                </button>
              </div>
              {streamType === "camera" && (
                <button
                  onClick={switchCamera}
                  disabled={isSwitching}
                  className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSwitching ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <RefreshCw
                      size={22}
                      className={
                        facingMode === "user"
                          ? "text-blue-400"
                          : "text-zinc-400"
                      }
                    />
                  )}
                  <span>ĐỔI CAMERA</span>
                </button>
              )}
              <button
                onClick={stopSharing}
                className="w-full py-4 bg-red-500/10 text-red-500 border-2 border-red-500/50 rounded-2xl font-bold"
              >
                DỪNG PHÁT
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center w-full bg-red-500/5 p-8 rounded-3xl border border-red-500/20">
            <p className="text-red-400 font-bold mb-4">{errorMsg}</p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
