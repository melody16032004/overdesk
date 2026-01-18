import React, { useState, useEffect, useRef } from "react";
import Peer, { MediaConnection, DataConnection } from "peerjs";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { QRCodeSVG } from "qrcode.react";
import {
  Cast,
  Maximize,
  Minimize,
  Power,
  Smartphone,
  Settings,
  Globe,
  X,
  RefreshCw,
  VideoOff,
  Camera,
  ScanFace,
  UserCheck,
  UserPlus,
  Trash2,
  Clock,
  Users,
  Target,
  Aperture,
  TerminalSquare,
  Check,
  Copy,
  FileText,
} from "lucide-react";

// Import thư viện face-api
import * as faceapi from "@vladmandic/face-api";

const RemoteVideo = ({
  stream,
  transform,
  onAutoCapture,
}: {
  stream: MediaStream | null;
  transform: { rotate: number; flip: boolean };
  onAutoCapture: (blob: Blob, name: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCaptureTimeRef = useRef<number>(0);

  // UI State
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [statusText, setStatusText] = useState("Initializing...");
  const [countDown, setCountDown] = useState(0);

  // Controls
  const [enableScan, setEnableScan] = useState(false);
  const [enableIdentify, setEnableIdentify] = useState(false);

  // Data
  const [labeledDescriptors, setLabeledDescriptors] = useState<any[]>([]);
  const faceMatcherRef = useRef<any>(null);

  // List & Hover
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null);

  // 1. Tải Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = `${window.location.origin}/models`;
      try {
        setStatusText("Loading Backend...");
        await (faceapi.tf as any).setBackend("webgl");
        await (faceapi.tf as any).ready();

        setStatusText("Loading Models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const savedFaces = localStorage.getItem("known_faces");
        if (savedFaces) {
          const parsed = JSON.parse(savedFaces);
          const deserialized = parsed.map((item: any) => {
            return new faceapi.LabeledFaceDescriptors(
              item.label,
              item.descriptors.map((d: any) => new Float32Array(d))
            );
          });
          setLabeledDescriptors(deserialized);
        }

        setIsModelsLoaded(true);
        setStatusText("AI Ready");
      } catch (err: any) {
        console.error(err);
        setStatusText("Error Loading AI");
      }
    };
    setTimeout(loadModels, 1000);
  }, []);

  // 2. Cập nhật FaceMatcher
  useEffect(() => {
    if (labeledDescriptors.length > 0) {
      faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
      const serialized = labeledDescriptors.map((ld) => ({
        label: ld.label,
        descriptors: ld.descriptors.map((d: any) => Array.from(d)),
      }));
      localStorage.setItem("known_faces", JSON.stringify(serialized));
    }
  }, [labeledDescriptors]);

  // 3. Đồng hồ đếm ngược
  useEffect(() => {
    if (!enableScan) {
      setCountDown(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastCaptureTimeRef.current;
      const remaining = 60000 - elapsed;
      setCountDown(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [enableScan]);

  // 4. Setup Video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => console.error(e));
      };
    }
  }, [stream]);

  // --- HÀM CHỤP GÓC RỘNG (Manual Click) ---
  const captureWideFace = (
    video: HTMLVideoElement,
    detection: any,
    label: string
  ) => {
    const { box } = detection.detection ? detection.detection : detection;
    const expansionFactor = 2.5;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    let newWidth = box.width * expansionFactor;
    let newHeight = box.height * expansionFactor;

    let newX = centerX - newWidth / 2;
    let newY = centerY - newHeight / 2;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newWidth > video.videoWidth) newWidth = video.videoWidth - newX;
    if (newY + newHeight > video.videoHeight)
      newHeight = video.videoHeight - newY;

    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      video,
      newX,
      newY,
      newWidth,
      newHeight,
      0,
      0,
      newWidth,
      newHeight
    );

    // Vẽ lại khung lên ảnh crop (Tính lại tọa độ tương đối)
    const relativeBox = {
      x: box.x - newX,
      y: box.y - newY,
      width: box.width,
      height: box.height,
    };
    const drawBox = new faceapi.draw.DrawBox(relativeBox, {
      label: label,
      boxColor: "#00ff00",
    });
    drawBox.draw(canvas);

    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.font = "16px Arial";
    ctx.fillText(`${label} - Wide Shot`, 10, 25);

    canvas.toBlob((blob) => {
      if (blob)
        onAutoCapture(
          blob,
          `${label.replace(/\s/g, "_")}_WIDE_${Date.now()}.png`
        );
    }, "image/png");
  };

  // --- HÀM CHỤP AUTO (ĐÃ FIX: VẼ LẠI KHUNG) ---
  const captureAutoAll = (
    video: HTMLVideoElement,
    dims: any,
    detections: any[]
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // 1. Vẽ nền video
      ctx.drawImage(video, 0, 0);

      // 2. Vẽ lại toàn bộ khung (Box) lên ảnh
      detections.forEach((result: any, index: number) => {
        const box = result.detection ? result.detection.box : result.box;
        let label = `ID: ${index + 1}`;
        let color = "#00ff00";

        if (enableIdentify && result.descriptor && faceMatcherRef.current) {
          const bestMatch = faceMatcherRef.current.findBestMatch(
            result.descriptor
          );
          label = bestMatch.toString();
          color = bestMatch.label === "unknown" ? "#ef4444" : "#22c55e";
        }

        const drawBox = new faceapi.draw.DrawBox(box, {
          label: label,
          boxColor: color,
          lineWidth: 2,
        });
        drawBox.draw(canvas);
      });

      // 3. Watermark
      ctx.fillStyle = "#00ff00";
      ctx.font = "20px Consolas";
      ctx.fillText(
        `AUTO-CAPTURE: ${new Date().toLocaleTimeString()} - Found: ${
          detections.length
        }`,
        20,
        dims.height - 20
      );

      canvas.toBlob(
        (blob) => blob && onAutoCapture(blob, `AUTO_SCAN_${Date.now()}.png`)
      );
    }
  };

  // 5. VÒNG LẶP AI CHÍNH
  useEffect(() => {
    if (!isModelsLoaded || !stream) return;

    const intervalId = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.paused || video.ended) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      if (
        canvas.width !== displaySize.width ||
        canvas.height !== displaySize.height
      ) {
        faceapi.matchDimensions(canvas, displaySize);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!enableScan && !enableIdentify) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDetectedFaces([]);
        return;
      }

      try {
        let detections;
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.3,
        });

        if (enableIdentify) {
          detections = await faceapi
            .detectAllFaces(video, options)
            .withFaceLandmarks()
            .withFaceDescriptors();
        } else {
          detections = await faceapi.detectAllFaces(video, options);
        }

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const facesData = resizedDetections.map((res: any, index: number) => {
          let label = `Face #${index + 1}`;
          let score = Math.round(
            res.detection ? res.detection.score * 100 : res.score * 100
          );

          if (enableIdentify && res.descriptor && faceMatcherRef.current) {
            const bestMatch = faceMatcherRef.current.findBestMatch(
              res.descriptor
            );
            if (bestMatch.label !== "unknown")
              label = bestMatch.toString(false);
          }
          return { index, label, score, rawData: res };
        });
        setDetectedFaces(facesData);

        // --- VẼ CANVAS MÀN HÌNH ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach((result: any, index: number) => {
          if (hoveredFaceIndex !== null && hoveredFaceIndex !== index) return;

          const box = result.detection ? result.detection.box : result.box;
          let label = `ID: ${index + 1}`;
          let color = "#00ff00";

          if (enableIdentify && result.descriptor && faceMatcherRef.current) {
            const bestMatch = faceMatcherRef.current.findBestMatch(
              result.descriptor
            );
            label = bestMatch.toString();
            color = bestMatch.label === "unknown" ? "#ef4444" : "#22c55e";
          }

          if (hoveredFaceIndex === index) {
            color = "#ffff00";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "yellow";
          } else {
            ctx.shadowBlur = 0;
          }

          const drawBox = new faceapi.draw.DrawBox(box, {
            label: label,
            boxColor: color,
            lineWidth: hoveredFaceIndex === index ? 4 : 2,
          });
          drawBox.draw(canvas);
          ctx.shadowBlur = 0;
        });

        // Logic Auto Scan
        if (enableScan && resizedDetections.length > 0) {
          const now = Date.now();
          if (now - lastCaptureTimeRef.current > 60000) {
            lastCaptureTimeRef.current = now;
            setCountDown(60);
            // 👇 Gửi danh sách detections vào để vẽ lại khung
            captureAutoAll(video, displaySize, resizedDetections);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [
    isModelsLoaded,
    stream,
    enableScan,
    enableIdentify,
    labeledDescriptors,
    hoveredFaceIndex,
  ]);

  const handleAddFace = async () => {
    if (!videoRef.current) return;
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.4,
    });
    const detection = await faceapi
      .detectSingleFace(videoRef.current, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const name = prompt("Tên:");
      if (name) {
        const newDesc = new faceapi.LabeledFaceDescriptors(name, [
          detection.descriptor,
        ]);
        setLabeledDescriptors((prev) => [...prev, newDesc]);
      }
    }
  };

  if (!stream) return <div className="text-zinc-500">No Signal</div>;

  const commonStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) rotate(${transform.rotate}deg) scaleX(${
      transform.flip ? -1 : 1
    })`,
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <video ref={videoRef} style={commonStyle} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={commonStyle} />
      </div>

      {/* BẢNG DANH SÁCH (RIGHT PANEL) */}
      {(enableScan || enableIdentify) && isModelsLoaded && (
        <div className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-4 z-30 shadow-2xl animate-in slide-in-from-right">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <Users size={18} />
              <span>Found: {detectedFaces.length}</span>
            </div>
            {enableScan && (
              <div
                className={`flex items-center gap-1 text-xs font-mono font-bold ${
                  countDown === 0
                    ? "text-green-400 animate-pulse"
                    : "text-yellow-400"
                }`}
              >
                <Clock size={12} />{" "}
                {countDown === 0 ? "READY" : `${countDown}s`}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {detectedFaces.length === 0 ? (
              <div className="text-zinc-500 text-xs text-center py-4">
                No faces detected
              </div>
            ) : (
              detectedFaces.map((face) => (
                <div
                  key={face.index}
                  onMouseEnter={() => setHoveredFaceIndex(face.index)}
                  onMouseLeave={() => setHoveredFaceIndex(null)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-default ${
                    hoveredFaceIndex === face.index
                      ? "bg-white/10 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-full ${
                        hoveredFaceIndex === face.index
                          ? "bg-yellow-500 text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Target size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm font-bold truncate ${
                          hoveredFaceIndex === face.index
                            ? "text-yellow-500"
                            : "text-white"
                        }`}
                      >
                        {face.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Confidence: {face.score}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current)
                        captureWideFace(
                          videoRef.current,
                          face.rawData,
                          face.label
                        );
                    }}
                    className="p-2 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded-lg transition-colors"
                    title="Chụp góc rộng"
                  >
                    <Aperture size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isModelsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <span className="text-white animate-pulse">{statusText}</span>
        </div>
      )}

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 z-20">
        <button
          onClick={() => setEnableScan(!enableScan)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            enableScan ? "bg-green-600" : "bg-white/10"
          }`}
        >
          <ScanFace size={18} /> SCAN
        </button>
        <div className="w-[1px] bg-white/20 my-1"></div>
        <button
          onClick={() => setEnableIdentify(!enableIdentify)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            enableIdentify ? "bg-blue-600" : "bg-white/10"
          }`}
        >
          <UserCheck size={18} /> DETECT
        </button>
        {enableIdentify && (
          <>
            <div className="w-[1px] bg-white/20 my-1"></div>
            <button
              onClick={handleAddFace}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-xl"
              title="Thêm khuôn mặt"
            >
              <UserPlus size={18} />
            </button>
            {labeledDescriptors.length > 0 && (
              <button
                onClick={() => {
                  setLabeledDescriptors([]);
                  localStorage.removeItem("known_faces");
                }}
                className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl"
              >
                <Trash2 size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- HELPER COMPONENT: COPY COMMAND ---
const CommandSnippet = ({
  label,
  command,
}: {
  label: string;
  command: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1.5">
          <TerminalSquare size={10} /> {label}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-1 hover:text-white text-zinc-500 transition-colors"
        >
          {copied ? (
            <Check size={12} className="text-green-500" />
          ) : (
            <Copy size={12} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="bg-black/50 p-2 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-300 break-all leading-relaxed hover:bg-black/80 transition-colors select-all">
        {command}
      </div>
    </div>
  );
};

// --- (Phần export ScreenMirrorModule giữ nguyên không đổi) ---
export const ScreenMirrorModule = () => {
  // ... Copy nội dung từ các bài trước y hệt ...
  // ... Chỉ cần thay thế Component RemoteVideo ở trên ...
  const [myId, setMyId] = useState<string>("");
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dataConn, setDataConn] = useState<DataConnection | null>(null);
  const [videoTransform, setVideoTransform] = useState({
    rotate: 0,
    flip: false,
  });
  const [detectStatus, setDetectStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const containerRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    setCustomDomain(`http://${hostname}:${port}`);
    const savedDomain = localStorage.getItem("overdesk_mirror_domain");
    if (savedDomain) setCustomDomain(savedDomain);
    return () => stopServer();
  }, []);

  // --- HÀM TỰ ĐỘNG ĐỌC FILE LOG ---
  const autoDetectFromLog = async () => {
    setDetectStatus("idle");
    try {
      // Đọc file log tại đường dẫn cụ thể
      const logContent = await readTextFile("C:\\Users\\PC\\tunnel.log");

      // Regex tìm link Cloudflare
      const regex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;
      const match = logContent.match(regex);

      if (match && match[0]) {
        setCustomDomain(match[0]);
        setDetectStatus("success");
        // Tự động lưu luôn
        localStorage.setItem("overdesk_mirror_domain", match[0]);
        // Tắt thông báo success sau 2s
        setTimeout(() => setDetectStatus("idle"), 2000);
      } else {
        console.warn("Không tìm thấy link trong file log");
        setDetectStatus("error");
      }
    } catch (error) {
      console.error("Lỗi đọc file:", error);
      setDetectStatus("error");
    }
  };

  const startServer = () => {
    setIsServerRunning(true);
    const peer = new Peer({
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });
    peerRef.current = peer;
    peer.on("open", (id) => setMyId(id));
    peer.on("call", (call) => {
      callRef.current = call;
      call.answer();
      call.on("stream", (stream) => {
        setIsConnected(true);
        setRemoteStream(stream);
      });
      call.on("close", () => {
        handleRemoteDisconnect();
      });
    });
    peer.on("connection", (conn) => {
      setDataConn(conn);
      conn.on("data", (data: any) => {
        if (data) {
          if (data.type === "photo") {
            let finalBlob: Blob =
              data.file instanceof ArrayBuffer || data.file.buffer
                ? new Blob([data.file], { type: "image/png" })
                : data.file instanceof Blob
                ? data.file
                : new Blob([data.file], { type: "image/png" });
            downloadFile(finalBlob, data.name);
          }
          if (data.type === "transform") {
            setVideoTransform({ rotate: data.rotate, flip: data.flip });
          }
          if (data.type === "closing") {
            handleRemoteDisconnect();
          }
        }
      });
      conn.on("close", () => handleRemoteDisconnect());
    });
  };

  const handleRemoteDisconnect = () => {
    setIsConnected(false);
    setRemoteStream(null);
    setDataConn(null);
    setVideoTransform({ rotate: 0, flip: false });
  };

  const stopServer = () => {
    handleRemoteDisconnect();
    setIsServerRunning(false);
    setMyId("");
    if (callRef.current) callRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
  };

  const triggerCapture = () => {
    if (dataConn) dataConn.send({ type: "take-photo" });
  };

  const downloadFile = (blob: Blob, name: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const reloadStream = () => {
    if (remoteStream) {
      const newStream = new MediaStream(remoteStream.getTracks());
      setRemoteStream(null);
      setTimeout(() => setRemoteStream(newStream), 100);
    }
  };
  const confirmDomain = () => {
    setIsConfigOpen(false);
    localStorage.setItem("overdesk_mirror_domain", customDomain);
  };
  const cleanDomain = customDomain.replace(/\/$/, "");
  const connectUrl = `${cleanDomain}/mobile-mirror?hostId=${myId}`;

  return (
    <div className="h-full flex flex-col p-6 bg-zinc-950 text-slate-200 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6 shrink-0 z-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Cast className="text-orange-500" /> Screen Mirror
        </h2>
        {isServerRunning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-orange-500"
              }`}
            ></div>
            <span className="text-xs font-bold text-zinc-400">
              {isConnected ? `LIVE` : "WAITING"}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {!isServerRunning ? (
          <div className="text-center bg-zinc-900/50 p-10 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-zinc-700">
              <Smartphone size={40} className="text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Connect your mobile device
            </h3>
            <button
              onClick={startServer}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition-all shadow-lg"
            >
              <Power size={18} /> START SERVER
            </button>
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center animate-in zoom-in w-full max-w-sm">
            {isConfigOpen ? (
              <div className="w-full bg-zinc-900 p-6 rounded-2xl border border-white/10 shadow-2xl mb-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-blue-500" /> Connection URL
                </h3>

                {/* --- KHU VỰC NHẬP URL + NÚT AUTO DETECT --- */}
                <div className="flex gap-2 mb-4">
                  <input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                  <button
                    onClick={autoDetectFromLog}
                    className={`px-3 rounded-lg border flex items-center justify-center transition-all ${
                      detectStatus === "success"
                        ? "bg-green-500/20 border-green-500 text-green-500"
                        : detectStatus === "error"
                        ? "bg-red-500/20 border-red-500 text-red-500"
                        : "bg-white/5 border-white/20 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Read from tunnel.log"
                  >
                    {detectStatus === "success" ? (
                      <Check size={16} />
                    ) : detectStatus === "error" ? (
                      <X size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </button>
                </div>
                {/* ----------------------------------------- */}

                <button
                  onClick={confirmDomain}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm mb-6"
                >
                  UPDATE QR
                </button>

                <div className="border-t border-white/10 pt-4">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-wider">
                    PowerShell Helpers (Manual Run)
                  </div>
                  <CommandSnippet
                    label="Start Tunnel (Hidden)"
                    command='Remove-Item -Path ".\tunnel.log" -ErrorAction SilentlyContinue; Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel --url http://127.0.0.1:1420 --logfile .\tunnel.log" -WindowStyle Hidden'
                  />
                  <CommandSnippet
                    label="Stop Tunnel"
                    command='Stop-Process -Name "cloudflared" -Force'
                  />
                </div>
              </div>
            ) : (
              <div className="relative group mb-6">
                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                  <QRCodeSVG value={connectUrl} size={220} />
                </div>
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="absolute -top-3 -right-3 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Settings size={16} />
                </button>
              </div>
            )}
            {!isConfigOpen && (
              <div className="text-xs font-mono bg-black/50 px-4 py-2 rounded-lg border border-white/10 text-zinc-400 break-all text-center max-w-full">
                {connectUrl}
              </div>
            )}
            <button
              onClick={stopServer}
              className="mt-8 text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group"
          >
            <RemoteVideo
              stream={remoteStream}
              transform={videoTransform}
              onAutoCapture={downloadFile}
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 flex-col gap-2">
                <VideoOff size={40} />
                <span>Waiting...</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-6 z-20">
              {dataConn && (
                <button
                  onClick={triggerCapture}
                  className="p-4 bg-white hover:bg-gray-200 text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-90"
                  title="Take Photo Manual"
                >
                  <Camera size={28} />
                </button>
              )}
              <div className="flex gap-4 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
                <button
                  onClick={reloadStream}
                  className="p-3 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-all"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-3 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-all"
                >
                  {isFullscreen ? (
                    <Minimize size={20} />
                  ) : (
                    <Maximize size={20} />
                  )}
                </button>
                <button
                  onClick={handleRemoteDisconnect}
                  className="p-3 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-all"
                  title="Reset View"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={stopServer}
                  className="p-3 hover:bg-red-500/20 rounded-full text-red-400 hover:text-red-500 transition-all"
                >
                  <Power size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
